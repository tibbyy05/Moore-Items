'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  RefreshCw,
  Check,
  DollarSign,
  ImagePlus,
  X,
  FileUp,
  FileCheck,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; slug: string }>>(
    []
  );
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [isDigital, setIsDigital] = useState(false);
  const [digitalFile, setDigitalFile] = useState<File | null>(null);
  const [existingFilePath, setExistingFilePath] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [originalProduct, setOriginalProduct] = useState<any>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    retail_price: '',
    status: 'pending' as 'active' | 'pending' | 'hidden',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          fetch(`/api/admin/products?id=${params.id}`),
          fetch('/api/categories'),
        ]);

        if (productRes.ok) {
          const { product } = await productRes.json();
          setOriginalProduct(product);
          setForm({
            name: product.name || '',
            description: product.description || '',
            category_id: product.category_id || '',
            retail_price: String(product.retail_price || ''),
            status: product.status || 'pending',
          });
          setImageUrls(
            product.images && product.images.length > 0 ? [...product.images] : ['']
          );
          setIsDigital(
            !!product.digital_file_path ||
              product.mi_categories?.slug === 'digital-downloads'
          );
          setExistingFilePath(product.digital_file_path || null);
        } else {
          toast.error('Product not found');
          router.push('/admin/products');
          return;
        }

        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.categories || data || []);
        }
      } catch {
        toast.error('Failed to load product');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

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
    setImageUrls((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length > 0 ? next : [''];
    });
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    setImageUrls((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const setAsMain = (index: number) => {
    if (index === 0) return;
    setImageUrls((prev) => {
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.unshift(item);
      return next;
    });
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

    setSaving(true);
    try {
      let digitalFilePath: string | null | undefined = undefined;

      // Upload new digital file if one was selected
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

      // If digital was turned off, clear the file path
      if (!isDigital && existingFilePath) {
        digitalFilePath = null;
      }

      const images = imageUrls.map((u) => u.trim()).filter(Boolean);
      const stripeFee = Math.round((retailPrice * 0.029 + 0.3) * 100) / 100;
      const baseCost =
        parseFloat(String(originalProduct?.cj_price || 0)) +
        parseFloat(String(originalProduct?.shipping_cost || 0));
      const totalCost = Math.round((baseCost + stripeFee) * 100) / 100;
      const marginDollars = Math.round((retailPrice - totalCost) * 100) / 100;
      const marginPercent =
        retailPrice > 0 ? Math.round((marginDollars / retailPrice) * 1000) / 10 : 0;

      const updates: Record<string, any> = {
        id: params.id,
        name: form.name.trim(),
        description: form.description.trim(),
        category_id: form.category_id || null,
        images: images.length > 0 ? images : null,
        retail_price: retailPrice,
        stripe_fee: stripeFee,
        total_cost: totalCost,
        margin_dollars: marginDollars,
        margin_percent: marginPercent,
        status: form.status,
      };

      if (isDigital) {
        updates.stock_count = 9999;
        updates.warehouse = null;
      }

      if (digitalFilePath !== undefined) {
        updates.digital_file_path = digitalFilePath;
      }

      const response = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update product');
      }

      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    } finally {
      setSaving(false);
      setUploadingFile(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-5 h-5 animate-spin text-gray-400 mr-2" />
        <span className="text-gray-500">Loading product...</span>
      </div>
    );
  }

  const existingFileName = existingFilePath?.split('-').slice(1).join('-') || existingFilePath;

  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Edit Product</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update product details{originalProduct?.cj_pid ? ' · CJ Product' : ''}.
        </p>
      </div>

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
            {!originalProduct?.cj_pid && (
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
            )}
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
            {originalProduct?.cj_pid && (
              <p className="text-xs text-gray-400 mt-1">
                CJ cost: ${Number(originalProduct.cj_price || 0).toFixed(2)} + $
                {Number(originalProduct.shipping_cost || 0).toFixed(2)} shipping
              </p>
            )}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Images</h2>
          <p className="text-xs text-gray-400 mb-4">First image is the main product image shown on cards and product pages.</p>

          {/* Thumbnail grid */}
          {imageUrls.some((u) => u.trim()) && (
            <div className="grid grid-cols-4 gap-3 mb-4">
              {imageUrls.map((url, index) => {
                if (!url.trim()) return null;
                const isMain = index === 0;
                return (
                  <div
                    key={index}
                    className={`relative group rounded-xl overflow-hidden border-2 ${isMain ? 'border-gold-500' : 'border-gray-200'}`}
                  >
                    <div className="aspect-square bg-gray-100">
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Position badge */}
                    <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${isMain ? 'bg-gold-500 text-white' : 'bg-black/50 text-white'}`}>
                      {isMain ? 'Main' : index + 1}
                    </span>

                    {/* Controls overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 py-1.5">
                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => setAsMain(index)}
                          title="Set as main image"
                          className="p-1 text-gold-400 hover:text-gold-300 transition-colors"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => moveImage(index, -1)}
                        disabled={index === 0}
                        title="Move left"
                        className="p-1 text-white hover:text-gray-300 transition-colors disabled:opacity-30"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(index, 1)}
                        disabled={index === imageUrls.length - 1}
                        title="Move right"
                        className="p-1 text-white hover:text-gray-300 transition-colors disabled:opacity-30"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImageField(index)}
                        title="Remove image"
                        className="p-1 text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add image URL input */}
          <div className="space-y-3">
            {imageUrls.map((url, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{index + 1}</span>
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
              Upload the file customers will receive after purchase (PDF, ZIP, etc. &mdash; max 50
              MB).
            </p>

            {existingFilePath && !digitalFile && (
              <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-lg mb-3">
                <FileCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800 truncate">
                    {existingFileName}
                  </p>
                  <p className="text-xs text-green-600">Current file</p>
                </div>
              </div>
            )}

            <label className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gold-400 hover:bg-gold-50/30 transition-colors">
              <FileUp className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {digitalFile
                  ? digitalFile.name
                  : existingFilePath
                    ? 'Choose a new file to replace...'
                    : 'Choose a file...'}
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
                  {(digitalFile.size / 1024 / 1024).toFixed(2)} MB — will replace current file
                </p>
                <button
                  type="button"
                  onClick={() => setDigitalFile(null)}
                  className="text-xs text-danger hover:underline"
                >
                  Cancel replacement
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
                {uploadingFile ? 'Uploading file...' : 'Saving...'}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
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
