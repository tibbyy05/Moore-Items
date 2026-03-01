/**
 * fix-variant-keys.js
 * 
 * Phase 2: Backfill variant color/size/name from CJ variantKey data.
 * Fixes ~4,029 variants that have raw CJ SKU codes as names and missing color/size.
 * 
 * Usage:
 *   node scripts/fix-variant-keys.js              # Dry run (preview changes)
 *   node scripts/fix-variant-keys.js --apply       # Apply changes to database
 * 
 * What it does:
 *   1. Finds all active variants with CJ SKU names (pattern: ^CJ[A-Z0-9]+$)
 *   2. Matches each to its CJ raw data via SKU → extracts variantKey + variantImage
 *   3. Parses variantKey into color, size, and human-readable name
 *   4. Updates variant: name, color, size, image_url
 *   5. Also adds missing product images from variant images
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const isDryRun = !process.argv.includes('--apply');

// ============================================================
// KNOWN COLORS — comprehensive list for matching
// ============================================================
const KNOWN_COLORS = new Set([
  // Basic colors
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'beige', 'cream', 'ivory', 'navy',
  'gold', 'silver', 'bronze', 'copper', 'rose', 'coral', 'teal', 'cyan',
  'maroon', 'burgundy', 'lavender', 'lilac', 'violet', 'indigo', 'magenta',
  'turquoise', 'khaki', 'olive', 'tan', 'peach', 'salmon', 'mint',
  'charcoal', 'champagne', 'wine', 'plum', 'mauve', 'rust', 'taupe',
  'aqua', 'fuchsia', 'lime', 'lemon', 'mocha', 'caramel', 'chocolate',
  'coffee', 'apricot', 'emerald', 'ruby', 'sapphire', 'pearl',
  // Multi-word colors (matched as full strings)
  'dark blue', 'light blue', 'sky blue', 'royal blue', 'baby blue', 'navy blue',
  'dark green', 'light green', 'army green', 'forest green', 'olive green',
  'dark red', 'light red', 'wine red', 'dark gray', 'light gray',
  'dark grey', 'light grey', 'dark brown', 'light brown',
  'dark pink', 'light pink', 'hot pink', 'rose gold', 'rose pink',
  'carbon gray', 'warm white', 'cool white', 'off white',
  'orange black', 'black white', 'white gold', 'black gold',
  'brown gradient', 'gold color', 'wood color', 'carbonized color',
  'flesh color', 'skin color', 'natural color', 'natural',
  'multicolor', 'rainbow', 'colorful', 'transparent', 'clear',
  'golden', 'matte black', 'glossy black',
  // Material/finish colors
  'oak', 'walnut', 'maple', 'cherry', 'bamboo', 'teak', 'mahogany',
  'brushed copper', 'brushed nickel', 'brushed gold', 'stainless',
]);

// ============================================================
// KNOWN SIZES — patterns for matching
// ============================================================
const SIZE_PATTERNS = [
  // Clothing sizes
  /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|6XL)$/i,
  // Numeric sizes (shoe, ring, etc)
  /^(\d+(\.\d+)?)\s*(cm|mm|in|ft|inch|inches)?$/i,
  // Dimension patterns
  /^\d+[xX×]\d+(\s*(cm|mm|in|ft))?$/i,
  // Feet patterns
  /^\d+(\.\d+)?\s*ft$/i,
  // Queen/King/Twin etc (bed sizes)
  /^(twin|full|queen|king|california king|cal king)$/i,
];

// ============================================================
// JUNK VALUES — skip these entirely
// ============================================================
const JUNK_VALUES = new Set([
  'default', 'defaulttitle', 'default title', 'as picture', 'as pic',
  'as shown', 'as photo', 'one size', 'one color', 'standard',
  'regular', 'main', 'single', 'n/a', 'na', 'none', '-',
]);

// ============================================================
// PARSE variantKey into { color, size, name }
// ============================================================
function parseVariantKey(variantKey) {
  if (!variantKey || typeof variantKey !== 'string') {
    return { color: null, size: null, name: null, skipped: true, reason: 'empty' };
  }

  const raw = variantKey.trim();
  const lower = raw.toLowerCase();

  // Skip junk values
  if (JUNK_VALUES.has(lower)) {
    return { color: null, size: null, name: null, skipped: true, reason: 'junk' };
  }

  // Skip model/style codes (like DW002, Style1)
  if (/^[A-Z]{1,3}\d{3,}$/i.test(raw) || /^style\d+$/i.test(raw)) {
    return { color: null, size: null, name: raw, skipped: true, reason: 'style_code' };
  }

  let color = null;
  let size = null;

  // === Pattern 1: "Color-Size" (e.g., "Green-M", "Gray-S", "Blue-4XL") ===
  if (raw.includes('-')) {
    const parts = raw.split('-');
    
    if (parts.length === 2) {
      const [part1, part2] = parts;
      
      // Check if part1 is color and part2 is size
      const p1IsColor = isColor(part1);
      const p2IsSize = isSize(part2);
      const p1IsSize = isSize(part1);
      const p2IsColor = isColor(part2);

      if (p1IsColor && p2IsSize) {
        color = cleanColor(part1);
        size = cleanSize(part2);
      } else if (p1IsSize && p2IsColor) {
        size = cleanSize(part1);
        color = cleanColor(part2);
      } else if (p1IsColor && !p2IsSize) {
        // e.g., "Brown-1Pc" — color + quantity descriptor
        color = cleanColor(part1);
        // Check if part2 is a quantity (1Pc, 2Pack, etc) — don't set as size
        if (!isQuantity(part2)) {
          size = part2.trim();
        }
      } else if (!p1IsColor && p2IsSize) {
        // e.g., "2PACK6-L" — style + size
        size = cleanSize(part2);
        // Use whole key as name since part1 is a style code
        color = cleanStyleLabel(part1);
      } else {
        // Neither clearly matches — use full string as name
        return { color: null, size: null, name: raw, skipped: false, reason: 'unparseable_dash' };
      }
    } else {
      // Multiple dashes — try first and last segments
      const firstPart = parts[0];
      const lastPart = parts[parts.length - 1];
      if (isColor(firstPart)) color = cleanColor(firstPart);
      if (isSize(lastPart)) size = cleanSize(lastPart);
    }
  }
  // === Pattern 2: Pure color (e.g., "Black", "White Gold", "Carbon Gray") ===
  else if (isColor(raw)) {
    color = cleanColor(raw);
  }
  // === Pattern 3: Pure size (e.g., "4.5ft", "Queen", "25x35CM") ===
  else if (isSize(raw)) {
    size = cleanSize(raw);
  }
  // === Pattern 4: Quantity (e.g., "1pcs", "2pcs", "3pcs") ===
  else if (isQuantity(raw)) {
    return { color: null, size: null, name: raw, skipped: true, reason: 'quantity' };
  }
  // === Pattern 5: Combined no dash (e.g., "White2Pack", "Yellow110L") ===
  else {
    const combined = parseCombined(raw);
    if (combined.color) color = combined.color;
    if (combined.size) size = combined.size;
    if (!color && !size) {
      // Can't parse — use as-is for name
      return { color: null, size: null, name: raw, skipped: false, reason: 'unparseable' };
    }
  }

  // Build human-readable name
  const nameParts = [];
  if (color) nameParts.push(color);
  if (size) nameParts.push(size);
  const name = nameParts.length > 0 ? nameParts.join(' / ') : raw;

  return { color, size, name, skipped: false, reason: 'parsed' };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isColor(str) {
  if (!str) return false;
  const lower = str.trim().toLowerCase();
  // Direct match
  if (KNOWN_COLORS.has(lower)) return true;
  // Check with "color" suffix stripped
  if (lower.endsWith(' color')) {
    const base = lower.replace(/ color$/, '');
    if (KNOWN_COLORS.has(base)) return true;
  }
  // Check two-word colors
  if (KNOWN_COLORS.has(lower)) return true;
  return false;
}

function isSize(str) {
  if (!str) return false;
  const trimmed = str.trim();
  for (const pattern of SIZE_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
}

function isQuantity(str) {
  if (!str) return false;
  return /^\d+\s*(pcs?|pieces?|packs?|sets?|pairs?)$/i.test(str.trim());
}

function cleanColor(str) {
  if (!str) return null;
  let cleaned = str.trim();
  // Title case
  cleaned = cleaned.replace(/\b\w/g, c => c.toUpperCase());
  // Fix common patterns
  cleaned = cleaned.replace(/\s+Color$/i, '');
  return cleaned;
}

function cleanSize(str) {
  if (!str) return null;
  let cleaned = str.trim().toUpperCase();
  // Normalize clothing sizes
  cleaned = cleaned.replace(/^(\d)XL$/i, '$1XL');
  return cleaned;
}

function cleanStyleLabel(str) {
  if (!str) return null;
  // For things like "2PACK4", "2PACK6" — extract as a style label
  const match = str.match(/^(\d*PACK)(\d+)$/i);
  if (match) return `Style ${match[2]}`;
  return str.trim();
}

function parseCombined(str) {
  // Try to split "White2Pack", "Yellow110L", "Grey-44x13x13cm"
  // Pattern: ColorWord followed by number/size
  for (const colorName of KNOWN_COLORS) {
    if (str.toLowerCase().startsWith(colorName)) {
      const remainder = str.substring(colorName.length);
      if (remainder && /^[\d]/.test(remainder)) {
        return {
          color: cleanColor(colorName),
          size: isQuantity(remainder) ? null : remainder
        };
      }
    }
  }
  return { color: null, size: null };
}

// ============================================================
// MAIN — Fetch, match, parse, update
// ============================================================
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Fix Variant Keys — ${isDryRun ? 'DRY RUN' : '🔴 APPLYING CHANGES'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Fetch all products with CJ raw data that have SKU-named variants
  console.log('Step 1: Fetching products with CJ data...');
  
  let allProducts = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('mi_products')
      .select('id, name, images, cj_raw_data')
      .not('cj_raw_data', 'is', null)
      .eq('status', 'active')
      .range(from, from + batchSize - 1);
    
    if (error) { console.error('Error fetching products:', error); return; }
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  
  console.log(`  Found ${allProducts.length} active products with CJ data`);

  // Step 2: Fetch all variants with CJ SKU names
  console.log('Step 2: Fetching SKU-named variants...');
  
  let allVariants = [];
  from = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('mi_product_variants')
      .select('id, product_id, name, sku, color, size, image_url')
      .eq('is_active', true)
      .range(from, from + batchSize - 1);
    
    if (error) { console.error('Error fetching variants:', error); return; }
    if (!data || data.length === 0) break;
    allVariants.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  
  // Filter to SKU-named variants
  const skuVariants = allVariants.filter(v => /^CJ[A-Z0-9]+$/i.test(v.name));
  console.log(`  Found ${skuVariants.length} variants with CJ SKU names (of ${allVariants.length} total)`);

  // Step 3: Build product lookup map
  const productMap = new Map();
  for (const p of allProducts) {
    productMap.set(p.id, p);
  }

  // Step 4: Match variants to CJ data and parse
  console.log('Step 3: Matching variants to CJ variantKey...\n');
  
  const stats = {
    matched: 0,
    unmatched: 0,
    parsed: 0,
    colorFound: 0,
    sizeFound: 0,
    bothFound: 0,
    nameUpdated: 0,
    imageFixed: 0,
    productImageAdded: 0,
    skipped_junk: 0,
    skipped_quantity: 0,
    skipped_style: 0,
    skipped_empty: 0,
    unparseable: 0,
  };

  const updates = []; // { variantId, updates: { name, color, size, image_url } }
  const productImageUpdates = []; // { productId, newImage }

  for (const variant of skuVariants) {
    const product = productMap.get(variant.product_id);
    if (!product || !product.cj_raw_data?.variants) {
      stats.unmatched++;
      continue;
    }

    // Find matching CJ variant by SKU
    const cjVariant = product.cj_raw_data.variants.find(
      v => v.variantSku === variant.sku
    );

    if (!cjVariant) {
      stats.unmatched++;
      continue;
    }

    stats.matched++;

    // Parse variantKey
    const parsed = parseVariantKey(cjVariant.variantKey);

    if (parsed.skipped) {
      stats[`skipped_${parsed.reason}`] = (stats[`skipped_${parsed.reason}`] || 0) + 1;
      // Still update the name if we have a readable variantKey (even for "1pcs")
      if (cjVariant.variantKey && !JUNK_VALUES.has(cjVariant.variantKey.toLowerCase())) {
        const update = { name: cjVariant.variantKey };
        // Fix image if missing
        if (!variant.image_url && cjVariant.variantImage) {
          update.image_url = cjVariant.variantImage;
          stats.imageFixed++;
        }
        updates.push({ variantId: variant.id, productId: variant.product_id, update });
        stats.nameUpdated++;
      }
      continue;
    }

    // Build update object
    const update = {};
    
    // Always update name from SKU to human-readable
    if (parsed.name) {
      update.name = parsed.name;
      stats.nameUpdated++;
    }

    // Set color if we found one and variant doesn't already have it
    if (parsed.color && !variant.color) {
      update.color = parsed.color;
      stats.colorFound++;
    }

    // Set size if we found one and variant doesn't already have it
    if (parsed.size && !variant.size) {
      update.size = parsed.size;
      stats.sizeFound++;
    }

    if (parsed.color && parsed.size) stats.bothFound++;

    // Fix image if missing
    if (!variant.image_url && cjVariant.variantImage) {
      update.image_url = cjVariant.variantImage;
      stats.imageFixed++;
    }

    // Check if variant has image not in product images array
    if (cjVariant.variantImage && product.images) {
      if (!product.images.includes(cjVariant.variantImage)) {
        productImageUpdates.push({
          productId: product.id,
          newImage: cjVariant.variantImage
        });
        stats.productImageAdded++;
      }
    }

    if (Object.keys(update).length > 0) {
      updates.push({ variantId: variant.id, productId: variant.product_id, update });
      stats.parsed++;
    }
  }

  // === REPORT ===
  console.log(`${'='.repeat(60)}`);
  console.log('  RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Variants with SKU names:    ${skuVariants.length}`);
  console.log(`  Matched to CJ data:         ${stats.matched}`);
  console.log(`  No CJ match:                ${stats.unmatched}`);
  console.log(`  ---`);
  console.log(`  Names to update:             ${stats.nameUpdated}`);
  console.log(`  Colors to set:               ${stats.colorFound}`);
  console.log(`  Sizes to set:                ${stats.sizeFound}`);
  console.log(`  Both color+size:             ${stats.bothFound}`);
  console.log(`  Images to fix:               ${stats.imageFixed}`);
  console.log(`  Product images to add:       ${stats.productImageAdded}`);
  console.log(`  ---`);
  console.log(`  Skipped (junk):              ${stats.skipped_junk || 0}`);
  console.log(`  Skipped (quantity):          ${stats.skipped_quantity || 0}`);
  console.log(`  Skipped (style code):        ${stats.skipped_style_code || 0}`);
  console.log(`  Skipped (empty):             ${stats.skipped_empty || 0}`);
  console.log(`  Unparseable:                 ${stats.unparseable || 0}`);
  console.log();

  // Show sample updates
  console.log('Sample updates (first 20):');
  for (const u of updates.slice(0, 20)) {
    const product = productMap.get(u.productId);
    console.log(`  ${product?.name || 'Unknown'}`);
    console.log(`    → ${JSON.stringify(u.update)}`);
  }
  console.log();

  if (isDryRun) {
    console.log(`\n⚠️  DRY RUN — no changes applied.`);
    console.log(`   Run with --apply to update ${updates.length} variants.\n`);
    return;
  }

  // === APPLY UPDATES ===
  console.log(`Applying ${updates.length} variant updates...`);
  
  let applied = 0;
  let errors = 0;

  // Batch updates in chunks of 50
  for (let i = 0; i < updates.length; i += 50) {
    const batch = updates.slice(i, i + 50);
    
    for (const { variantId, update } of batch) {
      const { error } = await supabase
        .from('mi_product_variants')
        .update(update)
        .eq('id', variantId);

      if (error) {
        console.error(`  Error updating variant ${variantId}:`, error.message);
        errors++;
      } else {
        applied++;
      }
    }

    if ((i + 50) % 500 === 0 || i + 50 >= updates.length) {
      console.log(`  Progress: ${Math.min(i + 50, updates.length)}/${updates.length}`);
    }
  }

  // Apply product image updates (deduplicate by product)
  const uniqueProductImages = new Map();
  for (const { productId, newImage } of productImageUpdates) {
    if (!uniqueProductImages.has(productId)) {
      uniqueProductImages.set(productId, []);
    }
    const existing = uniqueProductImages.get(productId);
    if (!existing.includes(newImage)) {
      existing.push(newImage);
    }
  }

  console.log(`\nAdding missing images to ${uniqueProductImages.size} products...`);
  let productImagesApplied = 0;
  
  for (const [productId, newImages] of uniqueProductImages) {
    const product = productMap.get(productId);
    if (!product) continue;
    
    const updatedImages = [...(product.images || []), ...newImages];
    const { error } = await supabase
      .from('mi_products')
      .update({ images: updatedImages })
      .eq('id', productId);

    if (error) {
      console.error(`  Error updating product images ${productId}:`, error.message);
    } else {
      productImagesApplied++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  DONE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Variants updated:     ${applied}`);
  console.log(`  Variant errors:       ${errors}`);
  console.log(`  Product images added: ${productImagesApplied}`);
  console.log();
}

main().catch(console.error);