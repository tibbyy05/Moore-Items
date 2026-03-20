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

const mode = process.argv[2];
if (!mode || !['--preview', '--apply'].includes(mode)) {
  console.log('Usage: node scripts/fix-drift-prices.js --preview|--apply');
  process.exit(0);
}

async function main() {
  // Fetch all 24 flagged products
  const res = await fetch(
    URL + '/rest/v1/mi_products?select=id,name,cj_price,retail_price,shipping_cost,price_drift_details&price_drift_flagged=eq.true&order=name.asc',
    { headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY } }
  );
  const products = await res.json();

  if (!Array.isArray(products) || products.length === 0) {
    console.log('No drift-flagged products found.');
    return;
  }

  // Build update plan
  const plan = [];
  for (const p of products) {
    const details = p.price_drift_details;
    const currentCJ = details?.variants?.[0]?.currentPrice;
    if (currentCJ == null) {
      console.log('SKIP (no currentPrice in details): ' + p.name);
      continue;
    }

    const shipping = parseFloat(p.shipping_cost) || 3.00;
    const newRetail = Math.ceil((currentCJ + shipping) * 2.0) - 0.01;
    const oldRetail = parseFloat(p.retail_price) || 0;
    const oldCJ = parseFloat(p.cj_price) || 0;
    const retailChange = oldRetail > 0 ? ((newRetail - oldRetail) / oldRetail * 100).toFixed(1) : 'N/A';

    plan.push({
      id: p.id,
      name: p.name,
      oldCJ,
      newCJ: currentCJ,
      shipping,
      oldRetail,
      newRetail,
      retailChange,
      absDelta: Math.abs(newRetail - oldRetail),
    });
  }

  // Sort by absolute retail change for preview
  const byDelta = [...plan].sort((a, b) => b.absDelta - a.absDelta);

  console.log('=== Top 5 Most Dramatic Changes ===\n');
  console.log('Name                                                  | Old CJ  | New CJ  | Old Retail | New Retail | Change');
  console.log('-'.repeat(120));
  for (const p of byDelta.slice(0, 5)) {
    const name = p.name.length > 53 ? p.name.substring(0, 50) + '...' : p.name;
    console.log(
      name.padEnd(53) + ' | ' +
      ('$' + p.oldCJ.toFixed(2)).padStart(7) + ' | ' +
      ('$' + p.newCJ.toFixed(2)).padStart(7) + ' | ' +
      ('$' + p.oldRetail.toFixed(2)).padStart(10) + ' | ' +
      ('$' + p.newRetail.toFixed(2)).padStart(10) + ' | ' +
      (p.retailChange + '%').padStart(7)
    );
  }

  console.log('\n=== All ' + plan.length + ' Products ===\n');
  console.log('Name                                                  | Old CJ  | New CJ  | Old Retail | New Retail | Change');
  console.log('-'.repeat(120));
  for (const p of plan) {
    const name = p.name.length > 53 ? p.name.substring(0, 50) + '...' : p.name;
    console.log(
      name.padEnd(53) + ' | ' +
      ('$' + p.oldCJ.toFixed(2)).padStart(7) + ' | ' +
      ('$' + p.newCJ.toFixed(2)).padStart(7) + ' | ' +
      ('$' + p.oldRetail.toFixed(2)).padStart(10) + ' | ' +
      ('$' + p.newRetail.toFixed(2)).padStart(10) + ' | ' +
      (p.retailChange + '%').padStart(7)
    );
  }

  if (mode === '--preview') {
    console.log('\nThis was a preview. Run with --apply to update all ' + plan.length + ' products.');
    return;
  }

  // Apply updates
  console.log('\n=== Applying updates ===\n');
  let updated = 0;
  for (const p of plan) {
    const patchRes = await fetch(URL + '/rest/v1/mi_products?id=eq.' + p.id, {
      method: 'PATCH',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        cj_price: p.newCJ,
        retail_price: p.newRetail,
        price_drift_flagged: false,
        price_drift_details: null,
      }),
    });
    const result = await patchRes.json();
    if (patchRes.ok && result[0]) {
      console.log('  OK: ' + result[0].name + ' -> cj=$' + result[0].cj_price + ' retail=$' + result[0].retail_price);
      updated++;
    } else {
      console.log('  FAIL: ' + p.name + ' -> ' + JSON.stringify(result));
    }
  }
  console.log('\nDone! Updated ' + updated + '/' + plan.length + ' products.');
}

main().catch(console.error);
