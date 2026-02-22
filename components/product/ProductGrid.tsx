'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';
import { SkeletonCard } from '@/components/storefront/SkeletonCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4;
  loading?: boolean;
  className?: string;
}

export function ProductGrid({
  products,
  columns = 4,
  loading = false,
  className,
}: ProductGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  const gridClasses = {
    2: 'grid-cols-2 md:grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-2 lg:grid-cols-4',
  };

  if (loading) {
    return (
      <div className={cn('grid gap-4 sm:gap-6', gridClasses[columns], className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:gap-6', gridClasses[columns], className)}>
      {products.map((product, index) => (
        <div
          key={product.id}
          className={cn(
            'opacity-0',
            mounted && 'animate-fadeUp'
          )}
          style={{
            animationDelay: `${index * 70}ms`,
            animationFillMode: 'forwards',
          }}
        >
          <ProductCard product={product} priority={index < 4} />
        </div>
      ))}
    </div>
  );
}
