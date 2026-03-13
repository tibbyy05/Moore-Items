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
  Copy,
  ExternalLink,
  Link2,
} from 'lucide-react';
import { toast } from 'sonner';
import { createBrowserClient } from '@supabase/ssr';

const supabaseStorage = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

  // CJ Sourcing state
  const [cjPidEdit, setCjPidEdit] = useState('');
  const [cjPidEditing, setCjPidEditing] = useState(false);
  const [cjRefreshing, setCjRefreshing] = useState(false);
  const [cjDelisted, setCjDelisted] = useState(false);
  const [cjPidSaving, setCjPidSaving] = useState(false);
  const [cjPidConfirm, setCjPidConfirm] = useState(false);
  const [highlightedVariants, setHighlightedVariants] = useState<Record<string, 'up' | 'down'>>({});
  const [showInactiveVariants, setShowInactiveVariants] = useState(false);

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
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB');
      return;
    }
    setUploadImageError(null);
    setUploadingImage(true);
    try {
      const path = `products/${params.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabaseStorage.storage
        .from('landing-page-images')
        .upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabaseStorage.storage
        .from('landing-page-images')
        .getPublicUrl(path);
      const url = urlData.publicUrl;
      setImageUrls((prev) => {
        const emptyIdx = prev.findIndex((u) => !u.trim());
        if (emptyIdx >= 0) {
          const next = [...prev];
          next[emptyIdx] = url;
          return next;
        }
        return [...prev, url];
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
      const path = `variants/${variantId}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabaseStorage.storage
        .from('gallery-photos')
        .upload(path, file, { upsert: false });
      if (error) throw new Error(error.message);
      const { data: urlData } = supabaseStorage.storage
        .from('gallery-photos')
        .getPublicUrl(path);
      await handleVariantImageSave(variantId, urlData.publicUrl);
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

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  };

  const isSyncStale = (dateStr: string | null) => {
    if (!dateStr) return true;
    const diffMs = Date.now() - new Date(dateStr).getTime();
    return diffMs > 48 * 60 * 60 * 1000;
  };

  const handleCjRefresh = async () => {
    setCjRefreshing(true);
    setCjDelisted(false);
    try {
      const res = await fetch('/api/admin/products/refresh-cj-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: params.id }),
      });
      const data = await res.json();

      if (data.delisted) {
        setCjDelisted(true);
        if (data.error) toast.error(data.error);
        // Update last_synced_at on the original product
        setOriginalProduct((prev: any) => ({ ...prev, last_synced_at: new Date().toISOString() }));
        return;
      }

      if (!res.ok) {
        toast.error(data.error || 'Failed to refresh CJ data');
        return;
      }

      // Update last_synced_at
      setOriginalProduct((prev: any) => ({ ...prev, last_synced_at: new Date().toISOString() }));

      // Re-fetch variants
      await fetchVariants();

      // Process changes for highlighting
      const changes: Array<{ variantId: string; name: string; oldCost: number; newCost: number; retailPrice: number }> = data.changes || [];
      const highlights: Record<string, 'up' | 'down'> = {};
      for (const c of changes) {
        if (c.newCost !== c.oldCost) {
          highlights[c.variantId] = c.newCost > c.oldCost ? 'up' : 'down';
        }
        // Check for selling at a loss
        if (c.retailPrice > 0 && c.newCost > c.retailPrice) {
          toast.error(`⚠️ ${c.name} is now selling at a loss — update pricing`);
        }
      }
      setHighlightedVariants(highlights);

      // Clear highlights after 5 seconds
      if (Object.keys(highlights).length > 0) {
        setTimeout(() => setHighlightedVariants({}), 5000);
      }

      const changedCount = changes.filter((c: any) => c.newCost !== c.oldCost || c.newStock !== c.oldStock).length;
      toast.success(changedCount > 0 ? `Synced — ${changedCount} variant${changedCount !== 1 ? 's' : ''} updated` : 'Synced — all variants up to date');
    } catch (err: any) {
      toast.error(err.message || 'Failed to refresh CJ data');
    } finally {
      setCjRefreshing(false);
    }
  };

  const handleCjPidSave = async () => {
    const newPid = cjPidEdit.trim();
    if (!newPid) return;
    setCjPidSaving(true);
    try {
      // Update cj_pid and clear last_synced_at
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: params.id,
          cj_pid: newPid,
          last_synced_at: null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update CJ PID');
      }

      // Clear cj_vid on all variants via individual PATCH calls
      for (const v of variants) {
        await fetch(`/api/admin/variants/${v.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cj_vid: null }),
        });
      }

      setOriginalProduct((prev: any) => ({ ...prev, cj_pid: newPid, last_synced_at: null }));
      setCjPidEditing(false);
      setCjPidConfirm(false);
      toast.success('CJ PID updated — triggering refresh...');

      // Auto-trigger refresh
      setTimeout(() => handleCjRefresh(), 500);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save CJ PID');
    } finally {
      setCjPidSaving(false);
    }
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

  const sortVariantList = (list: any[]) => [...list].sort((a, b) => {
    if (!variantSort.key) return 0;
    const dir = variantSort.dir === 'asc' ? 1 : -1;
    switch (variantSort.key) {
      case 'name': return dir * (a.name || '').localeCompare(b.name || '');
      case 'cjStock': return dir * ((a.cj_warehouse_stock ?? 0) - (b.cj_warehouse_stock ?? 0));
      case 'factoryStock': return dir * ((a.factory_stock ?? 0) - (b.factory_stock ?? 0));
      case 'totalCost': return dir * (getVariantTotalCost(a) - getVariantTotalCost(b));
      case 'salePrice': return dir * ((Number(a.retail_price) || 0) - (Number(b.retail_price) || 0));
      case 'margin': return dir * (getVariantMargin(a) - getVariantMargin(b));
      default: return 0;
    }
  });

  const activeVariants = variants.filter((v) => v.is_active !== false);
  const inactiveVariants = variants.filter((v) => v.is_active === false);
  const sortedActiveVariants = sortVariantList(activeVariants);
  const sortedInactiveVariants = sortVariantList(inactiveVariants);

  // Margin warnings — grouped by severity
  const sellingAtLoss = activeVariants.filter((v) => {
    const retail = Number(v.retail_price || 0);
    return retail > 0 && Number(v.cj_price || 0) > retail;
  });
  const thinMarginVariants = activeVariants.filter((v) => {
    const margin = getVariantMargin(v);
    const retail = Number(v.retail_price || 0);
    return retail > 0 && margin >= 0 && margin < 15 && Number(v.cj_price || 0) <= retail;
  });
  const lowMarginVariants = activeVariants.filter((v) => {
    const margin = getVariantMargin(v);
    const retail = Number(v.retail_price || 0);
    return retail > 0 && margin >= 15 && margin < 25;
  });
  const hasMarginWarnings = sellingAtLoss.length > 0 || thinMarginVariants.length > 0 || lowMarginVariants.length > 0;

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

        {/* CJ Sourcing */}
        {originalProduct?.cj_pid !== undefined && (
          <div className="bg-white border border-gray-200 border-l-[3px] border-l-[#c8a45e] rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-[#1a1a2e] flex items-center gap-2">
                <Link2 className="w-4 h-4 text-[#c8a45e]" />
                CJ Sourcing
              </h2>
              {originalProduct?.last_synced_at && (
                <span className={`text-xs ${isSyncStale(originalProduct.last_synced_at) ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                  Last synced {formatRelativeTime(originalProduct.last_synced_at)}
                </span>
              )}
              {!originalProduct?.last_synced_at && originalProduct?.cj_pid && (
                <span className="text-xs text-amber-600 font-medium">Never synced</span>
              )}
            </div>

            {cjDelisted && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-800">
                  This product is no longer available on CJ. Consider relinking to a new PID.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {/* CJ PID field */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CJ Product ID</label>
                {cjPidEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={cjPidEdit}
                      onChange={(e) => setCjPidEdit(e.target.value)}
                      placeholder="Enter CJ product ID..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40 font-mono"
                    />
                    {!cjPidConfirm ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (cjPidEdit.trim() !== (originalProduct?.cj_pid || '')) {
                              setCjPidConfirm(true);
                            } else {
                              setCjPidEditing(false);
                            }
                          }}
                          disabled={!cjPidEdit.trim()}
                          className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                        >
                          Save PID
                        </button>
                        <button
                          type="button"
                          onClick={() => { setCjPidEditing(false); setCjPidConfirm(false); }}
                          className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs text-amber-800 mb-2">
                          Changing the CJ PID will clear all variant links and trigger a fresh sync. Continue?
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCjPidSave}
                            disabled={cjPidSaving}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                          >
                            {cjPidSaving ? 'Saving...' : 'Yes, change PID'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setCjPidConfirm(false)}
                            className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#1a1a2e] font-mono truncate">
                      {originalProduct?.cj_pid || '—'}
                    </code>
                    {originalProduct?.cj_pid && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(originalProduct.cj_pid);
                          toast.success('Copied CJ PID');
                        }}
                        className="p-2 text-gray-400 hover:text-gold-500 rounded-lg hover:bg-gold-50 transition-colors"
                        title="Copy PID"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setCjPidEdit(originalProduct?.cj_pid || ''); setCjPidEditing(true); }}
                      className="p-2 text-gray-400 hover:text-gold-500 rounded-lg hover:bg-gold-50 transition-colors"
                      title="Edit PID"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {originalProduct?.cj_pid && !cjPidEditing && (
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`https://cjdropshipping.com/product/-p-${originalProduct.cj_pid}.html`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View on CJ
                  </a>
                  <button
                    type="button"
                    onClick={handleCjRefresh}
                    disabled={cjRefreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${cjRefreshing ? 'animate-spin' : ''}`} />
                    {cjRefreshing ? 'Refreshing...' : 'Refresh from CJ'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="bg-white border border-gray-200 border-l-[3px] border-l-[#c8a45e] rounded-2xl p-6 shadow-sm">
            {/* Header row with title + refresh */}
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-[#1a1a2e]">
                Variants
                <span className="ml-2 text-sm font-normal text-gray-400">{activeVariants.length} active</span>
              </h2>
              {originalProduct?.cj_pid && (
                <button
                  type="button"
                  onClick={handleCjRefresh}
                  disabled={cjRefreshing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-xs font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${cjRefreshing ? 'animate-spin' : ''}`} />
                  {cjRefreshing ? 'Refreshing...' : 'Refresh from CJ'}
                </button>
              )}
            </div>

            {/* Sync timestamp */}
            <div className={`flex items-center gap-1.5 text-xs mb-4 ${originalProduct?.last_synced_at && !isSyncStale(originalProduct.last_synced_at) ? 'text-gray-400' : 'text-amber-600'}`}>
              {originalProduct?.last_synced_at && isSyncStale(originalProduct.last_synced_at) && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              {!originalProduct?.last_synced_at && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              {originalProduct?.last_synced_at
                ? `Prices & stock as of ${new Date(originalProduct.last_synced_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${new Date(originalProduct.last_synced_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                : 'Never synced'}
            </div>

            {/* Margin warnings — grouped by severity */}
            {hasMarginWarnings && (
              <div className="mb-4 space-y-2">
                {sellingAtLoss.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-red-800">
                      <p className="font-semibold mb-1">Selling at a loss — raise price or deactivate</p>
                      {sellingAtLoss.map((v: any) => (
                        <p key={v.id}>{v.name || v.sku || 'Unnamed'} — cost ${Number(v.cj_price || 0).toFixed(2)} &gt; price ${Number(v.retail_price || 0).toFixed(2)}</p>
                      ))}
                    </div>
                  </div>
                )}
                {thinMarginVariants.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold mb-1">Thin margin — consider raising price</p>
                      {thinMarginVariants.map((v: any) => (
                        <p key={v.id}>{v.name || v.sku || 'Unnamed'} — {getVariantMargin(v).toFixed(1)}%</p>
                      ))}
                    </div>
                  </div>
                )}
                {lowMarginVariants.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-yellow-800">
                      <p className="font-semibold mb-1">Low margin — monitor closely</p>
                      {lowMarginVariants.map((v: any) => (
                        <p key={v.id}>{v.name || v.sku || 'Unnamed'} — {getVariantMargin(v).toFixed(1)}%</p>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Active variants table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="pb-2 pr-2">
                      <input
                        type="checkbox"
                        checked={selectedVariantIds.size === activeVariants.length && activeVariants.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVariantIds(new Set(activeVariants.map((v: any) => v.id)));
                          } else {
                            setSelectedVariantIds(new Set());
                            setConfirmBulkDelete(false);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-gold-500 focus:ring-gold-500/40"
                      />
                    </th>
                    {[
                      { key: 'name', label: 'Variant', align: 'text-left' },
                      { key: 'margin', label: 'Margin', align: 'text-center' },
                      { key: 'totalCost', label: 'Cost + Ship = Total', align: 'text-center' },
                      { key: 'salePrice', label: 'Sale Price', align: 'text-center' },
                      { key: 'cjStock', label: 'CJ Stock', align: 'text-center' },
                      { key: 'factoryStock', label: 'Factory', align: 'text-center' },
                    ].map(({ key, label, align }) => (
                      <th
                        key={label}
                        className={`pb-2 font-medium text-gray-500 ${align} cursor-pointer select-none hover:text-gray-700`}
                        onClick={() => toggleVariantSort(key)}
                      >
                        <span className="inline-flex items-center gap-0.5">
                          {label}
                          {variantSort.key === key && (
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
                  {sortedActiveVariants.map((v: any) => {
                    const margin = getVariantMargin(v);
                    const marginPillColor = margin >= 35
                      ? 'bg-emerald-100 text-emerald-800'
                      : margin >= 15
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800';
                    return (
                    <tr key={v.id} className="group">
                      <td className="py-2.5 pr-2">
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
                          <td className="py-2.5 pr-3">
                            <input
                              type="text"
                              value={variantEdit.name}
                              onChange={(e) => setVariantEdit((prev) => ({ ...prev, name: e.target.value }))}
                              className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                            />
                          </td>
                          {(() => {
                            const editRetail = Number(variantEdit.retail_price) || 0;
                            const editMargin = editRetail > 0
                              ? ((editRetail - Number(v.cj_price || 0) - Number(v.shipping_cost || 0)) / editRetail * 100)
                              : 0;
                            const editPillColor = editMargin >= 35
                              ? 'bg-emerald-100 text-emerald-800'
                              : editMargin >= 15
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800';
                            return (
                              <td className="py-2.5 pr-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${editPillColor}`}>
                                  {editMargin.toFixed(1)}%
                                </span>
                              </td>
                            );
                          })()}
                          <td className="py-2.5 pr-3 text-center text-xs text-gray-400">
                            ${Number(v.cj_price || 0).toFixed(2)} + ${Number(v.shipping_cost || 0).toFixed(2)} = <span className="text-[#1a1a2e] font-semibold">${getVariantTotalCost(v).toFixed(2)}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-center">
                            <input
                              type="number"
                              value={variantEdit.retail_price}
                              onChange={(e) => setVariantEdit((prev) => ({ ...prev, retail_price: e.target.value }))}
                              step="0.01"
                              min="0"
                              className="w-24 px-2 py-1 bg-white border border-gray-200 rounded text-sm text-center focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                            />
                          </td>
                          <td className="py-2.5 pr-3 text-center tabular-nums text-xs text-gray-400">
                            {v.cj_warehouse_stock != null ? v.cj_warehouse_stock : '—'}
                          </td>
                          <td className="py-2.5 pr-3 text-center tabular-nums text-xs text-gray-400">
                            {v.factory_stock != null ? v.factory_stock : '—'}
                          </td>
                          <td className="py-2.5 text-right">
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
                          <td className="py-2.5 pr-3 text-[#1a1a2e]">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{v.name || '—'}</span>
                              {v.sku && <span className="text-[10px] text-gray-400 font-mono hidden sm:inline">{v.sku}</span>}
                            </div>
                          </td>
                          <td className="py-2.5 pr-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold tabular-nums ${marginPillColor}`}>
                              {margin.toFixed(1)}%
                            </span>
                          </td>
                          <td className={`py-2.5 pr-3 text-center text-xs tabular-nums transition-colors duration-500 ${
                            highlightedVariants[v.id] === 'up' ? 'text-amber-700 bg-amber-50' :
                            highlightedVariants[v.id] === 'down' ? 'text-emerald-700 bg-emerald-50' :
                            'text-gray-400'
                          }`}>
                            ${Number(v.cj_price || 0).toFixed(2)} + ${Number(v.shipping_cost || 0).toFixed(2)} = <span className="text-[#1a1a2e] font-semibold">${getVariantTotalCost(v).toFixed(2)}</span>
                          </td>
                          <td className="py-2.5 pr-3 text-center text-[#1a1a2e] font-medium tabular-nums">
                            ${Number(v.retail_price || 0).toFixed(2)}
                          </td>
                          <td className="py-2.5 pr-3 text-center">
                            <span className={`tabular-nums ${v.cj_warehouse_stock === 0 ? 'text-danger font-medium' : v.cj_warehouse_stock != null ? 'text-[#1a1a2e]' : 'text-gray-400'}`}>
                              {v.cj_warehouse_stock != null ? v.cj_warehouse_stock : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-center">
                            <span className={`tabular-nums ${v.factory_stock === 0 ? 'text-gray-400' : v.factory_stock != null ? 'text-[#1a1a2e]' : 'text-gray-400'}`}>
                              {v.factory_stock != null ? v.factory_stock : '—'}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                                className="p-1.5 text-gray-400 hover:text-amber-500 rounded hover:bg-amber-50 transition-colors"
                                title="Hide variant"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
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

            {/* Inactive variants — collapsed by default */}
            {inactiveVariants.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInactiveVariants((prev) => !prev)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${showInactiveVariants ? 'rotate-90' : ''}`} />
                  {inactiveVariants.length} inactive variant{inactiveVariants.length !== 1 ? 's' : ''}
                </button>

                {showInactiveVariants && (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-gray-50">
                        {sortedInactiveVariants.map((v: any) => (
                          <tr key={v.id} className="opacity-50 group">
                            <td className="py-2 pr-2 w-8">
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
                            <td className="py-2 pr-3 text-gray-400 line-through">{v.name || '—'}</td>
                            <td className="py-2 pr-3 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold tabular-nums bg-gray-100 text-gray-400">
                                {getVariantMargin(v).toFixed(1)}%
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-center text-xs text-gray-400 tabular-nums">
                              ${Number(v.cj_price || 0).toFixed(2)} + ${Number(v.shipping_cost || 0).toFixed(2)} = ${getVariantTotalCost(v).toFixed(2)}
                            </td>
                            <td className="py-2 pr-3 text-center text-gray-400 tabular-nums">
                              ${Number(v.retail_price || 0).toFixed(2)}
                            </td>
                            <td className="py-2 pr-3 text-center text-gray-400 tabular-nums">
                              {v.cj_warehouse_stock != null ? v.cj_warehouse_stock : '—'}
                            </td>
                            <td className="py-2 pr-3 text-center text-gray-400 tabular-nums">
                              {v.factory_stock != null ? v.factory_stock : '—'}
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  disabled={variantSaving}
                                  onClick={() => handleToggleActive(v)}
                                  className="p-1.5 text-amber-500 hover:text-emerald-500 rounded hover:bg-emerald-50 transition-colors"
                                  title="Activate variant"
                                >
                                  <Eye className="w-3.5 h-3.5" />
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

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
