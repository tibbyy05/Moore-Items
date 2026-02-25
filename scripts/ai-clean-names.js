/**
 * AI Bulk Product Name Cleanup
 * Uses Claude Haiku to rewrite messy CJ product names into clean, professional names.
 * Targets: shipping instructions, platform references, dimensions, overly long names, gibberish.
 *
 * Usage:
 *   node scripts/ai-clean-names.js --scan              (find dirty names, show count)
 *   node scripts/ai-clean-names.js --dry-run            (preview AI-cleaned names)
 *   node scripts/ai-clean-names.js --apply              (apply changes to database)
 *   node scripts/ai-clean-names.js --dry-run --all      (process ALL products, not just flagged)
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
  console.error('Missing required env vars');
  process.exit(1);
}

const args = process.argv.slice(2);
const mode = args.find(a => ['--scan', '--dry-run', '--apply'].includes(a));
const processAll = args.includes('--all');

if (!mode) {
  console.log('Usage:');
  console.log('  node scripts/ai-clean-names.js --scan          (find dirty names)');
  console.log('  node scripts/ai-clean-names.js --dry-run       (preview cleaned names)');
  console.log('  node scripts/ai-clean-names.js --apply         (apply to database)');
  console.log('  Add --all to process ALL products, not just flagged ones');
  process.exit(0);
}

// --- Patterns that indicate a dirty name ---
const DIRTY_PATTERNS = [
  // Shipping/fulfillment instructions
  /not shipped/i,
  /amazon shipping/i,
  /walmart/i,
  /amazon/i,
  /free shipping/i,
  /fast delivery/i,
  /drop ?ship/i,
  /pickup only/i,
  /weekends?/i,
  /business days?/i,
  // Platform/marketplace references
  /shopify/i,
  /ebay/i,
  /aliexpress/i,
  /ali ?baba/i,
  /wish\.com/i,
  /temu/i,
  // Dimensions/specs in name (like 84x43x62)
  /\d+x\d+x\d+/,
  /\d+\.\d+\s*inches?\s*x/i,
  /\d+\s*inches?\s*x\s*\d+/i,
  // Overly technical/manufacturer junk
  /\b[A-Z]{2,}\d{3,}\b/,  // codes like TMX200, EG0010TX
  /\bsku\b/i,
  /\bmodel\s*#/i,
  /\boem\b/i,
  // Quantity prefixes that shouldn't be in name
  /^\d+\s*(pcs?|pieces?|pack|sets?|pairs?)\s/i,
  /\bx\d+\b/,  // x100, x50
  // Weight/measurement specs
  /\b\d+\.\d+mm\b/,
  /\b0\.\d+mm\b/,
  // Comma-heavy names (usually CJ garbage)
  // Names with 4+ commas
];

function isDirtyName(name) {
  // Check patterns
  for (const pattern of DIRTY_PATTERNS) {
    if (pattern.test(name)) return true;
  }
  // Name is very long (over 80 chars usually means CJ junk)
  if (name.length > 80) return true;
  // Has 4+ commas (usually specs dumped into name)
  if ((name.match(/,/g) || []).length >= 4) return true;
  return false;
}

// --- Supabase helpers ---
async function supabaseFetch(table, query = '') {
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

// --- Claude API call ---
async function cleanNamesBatch(products) {
  const productList = products.map((p, i) => `${i + 1}. "${p.name}"`).join('\n');

  const prompt = `You are a product name editor for a premium e-commerce store called MooreItems. Clean up these product names following these rules:

1. Remove shipping/fulfillment instructions (e.g., "Not Shipped On Weekends", "Amazon Shipping")
2. Remove platform references (Amazon, WalMart, Shopify, eBay, etc.)
3. Remove excessive dimensions/specs from the name (keep one key spec if it defines the product, like screen size)
4. Remove manufacturer codes (TMX200, EG0010TX, etc.) unless they're a recognizable model name
5. Remove quantity prefixes unless the product IS a multi-pack
6. Keep the name descriptive but concise (aim for 30-70 characters)
7. Use Title Case
8. Keep key product attributes that help shoppers (color, material, size category)
9. Make it sound like something you'd see on Nordstrom or Target, not AliExpress
10. If the name is already clean and professional, return it unchanged

Products to clean:
${productList}

Respond ONLY with a JSON array of objects:
[{"index": 1, "name": "Cleaned Product Name"}, ...]

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
      max_tokens: 4000,
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
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('Failed to parse Claude response:', text.substring(0, 200));
    return null;
  }
}

// --- Slug generator ---
function generateSlug(name, existingSlug) {
  // Keep the random suffix from the existing slug if present
  const suffix = existingSlug.match(/-([a-z0-9]{4})$/)?.[1] || '';
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);
  return suffix ? `${base}-${suffix}` : base;
}

// --- Main ---
async function main() {
  console.log(`=== AI Product Name Cleanup ===`);
  console.log(`Mode: ${mode.replace('--', '').toUpperCase()}${processAll ? ' (ALL PRODUCTS)' : ''}\n`);

  // Fetch all active products
  let offset = 0;
  let allProducts = [];
  while (true) {
    const batch = await supabaseFetch(
      'mi_products',
      `select=id,name,slug,cj_pid&status=eq.active&order=name.asc&limit=1000&offset=${offset}`
    );
    if (!batch.length) break;
    allProducts = [...allProducts, ...batch];
    offset += 1000;
  }

  console.log(`Total active products: ${allProducts.length}`);

  // Filter to dirty names (unless --all)
  let dirtyProducts;
  if (processAll) {
    dirtyProducts = allProducts;
  } else {
    dirtyProducts = allProducts.filter(p => isDirtyName(p.name));
  }

  console.log(`Products to clean: ${dirtyProducts.length}\n`);

  if (mode === '--scan') {
    // Just show the dirty names
    console.log('=== Dirty Names Found ===');
    dirtyProducts.forEach((p, i) => {
      console.log(`  ${i + 1}. "${p.name}"`);
    });
    console.log(`\nTotal: ${dirtyProducts.length}`);
    console.log('Run with --dry-run to preview AI-cleaned names');
    return;
  }

  if (dirtyProducts.length === 0) {
    console.log('All product names look clean!');
    return;
  }

  // Process in batches of 30
  const BATCH_SIZE = 30;
  let cleaned = 0;
  let unchanged = 0;
  let failed = 0;

  for (let i = 0; i < dirtyProducts.length; i += BATCH_SIZE) {
    const batch = dirtyProducts.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(dirtyProducts.length / BATCH_SIZE);
    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} products)...`);

    const results = await cleanNamesBatch(batch);
    if (!results) {
      console.error('  Batch failed, skipping');
      failed += batch.length;
      continue;
    }

    for (const item of results) {
      const product = batch[item.index - 1];
      if (!product) continue;

      const newName = item.name.trim();
      const oldName = product.name;

      if (newName === oldName) {
        unchanged++;
        continue;
      }

      const newSlug = generateSlug(newName, product.slug);

      if (mode === '--dry-run') {
        console.log(`  "${oldName}"`);
        console.log(`  → "${newName}"`);
        console.log('');
      } else {
        // Apply
        const ok = await supabaseUpdate('mi_products', product.id, {
          name: newName,
          slug: newSlug,
        });
        if (ok) {
          console.log(`  ✓ "${oldName}" → "${newName}"`);
        } else {
          console.log(`  ✗ Failed: "${oldName}"`);
          failed++;
          continue;
        }
      }
      cleaned++;
    }

    // Delay between batches
    if (i + BATCH_SIZE < dirtyProducts.length) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Cleaned: ${cleaned}`);
  console.log(`Unchanged: ${unchanged}`);
  console.log(`Failed: ${failed}`);

  if (mode === '--dry-run') {
    console.log(`\nThis was a dry run. Run with --apply to save changes.`);
  } else {
    console.log(`\nDone! Names updated in database.`);
  }
}

main().catch(console.error);