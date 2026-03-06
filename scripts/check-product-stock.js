/**
 * scripts/check-product-stock.js
 *
 * Diagnostic: look up a product by slug, compare DB variant stock
 * against live CJ inventory data, and print a comparison table.
 *
 * Usage:  node scripts/check-product-stock.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx).trim();
  const val = trimmed.slice(idx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

const SLUG = 'vintage-court-lantern-sleeves-large-lapel-jacket-ybqy';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CJ_API_KEY = process.env.CJ_API_KEY;
const CJ_BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';

// ── Supabase ─────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── CJ helpers ───────────────────────────────────────────────────
async function cjGetToken() {
  // Try cached token from Supabase first
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

  // Fall back to fresh auth
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
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

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log(`\n── Checking product: ${SLUG} ──\n`);

  // 1. Look up product by slug
  const { data: product, error: prodErr } = await supabase
    .from('mi_products')
    .select('id, name, cj_pid, status')
    .eq('slug', SLUG)
    .single();

  if (prodErr || !product) {
    console.error('Product not found in DB:', prodErr?.message || 'no rows');
    process.exit(1);
  }

  console.log(`Product:  ${product.name}`);
  console.log(`ID:       ${product.id}`);
  console.log(`CJ PID:   ${product.cj_pid}`);
  console.log(`Status:   ${product.status}`);

  // 2. Get all DB variants
  const { data: dbVariants, error: varErr } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, color, size, stock_count, is_active')
    .eq('product_id', product.id)
    .order('color', { ascending: true })
    .order('size', { ascending: true });

  if (varErr) {
    console.error('Failed to fetch variants:', varErr.message);
    process.exit(1);
  }

  console.log(`\nDB variants: ${dbVariants.length}\n`);

  // 3. CJ: authenticate
  const token = await cjGetToken();
  console.log('CJ auth OK\n');

  // 4. CJ: get product details (for variant list)
  const cjProductRes = await cjGet(token, `/product/query?pid=${product.cj_pid}`);
  if (cjProductRes.code !== 200 && cjProductRes.code !== 0) {
    console.error('CJ product query failed:', cjProductRes.message);
    process.exit(1);
  }
  const cjProduct = cjProductRes.data;
  const cjVariants = cjProduct.variants || [];
  console.log(`CJ variants: ${cjVariants.length}`);

  // 5. CJ: get stock inventory
  await wait(3100); // rate limit
  const stockRes = await cjGet(token, `/product/stock/getInventoryByPid?pid=${product.cj_pid}`);

  // 5a. Product-level warehouse totals (summary)
  let totalCJStock = 0;
  const inventories = [];
  if (stockRes.code === 200 || stockRes.code === 0) {
    const payload = stockRes.data;
    const invList = payload?.inventories || (Array.isArray(payload) ? payload : []);
    for (const inv of invList) {
      inventories.push(inv);
      totalCJStock += inv.totalInventoryNum || 0;
    }
  } else {
    console.error('CJ stock query failed:', stockRes.message);
  }

  console.log(`\nCJ inventory by warehouse (product-level):`);
  if (inventories.length > 0) {
    for (const inv of inventories) {
      console.log(`  ${inv.countryCode}: ${inv.totalInventoryNum} units`);
    }
  } else {
    console.log('  (no inventory data)');
  }
  console.log(`  Total: ${totalCJStock}`);

  // 5b. Per-variant stock from variantInventories
  const variantStockMap = new Map(); // vid → { us, cn }
  if (stockRes.code === 200 || stockRes.code === 0) {
    const variantInvs = stockRes.data?.variantInventories || [];
    for (const vi of variantInvs) {
      const entry = { us: 0, cn: 0 };
      for (const loc of (vi.inventory || [])) {
        if (loc.countryCode === 'US') entry.us += loc.totalInventory || 0;
        else if (loc.countryCode === 'CN') entry.cn += loc.totalInventory || 0;
      }
      variantStockMap.set(vi.vid, entry);
    }
  }
  console.log(`  Variant-level stock entries: ${variantStockMap.size}\n`);

  // 6. Build CJ variant lookup by vid (from product query)
  const cjVidSet = new Set(cjVariants.map((v) => v.vid));
  const cjVidMap = new Map();
  for (const v of cjVariants) {
    const rawProp = v.variantProperty;
    const props = Array.isArray(rawProp)
      ? rawProp.map((p) => `${p.propertyName}: ${p.propertyValueName}`).join(', ')
      : typeof rawProp === 'string' ? rawProp : '';
    cjVidMap.set(v.vid, {
      name: v.variantNameEn || '(unnamed)',
      price: v.variantSellPrice,
      props,
    });
  }

  // 7. Comparison table
  const SEP = '─'.repeat(130);
  console.log(SEP);
  console.log(
    pad('cj_vid', 24) +
    pad('color', 16) +
    pad('size', 10) +
    pad('active', 8) +
    pad('DB stock', 10) +
    pad('CJ stk(US)', 12) +
    pad('CJ stk(CN)', 12) +
    pad('match?', 8) +
    'in CJ?'
  );
  console.log(SEP);

  let mismatches = 0;
  let dbOnlyCount = 0;
  const dbVidSet = new Set();

  for (const v of dbVariants) {
    dbVidSet.add(v.cj_vid);
    const inCJ = cjVidSet.has(v.cj_vid);
    const dbStock = v.stock_count ?? 0;
    const cjStock = variantStockMap.get(v.cj_vid);
    const cjUS = cjStock ? cjStock.us : '-';
    const cjCN = cjStock ? cjStock.cn : '-';
    const match = cjStock ? dbStock === cjStock.us : false;
    if (!match) mismatches++;
    if (!inCJ) dbOnlyCount++;

    console.log(
      pad(v.cj_vid || '(null)', 24) +
      pad(v.color || '-', 16) +
      pad(v.size || '-', 10) +
      pad(v.is_active ? 'yes' : 'no', 8) +
      pad(String(dbStock), 10) +
      pad(String(cjUS), 12) +
      pad(String(cjCN), 12) +
      pad(match ? '✅' : '❌', 8) +
      (inCJ ? '✅' : '❌')
    );
  }

  console.log(SEP);

  // Variants in CJ but not in DB
  const cjOnlyVids = cjVariants.filter((v) => !dbVidSet.has(v.vid));

  if (cjOnlyVids.length > 0) {
    console.log(`\nVariants in CJ but NOT in DB (${cjOnlyVids.length}):`);
    for (const v of cjOnlyVids) {
      const info = cjVidMap.get(v.vid);
      console.log(`  vid=${v.vid}  ${info.props || info.name}  price=$${info.price}`);
    }
  }

  // Summary
  console.log(`\n── Summary ──`);
  console.log(`  Total DB variants:    ${dbVariants.length}`);
  console.log(`  Total CJ variants:    ${cjVariants.length}`);
  console.log(`  CJ product total:     ${totalCJStock}`);
  console.log(`  Variant stock entries: ${variantStockMap.size}`);
  console.log(`  Stock mismatches:     ${mismatches}`);
  console.log(`  In DB but not CJ:     ${dbOnlyCount}`);
  console.log(`  In CJ but not DB:     ${cjOnlyVids.length}`);
  console.log('');
}

function pad(str, len) {
  return String(str).padEnd(len);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
