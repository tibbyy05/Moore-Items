'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '@/lib/types';
import { ProductCard } from '@/components/storefront/ProductCard';

interface TrendingCarouselProps {
  products: Product[];
}

export function TrendingCarousel({ products }: TrendingCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory"
      >
        {products.map((product) => (
          <div key={product.id} className="min-w-[220px] sm:min-w-[260px] snap-start">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="hidden md:flex items-center gap-2 absolute -top-12 right-0">
        <button
          onClick={() => scrollByAmount(-300)}
          className="w-9 h-9 rounded-full border border-warm-200 bg-white hover:border-gold-500 hover:text-gold-600 transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 mx-auto" />
        </button>
        <button
          onClick={() => scrollByAmount(300)}
          className="w-9 h-9 rounded-full border border-warm-200 bg-white hover:border-gold-500 hover:text-gold-600 transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 mx-auto" />
        </button>
      </div>
    </div>
  );
}
