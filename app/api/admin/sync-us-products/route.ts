import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cjClient } from '@/lib/cj/client';
import {
  matchCategoryId,
  parsePriceValue,
} from '@/lib/cj/sync';
import { calculatePricing } from '@/lib/pricing';

const DEFAULT_MAX_PAGES = 10;
const PAGE_SIZE = 100;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { error: null };
}

function getListPrice(listItem: any): number | null {
  return parsePriceValue(
    listItem?.sellPrice ??
      listItem?.sellPriceUsd ??
      listItem?.sellPriceCny ??
      listItem?.price
  );
}

function normalizeCategoryName(name: unknown): string {
  return String(name || '')
    .toLowerCase()
    .trim();
}

function parseLowerRangePrice(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    if (value.includes('-')) {
      const first = value.split('-')[0]?.trim();
      const parsed = parseFloat(first);
      return Number.isFinite(parsed) ? parsed : null;
    }
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

async function syncPage(params: {
  page: number;
  maxPages: number;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
}) {
  const adminClient = createAdminClient();
  const categoriesList = (params.categories || []).map((name) => normalizeCategoryName(name));
  const { data: storeCategories } = await adminClient
    .from('mi_categories')
    .select('id, name, slug');

  await delay(2000);
  const response = await cjClient.getProductsV2({
    page: params.page,
    size: PAGE_SIZE,
    countryCode: 'US',
    orderBy: 1,
    sort: 'desc',
  });

  const responseData = (response as any)?.data || response;
  console.log('[us-sync] Raw response keys:', JSON.stringify(Object.keys(responseData || {})));
  console.log(
    '[us-sync] Raw response sample:',
    JSON.stringify(response).substring(0, 500)
  );

  const contentBlocks = Array.isArray(responseData?.content) ? responseData.content : [];
  const list = contentBlocks.flatMap((block: any) =>
    Array.isArray(block?.productList) ? block.productList : []
  );
  console.log(
    `[us-sync] Page ${params.page}: ${list.length} products returned from CJ list`
  );
  if (params.page === 1 && list.length > 0) {
    console.log('[us-sync] Sample product from list:', JSON.stringify(list[0], null, 2));
  }
  const pids = list
    .map((item: any) => item?.id || item?.pid || item?.productId)
    .filter(Boolean)
    .map(String);

  let existingSet = new Set<string>();
  if (pids.length > 0) {
    const { data: existing } = await adminClient
      .from('mi_products')
      .select('cj_pid')
      .in('cj_pid', pids);
    existingSet = new Set((existing || []).map((item) => String(item.cj_pid)));
  }

  let newProducts = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of list) {
    const pid = String(item?.id || item?.pid || item?.productId || '');
    const listName = item?.nameEn || item?.productNameEn || item?.name || 'CJ Product';
    if (!pid) {
      skipped += 1;
      continue;
    }

    if (existingSet.has(pid)) {
      console.log(`[us-sync] SKIP (already exists): ${listName}`);
      skipped += 1;
      continue;
    }

    const nowPrice = parseLowerRangePrice(item?.nowPrice);
    const listPrice = nowPrice ?? getListPrice(item);
    if (listPrice === null || Number.isNaN(listPrice)) {
      skipped += 1;
      continue;
    }

    if (params.minPrice !== undefined && listPrice < params.minPrice) {
      skipped += 1;
      continue;
    }

    if (params.maxPrice !== undefined && listPrice > params.maxPrice) {
      skipped += 1;
      continue;
    }

    if (categoriesList.length > 0) {
      const categoryName = normalizeCategoryName(item?.categoryName || item?.categoryNameEn);
      const matchesCategory = categoriesList.some((target) => categoryName.includes(target));
      if (!matchesCategory) {
        skipped += 1;
        continue;
      }
    }

    try {
      const name = listName;
      const cjPrice = listPrice;
      const shipCost = Math.max(cjPrice * 0.3, 3.0);
      const pricing = calculatePricing(cjPrice, shipCost);
      if (!pricing.isViable) {
        console.log(
          `[us-sync] SKIP (margin too low): ${name}, CJ price: ${cjPrice}, margin: ${pricing.marginPercent}%`
        );
        skipped += 1;
        continue;
      }

      const slugBase = String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);

      const images = item?.bigImage ? [item.bigImage] : [];
      const categoryId = matchCategoryId(undefined, name, storeCategories || []);

      const productData = {
        cj_pid: pid,
        name,
        slug: `${slugBase}-${pid.substring(0, 8)}`,
        description: '',
        category_id: categoryId,
        images,
        cj_price: cjPrice,
        shipping_cost: shipCost,
        stripe_fee: pricing.stripeFee,
        total_cost: pricing.totalCost,
        markup_multiplier: 2.0,
        retail_price: pricing.retailPrice,
        margin_dollars: pricing.marginDollars,
        margin_percent: pricing.marginPercent,
        stock_count: Number(item?.warehouseInventoryNum || 100),
        warehouse: 'US',
        shipping_days: '2-5 days',
        delivery_cycle_days: null,
        shipping_estimate: '2-5 business days',
        available_warehouses: ['US'],
        status: 'pending',
        last_synced_at: new Date().toISOString(),
        cj_raw_data: { ...item, needs_enrichment: true },
      };

      const { error: productError } = await adminClient
        .from('mi_products')
        .upsert(productData, { onConflict: 'cj_pid' });

      if (productError) {
        throw productError;
      }

      newProducts += 1;
      console.log(`[us-sync] SAVED: ${name}`);
    } catch (error: any) {
      console.log(`[us-sync] ERROR processing ${listName}:`, error?.message || error);
      errors.push(`Product ${pid}: ${error?.message || 'Sync failed'}`);
    }
  }

  console.log(
    `[us-sync] Page ${params.page} complete: ${newProducts} saved, ${skipped} skipped, ${errors.length} errors`
  );
  return {
    page: params.page,
    maxPages: params.maxPages,
    newProducts,
    saved: newProducts,
    skipped,
    errors,
    totalFromCJ: list.length,
  };
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json().catch(() => ({}));
    const maxPages = Math.min(
      DEFAULT_MAX_PAGES,
      Math.max(1, Number(body?.maxPages || DEFAULT_MAX_PAGES))
    );
    const page = body?.page ? Number(body.page) : null;
    const categories = Array.isArray(body?.categories) ? body.categories : undefined;
    const minPrice = body?.minPrice !== undefined ? Number(body.minPrice) : undefined;
    const maxPrice = body?.maxPrice !== undefined ? Number(body.maxPrice) : undefined;

    if (!page || Number.isNaN(page)) {
      return NextResponse.json(
        { error: 'Page parameter is required' },
        { status: 400 }
      );
    }

    const result = await syncPage({
      page,
      maxPages,
      categories,
      minPrice,
      maxPrice,
    });

    return NextResponse.json(result);
  } catch (syncError: any) {
    return NextResponse.json(
      { error: syncError?.message || 'Sync failed' },
      { status: 500 }
    );
  }
}
