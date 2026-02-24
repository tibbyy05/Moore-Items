// Run with: node scripts/fetch-weights.js
// Fetches weight data from CJ detail API for active products missing it

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const CJ_BASE_URL = process.env.CJ_API_BASE_URL;
const CJ_API_KEY = process.env.CJ_API_KEY;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hasWeight(product) {
  if (!product.cj_raw_data) return false;
  try {
    const raw = typeof product.cj_raw_data === 'string'
      ? JSON.parse(product.cj_raw_data)
      : product.cj_raw_data;
    return raw.productWeight != null && raw.productWeight !== '';
  } catch {
    return false;
  }
}

async function getToken() {
  const res = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const data = await res.json();
  if (!data.result) throw new Error('CJ Auth failed: ' + data.message);
  return data.data.accessToken;
}

async function fetchDetail(token, pid) {
  const res = await fetch(`${CJ_BASE_URL}/product/query?pid=${pid}`, {
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
  });
  const data = await res.json();

  if (data.code === 1600200) {
    console.log('  Rate limit hit, waiting 10s...');
    await delay(10000);
    const retry = await fetch(`${CJ_BASE_URL}/product/query?pid=${pid}`, {
      headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
    });
    return retry.json();
  }

  return data;
}

async function run() {
  if (!CJ_BASE_URL || !CJ_API_KEY) {
    console.log('Missing CJ_API_BASE_URL or CJ_API_KEY in .env.local');
    return;
  }

  console.log('Getting CJ auth token...');
  const token = await getToken();
  console.log('Token acquired\n');

  // Fetch all active products with cj_pid in batches
  const batchSize = 50;
  let allProducts = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('mi_products')
      .select('id, name, cj_pid, cj_raw_data')
      .not('cj_pid', 'is', null)
      .eq('status', 'active')
      .range(from, from + batchSize - 1);

    if (error) throw new Error('Supabase query failed: ' + error.message);
    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  console.log(`Found ${allProducts.length} active products with CJ PID`);

  // Split into needs-weight vs already-has-weight
  const needsWeight = [];
  let skipped = 0;

  for (const product of allProducts) {
    if (hasWeight(product)) {
      skipped++;
    } else {
      needsWeight.push(product);
    }
  }

  console.log(`${needsWeight.length} need weight data, ${skipped} already have it\n`);

  if (needsWeight.length === 0) {
    console.log('Nothing to do!');
    console.log(`\nSummary: 0 updated, ${skipped} skipped (already had weight), 0 errors`);
    return;
  }

  let updated = 0;
  let errors = 0;
  const total = needsWeight.length;

  for (let i = 0; i < total; i++) {
    const product = needsWeight[i];
    const num = i + 1;

    try {
      await delay(3100);
      const response = await fetchDetail(token, product.cj_pid);

      if (response.code !== 200 && response.code !== 0) {
        throw new Error(response.message || 'CJ detail failed');
      }

      const detail = response.data || response;
      const productWeight = detail.productWeight || '';
      const packingWeight = detail.packingWeight || '';

      const { error: updateError } = await supabase
        .from('mi_products')
        .update({ cj_raw_data: detail })
        .eq('id', product.id);

      if (updateError) throw new Error('DB update failed: ' + updateError.message);

      updated++;
      console.log(
        `[${num}/${total}] Updated weight for "${product.name.substring(0, 60)}" — ${productWeight}g product, ${packingWeight}g packed`
      );
    } catch (err) {
      errors++;
      console.log(
        `[${num}/${total}] ERROR "${product.name.substring(0, 60)}": ${err.message}`
      );
    }
  }

  console.log(`\nSummary: ${updated} updated, ${skipped} skipped (already had weight), ${errors} errors`);
}

run().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
