import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateShippingCost, calculateFlatRateShipping, ShippingItem } from '@/lib/shipping';
import { getShippingConfig } from '@/lib/config/shipping';
import { cjClient } from '@/lib/cj/client';

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
      .select('id, name, retail_price, images, stock_count, status, warehouse, digital_file_path, cj_raw_data, cj_pid')
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
      cj_vid: string | null;
    }> = [];

    if (variantIds.length > 0) {
      const { data: variantData, error: variantError } = await supabase
        .from('mi_product_variants')
        .select('id, product_id, retail_price, stock_count, name, cj_vid')
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
      cjVid: string | null;
      productWeightGrams: number | null;
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
      let cjVid: string | null = null;

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
        cjVid = variant.cj_vid || null;
      } else {
        // No variant selected — try to get cj_vid from the product's first variant
        // (some products have a single default variant)
        if (!cjVid) {
          const { data: defaultVariant } = await supabase
            .from('mi_product_variants')
            .select('cj_vid')
            .eq('product_id', product.id)
            .limit(1)
            .maybeSingle();
          cjVid = defaultVariant?.cj_vid || null;
        }
      }

      const quantity = Math.max(1, Number(item.quantity || 1));
      const image = Array.isArray(product.images) ? product.images[0] || null : null;

      // Extract product weight from cj_raw_data (in grams)
      // CJ stores productWeight as a string (e.g. "8172"), not a number
      let productWeightGrams: number | null = null;
      if (product.cj_raw_data && typeof product.cj_raw_data === 'object') {
        const rawWeight = Number((product.cj_raw_data as any).productWeight);
        if (Number.isFinite(rawWeight) && rawWeight > 0) {
          productWeightGrams = rawWeight;
        }
      }

      console.log(`[checkout] Item: "${product.name}" | cjVid=${cjVid || 'NONE'} | weight=${productWeightGrams !== null ? productWeightGrams + 'g' : 'NULL (no cj_raw_data.productWeight)'} | qty=${quantity} | price=$${unitPrice.toFixed(2)} | digital=${!!product.digital_file_path}`);

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
        cjVid,
        productWeightGrams,
      });
    }

    // ─── CJ Stock Validation ──────────────────────────────────────
    // Check if CJ products are still available before creating Stripe session
    const cjItems = validatedItems
      .map((item) => {
        const product = productMap.get(item.productId);
        return product?.cj_pid ? { id: item.productId, name: item.name, cjPid: product.cj_pid as string } : null;
      })
      .filter((item): item is { id: string; name: string; cjPid: string } => item !== null);

    if (cjItems.length > 0) {
      const unavailableProducts: { id: string; name: string }[] = [];

      for (const cjItem of cjItems) {
        try {
          await cjClient.getProduct(cjItem.cjPid);
        } catch (error: any) {
          const msg = error?.message || '';
          // If CJ says product is removed/not found, mark it unavailable
          // But if the CJ API itself is down/timing out, let checkout proceed
          if (msg.includes('CJ API error')) {
            console.warn(`[checkout] CJ product unavailable: ${cjItem.name} (pid=${cjItem.cjPid}): ${msg}`);
            unavailableProducts.push({ id: cjItem.id, name: cjItem.name });
          } else {
            // Network error, timeout, auth failure — don't block the sale
            console.warn(`[checkout] CJ API unreachable for ${cjItem.name} (pid=${cjItem.cjPid}), skipping check: ${msg}`);
          }
        }
      }

      if (unavailableProducts.length > 0) {
        console.warn('[checkout] Blocking checkout — unavailable CJ products:', unavailableProducts);
        return NextResponse.json(
          { error: 'products_unavailable', unavailableProducts },
          { status: 400 }
        );
      }
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

    // Calculate shipping with CJ real-time quotes (with fallback)
    let shippingResult;
    try {
      const shippingConfig = await getShippingConfig();
      const shippingItems: ShippingItem[] = validatedItems.map((item) => ({
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        isDigital: item.isDigital,
        cjVid: item.cjVid,
        productWeightGrams: item.productWeightGrams,
      }));
      shippingResult = await calculateShippingCost(shippingItems, subtotal, shippingConfig);
    } catch (error) {
      // If anything goes wrong with the new shipping system, fallback to flat rate
      console.error('[checkout] Shipping calculation failed, using flat rate fallback:', error);
      shippingResult = {
        cost: allDigital ? 0 : calculateFlatRateShipping(subtotal),
        method: allDigital ? 'free' as const : (subtotal >= 50 ? 'free' as const : 'flat_rate' as const),
        label: allDigital ? 'Digital Delivery' : (subtotal >= 50 ? 'Free Shipping' : 'Standard Shipping'),
      };
    }

    const shippingCost = shippingResult.cost;
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
    let shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

    if (!allDigital) {
      shippingOptions = [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: Math.round(shippingCost * 100), currency: 'usd' },
            display_name: shippingResult.label,
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
      phone_number_collection: { enabled: true },
      metadata: {
        discount_code: appliedDiscountCode || '',
        discount_amount: discountAmount.toFixed(2),
        supabase_order_id: order.id,
        is_all_digital: allDigital ? 'true' : 'false',
        shipping_method: shippingResult.method,
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
