'use client';

import React from 'react';
import { ProductVariant } from '@/lib/types';
import { cn } from '@/lib/utils';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId?: string;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  const colors = Array.from(new Set(variants.filter((v) => v.color).map((v) => v.color)));
  const sizes = Array.from(new Set(variants.filter((v) => v.size).map((v) => v.size)));

  const sortSizes = (values: string[]) => {
    const clothingOrder = [
      'XXS',
      'XS',
      'S',
      'M',
      'L',
      'XL',
      '2XL',
      'XXL',
      '3XL',
      'XXXL',
      '4XL',
      'XXXXL',
    ];

    const allNumeric = values.every((size) => !Number.isNaN(parseFloat(size)));
    if (allNumeric) {
      return [...values].sort((a, b) => parseFloat(a) - parseFloat(b));
    }

    const upperSizes = values.map((size) => size.toUpperCase());
    const allClothing = upperSizes.every((size) => clothingOrder.includes(size));
    if (allClothing) {
      return [...values].sort(
        (a, b) => clothingOrder.indexOf(a.toUpperCase()) - clothingOrder.indexOf(b.toUpperCase())
      );
    }

    return [...values].sort((a, b) => a.localeCompare(b));
  };
  if (variants.length === 0) return null;

  const [selectedColor, setSelectedColor] = React.useState(
    variants.find((variant) => variant.id === selectedVariantId)?.color ||
      variants[0]?.color ||
      null
  );
  const [selectedSize, setSelectedSize] = React.useState(
    variants.find((variant) => variant.id === selectedVariantId)?.size ||
      variants[0]?.size ||
      null
  );

  React.useEffect(() => {
    const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
    if (selectedVariant?.color) setSelectedColor(selectedVariant.color);
    if (selectedVariant?.size) setSelectedSize(selectedVariant.size);
  }, [selectedVariantId, variants]);

  React.useEffect(() => {
    const matchingVariant = variants.find(
      (v) =>
        (!selectedColor || v.color === selectedColor) &&
        (!selectedSize || v.size === selectedSize)
    );

    if (matchingVariant) {
      onSelect(matchingVariant);
    }
  }, [selectedColor, selectedSize, variants, onSelect]);

  return (
    <div className="space-y-6">
      {colors.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-warm-900 mb-3">
            Color: <span className="font-normal text-warm-600">{selectedColor}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {colors.map((color) => {
              const variant = variants.find((v) => v.color === color);
              if (!variant) return null;

              const isSelected = selectedColor === color;
              const isInStock = variant.inStock;

              return (
                <button
                  key={color}
                  onClick={() => isInStock && setSelectedColor(color!)}
                  disabled={!isInStock}
                  className={cn(
                    'relative w-10 h-10 rounded-full border-2 transition-all duration-200',
                    isSelected && 'border-gold-500 ring-2 ring-gold-500/30',
                    !isSelected && 'border-warm-200 hover:border-gold-500',
                    !isInStock && 'opacity-40 cursor-not-allowed'
                  )}
                  aria-label={color}
                  title={color}
                >
                  <span
                    className="absolute inset-1 rounded-full"
                    style={{
                      backgroundColor: color?.toLowerCase() === 'black' ? '#000' :
                        color?.toLowerCase() === 'white' ? '#fff' :
                        color?.toLowerCase() === 'blue' ? '#3b82f6' :
                        color?.toLowerCase() === 'red' ? '#ef4444' :
                        color?.toLowerCase() === 'green' ? '#10b981' :
                        color?.toLowerCase() === 'pink' ? '#ec4899' :
                        color?.toLowerCase() === 'brown' ? '#92400e' :
                        color?.toLowerCase() === 'tan' ? '#d2b48c' :
                        color?.toLowerCase() === 'gray' ? '#6b7280' :
                        color?.toLowerCase() === 'navy' ? '#1e3a8a' :
                        color?.toLowerCase() === 'gold' ? '#c8a45e' :
                        color?.toLowerCase() === 'silver' ? '#9ca3af' :
                        color?.toLowerCase().includes('rose') ? '#f43f5e' :
                        color?.toLowerCase().includes('emerald') ? '#059669' :
                        '#94a3b8',
                    }}
                  />
                  {!isInStock && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-full h-0.5 bg-warm-500 rotate-45" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sizes.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-warm-900 mb-3">
            Size: <span className="font-normal text-warm-600">{selectedSize}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {sortSizes(sizes).map((size) => {
              const variant = variants.find((v) => v.size === size);
              if (!variant) return null;

              const isSelected = selectedSize === size;
              const isInStock = variant.inStock;

              return (
                <button
                  key={size}
                  onClick={() => isInStock && setSelectedSize(size!)}
                  disabled={!isInStock}
                  className={cn(
                    'min-w-[60px] px-4 py-2.5 rounded-full border-2 font-semibold text-sm transition-all duration-200',
                    isSelected && 'bg-gold-500 border-gold-500 text-white',
                    !isSelected && 'bg-white border-warm-200 text-warm-900 hover:border-gold-500',
                    !isInStock && 'opacity-40 cursor-not-allowed line-through'
                  )}
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
