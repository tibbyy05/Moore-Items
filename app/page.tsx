import Link from 'next/link';
import Image from 'next/image';
import { Truck, Flag, RotateCcw, Shield } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { NewsletterSignup } from '@/components/storefront/NewsletterSignup';
import { CustomButton } from '@/components/ui/custom-button';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Product } from '@/lib/types';
import { RecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CategoryShowcase } from '@/components/storefront/CategoryShowcase';

export const dynamic = 'force-dynamic';

function mapProduct(product: any): Product {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.retail_price,
    compareAtPrice: product.compare_at_price || null,
    createdAt: product.created_at || undefined,
    images: product.images || [],
    rating: product.average_rating || product.rating || 0,
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
  };
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const heroCategorySlugs = ['fashion', 'home-furniture', 'electronics', 'health-beauty'];
  const { data: heroCategories } = await supabase
    .from('mi_categories')
    .select('id, slug')
    .in('slug', heroCategorySlugs);

  const heroCategoryMap = new Map(
    (heroCategories || []).map((category) => [category.slug, category.id])
  );

  const heroProducts = await Promise.all(
    heroCategorySlugs.map(async (slug) => {
      const categoryId = heroCategoryMap.get(slug);
      if (!categoryId) return null;
      const { data } = await supabase
        .from('mi_products')
        .select('*, mi_categories(name, slug), mi_product_variants(*)')
        .eq('status', 'active')
        .eq('category_id', categoryId)
        .gt('retail_price', 20)
        .not('images', 'is', null)
        .order('review_count', { ascending: false })
        .limit(5);
      const candidate = (data || []).find(
        (product) => Array.isArray(product.images) && product.images.length > 0
      );
      return candidate || null;
    })
  );

  const { data: bestSellers } = await supabase
    .from('mi_products')
    .select('*, mi_categories(name, slug), mi_product_variants(*)')
    .eq('status', 'active')
    .order('review_count', { ascending: false })
    .limit(8);

  const { data: newArrivals } = await supabase
    .from('mi_products')
    .select('*, mi_categories(name, slug), mi_product_variants(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(8);

  const { data: dealsRaw } = await supabase
    .from('mi_products')
    .select('*, mi_categories(name, slug), mi_product_variants(*)')
    .eq('status', 'active')
    .not('compare_at_price', 'is', null)
    .order('compare_at_price', { ascending: false })
    .limit(20);

  const mappedTopRated = heroProducts.filter(Boolean).map(mapProduct);
  const mappedBestSellers = (bestSellers || []).map(mapProduct);
  const mappedNewArrivals = (newArrivals || []).map(mapProduct);

  const mappedDeals = (dealsRaw || [])
    .map(mapProduct)
    .filter((product) => product.compareAtPrice && product.compareAtPrice > product.price)
    .sort((a, b) => {
      const aDiscount =
        a.compareAtPrice ? (a.compareAtPrice - a.price) / a.compareAtPrice : 0;
      const bDiscount =
        b.compareAtPrice ? (b.compareAtPrice - b.price) / b.compareAtPrice : 0;
      return bDiscount - aDiscount;
    })
    .slice(0, 4);

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="bg-white">
        <section className="bg-[#f7f6f3]">
          <div className="max-w-[1600px] mx-auto px-4 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-semibold text-warm-900 mb-6">
                  Discover Moore.
                </h1>
                <p className="text-lg text-warm-700 mb-8 max-w-xl">
                  3,000+ curated products. Free US shipping on orders over $50. Delivered in 2-5
                  days.
                </p>
                <div className="flex flex-wrap gap-3">
                  <CustomButton variant="primary" asChild>
                    <Link href="/shop?sort=best-selling">Shop Best Sellers</Link>
                  </CustomButton>
                  <CustomButton variant="secondary" asChild>
                    <Link href="/shop">Browse Categories</Link>
                  </CustomButton>
                </div>
              </div>
              <div className="grid grid-cols-2 max-[360px]:grid-cols-1 gap-4">
                {mappedTopRated.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
                  >
                    <Image
                      src={product.images?.[0] || '/placeholder.svg'}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      unoptimized
                      priority
                    />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <CategoryShowcase />

        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
                  Best Sellers
                </p>
                <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
                  Most loved by our customers
                </h2>
              </div>
              <CustomButton variant="secondary" asChild className="hidden sm:inline-flex">
                <Link href="/shop?sort=best-selling">View All</Link>
              </CustomButton>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
              {mappedBestSellers.map((product) => (
                <div
                  key={product.id}
                  className="min-w-[80%] sm:min-w-[260px] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f7f6f3] py-12">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="grid gap-6 grid-cols-2 max-[360px]:grid-cols-1 lg:grid-cols-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Truck className="w-5 h-5 text-gold-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-warm-900">Fast US Shipping</p>
                  <p className="text-xs text-warm-600">
                    Free delivery in 2-5 business days on orders over $50
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Flag className="w-5 h-5 text-gold-600" />
                </div>
                <p className="text-sm text-warm-700 font-semibold">Ships from USA</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <RotateCcw className="w-5 h-5 text-gold-600" />
                </div>
                <p className="text-sm text-warm-700 font-semibold">Easy Returns</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Shield className="w-5 h-5 text-gold-600" />
                </div>
                <p className="text-sm text-warm-700 font-semibold">Secure Checkout</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
                  Just Arrived
                </p>
                <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
                  The latest additions to our collection
                </h2>
              </div>
              <CustomButton variant="secondary" asChild className="hidden sm:inline-flex">
                <Link href="/new-arrivals">View All</Link>
              </CustomButton>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              {mappedNewArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
                  Today&apos;s Deals
                </p>
                <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900">
                  Save big on these limited-time offers
                </h2>
              </div>
              <CustomButton variant="secondary" asChild className="hidden sm:inline-flex">
                <Link href="/deals">View All Deals</Link>
              </CustomButton>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
              {mappedDeals.map((product) => {
                const discountPercent = product.compareAtPrice
                  ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
                  : 0;
                return (
                  <div key={product.id} className="relative">
                    <span className="absolute top-3 left-3 z-10 text-[11px] sm:text-xs font-semibold bg-gold-500 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full">
                      Save {discountPercent}%
                    </span>
                    <ProductCard product={product} />
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <NewsletterSignup />
        <div className="max-w-[1600px] mx-auto px-4">
          <RecentlyViewed />
        </div>
      </main>

      <Footer />
    </>
  );
}
