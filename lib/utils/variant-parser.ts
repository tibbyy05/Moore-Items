const KNOWN_COLORS = [
  'Red',
  'Blue',
  'Green',
  'Black',
  'White',
  'Pink',
  'Purple',
  'Orange',
  'Yellow',
  'Brown',
  'Gray',
  'Grey',
  'Navy',
  'Beige',
  'Gold',
  'Silver',
  'Rose Gold',
  'Burgundy',
  'Teal',
  'Coral',
  'Ivory',
  'Khaki',
  'Lavender',
  'Maroon',
  'Mint',
  'Olive',
  'Peach',
  'Turquoise',
  'Violet',
  'Wine',
  'Champagne',
  'Copper',
  'Bronze',
  'Cream',
  'Tan',
  'Nude',
  'Mauve',
  'Plum',
  'Sage',
  'Rust',
  'Aqua',
  'Charcoal',
  'Emerald',
  'Fuchsia',
  'Indigo',
  'Lilac',
  'Magenta',
  'Mustard',
  'Ruby',
  'Sapphire',
  'Taupe',
  'Camel',
  'Apricot',
  'Azure',
  'Blush',
  'Caramel',
  'Chocolate',
  'Cinnamon',
  'Cobalt',
  'Coffee',
  'Crimson',
  'Cyan',
  'Forest Green',
  'Hot Pink',
  'Hunter Green',
  'Ice Blue',
  'Jade',
  'Lemon',
  'Light Blue',
  'Light Green',
  'Light Pink',
  'Light Purple',
  'Lime',
  'Mocha',
  'Moss',
  'Ocean Blue',
  'Pale Pink',
  'Peacock',
  'Periwinkle',
  'Pine',
  'Powder Blue',
  'Rainbow',
  'Rose',
  'Royal Blue',
  'Sand',
  'Scarlet',
  'Sky Blue',
  'Slate',
  'Steel',
  'Sunset',
  'Terracotta',
  'Thistle',
  'Wheat',
  'Wine Red',
];

const SIZE_PATTERNS = [
  /\b(XXXL|XXL|XL|XS|S|M|L)\b/i,
  /\b(\d+(?:\.\d+)?)\s*(?:cm|mm|inch|in|ft|"|')\b/i,
  /\b(?:size|sz)[\s:]*(\S+)/i,
  /\b(\d+(?:\.\d+)?)\b/,
];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeSize(value: string): string {
  const trimmed = value.trim();
  const upper = trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();

  if (['one size', 'onesize', 'free size', 'freesize'].includes(lower)) {
    return 'One Size';
  }
  if (['xxs', 'xx-small', 'xx small'].includes(lower)) return 'XXS';
  if (['xs', 'x-small', 'x small'].includes(lower)) return 'XS';
  if (['s', 'small', 'sm'].includes(lower)) return 'S';
  if (['m', 'medium', 'med', 'md'].includes(lower)) return 'M';
  if (['l', 'large', 'lg'].includes(lower)) return 'L';
  if (['xl', 'x-large', 'x large'].includes(lower)) return 'XL';
  if (['xxl', '2xl', 'xx-large', 'xx large'].includes(lower)) return 'XXL';
  if (['xxxl', '3xl', 'xxx-large', 'xxx large'].includes(lower)) return 'XXXL';
  if (['4xl', 'xxxxl', 'xxxx-large', 'xxxx large'].includes(lower)) return '4XL';

  return upper === trimmed ? trimmed : upper;
}

export function parseVariantColorSize(
  variantName: string,
  productName?: string
): { color: string | null; size: string | null } {
  const variantLabel = (variantName || '').trim();
  const productLabel = (productName || '').trim();
  let label = variantLabel;

  if (productLabel) {
    const prefixRegex = new RegExp(`^\\s*${escapeRegex(productLabel)}\\s*[-–/|:]?\\s*`, 'i');
    label = label.replace(prefixRegex, '').trim() || variantLabel;
  }

  label = label.replace(/^[\s\-–/|:]+/, '').trim() || variantLabel;
  const segments = label
    .split(/[-–/|]+/g)
    .map((segment) => segment.trim())
    .filter(Boolean);

  let color: string | null = null;
  let size: string | null = null;

  const detectColor = (text: string) => {
    for (const knownColor of KNOWN_COLORS) {
      if (text.toLowerCase().includes(knownColor.toLowerCase())) {
        return knownColor;
      }
    }
    return null;
  };

  const detectSize = (text: string) => {
    for (const pattern of SIZE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        return normalizeSize(match[1] || match[0]);
      }
    }
    return null;
  };

  const segmentsToCheck = segments.length > 0 ? segments : [label];
  for (const segment of segmentsToCheck) {
    if (!color) {
      const detected = detectColor(segment);
      if (detected) color = detected;
    }
    if (!size) {
      const detected = detectSize(segment);
      if (detected) size = detected;
    }
    if (color && size) break;
  }

  if (!color) {
    color = detectColor(label);
  }
  if (!size) {
    size = detectSize(label);
  }

  return { color, size };
}
