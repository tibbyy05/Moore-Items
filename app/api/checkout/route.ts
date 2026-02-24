import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateShipping } from '@/lib/shipping';
import { CartItem } from '@/lib/types';

interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const items = (body?.items || []) as CheckoutItemInput[];
    const discountCode = body?.discountCode ? String(body.discountCode).trim().toUpperCase() : '';
    const email = body?.email ? String(body.email).trim() : null;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const productIds = Array.from(new Set(items.map((item) => item.productId)));
    const variantIds = Array.from(
      new Set(items.map((item) => item.variantId).filter(Boolean) as string[])
    );

    const { data: products, error: productsError } = await supabase
      .from('mi_products')
      .select('id, name, retail_price, images, stock_count, status, warehouse, digital_file_path')
      .in('id', productIds);

    if (productsError || !products) {
      if (productsError) {
        console.error('Products error:', productsError);
      }
      return NextResponse.json({ error: 'Unable to validate products' }, { status: 500 });
    }

    let variants: Array<{
      id: string;
      product_id: string;
      retail_price: number | null;
      stock_count: number | null;
      name: string | null;
    }> = [];

    if (variantIds.length > 0) {
      const { data: variantData, error: variantError } = await supabase
        .from('mi_product_variants')
        .select('id, product_id, retail_price, stock_count, name')
        .in('id', variantIds);

      if (variantError) {
        console.error('Variant error:', variantError);
        return NextResponse.json({ error: 'Unable to validate variants' }, { status: 500 });
      }
      variants = variantData || [];
    }

    const productMap = new Map(products.map((product) => [product.id, product]));
    const variantMap = new Map(variants.map((variant) => [variant.id, variant]));

    const validatedItems: Array<{
      productId: string;
      variantId: string | null;
      name: string;
      image: string | null;
      unitPrice: number;
      quantity: number;
      warehouse: 'US' | 'CN';
      variantName: string | null;
      isDigital: boolean;
    }> = [];

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== 'active') {
        return NextResponse.json(
          { error: 'One or more products are unavailable' },
          { status: 400 }
        );
      }

      if ((product.stock_count ?? 0) <= 0) {
        return NextResponse.json(
          { error: `${product.name} is out of stock` },
          { status: 400 }
        );
      }

      let unitPrice = Number(product.retail_price || 0);
      let variantName: string | null = null;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.product_id !== product.id) {
          return NextResponse.json(
            { error: 'One or more variants are unavailable' },
            { status: 400 }
          );
        }
        if ((variant.stock_count ?? 0) <= 0) {
          return NextResponse.json(
            { error: `${product.name} variant is out of stock` },
            { status: 400 }
          );
        }
        unitPrice = Number(variant.retail_price ?? unitPrice);
        variantName = variant.name || null;
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const image = Array.isArray(product.images) ? product.images[0] || null : null;

      validatedItems.push({
        productId: product.id,
        variantId: item.variantId ?? null,
        name: product.name,
        image,
        unitPrice,
        quantity,
        warehouse: (product.warehouse || 'CN') as 'US' | 'CN',
        variantName,
        isDigital: !!product.digital_file_path,
      });
    }

    const subtotal = validatedItems.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    let discountAmount = 0;
    let appliedDiscountCode: string | null = null;

    if (discountCode) {
      const { data: discount, error: discountError } = await supabase
        .from('mi_discount_codes')
        .select('*')
        .ilike('code', discountCode)
        .eq('is_active', true)
        .maybeSingle();

      if (discountError) {
        console.error('Discount error:', discountError);
        return NextResponse.json({ error: 'Unable to validate discount' }, { status: 500 });
      }

      if (discount) {
        const minimum = parseFloat(String(discount.min_order_amount || 0));
        if (subtotal >= minimum) {
          const type = String(discount.type || 'fixed');
          const value = parseFloat(String(discount.value || 0));
          discountAmount =
            type === 'percentage' ? Math.max(0, (subtotal * value) / 100) : Math.max(0, value);
          discountAmount = Math.min(discountAmount, subtotal);
          appliedDiscountCode = discountCode;
        }
      }
    }

    // Determine if cart is all-digital (no shipping needed)
    const allDigital = validatedItems.every((item) => item.isDigital);
    const physicalItems = validatedItems.filter((item) => !item.isDigital);

    // Calculate shipping only on physical items
    const cartItems: CartItem[] = physicalItems.map((item) => ({
      productId: item.productId,
      slug: '',
      variantId: item.variantId,
      name: item.name,
      variantName: item.variantName || undefined,
      price: item.unitPrice,
      quantity: item.quantity,
      image: item.image || '',
      warehouse: item.warehouse,
    }));

    const shippingCost = allDigital ? 0 : calculateShipping(cartItems);
    const total = Math.max(subtotal - discountAmount + shippingCost, 0);

    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .insert({
        order_number: `MI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fulfillment_status: 'unfulfilled',
        payment_status: 'pending',
        subtotal,
        discount_amount: discountAmount,
        discount_code: appliedDiscountCode,
        shipping_cost: shippingCost,
        total,
        email,
      })
      .select('id')
      .single();

    if (orderError || !order) {
      if (orderError) {
        console.error('Order error:', orderError);
      }
      return NextResponse.json({ error: 'Unable to create order' }, { status: 500 });
    }

    const orderItems = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      variant_id: item.variantId,
      name: item.name,
      image_url: item.image,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.unitPrice * item.quantity,
    }));

    const { error: orderItemsError } = await supabase
      .from('mi_order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('Order items error:', orderItemsError);
      return NextResponse.json({ error: 'Unable to create order items' }, { status: 500 });
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000';

    // Build shipping options only for carts with physical items
    let shippingLabel = 'Standard Shipping';
    let shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

    if (!allDigital) {
      shippingLabel =
        physicalItems.some((item) => item.warehouse === 'CN')
          ? physicalItems.some((item) => item.warehouse === 'US')
            ? 'Mixed Shipping'
            : 'Standard Shipping'
          : 'Fast US Shipping';

      shippingOptions = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shippingCost * 100), currency: 'usd' },
            display_name: shippingLabel,
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: physicalItems.some((i) => i.warehouse === 'CN') ? 10 : 2 },
              maximum: { unit: 'business_day' as const, value: physicalItems.some((i) => i.warehouse === 'CN') ? 18 : 5 },
            },
          },
        },
      ];
    }

    let couponId: string | undefined;
    if (discountAmount > 0) {
      const coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'usd',
        duration: 'once',
        name: appliedDiscountCode ? `Discount ${appliedDiscountCode}` : 'Discount',
      });
      couponId = coupon.id;
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: validatedItems.map((item) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            images: item.image ? [item.image] : [],
          },
          unit_amount: Math.round(item.unitPrice * 100),
        },
        quantity: item.quantity,
      })),
      discounts: couponId ? [{ coupon: couponId }] : undefined,
      success_url: `${origin}/order/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
      customer_email: email || undefined,
      metadata: {
        discount_code: appliedDiscountCode || '',
        discount_amount: discountAmount.toFixed(2),
        supabase_order_id: order.id,
        is_all_digital: allDigital ? 'true' : 'false',
      },
      // Only collect shipping for carts with physical items
      ...(allDigital
        ? {}
        : {
            shipping_address_collection: { allowed_countries: ['US'] },
            shipping_options: shippingOptions,
          }),
    });

    await supabase
      .from('mi_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
