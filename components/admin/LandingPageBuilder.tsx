'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Download,
  RefreshCw,
  Check,
  AlertCircle,
  Sparkles,
  Plus,
  Package,
  X,
  Upload,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

/* ─── Types ──────────────────────────────────────────────────── */

interface SelectedProduct {
  id: string;
  name: string;
  retail_price: number;
  cj_price: number;
  images: string[];
  description: string;
  category: string;
  slug: string;
  warehouse?: string | null;
}

interface PageSettings {
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
}

interface DiscountTier {
  qty: number;
  label: string;
  discount_pct: number;
  badge: string;
}

interface LandingPageData {
  id: string;
  name: string;
  slug: string;
  headline: string;
  subheadline: string;
  hero_image_url: string | null;
  meta_title: string;
  meta_description: string;
  is_active: boolean;
  sections: any;
  quantity_discounts: any;
  promo_codes: any;
  product: {
    id: string;
    name: string;
    slug: string;
    retail_price: number;
    cj_price: number;
    images: string[];
    description: string;
  } | null;
}

interface LandingPageBuilderProps {
  initialData?: LandingPageData;
}

/* ─── Style constants ────────────────────────────────────────── */

const INPUT = 'w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40';
const CARD = 'bg-white border border-gray-200 rounded-2xl p-6 shadow-sm';
const LABEL = 'block text-sm font-medium text-gray-700 mb-1';
const TITLE = 'text-base font-semibold text-[#1a1a2e] mb-4';
const GOLD_BTN = 'px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2';
const OUTLINE_BTN = 'px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2';

/* ─── Component ──────────────────────────────────────────────── */

export function LandingPageBuilder({ initialData }: LandingPageBuilderProps) {
  const router = useRouter();
  const supabase = createClient();

  // Product selection state
  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [productTab, setProductTab] = useState<'catalog' | 'cj-import'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // CJ import state
  const [cjPid, setCjPid] = useState('');
  const [cjPreview, setCjPreview] = useState<any>(null);
  const [cjPreviewLoading, setCjPreviewLoading] = useState(false);
  const [cjImporting, setCjImporting] = useState(false);
  const [cjError, setCjError] = useState<string | null>(null);

  // Page settings
  const [pageSettings, setPageSettings] = useState<PageSettings>({
    name: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
  });

  // Discount tiers
  const [discountTiers, setDiscountTiers] = useState<DiscountTier[]>([
    { qty: 1, label: '1 Item', discount_pct: 0, badge: '' },
    { qty: 2, label: '2 Items', discount_pct: 10, badge: 'Most Popular' },
    { qty: 3, label: '3 Items', discount_pct: 20, badge: 'Best Value' },
  ]);

  // Image selections
  const [imageSelections, setImageSelections] = useState<{ hero: string; feature1: string; feature2: string }>({
    hero: '',
    feature1: '',
    feature2: '',
  });

  // Hero gallery image selection (null = all selected, default behavior)
  const [galleryImages, setGalleryImages] = useState<string[] | null>(null);

  // Extra images (uploaded or pasted URLs)
  const [extraImages, setExtraImages] = useState<string[]>([]);
  const [removedProductImages, setRemovedProductImages] = useState<Set<string>>(new Set());
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pasteUrls, setPasteUrls] = useState<{ hero: string; feature1: string; feature2: string }>({ hero: '', feature1: '', feature2: '' });
  const uploadRefs = useRef<Record<string, HTMLInputElement | null>>({ hero: null, feature1: null, feature2: null });
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Inline price editing on pricing reference bar
  const [editingSellPrice, setEditingSellPrice] = useState(false);
  const [editSellPrice, setEditSellPrice] = useState('');
  const [editingCost, setEditingCost] = useState(false);
  const [editCost, setEditCost] = useState('');
  const [priceSavedField, setPriceSavedField] = useState<'sell' | 'cost' | null>(null);

  // AI sections
  const [sections, setSections] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPromoCodes, setGeneratedPromoCodes] = useState<Record<string, string>>({});

  // Save
  const [saving, setSaving] = useState(false);

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSaveSellPrice = async () => {
    setEditingSellPrice(false);
    const val = parseFloat(editSellPrice);
    if (!selectedProduct || isNaN(val) || val <= 0) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProduct.id, retail_price: val }),
      });
      if (res.ok) {
        setSelectedProduct((prev) => prev ? { ...prev, retail_price: val } : prev);
        setPriceSavedField('sell');
        setTimeout(() => setPriceSavedField(null), 1500);
      }
    } catch { /* ignore */ }
  };

  const handleSaveCost = async () => {
    setEditingCost(false);
    const val = parseFloat(editCost);
    if (!selectedProduct || isNaN(val) || val < 0) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedProduct.id, cj_price: val }),
      });
      if (res.ok) {
        setSelectedProduct((prev) => prev ? { ...prev, cj_price: val } : prev);
        setPriceSavedField('cost');
        setTimeout(() => setPriceSavedField(null), 1500);
      }
    } catch { /* ignore */ }
  };

  /* ─── Hydrate from initialData ──────────────────────────────── */

  useEffect(() => {
    if (!initialData) return;

    if (initialData.product) {
      const imgs = initialData.product.images || [];
      setSelectedProduct({
        id: initialData.product.id,
        name: initialData.product.name,
        retail_price: initialData.product.retail_price,
        cj_price: initialData.product.cj_price || 0,
        images: imgs,
        description: initialData.product.description || '',
        category: '',
        slug: initialData.product.slug,
      });
      const hydratedImages = {
        hero: initialData.hero_image_url || imgs[0] || '',
        feature1: initialData.sections?.feature1_image || imgs[1] || imgs[0] || '',
        feature2: initialData.sections?.feature2_image || imgs[2] || imgs[0] || '',
      };
      console.log('[Hydration] Setting imageSelections from initialData:', JSON.stringify(hydratedImages));
      console.log('[Hydration] initialData.hero_image_url:', initialData.hero_image_url);
      setImageSelections(hydratedImages);
    }

    setPageSettings({
      name: initialData.name || '',
      slug: initialData.slug || '',
      metaTitle: initialData.meta_title || '',
      metaDescription: initialData.meta_description || '',
    });

    if (Array.isArray(initialData.quantity_discounts) && initialData.quantity_discounts.length > 0) {
      setDiscountTiers(initialData.quantity_discounts);
    }

    if (initialData.sections) {
      setSections(initialData.sections);
      if (Array.isArray(initialData.sections.gallery_images)) {
        setGalleryImages(initialData.sections.gallery_images);
      }
    }

    if (initialData.promo_codes) {
      setGeneratedPromoCodes(initialData.promo_codes);
    }
  }, [initialData]);

  /* ─── Product search ────────────────────────────────────────── */

  const searchProducts = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const { data } = await supabase
        .from('mi_products')
        .select('id, name, slug, retail_price, cj_price, images, description, warehouse, mi_categories(name, slug)')
        .eq('status', 'active')
        .ilike('name', `%${query}%`)
        .limit(12);
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  }, [supabase]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const selectProduct = (product: any) => {
    const cat = product.mi_categories;
    const prod: SelectedProduct = {
      id: product.id,
      name: product.name,
      retail_price: product.retail_price,
      cj_price: product.cj_price || 0,
      images: product.images || [],
      description: product.description || '',
      category: cat?.slug || cat?.name || '',
      slug: product.slug,
      warehouse: product.warehouse,
    };
    setSelectedProduct(prod);
    autoFillSettings(prod);
    setDefaultImages(prod.images);
    setSearchQuery('');
    setSearchResults([]);
  };

  const autoFillSettings = (prod: SelectedProduct) => {
    const slug = prod.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setPageSettings({
      name: `${prod.name} Landing Page`,
      slug,
      metaTitle: `${prod.name} | MooreItems`,
      metaDescription: (prod.description || '').slice(0, 150),
    });
  };

  const setDefaultImages = (images: string[]) => {
    setImageSelections({
      hero: images[0] || '',
      feature1: images[1] || images[0] || '',
      feature2: images[2] || images[0] || '',
    });
  };

  const handleImageUpload = async (key: 'hero' | 'feature1' | 'feature2', file: File) => {
    setUploadingFor(key);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/admin/landing-pages/upload-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setExtraImages((prev) => [...prev, data.url]);
      setImageSelections((prev) => ({ ...prev, [key]: data.url }));
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed');
    } finally {
      setUploadingFor(null);
    }
  };

  const handlePasteUrl = (key: 'hero' | 'feature1' | 'feature2') => {
    const url = pasteUrls[key].trim();
    if (!url.startsWith('http')) return;
    setExtraImages((prev) => [...prev, url]);
    setImageSelections((prev) => ({ ...prev, [key]: url }));
    setPasteUrls((prev) => ({ ...prev, [key]: '' }));
  };

  const removeExtraImage = (url: string) => {
    setExtraImages((prev) => prev.filter((u) => u !== url));
    setImageSelections((prev) => {
      const next = { ...prev };
      if (next.hero === url) next.hero = '';
      if (next.feature1 === url) next.feature1 = '';
      if (next.feature2 === url) next.feature2 = '';
      return next;
    });
  };

  const removeProductImage = (url: string) => {
    setRemovedProductImages((prev) => new Set(prev).add(url));
    setImageSelections((prev) => {
      const next = { ...prev };
      if (next.hero === url) next.hero = '';
      if (next.feature1 === url) next.feature1 = '';
      if (next.feature2 === url) next.feature2 = '';
      return next;
    });
    // Also remove from gallery selection
    setGalleryImages((prev) => prev ? prev.filter((u) => u !== url) : prev);
  };

  /* ─── CJ Import ────────────────────────────────────────────── */

  const handleCjPreview = async () => {
    const trimmed = cjPid.trim();
    if (!trimmed) { setCjError('Enter a CJ Product ID'); return; }

    setCjPreviewLoading(true);
    setCjError(null);
    setCjPreview(null);

    try {
      const res = await fetch('/api/admin/products/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: trimmed, preview: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Product not found on CJ');
      setCjPreview(data);
    } catch (err: any) {
      setCjError(err.message || 'Failed to look up product');
    } finally {
      setCjPreviewLoading(false);
    }
  };

  const handleCjImport = async () => {
    const trimmed = cjPid.trim();
    if (!trimmed) return;

    setCjImporting(true);
    setCjError(null);

    try {
      const res = await fetch('/api/admin/products/import-cj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Import failed');

      const imported = data.product;
      const prod: SelectedProduct = {
        id: imported.id,
        name: imported.name,
        retail_price: imported.retail_price,
        cj_price: imported.cj_price || 0,
        images: imported.images || [],
        description: imported.description || '',
        category: '',
        slug: imported.slug,
        warehouse: imported.warehouse,
      };
      setSelectedProduct(prod);
      autoFillSettings(prod);
      setDefaultImages(prod.images);
      setCjPreview(null);
      setCjPid('');
      toast.success(`Imported "${imported.name}" and selected`);
    } catch (err: any) {
      setCjError(err.message || 'Import failed');
    } finally {
      setCjImporting(false);
    }
  };

  /* ─── AI Generate ──────────────────────────────────────────── */

  const handleGenerate = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/admin/landing-pages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          product_description: selectedProduct.description,
          product_price: selectedProduct.retail_price,
          category: selectedProduct.category,
          quantity_discounts: discountTiers,
          product_images: selectedProduct.images,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Generation failed');

      setSections(data.sections);
      setGeneratedPromoCodes(data.promo_codes || {});
      if (data.image_selections) {
        setImageSelections((prev) => ({
          hero: data.image_selections.hero || prev.hero,
          feature1: data.image_selections.feature1 || prev.feature1,
          feature2: data.image_selections.feature2 || prev.feature2,
        }));
      }
      toast.success('Landing page copy generated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setSections(null);
    setGeneratedPromoCodes({});
    handleGenerate();
  };

  /* ─── Section editing helpers ──────────────────────────────── */

  const updateField = (section: string, field: string, value: any) => {
    setSections((prev: any) => ({
      ...prev,
      [section]: { ...(prev?.[section] || {}), [field]: value },
    }));
  };

  const updateArrayItem = (section: string, index: number, field: string, value: any) => {
    setSections((prev: any) => {
      const arr = [...(prev?.[section] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [section]: arr };
    });
  };

  const addArrayItem = (section: string, template: any) => {
    setSections((prev: any) => ({
      ...prev,
      [section]: [...(prev?.[section] || []), template],
    }));
  };

  /* ─── Save ─────────────────────────────────────────────────── */

  const handleSave = async (status: 'draft' | 'live') => {
    if (!selectedProduct) { toast.error('Select a product first'); return; }
    if (!pageSettings.name.trim()) { toast.error('Landing page name is required'); return; }
    if (!pageSettings.slug.trim()) { toast.error('URL slug is required'); return; }

    console.log('[Save] imageSelections at save time:', JSON.stringify(imageSelections));
    console.log('[Save] hero_image_url being sent:', imageSelections.hero || null);
    // Filter removed images from gallery before saving
    const cleanGalleryImages = galleryImages
      ? galleryImages.filter((img) => !removedProductImages.has(img))
      : galleryImages;
    console.log('[Gallery Save]', cleanGalleryImages);
    setSaving(true);
    try {
      const payload = {
        name: pageSettings.name,
        slug: pageSettings.slug,
        product_id: selectedProduct.id,
        meta_title: pageSettings.metaTitle,
        meta_description: pageSettings.metaDescription,
        hero_image_url: imageSelections.hero || null,
        sections: {
          ...sections,
          feature1_image: imageSelections.feature1 || null,
          feature2_image: imageSelections.feature2 || null,
          gallery_images: cleanGalleryImages,
        },
        quantity_discounts: discountTiers,
        promo_codes: generatedPromoCodes,
        headline: sections?.hero?.headline || '',
        subheadline: sections?.hero?.subheadline || '',
        status,
      };

      const isEdit = !!initialData?.id;
      const url = isEdit
        ? `/api/admin/landing-pages/${initialData!.id}`
        : '/api/admin/landing-pages';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');

      toast.success(status === 'live' ? 'Published!' : 'Saved as draft');
      router.push('/admin/landing-pages');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  /* ─── CJ preview derived values ────────────────────────────── */

  const cjDetail = cjPreview?.data || null;
  const cjName = cjDetail?.productNameEn || cjDetail?.productName || null;
  const cjPrice = cjDetail?.sellPrice || cjDetail?.productSellPrice || null;
  const cjImageList: string[] = (() => {
    if (Array.isArray(cjDetail?.productImageSet) && cjDetail.productImageSet.length > 0) {
      return cjDetail.productImageSet;
    }
    if (typeof cjDetail?.productImage === 'string') {
      try {
        const parsed = JSON.parse(cjDetail.productImage);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
      return [cjDetail.productImage];
    }
    return [];
  })();
  const cjImage = cjImageList[0] || null;

  /* ─── Validation status ────────────────────────────────────── */

  const isValid = !!selectedProduct && !!pageSettings.name.trim() && !!pageSettings.slug.trim();

  /* ─── Render ───────────────────────────────────────────────── */

  return (
    <div className="space-y-6 max-w-3xl pb-24">

      {/* ── CARD 1: Product Selection ──────────────────────────── */}
      <div className={CARD}>
        <h2 className={TITLE}>Select Product</h2>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-5">
          <button
            onClick={() => setProductTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              productTab === 'catalog'
                ? 'bg-white text-[#1a1a2e] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Package className="w-4 h-4" />
            From Catalog
          </button>
          <button
            onClick={() => setProductTab('cj-import')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              productTab === 'cj-import'
                ? 'bg-white text-[#1a1a2e] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            Import from CJ
          </button>
        </div>

        {/* Catalog search tab */}
        {productTab === 'catalog' && (
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search products..."
                className={`${INPUT} pl-10`}
              />
            </div>

            {searchLoading && (
              <p className="text-sm text-gray-400 mt-3">Searching...</p>
            )}

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                {searchResults.map((p: any) => {
                  const thumb = p.images?.[0] || null;
                  const isSelected = selectedProduct?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectProduct(p)}
                      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        isSelected
                          ? 'border-gold-500 bg-gold-50/30'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a1a2e] truncate">{p.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">${p.retail_price?.toFixed(2)}</p>
                        {p.warehouse && (
                          <span className={`inline-block mt-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            p.warehouse === 'US'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {p.warehouse}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CJ import tab */}
        {productTab === 'cj-import' && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={cjPid}
                onChange={(e) => { setCjPid(e.target.value); setCjError(null); }}
                placeholder="e.g. 00A5B3C7-1234-4567-89AB-CDEF01234567"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCjPreview(); } }}
                className={`flex-1 ${INPUT} font-mono`}
              />
              <button
                type="button"
                onClick={handleCjPreview}
                disabled={cjPreviewLoading || !cjPid.trim()}
                className={OUTLINE_BTN}
              >
                {cjPreviewLoading ? (
                  <><RefreshCw className="w-4 h-4 animate-spin" /> Looking up...</>
                ) : 'Preview'}
              </button>
            </div>

            {cjError && (
              <div className="flex items-start gap-3 bg-danger/5 border border-danger/20 rounded-xl p-4">
                <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger font-medium">{cjError}</p>
              </div>
            )}

            {cjDetail && (
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex gap-4">
                  {cjImage && (
                    <img src={cjImage} alt="" referrerPolicy="no-referrer" className="w-20 h-20 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 space-y-1 text-sm">
                    <p className="font-semibold text-[#1a1a2e]">{cjName}</p>
                    <p className="text-gray-500">
                      CJ Price: <span className="font-semibold text-[#1a1a2e]">${typeof cjPrice === 'number' ? cjPrice.toFixed(2) : cjPrice}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex gap-3">
                  <button type="button" onClick={handleCjImport} disabled={cjImporting} className={GOLD_BTN}>
                    {cjImporting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Importing...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Import &amp; Select</>
                    )}
                  </button>
                  <button type="button" onClick={() => { setCjPreview(null); setCjPid(''); }} className={OUTLINE_BTN}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected product summary */}
        {selectedProduct && (
          <div className="mt-5 pt-5 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Selected Product</p>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-gray-400 hover:text-danger transition-colors"
              >
                Clear
              </button>
            </div>
            <div className="flex items-center gap-4">
              {selectedProduct.images?.[0] ? (
                <img src={selectedProduct.images[0]} alt="" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-[#1a1a2e]">{selectedProduct.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">${selectedProduct.retail_price.toFixed(2)}</p>
                {selectedProduct.category && (
                  <p className="text-xs text-gray-400 mt-0.5">{selectedProduct.category}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 2: Page Settings ──────────────────────────────── */}
      <div className={CARD}>
        <h2 className={TITLE}>Page Settings</h2>
        <div className="space-y-4">
          <div>
            <label className={LABEL}>Landing Page Name <span className="text-danger">*</span></label>
            <input
              type="text"
              value={pageSettings.name}
              onChange={(e) => setPageSettings((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Summer Wireless Earbuds Campaign"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>URL Slug <span className="text-danger">*</span></label>
            <input
              type="text"
              value={pageSettings.slug}
              onChange={(e) => setPageSettings((p) => ({ ...p, slug: e.target.value }))}
              placeholder="summer-earbuds"
              className={INPUT}
            />
            <p className="text-xs text-gray-400 mt-1">
              mooreitems.com/lp/<span className="font-medium text-gray-600">{pageSettings.slug || '...'}</span>
            </p>
          </div>
          <div>
            <label className={LABEL}>Meta Title</label>
            <input
              type="text"
              value={pageSettings.metaTitle}
              onChange={(e) => setPageSettings((p) => ({ ...p, metaTitle: e.target.value }))}
              placeholder="Product Name | MooreItems"
              className={INPUT}
            />
          </div>
          <div>
            <label className={LABEL}>Meta Description</label>
            <textarea
              value={pageSettings.metaDescription}
              onChange={(e) => setPageSettings((p) => ({ ...p, metaDescription: e.target.value }))}
              rows={2}
              placeholder="Brief description for search engines..."
              className={`${INPUT} resize-y`}
            />
          </div>
        </div>
      </div>

      {/* ── Hero Gallery Images ─────────────────────────────────── */}
      {selectedProduct && selectedProduct.images.length > 1 && (() => {
        const allImgs = [...selectedProduct.images.filter((img) => !removedProductImages.has(img)), ...extraImages];
        const selected = galleryImages
          ? galleryImages.filter((img) => allImgs.includes(img))
          : allImgs;

        const toggleImage = (img: string) => {
          if (galleryImages === null) {
            // First toggle — start from "all selected" and remove this one
            setGalleryImages(allImgs.filter((u) => u !== img));
          } else if (galleryImages.includes(img)) {
            // Don't allow deselecting the last image
            if (galleryImages.length <= 1) return;
            setGalleryImages(galleryImages.filter((u) => u !== img));
          } else {
            setGalleryImages([...galleryImages, img]);
          }
        };

        return (
          <div className={CARD}>
            <h2 className={TITLE}>Hero Gallery Images</h2>
            <p className="text-xs text-gray-400 -mt-2 mb-4">
              Choose which images appear in the crossfade gallery. Deselect any you don&apos;t want shown.
            </p>
            <div className="flex flex-wrap gap-2">
              {allImgs.map((img, i) => {
                const isSelected = selected.includes(img);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleImage(img)}
                    className={`relative w-[80px] h-[80px] rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-gold-500' : 'border-gray-200 opacity-40'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-gold-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              {selected.length} of {allImgs.length} images selected
            </p>
          </div>
        );
      })()}

      {/* ── CARD 3: Page Images ─────────────────────────────────── */}
      {selectedProduct && (selectedProduct.images.length > 0 || extraImages.length > 0) && (
        <div className={CARD}>
          <h2 className={TITLE}>Page Images</h2>
          <p className="text-xs text-gray-400 -mt-2 mb-5">
            Choose which product images to use for each section
          </p>

          <div className="space-y-6">
            {([
              { key: 'hero' as const, label: 'Hero Image' },
              { key: 'feature1' as const, label: 'Feature Section 1 Image' },
              { key: 'feature2' as const, label: 'Feature Section 2 Image' },
            ]).map(({ key, label }) => (
              <div key={key}>
                <label className={LABEL}>{label}</label>
                <div className="flex items-start gap-4">
                  {/* Current selection preview */}
                  {imageSelections[key] ? (
                    <div className="relative flex-shrink-0 group/preview cursor-pointer" onClick={() => setLightboxUrl(imageSelections[key])}>
                      <img
                        src={imageSelections[key]}
                        alt=""
                        className="w-[120px] h-[120px] rounded-lg object-cover border border-gray-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover/preview:bg-black/20 rounded-lg transition-colors flex items-center justify-center">
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/preview:opacity-100 transition-opacity drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-[120px] h-[120px] rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  {/* Scrollable image picker */}
                  <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-2 pb-1">
                      {selectedProduct.images.filter((img) => !removedProductImages.has(img)).map((img, i) => {
                        const isActive = imageSelections[key] === img;
                        return (
                          <div key={`prod-${i}`} className="relative flex-shrink-0 group">
                            <button
                              type="button"
                              onClick={() => {
                                console.log(`[ImagePicker] Setting ${key} to:`, img);
                                setImageSelections((prev) => {
                                  const next = { ...prev, [key]: img };
                                  console.log(`[ImagePicker] imageSelections updated:`, next);
                                  return next;
                                });
                              }}
                              className={`w-[72px] h-[72px] rounded-lg overflow-hidden border-2 transition-colors ${
                                isActive ? 'border-gold-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProductImage(img)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(img)}
                              className="absolute bottom-1 right-1 w-5 h-5 bg-black/50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                      {extraImages.map((img, i) => {
                        const isActive = imageSelections[key] === img;
                        return (
                          <div key={`extra-${i}`} className="relative flex-shrink-0 group">
                            <button
                              type="button"
                              onClick={() => setImageSelections((prev) => ({ ...prev, [key]: img }))}
                              className={`w-[72px] h-[72px] rounded-lg overflow-hidden border-2 transition-colors ${
                                isActive ? 'border-gold-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeExtraImage(img)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setLightboxUrl(img)}
                              className="absolute bottom-1 right-1 w-5 h-5 bg-black/50 text-white rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ZoomIn className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Upload / paste URL row */}
                <div className="flex items-center gap-3 mt-2 ml-[136px]">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => { uploadRefs.current[key] = el; }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(key, file);
                      e.target.value = '';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => uploadRefs.current[key]?.click()}
                    disabled={uploadingFor === key}
                    className="px-3 py-1.5 bg-white border border-gold-500 text-gold-600 text-xs font-semibold rounded-lg hover:bg-gold-50 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {uploadingFor === key ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    {uploadingFor === key ? 'Uploading...' : 'Upload Image'}
                  </button>
                  <div className="flex-1 flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Or paste image URL..."
                      value={pasteUrls[key]}
                      onChange={(e) => setPasteUrls((prev) => ({ ...prev, [key]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasteUrl(key)}
                      className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => handlePasteUrl(key)}
                      disabled={!pasteUrls[key].trim().startsWith('http')}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {uploadError && uploadingFor === null && (
                  <p className="text-xs text-red-500 mt-1 ml-[136px]">{uploadError}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CARD 4: Quantity Discount Tiers ────────────────────── */}
      <div className={CARD}>
        <h2 className={TITLE}>Quantity Discounts</h2>
        <p className="text-xs text-gray-400 -mt-2 mb-4">
          Customers who buy more save more &mdash; increases average order value
        </p>

        {selectedProduct && selectedProduct.retail_price > 0 && (() => {
          const sp = selectedProduct.retail_price;
          const cp = selectedProduct.cj_price;
          const margin = Math.round((sp - cp) * 100) / 100;
          const marginPct = sp > 0 ? Math.round((margin / sp) * 1000) / 10 : 0;
          return (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 mb-4 flex-wrap">
              <span className="inline-flex items-center gap-1">Sell Price:{' '}
                {editingSellPrice ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={editSellPrice}
                    onChange={(e) => setEditSellPrice(e.target.value)}
                    onBlur={handleSaveSellPrice}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveSellPrice(); if (e.key === 'Escape') setEditingSellPrice(false); }}
                    className="w-20 px-1.5 py-0.5 border border-gold-500 rounded text-xs text-[#1a1a2e] font-semibold focus:outline-none"
                  />
                ) : (
                  <button type="button" onClick={() => { setEditSellPrice(sp.toFixed(2)); setEditingSellPrice(true); }} className="font-semibold text-[#1a1a2e] hover:text-gold-600 underline decoration-dotted underline-offset-2 cursor-pointer">
                    ${sp.toFixed(2)}
                  </button>
                )}
                {priceSavedField === 'sell' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1">Your Cost:{' '}
                {editingCost ? (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    autoFocus
                    value={editCost}
                    onChange={(e) => setEditCost(e.target.value)}
                    onBlur={handleSaveCost}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCost(); if (e.key === 'Escape') setEditingCost(false); }}
                    className="w-20 px-1.5 py-0.5 border border-gold-500 rounded text-xs text-[#1a1a2e] font-semibold focus:outline-none"
                  />
                ) : (
                  <button type="button" onClick={() => { setEditCost(cp.toFixed(2)); setEditingCost(true); }} className="font-semibold text-[#1a1a2e] hover:text-gold-600 underline decoration-dotted underline-offset-2 cursor-pointer">
                    ${cp.toFixed(2)}
                  </button>
                )}
                {priceSavedField === 'cost' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </span>
              <span className="text-gray-300">|</span>
              <span>Margin: <span className={`font-semibold ${marginPct >= 40 ? 'text-emerald-600' : marginPct >= 25 ? 'text-amber-600' : 'text-red-600'}`}>${margin.toFixed(2)} ({marginPct}%)</span></span>
            </div>
          );
        })()}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="text-left py-2 pr-2 w-12">Qty</th>
                <th className="text-left py-2 px-2">Label</th>
                <th className="text-left py-2 px-2 w-24">Discount</th>
                <th className="text-left py-2 px-2">Badge</th>
                {selectedProduct && <th className="text-left py-2 pl-2">Price Preview</th>}
              </tr>
            </thead>
            <tbody>
              {discountTiers.map((tier, i) => {
                const basePrice = selectedProduct?.retail_price || 0;
                const discounted = Math.round(basePrice * (1 - tier.discount_pct / 100) * 100) / 100;
                const total = Math.round(discounted * tier.qty * 100) / 100;
                const saved = Math.round((basePrice * tier.qty - total) * 100) / 100;

                return (
                  <tr key={tier.qty} className="border-t border-gray-100">
                    <td className="py-3 pr-2 text-[#1a1a2e] font-semibold">{tier.qty}</td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => {
                          const next = [...discountTiers];
                          next[i] = { ...next[i], label: e.target.value };
                          setDiscountTiers(next);
                        }}
                        className={`${INPUT} max-w-[140px]`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative max-w-[90px]">
                        <input
                          type="number"
                          min={0}
                          max={50}
                          value={tier.discount_pct}
                          onChange={(e) => {
                            const next = [...discountTiers];
                            next[i] = { ...next[i], discount_pct: Number(e.target.value) || 0 };
                            setDiscountTiers(next);
                          }}
                          className={`${INPUT} pr-7`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <input
                        type="text"
                        value={tier.badge}
                        onChange={(e) => {
                          const next = [...discountTiers];
                          next[i] = { ...next[i], badge: e.target.value };
                          setDiscountTiers(next);
                        }}
                        placeholder="Optional"
                        className={`${INPUT} max-w-[140px]`}
                      />
                    </td>
                    {selectedProduct && (
                      <td className="py-3 pl-2 text-xs text-gray-400 whitespace-nowrap">
                        {tier.qty === 1 ? (
                          `$${basePrice.toFixed(2)}`
                        ) : (
                          `$${discounted.toFixed(2)} each · $${total.toFixed(2)} total · save $${saved.toFixed(2)}`
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CARD 4: AI Content Generation ──────────────────────── */}
      {selectedProduct && (
        <div className={CARD}>
          <h2 className={TITLE}>Landing Page Copy</h2>
          <p className="text-xs text-gray-400 -mt-2 mb-4">
            AI writes your headlines, benefits, testimonials, and CTAs
          </p>

          {/* Generate button (no sections yet) */}
          {!sections && !isGenerating && (
            <div className="text-center py-4">
              <button type="button" onClick={handleGenerate} className={`${GOLD_BTN} w-full justify-center`}>
                <Sparkles className="w-4 h-4" />
                Generate Landing Page Copy
              </button>
              <p className="text-xs text-gray-400 mt-3">
                Takes about 15 seconds &middot; You can edit everything after
              </p>
            </div>
          )}

          {/* Generating spinner */}
          {isGenerating && (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gold-500 mx-auto" />
              <p className="text-sm text-gray-500 mt-3">Writing your landing page copy...</p>
            </div>
          )}

          {/* Editable sections */}
          {sections && !isGenerating && (
            <div className="space-y-6">

              {/* Hero */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Hero</legend>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Headline</label>
                    <input type="text" value={sections.hero?.headline || ''} onChange={(e) => updateField('hero', 'headline', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Subheadline</label>
                    <input type="text" value={sections.hero?.subheadline || ''} onChange={(e) => updateField('hero', 'subheadline', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>CTA Button Text</label>
                    <input type="text" value={sections.hero?.cta_text || ''} onChange={(e) => updateField('hero', 'cta_text', e.target.value)} className={INPUT} />
                  </div>
                </div>
              </fieldset>

              {/* Benefits */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Benefits</legend>
                <div className="space-y-4">
                  {(sections.benefits || []).map((b: any, i: number) => (
                    <div key={i} className="grid grid-cols-[60px_1fr] gap-3">
                      <div>
                        <label className={LABEL}>Icon</label>
                        <input type="text" maxLength={3} value={b.icon || ''} onChange={(e) => updateArrayItem('benefits', i, 'icon', e.target.value)} className={`${INPUT} text-center`} />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className={LABEL}>Title</label>
                          <input type="text" value={b.title || ''} onChange={(e) => updateArrayItem('benefits', i, 'title', e.target.value)} className={INPUT} />
                        </div>
                        <div>
                          <label className={LABEL}>Body</label>
                          <textarea rows={2} value={b.body || ''} onChange={(e) => updateArrayItem('benefits', i, 'body', e.target.value)} className={`${INPUT} resize-y`} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('benefits', { icon: '', title: '', body: '' })} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 transition-colors">
                    <Plus className="w-4 h-4" /> Add Benefit
                  </button>
                </div>
              </fieldset>

              {/* Feature Blocks */}
              {(['feature_block_1', 'feature_block_2'] as const).map((key, idx) => (
                <fieldset key={key} className="border border-gray-200 rounded-xl p-4">
                  <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Feature Section {idx + 1}</legend>
                  <div className="space-y-3">
                    <div>
                      <label className={LABEL}>Headline</label>
                      <input type="text" value={sections[key]?.headline || ''} onChange={(e) => updateField(key, 'headline', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>Body</label>
                      <textarea rows={4} value={sections[key]?.body || ''} onChange={(e) => updateField(key, 'body', e.target.value)} className={`${INPUT} resize-y`} />
                    </div>
                    <div>
                      <label className={LABEL}>Image Position</label>
                      <div className="flex gap-2">
                        {(['left', 'right'] as const).map((pos) => (
                          <button
                            key={pos}
                            type="button"
                            onClick={() => updateField(key, 'image_position', pos)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-colors ${
                              sections[key]?.image_position === pos
                                ? 'bg-gold-500 border-gold-500 text-[#1a1a2e]'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            Image {pos.charAt(0).toUpperCase() + pos.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </fieldset>
              ))}

              {/* Social Proof */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Social Proof Bar</legend>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Headline</label>
                    <input type="text" value={sections.social_proof?.headline || ''} onChange={(e) => updateField('social_proof', 'headline', e.target.value)} className={INPUT} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['stat_1', 'stat_2', 'stat_3'] as const).map((stat) => (
                      <div key={stat}>
                        <label className={LABEL}>{stat.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</label>
                        <input type="text" value={sections.social_proof?.[stat] || ''} onChange={(e) => updateField('social_proof', stat, e.target.value)} className={INPUT} />
                      </div>
                    ))}
                  </div>
                </div>
              </fieldset>

              {/* Testimonials */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Testimonials</legend>
                <div className="space-y-4">
                  {(sections.testimonials || []).map((t: any, i: number) => (
                    <div key={i} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className={LABEL}>Name</label>
                          <input type="text" value={t.name || ''} onChange={(e) => updateArrayItem('testimonials', i, 'name', e.target.value)} className={INPUT} />
                        </div>
                        <div className="pt-5">
                          <span className="text-sm text-yellow-500">{'★'.repeat(5)}</span>
                        </div>
                      </div>
                      <div>
                        <label className={LABEL}>Review</label>
                        <textarea rows={3} value={t.review || ''} onChange={(e) => updateArrayItem('testimonials', i, 'review', e.target.value)} className={`${INPUT} resize-y`} />
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {/* FAQ */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">FAQ</legend>
                <div className="space-y-4">
                  {(sections.faq || []).map((item: any, i: number) => (
                    <div key={i} className="space-y-2 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div>
                        <label className={LABEL}>Question</label>
                        <input type="text" value={item.q || ''} onChange={(e) => updateArrayItem('faq', i, 'q', e.target.value)} className={INPUT} />
                      </div>
                      <div>
                        <label className={LABEL}>Answer</label>
                        <textarea rows={2} value={item.a || ''} onChange={(e) => updateArrayItem('faq', i, 'a', e.target.value)} className={`${INPUT} resize-y`} />
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => addArrayItem('faq', { q: '', a: '' })} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 transition-colors">
                    <Plus className="w-4 h-4" /> Add FAQ Item
                  </button>
                </div>
              </fieldset>

              {/* Closing CTA */}
              <fieldset className="border border-gray-200 rounded-xl p-4">
                <legend className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">Closing CTA</legend>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>Headline</label>
                    <input type="text" value={sections.closing_cta?.headline || ''} onChange={(e) => updateField('closing_cta', 'headline', e.target.value)} className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Urgency Line</label>
                    <input type="text" value={sections.closing_cta?.urgency_line || ''} onChange={(e) => updateField('closing_cta', 'urgency_line', e.target.value)} placeholder="e.g. Limited stock — order today" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>CTA Button Text</label>
                    <input type="text" value={sections.closing_cta?.cta_text || ''} onChange={(e) => updateField('closing_cta', 'cta_text', e.target.value)} className={INPUT} />
                  </div>
                </div>
              </fieldset>

              {/* Promo codes info */}
              {Object.keys(generatedPromoCodes).length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500">
                  <span className="font-semibold text-gray-600">Auto-created promo codes: </span>
                  {Object.entries(generatedPromoCodes).map(([key, code], i, arr) => {
                    const qty = parseInt(key.replace('qty_', ''));
                    const tier = discountTiers.find((t) => t.qty === qty);
                    return (
                      <span key={key}>
                        {code} ({tier?.discount_pct || 0}% off){i < arr.length - 1 ? ', ' : ''}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Regenerate button */}
              <button type="button" onClick={handleRegenerate} className={OUTLINE_BTN}>
                <RefreshCw className="w-4 h-4" />
                Regenerate Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── STICKY SAVE BAR ────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {isValid ? (
              <span className="text-success font-medium flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Ready to save
              </span>
            ) : (
              'Select a product to continue'
            )}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleSave('draft')}
              disabled={saving || !isValid}
              className={OUTLINE_BTN}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => handleSave('live')}
              disabled={saving || !isValid}
              className={GOLD_BTN}
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox overlay */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt=""
            className="max-w-2xl max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
