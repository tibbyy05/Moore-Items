'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  Search,
  X,
  ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

interface HeroImage {
  id: string;
  product_id: string;
  image_url: string;
  product_name: string | null;
  slot: number;
  is_active: boolean;
  created_at: string;
}

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  images: string[];
}

const SLOT_CONFIG = [
  { slot: 1, label: 'Slot 1 — Large Left' },
  { slot: 2, label: 'Slot 2 — Top Right' },
  { slot: 3, label: 'Slot 3 — Small Bottom Left' },
  { slot: 4, label: 'Slot 4 — Small Bottom Right' },
] as const;

interface PreviewSlot {
  image_url: string;
  product_name: string | null;
}

function HeroPreview({ slotMap }: { slotMap: Record<number, HeroImage[]> }) {
  const first = (slot: number): PreviewSlot | null => {
    const active = (slotMap[slot] || []).filter((i) => i.is_active);
    return active.length > 0 ? active[0] : null;
  };

  const renderSlot = (slotNum: number, className: string) => {
    const item = first(slotNum);
    if (item) {
      return (
        <div className={`relative overflow-hidden rounded-xl ring-1 ring-white/10 ${className}`}>
          <Image
            src={item.image_url}
            alt={item.product_name || ''}
            fill
            className="object-cover object-center"
            sizes="200px"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a]/60 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 right-2 text-[10px] font-medium text-white/80 line-clamp-1">
            {item.product_name}
          </span>
        </div>
      );
    }
    return (
      <div className={`relative overflow-hidden rounded-xl ring-1 ring-white/[0.06] bg-white/[0.03] flex items-center justify-center ${className}`}>
        <Plus className="w-5 h-5 text-white/20" />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 grid-rows-[1fr_1fr] gap-1.5 w-full aspect-[4/3]">
      {renderSlot(1, 'row-span-2')}
      {renderSlot(2, '')}
      <div className="grid grid-cols-2 gap-1.5">
        {renderSlot(3, '')}
        {renderSlot(4, '')}
      </div>
    </div>
  );
}

export default function HeroImagesPage() {
  const [items, setItems] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSlot, setAddingSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/hero-images');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error('Failed to load hero images');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const slotMap = useMemo(() => {
    const map: Record<number, HeroImage[]> = { 1: [], 2: [], 3: [], 4: [] };
    for (const item of items) {
      if (map[item.slot]) map[item.slot].push(item);
    }
    return map;
  }, [items]);

  const totalActive = useMemo(
    () => items.filter((i) => i.is_active).length,
    [items]
  );

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/hero-images/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((h) => h.id !== id));
      toast.success('Removed from hero rotation');
    } else {
      toast.error('Failed to remove');
    }
  };

  const handleToggleActive = async (item: HeroImage) => {
    const res = await fetch(`/api/admin/hero-images/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !item.is_active }),
    });
    if (res.ok) {
      setItems((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, is_active: !h.is_active } : h))
      );
    } else {
      toast.error('Failed to toggle');
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(
        (data.products || data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          images: p.images || [],
        }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddImage = async (product: SearchProduct, imageUrl: string) => {
    if (addingSlot === null) return;
    const res = await fetch('/api/admin/hero-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: product.id,
        image_url: imageUrl,
        product_name: product.name,
        slot: addingSlot,
      }),
    });
    if (res.ok) {
      toast.success(`Added to Slot ${addingSlot}`);
      closeModal();
      fetchItems();
    } else {
      toast.error('Failed to add');
    }
  };

  const openModal = (slot: number) => {
    setAddingSlot(slot);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedProduct(null);
  };

  const closeModal = () => {
    setAddingSlot(null);
    setSelectedProduct(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hero Images</h1>
        <p className="text-sm text-gray-500 mt-1">
          Assign images to each slot in the homepage hero grid. Each slot rotates through its own pool independently.
          {totalActive > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-gold-100 text-gold-600 text-xs font-semibold rounded">
              {totalActive} active total
            </span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: Slot buckets */}
        <div>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-sm text-gray-400 mt-3">Loading...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {SLOT_CONFIG.map(({ slot, label }) => {
                const slotItems = slotMap[slot] || [];
                const activeInSlot = slotItems.filter((i) => i.is_active).length;
                return (
                  <div
                    key={slot}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {slotItems.length} image{slotItems.length !== 1 ? 's' : ''}
                          {activeInSlot !== slotItems.length && ` (${activeInSlot} active)`}
                        </p>
                      </div>
                      <button
                        onClick={() => openModal(slot)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-navy-950 text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add
                      </button>
                    </div>
                    <div className="p-3">
                      {slotItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <ImageIcon className="w-8 h-8 text-gray-200 mb-2" />
                          <p className="text-xs text-gray-400">No images assigned</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {slotItems.map((item) => (
                            <div key={item.id} className="relative group">
                              <div className={`relative aspect-square rounded-lg overflow-hidden bg-gray-100 ring-1 ${item.is_active ? 'ring-gray-200' : 'ring-gray-200 opacity-40'}`}>
                                <Image
                                  src={item.image_url}
                                  alt={item.product_name || ''}
                                  fill
                                  className="object-cover"
                                  sizes="100px"
                                  unoptimized
                                />
                              </div>
                              <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                                <button
                                  onClick={() => handleToggleActive(item)}
                                  className="p-1.5 rounded-md bg-white/90 hover:bg-white text-gray-700 transition-colors"
                                  title={item.is_active ? 'Hide' : 'Show'}
                                >
                                  <span className="text-[10px] font-bold leading-none">{item.is_active ? 'ON' : 'OFF'}</span>
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  className="p-1.5 rounded-md bg-white/90 hover:bg-white text-red-500 transition-colors"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[10px] text-gray-500 truncate mt-1 px-0.5">{item.product_name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Live preview */}
        <div className="xl:sticky xl:top-6">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-white border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Homepage Preview</h2>
            </div>
            <div className="bg-[#0f1629] p-3">
              <HeroPreview slotMap={slotMap} />
            </div>
            <div className="px-4 py-2.5 bg-white border-t border-gray-100">
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Each slot rotates through its own pool independently. Preview shows the first active image per slot.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Image Modal */}
      {addingSlot !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedProduct
                  ? 'Choose an Image'
                  : `Add to ${SLOT_CONFIG[addingSlot - 1].label}`}
              </h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {!selectedProduct ? (
              <>
                <div className="px-6 py-4 border-b border-gray-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      placeholder="Search products by name..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-2">
                  {searching && (
                    <p className="text-sm text-gray-400 py-4 text-center">Searching...</p>
                  )}
                  {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
                    <p className="text-sm text-gray-400 py-4 text-center">No products found</p>
                  )}
                  {searchResults.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      {product.images[0] ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <Image
                            src={product.images[0]}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-5 h-5 text-gray-300" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.images.length} image{product.images.length !== 1 ? 's' : ''}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-3 border-b border-gray-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-sm text-gold-600 hover:text-gold-700 font-medium"
                  >
                    &larr; Back to search
                  </button>
                  <span className="text-sm text-gray-400">|</span>
                  <span className="text-sm text-gray-700 font-medium truncate">{selectedProduct.name}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {selectedProduct.images.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">This product has no images</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {selectedProduct.images.map((imageUrl, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddImage(selectedProduct, imageUrl)}
                          className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group ring-1 ring-gray-200 hover:ring-gold-500 hover:ring-2 transition-all"
                        >
                          <Image
                            src={imageUrl}
                            alt={`${selectedProduct.name} image ${idx + 1}`}
                            fill
                            className="object-cover"
                            sizes="200px"
                            unoptimized
                          />
                          <div className="absolute inset-0 bg-gold-500/0 group-hover:bg-gold-500/10 transition-colors flex items-center justify-center">
                            <span className="text-white text-xs font-semibold bg-navy-900/70 px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                              Use this image
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
