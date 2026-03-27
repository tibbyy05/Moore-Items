import { NextRequest, NextResponse } from 'next/server';
import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendShippingUpdate } from '@/lib/email/sendgrid';

async function requireAdmin() {
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

  return { supabase };
}

function extractTrackingInfo(payload: any) {
  let info = payload;
  if (Array.isArray(payload?.trackingInfoList)) info = payload.trackingInfoList[0];
  else if (Array.isArray(payload?.trackingInfo)) info = payload.trackingInfo[0];
  else if (Array.isArray(payload?.logisticTrackingInfo)) info = payload.logisticTrackingInfo[0];
  else if (Array.isArray(payload)) info = payload[0];

  const trackingNumber =
    info?.trackingNumber || info?.trackingNo || info?.tracking_no || info?.trackNumber || null;
  const trackingUrl =
    info?.trackingUrl || info?.tracking_url || info?.trackUrl || info?.logisticUrl || null;
  const carrier = info?.logisticName || info?.carrier || info?.logisticCompany || null;
  const status =
    info?.status ||
    info?.trackingStatus ||
    info?.logisticStatus ||
    payload?.status ||
    payload?.logisticStatus ||
    null;

  return { trackingNumber, trackingUrl, carrier, status };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const orderId = body?.orderId;
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .select('id, order_number, cj_order_id, cj_order_number, fulfillment_status, email, shipping_address, shipping_email_sent_at')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const cjTrackingId = order.cj_order_id || order.cj_order_number;
    if (!cjTrackingId) {
      return NextResponse.json({ error: 'Missing CJ order ID' }, { status: 400 });
    }

    const trackingPayload = await cjClient.getTracking(cjTrackingId);
    const { trackingNumber, trackingUrl, carrier, status } = extractTrackingInfo(trackingPayload);

    let nextStatus = order.fulfillment_status;
    if (typeof status === 'string' && status.toLowerCase().includes('delivered')) {
      nextStatus = 'delivered';
    } else if (trackingNumber) {
      nextStatus = 'shipped';
    }

    await supabase
      .from('mi_orders')
      .update({
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        carrier,
        cj_status: status,
        fulfillment_status: nextStatus,
      })
      .eq('id', orderId);

    // Send shipping email if tracking found and not already sent
    let emailSent = false;
    if (trackingNumber && order.email && !order.shipping_email_sent_at) {
      try {
        const address = (order.shipping_address || {}) as any;
        const customerName = address?.name || order.email.split('@')[0];

        const { data: orderItems } = await supabase
          .from('mi_order_items')
          .select('name, quantity, unit_price, image_url')
          .eq('order_id', order.id);

        const uspsUrl = `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;

        await sendShippingUpdate({
          customerEmail: order.email,
          customerName,
          orderNumber: order.order_number,
          trackingNumber,
          trackingUrl: trackingUrl || uspsUrl,
          carrier: carrier || 'USPS',
          items: (orderItems || []).map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: Number(item.unit_price || 0),
            image_url: item.image_url || undefined,
          })),
          shippingAddress: {
            line1: address?.line1 || '',
            city: address?.city || '',
            state: address?.state || '',
            postal_code: address?.postal_code || '',
          },
        });

        await supabase
          .from('mi_orders')
          .update({ shipping_email_sent_at: new Date().toISOString() })
          .eq('id', order.id);

        emailSent = true;
      } catch (emailError: any) {
        console.error(`[tracking] Email failed for ${order.order_number}:`, emailError?.message);
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      tracking: { trackingNumber, trackingUrl, carrier, status },
    });
  } catch (error: any) {
    console.error('Tracking check error', error);
    return NextResponse.json({ error: error.message || 'Tracking check failed' }, { status: 500 });
  }
}
