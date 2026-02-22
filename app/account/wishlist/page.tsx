'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product } from '@/lib/types';
import { useWishlist } from '@/components/providers/WishlistProvider';

export default function WishlistPage() {
  const { items: wishlistIds } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (wishlistIds.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/products?ids=${wishlistIds.join(',')}`);
      if (response.ok) {
        const data = await response.json();
        const mapped = (data.products || []).map((item: any): Product => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          price: item.retail_price,
          compareAtPrice: item.compare_at_price || null,
          createdAt: item.created_at || undefined,
          images: Array.isArray(item.images) ? item.images.slice(0, 1) : [],
          rating: item.average_rating || 0,
          reviewCount: item.review_count || 0,
          category: item.mi_categories?.slug || '',
          categoryLabel: item.mi_categories?.name || '',
          badge: null,
          variants: [],
          description: '',
          shippingDays: item.shipping_estimate || '2-5 business days',
          warehouse: item.warehouse || 'US',
          inStock: item.stock_count > 0,
          stockCount: item.stock_count || 0,
        }));
        setProducts(mapped);
      }
      setLoading(false);
    };
    load();
  }, [wishlistIds]);

  if (loading) return <p className="text-warm-600 py-12">Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-6">My Wishlist</h2>

      {products.length === 0 ? (
        <div className="bg-warm-50 rounded-xl p-8 text-center">
          <Heart className="w-8 h-8 text-warm-400 mx-auto mb-3" />
          <p className="text-warm-600 mb-4">Your wishlist is empty.</p>
          <Link
            href="/shop"
            className="inline-flex px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
