'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search,
  Radar,
  Package,
  Bookmark,
  Eye,
  ExternalLink,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  ImageIcon,
} from 'lucide-react';

// ─── Safe JSON fetch helper ─────────────────────────────────────────────────
async function safeJson(res: Response) {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Server error (${res.status}): ${text.slice(0, 300)}`);
  }
  return res.json();
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface ScoutVariant {
  vid: string;
  name: string;
  color: string | null;
  size: string | null;
  price: number;
  us_stock: number;
  cn_stock: number;
  image: string | null;
}

interface ScoutProduct {
  cj_pid: string;
  name: string;
  description: string;
  images: string[];
  wholesale_price: number;
  retail_price: number;
  compare_at_price: number | null;
  profit_per_sale: number;
  margin_percent: number;
  total_cost: number;
  shipping_estimate: number;
  stripe_fee: number;
  weight_grams: number;
  weight_oz: number;
  variants: ScoutVariant[];
  total_us_stock: number;
  total_variants: number;
  us_warehouse: boolean;
  catalog_status: 'in_catalog' | 'not_in_catalog' | 'hidden';
  existing_product_id: string | null;
  existing_product_slug: string | null;
  cj_url: string;
  watchlist_status: string | null;
  _needs_enrichment?: boolean;
}

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  images: string[];
  cj_pid: string;
  retail_price: number;
  compare_at_price: number | null;
  cj_price: number;
  margin_percent: number;
  margin_dollars: number;
  total_cost: number;
  shipping_cost: number;
  stripe_fee: number;
  stock_count: number;
  warehouse: string;
  status: string;
  review_count: number;
  average_rating: number;
  category_name: string | null;
  store_url: string;
  admin_url: string;
  cj_url: string | null;
}

interface WatchlistItem {
  id: string;
  cj_pid: string;
  cj_product_name: string;
  cj_thumbnail: string | null;
  cj_wholesale_price: number;
  calculated_retail_price: number;
  calculated_margin: number;
  us_stock_at_save: number;
  variant_count: number;
  notes: string | null;
  status: string;
  imported_product_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function marginColor(margin: number) {
  if (margin >= 50) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: 'Excellent' };
  if (margin >= 40) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Good' };
  if (margin >= 30) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Fair' };
  return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Low' };
}

function formatPrice(n: number) {
  return `$${n.toFixed(2)}`;
}

function truncate(str: string, len: number) {
  if (!str) return '';
  const plain = str.replace(/<[^>]*>/g, '').trim();
  return plain.length > len ? plain.substring(0, len) + '...' : plain;
}

function variantSummary(variants: ScoutVariant[]): string {
  if (!variants.length) return 'Single variant';
  const colors = new Set(variants.map((v) => v.color).filter(Boolean));
  const sizes = new Set(variants.map((v) => v.size).filter(Boolean));
  const parts: string[] = [`${variants.length} variant${variants.length > 1 ? 's' : ''}`];
  if (colors.size > 0) parts.push(`${colors.size} color${colors.size > 1 ? 's' : ''}`);
  if (sizes.size > 0) parts.push(`${sizes.size} size${sizes.size > 1 ? 's' : ''}`);
  return parts.join(' \u00B7 ');
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ProductScoutPage() {
  const [activeTab, setActiveTab] = useState<'search' | 'catalog' | 'watchlist'>('search');

  const tabs = [
    { key: 'search' as const, label: 'Search CJ', icon: Search },
    { key: 'catalog' as const, label: 'Check My Catalog', icon: Package },
    { key: 'watchlist' as const, label: 'Watchlist', icon: Bookmark },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
          <Radar className="w-5 h-5 text-gold-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Scout</h1>
          <p className="text-sm text-gray-500">
            Search CJ&apos;s full catalog, check margins, and import products
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-gold-500 text-gold-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'search' && <SearchCJTab />}
      {activeTab === 'catalog' && <CatalogTab />}
      {activeTab === 'watchlist' && <WatchlistTab />}
    </div>
  );
}

// ─── Tab 1: Search CJ ──────────────────────────────────────────────────────

function SearchCJTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScoutProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<ScoutProduct | null>(null);
  const [importingPids, setImportingPids] = useState<Set<string>>(new Set());
  const [importResults, setImportResults] = useState<Record<string, any>>({});
  const [savingPids, setSavingPids] = useState<Set<string>>(new Set());
  const [savedPids, setSavedPids] = useState<Set<string>>(new Set());
  const [countryFilter, setCountryFilter] = useState('');
  const pageSize = 20;

  const handleSearch = useCallback(
    async (searchPage = 1) => {
      if (!query.trim()) return;
      setLoading(true);
      setError('');
      if (searchPage === 1) {
        setResults([]);
        setHasSearched(true);
      }

      try {
        const isPid = /^[A-Za-z0-9]{15,25}$/.test(query.trim());
        const res = await fetch('/api/admin/scout/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            isPid
              ? { pid: query.trim() }
              : { query: query.trim(), page: searchPage, pageSize, ...(countryFilter ? { countryCode: countryFilter } : {}) }
          ),
        });

        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.error || 'Search failed');

        if (searchPage === 1) {
          setResults(data.results || []);
        } else {
          setResults((prev) => [...prev, ...(data.results || [])]);
        }
        setTotal(data.total || 0);
        setPage(searchPage);
      } catch (err: any) {
        setError(err?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [query, countryFilter]
  );

  const handleImport = async (product: ScoutProduct) => {
    setImportingPids((prev) => new Set(prev).add(product.cj_pid));
    try {
      const res = await fetch('/api/admin/scout/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cj_pid: product.cj_pid, source: 'scout' }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setImportResults((prev) => ({ ...prev, [product.cj_pid]: data }));

      // Update the product's catalog status in results
      setResults((prev) =>
        prev.map((p) =>
          p.cj_pid === product.cj_pid
            ? {
                ...p,
                catalog_status: 'in_catalog' as const,
                existing_product_id: data.product_id,
                existing_product_slug: data.product_slug,
              }
            : p
        )
      );
    } catch (err: any) {
      setImportResults((prev) => ({
        ...prev,
        [product.cj_pid]: { error: err?.message },
      }));
    } finally {
      setImportingPids((prev) => {
        const next = new Set(prev);
        next.delete(product.cj_pid);
        return next;
      });
    }
  };

  const handleSaveToWatchlist = async (product: ScoutProduct) => {
    setSavingPids((prev) => new Set(prev).add(product.cj_pid));
    try {
      const res = await fetch('/api/admin/scout/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cj_pid: product.cj_pid,
          cj_product_name: product.name,
          cj_thumbnail: product.images[0] || null,
          cj_wholesale_price: product.wholesale_price,
          calculated_retail_price: product.retail_price,
          calculated_margin: product.margin_percent,
          us_stock_at_save: product.total_us_stock,
          variant_count: product.total_variants,
        }),
      });
      if (!res.ok) {
        const data = await safeJson(res);
        throw new Error(data.error || 'Failed to save');
      }
      setSavedPids((prev) => new Set(prev).add(product.cj_pid));
    } catch {
      // silently fail
    } finally {
      setSavingPids((prev) => {
        const next = new Set(prev);
        next.delete(product.cj_pid);
        return next;
      });
    }
  };

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            placeholder="Search CJ catalog... (e.g., portable blender, LED mirror, pet grooming)"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          />
        </div>
        <select
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          className="px-3 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
        >
          <option value="">All Countries</option>
          <option value="US">US Warehouse</option>
          <option value="CA">Canada</option>
          <option value="CN">China</option>
        </select>
        <button
          onClick={() => handleSearch(1)}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && results.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-20 bg-gray-100 rounded mb-4" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No products found for &ldquo;{query}&rdquo;</p>
          <p className="text-sm mt-1">Try different keywords or check CJ product ID directly.</p>
        </div>
      )}

      {/* Results Count */}
      {(() => {
        const filtered = countryFilter
          ? results.filter((p) => {
              if (countryFilter === 'US') return p.us_warehouse;
              if (countryFilter === 'CN') return !p.us_warehouse;
              return true;
            })
          : results;

        return (
          <>
            {filtered.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Showing {filtered.length} of ~{total} results
                {countryFilter && filtered.length !== results.length && (
                  <span className="text-gray-400"> ({results.length - filtered.length} filtered out)</span>
                )}
              </p>
            )}

            {hasSearched && !loading && results.length > 0 && filtered.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-lg font-medium">
                  None of these products are in {countryFilter === 'US' ? 'US warehouses' : countryFilter === 'CN' ? 'China warehouses' : 'the selected region'}.
                </p>
                <p className="text-sm mt-1">Try removing the country filter to see all results.</p>
              </div>
            )}

            {/* Results Grid */}
            {filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.cj_pid}
                    product={product}
                    onImport={() => handleImport(product)}
                    onSaveWatchlist={() => handleSaveToWatchlist(product)}
                    onQuickView={() => setQuickViewProduct(product)}
                    importing={importingPids.has(product.cj_pid)}
                    importResult={importResults[product.cj_pid]}
                    saving={savingPids.has(product.cj_pid)}
                    saved={savedPids.has(product.cj_pid) || product.watchlist_status === 'watching'}
                  />
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* Load More */}
      {results.length > 0 && results.length < total && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handleSearch(page + 1)}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load More Results
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onImport={() => handleImport(quickViewProduct)}
          onSaveWatchlist={() => handleSaveToWatchlist(quickViewProduct)}
          importing={importingPids.has(quickViewProduct.cj_pid)}
          importResult={importResults[quickViewProduct.cj_pid]}
          saving={savingPids.has(quickViewProduct.cj_pid)}
          saved={savedPids.has(quickViewProduct.cj_pid) || quickViewProduct.watchlist_status === 'watching'}
        />
      )}
    </div>
  );
}

// ─── Product Card ───────────────────────────────────────────────────────────

function ProductCard({
  product,
  onImport,
  onSaveWatchlist,
  onQuickView,
  importing,
  importResult,
  saving,
  saved,
}: {
  product: ScoutProduct;
  onImport: () => void;
  onSaveWatchlist: () => void;
  onQuickView: () => void;
  importing: boolean;
  importResult: any;
  saving: boolean;
  saved: boolean;
}) {
  const [showVariants, setShowVariants] = useState(false);
  const mc = marginColor(product.margin_percent);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}
        {product.images.length > 1 && (
          <span className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {product.images.length} photos
          </span>
        )}
        <button
          onClick={onQuickView}
          className="absolute bottom-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow transition-colors"
          title="Quick View"
        >
          <Eye className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Product Info */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Name */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{product.name}</h3>

        {/* PID */}
        <p className="text-[11px] text-gray-400 font-mono mb-1">PID: {product.cj_pid}</p>

        {/* Description preview */}
        {product.description && (
          <p className="text-xs text-gray-500 mb-2">{truncate(product.description, 100)}</p>
        )}

        {/* Variant summary */}
        <p className="text-xs text-gray-400 mb-1">{variantSummary(product.variants)}</p>

        {/* Weight */}
        {product.weight_grams > 0 && (
          <p className="text-xs text-gray-400 mb-3">
            Weight: {product.weight_oz} oz ({product.weight_grams}g)
          </p>
        )}

        {/* Pricing Breakdown */}
        <div className={`rounded-lg border ${mc.border} ${mc.bg} p-3 mb-3 text-xs font-mono`}>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">CJ Wholesale:</span>
            <span>{formatPrice(product.wholesale_price)}</span>
          </div>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">+ Shipping Est:</span>
            <span>{formatPrice(product.shipping_estimate)}</span>
          </div>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">+ Stripe Fees:</span>
            <span>{formatPrice(product.stripe_fee)}</span>
          </div>
          <div className="flex justify-between mb-1 pb-1 border-b border-gray-300/40">
            <span className="text-gray-600">= Total Cost:</span>
            <span className="font-semibold">{formatPrice(product.total_cost)}</span>
          </div>
          <div className="flex justify-between mb-0.5">
            <span className="font-semibold text-gray-800">Your Retail:</span>
            <span className="font-bold text-gray-900">{formatPrice(product.retail_price)}</span>
          </div>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">Profit/Sale:</span>
            <span className="font-semibold text-emerald-700">
              {formatPrice(product.profit_per_sale)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Margin:</span>
            <span className={`font-bold ${mc.text} px-1.5 py-0.5 rounded text-xs`}>
              {product.margin_percent.toFixed(1)}% {mc.label}
            </span>
          </div>
          {product.compare_at_price && (
            <div className="flex justify-between mt-1 pt-1 border-t border-gray-300/40">
              <span className="text-gray-500">Compare at:</span>
              <span className="text-gray-500 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            </div>
          )}
        </div>

        {/* Stock Badge */}
        <div className="mb-3">
          {product.us_warehouse && product.total_us_stock > 20 ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle className="w-4 h-4" />
              US Warehouse — {product.total_us_stock} in stock
            </div>
          ) : product.us_warehouse && product.total_us_stock > 0 ? (
            <div className="flex items-center gap-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
              Low Stock — {product.total_us_stock} remaining
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg">
              <XCircle className="w-4 h-4" />
              China Only
            </div>
          )}

          {/* Expandable variant stock */}
          {product.variants.length > 1 && (
            <button
              onClick={() => setShowVariants(!showVariants)}
              className="flex items-center gap-1 mt-1.5 text-xs text-gray-400 hover:text-gray-600"
            >
              {showVariants ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
              {product.total_variants} variants — stock details
            </button>
          )}
          {showVariants && (
            <div className="mt-2 max-h-40 overflow-y-auto text-xs border border-gray-100 rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1 font-medium text-gray-500">Variant</th>
                    <th className="text-right px-2 py-1 font-medium text-gray-500">US</th>
                    <th className="text-right px-2 py-1 font-medium text-gray-500">CN</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((v) => (
                    <tr key={v.vid} className="border-t border-gray-50">
                      <td className="px-2 py-1 text-gray-700">{v.name}</td>
                      <td className="px-2 py-1 text-right">
                        <span
                          className={v.us_stock > 0 ? 'text-emerald-600' : 'text-gray-400'}
                        >
                          {v.us_stock}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right text-gray-400">{v.cn_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Catalog Status Badge */}
        <div className="mb-3">
          {product.catalog_status === 'in_catalog' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-sm font-medium text-blue-700 mb-1">Already in Catalog</p>
              <div className="flex gap-3 text-xs">
                <a
                  href={`/product/${product.existing_product_slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  View in store &rarr;
                </a>
                <a
                  href={`/admin/products/edit/${product.existing_product_id}`}
                  className="text-blue-600 hover:underline"
                >
                  Edit in admin &rarr;
                </a>
              </div>
            </div>
          ) : product.catalog_status === 'hidden' ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
              <p className="text-sm font-medium text-gray-500">Previously Hidden</p>
            </div>
          ) : null}
        </div>

        {/* Import success message */}
        {importResult && !importResult.error && (
          <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
            <p className="font-semibold mb-1">Imported successfully!</p>
            <p>
              {importResult.variants_created} variants, {importResult.reviews_generated} reviews
            </p>
            <div className="flex gap-3 mt-1">
              <a
                href={importResult.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                View in store &rarr;
              </a>
              <a href={importResult.admin_url} className="text-emerald-600 hover:underline">
                Edit in admin &rarr;
              </a>
            </div>
          </div>
        )}

        {importResult?.error && (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-700">
            {importResult.error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          {product.catalog_status === 'not_in_catalog' && product.us_warehouse && (
            <button
              onClick={onImport}
              disabled={importing}
              className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import to Store
                </>
              )}
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={onSaveWatchlist}
              disabled={saving || saved}
              className={`flex-1 py-2 border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                saved
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              {saving ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : saved ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Bookmark className="w-3.5 h-3.5" />
              )}
              {saved ? 'On Watchlist' : 'Save to Watchlist'}
            </button>
            <a
              href={product.cj_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on CJ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Quick View Modal ───────────────────────────────────────────────────────

function QuickViewModal({
  product,
  onClose,
  onImport,
  onSaveWatchlist,
  importing,
  importResult,
  saving,
  saved,
}: {
  product: ScoutProduct;
  onClose: () => void;
  onImport: () => void;
  onSaveWatchlist: () => void;
  importing: boolean;
  importResult: any;
  saving: boolean;
  saved: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [sliderPrice, setSliderPrice] = useState(product.retail_price);
  const mc = marginColor(product.margin_percent);

  // Margin calculator
  const baseCost = product.wholesale_price + product.shipping_estimate;
  const stripeFeeAtSlider = sliderPrice * 0.029 + 0.3;
  const totalCostAtSlider = baseCost + stripeFeeAtSlider;
  const profitAtSlider = sliderPrice - totalCostAtSlider;
  const marginAtSlider = sliderPrice > 0 ? (profitAtSlider / sliderPrice) * 100 : 0;
  const sliderMc = marginColor(marginAtSlider);

  // Price range for slider
  const minPrice = Math.max(totalCostAtSlider + 1, product.wholesale_price);
  const maxPrice = product.retail_price * 3;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl max-w-5xl w-full my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{product.name}</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Left — Images */}
          <div className="lg:w-1/2 p-6">
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon className="w-20 h-20" />
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === i ? 'border-gold-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="lg:w-1/2 p-6 lg:border-l border-gray-200 overflow-y-auto max-h-[80vh]">
            {/* Full description */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
              <div
                className="text-sm text-gray-600 prose prose-sm max-h-32 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: product.description || '<em>No description</em>',
                }}
              />
            </div>

            {/* Variant table */}
            {product.variants.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Variants ({product.variants.length})
                </h3>
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Variant</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Color</th>
                        <th className="text-left px-3 py-2 font-medium text-gray-500">Size</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-500">CJ Price</th>
                        <th className="text-right px-3 py-2 font-medium text-gray-500">US Stock</th>
                        <th className="text-center px-3 py-2 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr key={v.vid} className="border-t border-gray-100">
                          <td className="px-3 py-2 text-gray-700">{v.name}</td>
                          <td className="px-3 py-2 text-gray-500">{v.color || '—'}</td>
                          <td className="px-3 py-2 text-gray-500">{v.size || '—'}</td>
                          <td className="px-3 py-2 text-right">{formatPrice(v.price)}</td>
                          <td className="px-3 py-2 text-right">{v.us_stock}</td>
                          <td className="px-3 py-2 text-center">
                            {v.us_stock > 0 ? (
                              <span className="text-emerald-600">In Stock</span>
                            ) : (
                              <span className="text-gray-400">Out of Stock</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Full pricing breakdown */}
            <div className={`rounded-lg border ${mc.border} ${mc.bg} p-4 mb-4`}>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pricing Breakdown</h3>
              <div className="text-sm font-mono space-y-1">
                <div className="flex justify-between">
                  <span>CJ Wholesale:</span>
                  <span>{formatPrice(product.wholesale_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Shipping Est:</span>
                  <span>{formatPrice(product.shipping_estimate)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Stripe Fees:</span>
                  <span>{formatPrice(product.stripe_fee)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-gray-300/40 pt-1">
                  <span>= Total Cost:</span>
                  <span>{formatPrice(product.total_cost)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-gray-300/40 pt-1">
                  <span>Your Retail:</span>
                  <span>{formatPrice(product.retail_price)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700">
                  <span>Profit/Sale:</span>
                  <span>{formatPrice(product.profit_per_sale)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Margin:</span>
                  <span className={`font-bold ${mc.text}`}>
                    {product.margin_percent.toFixed(1)}% — {mc.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Margin Calculator Slider */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Margin Calculator</h3>
              <input
                type="range"
                min={Math.floor(minPrice)}
                max={Math.ceil(maxPrice)}
                step={0.5}
                value={sliderPrice}
                onChange={(e) => setSliderPrice(parseFloat(e.target.value))}
                className="w-full accent-gold-500 mb-2"
              />
              <div className={`text-sm ${sliderMc.text} ${sliderMc.bg} rounded-lg p-3 border ${sliderMc.border}`}>
                <p>
                  If you price at <strong>{formatPrice(sliderPrice)}</strong> &rarr; margin is{' '}
                  <strong>{marginAtSlider.toFixed(1)}%</strong> &rarr; profit per sale is{' '}
                  <strong>{formatPrice(profitAtSlider)}</strong>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {product.catalog_status === 'not_in_catalog' && product.us_warehouse && (
                <button
                  onClick={onImport}
                  disabled={importing}
                  className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Import to Store
                    </>
                  )}
                </button>
              )}

              {importResult && !importResult.error && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  <p className="font-semibold">Imported! {importResult.variants_created} variants, {importResult.reviews_generated} reviews</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={onSaveWatchlist}
                  disabled={saving || saved}
                  className={`flex-1 py-2 border rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    saved
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-600 cursor-default'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {saved ? <CheckCircle className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                  {saved ? 'On Watchlist' : 'Save to Watchlist'}
                </button>
                <a
                  href={product.cj_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on CJ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: Check My Catalog ────────────────────────────────────────────────

function CatalogTab() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const pageSize = 20;

  const handleSearch = useCallback(
    async (searchPage = 1) => {
      if (!query.trim()) return;
      setLoading(true);
      setError('');
      if (searchPage === 1) {
        setResults([]);
        setHasSearched(true);
      }

      try {
        const res = await fetch('/api/admin/scout/catalog-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim(), page: searchPage, pageSize }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.error || 'Search failed');

        if (searchPage === 1) {
          setResults(data.results || []);
        } else {
          setResults((prev) => [...prev, ...(data.results || [])]);
        }
        setTotal(data.total || 0);
        setPage(searchPage);
      } catch (err: any) {
        setError(err?.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [query]
  );

  return (
    <div>
      {/* Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
            placeholder="Search your catalog... (e.g., portable blender, LED mirror)"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
          />
        </div>
        <button
          onClick={() => handleSearch(1)}
          disabled={loading || !query.trim()}
          className="px-6 py-3 bg-gold-500 hover:bg-gold-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && results.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {hasSearched && !loading && results.length === 0 && !error && (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">Product not found in your catalog</p>
          <p className="text-sm mt-1">
            Switch to &ldquo;Search CJ&rdquo; tab to check if CJ carries it.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <p className="text-sm text-gray-500 mb-4">
          Showing {results.length} of {total} results
        </p>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((product) => (
          <CatalogCard key={product.id} product={product} />
        ))}
      </div>

      {/* Load More */}
      {results.length > 0 && results.length < total && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => handleSearch(page + 1)}
            disabled={loading}
            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}

function CatalogCard({ product }: { product: CatalogProduct }) {
  const mc = marginColor(product.margin_percent);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
      {/* Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-2"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageIcon className="w-16 h-16" />
          </div>
        )}
        {/* Status badge */}
        <span
          className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${
            product.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : product.status === 'hidden'
                ? 'bg-gray-100 text-gray-500'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {product.status}
        </span>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{product.name}</h3>

        {product.category_name && (
          <p className="text-xs text-gray-400 mb-2">{product.category_name}</p>
        )}

        {/* Pricing */}
        <div className={`rounded-lg border ${mc.border} ${mc.bg} p-3 mb-3 text-xs font-mono`}>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">Retail:</span>
            <span className="font-bold">{formatPrice(product.retail_price)}</span>
          </div>
          <div className="flex justify-between mb-0.5">
            <span className="text-gray-600">CJ Cost:</span>
            <span>{formatPrice(product.cj_price)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Margin:</span>
            <span className={`font-bold ${mc.text}`}>
              {product.margin_percent?.toFixed(1)}% — {formatPrice(product.margin_dollars)}
            </span>
          </div>
        </div>

        {/* Stock & Reviews */}
        <div className="flex items-center gap-3 mb-3 text-xs text-gray-500">
          <span>Stock: {product.stock_count}</span>
          <span>{product.warehouse} warehouse</span>
          {product.review_count > 0 && (
            <span>
              {product.average_rating} ({product.review_count} reviews)
            </span>
          )}
        </div>

        {/* Links */}
        <div className="mt-auto flex gap-2">
          <a
            href={product.store_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors text-center"
          >
            View Live &rarr;
          </a>
          <a
            href={product.admin_url}
            className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors text-center"
          >
            Edit in Admin &rarr;
          </a>
          {product.cj_url && (
            <a
              href={product.cj_url}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 3: Watchlist ───────────────────────────────────────────────────────

function WatchlistTab() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('watching');
  const [sortBy, setSortBy] = useState('created_at');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const noteInputRef = useRef<HTMLInputElement>(null);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        status: statusFilter,
        sort: sortBy,
        order: sortBy === 'margin' ? 'desc' : 'desc',
      });
      const res = await fetch(`/api/admin/scout/watchlist?${params}`);
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setItems(data.items || []);
      setHasLoaded(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to load watchlist');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortBy]);

  // Auto-fetch on mount and when filter/sort changes
  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handleRefreshStock = async (item: WatchlistItem) => {
    setRefreshingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await fetch('/api/admin/scout/watchlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, refresh_stock: true }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.item : i)));
    } catch {
      // silently fail
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDismiss = async (item: WatchlistItem) => {
    try {
      await fetch('/api/admin/scout/watchlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, status: 'dismissed' }),
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      // silently fail
    }
  };

  const handleRemove = async (item: WatchlistItem) => {
    try {
      await fetch(`/api/admin/scout/watchlist?id=${item.id}`, { method: 'DELETE' });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
    } catch {
      // silently fail
    }
  };

  const handleImport = async (item: WatchlistItem) => {
    setImportingIds((prev) => new Set(prev).add(item.id));
    try {
      const res = await fetch('/api/admin/scout/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cj_pid: item.cj_pid, source: 'watchlist' }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'imported', imported_product_id: data.product_id }
            : i
        )
      );
    } catch {
      // silently fail
    } finally {
      setImportingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleSaveNote = async (item: WatchlistItem) => {
    try {
      await fetch('/api/admin/scout/watchlist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, notes: noteText }),
      });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, notes: noteText } : i)));
      setEditingNoteId(null);
    } catch {
      // silently fail
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
          >
            <option value="watching">Watching</option>
            <option value="imported">Imported</option>
            <option value="dismissed">Dismissed</option>
            <option value="all">All</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Sort:</label>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-500/30"
          >
            <option value="created_at">Date Added</option>
            <option value="margin">Margin (High to Low)</option>
            <option value="price">Wholesale Price</option>
          </select>
        </div>
        <button
          onClick={fetchWatchlist}
          disabled={loading}
          className="ml-auto text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !hasLoaded && (
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {hasLoaded && items.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <Bookmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-lg font-medium">No items in watchlist</p>
          <p className="text-sm mt-1">
            Save products from the Search CJ tab to track them here.
          </p>
        </div>
      )}

      {/* Watchlist Table */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 w-12"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Wholesale</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Retail</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Margin</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">US Stock</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Variants</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Added</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Notes</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const mc = marginColor(item.calculated_margin);
                  return (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        {item.cj_thumbnail ? (
                          <img
                            src={item.cj_thumbnail}
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">
                          {item.cj_product_name}
                        </p>
                        {item.status === 'imported' && item.imported_product_id && (
                          <a
                            href={`/admin/products/edit/${item.imported_product_id}`}
                            className="text-xs text-emerald-600 hover:underline"
                          >
                            Imported &rarr;
                          </a>
                        )}
                        {item.us_stock_at_save === 0 && item.status === 'watching' && (
                          <span className="text-xs text-amber-600 font-medium">Stock Alert</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {formatPrice(item.cj_wholesale_price)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatPrice(item.calculated_retail_price)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`${mc.text} font-semibold`}>
                          {item.calculated_margin?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {item.us_stock_at_save ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {item.variant_count ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        {editingNoteId === item.id ? (
                          <div className="flex gap-1">
                            <input
                              ref={noteInputRef}
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleSaveNote(item)}
                              className="flex-1 text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-gold-500"
                              placeholder="Add a note..."
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveNote(item)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(item.id);
                              setNoteText(item.notes || '');
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 truncate block max-w-full text-left"
                          >
                            {item.notes || (
                              <span className="text-gray-300 flex items-center gap-1">
                                <Pencil className="w-3 h-3" /> Add note
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {item.status === 'watching' && (
                            <>
                              <button
                                onClick={() => handleImport(item)}
                                disabled={importingIds.has(item.id)}
                                className="px-2 py-1 bg-gold-500 hover:bg-gold-600 text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
                                title="Import Now"
                              >
                                {importingIds.has(item.id) ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  'Import'
                                )}
                              </button>
                              <button
                                onClick={() => handleRefreshStock(item)}
                                disabled={refreshingIds.has(item.id)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Refresh Stock"
                              >
                                <RefreshCw
                                  className={`w-3.5 h-3.5 text-gray-400 ${
                                    refreshingIds.has(item.id) ? 'animate-spin' : ''
                                  }`}
                                />
                              </button>
                              <button
                                onClick={() => handleDismiss(item)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Dismiss"
                              >
                                <XCircle className="w-3.5 h-3.5 text-gray-400" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleRemove(item)}
                            className="p-1 hover:bg-red-50 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
