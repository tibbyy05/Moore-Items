'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  ImagePlus,
  X,
  DollarSign,
  FileUp,
} from 'lucide-react';
import { toast } from 'sonner';

type Tab = 'manual' | 'cj-import';

export default function AddProductPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('manual');

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Add Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Add a product manually or import one from CJ Dropshipping.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'manual'
              ? 'bg-white text-[#1a1a2e] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Package className="w-4 h-4" />
          Manual Product
        </button>
        <button
          onClick={() => setActiveTab('cj-import')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === 'cj-import'
              ? 'bg-white text-[#1a1a2e] shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Download className="w-4 h-4" />
          Import from CJ
        </button>
      </div>

      {activeTab === 'manual' ? <ManualProductForm /> : <CJImportForm />}
    </>
  );
}

/* ─── Manual Product Form ──────────────────────────────────────── */

function ManualProductForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>(
    []
  );
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    retail_price: '',
    status: 'pending' as 'active' | 'pending' | 'hidden',
  });

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
    // Auto-toggle digital mode when Digital Downloads category is selected
    if (e.target.name === 'category_id') {
      const selectedCat = categories.find((c) => c.id === e.target.value);
      if (selectedCat?.slug === 'digital-downloads') {
        setIsDigital(true);
        setForm((prev) => ({ ...prev, category_id: e.target.value, status: 'active' }));
        return;
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    const retailPrice = parseFloat(form.retail_price);
    if (!retailPrice || retailPrice <= 0) {
      toast.error('Enter a valid retail price');
      return;
    }
    if (isDigital && !digitalFile) {
      toast.error('Please upload a digital file');
      return;
    }

    setSaving(true);
    try {
      let digitalFilePath: string | null = null;

      // Upload digital file first if applicable
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

      const productData = {
        name: form.name.trim(),
        slug: `${slug}-${Date.now().toString(36)}`,
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

      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {/* Basic Info */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Name <span className="text-danger">*</span>
            </label>
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
              id="isDigital"
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
            <label htmlFor="isDigital" className="text-sm font-medium text-gray-700">
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
        <Link
          href="/admin/products"
          className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

/* ─── CJ Import Form ──────────────────────────────────────────── */

function CJImportForm() {
  const router = useRouter();
  const [pid, setPid] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePreview = async () => {
    const trimmed = pid.trim();
    if (!trimmed) {
      setError('Enter a CJ Product ID');
      return;
    }

    setPreviewLoading(true);
    setError(null);
    setPreview(null);
    setSuccess(null);

    try {
      const res = await fetch(
        `/api/admin/verify-product?pid=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Product not found on CJ');
      }
      setPreview(data);
    } catch (err: any) {
      setError(err.message || 'Failed to look up product');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImport = async () => {
    const trimmed = pid.trim();
    if (!trimmed) return;

    setImporting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/products/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Import failed');
      }

      setSuccess(`Imported "${data.product.name}" successfully!`);
      setPreview(null);
      toast.success('Product imported from CJ');
      // Dispatch event so products list refreshes if user navigates back
      window.dispatchEvent(new Event('mi:products:refresh'));
    } catch (err: any) {
      setError(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const detail = preview?.data || null;
  const previewName = detail?.productNameEn || detail?.productName || null;
  const previewPrice = detail?.sellPrice || detail?.productSellPrice || null;
  const previewStatus = String(detail?.status) === '3' ? 'Active' : 'Inactive';
  const previewVariants = Array.isArray(detail?.variants) ? detail.variants.length : 0;
  const previewImageList: string[] = (() => {
    if (Array.isArray(detail?.productImageSet) && detail.productImageSet.length > 0) {
      return detail.productImageSet;
    }
    if (typeof detail?.productImage === 'string') {
      try {
        const parsed = JSON.parse(detail.productImage);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [detail.productImage];
    }
    return [];
  })();
  const previewImage = previewImageList[0] || null;
  const previewImages = previewImageList.length;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* PID Input */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">CJ Product ID</h2>
        <p className="text-xs text-gray-400 mb-4">
          Paste a CJ product ID (PID) to preview and import it into your catalog.
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={pid}
            onChange={(e) => {
              setPid(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            placeholder="e.g. 00A5B3C7-1234-4567-89AB-CDEF01234567"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handlePreview();
              }
            }}
            className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewLoading || !pid.trim()}
            className="px-5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {previewLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Looking up...
              </>
            ) : (
              'Preview'
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger font-medium">{error}</p>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-3 bg-success/5 border border-success/20 rounded-xl p-4">
          <Check className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-success font-medium">{success}</p>
            <div className="flex gap-3 mt-3">
              <button
                onClick={() => {
                  setPid('');
                  setSuccess(null);
                }}
                className="text-sm text-gray-500 hover:text-gold-500 underline underline-offset-2 transition-colors"
              >
                Import another
              </button>
              <Link
                href="/admin/products"
                className="text-sm text-gold-500 hover:text-gold-600 font-semibold transition-colors"
              >
                Go to Products
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Preview Card */}
      {detail && !success && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Product Preview</h2>
          <div className="flex gap-5">
            {previewImage && (
              <div className="w-28 h-28 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                <img
                  src={previewImage}
                  alt={previewName || ''}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 space-y-2 text-sm">
              <p className="font-semibold text-[#1a1a2e] text-base">{previewName}</p>
              <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-gray-600">
                <p>
                  <span className="text-gray-400">Wholesale:</span>{' '}
                  <span className="font-semibold text-[#1a1a2e]">
                    ${typeof previewPrice === 'number' ? previewPrice.toFixed(2) : previewPrice}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">CJ Status:</span>{' '}
                  <span
                    className={`font-semibold ${
                      previewStatus === 'Active' ? 'text-success' : 'text-danger'
                    }`}
                  >
                    {previewStatus}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">Images:</span>{' '}
                  <span className="font-medium">{previewImages}</span>
                </p>
                <p>
                  <span className="text-gray-400">Variants:</span>{' '}
                  <span className="font-medium">{previewVariants}</span>
                </p>
              </div>
              {preview?.stock && (
                <p className="text-gray-600">
                  <span className="text-gray-400">US Stock:</span>{' '}
                  {(() => {
                    const inventories = preview.stock?.inventories || [];
                    const usStock = inventories.find(
                      (inv: any) => inv.countryCode === 'US'
                    );
                    const qty = usStock?.totalInventoryNum ?? 0;
                    return (
                      <span
                        className={`font-semibold ${qty > 0 ? 'text-success' : 'text-danger'}`}
                      >
                        {qty} units
                      </span>
                    );
                  })()}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
            <button
              type="button"
              onClick={handleImport}
              disabled={importing}
              className="px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Import to Catalog
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setPid('');
              }}
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tip */}
      {!preview && !success && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
          <p className="font-semibold text-gray-600 mb-1">Where to find CJ Product IDs</p>
          <p>
            Copy a PID from your CJ Dashboard product search, or from the product list in your
            admin panel (click the PID next to any product name).
          </p>
        </div>
      )}
    </div>
  );
}
