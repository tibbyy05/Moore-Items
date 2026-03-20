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

const names = [
  'Gray Hardtop Gazebo with Steel Roof and Curtains',
  'Red Faux Leather 3-Piece Sofa Set',
];

async function main() {
  // Find the products first
  const query = 'select=id,name,status&status=eq.active&name=in.(' + names.map(n => '"' + n + '"').join(',') + ')';
  const res = await fetch(URL + '/rest/v1/mi_products?' + query, {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY },
  });
  const products = await res.json();

  if (!Array.isArray(products) || products.length === 0) {
    console.log('No matching active products found.');
    console.log('Response:', JSON.stringify(products));
    return;
  }

  console.log('Found ' + products.length + ' product(s) to hide:\n');

  for (const p of products) {
    console.log('  ' + p.id + ' | ' + p.name + ' | status: ' + p.status);
    const updateRes = await fetch(URL + '/rest/v1/mi_products?id=eq.' + p.id, {
      method: 'PATCH',
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ status: 'hidden' }),
    });
    const updated = await updateRes.json();
    console.log('    -> status now: ' + updated[0].status);
  }

  console.log('\nDone.');
}
main().catch(console.error);
