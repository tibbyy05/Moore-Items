// Run with: node scripts/fix-orphaned-variants.js
// Finds active products with 0 rows in mi_product_variants and creates variants from cj_raw_data

require('ts-node/register/transpile-only');

const fs = require('fs');
const { parseVariantColorSize } = require('../lib/utils/variant-parser');

const env = {};
fs.readFileSync('.env.local', 'utf8')
  .split('\n')
  .forEach((line) => {
    const [key, ...vals] = line.split('=');
    if (key && vals.length) env[key.trim()] = vals.join('=').trim();
  });

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${await res.text()}`);
  return res.json();
}

async function supabasePost(path, body, extraHeaders = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${path} failed: ${text}`);
  }
  return res;
}

async function run() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[fix-orphaned] Missing required env vars in .env.local');
    return;
  }

  // Step 1: Get all active products
  console.log('[fix-orphaned] Fetching active products...');
  const batchSize = 1000;
  let allProducts = [];
  let offset = 0;

  while (true) {
    const batch = await supabaseGet(
      `mi_products?status=eq.active&select=id,name,retail_price,cj_raw_data,digital_file_path&order=name.asc&limit=${batchSize}&offset=${offset}`
    );
    allProducts = allProducts.concat(batch);
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`[fix-orphaned] Total active products: ${allProducts.length}`);

  // Step 2: Get all product_ids that already have variant rows
  console.log('[fix-orphaned] Fetching existing variant product_ids...');
  let existingVariantProductIds = new Set();
  offset = 0;

  while (true) {
    const batch = await supabaseGet(
      `mi_product_variants?select=product_id&limit=${batchSize}&offset=${offset}`
    );
    for (const row of batch) {
      existingVariantProductIds.add(row.product_id);
    }
    if (batch.length < batchSize) break;
    offset += batchSize;
  }

  console.log(`[fix-orphaned] Products with existing variants: ${existingVariantProductIds.size}`);

  // Step 3: Filter to orphaned products (no variants)
  const orphaned = allProducts.filter((p) => !existingVariantProductIds.has(p.id));
  console.log(`[fix-orphaned] Orphaned products (no variants): ${orphaned.length}`);

  if (orphaned.length === 0) {
    console.log('[fix-orphaned] Nothing to fix!');
    return;
  }

  let created = 0;
  let defaultCreated = 0;
  let digitalCreated = 0;
  let errors = 0;

  for (let i = 0; i < orphaned.length; i++) {
    const product = orphaned[i];
    const isDigital = !!product.digital_file_path;
    const retailPrice = Number(product.retail_price || 0);

    try {
      // Digital products get a single "Digital Download" variant with stock 9999
      if (isDigital) {
        const payload = [{
          product_id: product.id,
          name: 'Digital Download',
          retail_price: retailPrice || null,
          stock_count: 9999,
          is_active: true,
        }];

        await supabasePost(
          'mi_product_variants',
          payload,
          { Prefer: 'resolution=merge-duplicates' }
        );
        digitalCreated++;
        console.log(`[fix-orphaned] [${i + 1}/${orphaned.length}] DIGITAL: ${product.name}`);
        await delay(50);
        continue;
      }

      // Extract variants from cj_raw_data
      const rawData = product.cj_raw_data;
      const cjVariants = rawData && typeof rawData === 'object' && Array.isArray(rawData.variants)
        ? rawData.variants
        : [];

      if (cjVariants.length > 0) {
        const variantPayloads = cjVariants.map((variant, index) => {
          const variantLabel = variant.variantNameEn || variant.variantName || variant.variantSku || '';
          const displayName = variantLabel || `Variant ${index + 1}`;
          const { color, size } = parseVariantColorSize(displayName, product.name);

          // Use variant-level price if available, else product retail_price
          const variantSellPrice = Number(variant.variantSellPrice || 0);
          const variantRetail = variantSellPrice > 0 ? null : retailPrice; // keep product price as fallback
          // If variant has its own sell price, we still use the product's retail_price
          // since variant retail prices should match the product unless specifically overridden
          const finalRetail = retailPrice || null;

          return {
            product_id: product.id,
            cj_vid: variant.vid || null,
            name: displayName,
            sku: variant.variantSku || null,
            color: color || null,
            size: size || null,
            retail_price: finalRetail,
            image_url: variant.variantImage || null,
            sort_order: index,
            stock_count: 100,
            is_active: true,
          };
        });

        // Filter out any variants without a cj_vid to avoid upsert conflicts
        const withVid = variantPayloads.filter((v) => v.cj_vid);
        const withoutVid = variantPayloads.filter((v) => !v.cj_vid);

        if (withVid.length > 0) {
          await supabasePost(
            'mi_product_variants?on_conflict=cj_vid',
            withVid,
            { Prefer: 'resolution=merge-duplicates' }
          );
        }

        if (withoutVid.length > 0) {
          await supabasePost('mi_product_variants', withoutVid);
        }

        created += variantPayloads.length;
        console.log(
          `[fix-orphaned] [${i + 1}/${orphaned.length}] ${variantPayloads.length} variants: ${product.name}`
        );
      } else {
        // No variants in cj_raw_data — create a single Default variant
        const payload = [{
          product_id: product.id,
          name: 'Default',
          retail_price: retailPrice || null,
          stock_count: 100,
          is_active: true,
        }];

        await supabasePost('mi_product_variants', payload);
        defaultCreated++;
        console.log(
          `[fix-orphaned] [${i + 1}/${orphaned.length}] DEFAULT: ${product.name}`
        );
      }

      // Throttle to avoid rate limits
      if ((i + 1) % 50 === 0) {
        console.log(`[fix-orphaned] Progress: ${i + 1}/${orphaned.length} — pausing 1s...`);
        await delay(1000);
      } else {
        await delay(50);
      }
    } catch (err) {
      errors++;
      console.log(`[fix-orphaned] ERROR [${i + 1}/${orphaned.length}] ${product.name}: ${err.message}`);
    }
  }

  console.log('\n[fix-orphaned] ════════════════════════════════════');
  console.log(`[fix-orphaned] Done!`);
  console.log(`[fix-orphaned]   CJ variants created: ${created}`);
  console.log(`[fix-orphaned]   Default variants:    ${defaultCreated}`);
  console.log(`[fix-orphaned]   Digital variants:    ${digitalCreated}`);
  console.log(`[fix-orphaned]   Errors:              ${errors}`);
  console.log('[fix-orphaned] ════════════════════════════════════');
}

run().catch((err) => {
  console.error('[fix-orphaned] Fatal error:', err.message || err);
});
