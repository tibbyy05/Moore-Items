import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

interface CJWebhookPayload {
  type: string;
  params: any[];
}

interface CJStockEntry {
  vid: string;
  storageNum: number;
  countryCode: string;
}

export async function POST(request: NextRequest) {
  let payload: CJWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log('[cj-webhook] Received:', payload.type, '— params count:', payload.params?.length ?? 0);

  // Respond immediately, process in background
  const promise = processWebhook(payload);
  // waitUntil not available in pages router — use catch to avoid unhandled rejection
  promise.catch((err) => console.error('[cj-webhook] Background processing failed:', err));

  return NextResponse.json({ received: true });
}

async function processWebhook(payload: CJWebhookPayload) {
  if (payload.type === 'STOCK') {
    await handleStockUpdate(payload.params);
  } else {
    console.log('[cj-webhook] Unhandled webhook type:', payload.type);
  }
}

async function handleStockUpdate(params: any[]) {
  if (!params || params.length === 0) {
    console.log('[cj-webhook] STOCK event with empty params, skipping');
    return;
  }

  const supabase = createAdminClient();

  // Extract US warehouse stock entries grouped by VID
  const stockByVid = new Map<string, number>();

  for (const entry of params) {
    const vid = entry.vid as string;
    if (!vid) continue;

    // Only count US warehouse stock
    if (entry.countryCode === 'US') {
      const current = stockByVid.get(vid) ?? 0;
      stockByVid.set(vid, current + (entry.storageNum ?? 0));
    } else if (!stockByVid.has(vid)) {
      // Ensure VID exists in map even if non-US (so we can still update it to 0 if no US entries)
      stockByVid.set(vid, 0);
    }
  }

  if (stockByVid.size === 0) {
    console.log('[cj-webhook] No VIDs found in STOCK params');
    return;
  }

  const vids = Array.from(stockByVid.keys());
  console.log('[cj-webhook] Processing stock update for', vids.length, 'VIDs');

  // Fetch matching variants from DB
  const { data: variants, error: fetchError } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, product_id, stock_count')
    .in('cj_vid', vids);

  if (fetchError) {
    console.error('[cj-webhook] Failed to fetch variants:', fetchError.message);
    return;
  }

  if (!variants || variants.length === 0) {
    console.log('[cj-webhook] No matching variants found for VIDs:', vids.slice(0, 5).join(', '));
    return;
  }

  // Update each variant's stock_count
  const affectedProductIds = new Set<string>();
  let updated = 0;

  for (const variant of variants) {
    const newStock = stockByVid.get(variant.cj_vid) ?? 0;

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

  console.log('[cj-webhook] Updated', updated, 'variants across', affectedProductIds.size, 'products');

  // Check each affected product for status changes
  const productIds = Array.from(affectedProductIds);
  for (const productId of productIds) {
    await reconcileProductStatus(supabase, productId);
  }
}

async function reconcileProductStatus(
  supabase: ReturnType<typeof createAdminClient>,
  productId: string
) {
  // Get current product status
  const { data: product, error: productError } = await supabase
    .from('mi_products')
    .select('id, name, status, category_id')
    .eq('id', productId)
    .single();

  if (productError || !product) return;

  // Only manage transitions between active <-> out_of_stock
  if (product.status !== 'active' && product.status !== 'out_of_stock') return;

  // Get all active variant stock counts for this product
  const { data: variants } = await supabase
    .from('mi_product_variants')
    .select('stock_count')
    .eq('product_id', productId)
    .eq('is_active', true);

  if (!variants || variants.length === 0) return;

  const allZero = variants.every((v) => (v.stock_count ?? 0) === 0);
  const anyStock = variants.some((v) => (v.stock_count ?? 0) > 0);

  if (allZero && product.status === 'active') {
    // All variants hit 0 → mark product out_of_stock
    await supabase
      .from('mi_products')
      .update({ status: 'out_of_stock' })
      .eq('id', productId);

    console.log('[cj-webhook] Product marked out_of_stock:', product.name);

    // Update category count
    if (product.category_id) {
      await updateCategoryCount(supabase, product.category_id);
    }
  } else if (anyStock && product.status === 'out_of_stock') {
    // Stock returned → reactivate product
    await supabase
      .from('mi_products')
      .update({ status: 'active' })
      .eq('id', productId);

    console.log('[cj-webhook] Product reactivated:', product.name);

    // Update category count
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
