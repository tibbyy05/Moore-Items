import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session id' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'customer_details'],
      });

    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const { data: items, error: itemsError } = await supabase
      .from('mi_order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) {
      return NextResponse.json({ error: 'Order items not found' }, { status: 500 });
    }

    const productIds = (items || []).map((item) => item.product_id);
    const { data: products } = await supabase
      .from('mi_products')
      .select('id, warehouse')
      .in('id', productIds);

    const warehouseMap = new Map(
      (products || []).map((product) => [product.id, product.warehouse || 'CN'])
    );

    const enrichedItems = (items || []).map((item) => ({
      ...item,
      warehouse: warehouseMap.get(item.product_id) || 'CN',
    }));

    return NextResponse.json({
      session,
      order,
      items: enrichedItems,
    });
  } catch (error) {
    console.error('Order lookup error', error);
    return NextResponse.json({ error: 'Unable to retrieve order' }, { status: 500 });
  }
}
