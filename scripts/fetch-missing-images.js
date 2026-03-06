/**
 * Fetch Missing Images
 * Updates the images column for active products that only have 0-1 images.
 * Fetches full image sets from CJ detail API (productImageSet + variant images).
 * Does NOT touch description, category_id, variants, or cj_raw_data.
 *
 * Usage:
 *   node scripts/fetch-missing-images.js --dry-run          (preview all)
 *   node scripts/fetch-missing-images.js --dry-run 0 50     (preview 50 from offset 0)
 *   node scripts/fetch-missing-images.js 0 50               (update 50 from offset 0)
 *   node scripts/fetch-missing-images.js all                 (update all)
 */

const fs = require('fs');
const path = require('path');

// --- Load .env.local ---
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
});

const CJ_API_KEY = env.CJ_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const CJ_BASE = 'https://developers.cjdropshipping.com/api2.0/v1';

if (!CJ_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars: CJ_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// --- Parse CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const positional = args.filter(a => a !== '--dry-run');

let mode = 'slice'; // 'slice' or 'all'
let offset = 0;
let limit = 50;

if (positional[0] === 'all') {
  mode = 'all';
} else if (positional.length >= 2) {
  offset = parseInt(positional[0], 10);
  limit = parseInt(positional[1], 10);
  if (!Number.isFinite(offset) || !Number.isFinite(limit) || offset < 0 || limit <= 0) {
    console.log('Usage: node scripts/fetch-missing-images.js [--dry-run] [offset limit | all]');
    process.exit(0);
  }
} else if (positional.length === 1) {
  console.log('Usage: node scripts/fetch-missing-images.js [--dry-run] [offset limit | all]');
  process.exit(0);
}

// --- Supabase helpers ---
async function supabaseGet(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, id, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`PATCH failed (${res.status}): ${await res.text()}`);
}

// --- CJ helpers ---
async function getCJToken() {
  // Try cached token from Supabase mi_settings (two rows: cj_access_token + cj_token_expires_at)
  try {
    const rows = await supabaseGet(
      'mi_settings',
      'select=key,value&key=in.(cj_access_token,cj_token_expires_at)'
    );
    if (rows.length === 2) {
      const tokenRow = rows.find(r => r.key === 'cj_access_token');
      const expiryRow = rows.find(r => r.key === 'cj_token_expires_at');
      const token = tokenRow?.value;
      const expiresAt = Number(expiryRow?.value || 0);
      if (token && expiresAt > Date.now() + 5 * 60 * 1000) {
        const hoursLeft = Math.round((expiresAt - Date.now()) / 3600000);
        console.log(`Using cached CJ token from Supabase (expires in ${hoursLeft}h)`);
        return token;
      }
    }
  } catch {
    // No cached token, fetch fresh
  }

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`CJ auth returned non-JSON (${res.status}): ${(await res.text()).slice(0, 200)}`);
  }
  const data = await res.json();
  if (!data.data?.accessToken) throw new Error(`CJ auth failed: ${JSON.stringify(data)}`);
  return data.data.accessToken;
}

async function getCJDetail(token, pid) {
  const res = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
    headers: { 'CJ-Access-Token': token },
  });
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    throw new Error(`CJ detail returned non-JSON (${res.status})`);
  }
  const data = await res.json();
  // Rate limited — wait and retry once
  if (data?.code === 1600200) {
    console.log('  Rate limited, waiting 10s and retrying...');
    await delay(10000);
    const retryRes = await fetch(`${CJ_BASE}/product/query?pid=${pid}`, {
      headers: { 'CJ-Access-Token': token },
    });
    return retryRes.json();
  }
  return data;
}

function extractImages(detail, fallback) {
  const payload = detail?.data ? detail.data : detail;
  let images = [];

  if (Array.isArray(payload?.productImageSet)) {
    images = [...payload.productImageSet];
  } else if (typeof payload?.productImage === 'string') {
    try {
      const parsed = JSON.parse(payload.productImage);
      images = Array.isArray(parsed) ? parsed : [payload.productImage];
    } catch {
      images = [payload.productImage];
    }
  }

  if (Array.isArray(payload?.variants)) {
    for (const v of payload.variants) {
      if (v?.variantImage && !images.includes(v.variantImage)) {
        images.push(v.variantImage);
      }
    }
  }

  if (fallback && !images.includes(fallback)) {
    images.push(fallback);
  }

  return images.filter(url => typeof url === 'string' && url.startsWith('http'));
}

// --- Main ---
async function run() {
  console.log(`=== Fetch Missing Images ===`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'APPLY'}${mode === 'all' ? ' (all)' : ` (offset ${offset}, limit ${limit})`}\n`);

  // Fetch all active products with 0-1 images (paginate past Supabase 1000 row limit)
  let allProducts = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const batch = await supabaseGet(
      'mi_products',
      `select=id,cj_pid,name,images&status=eq.active&order=name.asc&offset=${page * pageSize}&limit=${pageSize}`
    );
    if (!batch || batch.length === 0) break;
    allProducts.push(...batch);
    if (batch.length < pageSize) break;
    page++;
  }

  const targets = allProducts.filter(p => {
    const imgs = Array.isArray(p.images) ? p.images : [];
    return imgs.length <= 1 && p.cj_pid;
  });

  console.log(`Found ${targets.length} active products with 0-1 images\n`);
  if (targets.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  // Determine slice to process
  let slice;
  if (mode === 'all') {
    slice = targets;
  } else {
    slice = targets.slice(offset, offset + limit);
  }
  console.log(`Processing ${slice.length} products...\n`);

  // Get CJ token
  const token = await getCJToken();
  console.log('CJ token acquired\n');

  let updated = 0;
  let skipped = 0;
  let errors = 0;
  let apiCalls = 0;

  for (let i = 0; i < slice.length; i++) {
    const product = slice[i];

    if (apiCalls >= 900) {
      console.log(`\nStopping early — approaching 900 CJ API calls (used ${apiCalls})`);
      break;
    }

    try {
      await delay(3000);
      const detail = await getCJDetail(token, product.cj_pid);
      apiCalls++;

      if (detail?.code !== 200 && detail?.code !== 0) {
        throw new Error(detail?.message || `CJ error code ${detail?.code}`);
      }

      const existingCount = Array.isArray(product.images) ? product.images.length : 0;
      const existingFallback = existingCount > 0 ? product.images[0] : null;
      const newImages = extractImages(detail, existingFallback);

      if (newImages.length <= existingCount) {
        console.log(`  [${i + 1}/${slice.length}] ${product.name}: ${existingCount} → ${newImages.length} (no improvement, skipping)`);
        skipped++;
        continue;
      }

      console.log(`  [${i + 1}/${slice.length}] ${product.name}: ${existingCount} → ${newImages.length}`);

      if (!dryRun) {
        await supabasePatch('mi_products', product.id, { images: newImages });
      }
      updated++;
    } catch (err) {
      console.log(`  [${i + 1}/${slice.length}] ${product.name}: ERROR — ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no improvement): ${skipped}`);
  console.log(`Errors: ${errors}`);
  console.log(`CJ API calls used: ${apiCalls}`);

  if (dryRun) {
    console.log(`\nThis was a dry run. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\nDone! Images updated in database.`);
  }
}

run().catch(err => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
