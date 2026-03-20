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

async function supabaseGet(table, q) {
  const res = await fetch(URL + '/rest/v1/' + table + '?' + q, {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY },
  });
  return res.json();
}

async function main() {
  // 1. Pull pricing config from mi_settings
  console.log('=== Pricing Config from mi_settings ===\n');
  const settings = await supabaseGet('mi_settings', 'select=key,value&key=eq.pricing_config');
  if (!Array.isArray(settings) || settings.length === 0) {
    console.log('No pricing_config found in mi_settings — scripts would fall back to static defaults.');
  } else {
    const raw = settings[0].value;
    const cfg = typeof raw === 'string' ? JSON.parse(raw) : raw;
    console.log(JSON.stringify(cfg, null, 2));
  }

  // 2. Get all active products with pricing fields
  console.log('\n=== Price-Drifted Products (>10% off expected) ===\n');
  const products = [];
  let offset = 0;
  while (true) {
    const batch = await supabaseGet(
      'mi_products',
      'select=id,name,warehouse,cj_price,retail_price,shipping_cost&status=eq.active&order=name.asc&limit=500&offset=' + offset
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    products.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }

  // Apply the drift formula client-side (since we can't run raw SQL via REST)
  const drifted = [];
  for (const p of products) {
    const cj = parseFloat(p.cj_price) || 0;
    const retail = parseFloat(p.retail_price) || 0;
    const shipping = parseFloat(p.shipping_cost) || 3.00;
    if (cj <= 0 || retail <= 0) continue;

    const markup = p.warehouse === 'US' ? 1.6 : 1.8;
    const expected = (shipping + cj) * markup;
    const drift = Math.abs(retail - expected) / retail;

    if (drift > 0.10) {
      drifted.push({ ...p, expected: expected.toFixed(2), drift: (drift * 100).toFixed(1) });
    }
  }

  drifted.sort((a, b) => a.name.localeCompare(b.name));

  console.log('Found ' + drifted.length + ' drifted products (of ' + products.length + ' active)\n');
  console.log('Name                                                  | WH  | CJ Cost | Shipping | Retail  | Expected | Drift%');
  console.log('-'.repeat(115));
  for (const p of drifted.slice(0, 30)) {
    const name = p.name.length > 53 ? p.name.substring(0, 50) + '...' : p.name;
    const wh = (p.warehouse || 'CN').padEnd(4);
    const cj = parseFloat(p.cj_price).toFixed(2).padStart(7);
    const ship = parseFloat(p.shipping_cost || 0).toFixed(2).padStart(8);
    const retail = parseFloat(p.retail_price).toFixed(2).padStart(7);
    const exp = p.expected.padStart(8);
    const drift = (p.drift + '%').padStart(6);
    console.log(name.padEnd(53) + ' | ' + wh + '| ' + cj + ' | ' + ship + ' | ' + retail + ' | ' + exp + ' | ' + drift);
  }
  if (drifted.length > 30) {
    console.log('\n... and ' + (drifted.length - 30) + ' more');
  }
}

main().catch(console.error);
