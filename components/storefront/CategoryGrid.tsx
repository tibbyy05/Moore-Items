'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Category } from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORY_IMAGES: Record<string, string> = {
  'womens-fashion':
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1200&auto=format&fit=crop',
  'pet-supplies':
    'https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=1200&auto=format&fit=crop',
  'home-garden':
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop',
  'health-beauty':
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop',
  jewelry:
    'https://images.unsplash.com/photo-1518544801976-3e159e50e5bb?q=80&w=1200&auto=format&fit=crop',
  electronics:
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop',
  'kids-toys':
    'https://images.unsplash.com/photo-1516627145497-ae6968895b74?q=80&w=1200&auto=format&fit=crop',
  kitchen:
    'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?q=80&w=1200&auto=format&fit=crop',
};

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        const mapped = (data.categories || []).map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          iconName: category.icon_name || 'Sparkles',
          productCount: category.product_count || 0,
          gradient: category.icon_gradient || 'from-warm-100 to-warm-50',
          iconColor: category.icon_color || 'text-warm-600',
        }));
        setCategories(mapped);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-20">
      <div ref={sectionRef} className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
              Shop by category
            </p>
            <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
              Curated collections
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={cn(
                'group relative rounded-2xl overflow-hidden h-40 sm:h-48 opacity-0 scale-95 transition-transform duration-300',
                isVisible && 'animate-fadeUp scale-100'
              )}
              style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
            >
              <Image
                src={CATEGORY_IMAGES[category.slug] || '/placeholder.svg'}
                alt={category.name}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                unoptimized
              />
              {/* TODO: Replace with custom lifestyle images */}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-4 px-4">
                <p className="text-white font-semibold">{category.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
