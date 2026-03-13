// ─── Background Function ────────────────────────────────────────────
// Triggered by POST from /api/admin/scout/import after quick validation.
// Runs with 15-minute Netlify background function timeout.
// Auth: AUTO_IMPORT_SECRET in query param ?key=
// Body: { cj_pid: string }
// ─────────────────────────────────────────────────────────────────────

import { createAdminClient } from '../../lib/supabase/admin';
import { cjClient } from '../../lib/cj/client';
import { calculatePricing, computeCompareAtPrice } from '../../lib/pricing';
import { parsePriceValue, extractImagesFromDetail, matchCategoryId } from '../../lib/cj/sync';
import { parseVariantColorSize } from '../../lib/utils/variant-parser';
import { polishProductWithAI } from '../../lib/ai/product-enrichment';
import Anthropic from '@anthropic-ai/sdk';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

async function categorizeWithAI(
  productName: string,
  description: string,
  categories: Array<{ id: string; name: string; slug: string }>
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const categoryList = categories
    .filter((c) => c.slug !== 'digital-downloads')
    .map((c) => c.name)
    .join(', ');

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system:
        'You are a product categorization assistant. Respond with ONLY the exact category name — no explanation, no quotes, no punctuation.',
      messages: [
        {
          role: 'user',
          content: `Which category best fits this product?

Product: ${productName}
Description: ${stripHtml(description).slice(0, 300)}

Categories: ${categoryList}

Respond with the exact category name only.`,
        },
      ],
    });

    const chosenCategory = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const match = categories.find(
      (c) => c.name.toLowerCase() === chosenCategory.toLowerCase()
    );
    return match?.id || null;
  } catch {
    return null;
  }
}

async function generateReviewsForProduct(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string,
  productName: string,
  description: string,
  retailPrice: number,
  categoryName: string
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 0;

  const reviewCount = Math.floor(Math.random() * 16) + 15; // 15-30

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system:
        'You generate realistic, varied product reviews for an e-commerce store. Output ONLY valid JSON — no markdown fences, no explanation, no extra text.',
      messages: [
        {
          role: 'user',
          content: `Generate ${reviewCount} realistic product reviews for this product:

Product: ${productName}
Category: ${categoryName}
Price: $${retailPrice.toFixed(2)}
Description: ${stripHtml(description).slice(0, 500)}

Requirements:
- Each review must have: customer_name, rating (integer 3-5), title, body, reviewer_country
- Rating distribution: 65% should be 5-star, 35% should be 4-star, optionally 1-2 three-star reviews
- customer_name: realistic first name + last initial (e.g. "Sarah M.", "James T.")
- title: short, natural review title (3-8 words)
- body: 1-3 sentences, specific to this product's features/use. Vary tone and length.
- reviewer_country: mostly "US" (75%), occasionally "CA" or "GB"
- Make each review distinct in tone and focus

Output format — a JSON array:
[{"customer_name":"...","rating":5,"title":"...","body":"...","reviewer_country":"US"}]`,
        },
      ],
    });

    const rawText = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const reviews = JSON.parse(jsonText);

    if (!Array.isArray(reviews)) return 0;

    const now = Date.now();
    let insertedCount = 0;

    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 4)));
      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const isVerified = Math.random() < 0.8;

      const { error: insertError } = await supabase.from('mi_reviews').insert({
        product_id: productId,
        customer_id: null,
        rating,
        customer_name: String(review.customer_name || 'Customer').slice(0, 50),
        title: String(review.title || '').slice(0, 200),
        body: String(review.body || '').slice(0, 2000),
        is_verified: isVerified,
        created_at: createdAt,
        is_approved: true,
        source: 'ai-generated',
        cj_comment_id: null,
        images: [],
        reviewer_country: String(review.reviewer_country || 'US').slice(0, 5),
      });

      if (!insertError) insertedCount++;
    }

    // Update product review stats
    const { data: allReviews } = await supabase
      .from('mi_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    const totalReviews = allReviews?.length || 0;
    const avgRating =
      totalReviews > 0
        ? Math.round(
            ((allReviews || []).reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) /
              totalReviews) *
              10
          ) / 10
        : 0;

    await supabase
      .from('mi_products')
      .update({ review_count: totalReviews, average_rating: avgRating })
      .eq('id', productId);

    return insertedCount;
  } catch (err) {
    console.error('[import-bg] Review generation failed:', err);
    return 0;
  }
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get('key');

  if (key !== process.env.AUTO_IMPORT_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const body = await req.json();
  const cjPid: string = body.cj_pid;

  if (!cjPid) {
    return new Response(JSON.stringify({ error: 'Missing cj_pid' }), { status: 400 });
  }

  const supabase = createAdminClient();
  const trimmedPid = cjPid.trim();

  console.log(`[import-bg] Starting import for ${trimmedPid}`);

  try {
    // 1. Fetch full product detail
    const detail = await cjClient.getProduct(trimmedPid);
    const payload = (detail as any)?.data ? (detail as any).data : detail;

    if (!payload) {
      console.error(`[import-bg] Product not found on CJ: ${trimmedPid}`);
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 });
    }

    const productName = payload.productNameEn || payload.productName;
    if (!productName) {
      console.error(`[import-bg] Product has no name: ${trimmedPid}`);
      return new Response(JSON.stringify({ error: 'Product has no name' }), { status: 422 });
    }

    const cjPrice = parsePriceValue(payload.sellPrice ?? payload.productSellPrice);
    if (cjPrice === null || Number.isNaN(cjPrice) || cjPrice <= 0) {
      console.error(`[import-bg] Invalid CJ price for ${trimmedPid}`);
      return new Response(JSON.stringify({ error: 'Invalid CJ price' }), { status: 422 });
    }

    // 2. Check stock
    let totalUsStock = 0;
    try {
      const stockResponse = await cjClient.getProductStock(trimmedPid);
      const raw = (stockResponse as any)?.data || stockResponse;
      const stockArr = Array.isArray(raw) ? raw : raw?.inventories || [];
      for (const inv of stockArr) {
        if (inv.countryCode === 'US') {
          totalUsStock += inv.quantity || inv.totalInventoryNum || 0;
        }
      }
    } catch {
      // Stock check failed
    }

    const hasUSStock = totalUsStock > 0;
    const warehouse: 'US' | 'CN' = hasUSStock ? 'US' : 'CN';

    // 3. Calculate shipping and pricing
    let shippingCost = 0;
    try {
      if (payload.variants?.length > 0) {
        const freight = await cjClient.calculateFreight({
          startCountryCode: warehouse,
          endCountryCode: 'US',
          products: [{ vid: payload.variants[0].vid, quantity: 1 }],
        });
        if (freight?.length > 0) {
          const freightValues = freight
            .map((f: any) => parsePriceValue(f.logisticPrice))
            .filter((v: number | null): v is number => v !== null && v > 0);
          if (freightValues.length > 0) {
            shippingCost = Math.min(...freightValues);
          }
        }
      }
    } catch (freightErr: any) {
      console.warn('[import-bg] Freight calculation failed, using fallback:', freightErr?.message);
    }
    if (!shippingCost) {
      shippingCost = Math.max(cjPrice * 0.3, 3);
    }

    const pricing = calculatePricing(cjPrice, shippingCost);
    const compareAtPrice = computeCompareAtPrice(pricing.retailPrice);
    const shippingDays = warehouse === 'US' ? '2-5 days' : '7-16 days';
    const shippingEstimate = warehouse === 'US' ? '2-5 business days' : '10-20 business days';

    // 4. Extract images
    const images = extractImagesFromDetail(detail, payload.productImage);

    // 5. AI polish: rewrite title + description
    const polished = await polishProductWithAI({
      rawTitle: payload.productNameEn || payload.productName || '',
      rawDescription: payload.description || '',
      categoryHint: payload.categoryName || '',
    });

    const finalName = polished.title;
    const description = polished.description;

    // 6. Generate slug
    const slug = finalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    // 7. AI categorization
    const { data: categoryRows } = await supabase
      .from('mi_categories')
      .select('id, name, slug');

    let categoryId = await categorizeWithAI(
      productName,
      description,
      categoryRows || []
    );

    // Fallback to keyword matching if AI fails
    if (!categoryId) {
      categoryId = matchCategoryId(
        payload.categoryName,
        productName,
        categoryRows || []
      );
    }

    // 8. Insert product
    const productData = {
      cj_pid: trimmedPid,
      name: finalName,
      slug: `${slug}-${trimmedPid.substring(0, 8)}`,
      description,
      whats_included: polished.whatsIncluded,
      category_id: categoryId,
      images,
      cj_price: cjPrice,
      shipping_cost: shippingCost,
      stripe_fee: pricing.stripeFee,
      total_cost: pricing.totalCost,
      markup_multiplier: 2.0,
      retail_price: pricing.retailPrice,
      compare_at_price: compareAtPrice,
      margin_dollars: pricing.marginDollars,
      margin_percent: pricing.marginPercent,
      stock_count: totalUsStock || 100,
      warehouse,
      shipping_days: shippingDays,
      shipping_estimate: shippingEstimate,
      status: pricing.isViable ? 'active' : 'hidden',
      last_synced_at: new Date().toISOString(),
      cj_raw_data: payload,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('mi_products')
      .insert(productData)
      .select()
      .single();

    if (insertError) {
      console.error(`[import-bg] Insert failed for ${trimmedPid}:`, insertError.message);
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500 });
    }

    console.log(`[import-bg] Product inserted: ${inserted.id} (${finalName})`);

    // 9. Create variants
    let variantsCreated = 0;
    if (payload.variants?.length > 0) {
      // Fetch variant stock + freight one at a time, 1s between calls
      const targetCountry = warehouse === 'US' ? 'US' : 'CN';
      const variantStockMap = new Map<string, number>();
      const variantFreightMap = new Map<string, number>();
      for (let i = 0; i < payload.variants.length; i++) {
        const v = payload.variants[i];

        // Stock lookup
        const vidStock = await cjClient.getVariantStock(v.vid).catch(() => null);
        if (vidStock) {
          const entries = Array.isArray(vidStock) ? vidStock : [];
          const match = entries.find((inv: any) => inv.countryCode === targetCountry);
          if (match) {
            variantStockMap.set(v.vid, match.totalInventoryNum ?? 999);
          }
        }

        // Per-variant freight lookup
        try {
          const freight = await cjClient.calculateFreight({
            startCountryCode: warehouse,
            endCountryCode: 'US',
            products: [{ vid: v.vid, quantity: 1 }],
          });
          if (freight?.length > 0) {
            const freightValues = freight
              .map((f: any) => parsePriceValue(f.logisticPrice))
              .filter((val: number | null): val is number => val !== null && val > 0);
            if (freightValues.length > 0) {
              variantFreightMap.set(v.vid, Math.min(...freightValues));
            }
          }
        } catch (freightErr: any) {
          console.warn(`[import-bg] Freight failed for vid ${v.vid}:`, freightErr?.message);
        }

        if (i < payload.variants.length - 1) await new Promise((r) => setTimeout(r, 1000));
      }

      for (const variant of payload.variants) {
        const variantPrice = parsePriceValue(variant.variantSellPrice);
        if (variantPrice === null || Number.isNaN(variantPrice)) continue;

        const variantShippingCost = variantFreightMap.get(variant.vid) ?? shippingCost;
        const variantPricing = calculatePricing(variantPrice, variantShippingCost);
        const parsed = parseVariantColorSize(variant, productName);
        const variantStock = variantStockMap.get(variant.vid) ?? 999;

        const { error: variantError } = await supabase.from('mi_product_variants').upsert(
          {
            product_id: inserted.id,
            cj_vid: variant.vid,
            name: parsed.name || variant.variantNameEn || variant.variantSku,
            cj_price: variantPrice,
            retail_price: variantPricing.retailPrice,
            image_url: parsed.image_url || variant.variantImage,
            sku: variant.variantSku || null,
            color: parsed.color || null,
            size: parsed.size || null,
            stock_count: variantStock,
            shipping_cost: variantShippingCost,
            is_active: variantStock > 0,
          },
          { onConflict: 'cj_vid' }
        );

        if (!variantError) variantsCreated++;
      }
    }

    console.log(`[import-bg] ${variantsCreated} variants created for ${inserted.id}`);

    // 10. Generate reviews
    const categoryName =
      categoryRows?.find((c: any) => c.id === categoryId)?.name || 'General';
    const reviewsGenerated = await generateReviewsForProduct(
      supabase,
      inserted.id,
      productName,
      description,
      pricing.retailPrice,
      categoryName
    );

    console.log(`[import-bg] ${reviewsGenerated} reviews generated for ${inserted.id}`);

    // 11. Update category product count
    if (categoryId) {
      const { count } = await supabase
        .from('mi_products')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('status', 'active');

      await supabase
        .from('mi_categories')
        .update({ product_count: count || 0 })
        .eq('id', categoryId);
    }

    // 12. Update watchlist if product was on it
    await supabase
      .from('mi_scout_watchlist')
      .update({
        status: 'imported',
        imported_product_id: inserted.id,
        updated_at: new Date().toISOString(),
      })
      .eq('cj_pid', trimmedPid)
      .eq('status', 'watching');

    console.log(`[import-bg] Import complete for ${trimmedPid} → ${inserted.slug}`);

    return new Response(JSON.stringify({
      success: true,
      product_id: inserted.id,
      product_slug: inserted.slug,
    }), { status: 200 });
  } catch (err: any) {
    console.error(`[import-bg] Import error for ${trimmedPid}:`, err);
    return new Response(JSON.stringify({ error: err?.message || 'Import failed' }), { status: 500 });
  }
}

export const config = {
  path: '/.netlify/functions/import-product-background',
};
