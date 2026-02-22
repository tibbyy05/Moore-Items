'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';

const STORAGE_KEY = 'mi_recently_viewed_v1';

interface RecentlyViewedProps {
  title?: string;
  excludeId?: string;
}

export function RecentlyViewed({ title = 'Recently Viewed', excludeId }: RecentlyViewedProps) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Product[];
        const filtered = parsed.filter((item) => item && item.id !== excludeId);
        setItems(filtered.slice(0, 10));
      }
    } catch {
      setItems([]);
    }
  }, [excludeId]);

  if (items.length < 2) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-6">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory md:grid md:grid-cols-4 md:gap-6 md:overflow-visible">
        {items.map((product) => (
          <div key={product.id} className="min-w-[220px] snap-start md:min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
