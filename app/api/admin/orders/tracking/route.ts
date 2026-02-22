import { NextRequest, NextResponse } from 'next/server';
import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
      .select('id, cj_order_number, fulfillment_status')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!order.cj_order_number) {
      return NextResponse.json({ error: 'Missing CJ order number' }, { status: 400 });
    }

    const trackingPayload = await cjClient.getTracking(order.cj_order_number);
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

    return NextResponse.json({
      success: true,
      tracking: { trackingNumber, trackingUrl, carrier, status },
    });
  } catch (error: any) {
    console.error('Tracking check error', error);
    return NextResponse.json({ error: error.message || 'Tracking check failed' }, { status: 500 });
  }
}
