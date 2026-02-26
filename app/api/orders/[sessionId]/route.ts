import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDownloadToken } from '@/lib/download-token';

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

    // Webhook backup: if Stripe says paid but order is still pending, update it now.
    // This handles cases where the webhook is delayed, fails, or hasn't fired yet.
    if (
      order.payment_status === 'pending' &&
      session.payment_status === 'paid'
    ) {
      const customerPhone = session.customer_details?.phone || '';
      const shippingDetails = (session as any).shipping_details || session.customer_details;
      const shippingAddress = shippingDetails?.address
        ? {
            name: shippingDetails?.name || null,
            line1: shippingDetails.address.line1 || null,
            line2: shippingDetails.address.line2 || null,
            city: shippingDetails.address.city || null,
            state: shippingDetails.address.state || null,
            postal_code: shippingDetails.address.postal_code || null,
            country: shippingDetails.address.country || null,
            phone: customerPhone || null,
          }
        : null;

      const updateData: Record<string, any> = {
        payment_status: 'paid',
        fulfillment_status: order.fulfillment_status === 'unfulfilled' ? 'processing' : order.fulfillment_status,
        stripe_payment_intent_id: session.payment_intent || null,
        email: session.customer_details?.email || session.customer_email || order.email || null,
      };

      if (shippingAddress) {
        updateData.shipping_address = shippingAddress;
      }

      const { data: updatedOrder } = await supabase
        .from('mi_orders')
        .update(updateData)
        .eq('id', order.id)
        .select('*')
        .single();

      if (updatedOrder) {
        Object.assign(order, updatedOrder);
      }
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
      .select('id, warehouse, digital_file_path')
      .in('id', productIds);

    const warehouseMap = new Map(
      (products || []).map((product) => [product.id, product.warehouse || 'CN'])
    );
    const digitalMap = new Map(
      (products || []).map((product) => [product.id, !!product.digital_file_path])
    );

    const enrichedItems = (items || []).map((item) => {
      const isDigital = digitalMap.get(item.product_id) || false;
      return {
        ...item,
        warehouse: warehouseMap.get(item.product_id) || 'CN',
        is_digital: isDigital,
        download_token: isDigital ? generateDownloadToken(order.id, item.id) : undefined,
      };
    });

    // If all items are digital and order was just updated to paid, mark as delivered
    const allDigital = enrichedItems.length > 0 && enrichedItems.every((i) => i.is_digital);
    if (allDigital && order.payment_status === 'paid' && order.fulfillment_status !== 'delivered') {
      await supabase
        .from('mi_orders')
        .update({
          fulfillment_status: 'delivered',
          notes: '[fulfillment] Digital order — delivered instantly',
        })
        .eq('id', order.id);
      order.fulfillment_status = 'delivered';
    }

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
