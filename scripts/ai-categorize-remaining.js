/**
 * AI Categorize Remaining Uncategorized Products
 * Uses Claude Haiku to categorize products that keyword matching missed.
 * Reads .env.local, pulls uncategorized products, sends names in batches to Claude, updates DB.
 *
 * Usage:
 *   node scripts/ai-categorize-remaining.js --dry-run   (preview only)
 *   node scripts/ai-categorize-remaining.js --apply      (apply changes)
 */

const fs = require('fs');
const path = require('path');

// --- Load .env.local ---
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
const ANTHROPIC_KEY = env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const mode = process.argv[2];
if (!mode || !['--dry-run', '--apply'].includes(mode)) {
  console.log('Usage: node scripts/ai-categorize-remaining.js --dry-run|--apply');
  process.exit(0);
}

const isDryRun = mode === '--dry-run';

// Valid categories (slug → display name)
const CATEGORIES = {
  'home-furniture': 'Home & Furniture',
  'fashion': 'Fashion',
  'health-beauty': 'Health & Beauty',
  'jewelry': 'Jewelry',
  'garden-outdoor': 'Garden & Outdoor',
  'pet-supplies': 'Pet Supplies',
  'kitchen-dining': 'Kitchen & Dining',
  'electronics': 'Electronics',
  'tools-hardware': 'Tools & Hardware',
  'kids-toys': 'Kids & Toys',
  'sports-outdoors': 'Sports & Outdoors',
  'storage-organization': 'Storage & Organization',
};

const CATEGORY_SLUGS = Object.keys(CATEGORIES);
const CATEGORY_NAMES = Object.values(CATEGORIES);

// --- Supabase helpers ---
async function supabaseGet(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  return res.json();
}

async function supabaseUpdate(table, id, data) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// --- Get category ID by slug ---
async function getCategoryMap() {
  const cats = await supabaseGet('mi_categories', 'select=id,slug,name');
  const map = {};
  for (const cat of cats) {
    map[cat.slug] = cat.id;
  }
  return map;
}

// --- Claude API call ---
async function classifyBatch(products) {
  const productList = products.map((p, i) => `${i + 1}. "${p.name}"`).join('\n');

  const prompt = `You are a product categorizer for an e-commerce store. Categorize each product into exactly ONE of these categories:

${CATEGORY_NAMES.map((name, i) => `- ${CATEGORY_SLUGS[i]} (${name})`).join('\n')}

If a product is clearly junk, gibberish, or doesn't belong in any category, respond with "HIDE" for that product.

Products to categorize:
${productList}

Respond ONLY with a JSON array of objects, one per product, in order:
[{"index": 1, "slug": "category-slug"}, {"index": 2, "slug": "HIDE"}, ...]

No explanation, no markdown, just the JSON array.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) {
    console.error('Claude API error:', JSON.stringify(data));
    return null;
  }

  const text = data.content[0].text.trim();
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse Claude response:', text);
    return null;
  }
}

// --- Main ---
async function main() {
  console.log(`=== AI Categorize Remaining Products ===`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}\n`);

  // Get uncategorized products
  const products = await supabaseGet(
    'mi_products',
    'select=id,name,category_id&category_id=is.null&status=eq.active&order=name.asc&limit=200'
  );

  // Also check for products with no matching category
  const noCat = await supabaseGet(
    'mi_categories',
    'select=id&slug=eq.uncategorized&limit=1'
  );

  let allProducts = [...products];

  // If there's an "uncategorized" category, grab those too
  if (noCat.length > 0) {
    const uncatProducts = await supabaseGet(
      'mi_products',
      `select=id,name,category_id&category_id=eq.${noCat[0].id}&status=eq.active&order=name.asc&limit=200`
    );
    allProducts = [...allProducts, ...uncatProducts];
  }

  console.log(`Found ${allProducts.length} uncategorized products\n`);

  if (allProducts.length === 0) {
    console.log('Nothing to categorize!');
    return;
  }

  // Get category slug → ID map
  const categoryMap = await getCategoryMap();

  // Process in batches of 25
  const BATCH_SIZE = 25;
  let categorized = 0;
  let hidden = 0;
  let failed = 0;
  const results = {};

  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} products)...`);

    const classifications = await classifyBatch(batch);
    if (!classifications) {
      console.error('  Batch failed, skipping');
      failed += batch.length;
      continue;
    }

    for (const item of classifications) {
      const product = batch[item.index - 1];
      if (!product) continue;

      const slug = item.slug;

      if (slug === 'HIDE') {
        console.log(`  HIDE: "${product.name}"`);
        if (!isDryRun) {
          await supabaseUpdate('mi_products', product.id, { status: 'hidden' });
        }
        hidden++;
        continue;
      }

      if (!categoryMap[slug]) {
        console.log(`  UNKNOWN SLUG "${slug}" for: "${product.name}"`);
        failed++;
        continue;
      }

      const catName = CATEGORIES[slug] || slug;
      console.log(`  ${catName}: "${product.name}"`);

      if (!isDryRun) {
        await supabaseUpdate('mi_products', product.id, { category_id: categoryMap[slug] });
      }

      results[catName] = (results[catName] || 0) + 1;
      categorized++;
    }

    // Small delay between batches to be nice to the API
    if (i + BATCH_SIZE < allProducts.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Categorized: ${categorized}`);
  console.log(`Hidden (junk): ${hidden}`);
  console.log(`Failed: ${failed}`);
  console.log(`\nBreakdown:`);
  Object.entries(results)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`  ${cat}: ${count}`));

  if (isDryRun) {
    console.log(`\nThis was a dry run. Run with --apply to make changes.`);
  } else {
    console.log(`\nDone! Products updated in database.`);
    console.log(`Note: Run "UPDATE mi_categories SET product_count = ..." to refresh counts.`);
  }
}

main().catch(console.error);