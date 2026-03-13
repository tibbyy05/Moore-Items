'use client';

import { useEffect, useRef, useState } from 'react';
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
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Image,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const hasFetched = useRef(false);
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadImageError, setUploadImageError] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState('');
  const imageUploadRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category_id: '',
    retail_price: '',
    cj_price: '',
    shipping_cost: '',
    shipping_days: '',
    processing_time: '',
    status: 'pending' as 'active' | 'pending' | 'hidden',
  });

  // Variant management
  const [variants, setVariants] = useState<any[]>([]);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [variantEdit, setVariantEdit] = useState({ name: '', stock_count: '', retail_price: '' });
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null);
  const [variantSaving, setVariantSaving] = useState(false);
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [variantSort, setVariantSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: '', dir: 'asc' });

  // Variant image management
  const [variantImageUrls, setVariantImageUrls] = useState<Record<string, string>>({});
  const [savingVariantImage, setSavingVariantImage] = useState<string | null>(null);
  const [uploadingVariantImage, setUploadingVariantImage] = useState<string | null>(null);
  const [dragOverVariant, setDragOverVariant] = useState<string | null>(null);
  const variantFileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      try {
        const [productRes, catRes] = await Promise.all([
          fetch(`/api/admin/products?id=${params.id}`),
          fetch('/api/categories'),
        ]);

        if (productRes.ok) {
          const data = await productRes.json();
          const product = data.product;
          setOriginalProduct(product);
          setVariants(data.variants || []);
          const imgMap: Record<string, string> = {};
          (data.variants || []).forEach((v: any) => { imgMap[v.id] = v.image_url || ''; });
          setVariantImageUrls(imgMap);
          console.log('VARIANTS DEBUG:', data.variants);
          setForm({
            name: product.name || '',
            description: product.description || '',
            category_id: product.category_id || '',
            retail_price: String(product.retail_price || ''),
            cj_price: String(product.cj_price || ''),
            shipping_cost: String(product.shipping_cost || '0'),
            shipping_days: product.shipping_days || '',
            processing_time: product.processing_time || '',
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
          routerRef.current.push('/admin/products');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

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

  const handleImageUpload = async (file: File) => {
    setUploadImageError(null);
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch('/api/admin/landing-pages/upload-image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setImageUrls((prev) => {
        // Replace the first empty slot, or append
        const emptyIdx = prev.findIndex((u) => !u.trim());
        if (emptyIdx >= 0) {
          const next = [...prev];
          next[emptyIdx] = data.url;
          return next;
        }
        return [...prev, data.url];
      });
    } catch (err: any) {
      setUploadImageError(err.message || 'Upload failed');
    } finally {
      setUploadingImage(false);
      if (imageUploadRef.current) imageUploadRef.current.value = '';
    }
  };

  const handleAddPasteUrl = () => {
    const url = pasteUrl.trim();
    if (!url.startsWith('http')) return;
    setImageUrls((prev) => {
      const emptyIdx = prev.findIndex((u) => !u.trim());
      if (emptyIdx >= 0) {
        const next = [...prev];
        next[emptyIdx] = url;
        return next;
      }
      return [...prev, url];
    });
    setPasteUrl('');
  };

  const fetchVariants = async () => {
    try {
      const res = await fetch(`/api/admin/products?id=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants || []);
        const imgMap: Record<string, string> = {};
        (data.variants || []).forEach((v: any) => { imgMap[v.id] = v.image_url || ''; });
        setVariantImageUrls(imgMap);
      }
    } catch {}
  };

  const handleVariantImageUpload = async (variantId: string, file: File) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and GIF images are allowed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB');
      return;
    }
    setUploadingVariantImage(variantId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('variantId', variantId);
      const res = await fetch('/api/admin/products/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      await handleVariantImageSave(variantId, data.url);
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploadingVariantImage(null);
    }
  };

  const handleVariantImageSave = async (variantId: string, url?: string) => {
    const imageUrl = url ?? variantImageUrls[variantId] ?? '';
    setSavingVariantImage(variantId);
    try {
      const res = await fetch(`/api/admin/products/${params.id}/variant-image`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update variant image');
      toast.success('Variant image updated');
      setVariantImageUrls((prev) => ({ ...prev, [variantId]: imageUrl }));
      setVariants((prev) =>
        prev.map((v) => v.id === variantId ? { ...v, image_url: imageUrl } : v)
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update variant image');
    } finally {
      setSavingVariantImage(null);
    }
  };

  const handleVariantEdit = (v: any) => {
    setEditingVariantId(v.id);
    setVariantEdit({
      name: v.name || '',
      stock_count: String(v.stock_count ?? ''),
      retail_price: String(v.retail_price ?? ''),
    });
  };

  const handleVariantSave = async (id: string) => {
    setVariantSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: variantEdit.name,
          stock_count: Number(variantEdit.stock_count),
          retail_price: Number(variantEdit.retail_price),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update variant');
      }
      toast.success('Variant updated');
      setEditingVariantId(null);
      await fetchVariants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update variant');
    } finally {
      setVariantSaving(false);
    }
  };

  const handleVariantDelete = async (id: string) => {
    setVariantSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete variant');
      }
      toast.success('Variant deleted');
      setDeletingVariantId(null);
      await fetchVariants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete variant');
    } finally {
      setVariantSaving(false);
    }
  };

  const handleToggleActive = async (v: any) => {
    setVariantSaving(true);
    try {
      const res = await fetch(`/api/admin/variants/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !v.is_active }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update variant');
      }
      toast.success(v.is_active ? 'Variant hidden' : 'Variant activated');
      await fetchVariants();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle variant');
    } finally {
      setVariantSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = Array.from(selectedVariantIds);
    let deleted = 0;
    for (const id of ids) {
      try {
        const res = await fetch(`/api/admin/variants/${id}`, { method: 'DELETE' });
        if (res.ok) deleted++;
      } catch {}
    }
    toast.success(`Deleted ${deleted} variant${deleted !== 1 ? 's' : ''}`);
    setSelectedVariantIds(new Set());
    setConfirmBulkDelete(false);
    setBulkDeleting(false);
    await fetchVariants();
  };

  const toggleVariantSort = (key: string) => {
    setVariantSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    );
  };

  const getVariantMargin = (v: any) => {
    const retail = Number(v.retail_price || 0);
    return retail > 0
      ? (retail - Number(v.cj_price || 0) - Number(v.shipping_cost || 0)) / retail * 100
      : 0;
  };

  const getVariantTotalCost = (v: any) => Number(v.cj_price || 0) + Number(v.shipping_cost || 0);

  const sortedVariants = [...variants].sort((a, b) => {
    if (!variantSort.key) return 0;
    const dir = variantSort.dir === 'asc' ? 1 : -1;
    switch (variantSort.key) {
      case 'name': return dir * (a.name || '').localeCompare(b.name || '');
      case 'stock': return dir * ((a.stock_count ?? 0) - (b.stock_count ?? 0));
      case 'totalCost': return dir * (getVariantTotalCost(a) - getVariantTotalCost(b));
      case 'salePrice': return dir * ((Number(a.retail_price) || 0) - (Number(b.retail_price) || 0));
      case 'margin': return dir * (getVariantMargin(a) - getVariantMargin(b));
      default: return 0;
    }
  });

  const lowMarginVariants = variants.filter((v) => getVariantMargin(v) < 25 && Number(v.retail_price || 0) > 0);

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
      const cjPrice = parseFloat(form.cj_price) || 0;
      const shippingCost = parseFloat(form.shipping_cost) || 0;
      const stripeFee = Math.round((retailPrice * 0.029 + 0.3) * 100) / 100;
      const baseCost = cjPrice + shippingCost;
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
        cj_price: cjPrice,
        shipping_cost: shippingCost,
        retail_price: retailPrice,
        stripe_fee: stripeFee,
        total_cost: totalCost,
        margin_dollars: marginDollars,
        margin_percent: marginPercent,
        shipping_days: form.shipping_days.trim() || null,
        processing_time: form.processing_time.trim() || null,
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
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Retail Price <span className="text-danger">*</span>
              </label>
              <div className="relative">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="cj_price"
                  value={form.cj_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shipping Cost ($)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  name="shipping_cost"
                  value={form.shipping_cost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Charged at checkout. Set to 0 for free shipping.
              </p>
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        {!isDigital && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Shipping Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Estimate
                </label>
                <input
                  type="text"
                  name="shipping_days"
                  value={form.shipping_days}
                  onChange={handleChange}
                  placeholder="e.g. 8-15 business days"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Shown to customers on the product page.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Processing Time
                </label>
                <input
                  type="text"
                  name="processing_time"
                  value={form.processing_time}
                  onChange={handleChange}
                  placeholder="e.g. 1-3 days"
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Time before the order ships.
                </p>
              </div>
            </div>
          </div>
        )}

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

          {/* Upload + Paste */}
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <input
              ref={imageUploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => imageUploadRef.current?.click()}
              disabled={uploadingImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gold-500 text-gold-600 text-sm font-medium rounded-lg hover:bg-gold-50 transition-colors disabled:opacity-50"
            >
              {uploadingImage ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImagePlus className="w-3.5 h-3.5" />
                  Upload Image
                </>
              )}
            </button>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPasteUrl(); } }}
                placeholder="Or paste image URL..."
                className="w-56 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              />
              <button
                type="button"
                onClick={handleAddPasteUrl}
                disabled={!pasteUrl.trim().startsWith('http')}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {uploadImageError && (
              <p className="text-xs text-danger w-full">{uploadImageError}</p>
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

        {/* Variants */}
        {variants.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">
              Variants
              <span className="ml-2 text-sm font-normal text-gray-400">{variants.length}</span>
            </h2>

            {/* Margin warning banner */}
            {lowMarginVariants.length > 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-1">Low margin warning (&lt;25%)</p>
                  {lowMarginVariants.map((v: any) => (
                    <p key={v.id}>{v.name || v.sku || 'Unnamed'} — {getVariantMargin(v).toFixed(1)}%</p>
                  ))}
                </div>
              </div>
            )}

            {/* Bulk actions */}
            {selectedVariantIds.size > 0 && (
              <div className="mb-3 flex items-center gap-3">
                {!confirmBulkDelete ? (
                  <button
                    type="button"
                    onClick={() => setConfirmBulkDelete(true)}
                    className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectedVariantIds.size} selected
                  </button>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">Delete {selectedVariantIds.size} variants? This cannot be undone.</p>
                    <button
                      type="button"
                      disabled={bulkDeleting}
                      onClick={handleBulkDelete}
                      className="px-2.5 py-1 bg-danger hover:bg-danger/90 text-white text-xs font-medium rounded transition-colors disabled:opacity-60"
                    >
                      {bulkDeleting ? 'Deleting...' : 'Confirm'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmBulkDelete(false)}
                      className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedVariantIds(new Set()); setConfirmBulkDelete(false); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear selection
                </button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedVariantIds.size === variants.length && variants.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVariantIds(new Set(variants.map((v: any) => v.id)));
                          } else {
                            setSelectedVariantIds(new Set());
                            setConfirmBulkDelete(false);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-gold-500 focus:ring-gold-500/40"
                      />
                    </th>
                    {[
                      { key: 'name', label: 'Name', align: 'text-left' },
                      { key: '', label: 'SKU', align: 'text-left' },
                      { key: 'stock', label: 'Stock', align: 'text-right' },
                      { key: '', label: 'Cost', align: 'text-right' },
                      { key: '', label: 'Shipping', align: 'text-right' },
                      { key: 'totalCost', label: 'Total Cost', align: 'text-right' },
                      { key: 'salePrice', label: 'Sale Price', align: 'text-right' },
                      { key: 'margin', label: 'Margin', align: 'text-right' },
                    ].map(({ key, label, align }) => (
                      <th
                        key={label}
                        className={`pb-2 font-medium text-gray-500 ${align} ${key ? 'cursor-pointer select-none hover:text-gray-700' : ''}`}
                        onClick={key ? () => toggleVariantSort(key) : undefined}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {label}
                          {key && variantSort.key === key && (
                            variantSort.dir === 'asc'
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="pb-2 font-medium text-gray-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedVariants.map((v: any) => {
                    const isInactive = v.is_active === false;
                    const rowClass = isInactive ? 'opacity-50' : '';
                    return (
                    <tr key={v.id} className={rowClass}>
                      <td className="py-2 pr-2">
                        <input
                          type="checkbox"
                          checked={selectedVariantIds.has(v.id)}
                          onChange={(e) => {
                            setSelectedVariantIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(v.id);
                              else next.delete(v.id);
                              return next;
                            });
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-gold-500 focus:ring-gold-500/40"
                        />
                      </td>
                      {editingVariantId === v.id ? (
                        <>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={variantEdit.name}
                              onChange={(e) => setVariantEdit((prev) => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                            />
                          </td>
                          <td className="py-2 pr-2 text-gray-400 text-xs">{v.sku || '—'}</td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={variantEdit.stock_count}
                              onChange={(e) => setVariantEdit((prev) => ({ ...prev, stock_count: e.target.value }))}
                              min="0"
                              className="w-20 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                            />
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-400 text-xs">
                            ${Number(v.cj_price || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-400 text-xs">
                            ${Number(v.shipping_cost || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-2 text-right text-[#1a1a2e] font-semibold text-xs">
                            ${getVariantTotalCost(v).toFixed(2)}
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={variantEdit.retail_price}
                              onChange={(e) => setVariantEdit((prev) => ({ ...prev, retail_price: e.target.value }))}
                              step="0.01"
                              min="0"
                              className="w-24 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                            />
                          </td>
                          {(() => {
                            const editRetail = Number(variantEdit.retail_price) || 0;
                            const editMargin = editRetail > 0
                              ? ((editRetail - Number(v.cj_price || 0) - Number(v.shipping_cost || 0)) / editRetail * 100)
                              : 0;
                            const editMarginColor = editMargin >= 30 ? 'text-emerald-600' : editMargin >= 15 ? 'text-amber-600' : 'text-danger';
                            return (
                              <td className={`py-2 pr-2 text-right text-xs font-medium ${editMarginColor}`}>
                                {editMargin.toFixed(1)}%
                              </td>
                            );
                          })()}
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                disabled={variantSaving}
                                onClick={() => handleVariantSave(v.id)}
                                className="px-2.5 py-1 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-xs font-semibold rounded transition-colors disabled:opacity-60"
                              >
                                {variantSaving ? 'Saving...' : 'Save'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingVariantId(null)}
                                className="px-2.5 py-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={`py-2 pr-2 ${isInactive ? 'line-through text-gray-400' : 'text-[#1a1a2e]'}`}>{v.name || '—'}</td>
                          <td className="py-2 pr-2 text-gray-400 text-xs font-mono">{v.sku || '—'}</td>
                          <td className="py-2 pr-2 text-right">
                            <span className={v.stock_count === 0 ? 'text-danger font-medium' : isInactive ? 'text-gray-400' : 'text-[#1a1a2e]'}>
                              {v.stock_count ?? '—'}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-400 text-xs">
                            ${Number(v.cj_price || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-2 text-right text-gray-400 text-xs">
                            ${Number(v.shipping_cost || 0).toFixed(2)}
                          </td>
                          <td className="py-2 pr-2 text-right text-[#1a1a2e] font-semibold text-xs">
                            ${getVariantTotalCost(v).toFixed(2)}
                          </td>
                          <td className={`py-2 pr-2 text-right ${isInactive ? 'text-gray-400' : 'text-[#1a1a2e]'}`}>
                            ${Number(v.retail_price || 0).toFixed(2)}
                          </td>
                          {(() => {
                            const margin = getVariantMargin(v);
                            const marginColor = isInactive ? 'text-gray-400' : margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-danger';
                            return (
                              <td className={`py-2 pr-2 text-right text-xs font-medium ${marginColor}`}>
                                {margin.toFixed(1)}%
                              </td>
                            );
                          })()}
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleVariantEdit(v)}
                                className="p-1.5 text-gray-400 hover:text-gold-500 rounded hover:bg-gold-50 transition-colors"
                                title="Edit variant"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={variantSaving}
                                onClick={() => handleToggleActive(v)}
                                className={`p-1.5 rounded transition-colors ${v.is_active !== false ? 'text-gray-400 hover:text-amber-500 hover:bg-amber-50' : 'text-amber-500 hover:text-emerald-500 hover:bg-emerald-50'}`}
                                title={v.is_active !== false ? 'Hide variant' : 'Activate variant'}
                              >
                                {v.is_active !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingVariantId(v.id)}
                                className="p-1.5 text-gray-400 hover:text-danger rounded hover:bg-danger/10 transition-colors"
                                title="Delete variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Delete confirmation dialog */}
            {deletingVariantId && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  Delete <strong>{variants.find((v: any) => v.id === deletingVariantId)?.name}</strong>? This cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    disabled={variantSaving}
                    onClick={() => handleVariantDelete(deletingVariantId)}
                    className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60"
                  >
                    {variantSaving ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingVariantId(null)}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variant Images */}
        {variants.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-4 flex items-center gap-2">
              <Image className="w-4 h-4 text-[#c8a45e]" />
              Variant Images
            </h2>
            <div className="space-y-4">
              {variants.map((v: any) => {
                const isUploading = uploadingVariantImage === v.id;
                const isSaving = savingVariantImage === v.id;
                const isBusy = isUploading || isSaving;
                const isDragOver = dragOverVariant === v.id;
                const currentUrl = variantImageUrls[v.id] ?? v.image_url ?? '';
                return (
                <div
                  key={v.id}
                  className="p-4 bg-gray-50 border border-gray-100 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg border border-gray-200 bg-white overflow-hidden flex items-center justify-center">
                      {currentUrl ? (
                        <img
                          src={currentUrl}
                          alt={v.name || 'Variant'}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Image className="w-6 h-6 text-gray-300" />
                      )}
                    </div>

                    {/* Name + upload zone */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-2">
                        <p className="text-sm font-medium text-[#1a1a2e] truncate">{v.name || 'Unnamed'}</p>
                        {v.sku && <p className="text-xs text-gray-400 font-mono truncate">{v.sku}</p>}
                      </div>

                      {/* Drop zone */}
                      <div
                        className={`relative border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
                          isDragOver
                            ? 'border-[#c8a45e] bg-[#c8a45e]/5'
                            : 'border-gray-300 hover:border-[#c8a45e]/60 hover:bg-gray-50'
                        } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                        onClick={() => !isBusy && variantFileRefs.current[v.id]?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverVariant(v.id); }}
                        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setDragOverVariant(null); }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setDragOverVariant(null);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleVariantImageUpload(v.id, file);
                        }}
                      >
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="hidden"
                          ref={(el) => { variantFileRefs.current[v.id] = el; }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleVariantImageUpload(v.id, file);
                            e.target.value = '';
                          }}
                        />
                        {isUploading ? (
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin text-[#c8a45e]" />
                            <span className="text-xs text-gray-500">Uploading…</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <Upload className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">Drop image or click to browse</span>
                          </div>
                        )}
                      </div>

                      {/* Paste URL fallback */}
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-400 flex-shrink-0">Or paste URL</span>
                        <input
                          type="text"
                          value={currentUrl}
                          onChange={(e) =>
                            setVariantImageUrls((prev) => ({ ...prev, [v.id]: e.target.value }))
                          }
                          placeholder="https://..."
                          className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#c8a45e]/40 focus:border-[#c8a45e]"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleVariantImageSave(v.id)}
                          className="px-2.5 py-1.5 bg-[#c8a45e] hover:bg-[#b8944e] text-[#0f1629] text-xs font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1 flex-shrink-0"
                        >
                          {isSaving ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
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
