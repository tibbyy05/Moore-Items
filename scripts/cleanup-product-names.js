/**
 * cleanup-product-names.js
 * Usage: node scripts/cleanup-product-names.js          (preview)
 *        node scripts/cleanup-product-names.js --apply   (commit changes)
 */
const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => { const eq = line.indexOf('='); if (eq > 0) env[line.substring(0,eq).trim()] = line.substring(eq+1).trim(); });
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const DRY_RUN = !process.argv.includes('--apply');

async function supabaseGet(table, params = '') {
  const res = await fetch(`${URL}/rest/v1/${table}?${params}`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  if (!res.ok) throw new Error(`GET failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, filter, body) {
  const res = await fetch(`${URL}/rest/v1/${table}?${filter}`, {
    method: 'PATCH',
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH failed (${res.status}): ${await res.text()}`);
}

const REMOVE_PATTERNS = [
  /\b(new arrival|hot sale|best seller|top quality|high quality|premium quality)\b/gi,
  /\b(free shipping|fast shipping|dropship|dropshipping)\b/gi,
  /\b(wholesale|retail|factory direct|factory price)\b/gi,
  /\b(2024|2025|2026|newest|latest|new design)\b/gi,
  /\b(fashionable|stylish|trendy|popular)\b/gi,
  /\b(cheap|affordable|budget|economical|low price)\b/gi,
  /\b(brand new|100% new|genuine|authentic)\b/gi,
  /\b(in stock|ready to ship|quick delivery)\b/gi,
  /\bCJ\s*dropshipping\b/gi,
  /\b(SKU|MOQ|OEM|ODM)\s*[:.]?\s*\w*/gi,
  /\s*[|]+\s*/g,
  // Amazon/Temu/platform ban notices (many variations)
  /,?\s*Ban(ned)?\s*(The\s+)?Sale\s+(Of\s+)?(On\s+)?Amazon\s*&?\s*Temu\s*(Platform)?/gi,
  /,?\s*Prohibited\s+From\s+Being\s+Sold\s+On\s+[\w\s&]+Platforms?/gi,
  /,?\s*Amazon\s+Sales?\s+Are\s+Prohibited/gi,
  /,?\s*Amazon\s+Banned/gi,
  /,?\s*Banned\s+From\s+Sale\s+On\s+[\w\s&]+Platform/gi,
  /,?\s*No\s+Shipping\s+On\s+Weekends/gi,
  /,?\s*May\s+Be\s+Shipped\s+Via\s+[\w\s]+Logistics/gi,
  /,?\s*--?\s*Prohibited\s+From[\w\s&]+/gi,
];

function titleCase(str) {
  const small = new Set(['a','an','the','and','but','or','for','nor','on','at','to','from','by','in','of','with','vs']);
  return str.split(' ').map((w, i) => {
    if (w.length === 0) return w;
    if (i === 0 || !small.has(w.toLowerCase())) return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    return w.toLowerCase();
  }).join(' ');
}

function cleanName(name) {
  let c = name;
  for (const p of REMOVE_PATTERNS) c = c.replace(p, ' ');
  
  // Remove spec-like parentheses but keep useful ones
  c = c.replace(/\([^)]{1,15}\)/g, m => /color|pack|set|piece|pair|pcs/i.test(m) ? m : '');
  
  // Clean whitespace and punctuation
  c = c.replace(/\s{2,}/g, ' ').replace(/^[\s,\-:]+/, '').replace(/[\s,\-:]+$/, '').trim();
  
  // Fix repeated words like "Polyester SetPolyester SetPolyester Set"
  const words = c.split(/\s+/);
  if (words.length >= 4) {
    const half = Math.floor(words.length / 2);
    const firstHalf = words.slice(0, half).join(' ');
    const secondHalf = words.slice(half, half * 2).join(' ');
    if (firstHalf === secondHalf) c = firstHalf;
  }
  
  // Truncate at ~80 chars on word boundary
  if (c.length > 80) {
    const cut = c.lastIndexOf(' ', 75);
    c = (cut > 30 ? c.substring(0, cut) : c.substring(0, 75)).replace(/[\s,\-:]+$/, '');
  }
  
  // Title case if ALL CAPS or all lowercase
  if (c === c.toUpperCase() || c === c.toLowerCase()) c = titleCase(c);
  
  if (c.length < 5) c = titleCase(name.substring(0, 75).trim());
  return c;
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-')
    .replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 80);
}

async function main() {
  console.log(`=== Product Name Cleanup ${DRY_RUN ? '(DRY RUN)' : '(APPLYING)'} ===\n`);
  
  const allProducts = [];
  let offset = 0;
  while (true) {
    const batch = await supabaseGet('mi_products', `select=id,name,slug&status=eq.active&order=name.asc&limit=500&offset=${offset}`);
    if (!batch || batch.length === 0) break;
    allProducts.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  console.log(`Found ${allProducts.length} active products\n`);

  const changes = [];
  for (const p of allProducts) {
    const cleaned = cleanName(p.name);
    if (cleaned !== p.name) changes.push({ id: p.id, original: p.name, cleaned });
  }

  console.log(`Will rename: ${changes.length} products`);
  console.log(`Unchanged: ${allProducts.length - changes.length}\n`);

  if (changes.length === 0) { console.log('Nothing to change!'); return; }

  // Show samples
  const sample = Math.min(40, changes.length);
  console.log(`=== Sample Changes (${sample} of ${changes.length}) ===\n`);
  for (let i = 0; i < sample; i++) {
    console.log(`  BEFORE: ${changes[i].original}`);
    console.log(`  AFTER:  ${changes[i].cleaned}\n`);
  }

  if (DRY_RUN) {
    console.log('---\nDry run. To apply: node scripts/cleanup-product-names.js --apply');
    return;
  }

  console.log('Applying...\n');
  let applied = 0, errors = 0;
  for (const ch of changes) {
    try {
      await supabasePatch('mi_products', `id=eq.${ch.id}`, { name: ch.cleaned, slug: generateSlug(ch.cleaned) });
      applied++;
      if (applied % 50 === 0) console.log(`  ${applied}/${changes.length}...`);
    } catch (err) { errors++; console.error(`  Error: ${err.message}`); }
    await new Promise(r => setTimeout(r, 50));
  }
  console.log(`\nDone! Applied: ${applied}, Errors: ${errors}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });