/**
 * Generate descriptions for active products with NULL/empty description.
 * Uses Claude Haiku to write marketing copy, same pattern as bulk-polish.js.
 *
 * Usage:
 *   node scripts/fix-missing-descriptions.js
 *   node scripts/fix-missing-descriptions.js --dry-run
 *   node scripts/fix-missing-descriptions.js --limit 50
 */

require('dotenv').config({ path: '.env.local' });
const Anthropic = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !ANTHROPIC_KEY) {
  console.error('Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const limitArg = args.find((a) => a.startsWith('--limit'));
const LIMIT = limitArg ? Number(args[args.indexOf(limitArg) + 1]) || 20 : 20;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractJson(text) {
  if (!text) return null;
  const cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function buildDescriptionPrompt(product, categoryName) {
  return `You are a product copywriter for MooreItems.com, a curated online store.

Product Name: ${product.name}
Category: ${categoryName}
Price: $${Number(product.retail_price || 0).toFixed(2)}

Write a product description in 2-3 short paragraphs of marketing copy. Be specific about features and benefits based on the product name. Don't use generic filler. Don't mention shipping, returns, or warranty. Don't use ALL CAPS. Don't include specs tables — just flowing prose.

Respond in this exact JSON format (no markdown, no backticks):
{"description": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3"}`;
}

async function callHaiku(prompt) {
  const MAX_RETRIES = 3;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });
      return response;
    } catch (error) {
      const status = error?.status || error?.statusCode;
      if (status === 429 && attempt < MAX_RETRIES - 1) {
        console.warn('  Rate limited. Waiting 30s...');
        await sleep(30000);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
  return null;
}

async function main() {
  console.log(`=== Fix Missing Descriptions ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  console.log(`Limit: ${LIMIT} products\n`);

  // Fetch category map
  const { data: categories } = await supabase.from('mi_categories').select('id, name');
  const categoryMap = {};
  (categories || []).forEach((c) => { categoryMap[c.id] = c.name; });

  // Fetch products with missing descriptions
  const { data: products, error } = await supabase
    .from('mi_products')
    .select('id, name, retail_price, category_id, description')
    .eq('status', 'active')
    .or('description.is.null,description.eq.')
    .order('name', { ascending: true })
    .limit(LIMIT);

  if (error) {
    console.error('Query error:', error.message);
    process.exit(1);
  }

  console.log(`Found ${products.length} products with missing descriptions.\n`);

  if (products.length === 0) {
    console.log('Nothing to do!');
    return;
  }

  if (DRY_RUN) {
    products.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (${categoryMap[p.category_id] || 'Uncategorized'})`);
    });
    console.log(`\nDry run complete. ${products.length} products would be updated.`);
    return;
  }

  let updated = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const categoryName = categoryMap[product.category_id] || 'Uncategorized';

    try {
      const prompt = buildDescriptionPrompt(product, categoryName);
      const response = await callHaiku(prompt);
      const text = response?.content?.[0]?.text?.trim() || '';
      const json = extractJson(text);
      const description = (json?.description || '').trim();

      if (!description) {
        console.log(`[${i + 1}/${products.length}] "${product.name}" — no description generated, skipping`);
        errors++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('mi_products')
        .update({ description })
        .eq('id', product.id);

      if (updateError) throw new Error(updateError.message);

      updated++;
      console.log(`[${i + 1}/${products.length}] "${product.name}" — ${description.length} chars`);
    } catch (err) {
      errors++;
      console.log(`[${i + 1}/${products.length}] "${product.name}" — ERROR: ${err.message}`);
    }

    await sleep(500);
  }

  console.log('\n════════════════════════════════════');
  console.log(`Done! Updated: ${updated}, Errors: ${errors}`);
  console.log('════════════════════════════════════');
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
