/**
 * lib/utils/variant-availability.ts
 * 
 * Builds a variant availability matrix from product variants.
 * Used by VariantSelector to grey out invalid color+size combos
 * and by ProductPageClient to prevent ordering non-existent variants.
 */

export interface VariantCombo {
    color: string | null;
    size: string | null;
    variantId: string;
    imageUrl?: string | null;
  }
  
  export interface AvailabilityMatrix {
    /** All unique colors across all variants */
    allColors: string[];
    /** All unique sizes across all variants */
    allSizes: string[];
    /** Set of valid "color|||size" combo keys */
    validCombos: Set<string>;
    /** Map from color to array of valid sizes */
    sizesByColor: Map<string, string[]>;
    /** Map from size to array of valid colors */
    colorsBySize: Map<string, string[]>;
    /** Map from "color|||size" key to variant ID */
    comboToVariantId: Map<string, string>;
    /** Map from "color|||size" key to image URL */
    comboToImage: Map<string, string>;
    /** Map from color to first available image for that color */
    colorToImage: Map<string, string>;
    /** Whether this product uses color selectors */
    hasColors: boolean;
    /** Whether this product uses size selectors */
    hasSizes: boolean;
  }
  
  function comboKey(color: string | null, size: string | null): string {
    return `${color || ''}|||${size || ''}`;
  }
  
  /**
   * Build an availability matrix from an array of variants.
   * This is the single source of truth for what combos are orderable.
   */
  export function buildAvailabilityMatrix(
    variants: Array<{
      id: string;
      color?: string | null;
      size?: string | null;
      image_url?: string | null;
      is_active?: boolean;
      stock_count?: number;
    }>
  ): AvailabilityMatrix {
    const activeVariants = variants.filter(
      (v) => v.is_active !== false && (v.stock_count === undefined || v.stock_count > 0)
    );
  
    const colorsSet = new Set<string>();
    const sizesSet = new Set<string>();
    const validCombos = new Set<string>();
    const sizesByColor = new Map<string, Set<string>>();
    const colorsBySize = new Map<string, Set<string>>();
    const comboToVariantId = new Map<string, string>();
    const comboToImage = new Map<string, string>();
    const colorToImage = new Map<string, string>();
  
    for (const v of activeVariants) {
      const color = v.color || null;
      const size = v.size || null;
  
      if (color) colorsSet.add(color);
      if (size) sizesSet.add(size);
  
      const key = comboKey(color, size);
      validCombos.add(key);
      comboToVariantId.set(key, v.id);
  
      if (v.image_url) {
        comboToImage.set(key, v.image_url);
        if (color && !colorToImage.has(color)) {
          colorToImage.set(color, v.image_url);
        }
      }
  
      // Build cross-reference maps
      if (color) {
        if (!sizesByColor.has(color)) sizesByColor.set(color, new Set());
        if (size) sizesByColor.get(color)!.add(size);
      }
      if (size) {
        if (!colorsBySize.has(size)) colorsBySize.set(size, new Set());
        if (color) colorsBySize.get(size)!.add(color);
      }
    }
  
    // Convert Sets to sorted arrays
    const allColors = Array.from(colorsSet);
    const allSizes = Array.from(sizesSet);
  
    const sizesByColorMap = new Map<string, string[]>();
    sizesByColor.forEach((sizes, color) => {
      sizesByColorMap.set(color, Array.from(sizes));
    });

    const colorsBySizeMap = new Map<string, string[]>();
    colorsBySize.forEach((colors, size) => {
      colorsBySizeMap.set(size, Array.from(colors));
    });
  
    return {
      allColors,
      allSizes,
      validCombos,
      sizesByColor: sizesByColorMap,
      colorsBySize: colorsBySizeMap,
      comboToVariantId,
      comboToImage,
      colorToImage,
      hasColors: colorsSet.size > 0,
      hasSizes: sizesSet.size > 0,
    };
  }
  
  /**
   * Check if a specific color+size combo is valid (orderable).
   */
  export function isComboValid(
    matrix: AvailabilityMatrix,
    color: string | null,
    size: string | null
  ): boolean {
    return matrix.validCombos.has(comboKey(color, size));
  }
  
  /**
   * Get the variant ID for a specific combo, or null if invalid.
   */
  export function getVariantIdForCombo(
    matrix: AvailabilityMatrix,
    color: string | null,
    size: string | null
  ): string | null {
    return matrix.comboToVariantId.get(comboKey(color, size)) || null;
  }
  
  /**
   * Get the best image for current selection.
   * Priority: exact combo image → same color any size → first variant image
   */
  export function getBestImage(
    matrix: AvailabilityMatrix,
    color: string | null,
    size: string | null
  ): string | null {
    // 1. Exact combo image
    const exactImage = matrix.comboToImage.get(comboKey(color, size));
    if (exactImage) return exactImage;
  
    // 2. Same color, any size (shows the right color regardless of size)
    if (color) {
      const colorImage = matrix.colorToImage.get(color);
      if (colorImage) return colorImage;
    }
  
    // 3. First available image
    const firstImg = matrix.comboToImage.values().next();
    if (!firstImg.done) return firstImg.value;
  
    return null;
  }
  
  /**
   * Get which sizes are available for a given color.
   * Returns all sizes if no color selected.
   */
  export function getAvailableSizes(
    matrix: AvailabilityMatrix,
    selectedColor: string | null
  ): Set<string> {
    if (!selectedColor) return new Set(matrix.allSizes);
    return new Set(matrix.sizesByColor.get(selectedColor) || []);
  }
  
  /**
   * Get which colors are available for a given size.
   * Returns all colors if no size selected.
   */
  export function getAvailableColors(
    matrix: AvailabilityMatrix,
    selectedSize: string | null
  ): Set<string> {
    if (!selectedSize) return new Set(matrix.allColors);
    return new Set(matrix.colorsBySize.get(selectedSize) || []);
  }
  
  /**
   * When user changes color, find the best matching size.
   * If current size is valid with new color, keep it.
   * Otherwise pick the first available size for that color.
   */
  export function getBestSizeForColor(
    matrix: AvailabilityMatrix,
    newColor: string,
    currentSize: string | null
  ): string | null {
    const availableSizes = matrix.sizesByColor.get(newColor);
    if (!availableSizes || availableSizes.length === 0) return null;
    
    // Keep current size if valid
    if (currentSize && availableSizes.includes(currentSize)) return currentSize;
    
    // Otherwise pick first available
    return availableSizes[0];
  }
  
  /**
   * When user changes size, find the best matching color.
   * If current color is valid with new size, keep it.
   * Otherwise pick the first available color for that size.
   */
  export function getBestColorForSize(
    matrix: AvailabilityMatrix,
    newSize: string,
    currentColor: string | null
  ): string | null {
    const availableColors = matrix.colorsBySize.get(newSize);
    if (!availableColors || availableColors.length === 0) return null;
    
    // Keep current color if valid
    if (currentColor && availableColors.includes(currentColor)) return currentColor;
    
    // Otherwise pick first available
    return availableColors[0];
  }