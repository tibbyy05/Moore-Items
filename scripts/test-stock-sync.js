/**
 * scripts/test-stock-sync.js
 *
 * Run the per-variant stock sync logic against a single product by slug.
 * Fetches CJ variant-level inventory and writes correct US stock to each
 * active variant in Supabase.
 *
 * Usage:  node scripts/test-stock-sync.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SLUG = 'vintage-court-lantern-sleeves-large-lapel-jacket-ybqy';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CJ_BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';

// ── CJ helpers ───────────────────────────────────────────────────
async function cjGetToken() {
  const { data: rows } = await supabase
    .from('mi_settings')
    .select('key, value')
    .in('key', ['cj_access_token', 'cj_token_expires_at']);

  if (rows && rows.length === 2) {
    const tokenRow = rows.find((r) => r.key === 'cj_access_token');
    const expiryRow = rows.find((r) => r.key === 'cj_token_expires_at');
    const dbExpiry = Number(expiryRow?.value || 0);
    if (tokenRow?.value && Date.now() < dbExpiry - 5 * 60 * 1000) {
      console.log('(using cached CJ token from Supabase)');
      return tokenRow.value;
    }
  }

  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }),
  });
  const json = await res.json();
  if (json.code !== 200 && json.code !== 0) {
    throw new Error(`CJ Auth failed: ${json.message}`);
  }
  return json.data.accessToken;
}

async function cjGet(token, endpoint) {
  const res = await fetch(`${CJ_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  });
  return res.json();
}

function pad(str, len) {
  return String(str).padEnd(len);
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n── Per-variant stock sync test: ${SLUG} ──\n`);

  // 1. Look up product
  const { data: product, error: prodErr } = await supabase
    .from('mi_products')
    .select('id, name, cj_pid, status')
    .eq('slug', SLUG)
    .single();

  if (prodErr || !product) {
    console.error('Product not found:', prodErr?.message || 'no rows');
    process.exit(1);
  }

  console.log(`Product:  ${product.name}`);
  console.log(`CJ PID:   ${product.cj_pid}`);
  console.log(`Status:   ${product.status}\n`);

  // 2. CJ auth + stock fetch
  const token = await cjGetToken();
  const stockRes = await cjGet(token, `/product/stock/getInventoryByPid?pid=${product.cj_pid}`);

  if (stockRes.code !== 200 && stockRes.code !== 0) {
    console.error('CJ stock query failed:', stockRes.message);
    process.exit(1);
  }

  // 3. Build variant stock map from variantInventories
  const variantStockMap = new Map();
  const variantInvs = stockRes.data?.variantInventories || [];
  for (const vi of variantInvs) {
    const entry = { us: 0, cn: 0 };
    for (const loc of (vi.inventory || [])) {
      if (loc.countryCode === 'US') entry.us += loc.totalInventory || 0;
      else if (loc.countryCode === 'CN') entry.cn += loc.totalInventory || 0;
    }
    variantStockMap.set(vi.vid, entry);
  }

  console.log(`CJ variant stock entries: ${variantStockMap.size}\n`);

  // 4. Fetch active DB variants
  const { data: dbVariants, error: varErr } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, color, size, stock_count')
    .eq('product_id', product.id)
    .eq('is_active', true)
    .order('color', { ascending: true })
    .order('size', { ascending: true });

  if (varErr) {
    console.error('Failed to fetch variants:', varErr.message);
    process.exit(1);
  }

  console.log(`Active DB variants: ${dbVariants.length}\n`);

  // 5. Compare and update
  const SEP = '─'.repeat(80);
  console.log(SEP);
  console.log(
    pad('color', 14) +
    pad('size', 8) +
    pad('DB stock', 10) +
    pad('CJ US', 8) +
    'action'
  );
  console.log(SEP);

  let updated = 0;
  let unchanged = 0;

  for (const v of dbVariants) {
    const cjStock = variantStockMap.get(v.cj_vid);
    const usStock = cjStock ? cjStock.us : 0;
    const dbStock = v.stock_count ?? 0;

    if (dbStock !== usStock) {
      const { error: updateErr } = await supabase
        .from('mi_product_variants')
        .update({ stock_count: usStock })
        .eq('id', v.id);

      if (updateErr) {
        console.log(
          pad(v.color || '-', 14) +
          pad(v.size || '-', 8) +
          pad(String(dbStock), 10) +
          pad(String(usStock), 8) +
          `ERROR: ${updateErr.message}`
        );
      } else {
        console.log(
          pad(v.color || '-', 14) +
          pad(v.size || '-', 8) +
          pad(String(dbStock), 10) +
          pad(String(usStock), 8) +
          `updated (${dbStock} → ${usStock})`
        );
        updated++;
      }
    } else {
      console.log(
        pad(v.color || '-', 14) +
        pad(v.size || '-', 8) +
        pad(String(dbStock), 10) +
        pad(String(usStock), 8) +
        'unchanged'
      );
      unchanged++;
    }
  }

  console.log(SEP);
  console.log(`\n── Summary ──`);
  console.log(`  Updated:   ${updated}`);
  console.log(`  Unchanged: ${unchanged}`);
  console.log(`  Total:     ${dbVariants.length}`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
