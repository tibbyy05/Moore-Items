'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  id: string;
  slug: string;
  name: string;
  image?: string;
  price: number;
  categorySlug?: string;
}

const CATEGORY_SUGGESTIONS = [
  { label: 'Fashion', slug: 'fashion' },
  { label: 'Home & Garden', slug: 'home-garden' },
  { label: 'Health & Beauty', slug: 'health-beauty' },
  { label: 'Electronics', slug: 'electronics' },
  { label: 'Kitchen', slug: 'kitchen' },
  { label: 'Jewelry', slug: 'jewelry' },
  { label: 'Pet Supplies', slug: 'pet-supplies' },
  { label: 'Kids & Toys', slug: 'kids-toys' },
];

export function SearchBar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (response.ok) {
        const mapped = (data.products || []).map((product: any) => ({
          id: product.id,
          slug: product.slug,
          name: product.name,
          image: product.images?.[0],
          price: product.retail_price,
          categorySlug: product.mi_categories?.slug || undefined,
        }));
        setResults(mapped);
      }
      setLoading(false);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="p-2 rounded-lg hover:bg-warm-50 transition-colors"
        aria-label="Search"
      >
        <Search className="w-5 h-5 text-warm-700" />
      </button>

      <div
        className={cn(
          'absolute right-0 mt-3 w-[90vw] max-w-[340px] sm:w-[380px] bg-white border border-warm-200 rounded-2xl shadow-xl overflow-hidden transition-all',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        )}
      >
        <div className="p-4 border-b border-warm-100 flex items-center gap-2">
          <Search className="w-4 h-4 text-warm-400" />
          <input
            type="search"
            placeholder="Search products..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                setOpen(false);
              }
            }}
            className="flex-1 text-sm text-warm-800 placeholder:text-warm-400 focus:outline-none"
            autoFocus={open}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-warm-50"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-warm-500" />
            </button>
          )}
        </div>

        <div className="max-h-[320px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-sm text-warm-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-sm text-warm-500">
              {query ? 'No results found' : 'Start typing to search'}
            </div>
          ) : (
            results.map((result) => (
              <Link
                key={result.id}
                href={`/product/${result.slug}`}
                className="flex items-center gap-3 px-4 py-3 hover:bg-warm-50 transition-colors"
                onClick={() => setOpen(false)}
              >
                <div className="relative w-12 h-12 rounded-lg bg-warm-50 overflow-hidden">
                  <Image
                    src={result.image || '/placeholder.svg'}
                    alt={result.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-warm-900 truncate">
                    {result.name}
                  </p>
                  <p className="text-sm text-warm-600">${result.price.toFixed(2)}</p>
                </div>
              </Link>
            ))
          )}
        </div>

        {query && (
          <>
            <div className="border-t border-warm-100 px-4 py-3">
              <p className="text-xs font-semibold text-warm-500 uppercase tracking-widest mb-2">
                Categories
              </p>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_SUGGESTIONS.map((category) => (
                  <Link
                    key={category.slug}
                    href={`/search?q=${encodeURIComponent(query)}&category=${category.slug}`}
                    className="text-xs font-semibold text-warm-700 bg-warm-50 border border-warm-200 rounded-full px-3 py-1 hover:border-gold-500 hover:text-gold-600 transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    Search in {category.label}
                  </Link>
                ))}
              </div>
            </div>
            {results.length > 0 && (
              <div className="p-3 border-t border-warm-100">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="text-sm font-semibold text-gold-600 hover:text-gold-500"
                  onClick={() => setOpen(false)}
                >
                  View all results
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
