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

  const { data: items, error: itemsError } = await supabase
    .from('mi_order_items')
    .select('id, product_id, variant_id, quantity')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) {
    return { success: false, message: 'Order items not found' };
  }

  const variantIds = Array.from(new Set(items.map((item) => item.variant_id).filter(Boolean)));

  const { data: variants } =
    variantIds.length > 0
      ? await supabase.from('mi_product_variants').select('id, cj_vid').in('id', variantIds)
      : { data: [] };

  const variantMap = new Map((variants || []).map((variant) => [variant.id, variant.cj_vid]));

  // Separate items into CJ-fulfillable and non-CJ
  const cjItems = items.filter((item) => variantMap.get(item.variant_id || ''));
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
    vid: variantMap.get(item.variant_id || '') as string,
    quantity: item.quantity,
  }));

  const shipping = order.shipping_address || {};
  const shippingPhone = normalizeText(shipping.phone, '0000000000');

  const countryCode = normalizeText(shipping.country, 'US');
  const shippingPayload = {
    orderNumber: normalizeText(order.order_number, `MI-${order.id}`),
    shippingZip: normalizeText(shipping.postal_code, '00000'),
    shippingCountryCode: countryCode,
    shippingCountry: countryCode,
    countryCode: countryCode,
    fromCountryCode: 'US',
    shippingProvince: normalizeText(shipping.state, 'Unknown'),
    shippingCity: normalizeText(shipping.city, 'Unknown'),
    shippingAddress: normalizeText(
      [shipping.line1, shipping.line2].filter(Boolean).join(' '),
      'Unknown Address'
    ),
    shippingCustomerName: normalizeText(shipping.name, order.email || 'Customer'),
    shippingPhone,
    logisticName: 'USPS+',
    products: productsPayload.map(p => ({ ...p, wareHouseCountryCode: 'US' })),
    payType: 2,
  };

  try {
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
