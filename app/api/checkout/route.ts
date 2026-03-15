import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { cjClient } from '@/lib/cj/client';

const checkoutRateLimiter = new Map<string, number[]>();

interface CheckoutItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxRequests = 5;

    const timestamps = checkoutRateLimiter.get(ip) ?? [];
    const recent = timestamps.filter((t) => now - t < windowMs);

    if (recent.length >= maxRequests) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a few minutes before trying again.' },
        { status: 429 }
      );
    }

    recent.push(now);
    checkoutRateLimiter.set(ip, recent);

    // Cleanup: remove IPs with no recent activity to prevent memory leak
    if (checkoutRateLimiter.size > 500) {
      Array.from(checkoutRateLimiter.entries()).forEach(([key, times]) => {
        if (times.every((t) => now - t >= windowMs)) checkoutRateLimiter.delete(key);
      });
    }

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
      .select('id, name, retail_price, images, stock_count, status, warehouse, digital_file_path, cj_raw_data, cj_pid, shipping_cost')
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
      is_active: boolean | null;
      name: string | null;
      cj_vid: string | null;
      color: string | null;
      size: string | null;
    }> = [];

    if (variantIds.length > 0) {
      const { data: variantData, error: variantError } = await supabase
        .from('mi_product_variants')
        .select('id, product_id, retail_price, stock_count, is_active, name, cj_vid, color, size')
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
      variantInfo: string | null;
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

      // Note: product.stock_count is not checked here — it can be stale.
      // Variant-level stock_count (maintained by stock sync + webhooks) is the source of truth.

      let unitPrice = Number(product.retail_price || 0);
      let variantName: string | null = null;
      let variantInfo: string | null = null;
      let cjVid: string | null = null;

      if (item.variantId) {
        const variant = variantMap.get(item.variantId);
        if (!variant || variant.product_id !== product.id) {
          return NextResponse.json(
            { error: 'One or more variants are unavailable' },
            { status: 400 }
          );
        }
        if (variant.is_active === false) {
          return NextResponse.json(
            { error: `${product.name} is currently unavailable` },
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

        // Build variant_info from color/size
        const infoParts: string[] = [];
        if (variant.color) infoParts.push(variant.color);
        if (variant.size) infoParts.push(variant.size);
        variantInfo = infoParts.length > 0 ? infoParts.join(' \u00b7 ') : null;
      } else {
        // No variant selected — check if this product actually has variants
        const { count: variantCount } = await supabase
          .from('mi_product_variants')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', product.id)
          .eq('is_active', true);

        if (variantCount && variantCount > 1) {
          // Product has multiple active variants but none was selected — reject
          return NextResponse.json(
            { error: `Please select a variant for ${product.name}` },
            { status: 400 }
          );
        }

        // Single or no variants — try to get cj_vid from the product's first variant
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
        warehouse: (product.warehouse || 'US') as 'US' | 'CN',
        variantName,
        variantInfo,
        isDigital: !!product.digital_file_path,
        cjVid,
        productWeightGrams,
      });
    }

    // ─── CJ Stock Validation ──────────────────────────────────────
    // Cross-check CJ product status with DB stock. DB is source of truth
    // when CJ API and CJ website disagree — only block if both agree it's dead.
    const cjItems = validatedItems
      .map((item) => {
        const product = productMap.get(item.productId);
        return product?.cj_pid ? { id: item.productId, name: item.name, cjPid: product.cj_pid as string, variantId: item.variantId } : null;
      })
      .filter((item): item is { id: string; name: string; cjPid: string; variantId: string | null } => item !== null);

    if (cjItems.length > 0) {
      const unavailableProducts: { id: string; name: string }[] = [];

      for (const cjItem of cjItems) {
        // Look up DB state for this item
        const product = productMap.get(cjItem.id);
        const variant = cjItem.variantId ? variantMap.get(cjItem.variantId) : null;
        const dbStockPositive = variant ? (variant.stock_count ?? 0) > 0 : true;
        const dbProductActive = product?.status === 'active';

        try {
          const cjProductData = await cjClient.getProduct(cjItem.cjPid);

          // Check if CJ reports the product as disabled/delisted
          const cjStatus = (cjProductData as any)?.productStatus ?? (cjProductData as any)?.status;
          const isDisabled = cjStatus === 0 || cjStatus === '0' || cjStatus === 'DISABLE';

          if (isDisabled) {
            if (dbStockPositive && dbProductActive) {
              // CJ says disabled but DB has stock — trust DB, log warning
              console.warn(`[checkout] CJ reports disabled but DB has stock, proceeding: ${cjItem.name} (pid=${cjItem.cjPid}, dbStock=${variant?.stock_count ?? 'N/A'})`);
            } else {
              // Both CJ and DB agree it's dead
              console.warn(`[checkout] CJ disabled + DB confirms unavailable: ${cjItem.name} (pid=${cjItem.cjPid})`);
              unavailableProducts.push({ id: cjItem.id, name: cjItem.name });
            }
          }
        } catch (error: any) {
          const msg = error?.message || '';
          if (msg.includes('CJ API error')) {
            // CJ explicitly rejected the product — cross-check with DB
            if (dbStockPositive && dbProductActive) {
              // DB says it's fine — trust DB, log warning for investigation
              console.warn(`[checkout] CJ API error but DB has stock, proceeding: ${cjItem.name} (pid=${cjItem.cjPid}): ${msg}`);
            } else {
              // DB also shows no stock or inactive — block
              console.warn(`[checkout] CJ API error + DB confirms unavailable: ${cjItem.name} (pid=${cjItem.cjPid}): ${msg}`);
              unavailableProducts.push({ id: cjItem.id, name: cjItem.name });
            }
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

    // Build Stripe shipping_options from per-product shipping_cost in the database
    const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = [];

    if (!allDigital) {
      // Sum shipping_cost from each physical product (multiplied by quantity)
      const totalShipping = physicalItems.reduce((sum, item) => {
        const product = productMap.get(item.productId);
        const productShippingCost = Number(product?.shipping_cost ?? 0);
        return sum + productShippingCost * item.quantity;
      }, 0);
      const totalShippingCents = Math.round(totalShipping * 100);

      // Determine if any product ships from China
      const isInternational = physicalItems.some(item => item.warehouse === 'CN');

      console.log(`[checkout] Shipping calc: totalShipping=$${totalShipping.toFixed(2)}, isInternational=${isInternational}`);

      if (totalShippingCents === 0) {
        shippingOptions.push({
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'usd' },
            display_name: 'Free Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: isInternational ? 7 : 2 },
              maximum: { unit: 'business_day' as const, value: isInternational ? 15 : 5 },
            },
          },
        });
      } else {
        shippingOptions.push({
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: totalShippingCents, currency: 'usd' },
            display_name: isInternational ? 'International Shipping' : 'Standard Shipping',
            delivery_estimate: {
              minimum: { unit: 'business_day' as const, value: isInternational ? 7 : 2 },
              maximum: { unit: 'business_day' as const, value: isInternational ? 15 : 5 },
            },
          },
        });
      }
    }

    // Use cheapest available option as estimated shipping for preliminary order
    const minShippingCost = shippingOptions.length > 0
      ? Math.min(...shippingOptions.map(o => o.shipping_rate_data?.fixed_amount?.amount ?? 0)) / 100
      : 0;
    const total = Math.max(subtotal - discountAmount + minShippingCost, 0);

    const { data: order, error: orderError } = await supabase
      .from('mi_orders')
      .insert({
        order_number: `MI-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        fulfillment_status: 'unfulfilled',
        payment_status: 'pending',
        subtotal,
        discount_amount: discountAmount,
        discount_code: appliedDiscountCode,
        shipping_cost: minShippingCost,
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
      warehouse: item.warehouse,
      variant_info: item.variantInfo,
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
        shipping_method: allDigital ? 'digital' : (minShippingCost === 0 ? 'free' : 'standard'),
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
