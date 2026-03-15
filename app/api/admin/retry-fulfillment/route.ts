import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fulfillCJOrder } from '@/lib/cj/fulfill-order';

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

    // Verify the order exists and is in failed state
    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .select('id, fulfillment_status, order_number')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.fulfillment_status !== 'failed') {
      return NextResponse.json(
        { error: `Order is "${order.fulfillment_status}", not "failed"` },
        { status: 400 }
      );
    }

    // Reset status to unfulfilled before retrying
    await supabase
      .from('mi_orders')
      .update({
        fulfillment_status: 'unfulfilled',
        notes: `[retry] ${new Date().toISOString()} Manual retry initiated`,
      })
      .eq('id', orderId);

    // Attempt CJ fulfillment
    const result = await fulfillCJOrder(orderId);

    if (result.success && !result.skipped) {
      return NextResponse.json({
        success: true,
        message: `CJ order created for #${order.order_number}`,
        cjOrderId: result.cjOrderId,
      });
    }

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        message: 'No CJ items — order marked as unfulfilled for manual handling',
      });
    }

    // Fulfillment failed again — set back to failed
    await supabase
      .from('mi_orders')
      .update({ fulfillment_status: 'failed' })
      .eq('id', orderId);

    return NextResponse.json(
      { success: false, error: result.message || 'CJ fulfillment failed again' },
      { status: 502 }
    );
  } catch (error: any) {
    console.error('Retry fulfillment error:', error);
    return NextResponse.json(
      { error: error.message || 'Retry fulfillment failed' },
      { status: 500 }
    );
  }
}
