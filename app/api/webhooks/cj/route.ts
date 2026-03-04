import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const DEBUG = process.env.CJ_WEBHOOK_DEBUG === 'true';

interface CJWebhookPayload {
  type: string;
  params: any;
}

export async function POST(request: NextRequest) {
  let payload: CJWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (DEBUG) {
    console.log('[cj-webhook] Raw body:', JSON.stringify(payload));
  }

  // Process synchronously before responding — Netlify kills the function after response
  try {
    if (payload.type === 'STOCK') {
      await handleStockUpdate(payload.params);
    } else if (payload.type === 'VARIANT') {
      await handleVariantUpdate(payload.params);
    } else {
      console.log('[cj-webhook] Unhandled webhook type:', payload.type);
    }
  } catch (err: any) {
    console.error('[cj-webhook] Processing failed:', err?.message);
  }

  return NextResponse.json({ received: true });
}

async function handleStockUpdate(params: any) {
  if (!params) return;

  const supabase = createAdminClient();

  // Extract stock entries grouped by VID, tracking per-country stock
  const stockByVid = new Map<string, { us: number; cn: number }>();

  function addStock(vid: string, countryCode: string, amount: number) {
    if (!stockByVid.has(vid)) stockByVid.set(vid, { us: 0, cn: 0 });
    const entry = stockByVid.get(vid)!;
    if (countryCode === 'US') entry.us += amount;
    else if (countryCode === 'CN') entry.cn += amount;
  }

  try {
    if (Array.isArray(params)) {
      // Flat array of stock entries
      for (const entry of params) {
        const vid = entry.vid as string;
        if (!vid) continue;
        addStock(vid, entry.countryCode, entry.storageNum ?? 0);
      }
    } else if (typeof params === 'object') {
      // Object keyed by VID — values are arrays of warehouse entries or empty array (= cleared)
      for (const vid of Object.keys(params)) {
        const val = params[vid];
        if (Array.isArray(val)) {
          if (val.length === 0) {
            // Empty array = CJ cleared all stock for this VID
            stockByVid.set(vid, { us: 0, cn: 0 });
          } else {
            for (const entry of val) {
              addStock(vid, entry.countryCode, entry.storageNum ?? 0);
            }
          }
        } else if (val && typeof val === 'object') {
          addStock(vid, val.countryCode, val.storageNum ?? 0);
        }
      }
    }
  } catch (err: any) {
    console.error('[cj-webhook] Failed to parse STOCK params:', err?.message);
    return;
  }

  if (stockByVid.size === 0) return;

  const vids = Array.from(stockByVid.keys());

  // Fetch matching variants from DB
  const { data: variants, error: fetchError } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, product_id, stock_count')
    .in('cj_vid', vids);

  if (fetchError) {
    console.error('[cj-webhook] Failed to fetch variants:', fetchError.message);
    return;
  }

  if (!variants || variants.length === 0) return;

  const productIds = Array.from(new Set(variants.map(v => v.product_id)));
  const { data: productData } = await supabase
    .from('mi_products')
    .select('id, warehouse')
    .in('id', productIds);
  const warehouseMap = new Map((productData || []).map((p: any) => [p.id, p.warehouse || 'US']));

  // Update each variant's stock_count
  const affectedProductIds = new Set<string>();
  let updated = 0;

  for (const variant of variants) {
    const stockData = stockByVid.get(variant.cj_vid);
    const productWarehouse = warehouseMap.get(variant.product_id) || 'US';
    const newStock = stockData ? (productWarehouse === 'CN' ? stockData.cn : stockData.us) : 0;

    if (variant.stock_count === newStock) continue;

    const { error: updateError } = await supabase
      .from('mi_product_variants')
      .update({ stock_count: newStock })
      .eq('id', variant.id);

    if (updateError) {
      console.error('[cj-webhook] Failed to update variant', variant.cj_vid, ':', updateError.message);
      continue;
    }

    updated++;
    affectedProductIds.add(variant.product_id);
  }

  if (updated > 0) {
    console.log('[cj-webhook] STOCK updated', updated, 'variants across', affectedProductIds.size, 'products');

    // Check each affected product for status changes
    const productIds = Array.from(affectedProductIds);
    for (const productId of productIds) {
      await reconcileProductStatus(supabase, productId);
    }
  }
}

async function handleVariantUpdate(params: any) {
  if (!params || typeof params !== 'object') return;

  const vid = params.vid as string;
  if (!vid) return;

  const supabase = createAdminClient();

  // Match vid to our variant
  const { data: variant, error: fetchError } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, product_id, stock_count, is_active, name')
    .eq('cj_vid', vid)
    .maybeSingle();

  if (fetchError) {
    console.error('[cj-webhook] VARIANT fetch error:', fetchError.message);
    return;
  }

  // No match — skip silently
  if (!variant) return;

  const isActive = params.variantStatus === 1 || params.variantStatus === '1';
  console.log('[cj-webhook] VARIANT matched:', variant.name, '(vid:', vid, ') — status:', params.variantStatus, '→', isActive ? 'active' : 'delisted');

  if (!isActive) {
    // Delisted or missing status → deactivate variant and zero stock
    const { error: updateError } = await supabase
      .from('mi_product_variants')
      .update({ is_active: false, stock_count: 0 })
      .eq('id', variant.id);

    if (updateError) {
      console.error('[cj-webhook] VARIANT update failed:', updateError.message);
      return;
    }

    console.log('[cj-webhook] VARIANT deactivated:', variant.name);

    // Check if ALL variants of parent product are now inactive/zero
    const { data: siblings } = await supabase
      .from('mi_product_variants')
      .select('is_active, stock_count')
      .eq('product_id', variant.product_id);

    const allDead = !siblings || siblings.length === 0 ||
      siblings.every((v) => !v.is_active || (v.stock_count ?? 0) === 0);

    if (allDead) {
      const { data: product } = await supabase
        .from('mi_products')
        .select('id, name, status, category_id')
        .eq('id', variant.product_id)
        .single();

      if (product && product.status === 'active') {
        await supabase
          .from('mi_products')
          .update({ status: 'out_of_stock' })
          .eq('id', product.id);

        console.log('[cj-webhook] Product marked out_of_stock (all variants dead):', product.name);

        if (product.category_id) {
          await updateCategoryCount(supabase, product.category_id);
        }
      }
    }
  } else {
    // Re-activated variant
    const { error: updateError } = await supabase
      .from('mi_product_variants')
      .update({ is_active: true })
      .eq('id', variant.id);

    if (updateError) {
      console.error('[cj-webhook] VARIANT reactivate failed:', updateError.message);
      return;
    }

    console.log('[cj-webhook] VARIANT reactivated:', variant.name);

    // If parent product was out_of_stock, bring it back
    await reconcileProductStatus(supabase, variant.product_id);
  }
}

async function reconcileProductStatus(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string
) {
  const { data: product, error: productError } = await supabase
    .from('mi_products')
    .select('id, name, status, category_id')
    .eq('id', productId)
    .single();

  if (productError || !product) return;
  if (product.status !== 'active' && product.status !== 'out_of_stock') return;

  const { data: variants } = await supabase
    .from('mi_product_variants')
    .select('stock_count')
    .eq('product_id', productId)
    .eq('is_active', true);

  if (!variants || variants.length === 0) return;

  const allZero = variants.every((v) => (v.stock_count ?? 0) === 0);
  const anyStock = variants.some((v) => (v.stock_count ?? 0) > 0);

  if (allZero && product.status === 'active') {
    await supabase
      .from('mi_products')
      .update({ status: 'out_of_stock' })
      .eq('id', productId);

    console.log('[cj-webhook] Product marked out_of_stock:', product.name);

    if (product.category_id) {
      await updateCategoryCount(supabase, product.category_id);
    }
  } else if (anyStock && product.status === 'out_of_stock') {
    await supabase
      .from('mi_products')
      .update({ status: 'active' })
      .eq('id', productId);

    console.log('[cj-webhook] Product reactivated:', product.name);

    if (product.category_id) {
      await updateCategoryCount(supabase, product.category_id);
    }
  }
}

async function updateCategoryCount(
  supabase: ReturnType<typeof createAdminClient>,
  categoryId: string
) {
  const { count } = await supabase
    .from('mi_products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('status', 'active');

  await supabase
    .from('mi_categories')
    .update({ product_count: count ?? 0 })
    .eq('id', categoryId);
}
