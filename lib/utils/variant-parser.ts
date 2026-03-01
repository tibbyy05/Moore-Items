/**
 * PHASE 3: PIPELINE FIX — variant-parser-v2.ts
 * 
 * Updated shared variant parser that uses CJ variantKey as PRIMARY source
 * for color/size, falling back to variant name parsing only when variantKey
 * is unavailable or unparseable.
 * 
 * REPLACES: lib/utils/variant-parser.ts
 * 
 * USED BY:
 *   - scripts/enrich-us-products.js (bulk enrichment)
 *   - app/api/admin/products/import-cj/route.ts (single product import)
 *   - scripts/fix-orphaned-variants.js (orphan variant creation)
 * 
 * THE ROOT CAUSE:
 *   The old parser ONLY looked at variant.variantName (often null) and 
 *   the CJ SKU code. It never checked variant.variantKey, which is where
 *   CJ actually stores the color/size info like "Black", "Green-M", etc.
 * 
 * THE FIX:
 *   1. Check variantKey FIRST (most reliable source)
 *   2. Fall back to variantName / variantNameEn parsing
 *   3. Fall back to product name prefix stripping (old behavior)
 *   4. Always set image_url from variantImage
 */

// ============================================================
// KNOWN COLORS
// ============================================================
const KNOWN_COLORS = new Set([
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'brown', 'gray', 'grey', 'beige', 'cream', 'ivory', 'navy',
  'gold', 'silver', 'bronze', 'copper', 'rose', 'coral', 'teal', 'cyan',
  'maroon', 'burgundy', 'lavender', 'lilac', 'violet', 'indigo', 'magenta',
  'turquoise', 'khaki', 'olive', 'tan', 'peach', 'salmon', 'mint',
  'charcoal', 'champagne', 'wine', 'plum', 'mauve', 'rust', 'taupe',
  'aqua', 'fuchsia', 'lime', 'lemon', 'mocha', 'caramel', 'chocolate',
  'coffee', 'apricot', 'emerald', 'ruby', 'sapphire', 'pearl',
  'dark blue', 'light blue', 'sky blue', 'royal blue', 'baby blue', 'navy blue',
  'dark green', 'light green', 'army green', 'forest green', 'olive green',
  'dark red', 'light red', 'wine red', 'dark gray', 'light gray',
  'dark grey', 'light grey', 'dark brown', 'light brown',
  'dark pink', 'light pink', 'hot pink', 'rose gold', 'rose pink',
  'carbon gray', 'warm white', 'cool white', 'off white',
  'orange black', 'black white', 'white gold', 'black gold',
  'brown gradient', 'gold color', 'wood color', 'carbonized color',
  'natural color', 'natural', 'multicolor', 'rainbow', 'colorful',
  'transparent', 'clear', 'golden', 'matte black', 'glossy black',
  'oak', 'walnut', 'maple', 'cherry', 'bamboo', 'teak', 'mahogany',
]);

const JUNK_VALUES = new Set([
  'default', 'defaulttitle', 'default title', 'as picture', 'as pic',
  'as shown', 'as photo', 'one size', 'one color', 'standard',
  'regular', 'main', 'single', 'n/a', 'na', 'none', '-',
]);

const SIZE_PATTERNS = [
  /^(XXS|XS|S|M|L|XL|XXL|XXXL|2XL|3XL|4XL|5XL|6XL)$/i,
  /^(\d+(\.\d+)?)\s*(cm|mm|in|ft|inch|inches)?$/i,
  /^\d+[xX×]\d+(\s*(cm|mm|in|ft))?$/i,
  /^\d+(\.\d+)?\s*ft$/i,
  /^(twin|full|queen|king|california king|cal king)$/i,
];

// ============================================================
// MAIN EXPORT: parseVariantColorSize
// ============================================================
export interface ParsedVariant {
  name: string;
  color: string | null;
  size: string | null;
  image_url: string | null;
}

/**
 * Parse color, size, and display name from a CJ variant object.
 * 
 * @param cjVariant - The raw CJ variant object from the API
 * @param productName - The product name (for fallback name stripping)
 * @returns ParsedVariant with name, color, size, image_url
 */
export function parseVariantColorSize(
  cjVariant: {
    variantKey?: string;
    variantName?: string;
    variantNameEn?: string;
    variantSku?: string;
    variantImage?: string;
  },
  productName?: string
): ParsedVariant {
  const result: ParsedVariant = {
    name: cjVariant.variantSku || 'Default',
    color: null,
    size: null,
    image_url: cjVariant.variantImage || null,
  };

  // === PRIORITY 1: Parse from variantKey (most reliable) ===
  if (cjVariant.variantKey) {
    const parsed = parseVariantKeyString(cjVariant.variantKey);
    if (parsed.color) result.color = parsed.color;
    if (parsed.size) result.size = parsed.size;
    if (parsed.name) result.name = parsed.name;
    
    // If we got useful data from variantKey, we're done
    if (parsed.color || parsed.size) {
      return result;
    }
  }

  // === PRIORITY 2: Parse from variantNameEn or variantName ===
  const variantLabel = cjVariant.variantNameEn || cjVariant.variantName;
  if (variantLabel && variantLabel.trim()) {
    const parsed = parseVariantNameString(variantLabel, productName);
    if (parsed.color && !result.color) result.color = parsed.color;
    if (parsed.size && !result.size) result.size = parsed.size;
    if (parsed.name && result.name === cjVariant.variantSku) {
      result.name = parsed.name;
    }
  }

  // === PRIORITY 3: Use variantKey as name even if unparseable ===
  if (result.name === cjVariant.variantSku && cjVariant.variantKey) {
    const lower = cjVariant.variantKey.toLowerCase().trim();
    if (!JUNK_VALUES.has(lower) && !/^[A-Z]{1,3}\d{3,}$/i.test(cjVariant.variantKey)) {
      result.name = cjVariant.variantKey;
    }
  }

  return result;
}

// ============================================================
// Parse a variantKey string into color/size
// ============================================================
function parseVariantKeyString(variantKey: string): { 
  color: string | null; size: string | null; name: string | null 
} {
  const raw = variantKey.trim();
  const lower = raw.toLowerCase();

  if (JUNK_VALUES.has(lower)) {
    return { color: null, size: null, name: null };
  }

  // Skip model/style codes
  if (/^[A-Z]{1,3}\d{3,}$/i.test(raw) || /^style\d+$/i.test(raw)) {
    return { color: null, size: null, name: raw };
  }

  // Skip quantities
  if (/^\d+\s*(pcs?|pieces?|packs?|sets?|pairs?)$/i.test(raw)) {
    return { color: null, size: null, name: raw };
  }

  let color: string | null = null;
  let size: string | null = null;

  // Pattern: "Color-Size"
  if (raw.includes('-')) {
    const parts = raw.split('-');
    if (parts.length === 2) {
      const [p1, p2] = parts;
      if (isColor(p1) && isSizeStr(p2)) {
        color = titleCase(p1);
        size = p2.toUpperCase();
      } else if (isColor(p1)) {
        color = titleCase(p1);
      } else if (isSizeStr(p2)) {
        size = p2.toUpperCase();
        // Check if p1 is a style like "2PACK6"
        if (/^\d*PACK\d+$/i.test(p1)) {
          color = `Style ${p1.match(/\d+$/)?.[0] || p1}`;
        }
      }
    }
  }
  // Pure color
  else if (isColor(raw)) {
    color = titleCase(raw);
  }
  // Pure size
  else if (isSizeStr(raw)) {
    size = raw.toUpperCase();
  }
  // Combined (e.g., "White2Pack")
  else {
    for (const c of Array.from(KNOWN_COLORS)) {
      if (lower.startsWith(c) && raw.length > c.length) {
        const remainder = raw.substring(c.length);
        if (/^[\d]/.test(remainder)) {
          color = titleCase(c);
          if (isSizeStr(remainder)) size = remainder;
          break;
        }
      }
    }
  }

  const nameParts: string[] = [];
  if (color) nameParts.push(color);
  if (size) nameParts.push(size);
  const name = nameParts.length > 0 ? nameParts.join(' / ') : raw;

  return { color, size, name };
}

// ============================================================
// Parse from variant name (fallback — old behavior improved)
// ============================================================
function parseVariantNameString(
  variantLabel: string, 
  productName?: string
): { color: string | null; size: string | null; name: string | null } {
  let label = variantLabel.trim();
  
  // Strip product name prefix if present
  if (productName) {
    const pName = productName.toLowerCase().trim();
    if (label.toLowerCase().startsWith(pName)) {
      label = label.substring(pName.length).trim();
      // Remove leading separators
      label = label.replace(/^[-_/|,\s]+/, '').trim();
    }
  }

  if (!label) return { color: null, size: null, name: null };

  // Try parsing the cleaned label
  return parseVariantKeyString(label);
}

// ============================================================
// Utility functions
// ============================================================
function isColor(str: string): boolean {
  const lower = str.trim().toLowerCase().replace(/\s+color$/, '');
  return KNOWN_COLORS.has(lower);
}

function isSizeStr(str: string): boolean {
  const trimmed = str.trim();
  return SIZE_PATTERNS.some(p => p.test(trimmed));
}

function titleCase(str: string): string {
  return str.trim().replace(/\b\w/g, c => c.toUpperCase());
}