import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return adminProfile ? user : null;
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: order, error: fetchError } = await supabase
      .from('mi_orders')
      .select('id, stripe_payment_intent_id, payment_status, refund_status, total')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Order is not paid' }, { status: 400 });
    }

    if (order.refund_status === 'refunded') {
      return NextResponse.json({ error: 'Order is already refunded' }, { status: 400 });
    }

    if (!order.stripe_payment_intent_id) {
      return NextResponse.json({ error: 'No Stripe payment intent found' }, { status: 400 });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
    });

    const { error: updateError } = await supabase
      .from('mi_orders')
      .update({
        refund_status: 'refunded',
        refunded_at: new Date().toISOString(),
        stripe_refund_id: refund.id,
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Failed to update order after refund:', updateError);
      return NextResponse.json(
        { error: 'Refund issued but failed to update order record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, refundId: refund.id });
  } catch (error: any) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process refund' },
      { status: 500 }
    );
  }
}
