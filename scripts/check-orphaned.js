const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseGet(table, q) {
  const url = SUPABASE_URL + '/rest/v1/' + table + '?' + q;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
    },
  });
  return res.json();
}

async function main() {
  // Query 1: Products with null category_id
  console.log('=== QUERY 1: Missing category (null category_id) ===');
  const missing = await supabaseGet('mi_products', 'select=id,name,category_id&status=eq.active&category_id=is.null&order=name.asc');
  if (!Array.isArray(missing)) {
    console.log('Response:', JSON.stringify(missing));
  }
  console.log('Count:', Array.isArray(missing) ? missing.length : 'N/A');
  const missingArr = Array.isArray(missing) ? missing : [];
  for (const p of missingArr) {
    console.log('  ' + p.id + ' | ' + p.name);
  }

  // Query 2: Orphaned products - category_id set but category doesn't exist
  console.log('\n=== QUERY 2: Orphaned products (category_id not in mi_categories) ===');
  const cats = await supabaseGet('mi_categories', 'select=id');
  const catIds = new Set(cats.map(c => c.id));

  const allActive = await supabaseGet('mi_products', 'select=id,name,category_id&status=eq.active&category_id=not.is.null&order=name.asc&limit=1000');
  const orphaned = allActive.filter(p => p.category_id && !catIds.has(p.category_id));
  console.log('Count:', orphaned.length);
  for (const p of orphaned) {
    console.log('  ' + p.id + ' | cat=' + p.category_id + ' | ' + p.name);
  }

  // Also show all valid categories for reference
  console.log('\n=== Valid categories ===');
  const catsAll = await supabaseGet('mi_categories', 'select=id,slug,name&order=name.asc');
  for (const c of catsAll) {
    console.log('  ' + c.id + ' | ' + c.slug + ' | ' + c.name);
  }
}

main().catch(console.error);
