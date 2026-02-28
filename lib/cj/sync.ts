import { cjClient } from './client';
import { createAdminClient } from '../supabase/admin';
import { calculatePricing } from '../pricing';

interface SyncResult {
  synced: number;
  created: number;
  updated: number;
  hidden: number;
  errors: string[];
}

interface SyncOptions {
  includeReviews?: boolean;
  includeShipping?: boolean;
}

export async function syncCJProducts(
  categoryId?: string,
  pageNum: number = 1,
  pageSize: number = 200,
  resync: boolean = false,
  warehouseFilter: 'US' | 'CN' | 'all' = 'all',
  options: SyncOptions = {}
): Promise<SyncResult> {
  const supabase = createAdminClient();
  const result: SyncResult = { synced: 0, created: 0, updated: 0, hidden: 0, errors: [] };
  let apiCallsUsed = 0;
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  const includeShipping = options.includeShipping !== false;

  try {
    if (resync) {
      console.log('[cj sync] Resync requested. Clearing existing CJ products.');
      const { data: deletedProducts, error: deleteError } = await supabase
        .from('mi_products')
        .delete()
        .not('cj_pid', 'is', null)
        .select('id');
      if (deleteError) {
        result.errors.push(`Resync delete failed: ${deleteError.message}`);
      } else {
        console.log('Deleted', deletedProducts?.length || 0, 'existing products for resync');
      }
    }

    const { data: categoryRows } = await supabase
      .from('mi_categories')
      .select('id, name, slug');
    const categories = categoryRows || [];

    const cjData = await cjClient.getProducts({
      categoryId,
      pageNum,
      pageSize,
      countryCode: warehouseFilter === 'US' ? 'US' : undefined,
    });
    apiCallsUsed += 1;
    const estimatedMinutes = Math.ceil((cjData.list.length * 1.2) / 60);
    console.log(
      `[cj sync] Fetching detail images for ${cjData.list.length} products (~${estimatedMinutes} minutes)...`
    );

    for (let index = 0; index < cjData.list.length; index += 1) {
      const cjProduct = cjData.list[index];
      try {
        if (apiCallsUsed >= 900) {
          console.log('[cj sync] Approaching API call limit, stopping sync early.');
          break;
        }

        if (!cjProduct.productNameEn) {
          console.log('SKIPPED (unavailable):', cjProduct.productNameEn, cjProduct.pid);
          continue;
        }

        const sellPriceRaw = cjProduct.sellPrice as unknown;
        if (typeof sellPriceRaw === 'string' && sellPriceRaw.includes('--')) {
          console.log('SKIPPED (price range, no base price):', cjProduct.productNameEn);
          continue;
        }

        const cjPriceParsed = parsePriceValue(cjProduct.sellPrice);
        if (cjPriceParsed === null || Number.isNaN(cjPriceParsed) || cjPriceParsed <= 0) {
          result.errors.push(`Product ${cjProduct.pid}: invalid CJ price ${cjProduct.sellPrice}`);
          continue;
        }

        console.log(
          'Product:',
          cjProduct.productNameEn,
          'Variants:',
          cjProduct.variants?.length || 0
        );
        let shippingCost = 0;
        try {
          if (cjProduct.variants?.length > 0) {
            console.log('[cj sync] Calculating freight for', cjProduct.pid);
            const freight = await cjClient.calculateFreight({
              endCountryCode: 'US',
              products: [{ vid: cjProduct.variants[0].vid, quantity: 1 }],
            });
            apiCallsUsed += 1;
            if (freight?.length > 0) {
              const freightValues = freight
                .map((f) => parsePriceValue(f.logisticPrice))
                .filter((value): value is number => value !== null);
              if (freightValues.length > 0) {
                shippingCost = Math.min(...freightValues);
              }
            }
            console.log('[cj sync] Freight options received', freight?.length || 0);
          } else {
            shippingCost = Math.max(cjPriceParsed * 0.3, 3);
          }
        } catch (error) {
          console.log('[cj sync] Freight calculation failed', cjProduct.pid, error);
          shippingCost = Math.max(cjPriceParsed * 0.3, 3);
        }

        if (!shippingCost) {
          shippingCost = Math.max(cjPriceParsed * 0.3, 3);
        }

        const cjPrice = parseFloat(String(cjPriceParsed));
        const shipCost = parseFloat(String(shippingCost));
        const pricing = calculatePricing(cjPrice, shipCost);
        console.log(
          'Saving:',
          cjProduct.productNameEn,
          'CJ:',
          cjPrice,
          'Ship:',
          shipCost,
          'Retail:',
          pricing.retailPrice,
          'Margin:',
          `${pricing.marginPercent}%`
        );
        console.log(
          'Raw warehouse data:',
          'sourceFrom:', cjProduct.sourceFrom,
          'productType:', (cjProduct as any).productType,
          'keys:', JSON.stringify(Object.keys(cjProduct))
        );

        const isUSWarehouse = detectUSWarehouse(cjProduct);
        const warehouse: 'US' | 'CN' = isUSWarehouse ? 'US' : 'CN';
        if (warehouseFilter !== 'all' && warehouse !== warehouseFilter) {
          continue;
        }
        const shippingDays = warehouse === 'US' ? '2-5 days' : '7-16 days';
        const deliveryCycle = (cjProduct as any).deliveryCycle || null;
        const shippingEstimate =
          warehouse === 'US'
            ? '2-5 business days'
            : deliveryCycle
            ? `${deliveryCycle} days + transit`
            : '10-20 business days';

        const slug = cjProduct.productNameEn
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 80);

        let images: string[] = [];
        let detailResponse: any = null;
        try {
          if (apiCallsUsed >= 900) {
            console.log('[cj sync] Approaching API call limit, skipping image detail calls.');
          } else {
            console.log(`Fetching images: ${index + 1}/${cjData.list.length} products...`);
            let detail = null;
            try {
              detail = await cjClient.getProduct(cjProduct.pid);
              apiCallsUsed += 1;
            } catch (error: any) {
              const message = String(error?.message || '');
              if (message.includes('Too Many Requests') || message.includes('429')) {
                console.log('[cj sync] Rate limited, retrying in 3s...', cjProduct.pid);
                await sleep(3000);
                try {
                  detail = await cjClient.getProduct(cjProduct.pid);
                  apiCallsUsed += 1;
                } catch (retryError) {
                  console.log('[cj sync] Image detail retry failed', cjProduct.pid, retryError);
                }
              } else {
                throw error;
              }
            }
            if (detail) {
              detailResponse = detail;
              images = extractImagesFromDetail(detail, cjProduct.productImage);
            }
            await sleep(1200);
          }
        } catch (error) {
          console.log('[cj sync] Image detail fetch failed', cjProduct.pid, error);
        }
        if (images.length === 0) {
          images = [cjProduct.productImage].filter(Boolean);
        }

        const detailPayload = detailResponse?.data ? detailResponse.data : detailResponse;
        let description = detailPayload?.description || '';
        description = description.replace(/<img[^>]*>/gi, '');
        description = description.replace(/<p>\s*<\/p>/gi, '');
        description = description.trim();

        const categoryIdMatch = matchCategoryId(
          cjProduct.categoryName,
          cjProduct.productNameEn,
          categories
        );
        console.log(
          'Category match:',
          cjProduct.productNameEn,
          '→',
          categoryIdMatch || 'none'
        );

        const productData = {
          cj_pid: cjProduct.pid,
          name: cjProduct.productNameEn,
          slug: `${slug}-${cjProduct.pid.substring(0, 8)}`,
          description,
          category_id: categoryIdMatch,
          images,
          cj_price: cjPrice,
          shipping_cost: shipCost,
          stripe_fee: pricing.stripeFee,
          total_cost: pricing.totalCost,
          markup_multiplier: 2.0,
          retail_price: pricing.retailPrice,
          margin_dollars: pricing.marginDollars,
          margin_percent: pricing.marginPercent,
          stock_count: 100,
          warehouse,
          shipping_days: shippingDays,
          delivery_cycle_days: includeShipping ? deliveryCycle : null,
          shipping_estimate: includeShipping ? shippingEstimate : null,
          status: pricing.isViable ? 'pending' : 'hidden',
          last_synced_at: new Date().toISOString(),
          cj_raw_data: cjProduct,
        };

        const { error } = await supabase.from('mi_products').upsert(productData, {
          onConflict: 'cj_pid',
          ignoreDuplicates: false,
        });

        if (error) {
          result.errors.push(`Product ${cjProduct.pid}: ${error.message}`);
        } else {
          result.synced++;
          if (!pricing.isViable) result.hidden++;
        }

        if (cjProduct.variants?.length > 0) {
          const { data: product } = await supabase
            .from('mi_products')
            .select('id')
            .eq('cj_pid', cjProduct.pid)
            .single();

          if (product) {
            for (const variant of cjProduct.variants) {
              const variantPrice = parsePriceValue(variant.variantSellPrice);
              if (variantPrice === null || Number.isNaN(variantPrice)) {
                continue;
              }
              const variantPricing = calculatePricing(variantPrice, shipCost);
              await supabase.from('mi_product_variants').upsert(
                {
                  product_id: product.id,
                  cj_vid: variant.vid,
                  name: variant.variantNameEn,
                  cj_price: variantPrice,
                  retail_price: variantPricing.retailPrice,
                  image_url: variant.variantImage,
                  stock_count: 100,
                  is_active: true,
                },
                {
                  onConflict: 'cj_vid',
                }
              );
            }
          }
        }
      } catch (productError: any) {
        result.errors.push(`Product ${cjProduct.pid}: ${productError.message}`);
      }
    }
  } catch (error: any) {
    result.errors.push(`Sync failed: ${error.message}`);
  }

  console.log('[cj sync] API calls used:', apiCallsUsed);
  return result;
}

export function parsePriceValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    if (value.includes('--')) {
      const parts = value.split('--');
      const last = parts[parts.length - 1]?.trim();
      const parsed = parseFloat(last);
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

export function detectUSWarehouse(cjProduct: any): boolean {
  // CJ sourceFrom values: 4 = US warehouse, 1 = 1688 China, 2 = CJ warehouse China
  if (cjProduct?.sourceFrom === 4) {
    return true;
  }

  const warehouseFields = [
    cjProduct?.warehouse,
    cjProduct?.warehouseName,
    cjProduct?.warehouseCode,
    cjProduct?.shipmentCountryCode,
    cjProduct?.deliveryTime,
    cjProduct?.deliveryTimeText,
    cjProduct?.sourceFrom,
  ]
    .filter(Boolean)
    .map((value: any) => String(value).toLowerCase());

  if (
    warehouseFields.some(
      (value) =>
        value.includes('us') ||
        value.includes('usa') ||
        value.includes('united states')
    )
  ) {
    return true;
  }

  const deliveryTime = cjProduct?.deliveryTime;
  if (typeof deliveryTime === 'number' && deliveryTime <= 48) {
    return true;
  }
  if (typeof deliveryTime === 'string') {
    const normalized = deliveryTime.toLowerCase();
    if (['24', '48', '24h', '48h'].includes(normalized)) {
      return true;
    }
  }

  return false;
}

export function extractImagesFromDetail(detail: any, fallback?: string | null): string[] {
  const payload = detail?.data ? detail.data : detail;
  let images: string[] = [];

  if (Array.isArray(payload?.productImageSet)) {
    images = [...payload.productImageSet];
  } else if (typeof payload?.productImage === 'string') {
    try {
      const parsed = JSON.parse(payload.productImage);
      if (Array.isArray(parsed)) {
        images = parsed;
      } else {
        images = [payload.productImage];
      }
    } catch {
      images = [payload.productImage];
    }
  }

  if (Array.isArray(payload?.variants)) {
    for (const variant of payload.variants) {
      if (variant?.variantImage && !images.includes(variant.variantImage)) {
        images.push(variant.variantImage);
      }
    }
  }

  if (fallback && !images.includes(fallback)) {
    images.push(fallback);
  }

  return images.filter((url) => typeof url === 'string' && url.startsWith('http'));
}

export function matchCategoryId(
  categoryName: string | undefined,
  productName: string | undefined,
  categories: Array<{ id: string; name: string; slug: string }>
): string | null {
  const haystack = `${categoryName || ''} ${productName || ''}`.toLowerCase();

  const directMatch = categories.find((category) =>
    haystack.includes(category.name.toLowerCase())
  );
  if (directMatch) return directMatch.id;

  const keywordMap: Array<{ keywords: string[]; slug: string }> = [
    { keywords: ['women', 'dress', 'shirt', 'fashion', 'clothing'], slug: 'womens-fashion' },
    { keywords: ['pet', 'dog', 'cat', 'animal'], slug: 'pet-supplies' },
    { keywords: ['home', 'garden', 'furniture', 'decor'], slug: 'home-garden' },
    { keywords: ['beauty', 'skin', 'hair', 'health', 'makeup'], slug: 'health-beauty' },
    { keywords: ['jewelry', 'necklace', 'ring', 'earring', 'bracelet'], slug: 'jewelry' },
    { keywords: ['electronic', 'phone', 'gadget', 'tech'], slug: 'electronics' },
    { keywords: ['kid', 'toy', 'baby', 'child'], slug: 'kids-toys' },
    { keywords: ['kitchen', 'cook', 'knife', 'utensil'], slug: 'kitchen' },
  ];

  for (const entry of keywordMap) {
    if (entry.keywords.some((keyword) => haystack.includes(keyword))) {
      const match = categories.find((category) => category.slug === entry.slug);
      if (match) return match.id;
    }
  }

  return null;
}