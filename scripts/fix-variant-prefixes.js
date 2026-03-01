/**
 * fix-variant-prefixes.js
 * 
 * Fixes the remaining ~276 products where variant names contain the full product
 * title as a prefix (e.g., "Kitchen Knife Set Chef's Knife Meat Chopping Knife 3 piece set").
 * 
 * Strategy:
 *   1. Find multi-variant products where ALL variants lack color AND size
 *   2. For each variant, strip the product name from the front
 *   3. Parse the remainder for color, size, quantity, style patterns
 *   4. Update color, size, and clean up the display name
 * 
 * Usage:
 *   node scripts/fix-variant-prefixes.js              # Dry run (preview)
 *   node scripts/fix-variant-prefixes.js --apply       # Apply changes
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const isDryRun = !process.argv.includes('--apply');

// ============================================================
// KNOWN COLORS
// ============================================================
const KNOWN_COLORS = [
  // Multi-word first (longest match wins)
  'rose gold', 'army green', 'forest green', 'olive green', 'dark green', 'light green',
  'dark blue', 'light blue', 'sky blue', 'royal blue', 'baby blue', 'navy blue', 'lake blue',
  'dark red', 'wine red', 'light red',
  'dark gray', 'light gray', 'dark grey', 'light grey', 'carbon gray',
  'dark brown', 'light brown', 'dark pink', 'light pink', 'hot pink',
  'rose pink', 'warm white', 'cool white', 'off white', 'milky white', 'cream white',
  'matte black', 'glossy black', 'jet black',
  'orange red', 'yellow green', 'blue green', 'red brown',
  'black gold', 'black white', 'white gold', 'orange black', 'black red', 'black blue',
  'rustic brown', 'wood color', 'gold color', 'natural color', 'flesh color', 'skin color',
  // Single words
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'beige', 'cream', 'ivory', 'navy',
  'gold', 'golden', 'silver', 'silvery', 'bronze', 'copper', 'rose', 'coral', 'teal', 'cyan',
  'maroon', 'burgundy', 'lavender', 'lilac', 'violet', 'indigo', 'magenta',
  'turquoise', 'khaki', 'olive', 'tan', 'peach', 'salmon', 'mint',
  'charcoal', 'champagne', 'wine', 'plum', 'mauve', 'rust', 'taupe',
  'aqua', 'fuchsia', 'lime', 'lemon', 'mocha', 'caramel', 'chocolate',
  'coffee', 'apricot', 'emerald', 'ruby', 'sapphire', 'pearl',
  'multicolor', 'rainbow', 'colorful', 'transparent', 'clear', 'natural',
  'oak', 'walnut', 'maple', 'cherry', 'bamboo', 'teak', 'mahogany', 'stainless',
];

// ============================================================
// PARSE REMAINDER after stripping product name
// ============================================================
function parseRemainder(remainder) {
  if (!remainder || remainder.trim().length === 0) {
    return { color: null, size: null, displayName: null };
  }

  let text = remainder.trim();
  // Strip leading/trailing punctuation, dashes, spaces
  text = text.replace(/^[\s\-_.,;:]+|[\s\-_.,;:]+$/g, '').trim();
  
  if (!text) return { color: null, size: null, displayName: null };

  const lower = text.toLowerCase();
  let color = null;
  let size = null;
  let displayName = text;

  // === Try to extract color ===
  for (const c of KNOWN_COLORS) {
    const regex = new RegExp(`(?:^|[\\s\\-_])${escapeRegex(c)}(?:$|[\\s\\-_])`, 'i');
    const exactStart = new RegExp(`^${escapeRegex(c)}(?:$|[\\s\\-_])`, 'i');
    const exactEnd = new RegExp(`(?:^|[\\s\\-_])${escapeRegex(c)}$`, 'i');
    const exact = new RegExp(`^${escapeRegex(c)}$`, 'i');
    
    if (exact.test(text)) {
      color = titleCase(c);
      break;
    }
    if (exactStart.test(text)) {
      color = titleCase(c);
      // Remainder after color might be size
      const afterColor = text.substring(c.length).replace(/^[\s\-_]+/, '').trim();
      if (afterColor) {
        const parsedSize = tryParseSize(afterColor);
        if (parsedSize) size = parsedSize;
        else displayName = `${titleCase(c)} - ${cleanFragment(afterColor)}`;
      }
      break;
    }
    if (exactEnd.test(text)) {
      color = titleCase(c);
      const beforeColor = text.substring(0, text.length - c.length).replace(/[\s\-_]+$/, '').trim();
      if (beforeColor) {
        const parsedSize = tryParseSize(beforeColor);
        if (parsedSize) size = parsedSize;
      }
      break;
    }
  }

  // === If no color found, try other patterns ===
  if (!color) {
    // Check for "ColorSize" smashed together (e.g., "Black49Inches", "Grey2pcs")
    for (const c of KNOWN_COLORS) {
      if (lower.startsWith(c) && text.length > c.length) {
        const after = text.substring(c.length).trim();
        if (/^\d/.test(after) || /^[A-Z]{1,3}$/.test(after)) {
          color = titleCase(c);
          const parsedSize = tryParseSize(after);
          if (parsedSize) size = parsedSize;
          else displayName = `${titleCase(c)} - ${cleanFragment(after)}`;
          break;
        }
      }
    }
  }

  // === Try size-only patterns if no color ===
  if (!color && !size) {
    const parsedSize = tryParseSize(text);
    if (parsedSize) {
      size = parsedSize;
    }
  }

  // === Quantity patterns → size ===
  if (!size) {
    const qty = tryParseQuantity(text);
    if (qty) {
      size = qty;
      if (!color) displayName = qty;
    }
  }

  // === Style patterns ===
  if (!color && !size) {
    const style = tryParseStyle(text);
    if (style) {
      size = style; // Use size field for style variants
      displayName = style;
    }
  }

  // Build clean display name
  if (color && size) {
    displayName = `${color} / ${size}`;
  } else if (color) {
    displayName = color;
  } else if (size) {
    displayName = size;
  }

  return { color, size, displayName };
}

// ============================================================
// SIZE PARSING
// ============================================================
function tryParseSize(str) {
  if (!str) return null;
  const s = str.trim();
  const lower = s.toLowerCase();

  // Clothing sizes
  if (/^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|6XL)$/i.test(s)) {
    return s.toUpperCase();
  }

  // Numeric with unit (49Inches, 26Inch, 4ft, 100cm, 48m)
  const numUnit = s.match(/^(\d+(?:\.\d+)?)\s*(inches|inch|in|ft|feet|cm|mm|m|oz|lb|lbs|ml|liter|liters|l|g|kg|gal|gallon|qt|quart)$/i);
  if (numUnit) {
    return `${numUnit[1]} ${normalizeUnit(numUnit[2])}`;
  }

  // Pure number (could be ring size, shoe size, etc)
  if (/^\d+(\.\d+)?$/.test(s) && parseFloat(s) > 0 && parseFloat(s) < 200) {
    return s;
  }

  // Dimensions (24x36, 100x50cm)
  if (/^\d+\s*[xX×]\s*\d+(\s*(cm|mm|in|ft|m))?$/i.test(s)) {
    return s.replace(/[xX]/g, '×').toUpperCase();
  }

  // Bed sizes
  if (/^(twin|full|queen|king|california king|cal king|single|double)$/i.test(s)) {
    return titleCase(s);
  }

  // Carat
  if (/^\d+\s*carats?$/i.test(s)) {
    const m = s.match(/^(\d+)/);
    return `${m[1]} Carat`;
  }

  // Weight (24lb, 30lb)
  if (/^\d+\s*lbs?$/i.test(s)) {
    const m = s.match(/^(\d+)/);
    return `${m[1]} lb`;
  }

  return null;
}

// ============================================================
// QUANTITY PARSING → human-readable size
// ============================================================
function tryParseQuantity(str) {
  if (!str) return null;
  const s = str.trim();

  // Xpcs, Xpc, Xpieces
  const pcs = s.match(/^(\d+)\s*(?:pcs?|pieces?)$/i);
  if (pcs) {
    const n = parseInt(pcs[1]);
    if (n === 1) return '1 Piece';
    return `${n} Pack`;
  }

  // Xpacks, Xsets, Xpairs
  const pack = s.match(/^(\d+)\s*(?:packs?|sets?|pairs?)$/i);
  if (pack) {
    const n = parseInt(pack[1]);
    const unit = s.toLowerCase().includes('set') ? 'Set' : 
                 s.toLowerCase().includes('pair') ? 'Pair' : 'Pack';
    return `${n} ${unit}${n > 1 ? 's' : ''}`;
  }

  // "Set of X"
  const setOf = s.match(/^set\s*(?:of\s*)?(\d+)$/i);
  if (setOf) return `Set of ${setOf[1]}`;

  // XP (1P, 2P, 3P)
  const xp = s.match(/^(\d+)P$/i);
  if (xp) {
    const n = parseInt(xp[1]);
    return n === 1 ? '1 Piece' : `${n} Pack`;
  }

  // "X Piece Set"
  const pieceSet = s.match(/^(\d+)\s*(?:piece|pc|pcs)\s*set$/i);
  if (pieceSet) return `${pieceSet[1]} Piece Set`;

  return null;
}

// ============================================================
// STYLE PARSING
// ============================================================
function tryParseStyle(str) {
  if (!str) return null;
  const s = str.trim();

  // Style1, Style2, StyleA, StyleB
  const styleNum = s.match(/^style\s*(\w+)$/i);
  if (styleNum) return `Style ${styleNum[1].toUpperCase()}`;

  // SetX
  const setNum = s.match(/^set\s*(\d+)$/i);
  if (setNum) return `Set ${setNum[1]}`;

  // Single letters A, B, C, D (common style codes)
  if (/^[A-Z]$/i.test(s)) return `Style ${s.toUpperCase()}`;

  // TypeX, ModelX
  const typeNum = s.match(/^(?:type|model)\s*(\w+)$/i);
  if (typeNum) return `Type ${typeNum[1].toUpperCase()}`;

  return null;
}

// ============================================================
// HELPERS
// ============================================================
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function titleCase(str) {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

function normalizeUnit(unit) {
  const map = {
    'inches': 'in', 'inch': 'in', 'in': 'in',
    'ft': 'ft', 'feet': 'ft',
    'cm': 'cm', 'mm': 'mm', 'm': 'm',
    'oz': 'oz', 'lb': 'lb', 'lbs': 'lb',
    'ml': 'ml', 'l': 'L', 'liter': 'L', 'liters': 'L',
    'g': 'g', 'kg': 'kg',
    'gal': 'gal', 'gallon': 'gal', 'qt': 'qt', 'quart': 'qt',
  };
  return map[unit.toLowerCase()] || unit;
}

function cleanFragment(str) {
  // Clean up a leftover fragment into something display-worthy
  let cleaned = str.trim();
  // Strip leading numbers if they look like leftover product name parts
  cleaned = cleaned.replace(/^[\s\-_.,;:]+|[\s\-_.,;:]+$/g, '').trim();
  if (!cleaned) return null;
  // Title case if all lowercase
  if (cleaned === cleaned.toLowerCase()) {
    cleaned = titleCase(cleaned);
  }
  return cleaned;
}

// ============================================================
// STRIP PRODUCT NAME FROM VARIANT NAME
// ============================================================
function stripProductName(variantName, productName) {
  if (!variantName || !productName) return variantName;
  
  const vLower = variantName.toLowerCase().trim();
  const pLower = productName.toLowerCase().trim();

  // Direct prefix match
  if (vLower.startsWith(pLower)) {
    return variantName.substring(productName.length).trim();
  }

  // Try word-by-word longest prefix match (handles slight differences)
  const vWords = variantName.trim().split(/\s+/);
  const pWords = productName.trim().split(/\s+/);
  
  let matchLen = 0;
  for (let i = 0; i < Math.min(vWords.length, pWords.length); i++) {
    if (vWords[i].toLowerCase() === pWords[i].toLowerCase()) {
      matchLen = i + 1;
    } else {
      break;
    }
  }

  // Need at least 3 matching words to be confident it's a prefix
  if (matchLen >= 3 && matchLen < vWords.length) {
    return vWords.slice(matchLen).join(' ').trim();
  }

  // Try matching from the end backwards — sometimes variant has extra words in middle
  // e.g. product: "Knife Set Chef" variant: "Knife Set Chef Black Large"
  // Just return the last 1-3 words if the variant is significantly longer
  if (vWords.length > pWords.length + 1 && matchLen >= Math.floor(pWords.length * 0.5)) {
    const extraWords = vWords.slice(matchLen);
    return extraWords.join(' ').trim();
  }

  return null; // Can't strip — variant name doesn't contain product name
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Fix Variant Prefixes — ${isDryRun ? 'DRY RUN' : '🔴 APPLYING CHANGES'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Step 1: Find broken products (multi-variant, ALL variants lack color AND size)
  console.log('Step 1: Finding broken multi-variant products...');
  
  // Get all active products
  let allProducts = [];
  let from = 0;
  const batchSize = 1000;
  
  while (true) {
    const { data, error } = await supabase
      .from('mi_products')
      .select('id, name, review_count')
      .eq('status', 'active')
      .range(from, from + batchSize - 1);
    
    if (error) { console.error('Error:', error); return; }
    if (!data || data.length === 0) break;
    allProducts.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  console.log(`  ${allProducts.length} active products`);

  // Get all variants
  let allVariants = [];
  from = 0;
  
  while (true) {
    const { data, error } = await supabase
      .from('mi_product_variants')
      .select('id, product_id, name, color, size, is_active')
      .eq('is_active', true)
      .range(from, from + batchSize - 1);
    
    if (error) { console.error('Error:', error); return; }
    if (!data || data.length === 0) break;
    allVariants.push(...data);
    if (data.length < batchSize) break;
    from += batchSize;
  }
  console.log(`  ${allVariants.length} active variants`);

  // Group variants by product
  const variantsByProduct = new Map();
  for (const v of allVariants) {
    if (!variantsByProduct.has(v.product_id)) {
      variantsByProduct.set(v.product_id, []);
    }
    variantsByProduct.get(v.product_id).push(v);
  }

  // Find broken products: 2+ variants, ALL have null color AND null size
  const productMap = new Map(allProducts.map(p => [p.id, p]));
  const brokenProducts = [];
  
  for (const [productId, variants] of variantsByProduct) {
    if (variants.length < 2) continue;
    const allBroken = variants.every(v => !v.color && !v.size);
    if (allBroken) {
      const product = productMap.get(productId);
      if (product) {
        brokenProducts.push({ product, variants });
      }
    }
  }

  // Sort by review_count DESC (fix highest visibility first)
  brokenProducts.sort((a, b) => (b.product.review_count || 0) - (a.product.review_count || 0));
  
  console.log(`  ${brokenProducts.length} broken products (multi-variant, no color/size)\n`);

  // Step 2: For each broken product, try to strip product name and parse remainder
  console.log('Step 2: Stripping product name prefixes and parsing...\n');
  
  const stats = {
    totalVariants: 0,
    stripped: 0,
    colorFound: 0,
    sizeFound: 0,
    bothFound: 0,
    parsedSomething: 0,
    noStrip: 0,
    emptyRemainder: 0,
    unparseable: 0,
    productsFixed: 0,
    productsPartial: 0,
    productsUnfixable: 0,
  };

  const updates = []; // { variantId, color, size, name }

  for (const { product, variants } of brokenProducts) {
    let productHasFix = false;
    let productAllFixed = true;

    for (const variant of variants) {
      stats.totalVariants++;

      // Try stripping product name
      let remainder = stripProductName(variant.name, product.name);
      
      if (!remainder) {
        // Fallback: if variant name is very long (>50 chars), try taking last 1-4 words
        const words = variant.name.trim().split(/\s+/);
        if (words.length > 5) {
          // Try last 1, 2, 3, 4 words until we get a parse
          for (let take = 1; take <= Math.min(4, words.length - 3); take++) {
            const candidate = words.slice(-take).join(' ');
            const test = parseRemainder(candidate);
            if (test.color || test.size) {
              remainder = candidate;
              break;
            }
          }
        }
        
        if (!remainder) {
          stats.noStrip++;
          productAllFixed = false;
          continue;
        }
      }

      stats.stripped++;

      if (!remainder.trim()) {
        stats.emptyRemainder++;
        productAllFixed = false;
        continue;
      }

      // Parse the remainder
      const parsed = parseRemainder(remainder);

      if (parsed.color || parsed.size) {
        stats.parsedSomething++;
        if (parsed.color) stats.colorFound++;
        if (parsed.size) stats.sizeFound++;
        if (parsed.color && parsed.size) stats.bothFound++;
        
        productHasFix = true;
        
        updates.push({
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          oldName: variant.name,
          remainder: remainder,
          color: parsed.color,
          size: parsed.size,
          displayName: parsed.displayName || remainder,
        });
      } else {
        stats.unparseable++;
        productAllFixed = false;
      }
    }

    if (productHasFix && productAllFixed) stats.productsFixed++;
    else if (productHasFix) stats.productsPartial++;
    else stats.productsUnfixable++;
  }

  // === REPORT ===
  console.log(`${'='.repeat(60)}`);
  console.log('  RESULTS');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Broken products:        ${brokenProducts.length}`);
  console.log(`  Total variants:         ${stats.totalVariants}`);
  console.log(`  ---`);
  console.log(`  Prefix stripped:        ${stats.stripped}`);
  console.log(`  Could not strip:        ${stats.noStrip}`);
  console.log(`  Empty remainder:        ${stats.emptyRemainder}`);
  console.log(`  ---`);
  console.log(`  Parsed (color/size):    ${stats.parsedSomething}`);
  console.log(`    Color found:          ${stats.colorFound}`);
  console.log(`    Size found:           ${stats.sizeFound}`);
  console.log(`    Both:                 ${stats.bothFound}`);
  console.log(`  Unparseable remainder:  ${stats.unparseable}`);
  console.log(`  ---`);
  console.log(`  Products fully fixed:   ${stats.productsFixed}`);
  console.log(`  Products partially:     ${stats.productsPartial}`);
  console.log(`  Products unfixable:     ${stats.productsUnfixable}`);
  console.log();

  // Show samples grouped by product
  const samplesByProduct = new Map();
  for (const u of updates) {
    if (!samplesByProduct.has(u.productId)) {
      samplesByProduct.set(u.productId, []);
    }
    samplesByProduct.get(u.productId).push(u);
  }

  console.log('Sample fixes (first 15 products):');
  let shown = 0;
  for (const [productId, productUpdates] of samplesByProduct) {
    if (shown >= 15) break;
    const name = productUpdates[0].productName;
    const reviews = productMap.get(productId)?.review_count || 0;
    console.log(`\n  📦 ${name} (${reviews} reviews)`);
    for (const u of productUpdates.slice(0, 5)) {
      const parts = [];
      if (u.color) parts.push(`color: ${u.color}`);
      if (u.size) parts.push(`size: ${u.size}`);
      console.log(`    "${u.remainder}" → ${parts.join(', ')} [name: "${u.displayName}"]`);
    }
    if (productUpdates.length > 5) {
      console.log(`    ... and ${productUpdates.length - 5} more variants`);
    }
    shown++;
  }
  console.log();

  if (isDryRun) {
    console.log(`\n⚠️  DRY RUN — no changes applied.`);
    console.log(`   Run with --apply to update ${updates.length} variants across ${stats.productsFixed + stats.productsPartial} products.\n`);
    return;
  }

  // === APPLY ===
  console.log(`Applying ${updates.length} variant updates...`);
  
  let applied = 0;
  let errors = 0;

  for (let i = 0; i < updates.length; i++) {
    const u = updates[i];
    const updateData = { name: u.displayName };
    if (u.color) updateData.color = u.color;
    if (u.size) updateData.size = u.size;

    const { error } = await supabase
      .from('mi_product_variants')
      .update(updateData)
      .eq('id', u.variantId);

    if (error) {
      console.error(`  Error updating variant ${u.variantId}:`, error.message);
      errors++;
    } else {
      applied++;
    }

    if ((i + 1) % 100 === 0 || i === updates.length - 1) {
      console.log(`  Progress: ${i + 1}/${updates.length}`);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('  DONE');
  console.log(`${'='.repeat(60)}`);
  console.log(`  Variants updated:   ${applied}`);
  console.log(`  Errors:             ${errors}`);
  console.log();
}

main().catch(console.error);