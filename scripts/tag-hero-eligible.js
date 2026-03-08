/**
 * Tag Hero-Eligible Products
 * Uses Claude Haiku vision to evaluate each product's primary image
 * and tag it as hero-eligible or not for the homepage hero grid.
 *
 * Usage:
 *   node scripts/tag-hero-eligible.js --dry-run   (preview only)
 *   node scripts/tag-hero-eligible.js --apply      (apply changes)
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
  console.log('Usage: node scripts/tag-hero-eligible.js --dry-run|--apply');
  process.exit(0);
}

const isDryRun = mode === '--dry-run';

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

// --- Claude Vision API call ---
async function evaluateImage(productName, imageUrl) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'url', url: imageUrl },
          },
          {
            type: 'text',
            text: `You are evaluating whether this product image is suitable for a homepage hero grid on a premium e-commerce store. The product name is: "${productName}"

A GOOD hero image is: a clear lifestyle or product photo showing the actual item attractively — clean background, good lighting, visually appealing at large size.

A BAD hero image is: a spec diagram, technical drawing, dimension chart, size chart, infographic, text-heavy graphic, collage of tiny images, screenshot, blurry/low-quality photo, or an image that would look ugly or confusing when displayed large on a homepage.

Respond with ONLY a JSON object, no markdown, no explanation:
{"eligible": true, "reason": "one short sentence"}
or
{"eligible": false, "reason": "one short sentence"}`,
          },
        ],
      }],
    }),
  });

  const data = await res.json();
  if (!data.content || !data.content[0]) {
    console.error('  Claude API error:', JSON.stringify(data));
    return null;
  }

  const text = data.content[0].text.trim();
  try {
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(clean);
  } catch (e) {
    console.error('  Failed to parse Claude response:', text);
    return null;
  }
}

// --- Main ---
async function main() {
  console.log(`=== Tag Hero-Eligible Products ===`);
  console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'APPLY'}\n`);

  // Fetch active products where hero_eligible is null
  const products = await supabaseGet(
    'mi_products',
    'select=id,name,images&status=eq.active&hero_checked_at=is.null&images=not.is.null&limit=2000'
  );

  console.log(`Found ${products.length} products to evaluate\n`);

  if (products.length === 0) {
    console.log('Nothing to evaluate!');
    return;
  }

  // Filter to products that actually have image arrays with entries
  const withImages = products.filter(p => Array.isArray(p.images) && p.images.length > 0);
  console.log(`${withImages.length} products have at least one image\n`);

  const BATCH_SIZE = 5;
  const BATCH_DELAY = 15000; // 15 seconds
  let eligible = 0;
  let notEligible = 0;
  let errors = 0;

  for (let i = 0; i < withImages.length; i += BATCH_SIZE) {
    const batch = withImages.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(withImages.length / BATCH_SIZE);
    console.log(`--- Batch ${batchNum}/${totalBatches} (${batch.length} products) ---`);

    for (const product of batch) {
      const imageUrl = product.images[0];
      const result = await evaluateImage(product.name, imageUrl);

      if (!result) {
        console.log(`  ERROR: "${product.name}"`);
        errors++;
        continue;
      }

      const tag = result.eligible ? 'PASS' : 'FAIL';
      console.log(`  ${tag}: "${product.name}" — ${result.reason}`);

      if (!isDryRun) {
        const ok = await supabaseUpdate('mi_products', product.id, {
          hero_eligible: result.eligible,
          hero_checked_at: new Date().toISOString(),
        });
        if (!ok) {
          console.error(`    DB update failed for ${product.id}`);
          errors++;
          continue;
        }
      }

      if (result.eligible) {
        eligible++;
      } else {
        notEligible++;
      }
    }

    // Delay between batches
    if (i + BATCH_SIZE < withImages.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }

  console.log(`\n=== Summary ===`);
  console.log(`Eligible: ${eligible}`);
  console.log(`Not eligible: ${notEligible}`);
  console.log(`Errors: ${errors}`);

  if (isDryRun) {
    console.log(`\nThis was a dry run. Run with --apply to make changes.`);
  } else {
    console.log(`\nDone! hero_eligible column updated in database.`);
  }
}

main().catch(console.error);
