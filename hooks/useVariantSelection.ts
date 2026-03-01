/**
 * hooks/useVariantSelection.ts
 * 
 * Custom hook that manages variant selection state with availability checking.
 * Drop this into ProductPageClient to replace the existing variant state logic.
 * 
 * Handles:
 * - Building the availability matrix
 * - Tracking selected color + size
 * - Auto-adjusting selections to maintain valid combos
 * - Finding the matched variant for add-to-cart
 * - Image selection with color-based fallback
 * - Preventing add-to-cart for invalid combos
 */

'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import {
  buildAvailabilityMatrix,
  isComboValid,
  getVariantIdForCombo,
  getBestImage,
  getBestSizeForColor,
  getBestColorForSize,
  type AvailabilityMatrix,
} from '@/lib/utils/variant-availability';

interface Variant {
  id: string;
  name: string;
  color?: string | null;
  size?: string | null;
  image_url?: string | null;
  retail_price?: number;
  stock_count?: number;
  is_active?: boolean;
  sku?: string;
  [key: string]: any; // Allow other fields
}

interface UseVariantSelectionReturn {
  /** The availability matrix for VariantSelector */
  matrix: AvailabilityMatrix;
  /** Currently selected color */
  selectedColor: string | null;
  /** Currently selected size */
  selectedSize: string | null;
  /** The matched variant object (null if no valid combo selected) */
  selectedVariant: Variant | null;
  /** Whether the current selection is a valid, orderable combo */
  isValidCombo: boolean;
  /** Whether the add-to-cart button should be enabled */
  canAddToCart: boolean;
  /** Best image URL for current selection (with color fallback) */
  variantImageUrl: string | null;
  /** Handle color change from VariantSelector */
  handleColorChange: (color: string | null, autoSize?: string | null) => void;
  /** Handle size change from VariantSelector */
  handleSizeChange: (size: string | null, autoColor?: string | null) => void;
  /** Whether variant selection has been initialized (prevents image hijacking on load) */
  hasInitialized: boolean;
}

export function useVariantSelection(variants: Variant[]): UseVariantSelectionReturn {
  const hasInitialized = useRef(false);

  // Build the availability matrix (memoized)
  const matrix = useMemo(
    () => buildAvailabilityMatrix(variants),
    [variants]
  );

  // Build variant lookup by ID
  const variantById = useMemo(() => {
    const map = new Map<string, Variant>();
    for (const v of variants) {
      map.set(v.id, v);
    }
    return map;
  }, [variants]);

  // Initialize with first valid combo
  const initialState = useMemo(() => {
    const firstVariant = variants.find(v => v.is_active !== false);
    return {
      color: firstVariant?.color || null,
      size: firstVariant?.size || null,
    };
  }, [variants]);

  const [selectedColor, setSelectedColor] = useState<string | null>(initialState.color);
  const [selectedSize, setSelectedSize] = useState<string | null>(initialState.size);

  // Find the matched variant
  const selectedVariant = useMemo(() => {
    const variantId = getVariantIdForCombo(matrix, selectedColor, selectedSize);
    if (!variantId) return null;
    return variantById.get(variantId) || null;
  }, [matrix, selectedColor, selectedSize, variantById]);

  // Validity checks
  const isValidCombo = useMemo(
    () => isComboValid(matrix, selectedColor, selectedSize),
    [matrix, selectedColor, selectedSize]
  );

  const canAddToCart = isValidCombo && selectedVariant !== null;

  // Best image for current selection
  const variantImageUrl = useMemo(
    () => getBestImage(matrix, selectedColor, selectedSize),
    [matrix, selectedColor, selectedSize]
  );

  // Handle color change — auto-adjusts size to maintain valid combo
  const handleColorChange = useCallback(
    (color: string | null, autoSize?: string | null) => {
      hasInitialized.current = true;
      setSelectedColor(color);

      if (autoSize !== undefined) {
        setSelectedSize(autoSize);
      } else if (color && matrix.hasSizes) {
        // Auto-adjust size if current combo would be invalid
        const bestSize = getBestSizeForColor(matrix, color, selectedSize);
        if (bestSize !== selectedSize) {
          setSelectedSize(bestSize);
        }
      }
    },
    [matrix, selectedSize]
  );

  // Handle size change — auto-adjusts color to maintain valid combo
  const handleSizeChange = useCallback(
    (size: string | null, autoColor?: string | null) => {
      hasInitialized.current = true;
      setSelectedSize(size);

      if (autoColor !== undefined) {
        setSelectedColor(autoColor);
      } else if (size && matrix.hasColors) {
        // Auto-adjust color if current combo would be invalid
        const bestColor = getBestColorForSize(matrix, size, selectedColor);
        if (bestColor !== selectedColor) {
          setSelectedColor(bestColor);
        }
      }
    },
    [matrix, selectedColor]
  );

  return {
    matrix,
    selectedColor,
    selectedSize,
    selectedVariant,
    isValidCombo,
    canAddToCart,
    variantImageUrl,
    handleColorChange,
    handleSizeChange,
    hasInitialized: hasInitialized.current,
  };
}