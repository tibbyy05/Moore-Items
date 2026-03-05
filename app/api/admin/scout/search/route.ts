import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import { calculatePricing, computeCompareAtPrice } from '@/lib/pricing';
import { parsePriceValue, extractImagesFromDetail, detectUSWarehouse } from '@/lib/cj/sync';
import { parseVariantColorSize } from '@/lib/utils/variant-parser';
import { PRICING_CONFIG } from '@/lib/config/pricing';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { supabase, error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { supabase, error: null };
}

interface EnrichedProduct {
  cj_pid: string;
  name: string;
  description: string;
  images: string[];
  wholesale_price: number;
  retail_price: number;
  compare_at_price: number | null;
  profit_per_sale: number;
  margin_percent: number;
  total_cost: number;
  shipping_estimate: number;
  stripe_fee: number;
  weight_grams: number;
  weight_oz: number;
  variants: Array<{
    vid: string;
    name: string;
    color: string | null;
    size: string | null;
    price: number;
    us_stock: number;
    cn_stock: number;
    image: string | null;
  }>;
  total_us_stock: number;
  total_variants: number;
  us_warehouse: boolean;
  catalog_status: 'in_catalog' | 'not_in_catalog' | 'hidden';
  existing_product_id: string | null;
  existing_product_slug: string | null;
  cj_url: string;
  watchlist_status: string | null;
}

async function enrichProduct(
  pid: string,
  supabase: any
): Promise<EnrichedProduct | null> {
  try {
    const detail = await cjClient.getProduct(pid);
    const payload = (detail as any)?.data ? (detail as any).data : detail;

    if (!payload) return null;

    const productName = payload.productNameEn || payload.productName || '';
    if (!productName) return null;

    const cjPrice = parsePriceValue(payload.sellPrice ?? payload.productSellPrice);
    if (cjPrice === null || cjPrice <= 0) return null;

    // Extract images
    const images = extractImagesFromDetail(detail, payload.productImage);

    // Get stock data
    let stockData: any[] = [];
    try {
      const stockResponse = await cjClient.getProductStock(pid);
      const raw = (stockResponse as any)?.data || stockResponse;
      stockData = Array.isArray(raw) ? raw : raw?.inventories || [];
    } catch {
      // Stock check failed — continue without stock data
    }

    // Parse variants with stock
    const variants: EnrichedProduct['variants'] = [];
    let totalUsStock = 0;
    let totalCnStock = 0;

    if (payload.variants?.length > 0) {
      for (const v of payload.variants) {
        const parsed = parseVariantColorSize(v, productName);
        const variantPrice = parsePriceValue(v.variantSellPrice) || cjPrice;

        // Find stock for this variant
        let usStock = 0;
        let cnStock = 0;
        for (const inv of stockData) {
          if (inv.vid === v.vid || !payload.variants || payload.variants.length === 1) {
            if (inv.countryCode === 'US') {
              usStock += inv.quantity || inv.totalInventoryNum || 0;
            } else {
              cnStock += inv.quantity || inv.totalInventoryNum || 0;
            }
          }
        }

        // If stockData is per-product (not per-variant), distribute evenly
        if (stockData.length > 0 && !stockData[0]?.vid) {
          const usInv = stockData.find((s: any) => s.countryCode === 'US');
          const cnInv = stockData.find((s: any) => s.countryCode !== 'US');
          usStock = usInv ? Math.floor((usInv.quantity || usInv.totalInventoryNum || 0) / payload.variants.length) : 0;
          cnStock = cnInv ? Math.floor((cnInv.quantity || cnInv.totalInventoryNum || 0) / payload.variants.length) : 0;
        }

        totalUsStock += usStock;
        totalCnStock += cnStock;

        variants.push({
          vid: v.vid,
          name: parsed.name || v.variantNameEn || v.variantSku || 'Default',
          color: parsed.color,
          size: parsed.size,
          price: variantPrice,
          us_stock: usStock,
          cn_stock: cnStock,
          image: parsed.image_url || v.variantImage || null,
        });
      }
    } else {
      // No variants — check product-level stock
      const usInv = stockData.find((s: any) => s.countryCode === 'US');
      const cnInv = stockData.find((s: any) => s.countryCode !== 'US');
      totalUsStock = usInv?.quantity || usInv?.totalInventoryNum || 0;
      totalCnStock = cnInv?.quantity || cnInv?.totalInventoryNum || 0;
    }

    // Use stock data if available, otherwise fall back to sourceFrom detection
    const hasUSStock = totalUsStock > 0 || (stockData.length === 0 && detectUSWarehouse(payload));

    // Calculate pricing
    const shippingCost = PRICING_CONFIG.shippingCostEstimate;
    const pricing = calculatePricing(cjPrice, shippingCost);
    const compareAtPrice = computeCompareAtPrice(pricing.retailPrice);

    // Weight conversion
    const weightGrams = payload.productWeight || 0;
    const weightOz = Math.round((weightGrams / 28.3495) * 10) / 10;

    // Cross-reference catalog
    const { data: existingProduct } = await supabase
      .from('mi_products')
      .select('id, slug, status')
      .eq('cj_pid', pid)
      .maybeSingle();

    let catalogStatus: 'in_catalog' | 'not_in_catalog' | 'hidden' = 'not_in_catalog';
    if (existingProduct) {
      catalogStatus = existingProduct.status === 'hidden' ? 'hidden' : 'in_catalog';
    }

    // Check watchlist
    const { data: watchlistEntry } = await supabase
      .from('mi_scout_watchlist')
      .select('status')
      .eq('cj_pid', pid)
      .maybeSingle();

    // Clean description
    let description = payload.description || '';
    description = description.replace(/<img[^>]*>/gi, '');
    description = description.replace(/<p>\s*<\/p>/gi, '');
    description = description.trim();

    return {
      cj_pid: pid,
      name: productName,
      description,
      images,
      wholesale_price: cjPrice,
      retail_price: pricing.retailPrice,
      compare_at_price: compareAtPrice,
      profit_per_sale: pricing.marginDollars,
      margin_percent: pricing.marginPercent,
      total_cost: pricing.totalCost,
      shipping_estimate: shippingCost,
      stripe_fee: pricing.stripeFee,
      weight_grams: weightGrams,
      weight_oz: weightOz,
      variants,
      total_us_stock: totalUsStock,
      total_variants: variants.length || 1,
      us_warehouse: hasUSStock,
      catalog_status: catalogStatus,
      existing_product_id: existingProduct?.id || null,
      existing_product_slug: existingProduct?.slug || null,
      cj_url: `https://cjdropshipping.com/product/detail/${pid}.html`,
      watchlist_status: watchlistEntry?.status || null,
    };
  } catch (err: any) {
    console.error(`[scout] Failed to enrich product ${pid}:`, err?.message);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;
    const body = await request.json();
    const { query, pid, page = 1, pageSize = 20, countryCode } = body;

    if (!query && !pid) {
      return NextResponse.json(
        { error: 'Provide either a search query or CJ product ID' },
        { status: 400 }
      );
    }

    // Direct PID lookup
    if (pid) {
      const enriched = await enrichProduct(pid.trim(), supabase);
      if (!enriched) {
        return NextResponse.json(
          { error: 'Product not found on CJ or has invalid data' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        results: [enriched],
        total: 1,
        page: 1,
        pageSize: 1,
      });
    }

    // Auto-detect PID in query (alphanumeric, ~19 chars)
    const trimmedQuery = query.trim();
    if (/^[A-Za-z0-9]{15,25}$/.test(trimmedQuery)) {
      const enriched = await enrichProduct(trimmedQuery, supabase);
      if (enriched) {
        return NextResponse.json({
          results: [enriched],
          total: 1,
          page: 1,
          pageSize: 1,
        });
      }
      // Fall through to keyword search if PID lookup fails
    }

    // Keyword search via product list API
    const listResult = await cjClient.getProducts({
      productNameEn: trimmedQuery,
      pageNum: page,
      pageSize,
      ...(countryCode ? { countryCode } : {}),
    });

    const products = listResult?.list || [];
    const total = listResult?.total || 0;

    if (products.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        page,
        pageSize,
      });
    }

    // Batch cross-reference all PIDs against catalog and watchlist (fast Supabase queries)
    const pids = products.map((p: any) => p.pid);
    const [{ data: catalogMatches }, { data: watchlistMatches }] = await Promise.all([
      supabase.from('mi_products').select('id, slug, status, cj_pid').in('cj_pid', pids),
      supabase.from('mi_scout_watchlist').select('cj_pid, status').in('cj_pid', pids),
    ]);
    const catalogMap = new Map(
      (catalogMatches || []).map((m: any) => [m.cj_pid, m])
    );
    const watchlistMap = new Map(
      (watchlistMatches || []).map((m: any) => [m.cj_pid, m.status])
    );

    // Build lightweight results from list data — no per-product CJ API calls
    // Full enrichment happens on direct PID lookup (preview/import)
    const results: EnrichedProduct[] = products.map((p: any) => {
      const cjPrice = parsePriceValue(p.sellPrice ?? p.productSellPrice) || 0;
      const shippingCost = PRICING_CONFIG.shippingCostEstimate;
      const pricing = calculatePricing(cjPrice, shippingCost);
      const isUS = detectUSWarehouse(p);

      const existing = catalogMap.get(p.pid);
      let catalogStatus: 'in_catalog' | 'not_in_catalog' | 'hidden' = 'not_in_catalog';
      if (existing) {
        catalogStatus = existing.status === 'hidden' ? 'hidden' : 'in_catalog';
      }

      return {
        cj_pid: p.pid,
        name: p.productNameEn || p.productName || '',
        description: '',
        images: p.productImage ? [p.productImage] : [],
        wholesale_price: cjPrice,
        retail_price: pricing.retailPrice,
        compare_at_price: null,
        profit_per_sale: pricing.marginDollars,
        margin_percent: pricing.marginPercent,
        total_cost: pricing.totalCost,
        shipping_estimate: shippingCost,
        stripe_fee: pricing.stripeFee,
        weight_grams: p.productWeight || 0,
        weight_oz: Math.round(((p.productWeight || 0) / 28.3495) * 10) / 10,
        variants: [],
        total_us_stock: 0,
        total_variants: 0,
        us_warehouse: isUS,
        catalog_status: catalogStatus,
        existing_product_id: existing?.id || null,
        existing_product_slug: existing?.slug || null,
        cj_url: `https://cjdropshipping.com/product/detail/${p.pid}.html`,
        watchlist_status: watchlistMap.get(p.pid) || null,
        _needs_enrichment: true,
      } as any;
    });

    return NextResponse.json({
      results,
      total,
      page,
      pageSize,
    });
  } catch (err: any) {
    console.error('[scout] Search error:', err);
    return NextResponse.json(
      { error: err?.message || 'Search failed' },
      { status: 500 }
    );
  }
}
