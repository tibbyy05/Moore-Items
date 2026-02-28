import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { fulfillCJOrder } from '@/lib/cj/fulfill-order';
import { sendAbandonedCart, sendOrderConfirmation } from '@/lib/email/sendgrid';
import { generateDownloadToken } from '@/lib/download-token';

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
      const isAllDigital = session.metadata?.is_all_digital === 'true';

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

        // Check if order contains digital items
        const { data: orderProducts } = await supabase
          .from('mi_order_items')
          .select('product_id')
          .eq('order_id', orderId);

        const digitalProductIds: string[] = [];
        if (orderProducts && orderProducts.length > 0) {
          const pIds = Array.from(new Set(orderProducts.map((op) => op.product_id)));
          const { data: products } = await supabase
            .from('mi_products')
            .select('id, digital_file_path')
            .in('id', pIds);

          (products || []).forEach((p) => {
            if (p.digital_file_path) digitalProductIds.push(p.id);
          });
        }

        const hasDigitalItems = digitalProductIds.length > 0;

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
              .select('id, product_name, quantity, unit_price, product_image, variant_info, product_id')
              .eq('order_id', orderId);

            if (order) {
              const customerName = shippingAddress?.name
                || session.customer_details?.name
                || 'Customer';

              // Generate download links for digital items
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mooreitems.com';
              const downloadLinks: Array<{ itemName: string; downloadUrl: string }> = [];

              if (hasDigitalItems) {
                (orderItems || []).forEach((item) => {
                  if (digitalProductIds.includes(item.product_id)) {
                    const token = generateDownloadToken(orderId, item.id);
                    downloadLinks.push({
                      itemName: item.product_name || 'Digital Product',
                      downloadUrl: `${siteUrl}/api/downloads/${orderId}/${item.id}?token=${token}`,
                    });
                  }
                });
              }

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
                  is_digital: digitalProductIds.includes(item.product_id),
                })),
                subtotal: order.subtotal || (session.amount_subtotal || 0) / 100,
                shippingCost: order.shipping_cost || 0,
                discount: order.discount_amount || 0,
                discountCode: discountCode || undefined,
                total: order.total || (session.amount_total || 0) / 100,
                shippingAddress: isAllDigital
                  ? undefined
                  : {
                      line1: shippingAddress?.line1 || '',
                      line2: shippingAddress?.line2 || undefined,
                      city: shippingAddress?.city || '',
                      state: shippingAddress?.state || '',
                      postal_code: shippingAddress?.postal_code || '',
                      country: shippingAddress?.country || 'US',
                    },
                estimatedDelivery: isAllDigital ? 'Instant Download' : '2-5 business days',
                downloadLinks: downloadLinks.length > 0 ? downloadLinks : undefined,
                isAllDigital,
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

        // Fulfillment: handle digital vs physical orders
        try {
          if (isAllDigital) {
            // All-digital order: mark as delivered immediately
            await supabase
              .from('mi_orders')
              .update({
                fulfillment_status: 'delivered',
                notes: '[fulfillment] Digital order — delivered instantly',
              })
              .eq('id', orderId);
            console.log(`[Webhook] Order ${orderId}: All-digital order, marked as delivered`);
          } else {
            // Trigger CJ fulfillment (skips gracefully for non-CJ products)
            const result = await fulfillCJOrder(orderId);
            if (result.skipped) {
              // No CJ items — mark as unfulfilled for manual handling
              await supabase
                .from('mi_orders')
                .update({
                  fulfillment_status: hasDigitalItems ? 'processing' : 'unfulfilled',
                  notes: hasDigitalItems
                    ? '[fulfillment] Mixed order — digital items delivered, physical items require fulfillment'
                    : '[fulfillment] Non-CJ order — requires manual fulfillment',
                })
                .eq('id', orderId);
              console.log(`[Webhook] Order ${orderId}: ${result.message}`);
            } else if (!result.success) {
              console.error('CJ fulfillment failed', result.message);
            }
          }
        } catch (error) {
          console.error('CJ fulfillment error', error);
        }
      }

      // Track promo code usage (never breaks order flow)
      if (discountCode && orderId) {
        try {
          await trackPromoCodeUsage(supabase, discountCode, orderId);
        } catch (trackError) {
          console.error('[Webhook] Promo code tracking failed (non-fatal):', trackError);
        }
      }
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;

      const { data: order, error: orderError } = await supabase
        .from('mi_orders')
        .select('id, email, notes, payment_status, fulfillment_status')
        .eq('stripe_session_id', session.id)
        .maybeSingle();

      if (orderError) {
        console.error('[Webhook] Abandoned cart lookup failed:', orderError);
      }

      if (order && order.payment_status === 'pending') {
        const noteFlag = 'abandoned cart email sent';
        const alreadySent = String(order.notes || '').includes(noteFlag);

        if (!alreadySent) {
          const { data: orderItems, error: itemsError } = await supabase
            .from('mi_order_items')
            .select('name, image_url, quantity, unit_price, product_name, product_image')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error('[Webhook] Abandoned cart items lookup failed:', itemsError);
          } else {
            const customerName = session.customer_details?.name || 'Customer';
            const email = session.customer_details?.email || session.customer_email || order.email || '';

            if (email) {
              await sendAbandonedCart({
                customerName,
                email,
                cartUrl: 'https://www.mooreitems.com/cart',
                orderItems: (orderItems || []).map((item) => ({
                  name: item.product_name || item.name || 'Item',
                  image_url: item.product_image || item.image_url || undefined,
                  quantity: Number(item.quantity || 1),
                  unit_price: Number(item.unit_price || 0),
                })),
              });

              const noteEntry = `[abandoned] ${new Date().toISOString()} abandoned cart email sent`;
              await supabase
                .from('mi_orders')
                .update({
                  notes: order.notes ? `${order.notes}\n${noteEntry}` : noteEntry,
                })
                .eq('id', order.id);
            }
          }
        }

        await supabase
          .from('mi_orders')
          .update({ fulfillment_status: 'cancelled', payment_status: 'expired' })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook handler error', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function trackPromoCodeUsage(
  supabase: ReturnType<typeof createAdminClient>,
  discountCode: string,
  orderId: string
) {
  // Look up the discount code with all fields
  const { data: discount } = await supabase
    .from('mi_discount_codes')
    .select('*')
    .eq('code', discountCode)
    .maybeSingle();

  if (!discount) return;

  // Prevent duplicate tracking — check if usage already exists for this order
  const { data: existingUsage } = await supabase
    .from('mi_discount_code_usage')
    .select('id')
    .eq('discount_code_id', discount.id)
    .eq('order_id', orderId)
    .maybeSingle();

  if (existingUsage) return;

  // Get order details for revenue tracking
  const { data: order } = await supabase
    .from('mi_orders')
    .select('order_number, email, subtotal, total, discount_amount')
    .eq('id', orderId)
    .single();

  if (!order) return;

  const orderSubtotal = Number(order.subtotal || 0);
  const orderTotal = Number(order.total || 0);
  const discountAmount = Number(order.discount_amount || 0);

  // Calculate influencer payout (flat $ takes priority over %)
  let influencerPayout = 0;
  if (discount.code_type === 'influencer') {
    if (discount.payout_per_use && Number(discount.payout_per_use) > 0) {
      influencerPayout = Number(discount.payout_per_use);
    } else if (discount.payout_percent && Number(discount.payout_percent) > 0) {
      influencerPayout = (orderSubtotal * Number(discount.payout_percent)) / 100;
    }
  }

  // Insert usage record
  await supabase.from('mi_discount_code_usage').insert({
    discount_code_id: discount.id,
    code: discountCode,
    order_id: orderId,
    order_number: order.order_number || null,
    customer_email: order.email || null,
    discount_amount: discountAmount,
    order_subtotal: orderSubtotal,
    order_total: orderTotal,
    influencer_payout: influencerPayout,
    payout_status: discount.code_type === 'influencer' ? 'pending' : 'paid',
  });

  // Atomically increment stats via RPC
  await supabase.rpc('increment_discount_code_stats', {
    p_code_id: discount.id,
    p_revenue: orderTotal,
    p_discount: discountAmount,
  });
}
