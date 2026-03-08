'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Link2, Loader2, CheckCircle, ArrowLeft, ArrowRight, Star } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ExtractResult {
  raw: {
    title: string;
    description: string;
    price: number;
    images: string[];
    variants: { name: string }[];
  };
  polished: {
    title: string;
    description: string;
    suggested_category: string;
  };
  pricing: {
    cost: number;
    retail_price: number;
    compare_at_price: number;
    stripe_fee: number;
    margin_dollars: number;
    margin_percent: number;
  };
  source_url: string;
}

export default function ImportUrlPage() {
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [extractData, setExtractData] = useState<ExtractResult | null>(null);

  // Review form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [sellPrice, setSellPrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [warehouse, setWarehouse] = useState('US');
  const [stockCount, setStockCount] = useState(999);
  const [deliveryTime, setDeliveryTime] = useState('Delivered in 3-7 days');
  const [images, setImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [cost, setCost] = useState(0);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedProduct, setSavedProduct] = useState<{ id: string; slug: string } | null>(null);

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  const marginCalc = sellPrice > 0
    ? parseFloat(((sellPrice - cost - (sellPrice * 0.029 + 0.30)) / sellPrice * 100).toFixed(1))
    : 0;

  const marginColor = marginCalc >= 40 ? 'bg-emerald-100 text-emerald-700' : marginCalc >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';

  const handleExtract = async () => {
    if (!url.trim()) return;
    setExtracting(true);
    setExtractError('');
    setExtractData(null);
    setSavedProduct(null);

    try {
      const res = await fetch('/api/admin/products/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract', url: url.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Extraction failed');
      }

      setExtractData(data);
      setName(data.polished.title || data.raw.title || '');
      setDescription(data.polished.description || data.raw.description || '');
      setCategorySlug(data.polished.suggested_category || '');
      setSellPrice(data.pricing.retail_price);
      setCompareAtPrice(data.pricing.compare_at_price);
      setCost(data.pricing.cost);
      setImages(data.raw.images || []);
      setPrimaryIndex(0);
      setWarehouse('US');
      setStockCount(999);
      setDeliveryTime('Delivered in 3-7 days');
    } catch (err: any) {
      setExtractError(err?.message || 'Failed to extract product data');
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    // Reorder images so primary is first
    const orderedImages = [...images];
    if (primaryIndex > 0 && primaryIndex < orderedImages.length) {
      const [primary] = orderedImages.splice(primaryIndex, 1);
      orderedImages.unshift(primary);
    }

    const stripeCalc = parseFloat((sellPrice * 0.029 + 0.30).toFixed(2));
    const marginDollars = parseFloat((sellPrice - cost - stripeCalc).toFixed(2));
    const marginPercent = sellPrice > 0 ? parseFloat(((marginDollars / sellPrice) * 100).toFixed(1)) : 0;

    try {
      const res = await fetch('/api/admin/products/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          data: {
            name,
            description,
            category_slug: categorySlug,
            images: orderedImages,
            cost,
            retail_price: sellPrice,
            compare_at_price: compareAtPrice,
            stripe_fee: stripeCalc,
            margin_dollars: marginDollars,
            margin_percent: marginPercent,
            warehouse,
            stock_count: stockCount,
            delivery_time: deliveryTime,
            source_url: extractData?.source_url || url,
          },
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save product');
      }

      setSavedProduct({ id: data.product_id, slug: data.slug });
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleStartOver = () => {
    setExtractData(null);
    setExtractError('');
    setSaveError('');
    setSavedProduct(null);
    setUrl('');
  };

  // STATE 3 — Saving complete
  if (savedProduct) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Import Product from URL</h1>
          <p className="text-sm text-gray-500">Paste any product URL to auto-import with AI — AliExpress, Amazon, or any store</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold text-[#1a1a2e] mb-2">Product published!</h2>
          <p className="text-sm text-gray-500 mb-6">{name}</p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href={`/product/${savedProduct.slug}`}
              className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors"
            >
              View Product
            </Link>
            <Link
              href="/admin/products"
              className="px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors"
            >
              Go to Catalog
            </Link>
          </div>
          <button
            onClick={handleStartOver}
            className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Import another product
          </button>
        </div>
      </>
    );
  }

  // STATE 2 — Review extracted data
  if (extractData) {
    return (
      <>
        <div className="mb-8">
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Import Product from URL</h1>
          <p className="text-sm text-gray-500">Paste any product URL to auto-import with AI — AliExpress, Amazon, or any store</p>
        </div>

        {saving && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center mb-6">
            <Loader2 className="w-6 h-6 animate-spin text-gold-500 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Publishing product...</p>
          </div>
        )}

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column — Images */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Images</h2>
            {images.length > 0 ? (
              <>
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-50 mb-4 border border-gray-100">
                  <img
                    src={images[primaryIndex] || images[0]}
                    alt="Primary"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setPrimaryIndex(i)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                        i === primaryIndex ? 'border-gold-500' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <img src={img} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Click an image to set it as primary</p>
              </>
            ) : (
              <div className="aspect-square rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                <p className="text-sm text-gray-400">No images extracted</p>
              </div>
            )}

            {extractData.raw.variants.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Variants Found</h3>
                <div className="flex flex-wrap gap-1.5">
                  {extractData.raw.variants.map((v, i) => (
                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">{v.name}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column — Form */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Product Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a1a2e] mb-1">Product Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a2e] mb-1">Description</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40 resize-vertical"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a1a2e] mb-1">Category</label>
                <select
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                >
                  <option value="">Select category...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Pricing</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Cost / Your Price</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
                      ${cost.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Sell Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sellPrice}
                      onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Compare-at Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Margin</label>
                    <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${marginColor}`}>
                        {marginCalc}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Fulfillment</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Warehouse</label>
                    <select
                      value={warehouse}
                      onChange={(e) => setWarehouse(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    >
                      <option value="US">US</option>
                      <option value="CN">CN</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Stock Count</label>
                    <input
                      type="number"
                      value={stockCount}
                      onChange={(e) => setStockCount(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Delivery Time</label>
                    <input
                      type="text"
                      value={deliveryTime}
                      onChange={(e) => setDeliveryTime(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={handleStartOver}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-[#1a1a2e] transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Start Over
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                Publish to Store
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // STATE 1 — Input form
  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Import Product from URL</h1>
        <p className="text-sm text-gray-500">Paste any product URL to auto-import with AI — AliExpress, Amazon, or any store</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center">
            <Link2 className="w-5 h-5 text-gold-500" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">Product URL</h2>
            <p className="text-xs text-gray-400">We&apos;ll extract title, description, images, and pricing automatically</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.aliexpress.us/item/..."
            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
            className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-[#1a1a2e] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
          />
          <button
            onClick={handleExtract}
            disabled={extracting || !url.trim()}
            className="px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {extracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              'Fetch & Extract'
            )}
          </button>
        </div>

        {extracting && (
          <div className="flex items-center gap-3 mt-4 p-4 bg-gray-50 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-gold-500" />
            <p className="text-sm text-gray-600">Fetching and analyzing product...</p>
          </div>
        )}

        {extractError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">{extractError}</p>
          </div>
        )}
      </div>
    </>
  );
}
