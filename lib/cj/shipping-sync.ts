import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCycle = (cycle?: string | null) => {
  if (!cycle) return null;
  const parts = String(cycle).split('-').map((value) => Number(value.trim()));
  if (parts.length === 2 && parts.every((value) => !Number.isNaN(value))) {
    return { min: parts[0], max: parts[1] };
  }
  const single = Number(cycle);
  if (!Number.isNaN(single)) {
    return { min: single, max: single };
  }
  return null;
};

const buildEstimate = (warehouse: 'US' | 'CN', cycle?: string | null) => {
  if (warehouse === 'US') {
    return '2-5 business days';
  }
  const parsed = parseCycle(cycle);
  if (!parsed) {
    return '10-20 business days';
  }
  const min = parsed.min + 7;
  const max = parsed.max + 14;
  return `${min}-${max} business days`;
};

export async function syncShippingForAll() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from('mi_products')
    .select('id, cj_pid, warehouse')
    .not('cj_pid', 'is', null);

  const list = products || [];
  const deliveryCycleMap = new Map<string, string | null>();
  let page = 1;
  const size = 100;
  let total = 0;

  do {
    const response = await cjClient.getProductsV2({
      page,
      size,
      features: 'enable_description',
    });
    const items = response?.list || [];
    total = response?.total || items.length;
    items.forEach((item: any) => {
      if (item?.pid) {
        deliveryCycleMap.set(item.pid, item.deliveryCycle || item.delivery_cycle || null);
      }
    });
    page += 1;
  } while ((page - 1) * size < total);

  let updated = 0;
  let usWarehouse = 0;
  let cnWarehouse = 0;

  for (let i = 0; i < list.length; i += 1) {
    const product = list[i];
    const cjPid = product.cj_pid;
    if (!cjPid) continue;

    let inventories: any[] = [];
    try {
      const stockData = await cjClient.getProductStock(cjPid);
      const payload = stockData?.data || stockData;
      inventories = payload?.inventories || [];
    } catch {
      inventories = [];
    }

    const usStock = inventories.find(
      (inv: any) => inv.countryCode === 'US' && inv.totalInventoryNum > 0
    );
    const cnStock = inventories.find(
      (inv: any) => inv.countryCode === 'CN' && inv.totalInventoryNum > 0
    );

    const availableWarehouses = inventories
      .filter((inv: any) => inv.totalInventoryNum > 0 && inv.countryCode)
      .map((inv: any) => inv.countryCode);

    const warehouse = usStock ? 'US' : 'CN';
    const deliveryCycle = deliveryCycleMap.get(cjPid) || null;
    const shippingEstimate = buildEstimate(warehouse, deliveryCycle);

    await supabase
      .from('mi_products')
      .update({
        warehouse,
        delivery_cycle_days: deliveryCycle,
        available_warehouses: availableWarehouses,
        shipping_estimate: shippingEstimate,
      })
      .eq('id', product.id);

    if (warehouse === 'US') usWarehouse += 1;
    else cnWarehouse += 1;
    updated += 1;

    await sleep(1200);
  }

  return { updated, usWarehouse, cnWarehouse };
}

export async function syncShippingForProduct(productId: string, cjPid: string) {
  const supabase = createAdminClient();
  let inventories: any[] = [];
  try {
    const stockData = await cjClient.getProductStock(cjPid);
    const payload = stockData?.data || stockData;
    inventories = payload?.inventories || [];
  } catch {
    inventories = [];
  }

  let deliveryCycle: string | null = null;
  try {
    let page = 1;
    const size = 100;
    let total = 0;
    do {
      const response = await cjClient.getProductsV2({
        page,
        size,
        features: 'enable_description',
      });
      const items = response?.list || [];
      total = response?.total || items.length;
      const match = items.find((item: any) => item?.pid === cjPid);
      if (match) {
        deliveryCycle = match.deliveryCycle || match.delivery_cycle || null;
        break;
      }
      page += 1;
    } while ((page - 1) * size < total);
  } catch {
    deliveryCycle = null;
  }

  const usStock = inventories.find(
    (inv: any) => inv.countryCode === 'US' && inv.totalInventoryNum > 0
  );
  const availableWarehouses = inventories
    .filter((inv: any) => inv.totalInventoryNum > 0 && inv.countryCode)
    .map((inv: any) => inv.countryCode);

  const warehouse = usStock ? 'US' : 'CN';
  const shippingEstimate = buildEstimate(warehouse, deliveryCycle);

  const { error } = await supabase
    .from('mi_products')
    .update({
      warehouse,
      delivery_cycle_days: deliveryCycle,
      available_warehouses: availableWarehouses,
      shipping_estimate: shippingEstimate,
    })
    .eq('id', productId);

  if (error) {
    throw new Error(error.message);
  }

  return { warehouse, deliveryCycle, shippingEstimate };
}
