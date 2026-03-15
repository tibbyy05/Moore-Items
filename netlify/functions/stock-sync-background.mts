// ─── Cron Schedule (cron-job.org) ──────────────────────────────────
// Every hour:  POST /.netlify/functions/stock-sync-background?key=STOCK_SYNC_SECRET
// Each run processes up to BATCH_SIZE products starting from the
// saved offset, cycling through the full catalog throughout the day.
// Risk mode (on-demand): &mode=risk  — skips pagination, checks
// only low-stock + recently-ordered products.
// The Next.js route at /api/admin/catalog/stock-sync proxies here.
// ───────────────────────────────────────────────────────────────────

import { createAdminClient } from '../../lib/supabase/admin';
import { cjClient } from '../../lib/cj/client';
import { sendStockSyncAlert, type StockSyncChange } from '../../lib/email/sendgrid';

const CJ_DELAY_MS = 1200;
const STOCK_CHANGE_THRESHOLD = 5;
const BATCH_SIZE = 50;
const LOCK_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function fetchAll<T>(
  supabase: SupabaseAdmin,
  table: string,
  select: string,
  filters: (query: any) => any
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let all: T[] = [];
  let offset = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(offset, offset + PAGE_SIZE - 1);
    query = filters(query);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as T[];
    all = all.concat(rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

function getProductTotalStock(stockData: any): number {
  const payload = stockData?.data || stockData;
  const inventories = payload?.inventories || (Array.isArray(payload) ? payload : []);
  return inventories.reduce((sum: number, inv: any) => sum + (inv.totalInventoryNum || 0), 0);
}

function getProductUSStock(stockData: any): number {
  const payload = stockData?.data || stockData;
  const inventories = payload?.inventories || (Array.isArray(payload) ? payload : []);
  return inventories
    .filter((inv: any) => inv.countryCode === 'US')
    .reduce((sum: number, inv: any) => sum + (inv.totalInventoryNum || 0), 0);
}

function getProductCNStock(stockData: any): number {
  const payload = stockData?.data || stockData;
  const inventories = payload?.inventories || (Array.isArray(payload) ? payload : []);
  return inventories
    .filter((inv: any) => inv.countryCode === 'CN')
    .reduce((sum: number, inv: any) => sum + (inv.totalInventoryNum || 0), 0);
}

function buildVariantStockMap(stockData: any): Map<string, { us: number; cn: number }> {
  const payload = stockData?.data || stockData;
  const variantInventories: any[] = payload?.variantInventories || [];
  const map = new Map<string, { us: number; cn: number }>();
  for (const v of variantInventories) {
    const vid = v.vid as string;
    if (!vid) continue;
    const entry = { us: 0, cn: 0 };
    for (const inv of v.inventory || []) {
      if (inv.countryCode === 'US') entry.us += inv.totalInventory || 0;
      else if (inv.countryCode === 'CN') entry.cn += inv.totalInventory || 0;
    }
    map.set(vid, entry);
  }
  return map;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function buildRiskProductIds(supabase: SupabaseAdmin): Promise<Set<string>> {
  const riskIds = new Set<string>();

  const lowStockVariants = await fetchAll<any>(
    supabase,
    'mi_product_variants',
    'product_id',
    (q: any) => q.eq('is_active', true).lt('stock_count', 25)
  );
  for (const v of lowStockVariants) {
    if (v.product_id) riskIds.add(v.product_id);
  }

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const recentOrders = await fetchAll<any>(
    supabase,
    'mi_orders',
    'id',
    (q: any) => q.gte('created_at', fourteenDaysAgo).eq('payment_status', 'paid')
  );

  if (recentOrders.length > 0) {
    const orderIds = recentOrders.map((o: any) => o.id);
    const recentItems = await fetchAll<any>(
      supabase,
      'mi_order_items',
      'product_id',
      (q: any) => q.in('order_id', orderIds)
    );
    for (const item of recentItems) {
      if (item.product_id) riskIds.add(item.product_id);
    }
  }

  return riskIds;
}

export default async (req: Request) => {
  try {
    // ─── Auth ───
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const cronSecret = process.env.STOCK_SYNC_SECRET;
    if (!cronSecret || key !== cronSecret) {
      console.error('[stock-sync-bg] Unauthorized — invalid or missing key');
      return;
    }

    const mode: 'full' | 'risk' = url.searchParams.get('mode') === 'risk' ? 'risk' : 'full';

    const supabase = createAdminClient();

    // ─── Concurrency lock ───
    const { data: lockRow } = await supabase
      .from('mi_settings')
      .select('value, updated_at')
      .eq('key', 'stock_sync_running')
      .maybeSingle();

    if (lockRow && lockRow.updated_at) {
      const lockAge = Date.now() - new Date(lockRow.updated_at).getTime();
      if (lockAge < LOCK_TIMEOUT_MS) {
        console.log(`[stock-sync-bg] Sync already in progress (lock age ${Math.round(lockAge / 1000)}s), skipping`);
        return new Response('already running', { status: 202 });
      }
      console.log(`[stock-sync-bg] Stale lock found (${Math.round(lockAge / 60000)}m old), reclaiming`);
    }

    await supabase
      .from('mi_settings')
      .upsert({ key: 'stock_sync_running', value: 'true' }, { onConflict: 'key' });

    console.log(`[stock-sync-bg] Starting ${mode} sync...`);

    const startTime = Date.now();

    try {
    const changes: StockSyncChange[] = [];
    let totalChecked = 0;
    let hidden = 0;
    let reactivated = 0;
    let stockUpdated = 0;
    let errors = 0;
    const changedCategoryIds = new Set<string>();

    // Price drift tracking
    let driftFlagged = 0;
    const driftProducts: { name: string; maxDriftPct: number }[] = [];
    const productDriftUpdates: { id: string; flagged: boolean; details: any }[] = [];

    // Fetch all CJ products that are active or out_of_stock (deterministic order for pagination)
    const allProducts = await fetchAll<any>(
      supabase,
      'mi_products',
      'id, name, cj_pid, status, category_id, warehouse_status',
      (q: any) => q.not('cj_pid', 'is', null).in('status', ['active', 'out_of_stock']).neq('warehouse', 'DIGITAL').order('id')
    );

    // Determine which products to process this run
    let products: any[];
    let batchOffset = 0;
    let isBatchedRun = false;

    if (mode === 'risk') {
      // Risk mode: no pagination, check all high-risk products
      const riskIds = await buildRiskProductIds(supabase);
      products = allProducts.filter((p: any) => riskIds.has(p.id));
      console.log(`[stock-sync-bg] Risk mode: ${products.length} of ${allProducts.length} products qualified`);
    } else {
      // ─── Paginated full sync: process BATCH_SIZE products per run ───
      const { data: offsetRow } = await supabase
        .from('mi_settings')
        .select('value')
        .eq('key', 'stock_sync_offset')
        .maybeSingle();

      batchOffset = parseInt(offsetRow?.value || '0', 10) || 0;
      if (batchOffset >= allProducts.length) batchOffset = 0; // reset if catalog shrunk

      products = allProducts.slice(batchOffset, batchOffset + BATCH_SIZE);
      isBatchedRun = true;
      console.log(`[stock-sync-bg] Full mode: batch ${batchOffset}–${batchOffset + products.length - 1} of ${allProducts.length} products`);
    }

    // Process one product at a time to respect CJ rate limit (1 QPS)
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      totalChecked++;

      try {
        const stockData = await cjClient.getProductStock(product.cj_pid);
        const variantStockMap = buildVariantStockMap(stockData);
        const usProductStock = getProductUSStock(stockData);
        const cnProductStock = getProductCNStock(stockData);
        const hasAnyStock = usProductStock > 0 || cnProductStock > 0;
        const shippingProfile = usProductStock > 0 ? 'US' : 'CN';
        const preferUS = usProductStock > 0;

        // ─── Case 1: Zero stock everywhere on active product → hide it ───
        if (!hasAnyStock && product.status === 'active') {
          const { error: updateError } = await supabase
            .from('mi_products')
            .update({ status: 'out_of_stock' })
            .eq('id', product.id);

          if (!updateError) {
            hidden++;
            if (product.category_id) changedCategoryIds.add(product.category_id);
            changes.push({ name: product.name, action: 'hidden' });
          }
        }

        // ─── Case 2: Has stock + needs reactivation or shipping profile change ───
        else if (hasAnyStock && (product.status === 'out_of_stock' || product.warehouse_status !== shippingProfile)) {
          const { error: updateError } = await supabase
            .from('mi_products')
            .update({ status: 'active', warehouse_status: shippingProfile })
            .eq('id', product.id);

          if (!updateError) {
            // Fetch ALL variants (active + inactive) so we can reactivate stocked ones
            const { data: variants } = await supabase
              .from('mi_product_variants')
              .select('id, cj_vid')
              .eq('product_id', product.id);

            for (const v of variants || []) {
              const cjStock = variantStockMap.get(v.cj_vid);
              const variantStock = preferUS ? (cjStock?.us ?? 0) : (cjStock?.cn ?? 0);
              await supabase
                .from('mi_product_variants')
                .update({ stock_count: variantStock, is_active: variantStock > 0 })
                .eq('id', v.id);
            }

            if (product.status === 'out_of_stock') {
              reactivated++;
              changes.push({ name: product.name, action: 'reactivated', newStock: usProductStock || cnProductStock });
            } else {
              stockUpdated++;
              changes.push({ name: product.name, action: 'stock_updated', newStock: usProductStock || cnProductStock });
            }
            if (product.category_id) changedCategoryIds.add(product.category_id);
          }
        }

        // ─── Case 3: Active product, same profile — update per-variant stock where changed ───
        else if (hasAnyStock && product.status === 'active') {
          const { data: variants } = await supabase
            .from('mi_product_variants')
            .select('id, cj_vid, stock_count')
            .eq('product_id', product.id)
            .eq('is_active', true);

          let variantsUpdated = 0;
          let sampleOld = 0;
          let sampleNew = 0;

          for (const v of variants || []) {
            const cjStock = variantStockMap.get(v.cj_vid);
            const variantStock = preferUS ? (cjStock?.us ?? 0) : (cjStock?.cn ?? 0);
            const currentStock = v.stock_count ?? 0;
            const diff = Math.abs(variantStock - currentStock);

            if (variantStock === 0 || diff >= STOCK_CHANGE_THRESHOLD) {
              await supabase
                .from('mi_product_variants')
                .update({ stock_count: variantStock })
                .eq('id', v.id);

              if (variantsUpdated === 0) {
                sampleOld = currentStock;
                sampleNew = variantStock;
              }
              variantsUpdated++;
            }
          }

          if (variantsUpdated > 0) {
            stockUpdated++;
            changes.push({
              name: product.name,
              action: 'stock_updated',
              oldStock: sampleOld,
              newStock: sampleNew,
            });
          }
        }

        // ─── Price drift detection ───
        try {
          const cjProductData = await cjClient.getProduct(product.cj_pid);
          const cjVariants = cjProductData?.variants || [];

          const { data: ourVariants } = await supabase
            .from('mi_product_variants')
            .select('id, cj_vid, cj_price, name')
            .eq('product_id', product.id)
            .eq('is_active', true);

          const cjPriceMap = new Map<string, number>();
          for (const v of cjVariants) {
            if (v.vid && typeof v.variantSellPrice === 'number') {
              cjPriceMap.set(v.vid, v.variantSellPrice);
            }
          }

          let hasDrift = false;
          let maxDriftPct = 0;
          const driftDetails: { variantName: string; storedPrice: number; currentPrice: number; driftPct: number }[] = [];

          for (const v of ourVariants || []) {
            const currentPrice = cjPriceMap.get(v.cj_vid);
            if (currentPrice === undefined || !v.cj_price) continue;
            const storedPrice = Number(v.cj_price);
            if (storedPrice <= 0) continue;

            const pct = ((currentPrice - storedPrice) / storedPrice) * 100;
            if (Math.abs(pct) > 10) {
              hasDrift = true;
              driftDetails.push({
                variantName: v.name || v.cj_vid,
                storedPrice,
                currentPrice,
                driftPct: Math.round(pct * 10) / 10,
              });
            }
            if (Math.abs(pct) > Math.abs(maxDriftPct)) {
              maxDriftPct = pct;
            }
          }

          const roundedMaxDrift = Math.round(maxDriftPct * 10) / 10;
          productDriftUpdates.push({
            id: product.id,
            flagged: hasDrift,
            details: hasDrift ? { maxDriftPct: roundedMaxDrift, variants: driftDetails } : null,
          });

          if (hasDrift) {
            driftFlagged++;
            driftProducts.push({ name: product.name, maxDriftPct: roundedMaxDrift });
          }
        } catch (driftErr: any) {
          console.error(`[stock-sync-bg] Drift check error for ${product.name}:`, driftErr?.message);
        }
      } catch (err: any) {
        errors++;
        changes.push({
          name: product.name,
          action: 'error',
          error: err?.message || 'Unknown error',
        });
        console.error(`[stock-sync-bg] Error for ${product.name} (${product.cj_pid}):`, err?.message);
      }

      // Delay between CJ API calls (skip after last product)
      if (i < products.length - 1) {
        await delay(CJ_DELAY_MS);
      }
    }

    // ─── Save or clear pagination offset ───
    if (isBatchedRun) {
      const nextOffset = batchOffset + BATCH_SIZE;
      if (nextOffset >= allProducts.length) {
        await supabase.from('mi_settings').delete().eq('key', 'stock_sync_offset');
        console.log(`[stock-sync-bg] Full catalog cycle complete (${allProducts.length} products)`);
      } else {
        await supabase
          .from('mi_settings')
          .upsert({ key: 'stock_sync_offset', value: String(nextOffset) }, { onConflict: 'key' });
      }
    }

    // ─── Recalculate category counts if any products changed status ───
    if (changedCategoryIds.size > 0) {
      const allActiveProducts = await fetchAll<any>(
        supabase,
        'mi_products',
        'category_id',
        (q: any) => q.eq('status', 'active').not('category_id', 'is', null)
      );

      const actualCounts = new Map<string, number>();
      for (const p of allActiveProducts) {
        actualCounts.set(p.category_id, (actualCounts.get(p.category_id) || 0) + 1);
      }

      const categoryIds = Array.from(changedCategoryIds);
      for (const categoryId of categoryIds) {
        const count = actualCounts.get(categoryId) || 0;
        await supabase
          .from('mi_categories')
          .update({ product_count: count })
          .eq('id', categoryId);
      }
    }

    // ─── Update price drift flags (auto-reprice < 25%, flag >= 25%) ───
    let autoRepriced = 0;
    if (productDriftUpdates.length > 0) {
      for (const upd of productDriftUpdates.filter((p) => p.flagged)) {
        const absDrift = Math.abs(upd.details?.maxDriftPct ?? 0);

        if (absDrift < 25) {
          // Auto-reprice: use the current CJ price from the first drifted variant
          const variant = upd.details?.variants?.[0];
          if (variant?.currentPrice != null) {
            // Fetch product's shipping_cost for the formula
            const { data: prod } = await supabase
              .from('mi_products')
              .select('shipping_cost')
              .eq('id', upd.id)
              .single();
            const shipping = parseFloat(prod?.shipping_cost) || 3.00;
            const newRetail = Math.ceil((variant.currentPrice + shipping) * 2.0) - 0.01;

            await supabase
              .from('mi_products')
              .update({
                cj_price: variant.currentPrice,
                retail_price: newRetail,
                price_drift_flagged: false,
                price_drift_details: null,
              })
              .eq('id', upd.id);
            autoRepriced++;
          }
        } else {
          // Flag for manual review, include recommended price
          const variant = upd.details?.variants?.[0];
          let recommendedPrice: number | null = null;
          if (variant?.currentPrice != null) {
            const { data: prod } = await supabase
              .from('mi_products')
              .select('shipping_cost')
              .eq('id', upd.id)
              .single();
            const shipping = parseFloat(prod?.shipping_cost) || 3.00;
            recommendedPrice = Math.ceil((variant.currentPrice + shipping) * 2.0) - 0.01;
          }

          await supabase
            .from('mi_products')
            .update({
              price_drift_flagged: true,
              price_drift_details: { ...upd.details, recommendedPrice },
            })
            .eq('id', upd.id);
        }
      }
      const clearedIds = productDriftUpdates.filter((p) => !p.flagged).map((p) => p.id);
      if (clearedIds.length > 0) {
        await supabase
          .from('mi_products')
          .update({ price_drift_flagged: false, price_drift_details: null })
          .in('id', clearedIds);
      }
    }
    if (autoRepriced > 0) {
      console.log(`[stock-sync-bg] Auto-repriced ${autoRepriced} products (drift < 25%)`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    const timestamp = new Date().toISOString();
    const totalChanges = hidden + reactivated + stockUpdated;

    // Send alert email only for significant runs:
    // - 10+ total changes, OR
    // - any products went out of stock this run
    const shouldEmail = totalChanges >= 10 || hidden > 0;
    if (shouldEmail) {
      await sendStockSyncAlert({
        totalChecked,
        hidden,
        reactivated,
        stockUpdated,
        errors,
        duration,
        timestamp,
        changes,
        driftFlagged,
        driftProducts,
        mode,
      });
    } else if (totalChanges > 0 || driftFlagged > 0) {
      console.log(`[stock-sync-bg] Skipping email: ${totalChanges} changes, ${hidden} hidden, ${driftFlagged} drift (below threshold)`);
    }

    const batchInfo = isBatchedRun
      ? `batch ${batchOffset}–${batchOffset + products.length - 1} of ${allProducts.length}`
      : `${mode} mode`;
    console.log(
      `[stock-sync-bg] ${batchInfo}: ${totalChecked} checked, ${totalChanges} changes, ${driftFlagged} drift, ${errors} errors, ${duration}s`
    );
    } finally {
      await supabase.from('mi_settings').delete().eq('key', 'stock_sync_running');
    }
  } catch (err) {
    console.error('[stock-sync-bg] Fatal error:', err);
  }
};
