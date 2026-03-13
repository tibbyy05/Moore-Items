'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles,
  Search,
  Link2,
  PenLine,
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  ImagePlus,
  X,
  DollarSign,
  FileUp,
  Check,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import AutoImportPanel from '@/components/admin/AutoImportPanel';
import ProductScoutPanel from '@/components/admin/ProductScoutPanel';
import { polishProductWithAI } from '@/lib/ai/product-enrichment';

// ─── Tab 3: Paste URL / PID ─────────────────────────────────────────────────

function extractPid(raw: string): string {
  const trimmed = raw.trim();

  // CJ Dropshipping URL — extract PID from "-p-XXXXXXXX" path pattern
  if (/cjdropshipping\.com/i.test(trimmed)) {
    const match = trimmed.match(/-p-([A-Za-z0-9]+)/);
    if (match) return match[1];
    try {
      const url = new URL(trimmed);
      const pid = url.searchParams.get('pid');
      if (pid) return pid;
    } catch {}
  }

  // Generic URL — look for a PID-length alphanumeric path segment
  if (trimmed.startsWith('http')) {
    try {
      const url = new URL(trimmed);
      const segment = url.pathname
        .split('/')
        .filter(Boolean)
        .find((p) => /^[A-Za-z0-9]{15,25}$/.test(p));
      if (segment) return segment;
    } catch {}
  }

  return trimmed;
}

function PasteUrlTab() {
  const [input, setInput] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [extractedPid, setExtractedPid] = useState('');

  const clearAll = () => {
    setInput('');
    setPreview(null);
    setResult(null);
    setError('');
    setExtractedPid('');
  };

  const handlePreview = async () => {
    if (!input.trim()) return;
    setPreviewing(true);
    setError('');
    setPreview(null);
    setResult(null);

    const pid = extractPid(input);
    setExtractedPid(pid);

    try {
      const res = await fetch(`/api/admin/verify-product?pid=${encodeURIComponent(pid)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Product not found on CJ');
      }
      setPreview(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to look up product');
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!extractedPid) return;
    setImporting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/scout/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cj_pid: extractedPid, source: 'paste' }),
      });
      const data = await res.json();

      if (res.status === 409) {
        setResult({ existing: true, ...data });
      } else if (res.status === 202) {
        setResult({ queued: true, ...data });
        setPreview(null);
      } else if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      } else {
        setResult(data);
        setPreview(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  // Derive preview fields
  const detail = preview?.data || null;
  const previewName = detail?.productNameEn || detail?.productName || null;
  const wholesalePrice = parseFloat(String(detail?.sellPrice ?? detail?.productSellPrice ?? 0));
  const retailPrice = wholesalePrice > 0
    ? Math.round(wholesalePrice * 1.6 * 100 - 1) / 100
    : 0;
  const marginPercent = retailPrice > 0
    ? ((retailPrice - wholesalePrice) / retailPrice * 100).toFixed(1) + '%'
    : '—';
  const variantCount = Array.isArray(detail?.variants) ? detail.variants.length : 0;
  const previewImage = (() => {
    if (typeof detail?.productImage === 'string' && detail.productImage.startsWith('http')) {
      return detail.productImage;
    }
    if (Array.isArray(detail?.productImageSet) && detail.productImageSet.length > 0) {
      return detail.productImageSet[0];
    }
    return null;
  })();
  const inventories = preview?.stock?.inventories || [];
  const usStock = inventories.reduce(
    (sum: number, inv: any) =>
      inv.countryCode === 'US' ? sum + (inv.quantity || inv.totalInventoryNum || 0) : sum,
    0
  );

  return (
    <div className="max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">
              Import by URL or Product ID
            </h2>
            <p className="text-xs text-gray-400">
              Paste a CJ Dropshipping URL or product ID to preview and import
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (preview) { setPreview(null); setError(''); }
            }}
            onKeyDown={(e) => e.key === 'Enter' && !preview && handlePreview()}
            placeholder="Paste a CJ URL or enter a PID directly"
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          {!preview && (
            <button
              onClick={handlePreview}
              disabled={previewing || !input.trim()}
              className="px-5 py-2.5 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
            >
              {previewing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Preview Product'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Card */}
      {preview && !result && (
        <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex gap-5">
            {previewImage && (
              <div className="w-[120px] h-[120px] rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                <img
                  src={previewImage}
                  alt={previewName || ''}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[#1a1a2e] text-base mb-3 truncate">{previewName}</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <p>
                  <span className="text-gray-400">CJ Cost:</span>{' '}
                  <span className="font-semibold text-[#1a1a2e]">
                    ${wholesalePrice.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Retail Price:</span>{' '}
                  <span className="font-semibold text-[#1a1a2e]">
                    ${retailPrice.toFixed(2)}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Margin:</span>{' '}
                  <span className="font-semibold text-emerald-600">{marginPercent}</span>
                </p>
                <p>
                  <span className="text-gray-400">Variants:</span>{' '}
                  <span className="font-medium">{variantCount}</span>
                </p>
                <p className="col-span-2">
                  <span className="text-gray-400">Stock:</span>{' '}
                  {usStock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full">
                        US Stock
                      </span>
                      <span className="text-sm font-medium">{usStock} units</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 ml-1">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-semibold rounded-full">
                        CN
                      </span>
                      <span className="text-sm font-medium text-gray-500">Ships from China</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
            <button
              onClick={handleImport}
              disabled={importing}
              className="px-5 py-2.5 bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import to Catalog'
              )}
            </button>
            <button
              onClick={clearAll}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Error (below preview if preview visible, otherwise below input) */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Queued (background import) */}
      {result?.queued && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Import in progress</span>
          </div>
          <p className="text-sm text-emerald-700 mb-3">
            {result.message || 'Product will appear in your catalog shortly.'}
          </p>
          <div className="flex gap-3 text-xs">
            <a href="/admin/products" className="text-emerald-600 hover:underline">
              Check Products &rarr;
            </a>
            <button
              onClick={clearAll}
              className="text-emerald-600 hover:underline"
            >
              Import another &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Success (synchronous — legacy) */}
      {result && !result.existing && !result.queued && (
        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Product imported successfully!</span>
          </div>
          {previewName && (
            <p className="text-sm text-emerald-700 mb-3">{previewName}</p>
          )}
          <div className="flex gap-3 text-xs">
            {result.store_url && (
              <a
                href={result.store_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                View in catalog &rarr;
              </a>
            )}
            {result.admin_url && (
              <a href={result.admin_url} className="text-emerald-600 hover:underline">
                Edit in admin &rarr;
              </a>
            )}
            <button
              onClick={clearAll}
              className="text-emerald-600 hover:underline"
            >
              Import another &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Already exists */}
      {result?.existing && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-2">{result.error || 'Already in catalog'}</p>
          <div className="flex gap-3 text-xs">
            {result.product_slug && (
              <a
                href={`/product/${result.product_slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                View in store &rarr;
              </a>
            )}
            {result.product_id && (
              <a
                href={`/admin/products/edit/${result.product_id}`}
                className="text-blue-600 hover:underline"
              >
                Edit in admin &rarr;
              </a>
            )}
            <button
              onClick={clearAll}
              className="text-blue-600 hover:underline"
            >
              Import another &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab 4: Manual Entry ─────────────────────────────────────────────────────

function ManualEntryTab() {
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>(
    []
  );
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polishStatus, setPolishStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [whatsIncluded, setWhatsIncluded] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    retail_price: '',
    status: 'pending' as 'active' | 'pending' | 'hidden',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; slug: string } | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || data || []))
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (e.target.name === 'category_id') {
      const selectedCat = categories.find((c) => c.id === e.target.value);
      if (selectedCat?.slug === 'digital-downloads') {
        setIsDigital(true);
        setForm((prev) => ({ ...prev, category_id: e.target.value, status: 'active' }));
        return;
      }
    }
  };

  const handlePolish = async () => {
    setPolishing(true);
    setPolishStatus('idle');
    try {
      const categoryHint = categories.find((c) => c.id === form.category_id)?.name || '';
      const polished = await polishProductWithAI({
        rawTitle: form.name,
        rawDescription: form.description,
        categoryHint,
      });
      setForm((prev) => ({ ...prev, name: polished.title, description: polished.description }));
      setWhatsIncluded(polished.whatsIncluded);
      setPolishStatus('success');
      setTimeout(() => setPolishStatus('idle'), 3000);
    } catch {
      setPolishStatus('error');
      setTimeout(() => setPolishStatus('idle'), 3000);
    } finally {
      setPolishing(false);
    }
  };

  const handleImageChange = (index: number, value: string) => {
    setImageUrls((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addImageField = () => {
    if (imageUrls.length < 10) setImageUrls((prev) => [...prev, '']);
  };

  const removeImageField = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setForm({ name: '', description: '', category_id: '', retail_price: '', status: 'pending' });
    setImageUrls(['']);
    setIsDigital(false);
    setDigitalFile(null);
    setError('');
    setSuccess(null);
    setPolishStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Product name is required');
      return;
    }
    const retailPrice = parseFloat(form.retail_price);
    if (!retailPrice || retailPrice <= 0) {
      setError('Enter a valid retail price');
      return;
    }
    if (isDigital && !digitalFile) {
      setError('Please upload a digital file');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let digitalFilePath: string | null = null;

      if (isDigital && digitalFile) {
        setUploadingFile(true);
        const uploadForm = new FormData();
        uploadForm.append('file', digitalFile);

        const uploadRes = await fetch('/api/admin/products/upload-digital', {
          method: 'POST',
          body: uploadForm,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || 'Failed to upload digital file');
        }

        const uploadData = await uploadRes.json();
        digitalFilePath = uploadData.path;
        setUploadingFile(false);
      }

      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
      const images = imageUrls.map((u) => u.trim()).filter(Boolean);
      const fullSlug = `${slug}-${Date.now().toString(36)}`;

      const productData = {
        name: form.name.trim(),
        slug: fullSlug,
        description: form.description.trim(),
        category_id: form.category_id || null,
        images: images.length > 0 ? images : null,
        cj_price: 0,
        shipping_cost: 0,
        stripe_fee: Math.round((retailPrice * 0.029 + 0.3) * 100) / 100,
        total_cost: Math.round((retailPrice * 0.029 + 0.3) * 100) / 100,
        markup_multiplier: 1,
        retail_price: retailPrice,
        margin_dollars: Math.round((retailPrice - (retailPrice * 0.029 + 0.3)) * 100) / 100,
        margin_percent:
          Math.round(((retailPrice - (retailPrice * 0.029 + 0.3)) / retailPrice) * 1000) / 10,
        stock_count: isDigital ? 9999 : 0,
        warehouse: null,
        status: form.status,
        digital_file_path: digitalFilePath,
        whats_included: whatsIncluded,
      };

      const response = await fetch('/api/admin/products/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create product');
      }

      setSuccess({ name: form.name.trim(), slug: fullSlug });
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  // ── Success state ──
  if (success) {
    return (
      <div className="max-w-3xl">
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div className="flex items-center gap-2 text-emerald-700 mb-2">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Product created successfully!</span>
          </div>
          <p className="text-sm text-emerald-700 mb-3">{success.name}</p>
          <div className="flex gap-3 text-xs">
            <a
              href={`/product/${success.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              View product &rarr;
            </a>
            <button
              onClick={resetForm}
              className="text-emerald-600 hover:underline"
            >
              Create another &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Product Name <span className="text-danger">*</span>
              </label>
              <div className="flex items-center gap-2">
                {polishStatus === 'success' && (
                  <span className="text-xs text-emerald-600 font-medium">Polished &#10003;</span>
                )}
                {polishStatus === 'error' && (
                  <span className="text-xs text-danger font-medium">Polish failed</span>
                )}
                <button
                  type="button"
                  onClick={handlePolish}
                  disabled={polishing || form.name.length < 3}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-[#1a1a2e] border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {polishing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {polishing ? 'Polishing...' : 'Polish with AI'}
                </button>
              </div>
            </div>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Digital Gift Card, Printable Planner..."
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              placeholder="Describe the product..."
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 resize-y"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                <option value="">Uncategorized</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="manualTabIsDigital"
              checked={isDigital}
              onChange={(e) => {
                setIsDigital(e.target.checked);
                if (e.target.checked) {
                  setForm((prev) => ({ ...prev, status: 'active' }));
                } else {
                  setDigitalFile(null);
                }
              }}
              className="w-4 h-4 rounded border-gray-300 text-gold-500 focus:ring-gold-500/40"
            />
            <label htmlFor="manualTabIsDigital" className="text-sm font-medium text-gray-700">
              This is a digital product (downloadable file, no shipping)
            </label>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Pricing</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Retail Price <span className="text-danger">*</span>
          </label>
          <div className="relative w-48">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              name="retail_price"
              value={form.retail_price}
              onChange={handleChange}
              step="0.01"
              min="0"
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            For manual products, Stripe fee is calculated automatically.
          </p>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Images</h2>
        <div className="space-y-3">
          {imageUrls.map((url, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => handleImageChange(index, e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeImageField(index)}
                  className="p-2 text-gray-400 hover:text-danger rounded-lg hover:bg-danger/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {imageUrls.length < 10 && (
            <button
              type="button"
              onClick={addImageField}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 transition-colors"
            >
              <ImagePlus className="w-4 h-4" />
              Add another image
            </button>
          )}
        </div>
      </div>

      {/* Digital File Upload */}
      {isDigital && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Digital File</h2>
          <p className="text-xs text-gray-400 mb-3">
            Upload the file customers will receive after purchase (PDF, ZIP, etc. &mdash; max 50 MB).
          </p>
          <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors">
            <FileUp className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {digitalFile ? digitalFile.name : 'Choose a file...'}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => setDigitalFile(e.target.files?.[0] || null)}
            />
          </label>
          {digitalFile && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {(digitalFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                type="button"
                onClick={() => setDigitalFile(null)}
                className="text-xs text-danger hover:underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              {uploadingFile ? 'Uploading file...' : 'Creating...'}
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Create Product
            </>
          )}
        </button>
        <button
          type="button"
          onClick={resetForm}
          className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}

// ─── Shared tab trigger style ────────────────────────────────────────────────

const triggerClassName =
  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-none border-b-2 border-transparent bg-transparent text-gray-500 shadow-none hover:text-gray-700 hover:border-gray-300 data-[state=active]:border-gold-500 data-[state=active]:text-gold-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent transition-colors';

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ImportProductsPage() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gold-500/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-gold-500" />
        </div>
        <div>
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">
            Import Products
          </h1>
          <p className="text-sm text-gray-500">
            Add products to your catalog from any source
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ai-suggestions" className="w-full">
        <TabsList className="inline-flex h-11 items-center justify-start gap-1 rounded-none border-b border-gray-200 bg-transparent p-0 w-full">
          <TabsTrigger value="ai-suggestions" className={triggerClassName}>
            <Sparkles className="w-4 h-4" />
            AI Suggestions
          </TabsTrigger>
          <TabsTrigger value="browse-cj" className={triggerClassName}>
            <Search className="w-4 h-4" />
            Browse CJ
          </TabsTrigger>
          <TabsTrigger value="paste-url" className={triggerClassName}>
            <Link2 className="w-4 h-4" />
            Paste URL / PID
          </TabsTrigger>
          <TabsTrigger value="manual-entry" className={triggerClassName}>
            <PenLine className="w-4 h-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-suggestions" className="mt-6">
          <AutoImportPanel />
        </TabsContent>

        <TabsContent value="browse-cj" className="mt-6">
          <ProductScoutPanel />
        </TabsContent>

        <TabsContent value="paste-url" className="mt-6">
          <PasteUrlTab />
        </TabsContent>

        <TabsContent value="manual-entry" className="mt-6">
          <ManualEntryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
