import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { mode } = body;

  if (mode === 'single') {
    const { pid, productId } = body;
    try {
      const stockData = await cjClient.getProductStock(pid);
      const payload = stockData?.data || stockData;
      const inventories = payload?.inventories || [];

      const usStock = inventories.find(
        (inv: any) => inv.countryCode === 'US' && inv.totalInventoryNum > 0
      );
      const cnStock = inventories.find(
        (inv: any) => inv.countryCode === 'CN' && inv.totalInventoryNum > 0
      );

      return NextResponse.json({
        pid,
        productId,
        hasUSStock: Boolean(usStock),
        usQuantity: usStock?.totalInventoryNum || 0,
        hasCNStock: Boolean(cnStock),
        cnQuantity: cnStock?.totalInventoryNum || 0,
        inventories,
      });
    } catch (error: any) {
      return NextResponse.json({
        pid,
        productId,
        error: error?.message || 'Stock lookup failed',
        hasUSStock: false,
        usQuantity: 0,
      });
    }
  }

  if (mode === 'bulk') {
    const adminClient = (await import('@/lib/supabase/admin')).createAdminClient();
    const { data: products, error } = await adminClient
      .from('mi_products')
      .select('id, cj_pid, name, warehouse')
      .not('cj_pid', 'is', null)
      .order('name');

    if (error || !products) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }

    return NextResponse.json({
      products: products.map((product) => ({
        id: product.id,
        pid: product.cj_pid,
        name: product.name,
        currentWarehouse: product.warehouse,
      })),
      total: products.length,
    });
  }

  return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { productId, warehouse, shippingDays } = body;

  const adminClient = (await import('@/lib/supabase/admin')).createAdminClient();
  const { error } = await adminClient
    .from('mi_products')
    .update({
      warehouse,
      shipping_days: shippingDays,
    })
    .eq('id', productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
