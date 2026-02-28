'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, Truck, AlertTriangle } from 'lucide-react';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QuickViewModal } from './QuickViewModal';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { StarRating } from '@/components/ui/star-rating';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [wishlistPulse, setWishlistPulse] = useState(false);
  const { toggleWishlist, isWishlisted } = useWishlist();

  const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  };

  const displayStock = (() => {
    if (product.isDigital) return null;
    if (product.stockCount <= 20) return product.stockCount;
    const roll = hashString(`${product.id}:stock`) % 100;
    if (roll < 15) {
      return 3 + (hashString(`${product.id}:stockcount`) % 13);
    }
    return null;
  })();

  const secondaryImage = product.images?.[1];
  const discountPercent =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <>
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          'group block bg-white border border-warm-100 rounded-2xl overflow-hidden transition-all duration-300',
          'hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none',
          className
        )}
      >
        <div className="relative aspect-square bg-warm-50 overflow-hidden">
          <Image
            src={product.images?.[0] || '/placeholder.svg'}
            alt={`${product.name} - Image 1 of ${product.images?.length || 1}`}
            width={600}
            height={600}
            className={cn(
              'object-cover w-full h-full transition-all duration-500',
              secondaryImage ? 'group-hover:opacity-0' : 'group-hover:scale-[1.05]'
            )}
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            unoptimized
          />
          {secondaryImage && (
            <Image
              src={secondaryImage}
              alt={`${product.name} - Image 2 of ${product.images?.length || 1}`}
              width={600}
              height={600}
              className="object-cover w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading="lazy"
              unoptimized
            />
          )}

          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              toggleWishlist(product.id, product.name);
              setWishlistPulse(true);
              window.setTimeout(() => setWishlistPulse(false), 400);
            }}
            className={cn(
              'absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center',
              'shadow-md transition-transform duration-200 hover:scale-105',
              isWishlisted(product.id) && 'bg-gold-500 text-navy-900',
              wishlistPulse && 'animate-scale-bounce'
            )}
            aria-label={isWishlisted(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={cn(
                'w-4 h-4 transition-all',
                isWishlisted(product.id) ? 'fill-navy-900' : 'text-warm-600'
              )}
            />
          </button>

          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setQuickViewOpen(true);
            }}
            className={cn(
              'absolute inset-x-4 bottom-4 py-2 rounded-xl text-sm font-semibold',
              'bg-navy-900/90 text-gold-400 backdrop-blur-sm border border-navy-700/60',
              'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0',
              'transition-all duration-300 flex items-center justify-center gap-2'
            )}
            aria-label="Quick view"
          >
            <Eye className="w-4 h-4" />
            Quick View
          </button>
        </div>

        <div className="p-4">
          <p className="text-[11px] font-semibold text-gold-600 uppercase tracking-widest mb-1.5">
            {product.categoryLabel}
          </p>
          <h3 className="text-[15px] font-semibold text-warm-900 mb-2 line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <StarRating
            rating={product.rating ?? 0}
            reviewCount={product.reviewCount ?? 0}
            size="sm"
            className="mb-3"
          />

          <div className="flex items-center gap-2">
            {product.compareAtPrice && (
              <span className="text-sm text-warm-400 line-through">
                ${(product.compareAtPrice ?? 0).toFixed(2)}
              </span>
            )}
            <span className="text-lg font-bold text-warm-900">
              ${(product.price ?? 0).toFixed(2)}
            </span>
          </div>
          {discountPercent > 0 && (
            <p className="text-xs text-danger mt-1">Save {discountPercent}%</p>
          )}
          {displayStock ? (
            <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
              <AlertTriangle className="w-3 h-3" />
              Only {displayStock} left
            </p>
          ) : null}
          {product.warehouse === 'US' && (
            <p className="text-[11px] text-green-600 flex items-center gap-1 mt-1">
              <Truck className="w-3 h-3" />
              Ships in 2-5 days
            </p>
          )}
        </div>
      </Link>

      {quickViewOpen && (
        <QuickViewModal
          product={product}
          open={quickViewOpen}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </>
  );
}
