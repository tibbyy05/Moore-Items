import React from 'react';
import { cn } from '@/lib/utils';

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  className,
}: PriceDisplayProps) {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const priceClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const comparePriceClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('font-bold text-warm-900', priceClasses[size])}>
        ${price.toFixed(2)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              'font-medium text-warm-300 line-through',
              comparePriceClasses[size]
            )}
          >
            ${compareAtPrice.toFixed(2)}
          </span>
          <span className="px-2 py-0.5 text-xs font-bold text-white bg-danger rounded-lg">
            -{discountPercent}%
          </span>
        </>
      )}
    </div>
  );
}
