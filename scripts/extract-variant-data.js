/**
 * Extract Color/Size from Variant Names
 * Parses variant names by stripping the product name prefix,
 * then matching remaining text against known colors and sizes.
 *
 * Usage:
 *   node scripts/extract-variant-data.js --scan       (show stats only)
 *   node scripts/extract-variant-data.js --dry-run    (preview extractions)
 *   node scripts/extract-variant-data.js --apply      (save to database)
 */

const fs = require('fs');
const path = require('path');

// --- Load .env.local ---
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required env vars');
  process.exit(1);
}

const mode = process.argv[2];
if (!mode || !['--scan', '--dry-run', '--apply'].includes(mode)) {
  console.log('Usage: node scripts/extract-variant-data.js --scan|--dry-run|--apply');
  process.exit(0);
}

// --- Known colors (order matters — longer/multi-word first) ---
const COLORS = [
  // Multi-word colors first
  'Army Green', 'Dark Green', 'Light Green', 'Olive Green', 'Forest Green',
  'Dark Blue', 'Light Blue', 'Navy Blue', 'Royal Blue', 'Sky Blue', 'Baby Blue',
  'Dark Red', 'Wine Red', 'Dark Brown', 'Light Brown', 'Coffee Brown',
  'Dark Grey', 'Light Grey', 'Dark Gray', 'Light Gray',
  'Dark Pink', 'Light Pink', 'Hot Pink', 'Rose Red', 'Rose Gold',
  'Light Purple', 'Dark Purple',
  'Off White', 'Off-white', 'Creamy White',
  'Black Gold', 'Black Silver', 'Black Red', 'Black Blue', 'Black Green',
  'White Gold', 'White Silver',
  'Gold Silver',
  'Matte Black', 'Glossy Black',
  // Single colors
  'Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange',
  'Brown', 'Grey', 'Gray', 'Navy', 'Beige', 'Khaki', 'Cream', 'Ivory', 'Teal',
  'Cyan', 'Maroon', 'Burgundy', 'Coral', 'Salmon', 'Lavender', 'Violet',
  'Gold', 'Golden', 'Silver', 'Bronze', 'Copper', 'Rose', 'Champagne',
  'Turquoise', 'Aqua', 'Mint', 'Olive', 'Tan', 'Camel', 'Wine', 'Coffee',
  'Apricot', 'Nude', 'Sand', 'Charcoal', 'Sapphire', 'Ruby', 'Emerald',
  'Leopard', 'Camo', 'Camouflage', 'Floral', 'Stripe', 'Plaid',
  'Multicolor', 'Multi-color', 'Rainbow', 'Transparent', 'Clear',
  // Color-like descriptors from CJ
  'Blackbracelet', 'Goldenbracelet', 'Silverbracelet',
  'Classic Black', 'Girl Pink',
];

// Build case-insensitive lookup
const COLOR_PATTERNS = COLORS.map(c => ({
  name: c,
  regex: new RegExp('\\b' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i'),
}));

// --- Known sizes ---
const SIZE_PATTERNS = [
  // Clothing sizes (check longer first)
  { regex: /\b(5XL|4XL|3XL|XXXL)\b/i, size: '3XL' },
  { regex: /\b(XXL|2XL)\b/i, size: 'XXL' },
  { regex: /\bXL\b/i, size: 'XL' },
  { regex: /\bXS\b/i, size: 'XS' },
  { regex: /\b(?<![A-Za-z])S(?![A-Za-z])\b/, size: 'S' },
  { regex: /\b(?<![A-Za-z])M(?![A-Za-z])\b/, size: 'M' },
  { regex: /\b(?<![A-Za-z])L(?![A-Za-z])\b/, size: 'L' },
  // Ring/shoe numeric sizes (only at end of string or after color)
  { regex: /\b(\d{1,2}(?:\.\d)?)\s*$/, size: null, extract: true },
  // Descriptive sizes
  { regex: /\bOne Size\b/i, size: 'One Size' },
  { regex: /\bFree Size\b/i, size: 'Free Size' },
  // Dimensions like "150x200cm" — treat as size
  { regex: /\b(\d+x\d+(?:x\d+)?)\s*(?:cm|mm|inch|in)?\b/i, size: null, extract: true },
];

// --- Supabase helpers ---
async function supabaseFetch(endpoint) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Prefer': 'count=exact',
    },
  });
  const data = await res.json();
  const count = res.headers.get('content-range')?.split('/')[1];
  return { data, count: count ? parseInt(count) : null };
}

async function supabaseFetchAll(table, query) {
  let all = [];
  let offset = 0;
  const limit = 1000;
  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?${query}&limit=${limit}&offset=${offset}`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await res.json();
    if (!data.length) break;
    all = [...all, ...data];
    offset += limit;
    if (data.length < limit) break;
  }
  return all;
}

async function supabaseUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(data),
  });
  return res.ok;
}

// --- Extract color/size from remainder text ---
function extractColorSize(remainder) {
  let color = null;
  let size = null;
  let text = remainder.trim();

  if (!text) return { color, size };

  // Skip CJ SKU codes
  if (/^CJ[A-Z]{2}\d+/.test(text)) return { color, size };

  // Try to find color
  for (const cp of COLOR_PATTERNS) {
    if (cp.regex.test(text)) {
      color = cp.name;
      // Remove color from text to find size in remainder
      text = text.replace(cp.regex, '').trim();
      break;
    }
  }

  // Try to find size
  for (const sp of SIZE_PATTERNS) {
    const match = text.match(sp.regex);
    if (match) {
      if (sp.extract) {
        size = match[1] || match[0];
      } else {
        size = sp.size;
      }
      break;
    }
  }

  // If no color found but entire remainder looks like a color word
  if (!color && !size && text.length < 30) {
    for (const cp of COLOR_PATTERNS) {
      if (cp.regex.test(text)) {
        color = cp.name;
        break;
      }
    }
  }

  return { color, size };
}

// --- Main ---
async function main() {
  console.log(`=== Extract Variant Color/Size Data ===`);
  console.log(`Mode: ${mode.replace('--', '').toUpperCase()}\n`);

  // Get all products with their names
  console.log('Fetching products...');
  const products = await supabaseFetchAll('mi_products', 'select=id,name&status=eq.active');
  const productMap = {};
  products.forEach(p => { productMap[p.id] = p.name; });
  console.log(`Found ${products.length} active products`);

  // Get all variants missing color OR size
  console.log('Fetching variants with missing data...');
  const variants = await supabaseFetchAll(
    'mi_product_variants',
    'select=id,name,color,size,product_id&or=(color.is.null,size.is.null)&is_active=eq.true'
  );
  console.log(`Found ${variants.length} variants with missing color or size\n`);

  if (mode === '--scan') {
    // Just show stats
    let canExtractColor = 0;
    let canExtractSize = 0;
    let skuCodes = 0;
    let noProduct = 0;

    for (const v of variants) {
      const productName = productMap[v.product_id];
      if (!productName) { noProduct++; continue; }

      // Get remainder after stripping product name
      let remainder = v.name;
      if (v.name.toLowerCase().startsWith(productName.toLowerCase())) {
        remainder = v.name.substring(productName.length).trim();
      }

      if (/^CJ[A-Z]{2}\d+/.test(v.name) || /^CJ[A-Z]{2}\d+/.test(remainder)) {
        skuCodes++;
        continue;
      }

      const { color, size } = extractColorSize(remainder);
      if (color && !v.color) canExtractColor++;
      if (size && !v.size) canExtractSize++;
    }

    console.log('=== Scan Results ===');
    console.log(`Can extract color: ${canExtractColor}`);
    console.log(`Can extract size: ${canExtractSize}`);
    console.log(`CJ SKU codes (no data to extract): ${skuCodes}`);
    console.log(`No matching product: ${noProduct}`);
    console.log(`\nRun with --dry-run to preview extractions`);
    return;
  }

  // Process variants
  let updatedColor = 0;
  let updatedSize = 0;
  let updatedBoth = 0;
  let skipped = 0;
  let failed = 0;
  let samples = [];

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const productName = productMap[v.product_id];
    if (!productName) { skipped++; continue; }

    // Strip product name prefix to get the variant-specific part
    let remainder = v.name;
    if (v.name.toLowerCase().startsWith(productName.toLowerCase())) {
      remainder = v.name.substring(productName.length).trim();
    } else {
      // Try to find where the product name ends approximately
      // Sometimes variant name has slight differences
      const words = productName.split(' ');
      let matchLen = 0;
      for (let w = words.length; w > 0; w--) {
        const partial = words.slice(0, w).join(' ');
        if (v.name.toLowerCase().startsWith(partial.toLowerCase())) {
          matchLen = partial.length;
          break;
        }
      }
      if (matchLen > 0) {
        remainder = v.name.substring(matchLen).trim();
      }
    }

    // Skip CJ SKU codes
    if (/^CJ[A-Z]{2}\d+/.test(v.name)) { skipped++; continue; }

    const { color, size } = extractColorSize(remainder);

    // Only update fields that are currently null
    const updates = {};
    if (color && !v.color) updates.color = color;
    if (size && !v.size) updates.size = size;

    if (Object.keys(updates).length === 0) { skipped++; continue; }

    if (mode === '--dry-run') {
      if (samples.length < 50) {
        samples.push({
          name: v.name.substring(0, 60),
          remainder: remainder.substring(0, 30),
          ...updates,
        });
      }
    } else {
      const ok = await supabaseUpdate('mi_product_variants', v.id, updates);
      if (!ok) { failed++; continue; }
    }

    if (updates.color && updates.size) updatedBoth++;
    else if (updates.color) updatedColor++;
    else if (updates.size) updatedSize++;

    // Progress log every 500
    if (mode === '--apply' && (i + 1) % 500 === 0) {
      console.log(`  Progress: ${i + 1}/${variants.length}...`);
    }
  }

  if (mode === '--dry-run' && samples.length > 0) {
    console.log('=== Sample Extractions (first 50) ===');
    samples.forEach((s, i) => {
      const parts = [];
      if (s.color) parts.push(`color="${s.color}"`);
      if (s.size) parts.push(`size="${s.size}"`);
      console.log(`  ${i + 1}. "${s.name}..." remainder="${s.remainder}" → ${parts.join(', ')}`);
    });
  }

  console.log(`\n=== Summary ===`);
  console.log(`Color only extracted: ${updatedColor}`);
  console.log(`Size only extracted: ${updatedSize}`);
  console.log(`Both extracted: ${updatedBoth}`);
  console.log(`Total updated: ${updatedColor + updatedSize + updatedBoth}`);
  console.log(`Skipped (SKU codes / no match / already set): ${skipped}`);
  if (failed) console.log(`Failed: ${failed}`);

  if (mode === '--dry-run') {
    console.log(`\nThis was a dry run. Run with --apply to save changes.`);
  } else {
    console.log(`\nDone! Variant data updated in database.`);
  }
}

main().catch(console.error);