'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  RefreshCw,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  ChevronDown,
  Copy,
  Sparkles,
} from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { toast } from 'sonner';
import { PolishModal } from '@/components/admin/PolishModal';

interface AdminProductRow {
  id: string;
  cj_pid: string | null;
  digital_file_path?: string | null;
  name: string;
  slug: string;
  mi_categories?: { name?: string | null; slug?: string | null } | null;
  mi_product_variants?: Array<{ count: number }> | null;
  cj_price: number | null;
  shipping_cost: number | null;
  shipping_days?: string | null;
  retail_price: number | null;
  margin_percent: number | null;
  markup_multiplier: number | null;
  stock_count: number | null;
  warehouse: 'US' | 'CN' | 'CA' | null;
  rating: number | null;
  average_rating?: number | null;
  review_count?: number | null;
  shipping_estimate?: string | null;
  status:
    | 'active'
    | 'inactive'
    | 'out_of_stock'
    | 'low_stock'
    | 'pending'
    | 'hidden'
    | 'paid'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'unfulfilled'
    | 'refunded'
    | 'paused'
    | 'ended'
    | 'draft';
  images: string[] | null;
  description?: string | null;
}

/** Detect digital product even when digital_file_path is null (e.g. upload failed) */
function isDigital(p: AdminProductRow): boolean {
  return !!(
    p.digital_file_path ||
    p.mi_categories?.slug === 'digital-downloads' ||
    (!p.cj_pid && !p.warehouse && p.stock_count === 9999)
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
  const [warehouseFilter, setWarehouseFilter] = useState<'all' | 'US' | 'CN' | 'CA'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>(
    []
  );
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [copiedPid, setCopiedPid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 25;
  const [syncing, setSyncing] = useState(false);
  const [resyncing, setResyncing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [verifyPid, setVerifyPid] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyData, setVerifyData] = useState<any>(null);
  const [verifyStockLoading, setVerifyStockLoading] = useState(false);
  const [verifyStockQty, setVerifyStockQty] = useState<number | null>(null);
  const [verifyStockError, setVerifyStockError] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<AdminProductRow | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [generatingReviews, setGeneratingReviews] = useState<string | null>(null);
  const [polishProduct, setPolishProduct] = useState<any>(null);
  const handleSync = async () => {
    setSyncing(true);
    await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse: warehouseFilter }),
    });
    setSyncing(false);
    setSearchQuery('');
    setRefreshKey((key) => key + 1);
  };

  const handleResync = async () => {
    const confirmResync = window.confirm(
      'This will delete all products and re-sync from CJ. Continue?'
    );
    if (!confirmResync) return;

    setResyncing(true);
    await fetch('/api/admin/resync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ warehouse: warehouseFilter }),
    });
    setResyncing(false);
    setSearchQuery('');
    setRefreshKey((key) => key + 1);
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', pageSize.toString());
        if (searchQuery) params.set('search', searchQuery);
        if (warehouseFilter !== 'all') params.set('warehouse', warehouseFilter);
        if (categoryFilter !== 'all') params.set('category', categoryFilter);
        if (statusFilter !== 'all') params.set('status', statusFilter);

        const response = await fetch(`/api/admin/products?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = await response.json();

        if (response.ok) {
          setProducts(data.products || []);
          setTotal(data.total || 0);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      controller.abort();
    };
  }, [searchQuery, warehouseFilter, categoryFilter, statusFilter, page, refreshKey]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, warehouseFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    const handleRefresh = () => setRefreshKey((key) => key + 1);
    window.addEventListener('mi:products:refresh', handleRefresh);
    return () => window.removeEventListener('mi:products:refresh', handleRefresh);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const filteredProducts =
    warehouseFilter === 'all'
      ? products
      : products.filter((product) => product.warehouse === warehouseFilter);

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    switch (sortField) {
      case 'name':
        aVal = (a.name || '').toLowerCase();
        bVal = (b.name || '').toLowerCase();
        break;
      case 'category':
        aVal = (a.mi_categories?.name || 'zzz').toLowerCase();
        bVal = (b.mi_categories?.name || 'zzz').toLowerCase();
        break;
      case 'cj_price':
        aVal = Number(a.cj_price || 0) + Number(a.shipping_cost || 0);
        bVal = Number(b.cj_price || 0) + Number(b.shipping_cost || 0);
        break;
      case 'retail_price':
        aVal = Number(a.retail_price || 0);
        bVal = Number(b.retail_price || 0);
        break;
      case 'margin_percent':
        aVal = Number(a.margin_percent || 0);
        bVal = Number(b.margin_percent || 0);
        break;
      case 'availability':
      case 'status':
        aVal = a.status || '';
        bVal = b.status || '';
        break;
      case 'warehouse':
        aVal = a.warehouse || '';
        bVal = b.warehouse || '';
        break;
      case 'rating':
        aVal = Number(a.rating || 0);
        bVal = Number(b.rating || 0);
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortableHeader = ({
    field,
    label,
    align = 'left',
  }: {
    field: string;
    label: string;
    align?: 'left' | 'right';
  }) => (
    <th
      className={`text-${align} py-3 px-4 text-[11px] font-semibold uppercase tracking-wider cursor-pointer select-none ${
        sortField === field ? 'text-gray-700' : 'text-gray-500'
      }`}
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (
          <ChevronDown
            className={`w-3 h-3 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`}
          />
        ) : (
          <ChevronDown className="w-3 h-3 opacity-30" />
        )}
      </span>
    </th>
  );

  const handleSelectAll = () => {
    if (selectedIds.length === sortedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedProducts.map((p) => p.id));
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleStartEditPrice = (product: AdminProductRow) => {
    setEditingPriceId(product.id);
    setEditPrice(String(product.retail_price || ''));
  };

  const handleSavePrice = async (productId: string) => {
    const newPrice = parseFloat(editPrice);
    if (!isNaN(newPrice) && newPrice > 0) {
      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, retail_price: newPrice }),
      });

      if (response.ok) {
        const { product: updated } = await response.json();
        setProducts((prev) => prev.map((item) => (item.id === productId ? updated : item)));
      }
    }
    setEditingPriceId(null);
  };

  const handleDelete = async (productId: string, productName: string) => {
    const confirmed = window.confirm(`Delete ${productName}?`);
    if (!confirmed) return;

    const response = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId }),
    });

    if (response.ok) {
      setProducts((prev) => prev.filter((item) => item.id !== productId));
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    }
  };

  const handleStatusChange = async (productId: string, status: 'active' | 'pending' | 'hidden') => {
    const response = await fetch('/api/admin/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: productId, status }),
    });

    if (response.ok) {
      const { product: updated } = await response.json();
      setProducts((prev) => prev.map((item) => (item.id === productId ? updated : item)));
    }
    setStatusMenuId(null);
  };

  const handleBulkStatus = async (status: 'active' | 'hidden') => {
    await Promise.all(
      selectedIds.map((id) =>
        fetch('/api/admin/products', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        })
      )
    );
    setRefreshKey((key) => key + 1);
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    const confirmed = window.confirm('Delete selected products?');
    if (!confirmed) return;

    await Promise.all(
      selectedIds.map((id) =>
        fetch('/api/admin/products', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      )
    );
    setRefreshKey((key) => key + 1);
    setSelectedIds([]);
  };

  const handleCopyPid = async (pid: string) => {
    try {
      await navigator.clipboard.writeText(pid);
      setCopiedPid(pid);
      toast.success('PID copied!');
      setTimeout(() => setCopiedPid(null), 1500);
    } catch {
      // ignore clipboard failures
    }
  };

  const handleGenerateReviews = async (productId: string) => {
    setGeneratingReviews(productId);
    try {
      const response = await fetch('/api/admin/products/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to generate reviews');
      }

      toast.success(
        `Generated ${data.generated} reviews (${data.totalReviews} total, ${data.averageRating} avg)`
      );

      // Update local state with new review stats
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, review_count: data.totalReviews, average_rating: data.averageRating }
            : p
        )
      );

      // Update preview modal if open
      if (previewProduct?.id === productId) {
        setPreviewProduct((prev) =>
          prev
            ? { ...prev, review_count: data.totalReviews, average_rating: data.averageRating }
            : prev
        );
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate reviews');
    } finally {
      setGeneratingReviews(null);
    }
  };

  const handleVerifyOnCJ = async (pid: string | null) => {
    if (!pid) {
      setVerifyError('Product no longer available on CJ');
      return;
    }
    setVerifyPid(pid);
    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyData(null);
    setVerifyStockLoading(true);
    setVerifyStockQty(null);
    setVerifyStockError(null);
    try {
      const response = await fetch(`/api/admin/verify-product?pid=${encodeURIComponent(pid)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'CJ lookup failed');
      }
      setVerifyData(data);

      const inventories = data?.stock?.inventories || [];
      const usStock = inventories.find(
        (inv: any) => inv.countryCode === 'US' && inv.totalInventoryNum >= 0
      );
      if (data?.stockError) {
        setVerifyStockError(data.stockError);
        setVerifyStockQty(null);
      } else if (usStock && typeof usStock.totalInventoryNum === 'number') {
        setVerifyStockQty(usStock.totalInventoryNum);
      } else {
        setVerifyStockQty(0);
      }
    } catch (error: any) {
      setVerifyError(error?.message || 'Product no longer available on CJ');
    } finally {
      setVerifyLoading(false);
      setVerifyStockLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewProduct(null);
      }
    };
    if (previewProduct) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => document.removeEventListener('keydown', handleEscape);
  }, [previewProduct]);

  const preview = previewProduct;
  const previewImages = preview?.images ?? [];
  const previewPrimaryImage =
    previewImages[previewImageIndex] || previewImages[0] || '/placeholder.svg';
  const verifyDetail = verifyData?.data || null;
  const verifyName = verifyDetail?.productNameEn || verifyDetail?.productName || 'Unknown product';
  const verifyPrice = verifyDetail?.sellPrice || verifyDetail?.productSellPrice || 'N/A';
  const verifyStatusRaw = verifyDetail?.status;
  const verifyIsActive = String(verifyStatusRaw) === '3';
  const verifyImageSetCount = Array.isArray(verifyDetail?.productImageSet)
    ? verifyDetail.productImageSet.length
    : 0;
  const verifyVariantCount = Array.isArray(verifyDetail?.variants)
    ? verifyDetail.variants.length
    : 0;

  return (
    <>
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Products</h1>
          <div className="flex gap-3">
            <button
              onClick={handleSync}
              disabled={syncing || resyncing}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync CJ'}
            </button>
            <button
              onClick={handleResync}
              disabled={syncing || resyncing}
              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
            >
              {resyncing ? 'Re-syncing...' : 'Re-sync All'}
            </button>
            <Link
              href="/admin/products/add"
              className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Link>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Manage your product catalog · {total} products
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="search"
              placeholder="Search by name, SKU, or CJ ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="hidden">Deactivated</option>
          </select>
          <select
            value={warehouseFilter}
            onChange={(event) =>
              setWarehouseFilter(event.target.value as 'all' | 'US' | 'CN' | 'CA')
            }
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <option value="all">All Warehouses</option>
            <option value="US">US Warehouse</option>
            <option value="CN">China Warehouse</option>
            <option value="CA">Canada Warehouse</option>
          </select>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-gold-500/10 border border-gold-500/30 rounded-lg px-6 py-4 mb-6 flex items-center justify-between">
          <span className="text-sm font-semibold text-gold-500">
            {selectedIds.length} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={() => handleBulkStatus('active')}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkStatus('hidden')}
              className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Deactivate
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-danger hover:bg-danger/90 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="py-3 px-4 w-12">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length === sortedProducts.length && sortedProducts.length > 0
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                  />
                </th>
                <SortableHeader field="name" label="Product" />
                <SortableHeader field="category" label="Category" />
                <SortableHeader field="cj_price" label="CJ Cost + Ship" />
                <SortableHeader field="retail_price" label="Retail Price" align="right" />
                <SortableHeader field="margin_percent" label="Margin" align="right" />
                <SortableHeader field="availability" label="Availability" align="right" />
                <SortableHeader field="warehouse" label="Warehouse" />
                <SortableHeader field="rating" label="Rating" />
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Reviews
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Shipping
                </th>
                <SortableHeader field="status" label="Status" />
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => handleSelect(product.id)}
                      className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500"
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                        <img
                          src={product.images?.[0] || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold text-[#1a1a2e] line-clamp-1 hover:text-gold-500"
                        >
                          {product.name}
                        </Link>
                        {!product.review_count && product.cj_pid && (
                          <span className="text-[11px] text-amber-500 font-medium">Needs polish</span>
                        )}
                        {product.cj_pid ? (
                          <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-500">
                            <button
                              type="button"
                              onClick={() => handleCopyPid(product.cj_pid!)}
                              className="inline-flex items-center gap-1 font-mono underline decoration-dotted underline-offset-2 hover:text-gold-500"
                              title="Copy CJ PID"
                            >
                              {product.cj_pid}
                              <Copy className="w-3 h-3" />
                            </button>
                            {copiedPid === product.cj_pid && (
                              <span className="text-[11px] text-success">PID copied!</span>
                            )}
                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setPreviewImageIndex(0);
                              }}
                              className="ml-2 p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gold-500 transition-colors"
                              title="Preview product"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleVerifyOnCJ(product.cj_pid)}
                              className="ml-2 px-2 py-1 text-xs font-semibold text-gold-500 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                              Verify
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1 inline-flex items-center gap-2 text-xs text-gray-500">
                            {isDigital(product) && (
                              <span className="text-violet-600 font-medium">Digital product</span>
                            )}
                            <button
                              onClick={() => {
                                setPreviewProduct(product);
                                setPreviewImageIndex(0);
                              }}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gold-500 transition-colors"
                              title="Preview product"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {product.mi_categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    {isDigital(product) ? (
                      <span className="text-xs text-gray-400">N/A</span>
                    ) : (
                      <div className="text-sm">
                        <p className="text-[#1a1a2e] font-semibold font-variant-tabular">
                          ${Number(product.cj_price || 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 font-variant-tabular">
                          + ${Number(product.shipping_cost || 0).toFixed(2)} ship
                        </p>
                        <p className="text-xs text-gray-400 font-variant-tabular">
                          = ${(Number(product.cj_price || 0) + Number(product.shipping_cost || 0)).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {editingPriceId === product.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        onBlur={() => handleSavePrice(product.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSavePrice(product.id);
                          if (e.key === 'Escape') setEditingPriceId(null);
                        }}
                        autoFocus
                        className="w-24 px-2 py-1 bg-white border border-gold-500 rounded text-sm text-[#1a1a2e] text-right font-variant-tabular focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-semibold text-gold-500 font-variant-tabular">
                          ${Number(product.retail_price || 0).toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleStartEditPrice(product)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-sm font-semibold ${
                        Number(product.margin_percent || 0) >= 55
                          ? 'text-success'
                          : Number(product.margin_percent || 0) >= 45
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {Number(product.margin_percent || 0).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-sm">
                    {product.status === 'active' ? (
                      <span className="text-emerald-600 font-medium">In Stock</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {isDigital(product) ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 text-violet-700 border border-violet-200 rounded-md text-xs font-semibold">
                        Digital
                      </span>
                    ) : product.warehouse === 'US' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-success/10 text-success border border-success/30 rounded-md text-xs font-semibold">
                        🇺🇸 US
                      </span>
                    ) : product.warehouse === 'CA' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-info/10 text-info border border-info/30 rounded-md text-xs font-semibold">
                        🇨🇦 CA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-warning/10 text-warning border border-warning/30 rounded-md text-xs font-semibold">
                        🇨🇳 CN
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    {Number(product.average_rating || product.rating || 0) > 0 ? (
                      <div className="flex items-center gap-1">
                        <StarRating
                          rating={Number(product.average_rating || product.rating)}
                          size="sm"
                        />
                        <span className="text-xs text-gray-400 ml-1">
                          {Number(product.average_rating || product.rating).toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No reviews</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs text-gray-500">
                      {product.review_count ? `${product.review_count} reviews` : '—'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs text-gray-500">
                      {isDigital(product)
                        ? 'Instant'
                        : product.shipping_estimate || product.shipping_days || '—'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="relative">
                      <button
                        onClick={() =>
                          setStatusMenuId((prev) => (prev === product.id ? null : product.id))
                        }
                      >
                        <StatusBadge status={product.status} />
                      </button>
                      {statusMenuId === product.id && (
                        <div className="absolute z-10 mt-2 w-32 rounded-lg border border-gray-200 bg-white shadow-lg">
                          {(['active', 'pending', 'hidden'] as const).map((status) => (
                            <button
                              key={status}
                              onClick={() => handleStatusChange(product.id, status)}
                              className="w-full px-3 py-2 text-left text-xs text-gray-700 hover:bg-gray-50"
                            >
                              <StatusBadge status={status} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1">
                      {product.cj_pid && (
                        <button
                          onClick={() => setPolishProduct({
                            id: product.id,
                            name: product.name,
                            description: product.description || '',
                            category_id: categories.find(c => c.slug === (product.mi_categories?.slug || ''))?.id || '',
                            category_slug: product.mi_categories?.slug || '',
                            retail_price: Number(product.retail_price || 0),
                            images: product.images || [],
                            review_count: product.review_count || 0,
                          })}
                          className="p-2 hover:bg-violet-50 rounded-lg transition-colors"
                          title="Polish with AI"
                        >
                          <Sparkles className="w-4 h-4 text-violet-500" />
                        </button>
                      )}
                      <Link
                        href={`/admin/products/edit/${product.id}`}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit product"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="p-2 hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {loading
              ? 'Loading products...'
              : `Showing ${total === 0 ? 0 : (page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} products`}
          </p>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {verifyPid && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1a1a2e]">Verify on CJ</h3>
              <button
                onClick={() => {
                  setVerifyPid(null);
                  setVerifyError(null);
                  setVerifyData(null);
                  setVerifyStockQty(null);
                  setVerifyStockError(null);
                }}
                className="text-gray-500 hover:text-[#1a1a2e]"
              >
                ×
              </button>
            </div>

            {verifyLoading ? (
              <div className="flex items-center gap-3 text-gray-500">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Checking CJ product details...
              </div>
            ) : verifyError ? (
              <div className="text-danger font-semibold">Product no longer available on CJ</div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="text-[#1a1a2e] font-semibold">{verifyName}</div>
                <div>Wholesale Price: {verifyPrice}</div>
                <div>Images: {verifyImageSetCount}</div>
                <div>Variants: {verifyVariantCount}</div>
                <div>
                  Status:{' '}
                  <span className={verifyIsActive ? 'text-success' : 'text-danger'}>
                    {verifyIsActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  US Stock:{' '}
                  {verifyStockLoading ? (
                    <span className="text-gray-500">Checking...</span>
                  ) : verifyStockError ? (
                    <span className="text-amber-600">Stock check failed</span>
                  ) : (
                    <span
                      className={(verifyStockQty || 0) > 0 ? 'text-success' : 'text-danger'}
                    >
                      {verifyStockQty ?? 0} units
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {preview ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setPreviewProduct(null)}
        >
          <div
            className="bg-white border border-gray-200 rounded-2xl w-full max-w-4xl p-6 shadow-xl max-h-[85vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-2xl font-semibold text-[#1a1a2e]">{preview.name}</h3>
                <p className="text-sm text-gray-500">
                  {preview.mi_categories?.name || 'Uncategorized'}
                </p>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="text-gray-500 hover:text-[#1a1a2e]"
              >
                ×
              </button>
            </div>

            <div className="grid lg:grid-cols-[420px_1fr] gap-6">
              <div>
                <div className="w-full h-[400px] rounded-xl bg-gray-100 overflow-hidden">
                  <img
                    src={previewPrimaryImage}
                    alt={preview.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {previewImages.map((image: string, index: number) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setPreviewImageIndex(index)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border ${
                        previewImageIndex === index
                          ? 'border-gold-500'
                          : 'border-gray-200'
                      }`}
                    >
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-sm text-gray-700 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#1a1a2e] mb-2">Description</h4>
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{
                      __html: preview.description || '<p>No description available.</p>',
                    }}
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {isDigital(preview) ? (
                    <>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="text-violet-600 font-semibold">Digital Download</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retail Price</p>
                        <p className="text-gold-400 font-semibold">
                          ${Number(preview.retail_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Margin</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          {Number(preview.margin_percent || 0).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Delivery</p>
                        <p className="text-[#1a1a2e] font-semibold">Instant</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="text-[#1a1a2e] font-semibold">{preview.status}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-500">CJ Wholesale Price</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          ${Number(preview.cj_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Shipping Cost</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          ${Number(preview.shipping_cost || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Retail Price</p>
                        <p className="text-gold-400 font-semibold">
                          ${Number(preview.retail_price || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Margin</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          {Number(preview.margin_percent || 0).toFixed(0)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Warehouse</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          {preview.warehouse || 'CN'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Variants</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          {preview.mi_product_variants?.[0]?.count ?? 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Stock</p>
                        <p className="text-[#1a1a2e] font-semibold">
                          {Number(preview.stock_count || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="text-[#1a1a2e] font-semibold">{preview.status}</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href={`/product/${preview.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    View Storefront Page
                  </Link>
                  <button
                    onClick={() => handleStartEditPrice(preview)}
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Edit Price
                  </button>
                  <button
                    onClick={() =>
                      handleStatusChange(
                        preview.id,
                        preview.status === 'active' ? 'hidden' : 'active'
                      )
                    }
                    className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    {preview.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  {preview.cj_pid && (
                    <button
                      onClick={() => handleVerifyOnCJ(preview.cj_pid)}
                      className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors"
                    >
                      Verify on CJ
                    </button>
                  )}
                  <button
                    onClick={() => handleGenerateReviews(preview.id)}
                    disabled={generatingReviews === preview.id}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
                  >
                    <Sparkles
                      className={`w-4 h-4 ${generatingReviews === preview.id ? 'animate-pulse' : ''}`}
                    />
                    {generatingReviews === preview.id ? 'Generating...' : 'Generate Reviews'}
                  </button>
                  {preview.cj_pid && (
                    <button
                      onClick={() => {
                        setPreviewProduct(null);
                        setPolishProduct({
                          id: preview.id,
                          name: preview.name,
                          description: preview.description || '',
                          category_id: categories.find(c => c.slug === (preview.mi_categories?.slug || ''))?.id || '',
                          category_slug: preview.mi_categories?.slug || '',
                          retail_price: Number(preview.retail_price || 0),
                          images: preview.images || [],
                          review_count: preview.review_count || 0,
                        });
                      }}
                      className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Polish This Product
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <PolishModal
        product={polishProduct}
        categories={categories}
        isOpen={!!polishProduct}
        onClose={() => setPolishProduct(null)}
        onPolished={() => { setPolishProduct(null); setRefreshKey((key) => key + 1); }}
      />
    </>
  );
}
