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

const { createClient } = require('@supabase/supabase-js');

const API_KEY = process.env.CJ_API_KEY;
const BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
const PID = process.argv[2] || '1873904675190366210';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getToken() {
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
  const SEP = '─'.repeat(140);
  console.log(`\n── ${variants.length} Variants ──\n`);
  console.log(SEP);
  console.log(
    pad('vid', 24) +
    pad('variantSku', 20) +
    pad('variantKey', 20) +
    pad('price', 10) +
    'variantNameEn'
  );
  console.log(SEP);
  for (const v of variants) {
    console.log(
      pad(v.vid || '-', 24) +
      pad(v.variantSku || '-', 20) +
      pad(v.variantKey || '-', 20) +
      pad(`$${v.variantSellPrice}`, 10) +
      (v.variantNameEn || '(unnamed)')
    );
  }
  console.log(SEP);

  if (variants.length > 0) {
    console.log('\n── Raw first variant object ──\n');
    console.log(JSON.stringify(variants[0], null, 2));
  }

  // 4. Stock / inventory
  console.log('\n── Stock Inventory ──\n');

  // Brief pause to respect rate limits
  await new Promise((r) => setTimeout(r, 3100));

  const stockRes = await apiGet(token, `/product/stock/getInventoryByPid?pid=${PID}`);
  if (stockRes.code !== 200 && stockRes.code !== 0) {
    console.error('Stock query failed:', stockRes.message);
  } else {
    console.log('Raw stock data:', JSON.stringify(stockRes.data, null, 2));

    // Product-level warehouse totals
    const inventories = stockRes.data?.inventories || (Array.isArray(stockRes.data) ? stockRes.data : []);
    console.log('\nProduct-level inventory:');
    if (inventories.length > 0) {
      for (const inv of inventories) {
        console.log(`  ${inv.countryCode}: ${inv.totalInventoryNum} units`);
      }
    } else {
      console.log('  (none)');
    }

    // Per-variant stock breakdown
    const variantInvs = stockRes.data?.variantInventories || [];
    console.log(`\n── Variant Inventories (${variantInvs.length} entries) ──\n`);
    if (variantInvs.length > 0) {
      console.log(SEP);
      console.log(
        pad('vid', 24) +
        pad('country', 10) +
        pad('totalInv', 14) +
        pad('cjInv', 14) +
        'factoryInv'
      );
      console.log(SEP);
      for (const vi of variantInvs) {
        for (const loc of (vi.inventory || [])) {
          console.log(
            pad(vi.vid || '-', 24) +
            pad(loc.countryCode || '-', 10) +
            pad(String(loc.totalInventory ?? '-'), 14) +
            pad(String(loc.cjInventory ?? '-'), 14) +
            String(loc.factoryInventory ?? '-')
          );
        }
      }
      console.log(SEP);
    } else {
      console.log('  (no variant inventory data)');
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

  // Per-variant stock summary
  const variantStockList = stockRes.data?.variantInventories || [];
  if (variantStockList.length > 0) {
    console.log(`\n  Per-variant stock:`);
    for (const vi of variantStockList) {
      const variantInfo = variants.find((v) => v.vid === vi.vid);
      const label = variantInfo?.variantKey || variantInfo?.variantNameEn || vi.vid;
      const stocks = (vi.inventory || [])
        .map((loc) => `${loc.countryCode}=${loc.totalInventory ?? 0}`)
        .join(', ');
      console.log(`    ${pad(label, 30)} ${stocks}`);
    }
  }
  console.log('');
}

function pad(str, len) {
  return String(str).padEnd(len);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
