import { NextRequest, NextResponse } from 'next/server';
import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendShippingUpdate } from '@/lib/email/sendgrid';

async function checkAuth(request: NextRequest): Promise<{ authorized: boolean }> {
  // Check for cron secret key first
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const cronSecret = process.env.TRACKING_SYNC_SECRET;
  if (cronSecret && key === cronSecret) {
    return { authorized: true };
  }

  // Fall back to admin session auth
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { authorized: false };

    const { data: adminProfile } = await supabase
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return { authorized: !!adminProfile };
  } catch {
    return { authorized: false };
  }
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
  const { authorized } = await checkAuth(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Find all orders that are processing with a CJ order number
  const { data: orders, error } = await supabase
    .from('mi_orders')
    .select(
      'id, order_number, cj_order_number, fulfillment_status, email, shipping_address, shipping_email_sent_at'
    )
    .or('fulfillment_status.eq.processing,fulfillment_status.eq.shipped')
    .not('cj_order_number', 'is', null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!orders || orders.length === 0) {
    return NextResponse.json({ checked: 0, updated: 0, emailed: 0, results: [] });
  }

  const results: Array<{
    order_number: string;
    tracking_number: string | null;
    status: string | null;
    updated: boolean;
    emailed: boolean;
    error?: string;
  }> = [];
  let updated = 0;
  let emailed = 0;

  for (const order of orders) {
    try {
      const trackingPayload = await cjClient.getTracking(order.cj_order_number!);
      const { trackingNumber, trackingUrl, carrier, status } = extractTrackingInfo(trackingPayload);

      let nextStatus = order.fulfillment_status;
      if (typeof status === 'string' && status.toLowerCase().includes('delivered')) {
        nextStatus = 'delivered';
      } else if (trackingNumber) {
        nextStatus = 'shipped';
      }

      const updateData: Record<string, any> = {
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        carrier,
        cj_status: status,
        fulfillment_status: nextStatus,
      };

      // Clear old CJ error notes when we get tracking info
      if (trackingNumber) {
        updateData.notes = null;
      }

      await supabase.from('mi_orders').update(updateData).eq('id', order.id);

      updated += 1;

      // Send shipping email if tracking found and not already sent
      let didEmail = false;
      if (trackingNumber && order.email && !order.shipping_email_sent_at) {
        try {
          const address = (order.shipping_address || {}) as any;
          const customerName = address?.name || order.email.split('@')[0];

          // Fetch order items for the email
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

          didEmail = true;
          emailed += 1;
        } catch (emailError: any) {
          console.error(`[sync-tracking] Email failed for ${order.order_number}:`, emailError?.message);
        }
      }

      results.push({
        order_number: order.order_number,
        tracking_number: trackingNumber,
        status,
        updated: true,
        emailed: didEmail,
      });
    } catch (err: any) {
      console.error(`[sync-tracking] Error for ${order.order_number}:`, err?.message);
      results.push({
        order_number: order.order_number,
        tracking_number: null,
        status: null,
        updated: false,
        emailed: false,
        error: err?.message || 'Unknown error',
      });
    }
  }

  return NextResponse.json({ checked: orders.length, updated, emailed, results });
}
