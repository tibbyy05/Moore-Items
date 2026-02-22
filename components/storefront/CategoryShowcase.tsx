'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/custom-button';
import { useCategories } from '@/components/providers/CategoriesProvider';

export function CategoryShowcase() {
  const { categories } = useCategories();

  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
              Shop by Category
            </p>
            <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
              Find your next favorite
            </h2>
          </div>
          <CustomButton variant="secondary" asChild className="hidden sm:inline-flex">
            <Link href="/shop">View All</Link>
          </CustomButton>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="rounded-2xl bg-white border border-warm-200 shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="relative h-48 sm:h-52 bg-gradient-to-br from-warm-100 to-warm-50 overflow-hidden">
                <Image
                  src={`/images/categories/${category.slug}.jpg`}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <p className="font-semibold text-warm-900">{category.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
