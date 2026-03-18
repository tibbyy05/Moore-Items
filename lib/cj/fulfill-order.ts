import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';

type FulfillResult = {
  success: boolean;
  message: string;
  skipped?: boolean;
  cjOrderId?: string | null;
  cjOrderNumber?: string | null;
};

function buildOrderNotes(message: string) {
  return `[cj fulfill] ${new Date().toISOString()} ${message}`;
}

function normalizeText(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return fallback;
}

function extractCjOrderFields(payload: any) {
  const cjOrderId =
    payload?.orderId ||
    payload?.order_id ||
    payload?.order?.orderId ||
    payload?.order?.order_id ||
    payload?.id ||
    null;
  const cjOrderNumber =
    payload?.orderNumber ||
    payload?.order_number ||
    payload?.order?.orderNumber ||
    payload?.order?.order_number ||
    payload?.number ||
    null;
  return { cjOrderId, cjOrderNumber };
}

/* ─── Bundle optimizer: substitute 2pcs SKUs for blender 1pc pairs ──── */

const BLENDER_1PC = {
  WHITE: '48351620-4f42-47ed-8c26-937b7150169e',
  PINK: '819499d5-5329-4c05-a26e-89db7bfacbb4',
} as const;

const BLENDER_2PC = {
  WHITE_PINK: '8ea0cb27-d358-486c-9437-516c57577c3b',
  WHITE: '20aa1125-9861-4cf1-8104-7356afb2c333',
  PINK: '04ec7b72-5cae-49f2-8fca-1acd96a144f1',
} as const;

type CjItem = { variant_id: string; cj_vid: string; quantity: number; product_id: string; [key: string]: any };

async function optimizeBundleItems(items: CjItem[], supabase: ReturnType<typeof createAdminClient>): Promise<CjItem[]> {
  try {
    const blender1pcIds = new Set<string>([BLENDER_1PC.WHITE, BLENDER_1PC.PINK]);

    // Separate blender 1pc items from everything else
    const blenderItems: CjItem[] = [];
    const otherItems: CjItem[] = [];
    for (const item of items) {
      if (blender1pcIds.has(item.variant_id)) {
        blenderItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    if (blenderItems.length === 0) return items;

    // Sum quantities per color
    let whiteQty = 0;
    let pinkQty = 0;
    let productId = blenderItems[0].product_id;
    for (const item of blenderItems) {
      if (item.variant_id === BLENDER_1PC.WHITE) whiteQty += item.quantity;
      if (item.variant_id === BLENDER_1PC.PINK) pinkQty += item.quantity;
    }

    const origWhite = whiteQty;
    const origPink = pinkQty;

    // Look up cj_vids and stock for all 2pc variants in one query
    const twopcIds = [BLENDER_2PC.WHITE_PINK, BLENDER_2PC.WHITE, BLENDER_2PC.PINK];
    const { data: twopcVariants } = await supabase
      .from('mi_product_variants')
      .select('id, cj_vid, stock_count')
      .in('id', twopcIds);

    const twopcMap = new Map((twopcVariants || []).map((v) => [v.id, { cj_vid: v.cj_vid, stock: v.stock_count }]));

    // Build substitutions
    const substituted: CjItem[] = [];

    // Rule 1: White + Pink → White Pink 2pcs
    const wpInfo = twopcMap.get(BLENDER_2PC.WHITE_PINK);
    if (wpInfo?.cj_vid && wpInfo.stock > 0) {
      while (whiteQty >= 1 && pinkQty >= 1) {
        substituted.push({ variant_id: BLENDER_2PC.WHITE_PINK, cj_vid: wpInfo.cj_vid, quantity: 1, product_id: productId });
        whiteQty -= 1;
        pinkQty -= 1;
      }
    }

    // Rule 2: 2× White → White 2pcs
    const w2Info = twopcMap.get(BLENDER_2PC.WHITE);
    if (w2Info?.cj_vid && w2Info.stock > 0) {
      while (whiteQty >= 2) {
        substituted.push({ variant_id: BLENDER_2PC.WHITE, cj_vid: w2Info.cj_vid, quantity: 1, product_id: productId });
        whiteQty -= 2;
      }
    }

    // Rule 3: 2× Pink → Pink 2pcs
    const p2Info = twopcMap.get(BLENDER_2PC.PINK);
    if (p2Info?.cj_vid && p2Info.stock > 0) {
      while (pinkQty >= 2) {
        substituted.push({ variant_id: BLENDER_2PC.PINK, cj_vid: p2Info.cj_vid, quantity: 1, product_id: productId });
        pinkQty -= 2;
      }
    }

    // Remainder: leftover 1pc items
    const remainder: CjItem[] = [];
    if (whiteQty > 0) {
      const whiteCjVid = items.find((i) => i.variant_id === BLENDER_1PC.WHITE)?.cj_vid;
      if (whiteCjVid) remainder.push({ variant_id: BLENDER_1PC.WHITE, cj_vid: whiteCjVid, quantity: whiteQty, product_id: productId });
    }
    if (pinkQty > 0) {
      const pinkCjVid = items.find((i) => i.variant_id === BLENDER_1PC.PINK)?.cj_vid;
      if (pinkCjVid) remainder.push({ variant_id: BLENDER_1PC.PINK, cj_vid: pinkCjVid, quantity: pinkQty, product_id: productId });
    }

    if (substituted.length > 0) {
      const subSummary = substituted.map((s) => {
        if (s.variant_id === BLENDER_2PC.WHITE_PINK) return 'White+Pink 2pcs';
        if (s.variant_id === BLENDER_2PC.WHITE) return 'White 2pcs';
        return 'Pink 2pcs';
      }).join(', ');
      console.log(`[Bundle optimizer] substituted ${origWhite}x White + ${origPink}x Pink → ${subSummary}${remainder.length > 0 ? ` + ${remainder.map((r) => `${r.quantity}x ${r.variant_id === BLENDER_1PC.WHITE ? 'White' : 'Pink'} 1pc`).join(', ')}` : ''}`);
    }

    return [...otherItems, ...substituted, ...remainder];
  } catch (error) {
    console.warn('[Bundle optimizer] failed, using original items:', error);
    return items;
  }
}

export async function fulfillCJOrder(orderId: string): Promise<FulfillResult> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('mi_orders')
    .select('id, order_number, shipping_address, email')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return { success: false, message: 'Order not found' };
  }

  // Retry loop — checkout route may still be inserting items
  let items: { id: string; product_id: string; variant_id: string | null; quantity: number }[] = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error: itemsError } = await supabase
      .from('mi_order_items')
      .select('id, product_id, variant_id, quantity')
      .eq('order_id', orderId);
    if (itemsError) {
      return { success: false, message: 'Order items query failed' };
    }
    if (data && data.length > 0) { items = data; break; }
    if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
  }

  if (items.length === 0) {
    return { success: false, message: 'Order items not found after 3 attempts' };
  }

  const variantIds = Array.from(new Set(items.map((item) => item.variant_id).filter(Boolean)));

  const { data: variants } =
    variantIds.length > 0
      ? await supabase.from('mi_product_variants').select('id, cj_vid').in('id', variantIds)
      : { data: [] };

  const variantMap = new Map((variants || []).map((variant) => [variant.id, variant.cj_vid]));

  const productIds = Array.from(new Set(items.map((item) => item.product_id)));
  const { data: productData } = await supabase
    .from('mi_products')
    .select('id, warehouse')
    .in('id', productIds);
  const warehouseMap = new Map((productData || []).map((p: any) => [p.id, p.warehouse || 'US']));

  // Separate items into CJ-fulfillable and non-CJ
  const cjItemsRaw = items
    .filter((item) => variantMap.get(item.variant_id || ''))
    .map((item) => ({
      ...item,
      variant_id: item.variant_id || '',
      cj_vid: variantMap.get(item.variant_id || '') as string,
    }));
  const cjItems = await optimizeBundleItems(cjItemsRaw, supabase);
  const nonCjItems = items.filter((item) => !variantMap.get(item.variant_id || ''));

  // If no items have CJ variant IDs, this is a fully non-CJ order — skip fulfillment
  if (cjItems.length === 0) {
    return { success: true, skipped: true, message: 'No CJ items — manual fulfillment required' };
  }

  // If some but not all items have CJ variant IDs, log a warning but fulfill what we can
  if (nonCjItems.length > 0) {
    await supabase
      .from('mi_orders')
      .update({
        notes: buildOrderNotes(
          `${nonCjItems.length} non-CJ item(s) require manual fulfillment`
        ),
      })
      .eq('id', orderId);
  }

  const productsPayload = cjItems.map((item) => ({
    vid: item.cj_vid || variantMap.get(item.variant_id || '') as string,
    quantity: item.quantity,
  }));

  const shipping = order.shipping_address || {};
  const shippingPhone = normalizeText(
    shipping.phone,
    normalizeText(shipping.phone_number, '0000000000')
  );

  const hasCN = cjItems.some((item) => warehouseMap.get(item.product_id) === 'CN');
  const hasUS = cjItems.some((item) => warehouseMap.get(item.product_id) !== 'CN');
  console.log('[cj fulfill] Warehouse routing:', hasCN ? (hasUS ? 'MIXED (US+CN)' : 'CN only') : 'US only');

  const countryCode = normalizeText(shipping.country, 'US');
  const shippingPayload = {
    orderNumber: normalizeText(order.order_number, `MI-${order.id}`),
    shippingZip: normalizeText(shipping.postal_code, '00000'),
    shippingCountryCode: countryCode,
    shippingCountry: countryCode,
    countryCode: countryCode,
    fromCountryCode: hasCN && !hasUS ? 'CN' : 'US',
    shippingProvince: normalizeText(shipping.state, 'Unknown'),
    shippingCity: normalizeText(shipping.city, 'Unknown'),
    shippingAddress: normalizeText(
      [shipping.line1, shipping.line2].filter(Boolean).join(' '),
      'Unknown Address'
    ),
    shippingCustomerName: normalizeText(shipping.name, order.email || 'Customer'),
    shippingPhone,
    logisticName: hasCN && !hasUS ? 'CJPacket' : 'USPS+',
    products: productsPayload.map(p => {
      const itemRecord = items.find(i => variantMap.get(i.variant_id || '') === p.vid);
      const wh = warehouseMap.get(itemRecord?.product_id || '') || 'US';
      return { ...p, wareHouseCountryCode: wh };
    }),
    payType: 2,
  };

  try {
    if (process.env.FULFILL_DEBUG === 'true') {
      console.log('[cj fulfill] Sending to CJ:', JSON.stringify(shippingPayload, null, 2));
    }
    const response = await cjClient.createOrder(shippingPayload);
    const { cjOrderId, cjOrderNumber } = extractCjOrderFields(response);

    await supabase
      .from('mi_orders')
      .update({
        cj_order_id: cjOrderId,
        cj_order_number: cjOrderNumber,
        notes: null,
      })
      .eq('id', orderId);

    return {
      success: true,
      message: 'CJ order created',
      cjOrderId,
      cjOrderNumber,
    };
  } catch (error: any) {
    const message = error?.message ? String(error.message) : 'CJ order creation failed';
    await supabase
      .from('mi_orders')
      .update({ notes: buildOrderNotes(message) })
      .eq('id', orderId);
    return { success: false, message };
  }
}
