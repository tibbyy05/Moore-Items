import Link from 'next/link';
import Image from 'next/image';
import { CustomButton } from '@/components/ui/custom-button';
import { Search, Shirt, Home, Smartphone, Sparkles, UtensilsCrossed, Gem, Trees, Dumbbell } from 'lucide-react';

const popularCategories = [
  { name: 'Fashion', slug: 'fashion', icon: Shirt },
  { name: 'Home & Furniture', slug: 'home-furniture', icon: Home },
  { name: 'Electronics', slug: 'electronics', icon: Smartphone },
  { name: 'Health & Beauty', slug: 'health-beauty', icon: Sparkles },
  { name: 'Kitchen & Dining', slug: 'kitchen-dining', icon: UtensilsCrossed },
  { name: 'Jewelry', slug: 'jewelry', icon: Gem },
  { name: 'Garden & Outdoor', slug: 'garden-outdoor', icon: Trees },
  { name: 'Sports & Outdoors', slug: 'sports-outdoors', icon: Dumbbell },
];

export default function NotFound() {
  return (
    <>
      <title>Page Not Found | MooreItems</title>
      <meta name="description" content="The page you're looking for doesn't exist. Search our store or browse popular categories." />

      <div className="min-h-screen bg-warm-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl w-full text-center">
            <Image
              src="/TransparentLogo.png"
              alt="MooreItems"
              width={420}
              height={140}
              className="w-auto h-16 mx-auto mb-8"
            />

            <p className="text-7xl font-playfair font-bold text-warm-200 mb-2">404</p>
            <h1 className="text-2xl sm:text-3xl font-playfair font-semibold text-warm-900 mb-3">
              Page Not Found
            </h1>
            <p className="text-warm-600 mb-8 max-w-md mx-auto">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
              Try searching or browse our popular categories below.
            </p>

            {/* Search bar */}
            <form action="/search" className="max-w-md mx-auto mb-10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search for products..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-warm-200 bg-white text-warm-900 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Popular categories */}
            <h2 className="text-sm font-medium text-warm-500 uppercase tracking-wider mb-4">
              Popular Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
              {popularCategories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-warm-200 hover:border-gold-400 hover:shadow-sm transition text-warm-700 hover:text-warm-900"
                  >
                    <Icon className="w-4 h-4 text-gold-600 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{cat.name}</span>
                  </Link>
                );
              })}
            </div>

            <CustomButton variant="primary" asChild>
              <Link href="/">Back to Home</Link>
            </CustomButton>
          </div>
        </div>
      </div>
    </>
  );
}
