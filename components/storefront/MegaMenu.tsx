'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCategories } from '@/components/providers/CategoriesProvider';
import { cn } from '@/lib/utils';

interface MegaMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MegaMenu({ open, onClose }: MegaMenuProps) {
  const { categories } = useCategories();
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<
    Record<string, Array<{ id: string; slug: string; name: string; image?: string; price?: number }>>
  >({});
  const [loadingProducts, setLoadingProducts] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (categories.length > 0 && !activeSlug) {
      setActiveSlug(categories[0].slug);
    }
  }, [categories, activeSlug]);

  useEffect(() => {
    if (!activeSlug || categoryProducts[activeSlug]) return;
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const response = await fetch(`/api/products?category=${activeSlug}&limit=3`);
      const data = await response.json();
      if (response.ok) {
        const mapped = (data.products || []).map((product: any) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0],
          price: product.retail_price,
        }));
        setCategoryProducts((prev) => ({ ...prev, [activeSlug]: mapped }));
      }
      setLoadingProducts(false);
    };
    fetchProducts();
  }, [activeSlug, categoryProducts]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      onClose();
      closeTimerRef.current = null;
    }, 200);
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 transition-opacity hidden lg:block',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'fixed left-0 right-0 z-50 border-t border-warm-200 bg-white shadow-2xl hidden lg:block',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
        style={{ top: '120px', maxHeight: '500px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="grid grid-cols-[360px_1fr] gap-8">
            <div className="overflow-y-auto pr-2" style={{ maxHeight: '420px' }}>
              <div className="grid grid-cols-2 gap-x-2">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className={cn(
                      'flex items-center py-3 px-4 cursor-pointer border-l-2 transition-colors',
                      activeSlug === category.slug
                        ? 'bg-warm-100 border-gold-500'
                        : 'border-transparent hover:bg-warm-100'
                    )}
                    onMouseEnter={() => setActiveSlug(category.slug)}
                    onClick={onClose}
                  >
                    <span className="font-medium text-warm-900">{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 items-start">
            {(categoryProducts[activeSlug || ''] || []).map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group"
                onClick={onClose}
              >
                <div className="relative h-[200px] rounded-lg overflow-hidden">
                  <Image
                    src={product.image || '/placeholder.svg'}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                    sizes="240px"
                    unoptimized
                  />
                </div>
                <p className="mt-2 text-sm font-medium text-warm-900 line-clamp-1">
                  {product.name}
                </p>
                <p className="text-sm text-warm-600">
                  {product.price !== undefined ? `$${product.price.toFixed(2)}` : ''}
                </p>
              </Link>
            ))}
            {loadingProducts &&
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="h-[200px] rounded-lg bg-warm-50 animate-pulse"
                />
              ))}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            href="/shop"
            className="text-gold-600 font-semibold hover:text-gold-500 transition-colors"
            onClick={onClose}
          >
            View All Products →
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}