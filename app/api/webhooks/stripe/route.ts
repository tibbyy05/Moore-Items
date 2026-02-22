import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { fulfillCJOrder } from '@/lib/cj/fulfill-order';
import { sendOrderConfirmation } from '@/lib/email/sendgrid';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Stripe webhook signature verification failed', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.supabase_order_id;
      const discountCode = session.metadata?.discount_code || null;

      const shippingDetails = session.shipping_details || session.customer_details;
      const shippingAddress = shippingDetails?.address
        ? {
            name: shippingDetails?.name || null,
            line1: shippingDetails.address.line1 || null,
            line2: shippingDetails.address.line2 || null,
            city: shippingDetails.address.city || null,
            state: shippingDetails.address.state || null,
            postal_code: shippingDetails.address.postal_code || null,
            country: shippingDetails.address.country || null,
          }
        : null;

      if (orderId) {
        // Update order status
        await supabase
          .from('mi_orders')
          .update({
            fulfillment_status: 'processing',
            payment_status: 'paid',
            stripe_payment_intent_id: session.payment_intent,
            stripe_session_id: session.id,
            email: session.customer_details?.email || session.customer_email || null,
            shipping_address: shippingAddress,
          })
          .eq('id', orderId);

        // ---- SEND ORDER CONFIRMATION EMAIL ----
        try {
          const customerEmail = session.customer_details?.email || session.customer_email;
          if (customerEmail) {
            // Get order details
            const { data: order } = await supabase
              .from('mi_orders')
              .select('order_number, total, subtotal, shipping_cost, discount_amount')
              .eq('id', orderId)
              .single();

            // Get order items
            const { data: orderItems } = await supabase
              .from('mi_order_items')
              .select('product_name, quantity, unit_price, product_image, variant_info')
              .eq('order_id', orderId);

            if (order) {
              const customerName = shippingAddress?.name
                || session.customer_details?.name
                || 'Customer';

              await sendOrderConfirmation({
                customerEmail,
                customerName,
                orderNumber: order.order_number,
                items: (orderItems || []).map(item => ({
                  name: item.product_name,
                  quantity: item.quantity,
                  price: item.unit_price,
                  image_url: item.product_image || undefined,
                  variant_info: item.variant_info || undefined,
                })),
                subtotal: order.subtotal || (session.amount_subtotal || 0) / 100,
                shippingCost: order.shipping_cost || 0,
                discount: order.discount_amount || 0,
                discountCode: discountCode || undefined,
                total: order.total || (session.amount_total || 0) / 100,
                shippingAddress: {
                  line1: shippingAddress?.line1 || '',
                  line2: shippingAddress?.line2 || undefined,
                  city: shippingAddress?.city || '',
                  state: shippingAddress?.state || '',
                  postal_code: shippingAddress?.postal_code || '',
                  country: shippingAddress?.country || 'US',
                },
                estimatedDelivery: '2-5 business days',
              });

              // Mark email as sent
              await supabase
                .from('mi_orders')
                .update({ email_sent_at: new Date().toISOString() })
                .eq('id', orderId);

              console.log(`[Webhook] Order confirmation email sent for #${order.order_number}`);
            }
          }
        } catch (emailError) {
          // Never fail the webhook if email fails — order is still valid
          console.error('[Webhook] Failed to send order confirmation email:', emailError);
        }
        // ---- END EMAIL ----

        // Trigger CJ fulfillment (skips gracefully for non-CJ products)
        try {
          const result = await fulfillCJOrder(orderId);
          if (result.skipped) {
            // No CJ items — mark as unfulfilled for manual handling
            await supabase
              .from('mi_orders')
              .update({
                fulfillment_status: 'unfulfilled',
                notes: '[fulfillment] Non-CJ order — requires manual fulfillment',
              })
              .eq('id', orderId);
            console.log(`[Webhook] Order ${orderId}: ${result.message}`);
          } else if (!result.success) {
            console.error('CJ fulfillment failed', result.message);
          }
        } catch (error) {
          console.error('CJ fulfillment error', error);
        }
      }

      if (discountCode) {
        const { data: discount } = await supabase
          .from('mi_discount_codes')
          .select('id, used_count')
          .eq('code', discountCode)
          .maybeSingle();

        if (discount) {
          await supabase
            .from('mi_discount_codes')
            .update({ used_count: Number(discount.used_count || 0) + 1 })
            .eq('id', discount.id);
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.supabase_order_id;
      if (orderId) {
        await supabase
          .from('mi_orders')
          .update({ fulfillment_status: 'cancelled', payment_status: 'expired' })
          .eq('id', orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}