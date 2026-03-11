import Link from 'next/link';
import { Truck, Package, Star, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
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
import { HeroGrid } from '@/components/storefront/HeroGrid';

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
    isDigital: !!(product.digital_file_path || product.mi_categories?.slug === 'digital-downloads' || product.stock_count >= 9999),
    inStock: product.stock_count > 0,
    stockCount: product.stock_count || 0,
  };
}

export default async function Home() {
  const supabase = await createServerSupabaseClient();
  const heroAllowedCategories = [
    'fashion', 'jewelry', 'home-furniture', 'kitchen-dining',
    'pet-supplies', 'kids-toys', 'health-beauty', 'garden-outdoor',
  ];
  const { data: heroPool } = await supabase
    .from('mi_products')
    .select('*, mi_categories!inner(name, slug), mi_product_variants(*)')
    .eq('status', 'active')
    .is('digital_file_path', null)
    .not('images', 'is', null)
    .in('mi_categories.slug', heroAllowedCategories)
    .eq('hero_eligible', true)
    .order('sales_count', { ascending: false })
    .limit(40);

  const heroWithImages = (heroPool || []).filter(
    (p) => Array.isArray(p.images) && p.images.length > 0
  );
  // Fisher-Yates shuffle, then take 4
  for (let i = heroWithImages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [heroWithImages[i], heroWithImages[j]] = [heroWithImages[j], heroWithImages[i]];
  }

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

  const heroGridPool = heroWithImages.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    image: (p.images as string[])[0],
  }));
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
        {/* Hero */}
        <section className="relative bg-navy-900 overflow-hidden">
          <div className="absolute inset-0 bg-hero-gradient" />
          <div className="absolute top-1/2 right-0 w-[600px] h-[600px] -translate-y-1/2 translate-x-1/4 bg-gold-500/[0.04] rounded-full blur-[120px] pointer-events-none" />

          <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-14 sm:py-20 lg:py-0 lg:min-h-[calc(100vh-120px)] flex items-center">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
              {/* Copy */}
              <div className="order-2 lg:order-1">
                <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-gold-500 mb-4 sm:mb-5">
                  Curated for you
                </p>
                <h1 className="font-playfair font-bold text-white leading-[1.1] mb-6">
                  <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl">
                    Moore Items.
                  </span>
                  <span className="block text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-6xl mt-1">
                    More <span className="text-gold-400">Savings.</span>
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-navy-200 leading-relaxed mb-3 max-w-lg">
                  3,000+ handpicked products with free US shipping over $50 — delivered to your door in 2–5 days.
                </p>
                <div className="flex items-center gap-1.5 text-gold-400 text-sm mb-8">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gold-400" />
                  ))}
                  <span className="ml-1.5 text-navy-200">Trusted by 10,000+ happy shoppers</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <CustomButton variant="primary" size="lg" asChild>
                    <Link href="/shop?sort=best-selling">
                      Shop Best Sellers
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </CustomButton>
                  <CustomButton variant="ghost" size="lg" asChild>
                    <Link href="/shop">Browse All</Link>
                  </CustomButton>
                </div>
                <div className="flex items-center gap-2 mt-6 text-xs text-navy-400">
                  <ShieldCheck className="w-4 h-4 text-gold-500/70" />
                  <span>Secure checkout &middot; 30-day returns &middot; Quality guaranteed</span>
                </div>
              </div>

              {/* Image grid */}
              <div className="order-1 lg:order-2 w-full h-[340px] sm:h-[420px] lg:h-[560px]">
                <HeroGrid pool={heroGridPool} />
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="relative bg-navy-950 border-t border-gold-500/10">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gold-500/10">
              {[
                { icon: Package, value: '3,000+', label: 'Curated Products' },
                { icon: Star, value: '39,000+', label: '5-Star Reviews' },
                { icon: Truck, value: '2–5 Days', label: 'Fast US Delivery' },
                { icon: Sparkles, value: 'AI', label: 'Shopping Assistant' },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center justify-center gap-3 py-5 sm:py-6">
                  <Icon className="w-5 h-5 text-gold-500 shrink-0" />
                  <div>
                    <p className="text-lg sm:text-xl font-playfair font-bold text-white leading-tight">{value}</p>
                    <p className="text-[11px] sm:text-xs text-navy-400 uppercase tracking-wider">{label}</p>
                  </div>
                </div>
              ))}
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
