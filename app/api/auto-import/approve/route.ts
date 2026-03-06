import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { calculatePricingWithConfig, computeCompareAtPrice } from '@/lib/pricing';
import { getPricingConfigFromDB } from '@/lib/config/pricing';
import { parsePriceValue, extractImagesFromDetail, matchCategoryId } from '@/lib/cj/sync';
import { parseVariantColorSize } from '@/lib/utils/variant-parser';
import { categorizeWithAI, generateReviewsForProduct, stripHtml } from '@/lib/ai/product-enrichment';
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

async function importProduct(
  supabase: any,
  suggestion: any
): Promise<{ success: boolean; product_id?: string; error?: string }> {
  const trimmedPid = suggestion.cj_pid.trim();

  // Check if product already exists (allow re-importing hidden products)
  const { data: existing } = await supabase
    .from('mi_products')
    .select('id')
    .eq('cj_pid', trimmedPid)
    .neq('status', 'hidden')
    .maybeSingle();

  if (existing) {
    return { success: false, error: `Product already exists (${existing.id})` };
  }

  // 1. Fetch full product detail
  const detail = await cjClient.getProduct(trimmedPid);
  const payload = (detail as any)?.data ? (detail as any).data : detail;

  if (!payload) {
    return { success: false, error: 'Product not found on CJ' };
  }

  const productName = payload.productNameEn || payload.productName;
  if (!productName) {
    return { success: false, error: 'Product has no name' };
  }

  const cjPrice = parsePriceValue(payload.sellPrice ?? payload.productSellPrice);
  if (cjPrice === null || Number.isNaN(cjPrice) || cjPrice <= 0) {
    return { success: false, error: 'Invalid CJ price' };
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

  const pricingConfig = await getPricingConfigFromDB(supabase, hasUSStock ? 'US' : 'CN');
  const pricing = calculatePricingWithConfig(cjPrice, shippingCost, pricingConfig);
  const compareAtPrice = computeCompareAtPrice(pricing.retailPrice);

  const warehouse: 'US' | 'CN' = hasUSStock ? 'US' : 'CN';
  const shippingDays = warehouse === 'US' ? '2-5 days' : '7-16 days';
  const shippingEstimate = warehouse === 'US' ? '2-5 business days' : '10-20 business days';

  // 4. Extract images
  const images = extractImagesFromDetail(detail, payload.productImage);

  // 5. AI-clean name and description
  let rawDescription = payload.description || '';
  rawDescription = rawDescription.replace(/<img[^>]*>/gi, '');
  rawDescription = rawDescription.replace(/<p>\s*<\/p>/gi, '');
  rawDescription = rawDescription.trim();

  // AI categorization first (needs raw name for keyword matching fallback)
  const { data: categoryRows } = await supabase
    .from('mi_categories')
    .select('id, name, slug');

  let categoryId = await categorizeWithAI(
    productName,
    rawDescription,
    categoryRows || []
  );

  if (!categoryId) {
    categoryId = matchCategoryId(
      payload.categoryName,
      productName,
      categoryRows || []
    );
  }

  const categorySlug = categoryRows?.find((c: any) => c.id === categoryId)?.slug || 'general';

  let cleanName = productName;
  let description = rawDescription;

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const cleanResponse = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: `You are a product copywriter for MooreItems.com — a curated marketplace positioned as "Nordstrom meets Target".
Write clean, compelling product copy that sells the lifestyle and benefit, not the specs.
Respond ONLY with valid JSON. No markdown, no backticks, no explanation.`,
        messages: [
          {
            role: 'user',
            content: `Clean and rewrite this CJ dropshipping product for our store.

Raw name: ${productName}
Raw description/specs: ${stripHtml(rawDescription).slice(0, 800)}
Category: ${categorySlug}

Rules for the name:
- Remove ALL of: dimensions, weights, model numbers, platform references (Temu, Amazon, Walmart), promotional words (New, Hot, Top Sale, Best), shipping references, material specs
- Keep it under 70 characters
- Make it sound like a real retail product name

Rules for the description:
- Write 2 paragraphs of engaging marketing copy (4-6 sentences each)
- Focus on lifestyle benefits and who this is for — not raw specs
- Do NOT include: melting points, cross-border references, platform names, "product display", "housekeeping", Chinese manufacturing references, material chemistry specs, or any text that sounds like a warehouse listing
- End with one sentence about why it fits everyday life
- Tone: warm, confident, accessible — like Target.com product copy

Respond with exactly this JSON:
{"cleanName":"...","cleanDescription":"..."}`,
          },
        ],
      });

      const rawText = cleanResponse.content
        .map((b) => (b.type === 'text' ? b.text : ''))
        .join('')
        .trim();

      const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      const cleaned = JSON.parse(jsonText);

      if (cleaned.cleanName && typeof cleaned.cleanName === 'string') {
        cleanName = cleaned.cleanName.slice(0, 200);
      }
      if (cleaned.cleanDescription && typeof cleaned.cleanDescription === 'string') {
        description = cleaned.cleanDescription;
      }
    } catch (err) {
      console.error('[auto-import] AI description cleaning failed, using raw:', err);
      description = stripHtml(rawDescription).slice(0, 2000);
    }
  } else {
    description = stripHtml(rawDescription).slice(0, 2000);
  }

  // 6. Generate slug from cleaned name
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 80);

  // 7. Insert product
  const productData = {
    cj_pid: trimmedPid,
    name: cleanName,
    slug: `${slug}-${trimmedPid.substring(0, 8)}`,
    description,
    category_id: categoryId,
    images,
    cj_price: cjPrice,
    shipping_cost: shippingCost,
    stripe_fee: pricing.stripeFee,
    total_cost: pricing.totalCost,
    markup_multiplier: pricingConfig.markupMultiplier,
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
    return { success: false, error: insertError.message };
  }

  // 9. Create variants
  let variantsCreated = 0;
  if (payload.variants?.length > 0) {
    for (const variant of payload.variants) {
      const variantPrice = parsePriceValue(variant.variantSellPrice);
      if (variantPrice === null || Number.isNaN(variantPrice)) continue;

      const variantPricing = calculatePricingWithConfig(variantPrice, shippingCost, pricingConfig);
      const parsed = parseVariantColorSize(variant, productName);

      let variantStock = 100;
      for (const inv of stockData) {
        if (inv.vid === variant.vid && inv.countryCode === 'US') {
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
  await generateReviewsForProduct(
    supabase,
    inserted.id,
    cleanName,
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

  // Bust cache
  revalidatePath(`/product/${inserted.slug}`);

  return { success: true, product_id: inserted.id };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { suggestion_id } = body;

    if (!suggestion_id || typeof suggestion_id !== 'string') {
      return NextResponse.json({ error: 'Missing suggestion_id string' }, { status: 400 });
    }

    const { data: suggestion } = await supabase
      .from('mi_auto_import_suggestions')
      .select('*')
      .eq('id', suggestion_id)
      .single();

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    if (suggestion.status !== 'pending') {
      return NextResponse.json(
        { error: `Already ${suggestion.status}`, suggestion_id, cj_pid: suggestion.cj_pid },
        { status: 409 }
      );
    }

    try {
      const result = await importProduct(supabase, suggestion);

      if (result.success) {
        await supabase
          .from('mi_auto_import_suggestions')
          .update({
            status: 'imported',
            imported_product_id: result.product_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', suggestion_id);

        return NextResponse.json({
          success: true,
          suggestion_id,
          cj_pid: suggestion.cj_pid,
          product_id: result.product_id,
        });
      } else {
        await supabase
          .from('mi_auto_import_suggestions')
          .update({
            status: 'error',
            error_message: result.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', suggestion_id);

        return NextResponse.json(
          { success: false, suggestion_id, cj_pid: suggestion.cj_pid, error: result.error },
          { status: 500 }
        );
      }
    } catch (err: any) {
      await supabase
        .from('mi_auto_import_suggestions')
        .update({
          status: 'error',
          error_message: err?.message || 'Import failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', suggestion_id);

      return NextResponse.json(
        { success: false, suggestion_id, cj_pid: suggestion.cj_pid, error: err?.message || 'Import failed' },
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error('[auto-import] Approve error:', err);
    return NextResponse.json(
      { error: err?.message || 'Approve failed' },
      { status: 500 }
    );
  }
}
