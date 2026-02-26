import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { calculatePricing } from '@/lib/pricing';
import { parseVariantColorSize } from '@/lib/utils/variant-parser';
import {
  parsePriceValue,
  detectUSWarehouse,
  extractImagesFromDetail,
  matchCategoryId,
} from '@/lib/cj/sync';

async function requireAdmin(request: NextRequest) {
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
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { pid } = body;

  if (!pid || typeof pid !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid CJ product ID' }, { status: 400 });
  }

  const trimmedPid = pid.trim();

  // Check if product already exists
  const { data: existing } = await supabase
    .from('mi_products')
    .select('id, name')
    .eq('cj_pid', trimmedPid)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: `Product already exists: ${existing.name}`, existingId: existing.id },
      { status: 409 }
    );
  }

  try {
    // Fetch product details from CJ
    const detail = await cjClient.getProduct(trimmedPid);
    const payload = (detail as any)?.data ? (detail as any).data : detail;

    if (!payload) {
      return NextResponse.json({ error: 'Product not found on CJ' }, { status: 404 });
    }

    const productName = payload.productNameEn || payload.productName;
    if (!productName) {
      return NextResponse.json({ error: 'Product has no name — may be discontinued' }, { status: 404 });
    }

    const cjPriceParsed = parsePriceValue(payload.sellPrice ?? payload.productSellPrice);
    if (cjPriceParsed === null || Number.isNaN(cjPriceParsed) || cjPriceParsed <= 0) {
      return NextResponse.json(
        { error: `Invalid CJ price: ${payload.sellPrice ?? payload.productSellPrice}` },
        { status: 422 }
      );
    }

    // Check stock/inventory for US warehouse availability
    let hasUSStock = false;
    let stockData: any = null;
    try {
      const stockResponse = await cjClient.getProductStock(trimmedPid);
      stockData = stockResponse?.data || stockResponse;
      const inventories = stockData?.inventories || [];
      const usInventory = inventories.find(
        (inv: any) => inv.countryCode === 'US' && inv.totalInventoryNum > 0
      );
      if (usInventory) hasUSStock = true;
    } catch {
      // stock check failed, fall through to detectUSWarehouse
    }

    // Calculate shipping
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
      shippingCost = Math.max(cjPriceParsed * 0.3, 3);
    }

    const cjPrice = parseFloat(String(cjPriceParsed));
    const shipCost = parseFloat(String(shippingCost));
    const pricing = calculatePricing(cjPrice, shipCost);

    const isUSWarehouse = hasUSStock || detectUSWarehouse(payload);
    const warehouse: 'US' | 'CN' = isUSWarehouse ? 'US' : 'CN';
    const shippingDays = warehouse === 'US' ? '2-5 days' : '7-16 days';
    const deliveryCycle = payload.deliveryCycle || null;
    const shippingEstimate =
      warehouse === 'US'
        ? '2-5 business days'
        : deliveryCycle
          ? `${deliveryCycle} days + transit`
          : '10-20 business days';

    const images = extractImagesFromDetail(detail, payload.productImage);

    let description = payload.description || '';
    description = description.replace(/<img[^>]*>/gi, '');
    description = description.replace(/<p>\s*<\/p>/gi, '');
    description = description.trim();

    const slug = productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80);

    // Category matching
    const { data: categoryRows } = await supabase
      .from('mi_categories')
      .select('id, name, slug');
    const categoryIdMatch = matchCategoryId(
      payload.categoryName,
      productName,
      categoryRows || []
    );

    const productData = {
      cj_pid: trimmedPid,
      name: productName,
      slug: `${slug}-${trimmedPid.substring(0, 8)}`,
      description,
      category_id: categoryIdMatch,
      images,
      cj_price: cjPrice,
      shipping_cost: shipCost,
      stripe_fee: pricing.stripeFee,
      total_cost: pricing.totalCost,
      markup_multiplier: 2.0,
      retail_price: pricing.retailPrice,
      margin_dollars: pricing.marginDollars,
      margin_percent: pricing.marginPercent,
      stock_count: 100,
      warehouse,
      shipping_days: shippingDays,
      delivery_cycle_days: deliveryCycle,
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

    // Sync variants if available
    if (payload.variants?.length > 0) {
      for (const variant of payload.variants) {
        const variantPrice = parsePriceValue(variant.variantSellPrice);
        if (variantPrice === null || Number.isNaN(variantPrice)) continue;
        const variantPricing = calculatePricing(variantPrice, shipCost);
        const variantLabel = variant.variantNameEn || variant.variantName || variant.variantSku || '';
        const { color, size } = parseVariantColorSize(variantLabel, productName);
        await supabase.from('mi_product_variants').upsert(
          {
            product_id: inserted.id,
            cj_vid: variant.vid,
            name: variant.variantNameEn,
            cj_price: variantPrice,
            retail_price: variantPricing.retailPrice,
            image_url: variant.variantImage,
            color: color || null,
            size: size || null,
            is_active: true,
          },
          { onConflict: 'cj_vid' }
        );
      }
    }

    return NextResponse.json({ product: inserted });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to import product from CJ' },
      { status: 500 }
    );
  }
}
