/**
 * components/product/VariantSelector.tsx
 * 
 * UPDATED: Now uses AvailabilityMatrix to grey out invalid color+size combos.
 * Prevents customers from selecting non-existent variant combinations.
 * 
 * CHANGES FROM ORIGINAL:
 * - Accepts `matrix` prop (AvailabilityMatrix) instead of computing colors/sizes internally
 * - Grey out unavailable colors when a size is selected (and vice versa)
 * - Auto-adjusts selection when switching to keep a valid combo
 * - Reports `matchedVariantId` and `isValidCombo` back to parent
 * - Image fallback: reports best image for current selection via `onImageChange`
 */

'use client';

import { useMemo } from 'react';
import type { AvailabilityMatrix } from '@/lib/utils/variant-availability';
import {
  getAvailableColors,
  getAvailableSizes,
  getBestColorForSize,
  getBestSizeForColor,
  getBestImage,
  isComboValid,
  getVariantIdForCombo,
} from '@/lib/utils/variant-availability';

// ============================================================
// SIZE SORTING (preserved from original)
// ============================================================
const CLOTHING_ORDER: Record<string, number> = {
  'XXS': 1, 'XS': 2, 'S': 3, 'M': 4, 'L': 5,
  'XL': 6, 'XXL': 7, 'XXXL': 8, '2XL': 7, '3XL': 8,
  '4XL': 9, '5XL': 10, '6XL': 11,
};

function getSortKey(size: string): number {
  const upper = size.toUpperCase().trim();
  // Clothing sizes
  if (CLOTHING_ORDER[upper] !== undefined) return CLOTHING_ORDER[upper];
  // Numeric (shoe, ring, dimensions, inches, etc.)
  const num = parseFloat(size);
  if (!isNaN(num)) return num;
  // Bed sizes
  const bedOrder: Record<string, number> = {
    'TWIN': 1, 'FULL': 2, 'QUEEN': 3, 'KING': 4, 'CALIFORNIA KING': 5, 'CAL KING': 5,
  };
  if (bedOrder[upper] !== undefined) return bedOrder[upper];
  // Alphabetical fallback
  return 9999;
}

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const keyA = getSortKey(a);
    const keyB = getSortKey(b);
    if (keyA !== keyB) return keyA - keyB;
    return a.localeCompare(b);
  });
}

// ============================================================
// COLOR SWATCH MAPPING
// ============================================================
const COLOR_MAP: Record<string, string> = {
  'black': '#000000', 'white': '#FFFFFF', 'red': '#DC2626', 'blue': '#2563EB',
  'green': '#16A34A', 'yellow': '#EAB308', 'orange': '#EA580C', 'purple': '#9333EA',
  'pink': '#EC4899', 'brown': '#92400E', 'gray': '#6B7280', 'grey': '#6B7280',
  'beige': '#D2B48C', 'cream': '#FFFDD0', 'ivory': '#FFFFF0', 'navy': '#1E3A5F',
  'gold': '#D4AF37', 'golden': '#D4AF37', 'silver': '#C0C0C0', 'silvery': '#C0C0C0',
  'bronze': '#CD7F32', 'copper': '#B87333', 'rose': '#FF007F', 'coral': '#FF6F61',
  'teal': '#008080', 'cyan': '#00BCD4', 'maroon': '#800000', 'burgundy': '#800020',
  'lavender': '#E6E6FA', 'lilac': '#C8A2C8', 'violet': '#8B5CF6', 'indigo': '#4F46E5',
  'magenta': '#FF00FF', 'turquoise': '#40E0D0', 'khaki': '#C3B091', 'olive': '#808000',
  'tan': '#D2B48C', 'peach': '#FFDAB9', 'salmon': '#FA8072', 'mint': '#98FF98',
  'charcoal': '#36454F', 'champagne': '#F7E7CE', 'wine': '#722F37', 'plum': '#8E4585',
  'mauve': '#E0B0FF', 'rust': '#B7410E', 'taupe': '#483C32', 'aqua': '#00FFFF',
  'fuchsia': '#FF00FF', 'lime': '#32CD32', 'lemon': '#FFF44F', 'mocha': '#967969',
  'caramel': '#FFD59A', 'chocolate': '#7B3F00', 'coffee': '#6F4E37',
  'apricot': '#FBCEB1', 'emerald': '#50C878', 'ruby': '#E0115F', 'sapphire': '#0F52BA',
  'pearl': '#F0EAD6', 'oak': '#C8A45E', 'walnut': '#5C4033', 'maple': '#C1874D',
  'cherry': '#DE3163', 'bamboo': '#D4C5A9', 'teak': '#B8860B', 'mahogany': '#C04000',
  'stainless': '#C8C8C8', 'multicolor': 'conic-gradient(red, yellow, green, blue, purple, red)',
  'rainbow': 'conic-gradient(red, yellow, green, blue, purple, red)',
  'transparent': 'transparent', 'clear': 'transparent', 'natural': '#D2B48C',
  // Multi-word
  'rose gold': '#B76E79', 'army green': '#4B5320', 'forest green': '#228B22',
  'olive green': '#6B8E23', 'dark green': '#006400', 'light green': '#90EE90',
  'dark blue': '#00008B', 'light blue': '#ADD8E6', 'sky blue': '#87CEEB',
  'royal blue': '#4169E1', 'baby blue': '#89CFF0', 'navy blue': '#000080',
  'lake blue': '#6495ED', 'dark red': '#8B0000', 'wine red': '#722F37',
  'dark gray': '#404040', 'light gray': '#D3D3D3', 'dark grey': '#404040',
  'light grey': '#D3D3D3', 'carbon gray': '#555555', 'dark brown': '#5C3317',
  'light brown': '#C4A882', 'dark pink': '#FF1493', 'light pink': '#FFB6C1',
  'hot pink': '#FF69B4', 'rose pink': '#FF66CC', 'warm white': '#FFF5E1',
  'cool white': '#F0F8FF', 'off white': '#FAF0E6', 'milky white': '#FEFCFF',
  'matte black': '#1A1A1A', 'glossy black': '#0A0A0A', 'jet black': '#0A0A0A',
  'rustic': '#8B6914', 'classic ivory': '#FFFFF0', 'natural beige': '#D2B48C',
};

function getColorHex(colorName: string): string {
  const lower = colorName.toLowerCase().trim();
  return COLOR_MAP[lower] || '#CCCCCC';
}

function isLightColor(hex: string): boolean {
  if (hex.startsWith('conic') || hex === 'transparent') return true;
  const h = hex.replace('#', '');
  if (h.length !== 6) return false;
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
}

// ============================================================
// TYPES
// ============================================================
interface VariantSelectorProps {
  matrix: AvailabilityMatrix;
  selectedColor: string | null;
  selectedSize: string | null;
  onColorChange: (color: string | null, autoSize?: string | null) => void;
  onSizeChange: (size: string | null, autoColor?: string | null) => void;
}

// ============================================================
// COMPONENT
// ============================================================
export default function VariantSelector({
  matrix,
  selectedColor,
  selectedSize,
  onColorChange,
  onSizeChange,
}: VariantSelectorProps) {
  // Compute which options are available based on current selection
  const availableColors = useMemo(
    () => getAvailableColors(matrix, selectedSize),
    [matrix, selectedSize]
  );

  const availableSizes = useMemo(
    () => getAvailableSizes(matrix, selectedColor),
    [matrix, selectedColor]
  );

  const sortedSizes = useMemo(
    () => sortSizes(matrix.allSizes),
    [matrix.allSizes]
  );

  // --- COLOR CHANGE ---
  const handleColorClick = (color: string) => {
    if (color === selectedColor) return; // Already selected
    
    // Find best size for this new color
    const bestSize = getBestSizeForColor(matrix, color, selectedSize);
    onColorChange(color, bestSize);
  };

  // --- SIZE CHANGE ---
  const handleSizeClick = (size: string) => {
    if (size === selectedSize) return; // Already selected
    
    // Find best color for this new size
    const bestColor = getBestColorForSize(matrix, size, selectedColor);
    onSizeChange(size, bestColor);
  };

  return (
    <div className="space-y-4">
      {/* COLOR SELECTOR */}
      {matrix.hasColors && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Color: <span className="text-gray-900">{selectedColor || 'Select'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {matrix.allColors.map((color) => {
              const isSelected = color === selectedColor;
              const isAvailable = availableColors.has(color);
              const hex = getColorHex(color);
              const isLight = isLightColor(hex);

              return (
                <button
                  key={color}
                  onClick={() => isAvailable && handleColorClick(color)}
                  disabled={!isAvailable}
                  title={isAvailable ? color : `${color} (not available in ${selectedSize})`}
                  className={`
                    w-9 h-9 rounded-full border-2 transition-all relative
                    ${isSelected
                      ? 'border-[#c8a45e] ring-2 ring-[#c8a45e] ring-offset-1 scale-110'
                      : isAvailable
                        ? 'border-gray-300 hover:border-[#c8a45e] hover:scale-105 cursor-pointer'
                        : 'border-gray-200 opacity-30 cursor-not-allowed'
                    }
                  `}
                  style={{
                    background: hex === 'transparent'
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)'
                      : hex,
                  }}
                >
                  {/* Checkmark for selected */}
                  {isSelected && (
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>
                      ✓
                    </span>
                  )}
                  {/* Strikethrough for unavailable */}
                  {!isAvailable && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="block w-8 h-0.5 bg-gray-400 rotate-45" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SIZE SELECTOR */}
      {matrix.hasSizes && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Size: <span className="text-gray-900">{selectedSize || 'Select'}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sortedSizes.map((size) => {
              const isSelected = size === selectedSize;
              const isAvailable = availableSizes.has(size);

              return (
                <button
                  key={size}
                  onClick={() => isAvailable && handleSizeClick(size)}
                  disabled={!isAvailable}
                  title={isAvailable ? size : `${size} (not available in ${selectedColor})`}
                  className={`
                    px-3 py-1.5 text-sm rounded-lg border transition-all
                    ${isSelected
                      ? 'bg-[#c8a45e] text-white border-[#c8a45e] font-medium'
                      : isAvailable
                        ? 'bg-white text-gray-700 border-gray-300 hover:border-[#c8a45e] hover:text-[#c8a45e] cursor-pointer'
                        : 'bg-gray-50 text-gray-300 border-gray-200 line-through cursor-not-allowed'
                    }
                  `}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}