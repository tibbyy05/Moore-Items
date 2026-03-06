import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { calculatePricing, computeCompareAtPrice } from '@/lib/pricing';
import { parsePriceValue, extractImagesFromDetail, matchCategoryId } from '@/lib/cj/sync';
import { parseVariantColorSize } from '@/lib/utils/variant-parser';
import { categorizeWithAI, generateReviewsForProduct, stripHtml } from '@/lib/ai/product-enrichment';

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

  // Check if product already exists
  const { data: existing } = await supabase
    .from('mi_products')
    .select('id')
    .eq('cj_pid', trimmedPid)
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
    return { success: false, error: insertError.message };
  }

  // 9. Create variants
  let variantsCreated = 0;
  if (payload.variants?.length > 0) {
    for (const variant of payload.variants) {
      const variantPrice = parsePriceValue(variant.variantSellPrice);
      if (variantPrice === null || Number.isNaN(variantPrice)) continue;

      const variantPricing = calculatePricing(variantPrice, shippingCost);
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

  // Bust cache
  revalidatePath(`/product/${inserted.slug}`);

  return { success: true, product_id: inserted.id };
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { suggestion_ids } = body;

    if (!Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      return NextResponse.json({ error: 'Missing suggestion_ids array' }, { status: 400 });
    }

    const results: Array<{
      suggestion_id: string;
      cj_pid: string;
      success: boolean;
      product_id?: string;
      error?: string;
    }> = [];

    for (const suggestionId of suggestion_ids) {
      const { data: suggestion } = await supabase
        .from('mi_auto_import_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (!suggestion) {
        results.push({
          suggestion_id: suggestionId,
          cj_pid: '',
          success: false,
          error: 'Suggestion not found',
        });
        continue;
      }

      if (suggestion.status !== 'pending') {
        results.push({
          suggestion_id: suggestionId,
          cj_pid: suggestion.cj_pid,
          success: false,
          error: `Already ${suggestion.status}`,
        });
        continue;
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
            .eq('id', suggestionId);
        } else {
          await supabase
            .from('mi_auto_import_suggestions')
            .update({
              status: 'error',
              error_message: result.error,
              updated_at: new Date().toISOString(),
            })
            .eq('id', suggestionId);
        }

        results.push({
          suggestion_id: suggestionId,
          cj_pid: suggestion.cj_pid,
          ...result,
        });
      } catch (err: any) {
        await supabase
          .from('mi_auto_import_suggestions')
          .update({
            status: 'error',
            error_message: err?.message || 'Import failed',
            updated_at: new Date().toISOString(),
          })
          .eq('id', suggestionId);

        results.push({
          suggestion_id: suggestionId,
          cj_pid: suggestion.cj_pid,
          success: false,
          error: err?.message || 'Import failed',
        });
      }
    }

    const imported = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      imported,
      failed,
      results,
    });
  } catch (err: any) {
    console.error('[auto-import] Approve error:', err);
    return NextResponse.json(
      { error: err?.message || 'Approve failed' },
      { status: 500 }
    );
  }
}
