const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => { const eq = line.indexOf('='); if (eq > 0) env[line.substring(0,eq).trim()] = line.substring(eq+1).trim(); });
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const DRY_RUN = process.argv.includes('--dry-run');

// ─── AUTO-HIDE: These get hidden immediately ───
const AUTO_HIDE_PATTERNS = [
  // Wholesale/vendor listings (not retail products)
  /\bvendor(s)?\b/i,
  /\bwholesale\b/i,
  /\bdropship(ping)?\b/i,
  /\bbulk\s+order\b/i,
  
  // Platform ban references that slipped through
  /\bban(ned)?\s+(the\s+)?(sale|from|on|amazon|temu|wayfair|shein)\b/i,
  /\bprohibited\b/i,
  /\bnot\s+for\s+sale\b/i,
  /\bself.?pick.?up\b/i,
  
  // Model numbers as names
  /^[A-Z0-9]{2,5}[-\s]\d{3,}/,  // Starts with model number like "CST-3062"
  
  // Nonsensical or placeholder names
  /^(test|sample|placeholder|dummy|xxx|tbd)\b/i,
];

// Names too short to be real product names
const MIN_NAME_LENGTH = 15;

// ─── QUESTIONABLE: Flagged for review ───
function isQuestionable(name) {
  const issues = [];
  
  // Very short names (15-25 chars) - not auto-hide but suspicious
  if (name.length >= MIN_NAME_LENGTH && name.length < 25) {
    issues.push('very short name');
  }
  
  // Has slashes (usually lazy formatting)
  if (/\//.test(name) && name.length < 40) {
    issues.push('has slash');
  }
  
  // Starts with numbers and units (like "20pcs 1set 13g")
  if (/^\d+\s*(pcs|set|pack|lot|pair)/i.test(name)) {
    issues.push('starts with quantity');
  }
  
  // Contains measurements as main content
  if (/^\d+(\.\d+)?\s*(mm|cm|inch|ft|x)\b/i.test(name)) {
    issues.push('starts with measurements');
  }
  
  // Random brand names nobody knows
  if (/^(EELHOE|PHOFAY|VEVOR|HOMECOM|Ximonth|Qulajoy|Kegani)\b/i.test(name)) {
    issues.push('unknown brand name');
  }
  
  return issues;
}

// ─── MISCATEGORIZED: Check Home & Garden for obvious mismatches ───
const FASHION_PATTERNS = [
  /\b(dress|shirt|blouse|sweater|hoodie|jacket|coat|pants|jeans|leggings|skirt|jumpsuit|cardigan|vest|blazer|trouser|lingerie|bra|corset|shapewear|fajas|bikini|swimsuit|swimwear)\b/i,
  /\b(sexy|elegant)\b.*\b(women|female|ladies)\b/i,
  /\b(women'?s|men'?s)\b.*\b(fashion|casual|slim|loose)\b/i,
];

const HEALTH_PATTERNS = [
  /\b(capsule|capsules|supplement|vitamin|cream|serum|moisturiz|skincare|lip\s*tint|makeup|cosmetic|shampoo|conditioner)\b/i,
];

async function main() {
  console.log(`=== Product Cleanup V2 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`);

  // Fetch all active products
  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${URL}/rest/v1/mi_products?select=id,name,category_id,retail_price,images,slug&status=eq.active&limit=500&offset=${offset}`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  console.log(`Found ${all.length} active products\n`);

  // Get categories
  const catRes = await fetch(`${URL}/rest/v1/mi_categories?select=id,slug,name`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  const categories = await catRes.json();
  const catMap = {};
  const catIdToSlug = {};
  categories.forEach(c => { catMap[c.slug] = c.id; catIdToSlug[c.id] = c.slug; });

  const toHide = [];
  const questionable = [];
  const toRecategorize = [];

  for (const product of all) {
    const name = product.name || '';
    
    // 1. Check auto-hide patterns
    let shouldHide = false;
    let hideReason = '';
    
    for (const pattern of AUTO_HIDE_PATTERNS) {
      if (pattern.test(name)) {
        shouldHide = true;
        hideReason = `matches pattern: ${pattern}`;
        break;
      }
    }
    
    // Too-short names
    if (!shouldHide && name.length < MIN_NAME_LENGTH) {
      shouldHide = true;
      hideReason = `name too short (${name.length} chars)`;
    }
    
    // No images
    if (!shouldHide && (!product.images || product.images.length === 0)) {
      shouldHide = true;
      hideReason = 'no images';
    }
    
    if (shouldHide) {
      toHide.push({ id: product.id, name, reason: hideReason });
      continue;
    }
    
    // 2. Check questionable
    const issues = isQuestionable(name);
    if (issues.length > 0) {
      questionable.push({ id: product.id, name, issues: issues.join(', ') });
    }
    
    // 3. Check miscategorized (Home & Garden items that belong elsewhere)
    const currentCat = catIdToSlug[product.category_id];
    if (currentCat === 'home-garden') {
      for (const pattern of FASHION_PATTERNS) {
        if (pattern.test(name)) {
          toRecategorize.push({ id: product.id, name, from: 'home-garden', to: 'fashion' });
          break;
        }
      }
      for (const pattern of HEALTH_PATTERNS) {
        if (pattern.test(name)) {
          toRecategorize.push({ id: product.id, name, from: 'home-garden', to: 'health-beauty' });
          break;
        }
      }
    }
  }

  // ─── Report ───
  console.log(`\n=== WILL HIDE (${toHide.length} products) ===`);
  toHide.forEach(p => console.log(`  [HIDE] ${p.name} — ${p.reason}`));

  console.log(`\n=== QUESTIONABLE (${questionable.length} products - NOT auto-hidden) ===`);
  questionable.slice(0, 50).forEach(p => console.log(`  [?] ${p.name} — ${p.issues}`));
  if (questionable.length > 50) console.log(`  ... and ${questionable.length - 50} more`);

  console.log(`\n=== MISCATEGORIZED (${toRecategorize.length} products) ===`);
  toRecategorize.forEach(p => console.log(`  [MOVE] "${p.name}" — ${p.from} → ${p.to}`));

  if (DRY_RUN) {
    console.log('\n--- DRY RUN --- No changes made. Run without --dry-run to apply.');
    return;
  }

  // ─── Apply changes ───
  let hidden = 0;
  let moved = 0;

  // Hide junk
  for (const product of toHide) {
    const res = await fetch(`${URL}/rest/v1/mi_products?id=eq.${product.id}`, {
      method: 'PATCH',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ status: 'hidden' }),
    });
    if (res.ok) hidden++;
    await new Promise(r => setTimeout(r, 20));
  }

  // Recategorize
  for (const product of toRecategorize) {
    const newCatId = catMap[product.to];
    if (!newCatId) continue;
    const res = await fetch(`${URL}/rest/v1/mi_products?id=eq.${product.id}`, {
      method: 'PATCH',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ category_id: newCatId }),
    });
    if (res.ok) moved++;
    await new Promise(r => setTimeout(r, 20));
  }

  console.log(`\n=== DONE ===`);
  console.log(`Hidden: ${hidden}`);
  console.log(`Recategorized: ${moved}`);
  console.log(`Questionable (review manually): ${questionable.length}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });