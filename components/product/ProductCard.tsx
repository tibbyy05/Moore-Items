'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import { StarRating } from '@/components/ui/star-rating';
import { PriceDisplay } from './PriceDisplay';
import { useCart } from '@/components/providers/CartProvider';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: product.variants[0]?.id ?? null,
      name: product.name,
      variantName: product.variants[0]?.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      warehouse: product.warehouse,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <Link
      href={`/product/${product.slug}`}
      className={cn(
        'group block bg-white border border-warm-200 rounded-2xl overflow-hidden transition-all duration-300',
        'hover:-translate-y-1.5 hover:shadow-lg',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square bg-warm-50 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />

        <button
          onClick={handleWishlistToggle}
          className={cn(
            'absolute bottom-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-md transition-all duration-200',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
            isWishlisted && 'bg-danger'
          )}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              isWishlisted ? 'fill-white text-white' : 'text-warm-700'
            )}
          />
        </button>

        <button
          onClick={handleAddToCart}
          className={cn(
            'absolute bottom-0 left-0 right-0 bg-navy-900 text-white py-3 px-4 flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-300',
            isHovered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-0'
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </button>
      </div>

      <div className="p-4">
        <p className="text-[11px] font-bold text-gold-600 uppercase tracking-wider mb-1.5">
          {product.categoryLabel}
        </p>
        <h3 className="text-[15px] font-semibold text-warm-900 mb-2 line-clamp-2 leading-snug">
          {product.name}
        </h3>
        <StarRating
          rating={product.rating}
          size="sm"
          reviewCount={product.reviewCount}
          className="mb-3"
        />
        <PriceDisplay
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
        />
      </div>
    </Link>
  );
}
