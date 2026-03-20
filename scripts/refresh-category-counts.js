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
  const catsRes = await fetch(URL + '/rest/v1/mi_categories?select=id,slug,name,product_count&order=name.asc', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  });
  const cats = await catsRes.json();

  const prodsRes = await fetch(URL + '/rest/v1/mi_products?select=category_id&status=eq.active&limit=10000', {
    headers: { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY }
  });
  const prods = await prodsRes.json();

  const counts = {};
  for (const p of prods) {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
  }

  console.log('Category                  | Old Count | New Count | Change');
  console.log('-'.repeat(65));

  for (const cat of cats) {
    const oldCount = cat.product_count || 0;
    const newCount = counts[cat.id] || 0;
    const diff = newCount - oldCount;
    const marker = diff !== 0 ? ' *' : '';
    console.log(cat.name.padEnd(26) + '| ' + String(oldCount).padEnd(10) + '| ' + String(newCount).padEnd(10) + '| ' + (diff >= 0 ? '+' : '') + diff + marker);

    if (diff !== 0) {
      const res = await fetch(URL + '/rest/v1/mi_categories?id=eq.' + cat.id, {
        method: 'PATCH',
        headers: {
          'apikey': KEY,
          'Authorization': 'Bearer ' + KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ product_count: newCount }),
      });
      if (!res.ok) console.log('  ERROR updating ' + cat.slug);
    }
  }
  console.log('\nDone! Categories marked with * were updated.');
}
main().catch(console.error);
