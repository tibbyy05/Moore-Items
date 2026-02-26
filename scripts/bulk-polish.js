/**
 * Bulk Product Polish Script
 * Cleans product names/descriptions and generates reviews for products needing polish.
 *
 * Usage:
 *   node scripts/bulk-polish.js
 *   node scripts/bulk-polish.js --reset
 *   node scripts/bulk-polish.js --dry-run
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
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
const RESET = args.includes('--reset');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

const PROGRESS_PATH = path.join(__dirname, '.bulk-polish-progress.json');
const PAGE_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 500;
const MAX_RETRIES = 3;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadProgress() {
  if (RESET && fs.existsSync(PROGRESS_PATH)) {
    fs.unlinkSync(PROGRESS_PATH);
  }
  if (!fs.existsSync(PROGRESS_PATH)) {
    return {
      started: new Date().toISOString(),
      lastProcessedId: null,
      processed: 0,
      skipped: 0,
      errors: 0,
      errorIds: [],
    };
  }
  try {
    const raw = fs.readFileSync(PROGRESS_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {
      started: new Date().toISOString(),
      lastProcessedId: null,
      processed: 0,
      skipped: 0,
      errors: 0,
      errorIds: [],
    };
  }
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
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

async function callAnthropic(prompt) {
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });
      return response;
    } catch (error) {
      const status = error?.status || error?.statusCode;
      if (status === 429 && attempt < MAX_RETRIES - 1) {
        console.warn('Rate limited by Anthropic. Waiting 30s before retry...');
        await sleep(30000);
        attempt += 1;
        continue;
      }
      throw error;
    }
  }
  return null;
}

function randomCountry() {
  const r = Math.random();
  if (r < 0.75) return 'US';
  if (r < 0.85) return 'CA';
  if (r < 0.93) return 'GB';
  if (r < 0.97) return 'AU';
  return 'DE';
}

function randomDateWithin60Days() {
  const daysAgo = Math.floor(1 + Math.random() * 59);
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 14) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

function buildCopyPrompt(product, categoryName) {
  return `You are a product copywriter for MooreItems.com, a curated online store.

Product Name: ${product.name}
Category: ${categoryName}
Price: $${Number(product.retail_price || 0).toFixed(2)}
Current Description: ${product.description || 'None'}

Tasks:
1. CLEAN THE NAME: Remove any manufacturer codes, shipping instructions, platform references, dimensions, or specs from the name. Keep it concise and customer-friendly (max 80 chars). If the name is already clean, return it unchanged.

2. WRITE A DESCRIPTION: Write 2-3 short paragraphs of marketing copy. Be specific about features and benefits. Don't use generic filler. Don't mention shipping, returns, or warranty. Don't use ALL CAPS. Don't include specs tables — just flowing prose.

Respond in this exact JSON format (no markdown, no backticks):
{"name": "cleaned product name", "description": "paragraph 1\\n\\nparagraph 2\\n\\nparagraph 3"}`;
}

function buildReviewsPrompt(product, categoryName, cleanedName) {
  return `Generate 3-5 realistic product reviews for:
Product: ${cleanedName}
Category: ${categoryName}  
Price: $${Number(product.retail_price || 0).toFixed(2)}

Rules:
- Ratings: mix of 4 and 5 stars (65% five-star, 35% four-star)
- Names: realistic first name + last initial ("Sarah M.", "James T.")
- Length: 1-3 sentences each, varied
- Tone: genuine customer voice, mention specific features
- 80% should have verified: true

Respond in JSON array format (no markdown, no backticks):
[{"rating": 5, "title": "...", "content": "...", "reviewer_name": "...", "verified": true}]`;
}

async function fetchProductsNeedingPolish(lastId = null) {
  let query = supabase
    .from('mi_products')
    .select('id,name,description,review_count,retail_price,category_id')
    .eq('status', 'active')
    .order('id', { ascending: true })
    .limit(PAGE_SIZE);

  if (lastId) {
    query = query.gt('id', lastId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Fetch error:', error);
    throw new Error('Failed to fetch products');
  }
  return data || [];
}

function needsPolish(product) {
  if (!product.review_count || product.review_count === 0) return true;
  if (!product.description || product.description.trim() === '') return true;
  if (/<(div|span|table|tr|td)/i.test(product.description)) return true;
  if (/shopee|aliexpress|wholesale/i.test(product.description)) return true;
  return false;
}

async function fetchCategoryMap() {
  const { data, error } = await supabase
    .from('mi_categories')
    .select('id,name');

  if (error) {
    console.error('Failed to load categories:', error);
    throw new Error('Failed to load categories');
  }

  const map = {};
  (data || []).forEach((cat) => {
    map[cat.id] = cat.name;
  });
  return map;
}

async function updateProduct(productId, update) {
  const { error } = await supabase
    .from('mi_products')
    .update(update)
    .eq('id', productId);

  if (error) throw new Error('Failed to update product: ' + error.message);
}

async function insertReviews(reviews) {
  const { error } = await supabase
    .from('mi_reviews')
    .insert(reviews);

  if (error) throw new Error('Failed to insert reviews: ' + error.message);
}

async function processProduct(product, categoryName) {
  const copyPrompt = buildCopyPrompt(product, categoryName);
  const copyResponse = await callAnthropic(copyPrompt);
  const copyText = copyResponse?.content?.[0]?.text?.trim() || '';
  const copyJson = extractJson(copyText);

  const cleanedName = (copyJson?.name || '').trim();
  const cleanedDescription = (copyJson?.description || '').trim();

  let update = {};
  if (cleanedName && cleanedName !== product.name) {
    update.name = cleanedName;
  }
  if (cleanedDescription && cleanedDescription !== product.description) {
    update.description = cleanedDescription;
  }

  const needsReviews = product.review_count == null || product.review_count === 0;
  let reviewsToInsert = [];

  if (needsReviews) {
    const reviewPrompt = buildReviewsPrompt(product, categoryName, cleanedName || product.name);
    const reviewResponse = await callAnthropic(reviewPrompt);
    const reviewText = reviewResponse?.content?.[0]?.text?.trim() || '';
    const reviewJson = extractJson(reviewText);

    if (Array.isArray(reviewJson)) {
      reviewsToInsert = reviewJson
        .filter((review) => review && review.rating && review.content && review.reviewer_name)
        .slice(0, 5)
        .map((review) => ({
          product_id: product.id,
          rating: Number(review.rating),
          title: review.title || '',
          content: review.content,
          reviewer_name: review.reviewer_name,
          verified: !!review.verified,
          source: 'ai-generated',
          country: randomCountry(),
          review_date: randomDateWithin60Days(),
        }));
    }
  }

  const hasUpdates = Object.keys(update).length > 0;
  const hasReviews = reviewsToInsert.length > 0;

  if (!hasUpdates && !hasReviews) {
    return { status: 'skipped', updatedFields: [], reviewCount: 0 };
  }

  if (!DRY_RUN) {
    if (hasUpdates) {
      await updateProduct(product.id, update);
    }
    if (hasReviews) {
      await insertReviews(reviewsToInsert);
      const totalRating = reviewsToInsert.reduce((sum, r) => sum + Number(r.rating || 0), 0);
      const avgRating = reviewsToInsert.length ? totalRating / reviewsToInsert.length : 0;
      await updateProduct(product.id, {
        review_count: reviewsToInsert.length,
        average_rating: Number(avgRating.toFixed(2)),
      });
    }
  }

  return {
    status: 'processed',
    updatedFields: Object.keys(update),
    reviewCount: reviewsToInsert.length,
  };
}

async function main() {
  const progress = loadProgress();
  const lastProcessedId = progress.lastProcessedId || null;

  console.log(`=== Bulk Product Polish ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  if (lastProcessedId) {
    console.log(`Resuming after product ID ${lastProcessedId}`);
  }

  const categoryMap = await fetchCategoryMap();

  let matchIndex = 0;
  let scanLastId = lastProcessedId;
  let batchCount = 0;
  let totalMatched = 0;

  while (true) {
    const batch = await fetchProductsNeedingPolish(scanLastId);
    batchCount += 1;
    if (!batch.length) break;

    const matches = batch.filter(needsPolish);
    totalMatched += matches.length;

    if (DRY_RUN) {
      scanLastId = batch[batch.length - 1].id;
      if (batch.length < PAGE_SIZE) break;
      continue;
    }

    for (const product of matches) {
      const categoryName = categoryMap[product.category_id] || 'Uncategorized';
      const displayName = product.name || 'Unnamed Product';
      const currentIndex = matchIndex + 1;

      try {
        const result = await processProduct(product, categoryName);
        if (result.status === 'processed') {
          progress.processed += 1;
          const updates = result.updatedFields.length
            ? result.updatedFields.map((f) => f.replace('_', ' ')).join(', ')
            : 'no field changes';
          const reviewMsg = result.reviewCount > 0 ? `${result.reviewCount} reviews added` : 'no reviews';
          console.log(
            `[${currentIndex}] Polishing "${displayName}"... ✅ ${updates}, ${reviewMsg}`
          );
        } else {
          progress.skipped += 1;
          console.log(
            `[${currentIndex}] Polishing "${displayName}"... ⏭️ skipped (already polished)`
          );
        }
      } catch (error) {
        progress.errors += 1;
        progress.errorIds = Array.isArray(progress.errorIds) ? progress.errorIds : [];
        progress.errorIds.push(product.id);
        console.log(
          `[${currentIndex}] Polishing "${displayName}"... ❌ error`
        );
        console.error(error);
      }

      matchIndex += 1;
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    // Update resume pointer after scanning the full batch
    scanLastId = batch[batch.length - 1].id;
    progress.lastProcessedId = scanLastId;
    saveProgress(progress);

    if (matchIndex > 0 && matchIndex % 50 === 0) {
      console.log(
        `[${matchIndex}] Progress: ${progress.processed} polished, ${progress.skipped} skipped, ${progress.errors} errors`
      );
    }

    if (batch.length < PAGE_SIZE) break;
  }

  if (DRY_RUN) {
    console.log(`\nDry run complete. Products needing polish: ${totalMatched}`);
    return;
  }

  console.log('\n=== Done ===');
  console.log(`Processed: ${progress.processed}`);
  console.log(`Skipped: ${progress.skipped}`);
  console.log(`Errors: ${progress.errors}`);
  if (progress.errors > 0) {
    console.log(`Error IDs: ${progress.errorIds.join(', ')}`);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
