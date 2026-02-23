import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateDownloadToken } from '@/lib/download-token';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const orderNumber = body?.orderNumber ? String(body.orderNumber).trim() : '';
    const email = body?.email ? String(body.email).trim() : '';

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: 'Order number and email are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Find order by order number + email (case-insensitive)
    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .select(
        'id, order_number, created_at, subtotal, discount_amount, shipping_cost, total, payment_status, fulfillment_status, shipping_address, tracking_number'
      )
      .eq('order_number', orderNumber)
      .ilike('email', email)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: 'No paid order found with that order number and email. Please check and try again.' },
        { status: 404 }
      );
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'This order has not been paid yet.' },
        { status: 403 }
      );
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('mi_order_items')
      .select('*')
      .eq('order_id', order.id);

    // Enrich with digital flags and download tokens
    const productIds = (items || []).map((item) => item.product_id).filter(Boolean);
    let digitalMap = new Map<string, boolean>();

    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from('mi_products')
        .select('id, digital_file_path')
        .in('id', productIds);

      digitalMap = new Map(
        (products || []).map((p) => [p.id, !!p.digital_file_path])
      );
    }

    const enrichedItems = (items || []).map((item) => {
      const isDigital = digitalMap.get(item.product_id) || false;
      return {
        id: item.id,
        name: item.name || item.product_name || 'Product',
        image_url: item.image_url || item.product_image || null,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        variant_info: item.variant_info || null,
        is_digital: isDigital,
        download_token: isDigital ? generateDownloadToken(order.id, item.id) : undefined,
      };
    });

    return NextResponse.json({
      order: {
        id: order.id,
        order_number: order.order_number,
        created_at: order.created_at,
        subtotal: order.subtotal,
        discount_amount: order.discount_amount,
        shipping_cost: order.shipping_cost,
        total: order.total,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        tracking_number: order.tracking_number,
      },
      items: enrichedItems,
    });
  } catch (error) {
    console.error('[Order Lookup] Error:', error);
    return NextResponse.json({ error: 'Unable to look up order' }, { status: 500 });
  }
}
