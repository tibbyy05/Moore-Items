// Run with: node scripts/import-us-products.js
// Imports US warehouse products from CJ into Supabase directly

const fs = require('fs');

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

const env = {};
fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

const CJ_API_KEY = env.CJ_API_KEY;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parsePriceMin(priceStr) {
  if (!priceStr) return 0;
  const prices = String(priceStr)
    .replace(/--/g, '-')
    .split('-')
    .map((p) => parseFloat(p.trim()))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.min(...prices) : 0;
}

function parsePriceMax(priceStr) {
  if (!priceStr) return 0;
  const prices = String(priceStr)
    .replace(/--/g, '-')
    .split('-')
    .map((p) => parseFloat(p.trim()))
    .filter((p) => !Number.isNaN(p));
  return prices.length ? Math.max(...prices) : 0;
}

function buildSlug(name) {
  const base = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+$/g, '')
    .replace(/^-+/g, '')
    .substring(0, 80);
  const suffix = Math.random().toString(36).substring(2, 6);
  return base ? `${base}-${suffix}` : suffix;
}

function calculateRetailPrice(cjPrice, shippingCost) {
  const base = cjPrice + shippingCost;
  const retail = (2 * (base + 0.3)) / 0.942;
  return Math.ceil(retail) - 0.01;
}

function calculateStripeFee(retailPrice) {
  return retailPrice * 0.029 + 0.3;
}

async function run() {
  if (!CJ_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[import] Missing required env vars in .env.local');
    return;
  }

  const startPage = Number(process.argv[2] || 1);
  const endPage = Number(process.argv[3] || startPage);
  const totalPages = endPage - startPage + 1;
  if (!Number.isFinite(startPage) || !Number.isFinite(endPage) || endPage < startPage) {
    console.log('[import] Invalid page range. Usage: node scripts/import-us-products.js 2 10');
    return;
  }

  // Step 1: Get auth token
  console.log('[import] Getting CJ auth token...');
  const authRes = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const authData = await authRes.json();
  const token = authData?.data?.accessToken;
  if (!token) {
    console.log('[import] Auth failed:', JSON.stringify(authData));
    return;
  }
  console.log('[import] CJ token acquired');

  let saved = 0;
  let skipped = 0;
  let errors = 0;
  let totalProducts = 0;

  for (let page = startPage; page <= endPage; page += 1) {
    console.log(`[import] --- Page ${page} of ${endPage} ---`);
    await delay(3000);
    const listRes = await fetch(
      `${BASE_URL}/product/listV2?page=${page}&size=100&countryCode=US&orderBy=1&sort=desc`,
      { headers: { 'CJ-Access-Token': token } }
    );
    const listData = await listRes.json();

    const contentBlocks = Array.isArray(listData?.data?.content) ? listData.data.content : [];
    const products = contentBlocks.flatMap((block) =>
      Array.isArray(block?.productList) ? block.productList : []
    );

    totalProducts += products.length;
    console.log(`[import] CJ returned ${products.length} products on page ${page}`);

    for (const product of products) {
      const cjId = String(product?.id || '').trim();
      const name = product?.nameEn || 'CJ Product';
      if (!cjId) {
        skipped += 1;
        console.log('[import] SKIP (missing id):', name);
        continue;
      }

      try {
        await delay(500);
        const existsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/mi_products?cj_pid=eq.${cjId}&select=id`,
          {
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );
        const existsData = await existsRes.json();
        if (Array.isArray(existsData) && existsData.length > 0) {
          skipped += 1;
          console.log('[import] SKIP (exists/margin):', name);
          continue;
        }

        const cjPrice = parsePriceMin(product?.nowPrice || product?.sellPrice);
        const compareAt = parsePriceMax(product?.sellPrice);
        const shippingCost = 3.0;
        const retailPrice = calculateRetailPrice(cjPrice, shippingCost);
        const stripeFee = calculateStripeFee(retailPrice);
        const totalCost = cjPrice + shippingCost + stripeFee;
        const marginDollars = retailPrice - totalCost;
        const marginPercent = retailPrice > 0 ? (marginDollars / retailPrice) * 100 : 0;

        if (marginPercent < 40) {
          skipped += 1;
          console.log('[import] SKIP (exists/margin):', name);
          continue;
        }

        const payload = {
          cj_pid: cjId,
          name,
          slug: buildSlug(name),
          cj_price: cjPrice,
          retail_price: Math.round(retailPrice * 100) / 100,
          compare_at_price: Math.round(compareAt * 100) / 100 || null,
          shipping_cost: shippingCost,
          stripe_fee: Math.round(stripeFee * 100) / 100,
          total_cost: Math.round(totalCost * 100) / 100,
          margin_dollars: Math.round(marginDollars * 100) / 100,
          margin_percent: Math.round(marginPercent * 10) / 10,
          markup_multiplier: 2.0,
          images: product?.bigImage ? [product.bigImage] : [],
          description: '',
          status: 'pending',
          warehouse: 'US',
          shipping_days: '3-7 days',
          shipping_estimate: '3-7 business days',
          available_warehouses: ['US'],
          stock_count: Number(product?.warehouseInventoryNum || 100),
          review_count: 0,
          average_rating: 0,
          last_synced_at: new Date().toISOString(),
          cj_raw_data: JSON.stringify(product),
        };

        await delay(500);
        const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/mi_products`, {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates',
          },
          body: JSON.stringify(payload),
        });

        if (!insertRes.ok) {
          const errorText = await insertRes.text();
          throw new Error(errorText || 'Insert failed');
        }

        saved += 1;
        console.log(
          `[import] SAVED: ${name} | CJ: $${cjPrice.toFixed(2)} → Retail: $${payload.retail_price.toFixed(2)}`
        );
      } catch (error) {
        errors += 1;
        console.log('[import] ERROR:', name, error?.message || error);
      }
    }

    if (page < endPage) {
      await delay(5000);
    }
  }

  console.log(
    `[import] Done! Saved: ${saved}, Skipped: ${skipped}, Errors: ${errors} out of ${totalProducts} total`
  );
}

run().catch((error) => {
  console.error('[import] Fatal error:', error?.message || error);
});
