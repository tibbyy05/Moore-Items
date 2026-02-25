'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, SlidersHorizontal, Grid3x3, List, Search } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ProductGrid } from '@/components/product/ProductGrid';
import { CustomButton } from '@/components/ui/custom-button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CategoryIcon } from '@/components/ui/category-icon';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import Image from 'next/image';
import { SUBCATEGORY_TAGS, TAG_KEYWORDS } from '@/lib/config/subcategory-tags';
import { useCategories } from '@/components/providers/CategoriesProvider';

export const dynamic = 'force-dynamic';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest' | 'best-selling' | 'top-rated';
const LIMIT = 24;
const formatCount = (value: number) => value.toLocaleString('en-US');

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesKeyword(name: string, keyword: string) {
  const pattern = new RegExp(`\\b${escapeRegex(keyword)}\\b`, 'i');
  return pattern.test(name);
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const { categories, loading: categoriesLoading } = useCategories();
  const activeCategory = categories.find((item) => item.slug === params.slug);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (categoriesLoading) return;
    setLoading(false);
  }, [categoriesLoading]);

  const fetchProducts = async (pageToLoad: number, replace: boolean) => {
    if (fetchingRef.current) return false;
    fetchingRef.current = true;
    if (replace) {
      setLoading(true);
    } else {
      setIsFetchingMore(true);
    }

    const totalParam =
      pageToLoad > 1 && totalProducts ? `&total=${totalProducts}` : '';
    const productsResponse = await fetch(
      `/api/products?category=${params.slug}&limit=${LIMIT}&page=${pageToLoad}${totalParam}`
    );
    const productsData = await productsResponse.json();

    if (productsResponse.ok) {
      const mappedProducts = (productsData.products || []).map((product: any) => ({
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
        shippingDays: product.shipping_estimate || '7-12 days',
        warehouse: product.warehouse || 'CN',
        inStock: product.stock_count > 0,
        stockCount: product.stock_count || 0,
      }));

      let nextCount = 0;
      setCategoryProducts((prev) => {
        const next = replace ? mappedProducts : [...prev, ...mappedProducts];
        nextCount = next.length;
        return next;
      });
      const total = productsData.total || 0;
      const nextTotalPages =
        productsData.totalPages || Math.ceil(total / LIMIT) || 1;
      setTotalProducts(total);
      setTotalPages(nextTotalPages);
      setHasMore(pageToLoad < nextTotalPages);
      setLoading(false);
      setIsFetchingMore(false);
      fetchingRef.current = false;
      return true;
    } else if (replace) {
      setCategoryProducts([]);
      setTotalProducts(0);
      setTotalPages(1);
      setHasMore(false);
    }

    setLoading(false);
    setIsFetchingMore(false);
    fetchingRef.current = false;
    return false;
  };

  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [usWarehouseOnly, setUsWarehouseOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [styleFilters, setStyleFilters] = useState<Set<string>>(new Set());
  const [subcategoryTags, setSubcategoryTags] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const fetchingRef = useRef(false);

  const filterButtonClass = (isActive: boolean) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      isActive
        ? 'bg-gold-500 text-white'
        : 'bg-white border border-warm-200 text-warm-700 hover:border-warm-400'
    }`;

  const toggleStyleFilter = (value: string) => {
    setStyleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const toggleSubcategoryTag = (value: string) => {
    setSubcategoryTags((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const tagButtonClass = (isActive: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-gold-500 text-white'
        : 'bg-warm-100 text-warm-700 hover:bg-warm-200'
    }`;

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...categoryProducts];

    if (minPrice) {
      filtered = filtered.filter((p) => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice));
    }
    if (usWarehouseOnly) {
      filtered = filtered.filter((p) => p.warehouse === 'US');
    }
    if (minRating) {
      filtered = filtered.filter((p) => p.rating >= minRating);
    }
    if (params.slug === 'fashion' && styleFilters.size > 0) {
      const kidTerms = ['kids', 'children', 'child', 'baby', 'infant', 'toddler', 'boys', 'girls'];
      const womenTerms = ['women', 'woman', 'ladies', 'female'];
      const menTerms = ['men', 'mens', 'male'];

      filtered = filtered.filter((product) => {
        const tokens = new Set(
          product.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
        );

        const hasKidTerm = kidTerms.some((term) => tokens.has(term));
        const isKids = hasKidTerm;
        const isWomen = womenTerms.some((term) => tokens.has(term)) || (tokens.has('girl') && !hasKidTerm);
        const isMen = menTerms.some((term) => tokens.has(term)) || (tokens.has('boy') && !hasKidTerm);

        return (
          (styleFilters.has('women') && isWomen) ||
          (styleFilters.has('men') && isMen) ||
          (styleFilters.has('kids') && isKids)
        );
      });
    }
    if (subcategoryTags.size > 0 && SUBCATEGORY_TAGS[params.slug]?.length) {
      filtered = filtered.filter((product) => {
        const name = product.name.toLowerCase();
        for (const tag of Array.from(subcategoryTags)) {
          const keywords = TAG_KEYWORDS[tag] || [];
          for (const keyword of keywords) {
            if (tag === 'Bracelets' && name.includes('smart')) {
              continue;
            }
            if (
              tag === 'Necklaces' &&
              keyword === 'chain' &&
              (name.includes('keychain') || name.includes('chainsaw'))
            ) {
              continue;
            }
            if (matchesKeyword(name, keyword)) {
              return true;
            }
          }
        }
        return false;
      });
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return 0;
        case 'best-selling':
          return b.reviewCount - a.reviewCount;
        case 'top-rated':
          return b.rating - a.rating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    categoryProducts,
    sortBy,
    minPrice,
    maxPrice,
    usWarehouseOnly,
    minRating,
    params.slug,
    styleFilters,
    subcategoryTags,
  ]);

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setUsWarehouseOnly(false);
    setMinRating(null);
    setStyleFilters(new Set());
    setSubcategoryTags(new Set());
  };

  const filtersContent = (
    <div className="bg-warm-50 border border-warm-200 rounded-2xl p-6 lg:sticky lg:top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-warm-900">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-gold-600 hover:text-gold-700"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-warm-900 mb-3">
            Price Range
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full px-3 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-warm-900 mb-3">
            Shipping
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usWarehouseOnly}
              onChange={(e) => setUsWarehouseOnly(e.target.checked)}
              className="w-4 h-4 text-gold-500 border-warm-300 rounded focus:ring-gold-500"
            />
                      <span className="text-sm text-warm-700">
                        US Warehouse (2-5 days)
                      </span>
          </label>
        </div>

        {params.slug === 'fashion' && (
          <div>
            <label className="block text-sm font-semibold text-warm-900 mb-3">
              Style
            </label>
            <div className="space-y-2">
              <button
                onClick={() => toggleStyleFilter('women')}
                className={filterButtonClass(styleFilters.has('women'))}
              >
                Women
              </button>
              <button
                onClick={() => toggleStyleFilter('men')}
                className={filterButtonClass(styleFilters.has('men'))}
              >
                Men
              </button>
              <button
                onClick={() => toggleStyleFilter('kids')}
                className={filterButtonClass(styleFilters.has('kids'))}
              >
                Kids
              </button>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-warm-900 mb-3">
            Rating
          </label>
          <div className="space-y-2">
            <button
              onClick={() => setMinRating(minRating === 4 ? null : 4)}
              className={filterButtonClass(minRating === 4)}
            >
              4+ Stars
            </button>
            <button
              onClick={() => setMinRating(minRating === 3 ? null : 3)}
              className={filterButtonClass(minRating === 3)}
            >
              3+ Stars
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const categoryTags = SUBCATEGORY_TAGS[params.slug] || [];
  const allTagsSelected = subcategoryTags.size === 0;

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [
    params.slug,
    sortBy,
    minPrice,
    maxPrice,
    usWarehouseOnly,
    minRating,
    styleFilters,
    subcategoryTags,
  ]);

  const loadNextPage = React.useCallback(async () => {
    const nextPage = page + 1;
    const didLoad = await fetchProducts(nextPage, false);
    if (didLoad) {
      setPage(nextPage);
    }
  }, [page, fetchProducts]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !isFetchingMore) {
          loadNextPage();
        }
      },
      { rootMargin: '600px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, isFetchingMore, page, totalPages, loadNextPage]);

  if ((loading || categoriesLoading) && categoryProducts.length === 0) {
    return (
      <>
        <Header />
        <CartDrawer />
        <main className="bg-white min-h-screen">
          <div className="max-w-[1600px] mx-auto px-4 py-12">
            <ProductGrid products={[]} columns={3} loading />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!activeCategory && !categoriesLoading && !loading) {
    return (
      <>
        <Header />
        <CartDrawer />
        <main className="bg-warm-50 min-h-[60vh] flex items-center justify-center px-4">
          <div className="max-w-md text-center">
            <Image
              src="/TransparentLogo.png"
              alt="MooreItems"
              width={420}
              height={140}
              className="w-auto h-20 mx-auto mb-6"
            />
            <h1 className="text-3xl font-playfair font-semibold text-warm-900 mb-3">
              Category Not Found
            </h1>
            <p className="text-warm-600 mb-8">
              The category you’re looking for doesn’t exist or is no longer available.
            </p>
            <CustomButton variant="primary" asChild>
              <Link href="/">Return to Home</Link>
            </CustomButton>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!activeCategory) {
    return (
      <>
        <Header />
        <CartDrawer />
        <main className="bg-white min-h-screen">
          <div className="max-w-[1600px] mx-auto px-4 py-12">
            <ProductGrid products={[]} columns={3} loading />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const resolvedCategory = activeCategory;

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="bg-white min-h-screen">
        <div className="bg-warm-50 border-b border-warm-200 py-6">
          <div className="max-w-[1600px] mx-auto px-4">
            <nav className="flex items-center gap-2 text-sm mb-4">
              <Link href="/" className="text-warm-600 hover:text-warm-900">
                Home
              </Link>
              <ChevronRight className="w-4 h-4 text-warm-400" />
              <span className="text-warm-900 font-medium">{resolvedCategory?.name}</span>
            </nav>

            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center',
                  resolvedCategory?.gradient
                )}
              >
                <CategoryIcon
                  iconName={resolvedCategory?.iconName}
                  className={resolvedCategory?.iconColor}
                  size="lg"
                  strokeWidth={1.5}
                />
              </div>
              <div>
              <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-playfair font-semibold text-warm-900">
                    {resolvedCategory?.name}
                  </h1>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white border border-warm-200 text-warm-700">
                  {formatCount(totalProducts || 0)} products
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-4 py-8">
          {categoryTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <button
                onClick={() => setSubcategoryTags(new Set())}
                className={tagButtonClass(allTagsSelected)}
              >
                All
              </button>
              {categoryTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleSubcategoryTag(tag)}
                  className={tagButtonClass(subcategoryTags.has(tag))}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
          <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8">
            <aside className="hidden lg:block mb-8 lg:mb-0">{filtersContent}</aside>
            <Sheet open={showFilters} onOpenChange={setShowFilters}>
              <SheetContent side="bottom" className="h-[90vh] overflow-y-auto bg-warm-50 p-0">
                <SheetHeader className="text-left">
                  <SheetTitle className="text-warm-900">Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-4">{filtersContent}</div>
              </SheetContent>
            </Sheet>

            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 border border-warm-200 rounded-lg text-warm-700 hover:border-warm-400 w-full sm:w-auto min-h-[44px]"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>

                <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full sm:w-auto px-4 py-2 border border-warm-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500 min-h-[44px]"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest</option>
                    <option value="best-selling">Best Selling</option>
                    <option value="top-rated">Top Rated</option>
                  </select>

                  <div className="hidden sm:flex items-center gap-1 border border-warm-200 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${
                        viewMode === 'grid' ? 'bg-gold-500 text-white' : 'text-warm-600'
                      }`}
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${
                        viewMode === 'list' ? 'bg-gold-500 text-white' : 'text-warm-600'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {loading && categoryProducts.length === 0 ? (
                <ProductGrid products={[]} columns={3} loading />
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-warm-50 flex items-center justify-center">
                    <Search className="w-10 h-10 text-warm-400" />
                  </div>
                  <h3 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                    No products found
                  </h3>
                  <p className="text-warm-600 mb-6">
                    Try adjusting your filters or browse our categories.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <CustomButton variant="secondary" onClick={clearFilters}>
                      Clear Filters
                    </CustomButton>
                    <CustomButton variant="primary" asChild>
                      <Link href="/">Browse Categories</Link>
                    </CustomButton>
                  </div>
                </div>
              ) : (
                <>
                  <ProductGrid products={filteredAndSortedProducts} columns={3} />
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
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
