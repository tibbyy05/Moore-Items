const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  const res = await fetch(
    URL + '/rest/v1/mi_products?select=id,name,cj_price,retail_price,shipping_cost,warehouse,price_drift_flagged,price_drift_details&price_drift_flagged=eq.true&order=name.asc',
    { headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY } }
  );
  const products = await res.json();

  if (!Array.isArray(products)) {
    console.log('Error:', JSON.stringify(products));
    return;
  }

  console.log('Found ' + products.length + ' price-drift-flagged products\n');
  console.log('Name                                                  | WH  | CJ Cost | Retail  | Drift Details');
  console.log('-'.repeat(120));

  for (const p of products) {
    const name = p.name.length > 53 ? p.name.substring(0, 50) + '...' : p.name;
    const wh = (p.warehouse || '??').padEnd(4);
    const cj = parseFloat(p.cj_price || 0).toFixed(2).padStart(7);
    const retail = parseFloat(p.retail_price || 0).toFixed(2).padStart(7);

    let detail = '';
    if (p.price_drift_details) {
      const d = p.price_drift_details;
      if (d.variants && d.variants.length > 0) {
        const v = d.variants[0];
        detail = '$' + v.storedPrice?.toFixed(2) + ' -> $' + v.currentPrice?.toFixed(2) + ' (' + (v.driftPct > 0 ? '+' : '') + v.driftPct + '%)';
      } else if (d.maxDriftPct !== undefined) {
        detail = (d.maxDriftPct > 0 ? '+' : '') + d.maxDriftPct + '% drift';
      }
    }

    console.log(name.padEnd(53) + ' | ' + wh + '| ' + cj + ' | ' + retail + ' | ' + detail);
  }

  // Also print raw details for first few
  console.log('\n=== Raw drift details (first 5) ===');
  for (const p of products.slice(0, 5)) {
    console.log('\n' + p.name + ' (id: ' + p.id + ')');
    console.log(JSON.stringify(p.price_drift_details, null, 2));
  }
}

main().catch(console.error);
