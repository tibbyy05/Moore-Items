'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, X, Check, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface PolishModalProps {
  product: {
    id: string;
    name: string;
    description: string;
    category_id: string;
    category_slug: string;
    retail_price: number;
    images: string[];
    review_count: number;
  } | null;
  categories: { id: string; name: string; slug: string }[];
  isOpen: boolean;
  onClose: () => void;
  onPolished: () => void;
}

interface PolishResult {
  originalName: string;
  cleanedName: string;
  originalDescription: string;
  cleanedDescription: string;
  originalCategory: string;
  suggestedCategory: string;
  categoryChanged: boolean;
  categoryReason: string;
  reviewsGenerated: number;
}

type ModalState = 'ready' | 'loading' | 'results';

export function PolishModal({ product, categories, isOpen, onClose, onPolished }: PolishModalProps) {
  const [state, setState] = useState<ModalState>('ready');
  const [result, setResult] = useState<PolishResult | null>(null);
  const [acceptName, setAcceptName] = useState(true);
  const [acceptDescription, setAcceptDescription] = useState(true);
  const [acceptCategory, setAcceptCategory] = useState(true);
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);
  const [showNewDesc, setShowNewDesc] = useState(false);
  const [applying, setApplying] = useState(false);

  // Reset state when modal opens/closes or product changes
  useEffect(() => {
    if (isOpen) {
      setState('ready');
      setResult(null);
      setAcceptName(true);
      setAcceptDescription(true);
      setAcceptCategory(true);
      setShowOriginalDesc(false);
      setShowNewDesc(false);
      setApplying(false);
    }
  }, [isOpen, product?.id]);

  const handlePolish = useCallback(async () => {
    if (!product) return;
    setState('loading');

    try {
      const res = await fetch('/api/admin/products/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productName: product.name,
          description: product.description,
          categorySlug: product.category_slug,
          retailPrice: product.retail_price,
          images: product.images,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Polish failed');

      setResult(data.polish);
      setState('results');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to polish product');
      setState('ready');
    }
  }, [product]);

  const handleApply = useCallback(async () => {
    if (!product || !result) return;

    const updates: Record<string, unknown> = { id: product.id };
    let hasChanges = false;

    if (acceptName && result.cleanedName && result.cleanedName !== result.originalName) {
      updates.name = result.cleanedName;
      hasChanges = true;
    }

    if (acceptDescription && result.cleanedDescription && result.cleanedDescription !== result.originalDescription) {
      updates.description = result.cleanedDescription;
      hasChanges = true;
    }

    if (acceptCategory && result.categoryChanged && result.suggestedCategory !== result.originalCategory) {
      const newCat = categories.find((c) => c.slug === result.suggestedCategory);
      if (newCat) {
        updates.category_id = newCat.id;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      toast.success('No changes to apply');
      onPolished();
      onClose();
      return;
    }

    setApplying(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to apply changes');

      toast.success('Changes applied!');
      setTimeout(() => {
        onPolished();
        onClose();
      }, 1000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to apply changes');
      setApplying(false);
    }
  }, [product, result, acceptName, acceptDescription, acceptCategory, categories, onPolished, onClose]);

  if (!isOpen || !product) return null;

  const nameChanged = result ? result.cleanedName !== result.originalName : false;
  const descChanged = result ? (result.cleanedDescription && result.cleanedDescription !== result.originalDescription) : false;
  const firstImage = product.images?.[0] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1a1a2e] flex items-center gap-2">
            Polish Product
            <Sparkles className="w-5 h-5 text-violet-500" />
          </h2>
          <button
            onClick={onClose}
            disabled={state === 'loading'}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Product Info (always visible) */}
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
          {firstImage ? (
            <img
              src={firstImage}
              alt=""
              className="w-20 h-20 rounded-lg object-cover border border-gray-200 flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#1a1a2e] truncate">{product.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {categories.find((c) => c.slug === product.category_slug)?.name || product.category_slug}
              {' · '}${product.retail_price.toFixed(2)}
            </p>
            <p className={`text-xs mt-1 font-medium ${product.review_count > 0 ? 'text-gray-500' : 'text-amber-600'}`}>
              {product.review_count > 0 ? `${product.review_count} reviews` : 'No reviews'}
            </p>
          </div>
        </div>

        {/* State 1: Ready */}
        {state === 'ready' && (
          <div className="text-center">
            <button
              onClick={handlePolish}
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Run Polish
            </button>
            <p className="text-xs text-gray-400 mt-3">
              AI will clean the name, rewrite description, check category, and generate reviews
            </p>
          </div>
        )}

        {/* State 2: Loading */}
        {state === 'loading' && (
          <div className="text-center py-4">
            <button
              disabled
              className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white text-sm font-semibold rounded-xl opacity-75 cursor-not-allowed"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Polishing...
            </button>
            <p className="text-sm text-violet-500 mt-3 animate-pulse">
              Polishing with AI...
            </p>
          </div>
        )}

        {/* State 3: Results */}
        {state === 'results' && result && (
          <div className="space-y-5">
            {/* Name comparison */}
            {nameChanged && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Name</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Before</p>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-700">{result.originalName}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">After</p>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm text-green-700 font-medium">{result.cleanedName}</p>
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptName}
                    onChange={(e) => setAcceptName(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-600">Accept new name</span>
                </label>
              </div>
            )}

            {/* Description comparison */}
            {descChanged && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">Before</p>
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {result.originalDescription ? (
                        <p className={`text-sm text-gray-700 whitespace-pre-wrap ${!showOriginalDesc ? 'line-clamp-3' : ''}`}>
                          {result.originalDescription}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No description</p>
                      )}
                      {result.originalDescription && result.originalDescription.length > 150 && (
                        <button
                          onClick={() => setShowOriginalDesc(!showOriginalDesc)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1"
                        >
                          {showOriginalDesc ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Show more <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase mb-1">After</p>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className={`text-sm text-green-700 whitespace-pre-wrap ${!showNewDesc ? 'line-clamp-3' : ''}`}>
                        {result.cleanedDescription}
                      </p>
                      {result.cleanedDescription.length > 150 && (
                        <button
                          onClick={() => setShowNewDesc(!showNewDesc)}
                          className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 mt-1"
                        >
                          {showNewDesc ? (
                            <>Show less <ChevronUp className="w-3 h-3" /></>
                          ) : (
                            <>Show more <ChevronDown className="w-3 h-3" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptDescription}
                    onChange={(e) => setAcceptDescription(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-600">Accept new description</span>
                </label>
              </div>
            )}

            {/* Category change */}
            {result.categoryChanged && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Category</p>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-[#1a1a2e]">
                    <span className="text-gray-500">Current:</span>{' '}
                    <span className="font-medium">
                      {categories.find((c) => c.slug === result.originalCategory)?.name || result.originalCategory}
                    </span>
                    <span className="text-gray-400 mx-2">&rarr;</span>
                    <span className="text-gray-500">Suggested:</span>{' '}
                    <span className="font-medium text-amber-700">
                      {categories.find((c) => c.slug === result.suggestedCategory)?.name || result.suggestedCategory}
                    </span>
                  </p>
                  {result.categoryReason && (
                    <p className="text-xs text-gray-400 italic mt-1">{result.categoryReason}</p>
                  )}
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptCategory}
                    onChange={(e) => setAcceptCategory(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
                  />
                  <span className="text-xs text-gray-600">Accept category change</span>
                </label>
              </div>
            )}

            {/* Reviews generated */}
            {result.reviewsGenerated > 0 && (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                  <Check className="w-3.5 h-3.5" />
                  {result.reviewsGenerated} reviews generated
                </span>
              </div>
            )}

            {/* No changes detected */}
            {!nameChanged && !descChanged && !result.categoryChanged && result.reviewsGenerated === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">AI found nothing to change — this product looks good already!</p>
              </div>
            )}

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                disabled={applying}
                className="px-4 py-2 border border-gray-200 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Discard All
              </button>
              {(nameChanged || descChanged || result.categoryChanged) && (
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
                  {applying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Apply Selected Changes
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
