/**
 * scripts/check-cj-product.js
 *
 * Quick diagnostic: fetch a CJ product + its stock inventory and log
 * the product name, variant breakdown, US stock status, and orderability.
 *
 * Usage:  node scripts/check-cj-product.js
 */

const path = require('path');
const fs = require('fs');

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

const API_KEY = process.env.CJ_API_KEY;
const BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
const PID = '1873904675190366210';

async function getToken() {
  const res = await fetch(`${BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: API_KEY }),
  });
  const json = await res.json();
  if (json.code !== 200 && json.code !== 0) {
    throw new Error(`Auth failed: ${json.message}`);
  }
  return json.data.accessToken;
}

async function apiGet(token, endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  });
  return res.json();
}

async function main() {
  console.log(`\n── Checking CJ product ${PID} ──\n`);

  // 1. Auth
  const token = await getToken();
  console.log('✓ Got access token\n');

  // 2. Product query
  const productRes = await apiGet(token, `/product/query?pid=${PID}`);
  if (productRes.code !== 200 && productRes.code !== 0) {
    console.error('Product query failed:', productRes.message);
    process.exit(1);
  }
  const p = productRes.data;
  console.log(`Product: ${p.productNameEn}`);
  console.log(`PID:     ${p.pid}`);
  console.log(`Image:   ${p.productImage}`);
  console.log(`Price:   ${p.sellPrice}`);
  console.log(`Weight:  ${p.productWeight} ${p.productUnit || ''}`);
  console.log(`Source:  ${p.sourceFrom === 4 ? 'US warehouse' : 'CN warehouse'}`);

  // 3. Variants
  const variants = p.variants || [];
  console.log(`\n── ${variants.length} Variants ──\n`);
  for (const v of variants) {
    const props = (v.variantProperty || [])
      .map((prop) => `${prop.propertyName}: ${prop.propertyValueName}`)
      .join(' | ');
    console.log(
      `  vid=${v.vid}  ${v.variantNameEn || '(unnamed)'}` +
      `  price=$${v.variantSellPrice}` +
      (props ? `  [${props}]` : '')
    );
  }

  // 4. Stock / inventory
  console.log('\n── Stock Inventory ──\n');

  // Brief pause to respect rate limits
  await new Promise((r) => setTimeout(r, 3100));

  const stockRes = await apiGet(token, `/product/stock/getInventoryByPid?pid=${PID}`);
  if (stockRes.code !== 200 && stockRes.code !== 0) {
    console.error('Stock query failed:', stockRes.message);
  } else {
    const inventories = stockRes.data || [];
    if (Array.isArray(inventories) && inventories.length > 0) {
      for (const inv of inventories) {
        console.log(`  ${inv.countryCode}: ${inv.totalInventoryNum} units`);
      }
    } else if (stockRes.data?.inventories) {
      for (const inv of stockRes.data.inventories) {
        console.log(`  ${inv.countryCode}: ${inv.totalInventoryNum} units`);
      }
    } else {
      console.log('  No inventory data returned');
      console.log('  Raw:', JSON.stringify(stockRes.data, null, 2));
    }
  }

  // 5. Summary
  const allInv = stockRes.data?.inventories || (Array.isArray(stockRes.data) ? stockRes.data : []);
  const usInv = allInv.find((i) => i.countryCode === 'US');
  const cnInv = allInv.find((i) => i.countryCode === 'CN');
  const hasUSStock = usInv && usInv.totalInventoryNum > 0;
  const hasCNStock = cnInv && cnInv.totalInventoryNum > 0;
  const orderable = hasUSStock || hasCNStock;

  console.log('\n── Summary ──\n');
  console.log(`  US stock:   ${hasUSStock ? `Yes (${usInv.totalInventoryNum})` : 'No'}`);
  console.log(`  CN stock:   ${hasCNStock ? `Yes (${cnInv.totalInventoryNum})` : 'No'}`);
  console.log(`  Orderable:  ${orderable ? 'YES' : 'NO'}`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
