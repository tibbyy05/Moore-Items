import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cjClient } from '@/lib/cj/client';

async function requireAdmin(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { error: null };
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { productId } = body;

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid productId' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Fetch product's cj_pid
  const { data: product, error: productError } = await admin
    .from('mi_products')
    .select('id, cj_pid')
    .eq('id', productId)
    .single();

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  if (!product.cj_pid) {
    return NextResponse.json({ error: 'Product has no CJ PID linked' }, { status: 400 });
  }

  // Fetch live data from CJ
  let cjProduct;
  try {
    cjProduct = await cjClient.getProduct(product.cj_pid);
  } catch (err: any) {
    return NextResponse.json(
      { error: `CJ API error: ${err.message}`, delisted: true },
      { status: 502 }
    );
  }

  if (!cjProduct || !cjProduct.variants || cjProduct.variants.length === 0) {
    // Update last_synced_at even on empty result
    await admin
      .from('mi_products')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', productId);

    return NextResponse.json(
      { error: 'Product returned no variant data from CJ — it may be delisted', delisted: true },
      { status: 200 }
    );
  }

  // Fetch our existing variants
  const { data: ourVariants } = await admin
    .from('mi_product_variants')
    .select('id, cj_vid, cj_price, stock_count, name, retail_price')
    .eq('product_id', productId);

  if (!ourVariants || ourVariants.length === 0) {
    await admin
      .from('mi_products')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', productId);

    return NextResponse.json({ changes: [], message: 'No local variants to match' });
  }

  // Build CJ variant lookup by vid
  const cjVariantMap = new Map<string, { price: number; stock: number; cjWarehouseStock: number; factoryStock: number }>();
  for (const cv of cjProduct.variants) {
    cjVariantMap.set(cv.vid, {
      price: cv.variantSellPrice ?? 0,
      stock: 0,
      cjWarehouseStock: 0,
      factoryStock: 0,
    });
  }

  // Try to get stock data
  try {
    const stockData = await cjClient.getProductStock(product.cj_pid);
    const variantInventories = stockData?.variantInventories ?? [];
    for (const item of variantInventories) {
      const vid = item.vid;
      const inv = item.inventory?.[0];
      if (!vid || !inv || !cjVariantMap.has(vid)) continue;
      const existing = cjVariantMap.get(vid)!;
      const cjStock = Number(inv.cjInventory ?? 0);
      const factoryStock = Number(inv.factoryInventory ?? 0);
      const totalStock = Number(inv.totalInventory ?? (cjStock + factoryStock));
      existing.cjWarehouseStock = cjStock;
      existing.factoryStock = factoryStock;
      existing.stock = totalStock;
    }
  } catch {
    // Stock API may not be available for all products — continue with price-only updates
  }

  // Match and update
  const changes: Array<{
    variantId: string;
    name: string;
    oldCost: number;
    newCost: number;
    oldStock: number;
    newStock: number;
    cjWarehouseStock: number;
    factoryStock: number;
    retailPrice: number;
  }> = [];

  for (const ov of ourVariants) {
    if (!ov.cj_vid) continue;
    const cjData = cjVariantMap.get(ov.cj_vid);
    if (!cjData) continue;

    const oldCost = Number(ov.cj_price ?? 0);
    const oldStock = Number(ov.stock_count ?? 0);
    const newCost = cjData.price;
    const newStock = cjData.stock;

    const updates: Record<string, any> = {};
    if (newCost !== oldCost) updates.cj_price = newCost;
    if (newStock !== oldStock) updates.stock_count = newStock;
    updates.cj_warehouse_stock = cjData.cjWarehouseStock;
    updates.factory_stock = cjData.factoryStock;

    await admin
      .from('mi_product_variants')
      .update(updates)
      .eq('id', ov.id);

    changes.push({
      variantId: ov.id,
      name: ov.name || 'Unnamed',
      oldCost,
      newCost,
      oldStock,
      newStock,
      cjWarehouseStock: cjData.cjWarehouseStock,
      factoryStock: cjData.factoryStock,
      retailPrice: Number(ov.retail_price ?? 0),
    });
  }

  // Sum stock across all active variants for parent product stock_count
  const { data: activeVariants } = await admin
    .from('mi_product_variants')
    .select('stock_count')
    .eq('product_id', productId)
    .neq('is_active', false);

  const totalStock = (activeVariants || []).reduce(
    (sum: number, v: any) => sum + Number(v.stock_count ?? 0),
    0
  );

  // Update last_synced_at and parent stock_count
  await admin
    .from('mi_products')
    .update({ last_synced_at: new Date().toISOString(), stock_count: totalStock })
    .eq('id', productId);

  return NextResponse.json({ changes });
}
