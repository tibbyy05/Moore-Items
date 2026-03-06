import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { calculatePricing, computeCompareAtPrice } from '@/lib/pricing';
import { parsePriceValue, extractImagesFromDetail } from '@/lib/cj/sync';
import { parseVariantColorSize } from '@/lib/utils/variant-parser';
import { PRICING_CONFIG } from '@/lib/config/pricing';
import Anthropic from '@anthropic-ai/sdk';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { supabase, error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { supabase, error: null };
}

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
  supabase: any,
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
    console.error('[scout] Review generation failed:', err);
    return 0;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;
    const body = await request.json();
    const { cj_pid } = body;

    if (!cj_pid || typeof cj_pid !== 'string') {
      return NextResponse.json({ error: 'Missing CJ product ID' }, { status: 400 });
    }

    const trimmedPid = cj_pid.trim();

    // Check if product already exists
    const { data: existing } = await supabase
      .from('mi_products')
      .select('id, name, slug')
      .eq('cj_pid', trimmedPid)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: `Product already exists: ${existing.name}`,
          product_id: existing.id,
          product_slug: existing.slug,
        },
        { status: 409 }
      );
    }

    // 1. Fetch full product detail
    const detail = await cjClient.getProduct(trimmedPid);
    const payload = (detail as any)?.data ? (detail as any).data : detail;

    if (!payload) {
      return NextResponse.json({ error: 'Product not found on CJ' }, { status: 404 });
    }

    const productName = payload.productNameEn || payload.productName;
    if (!productName) {
      return NextResponse.json({ error: 'Product has no name' }, { status: 404 });
    }

    const cjPrice = parsePriceValue(payload.sellPrice ?? payload.productSellPrice);
    if (cjPrice === null || Number.isNaN(cjPrice) || cjPrice <= 0) {
      return NextResponse.json({ error: 'Invalid CJ price' }, { status: 422 });
    }

    // 2. Check stock
    let totalUsStock = 0;
    let stockData: any[] = [];
    try {
      const stockResponse = await cjClient.getProductStock(trimmedPid);
      const raw = (stockResponse as any)?.data || stockResponse;
      stockData = Array.isArray(raw) ? raw : raw?.inventories || [];
      for (const inv of stockData) {
        if (inv.countryCode === 'US') {
          totalUsStock += inv.quantity || inv.totalInventoryNum || 0;
        }
      }
    } catch {
      // Stock check failed
    }

    const hasUSStock = totalUsStock > 0;

    // 3. Calculate shipping and pricing
    let shippingCost = 0;
    try {
      if (payload.variants?.length > 0) {
        const freight = await cjClient.calculateFreight({
          endCountryCode: 'US',
          products: [{ vid: payload.variants[0].vid, quantity: 1 }],
        });
        if (freight?.length > 0) {
          const freightValues = freight
            .map((f: any) => parsePriceValue(f.logisticPrice))
            .filter((v: number | null): v is number => v !== null);
          if (freightValues.length > 0) {
            shippingCost = Math.min(...freightValues);
          }
        }
      }
    } catch {
      // fallback
    }
    if (!shippingCost) {
      shippingCost = Math.max(cjPrice * 0.3, 3);
    }

    const pricing = calculatePricing(cjPrice, shippingCost);
    const compareAtPrice = computeCompareAtPrice(pricing.retailPrice);

    const warehouse: 'US' | 'CN' = hasUSStock ? 'US' : 'CN';
    const shippingDays = warehouse === 'US' ? '2-5 days' : '7-16 days';
    const shippingEstimate = warehouse === 'US' ? '2-5 business days' : '10-20 business days';

    // 4. Extract images
    const images = extractImagesFromDetail(detail, payload.productImage);

    // 5. Clean description
    let description = payload.description || '';
    description = description.replace(/<img[^>]*>/gi, '');
    description = description.replace(/<p>\s*<\/p>/gi, '');
    description = description.trim();

    // 6. Generate slug
    const slug = productName
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
      const { matchCategoryId } = await import('@/lib/cj/sync');
      categoryId = matchCategoryId(
        payload.categoryName,
        productName,
        categoryRows || []
      );
    }

    // 8. Insert product
    const productData = {
      cj_pid: trimmedPid,
      name: productName,
      slug: `${slug}-${trimmedPid.substring(0, 8)}`,
      description,
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
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 9. Create variants
    let variantsCreated = 0;
    if (payload.variants?.length > 0) {
      for (const variant of payload.variants) {
        const variantPrice = parsePriceValue(variant.variantSellPrice);
        if (variantPrice === null || Number.isNaN(variantPrice)) continue;

        const variantPricing = calculatePricing(variantPrice, shippingCost);
        const parsed = parseVariantColorSize(variant, productName);

        // Find variant stock
        let variantStock = 100;
        for (const inv of stockData) {
          if ((inv.vid === variant.vid) && inv.countryCode === 'US') {
            variantStock = inv.quantity || inv.totalInventoryNum || 0;
          }
        }

        const { error: variantError } = await supabase.from('mi_product_variants').upsert(
          {
            product_id: inserted.id,
            cj_vid: variant.vid,
            name: parsed.name || variant.variantNameEn || variant.variantSku,
            cj_price: variantPrice,
            retail_price: variantPricing.retailPrice,
            image_url: parsed.image_url || variant.variantImage,
            color: parsed.color || null,
            size: parsed.size || null,
            stock_count: variantStock,
            is_active: variantStock > 0,
          },
          { onConflict: 'cj_vid' }
        );

        if (!variantError) variantsCreated++;
      }
    }

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

    // Bust cache for the new product page
    revalidatePath(`/product/${inserted.slug}`);

    return NextResponse.json({
      success: true,
      product_id: inserted.id,
      product_slug: inserted.slug,
      admin_url: `/admin/products/edit/${inserted.id}`,
      store_url: `/product/${inserted.slug}`,
      variants_created: variantsCreated,
      reviews_generated: reviewsGenerated,
      retail_price: pricing.retailPrice,
      margin: pricing.marginPercent,
    });
  } catch (err: any) {
    console.error('[scout] Import error:', err);
    return NextResponse.json(
      { error: err?.message || 'Import failed' },
      { status: 500 }
    );
  }
}
