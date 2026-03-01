import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { sendStockSyncAlert, type StockSyncChange } from '@/lib/email/sendgrid';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;
const STOCK_CHANGE_THRESHOLD = 5;

async function checkAuth(request: NextRequest): Promise<{ authorized: boolean }> {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const cronSecret = process.env.STOCK_SYNC_SECRET;
  if (cronSecret && key === cronSecret) {
    return { authorized: true };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { authorized: false };

    const { data: adminProfile } = await supabase
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return { authorized: !!adminProfile };
  } catch {
    return { authorized: false };
  }
}

async function fetchAll<T>(
  supabase: ReturnType<typeof createAdminClient>,
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

function getTotalStock(stockData: any): number {
  const payload = stockData?.data || stockData;
  const inventories = payload?.inventories || (Array.isArray(payload) ? payload : []);
  let total = 0;
  for (const inv of inventories) {
    total += inv.totalInventoryNum || 0;
  }
  return total;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const { authorized } = await checkAuth(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const supabase = createAdminClient();
  const changes: StockSyncChange[] = [];
  let totalChecked = 0;
  let hidden = 0;
  let reactivated = 0;
  let stockUpdated = 0;
  let errors = 0;
  const changedCategoryIds = new Set<string>();

  // Fetch all CJ products that are active or out_of_stock
  const products = await fetchAll<any>(
    supabase,
    'mi_products',
    'id, name, cj_pid, status, category_id',
    (q: any) => q.not('cj_pid', 'is', null).in('status', ['active', 'out_of_stock'])
  );

  // Process in batches
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (product) => {
        totalChecked++;
        try {
          const stockData = await cjClient.getProductStock(product.cj_pid);
          const totalStock = getTotalStock(stockData);

          // ─── Case 1: Zero stock on active product → hide it ───
          if (totalStock === 0 && product.status === 'active') {
            const { error: updateError } = await supabase
              .from('mi_products')
              .update({ status: 'out_of_stock' })
              .eq('id', product.id);

            if (!updateError) {
              hidden++;
              if (product.category_id) changedCategoryIds.add(product.category_id);
              changes.push({ name: product.name, action: 'hidden' });
            }
            return;
          }

          // ─── Case 2: Stock returned on out_of_stock product → reactivate ───
          if (totalStock > 0 && product.status === 'out_of_stock') {
            const { error: updateError } = await supabase
              .from('mi_products')
              .update({ status: 'active' })
              .eq('id', product.id);

            // Also update variant stock counts
            if (!updateError) {
              await supabase
                .from('mi_product_variants')
                .update({ stock_count: totalStock })
                .eq('product_id', product.id)
                .eq('is_active', true);

              reactivated++;
              if (product.category_id) changedCategoryIds.add(product.category_id);
              changes.push({ name: product.name, action: 'reactivated', newStock: totalStock });
            }
            return;
          }

          // ─── Case 3: Active product with stock change >= threshold → update counts ───
          if (totalStock > 0 && product.status === 'active') {
            // Get current variant stock to compare
            const { data: variants } = await supabase
              .from('mi_product_variants')
              .select('id, stock_count')
              .eq('product_id', product.id)
              .eq('is_active', true)
              .limit(1);

            const currentStock = variants?.[0]?.stock_count ?? 100;
            const diff = Math.abs(totalStock - currentStock);

            if (diff >= STOCK_CHANGE_THRESHOLD) {
              await supabase
                .from('mi_product_variants')
                .update({ stock_count: totalStock })
                .eq('product_id', product.id)
                .eq('is_active', true);

              stockUpdated++;
              changes.push({
                name: product.name,
                action: 'stock_updated',
                oldStock: currentStock,
                newStock: totalStock,
              });
            }
          }
        } catch (err: any) {
          errors++;
          changes.push({
            name: product.name,
            action: 'error',
            error: err?.message || 'Unknown error',
          });
          console.error(`[stock-sync] Error for ${product.name} (${product.cj_pid}):`, err?.message);
        }
      })
    );

    // Delay between batches (skip after last batch)
    if (i + BATCH_SIZE < products.length) {
      await delay(BATCH_DELAY_MS);
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

  const duration = Math.round((Date.now() - startTime) / 1000);
  const timestamp = new Date().toISOString();
  const totalChanges = hidden + reactivated + stockUpdated;

  // Send alert email only when changes occurred (fire-and-forget)
  if (totalChanges > 0) {
    sendStockSyncAlert({
      totalChecked,
      hidden,
      reactivated,
      stockUpdated,
      errors,
      duration,
      timestamp,
      changes,
    }).catch((err) => console.error('[stock-sync] Failed to send alert email:', err));
  }

  return NextResponse.json({
    timestamp,
    total_checked: totalChecked,
    hidden,
    reactivated,
    stock_updated: stockUpdated,
    errors,
    duration_seconds: duration,
    changes: changes.slice(0, 50),
  });
}
