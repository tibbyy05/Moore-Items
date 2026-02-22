// Run with: node scripts/enrich-us-products.js
// Enriches US warehouse products with full CJ details

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

const categoryKeywords = {
  'womens-fashion': [
    'women',
    'dress',
    'skirt',
    'blouse',
    'lingerie',
    'bra',
    'legging',
    'cardigan',
    'sweater',
    'hoodie',
    'jacket',
    'coat',
    'pants',
    'jeans',
    'clothing',
    'apparel',
    'fashion',
    'tops',
    'bottoms',
    'romper',
    'jumpsuit',
    'bikini',
    'swimwear',
    'underwear',
    'sock',
    'scarf',
    'hat',
    'glove',
    'pajama',
    'nightgown',
    'robe',
  ],
  'pet-supplies': [
    'pet',
    'dog',
    'cat',
    'puppy',
    'kitten',
    'animal',
    'collar',
    'leash',
    'aquarium',
    'fish',
    'bird',
    'hamster',
    'rabbit',
    'paw',
    'treat',
    'grooming',
    'kennel',
    'cage',
  ],
  'home-garden': [
    'home',
    'garden',
    'decor',
    'furniture',
    'curtain',
    'pillow',
    'blanket',
    'rug',
    'mat',
    'shelf',
    'storage',
    'organizer',
    'lamp',
    'light',
    'candle',
    'vase',
    'clock',
    'mirror',
    'frame',
    'plant',
    'flower',
    'outdoor',
    'patio',
    'bed',
    'bathroom',
    'shower',
    'towel',
  ],
  'health-beauty': [
    'health',
    'beauty',
    'skin',
    'hair',
    'makeup',
    'cosmetic',
    'cream',
    'lotion',
    'serum',
    'mask',
    'nail',
    'tooth',
    'toothbrush',
    'shaver',
    'razor',
    'massage',
    'essential oil',
    'vitamin',
    'supplement',
    'fitness',
    'yoga',
    'exercise',
    'weight',
    'body',
    'face',
    'lip',
    'eye',
  ],
  jewelry: [
    'jewelry',
    'jewellery',
    'necklace',
    'bracelet',
    'ring',
    'earring',
    'pendant',
    'chain',
    'crystal',
    'gem',
    'diamond',
    'gold',
    'silver',
    'bead',
    'charm',
    'brooch',
    'anklet',
    'cufflink',
  ],
  electronics: [
    'electronic',
    'phone',
    'charger',
    'cable',
    'bluetooth',
    'speaker',
    'headphone',
    'earphone',
    'camera',
    'usb',
    'led',
    'smart',
    'wireless',
    'battery',
    'adapter',
    'hdmi',
    'computer',
    'laptop',
    'tablet',
    'keyboard',
    'mouse',
    'gaming',
    'drone',
    'robot',
    'antenna',
    'solar',
  ],
  'kids-toys': [
    'kid',
    'child',
    'children',
    'baby',
    'toy',
    'game',
    'puzzle',
    'doll',
    'lego',
    'building block',
    'stuffed',
    'plush',
    'stroller',
    'infant',
    'toddler',
    'nursery',
    'diaper',
    'pacifier',
    'rattle',
  ],
  kitchen: [
    'kitchen',
    'cook',
    'baking',
    'knife',
    'pan',
    'pot',
    'spoon',
    'fork',
    'cup',
    'mug',
    'tumbler',
    'bottle',
    'container',
    'cutting board',
    'blender',
    'mixer',
    'kettle',
    'tea',
    'coffee',
    'plate',
    'bowl',
    'dish',
    'utensil',
    'spatula',
    'whisk',
    'grater',
    'peeler',
    'opener',
    'strainer',
    'colander',
  ],
};

function getCategoryId(categoryName, productName, categories) {
  const haystack = `${categoryName || ''} ${productName || ''}`.toLowerCase();
  let bestSlug = null;
  let bestScore = 0;

  Object.entries(categoryKeywords).forEach(([slug, keywords]) => {
    const score = keywords.reduce(
      (count, keyword) => (haystack.includes(keyword) ? count + 1 : count),
      0
    );
    if (score > bestScore) {
      bestScore = score;
      bestSlug = slug;
    }
  });

  if (!bestSlug || bestScore === 0) return null;
  const match = categories.find((category) => category.slug === bestSlug);
  return match ? match.id : null;
}

function extractImages(detail, fallback) {
  let images = [];

  if (Array.isArray(detail?.productImageSet)) {
    images = [...detail.productImageSet];
  } else if (typeof detail?.productImage === 'string') {
    try {
      const parsed = JSON.parse(detail.productImage);
      if (Array.isArray(parsed)) {
        images = parsed;
      } else {
        images = [detail.productImage];
      }
    } catch {
      images = [detail.productImage];
    }
  }

  if (Array.isArray(detail?.variants)) {
    for (const variant of detail.variants) {
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

function cleanDescription(raw) {
  return String(raw || '').replace(/<img[^>]*>/gi, '').trim();
}

function calculateRetailPrice(cjPrice, shippingCost) {
  const base = cjPrice + shippingCost;
  const retail = (2 * (base + 0.3)) / 0.942;
  return Math.ceil(retail) - 0.01;
}

function normalizeToken(value) {
  return String(value || '').trim();
}

function isSizeToken(token) {
  const normalized = token.toLowerCase();
  if (['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'one size', 'os'].includes(normalized)) {
    return true;
  }
  return /^(\d+(\.\d+)?(cm|mm|in)?)$/.test(normalized);
}

function isColorToken(token) {
  const normalized = token.toLowerCase();
  const colors = [
    'black',
    'white',
    'red',
    'blue',
    'green',
    'yellow',
    'pink',
    'purple',
    'orange',
    'gray',
    'grey',
    'brown',
    'beige',
    'gold',
    'silver',
    'navy',
    'teal',
    'khaki',
    'ivory',
    'maroon',
    'burgundy',
    'cream',
    'tan',
    'rose',
    'wine',
  ];
  return colors.includes(normalized);
}

function parseVariantKey(value) {
  if (!value) return { color: null, size: null };
  let tokens = [];
  if (typeof value === 'object') {
    tokens = Array.isArray(value) ? value : [value];
  } else {
    const raw = String(value).trim();
    if (raw.startsWith('[') && raw.endsWith(']')) {
      try {
        const parsed = JSON.parse(raw);
        tokens = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        tokens = [raw];
      }
    } else if (raw.includes('-')) {
      tokens = raw.split('-');
    } else {
      tokens = [raw];
    }
  }

  let color = null;
  let size = null;
  tokens
    .map((token) => normalizeToken(token))
    .filter(Boolean)
    .forEach((token) => {
      if (!color && isColorToken(token)) {
        color = token;
        return;
      }
      if (!size && isSizeToken(token)) {
        size = token;
      }
    });

  return { color, size };
}

async function fetchCJDetail(token, cjPid) {
  const url = `${BASE_URL}/product/query?pid=${cjPid}`;
  await delay(3000);
  const res = await fetch(url, { headers: { 'CJ-Access-Token': token } });
  const data = await res.json();
  if (data?.code === 1600200) {
    console.log('[enrich] Rate limit hit, waiting 10s and retrying...');
    await delay(10000);
    const retryRes = await fetch(url, { headers: { 'CJ-Access-Token': token } });
    return retryRes.json();
  }
  return data;
}

async function run() {
  if (!CJ_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    console.log('[enrich] Missing required env vars in .env.local');
    return;
  }

  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const batchSize = 50;
  const offset = Number(arg1 || 0);
  const limit = Number(arg2 || 50);
  if (arg1 !== 'all') {
    if (!Number.isFinite(offset) || !Number.isFinite(limit) || offset < 0 || limit <= 0) {
      console.log('[enrich] Invalid args. Usage: node scripts/enrich-us-products.js 0 50');
      return;
    }
  }

  // Step 1: Get auth token
  console.log('[enrich] Getting CJ auth token...');
  const authRes = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const authData = await authRes.json();
  const token = authData?.data?.accessToken;
  if (!token) {
    console.log('[enrich] Auth failed:', JSON.stringify(authData));
    return;
  }
  console.log('[enrich] CJ token acquired');

  const categoryRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_categories?select=id,name,slug`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const categoryData = await categoryRes.json();
  const storeCategories = Array.isArray(categoryData) ? categoryData : [];

  const listRes = await fetch(
    `${SUPABASE_URL}/rest/v1/mi_products?warehouse=eq.US&select=id,cj_pid,name,images`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );
  const listData = await listRes.json();
  const usProducts = Array.isArray(listData) ? listData : [];
  const targets = usProducts.filter((product) => {
    const images = Array.isArray(product?.images) ? product.images : [];
    return images.length <= 1 && product?.cj_pid;
  });

  const processSlice = async (slice) => {
    let enriched = 0;
    let skipped = 0;
    let errors = 0;

    for (const product of slice) {
      const cjPid = String(product.cj_pid || '').trim();
      const name = product.name || 'CJ Product';
      if (!cjPid) {
        skipped += 1;
        continue;
      }

      try {
        const detailResponse = await fetchCJDetail(token, cjPid);
        if (detailResponse?.code !== 200 && detailResponse?.code !== 0) {
          throw new Error(detailResponse?.message || 'CJ detail failed');
        }

        const detailPayload = detailResponse?.data || detailResponse;
        const images = extractImages(detailPayload, null);
        const description = cleanDescription(detailPayload?.description);
        const categoryId = getCategoryId(
          detailPayload?.categoryName,
          detailPayload?.productNameEn || name,
          storeCategories
        );
        const variants = Array.isArray(detailPayload?.variants) ? detailPayload.variants : [];

        await delay(500);
        const updateRes = await fetch(
          `${SUPABASE_URL}/rest/v1/mi_products?id=eq.${product.id}`,
          {
            method: 'PATCH',
            headers: {
              apikey: SUPABASE_ANON_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ images, description, category_id: categoryId }),
          }
        );

        if (!updateRes.ok) {
          const errorText = await updateRes.text();
          throw new Error(errorText || 'Product update failed');
        }

        let variantsSkipped = false;
        if (variants.length > 0) {
          const variantPayloads = variants.map((variant, index) => {
            const cjPrice = Number.parseFloat(String(variant.variantSellPrice || 0)) || 0;
            const retailPrice = calculateRetailPrice(cjPrice, 3.0);
            const { color, size } = parseVariantKey(variant.variantKey);
            return {
              product_id: product.id,
              cj_vid: variant.vid,
              name: variant.variantNameEn || variant.variantSku || `Variant ${index + 1}`,
              sku: variant.variantSku || null,
              color: color || null,
              size: size || null,
              cj_price: cjPrice || null,
              retail_price: Number.isFinite(retailPrice) ? retailPrice : null,
              image_url: variant.variantImage || null,
              sort_order: index,
              is_active: true,
            };
          });

          await delay(500);
          const variantRes = await fetch(
            `${SUPABASE_URL}/rest/v1/mi_product_variants?on_conflict=cj_vid`,
            {
              method: 'POST',
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                Prefer: 'resolution=merge-duplicates',
              },
              body: JSON.stringify(variantPayloads),
            }
          );

          if (!variantRes.ok) {
            const errorText = await variantRes.text();
            if (String(errorText).includes('cj_vid')) {
              variantsSkipped = true;
            } else {
              throw new Error(errorText || 'Variant upsert failed');
            }
          }
        }

        enriched += 1;
        console.log(
          `[enrich] Updated: ${name} | ${images.length} images, ${variants.length} variants${
            variantsSkipped ? ' (variants skipped)' : ''
          }`
        );
      } catch (error) {
        errors += 1;
        console.log('[enrich] ERROR:', name, error?.message || error);
      }
    }

    return { enriched, skipped, errors };
  };

  console.log(`[enrich] Found ${targets.length} US products with <= 1 image`);

  if (arg1 === 'all') {
    const batches = Math.ceil(targets.length / batchSize);
    let totalEnriched = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (let batch = 0; batch < batches; batch += 1) {
      const batchOffset = batch * batchSize;
      console.log(`[enrich] === Batch ${batch + 1}: offset ${batchOffset} ===`);
      const slice = targets.slice(batchOffset, batchOffset + batchSize);
      const result = await processSlice(slice);
      totalEnriched += result.enriched;
      totalSkipped += result.skipped;
      totalErrors += result.errors;
      if (batch < batches - 1) {
        await delay(10000);
      }
    }

    console.log(
      `[enrich] Done! Enriched: ${totalEnriched}, Skipped: ${totalSkipped}, Errors: ${totalErrors}`
    );
    return;
  }

  const slice = targets.slice(offset, offset + limit);
  console.log(`[enrich] Processing ${slice.length} products (offset ${offset}, limit ${limit})`);
  const result = await processSlice(slice);
  console.log(
    `[enrich] Done! Enriched: ${result.enriched}, Skipped: ${result.skipped}, Errors: ${result.errors}`
  );
}

run().catch((error) => {
  console.error('[enrich] Fatal error:', error?.message || error);
});
