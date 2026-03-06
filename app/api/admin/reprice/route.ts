import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getPricingConfigFromDB, getCategoryPricingRules, PRICING_CONFIG } from '@/lib/config/pricing';
import { calculatePricingWithConfig, computeCompareAtPriceWithConfig } from '@/lib/pricing';

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

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const bodyConfig = body.config ?? {};
  const categoryRules = await getCategoryPricingRules(supabase);

  let updated = 0;
  let skipped = 0;
  let processed = 0;
  const pageSize = 200;
  let offset = 0;

  // Build category_id → slug lookup
  const { data: categories } = await supabase.from('mi_categories').select('id, slug');
  const categoryIdToSlug: Record<string, string> = {};
  if (categories) categories.forEach((c: any) => { categoryIdToSlug[c.id] = c.slug; });

  while (true) {
    const { data: products, error: fetchError } = await supabase
      .from('mi_products')
      .select('id, cj_price, shipping_cost, status, warehouse, category_id')
      .eq('status', 'active')
      .range(offset, offset + pageSize - 1);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!products || products.length === 0) break;

    for (const product of products) {
      processed += 1;
      const cjPrice = parseFloat(String(product.cj_price || 0));
      if (!Number.isFinite(cjPrice) || cjPrice <= 0) {
        skipped += 1;
        continue;
      }

      const warehouseConfig = await getPricingConfigFromDB(supabase, product.warehouse ?? 'US');
      const effectiveConfig = { ...warehouseConfig, ...bodyConfig };

      const categorySlug = categoryIdToSlug[product.category_id] ?? '';
      const categoryRule = categoryRules[categorySlug];

      if (categoryRule?.markup_override) effectiveConfig.markupMultiplier = categoryRule.markup_override;
      if (categoryRule?.target_margin) effectiveConfig.minimumMargin = Math.max(effectiveConfig.minimumMargin, categoryRule.target_margin);

      const shippingCost = Number.isFinite(Number(product.shipping_cost))
        ? Number(product.shipping_cost)
        : effectiveConfig.shippingCostEstimate;

      const pricing = calculatePricingWithConfig(cjPrice, shippingCost, effectiveConfig);

      if (categoryRule?.min_price && pricing.retailPrice < categoryRule.min_price) {
        pricing.retailPrice = categoryRule.min_price;
        const baseCost = (product.cj_price ?? 0) + (product.shipping_cost ?? effectiveConfig.shippingCostEstimate);
        const stripeFee = pricing.retailPrice * effectiveConfig.stripeFeePercent + effectiveConfig.stripeFeeFixed;
        pricing.marginPercent = ((pricing.retailPrice - baseCost - stripeFee) / pricing.retailPrice) * 100;
        pricing.marginDollars = pricing.retailPrice - baseCost - stripeFee;
      }

      if (!pricing.isViable) {
        skipped += 1;
        continue;
      }

      const compareAtPrice = computeCompareAtPriceWithConfig(pricing.retailPrice, effectiveConfig);

      const { error: updateError } = await supabase
        .from('mi_products')
        .update({
          retail_price: pricing.retailPrice,
          compare_at_price: compareAtPrice,
          stripe_fee: pricing.stripeFee,
          total_cost: pricing.totalCost,
          margin_dollars: pricing.marginDollars,
          margin_percent: pricing.marginPercent,
          markup_multiplier: effectiveConfig.markupMultiplier,
        })
        .eq('id', product.id);

      if (!updateError) {
        updated += 1;
        // Sync variant prices
        await supabase
          .from('mi_product_variants')
          .update({ retail_price: pricing.retailPrice })
          .eq('product_id', product.id);
      }
    }

    offset += pageSize;
    if (products.length < pageSize) break;
  }

  // Bulk reprice — revalidate all product pages
  if (updated > 0) {
    revalidatePath('/product', 'layout');
  }

  return NextResponse.json({
    updated,
    skipped,
    processed,
  });
}
