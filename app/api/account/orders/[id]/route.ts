import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminSupabase = createAdminClient();

    // Fetch order — verify it belongs to this user by email
    const { data: order, error: orderError } = await adminSupabase
      .from('mi_orders')
      .select('*')
      .eq('id', params.id)
      .ilike('email', user.email)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Fetch order items
    const { data: orderItems } = await adminSupabase
      .from('mi_order_items')
      .select('*')
      .eq('order_id', params.id);

    // Enrich items with digital flag
    const productIds = (orderItems || []).map((item) => item.product_id).filter(Boolean);
    let digitalSet = new Set<string>();

    if (productIds.length > 0) {
      const { data: productsData } = await adminSupabase
        .from('mi_products')
        .select('id, digital_file_path')
        .in('id', productIds);

      digitalSet = new Set(
        (productsData || [])
          .filter((p) => !!p.digital_file_path)
          .map((p) => p.id)
      );
    }

    const items = (orderItems || []).map((item) => ({
      ...item,
      is_digital: digitalSet.has(item.product_id),
    }));

    return NextResponse.json({ order, items });
  } catch (error) {
    console.error('[Account Order Detail] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
