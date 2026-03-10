'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  ImagePlus,
  X,
  DollarSign,
  FileUp,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { polishProductWithAI } from '@/lib/ai/product-enrichment';

export default function AddProductPage() {
  const router = useRouter();
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
      let desc = polished.description;
      if (polished.whatsIncluded.length > 0) {
        desc += `\n\nWhat's Included: ${polished.whatsIncluded.join(', ')}`;
      }
      setForm((prev) => ({ ...prev, name: polished.title, description: desc }));
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
          Create a manual or digital product
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
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
    </>
  );
}
