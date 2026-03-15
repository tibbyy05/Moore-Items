'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Star, Check, Flame } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';

interface FeaturedVariant {
  id: string;
  name: string;
  retail_price: number;
  stock_count: number;
  color?: string;
  size?: string;
}

interface FeaturedProductData {
  id: string;
  name: string;
  slug: string;
  images: string[];
  retail_price: number;
  compare_at_price: number | null;
  average_rating: number;
  review_count: number;
  warehouse: 'US' | 'CN' | 'CA';
  shipping_days: string;
  sales_count: number;
  badge: string | null;
  description: string;
  variants: FeaturedVariant[];
}

function Skeleton() {
  return (
    <section className="bg-[#0f1629]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="aspect-square bg-white/5 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-40 bg-white/5 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-white/5 rounded animate-pulse" />
            <div className="h-5 w-32 bg-white/5 rounded animate-pulse" />
            <div className="h-8 w-48 bg-white/5 rounded animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="h-12 w-40 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeaturedProduct() {
  const [product, setProduct] = useState<FeaturedProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    fetch('/api/featured-product')
      .then((res) => res.json())
      .then((data) => setProduct(data.product))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton />;
  if (!product) return null;

  const savingsPercent =
    product.compare_at_price && product.compare_at_price > product.retail_price
      ? Math.round(((product.compare_at_price - product.retail_price) / product.compare_at_price) * 100)
      : 0;

  const cleanDescription = product.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const benefits = cleanDescription
    .split('. ')
    .filter((s) => s.trim().length >= 20)
    .slice(0, 3)
    .map((s) => (s.endsWith('.') ? s : s + '.'));

  const handleAddToCart = () => {
    const variant = product.variants[0];
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: variant?.id ?? null,
      name: product.name,
      variantName: variant?.name,
      price: product.retail_price,
      quantity: 1,
      image: product.images[0],
      warehouse: product.warehouse,
      shippingDays: product.shipping_days || null,
    });
  };

  return (
    <section className="bg-[#0f1629] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c8a45e]/[0.03] rounded-full blur-[100px] translate-x-1/3 -translate-y-1/4 pointer-events-none" />

      <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl bg-white/5">
            {product.images[0] && (
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            )}
            {product.badge && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#c8a45e] text-white text-xs font-semibold rounded-full uppercase">
                {product.badge}
              </span>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#c8a45e] mb-4">
              &#10022; Featured This Week
            </p>

            <h2 className="font-playfair font-bold text-white text-2xl sm:text-3xl lg:text-4xl leading-tight mb-4">
              {product.name}
            </h2>

            {/* Rating */}
            {product.review_count > 0 && (
              <div className="flex items-center gap-1.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(product.average_rating) ? 'fill-[#c8a45e] text-[#c8a45e]' : 'text-white/20'}`}
                  />
                ))}
                <span className="text-sm text-white/60 ml-1">
                  ({product.review_count} review{product.review_count !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-white">
                ${product.retail_price.toFixed(2)}
              </span>
              {product.compare_at_price && product.compare_at_price > product.retail_price && (
                <span className="text-lg text-white/40 line-through">
                  ${product.compare_at_price.toFixed(2)}
                </span>
              )}
              {savingsPercent > 0 && (
                <span className="px-2.5 py-0.5 bg-[#c8a45e]/20 text-[#c8a45e] text-sm font-semibold rounded-full">
                  Save {savingsPercent}%
                </span>
              )}
            </div>

            {/* Benefits */}
            {benefits.length > 0 && (
              <ul className="space-y-2.5 mb-6">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#c8a45e] mt-0.5 shrink-0" />
                    <span className="text-sm text-white/80 leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Urgency */}
            {product.sales_count > 0 && (
              <p className="text-sm text-white/60 mb-6 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                {product.sales_count} sold recently
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/product/${product.slug}`}
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1629] font-semibold rounded-lg transition-colors text-sm"
              >
                Shop Now
                <span aria-hidden="true">&rarr;</span>
              </Link>
              <button
                onClick={handleAddToCart}
                className="inline-flex items-center px-8 py-3.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
