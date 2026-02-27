'use client';

import React, { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';

const STORAGE_KEY = 'mi_recently_viewed_v2';

interface StoredEntry {
  id: string;
  ts: number;
}

interface RecentlyViewedProps {
  title?: string;
  excludeId?: string;
}

export function addRecentlyViewed(productId: string) {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const current: StoredEntry[] = stored ? JSON.parse(stored) : [];
    const filtered = current.filter((e) => e.id !== productId);
    const next = [{ id: productId, ts: Date.now() }, ...filtered].slice(0, 10);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors
  }
}

export function RecentlyViewed({ title = 'Recently Viewed', excludeId }: RecentlyViewedProps) {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    let entries: StoredEntry[];
    try {
      entries = JSON.parse(stored) as StoredEntry[];
    } catch {
      return;
    }

    const ids = entries
      .filter((e) => e.id !== excludeId)
      .slice(0, 10)
      .map((e) => e.id);

    if (ids.length < 2) return;

    fetch(`/api/products?ids=${ids.join(',')}&limit=${ids.length}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data.products) return;
        // Preserve the localStorage ordering (most recent first)
        const productMap = new Map<string, Product>();
        for (const p of data.products) productMap.set(p.id, p);
        const ordered = ids
          .map((id) => productMap.get(id))
          .filter((p): p is Product => p !== undefined);
        setItems(ordered);
      })
      .catch(() => {});
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
