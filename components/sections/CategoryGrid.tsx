'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CategoryIcon } from '@/components/ui/category-icon';
import { cn } from '@/lib/utils';
import { Category } from '@/lib/types';

export function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);

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
  return (
    <section className="bg-warm-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs font-bold text-gold-600 uppercase tracking-widest mb-3">
            SHOP BY CATEGORY
          </p>
          <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
            Find Exactly What You Need
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className={cn(
                'group bg-white border border-warm-200 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold-500 hover:shadow-lg'
              )}
              style={{
                animationDelay: `${index * 70}ms`,
              }}
            >
              <div
                className={cn(
                  'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-4',
                  category.gradient
                )}
              >
                <CategoryIcon
                  iconName={category.iconName}
                  className={category.iconColor}
                  size="lg"
                  strokeWidth={1.75}
                />
              </div>
              <h3 className="text-base font-semibold text-warm-900 mb-1.5 group-hover:text-gold-600 transition-colors">
                {category.name}
              </h3>
              <p className="text-sm text-warm-500 mb-4">
                {category.productCount.toLocaleString()} products
              </p>
              <ChevronRight className="w-5 h-5 text-warm-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
