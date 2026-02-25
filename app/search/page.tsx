'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CustomButton } from '@/components/ui/custom-button';
import { CategoryIcon } from '@/components/ui/category-icon';
import { cn } from '@/lib/utils';
import { Category, Product } from '@/lib/types';
import { useCategories } from '@/components/providers/CategoriesProvider';

export const dynamic = 'force-dynamic';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const { categories } = useCategories();
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const LIMIT = 24;

  useEffect(() => {
    setSearchQuery(initialQuery);
    setInputValue(initialQuery);
  }, [initialQuery]);

  const mappedCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    iconName: category.iconName,
    productCount: category.productCount,
    gradient: category.gradient,
    iconColor: category.iconColor,
  }));

  const fetchSearchResults = async (pageToLoad: number, replace: boolean) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setTotalProducts(0);
      setTotalPages(1);
      setHasMore(false);
      return;
    }

    if (replace) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    const categoryParam = initialCategory
      ? `&category=${encodeURIComponent(initialCategory)}`
      : '';
    const totalParam =
      pageToLoad > 1 && totalProducts ? `&total=${totalProducts}` : '';
    const response = await fetch(
      `/api/products?q=${encodeURIComponent(searchQuery)}&limit=${LIMIT}&page=${pageToLoad}${totalParam}${categoryParam}`
    );
    const data = await response.json();
    if (response.ok) {
      const mapped = (data.products || []).map((product: any) => ({
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
        variants: [],
        description: '',
        shippingDays: product.shipping_estimate || '7-12 days',
        warehouse: 'CN',
        inStock: true,
        stockCount: 0,
      }));
      setSearchResults((prev) => (replace ? mapped : [...prev, ...mapped]));
      const total = data.total || 0;
      const nextTotalPages = data.totalPages || 1;
      setTotalProducts(total);
      setTotalPages(nextTotalPages);
      setHasMore(pageToLoad < nextTotalPages);
    } else if (replace) {
      setSearchResults([]);
      setTotalProducts(0);
      setTotalPages(1);
      setHasMore(false);
    }
    setLoading(false);
    setIsFetchingMore(false);
  };

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchSearchResults(1, true);
  }, [searchQuery, initialCategory]);

  useEffect(() => {
    if (page === 1) return;
    fetchSearchResults(page, false);
  }, [page]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !isFetchingMore) {
          setPage((prev) => prev + 1);
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore]);

  const trendingSearches = ['dress', 'home decor', 'beauty', 'jewelry', 'kitchen'];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchQuery(inputValue.trim());
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  const handleTrendingClick = (term: string) => {
    setInputValue(term);
    setSearchQuery(term);
    window.history.pushState({}, '', `/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="bg-white min-h-screen">
        <div className="bg-warm-50 border-b border-warm-200 py-8 sm:py-12">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6 text-center">
              Search Products
            </h1>

            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-400" />
              <input
                type="search"
                placeholder="Search for products..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-warm-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent text-lg"
                autoFocus
              />
            </form>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 py-8 sm:py-12">
          {!searchQuery ? (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold text-warm-900 mb-4">Trending Searches</h2>
              <div className="flex flex-wrap gap-3 mb-12">
                {trendingSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleTrendingClick(term)}
                    className="px-4 py-2 bg-warm-50 border border-warm-200 rounded-full text-warm-700 hover:border-gold-500 hover:text-gold-600 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>

              <h2 className="text-xl font-semibold text-warm-900 mb-4">Browse by Category</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mappedCategories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/category/${category.slug}`}
                    className="flex flex-col items-center gap-2 p-4 bg-warm-50 border border-warm-200 rounded-xl hover:border-gold-500 hover:shadow-md transition-all"
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center',
                        category.gradient
                      )}
                    >
                      <CategoryIcon
                        iconName={category.iconName}
                        className={category.iconColor}
                        size="md"
                        strokeWidth={1.75}
                      />
                    </div>
                    <span className="text-sm font-semibold text-warm-900 text-center">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : loading ? (
            <ProductGrid products={[]} columns={4} loading />
          ) : searchResults.length > 0 ? (
            <>
              <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-8">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "
                {searchQuery}"
              </h2>
              <ProductGrid products={searchResults} columns={4} />
              <div ref={sentinelRef} className="h-1" />
              {isFetchingMore && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-6">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="bg-warm-50 border border-warm-100 rounded-2xl overflow-hidden animate-pulse"
                    >
                      <div className="aspect-square bg-warm-100" />
                      <div className="p-4 space-y-3">
                        <div className="h-3 w-1/2 bg-warm-100 rounded" />
                        <div className="h-4 w-3/4 bg-warm-100 rounded" />
                        <div className="h-4 w-2/5 bg-warm-100 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-warm-50 flex items-center justify-center">
                <SearchIcon className="w-12 h-12 text-warm-400" />
              </div>
              <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-3">
                No results for "{searchQuery}"
              </h2>
              <p className="text-warm-600 mb-8">
                Try different keywords or browse our categories below
              </p>

              <div className="mb-8">
                <h3 className="text-lg font-semibold text-warm-900 mb-4">
                  Try searching for:
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {trendingSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleTrendingClick(term)}
                      className="px-4 py-2 bg-warm-50 border border-warm-200 rounded-full text-warm-700 hover:border-gold-500 hover:text-gold-600 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <CustomButton variant="primary" asChild>
                <Link href="/">Browse All Products</Link>
              </CustomButton>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
