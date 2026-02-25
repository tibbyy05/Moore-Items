const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  // Sample variants with null color AND null size
  const bothNull = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=name,color,size&color=is.null&size=is.null&limit=30`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  ).then(r => r.json());

  console.log('=== Variants with BOTH color and size NULL (30 samples) ===');
  bothNull.forEach((v, i) => console.log(`  ${i + 1}. "${v.name}"`));

  // Sample variants with color but null size
  const colorOnly = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=name,color,size&color=not.is.null&size=is.null&limit=20`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  ).then(r => r.json());

  console.log('\n=== Variants with color but NULL size (20 samples) ===');
  colorOnly.forEach((v, i) => console.log(`  ${i + 1}. color="${v.color}" name="${v.name}"`));

  // Sample variants with size but null color
  const sizeOnly = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=name,color,size&size=not.is.null&color=is.null&limit=20`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  ).then(r => r.json());

  console.log('\n=== Variants with size but NULL color (20 samples) ===');
  sizeOnly.forEach((v, i) => console.log(`  ${i + 1}. size="${v.size}" name="${v.name}"`));

  // Sample variants with BOTH populated
  const both = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=name,color,size&color=not.is.null&size=not.is.null&limit=20`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
  ).then(r => r.json());

  console.log('\n=== Variants with BOTH populated (20 samples) ===');
  both.forEach((v, i) => console.log(`  ${i + 1}. color="${v.color}" size="${v.size}" name="${v.name}"`));

  // Counts
  const totalRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=id&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' } }
  );
  const total = totalRes.headers.get('content-range')?.split('/')[1] || '?';

  const nullColorRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=id&color=is.null&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' } }
  );
  const nullColor = nullColorRes.headers.get('content-range')?.split('/')[1] || '?';

  const nullSizeRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_product_variants?select=id&size=is.null&limit=1`,
    { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Prefer': 'count=exact' } }
  );
  const nullSize = nullSizeRes.headers.get('content-range')?.split('/')[1] || '?';

  console.log(`\n=== Totals ===`);
  console.log(`Total variants: ${total}`);
  console.log(`Null color: ${nullColor}`);
  console.log(`Null size: ${nullSize}`);
}

main().catch(console.error);