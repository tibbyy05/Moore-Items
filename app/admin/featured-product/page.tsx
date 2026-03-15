'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Search, Star as StarIcon, X, Trash2, Check } from 'lucide-react';
import { Sidebar } from '@/components/admin/Sidebar';

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
  retail_price: number;
  compare_at_price: number | null;
  average_rating: number;
  review_count: number;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  images: string[];
  retail_price: number;
}

export default function FeaturedProductAdmin() {
  const [featured, setFeatured] = useState<FeaturedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchFeatured = async () => {
    try {
      const res = await fetch('/api/admin/featured-product');
      const data = await res.json();
      setFeatured(data.product);
    } catch {
      setFeatured(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(search)}&limit=8`);
        const data = await res.json();
        setResults(data.products || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleSelect = async (productId: string) => {
    try {
      const res = await fetch('/api/admin/featured-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error('Failed to set featured product');
      showToast('success', 'Featured product updated');
      setSearch('');
      setResults([]);
      await fetchFeatured();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update');
    }
  };

  const handleRemove = async () => {
    try {
      const res = await fetch('/api/admin/featured-product', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove featured product');
      setFeatured(null);
      showToast('success', 'Featured product removed');
    } catch (err: any) {
      showToast('error', err.message || 'Failed to remove');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Featured Product</h1>
          <p className="text-sm text-gray-500 mb-8">
            Choose a product to highlight in the &ldquo;Featured This Week&rdquo; section on the homepage.
          </p>

          {/* Current featured */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Currently Featured
            </h2>
            {loading ? (
              <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ) : featured ? (
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  {featured.images?.[0] && (
                    <Image
                      src={featured.images[0]}
                      alt={featured.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{featured.name}</p>
                  <p className="text-sm text-gray-500">
                    ${featured.retail_price?.toFixed(2)}
                    {featured.review_count > 0 && (
                      <span className="ml-2">
                        &middot; {featured.average_rating?.toFixed(1)} stars ({featured.review_count} reviews)
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No featured product set</p>
            )}
          </div>

          {/* Search */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Select a Product
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name..."
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
              />
              {search && (
                <button
                  onClick={() => { setSearch(''); setResults([]); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {searching && (
              <p className="text-sm text-gray-400 py-3">Searching...</p>
            )}

            {results.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product.id)}
                    className="w-full flex items-center gap-4 py-4 px-4 min-h-[72px] hover:bg-gray-50 transition-colors text-left border-b border-gray-200 last:border-b-0"
                  >
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-100 shrink-0">
                      {product.images?.[0] && (
                        <Image
                          src={product.images[0]}
                          alt={product.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium text-gray-900 truncate">{product.name}</p>
                      <p className="text-sm text-gray-500">${product.retail_price?.toFixed(2)}</p>
                    </div>
                    {featured?.id === product.id && (
                      <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Current
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {search.length >= 2 && !searching && results.length === 0 && (
              <p className="text-sm text-gray-400 py-3">No products found</p>
            )}
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        )}
      </main>
    </div>
  );
}
