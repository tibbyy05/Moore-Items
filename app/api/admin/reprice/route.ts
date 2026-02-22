import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PRICING_CONFIG } from '@/lib/config/pricing';
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
  const override = body?.config || {};
  const config = {
    ...PRICING_CONFIG,
    ...override,
  };

  let updated = 0;
  let skipped = 0;
  let processed = 0;
  const pageSize = 200;
  let offset = 0;

  while (true) {
    const { data: products, error: fetchError } = await supabase
      .from('mi_products')
      .select('id, cj_price, shipping_cost, status')
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

      const shippingCost = Number.isFinite(Number(product.shipping_cost))
        ? Number(product.shipping_cost)
        : config.shippingCostEstimate;

      const pricing = calculatePricingWithConfig(cjPrice, shippingCost, config);
      if (!pricing.isViable) {
        skipped += 1;
        continue;
      }

      const compareAtPrice = computeCompareAtPriceWithConfig(pricing.retailPrice, config);

      const { error: updateError } = await supabase
        .from('mi_products')
        .update({
          retail_price: pricing.retailPrice,
          compare_at_price: compareAtPrice,
          stripe_fee: pricing.stripeFee,
          total_cost: pricing.totalCost,
          margin_dollars: pricing.marginDollars,
          margin_percent: pricing.marginPercent,
          markup_multiplier: config.markupMultiplier,
        })
        .eq('id', product.id);

      if (!updateError) {
        updated += 1;
      }
    }

    offset += pageSize;
    if (products.length < pageSize) break;
  }

  return NextResponse.json({
    updated,
    skipped,
    processed,
  });
}
