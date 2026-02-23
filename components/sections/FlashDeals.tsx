'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Zap, Flame } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useCart } from '@/components/providers/CartProvider';
import { Product } from '@/lib/types';

export function FlashDeals() {
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 45,
    seconds: 30,
  });

  const { addItem } = useCart();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        }

        return { hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDeals = async () => {
      const response = await fetch('/api/products?sort=sales&limit=12');
      const data = await response.json();
      if (response.ok) {
        const mapped = (data.products || []).map((product: any) => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.retail_price,
          compareAtPrice: product.compare_at_price || null,
          images: product.images || [],
          rating: product.rating || 0,
          reviewCount: product.review_count || 0,
          category: product.mi_categories?.slug || '',
          categoryLabel: product.mi_categories?.name || 'Uncategorized',
          badge: product.badge || null,
          variants:
            product.mi_product_variants?.map((variant: any) => ({
              id: variant.id,
              name: variant.name,
              color: variant.color || undefined,
              size: variant.size || undefined,
              price: variant.retail_price || product.retail_price,
              inStock: variant.stock_count > 0,
            })) || [],
          description: product.description || '',
          shippingDays: product.shipping_days || '7-12 days',
          warehouse: product.warehouse || 'CN',
          inStock: product.stock_count > 0,
          stockCount: product.stock_count || 0,
        }));

        const deals = mapped
          .filter((item: Product) => item.compareAtPrice && item.compareAtPrice > item.price)
          .slice(0, 3);
        setFlashDeals(deals);
      }
    };

    fetchDeals();
  }, []);

  return (
    <section className="bg-warm-50 py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/15 flex items-center justify-center">
              <Zap className="w-6 h-6 text-danger" />
            </div>
            <div>
              <p className="text-xs font-bold text-danger uppercase tracking-widest mb-1">
                FLASH DEALS
              </p>
              <h2 className="text-2xl sm:text-3xl font-playfair font-semibold text-warm-900">
                Limited Time Offers
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 font-variant-tabular">
            {[
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds },
            ].map((unit, i) => (
              <React.Fragment key={unit.label}>
                {i > 0 && (
                  <span className="text-2xl font-bold text-warm-400">:</span>
                )}
                <div className="text-center">
                  <div className="bg-white border border-warm-200 rounded-xl px-3 py-2 min-w-[60px]">
                    <span className="text-2xl font-bold text-warm-900">
                      {String(unit.value).padStart(2, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-warm-500 mt-1">{unit.label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {flashDeals.map((product) => {
            const discountPercent = product.compareAtPrice
              ? Math.round(
                  ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
                )
              : 0;
            const claimedPercent = Math.floor(Math.random() * 40) + 50;

            return (
              <div
                key={product.id}
                className="bg-white border border-warm-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/product/${product.slug}`}
                    className="relative w-full sm:w-24 aspect-square sm:aspect-auto sm:h-24 rounded-xl bg-warm-50 overflow-hidden flex-shrink-0"
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 96px"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-semibold text-warm-900 hover:text-gold-600 transition-colors line-clamp-2 mb-2"
                    >
                      {product.name}
                    </Link>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-2xl font-bold text-warm-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compareAtPrice && (
                        <>
                          <span className="text-sm text-warm-300 line-through">
                            ${product.compareAtPrice.toFixed(2)}
                          </span>
                          <span className="px-2 py-0.5 bg-danger text-white text-xs font-bold rounded-lg">
                            -{discountPercent}%
                          </span>
                        </>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-warm-600">
                          {claimedPercent >= 75 && (
                            <span className="inline-flex items-center gap-1">
                              <Flame className="w-3 h-3 text-danger" />
                              Almost gone!
                            </span>
                          )}
                        </span>
                        <span className="font-semibold text-warm-700">
                          {claimedPercent}% claimed
                        </span>
                      </div>
                      <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            claimedPercent >= 75
                              ? 'bg-gradient-to-r from-danger to-warning'
                              : 'bg-gradient-to-r from-gold-500 to-gold-400'
                          }`}
                          style={{ width: `${claimedPercent}%` }}
                        />
                      </div>
                    </div>

                    <CustomButton
                      size="sm"
                      variant="primary"
                      className="w-full"
                      onClick={() =>
                        addItem({
                          productId: product.id,
                          slug: product.slug,
                          name: product.name,
                          price: product.price,
                          quantity: 1,
                          image: product.images[0],
                          variantId: null,
                          warehouse: product.warehouse,
                          isDigital: product.isDigital,
                        })
                      }
                    >
                      Grab This Deal
                    </CustomButton>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
