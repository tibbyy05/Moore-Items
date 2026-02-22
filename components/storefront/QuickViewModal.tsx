'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, Check } from 'lucide-react';
import { Product, ProductVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { VariantSelector } from '@/components/product/VariantSelector';
import { useCart } from '@/components/providers/CartProvider';
import { CustomButton } from '@/components/ui/custom-button';

interface QuickViewModalProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, open, onClose }: QuickViewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    product.variants[0]
  );
  const [addedState, setAddedState] = useState(false);
  const { addItem } = useCart();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab') return;
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    const focusable = modalRef.current?.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [open, onClose]);

  const effectivePrice = selectedVariant?.price || product.price;

  const handleAdd = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      variantName: selectedVariant?.name,
      price: effectivePrice,
      quantity,
      image: product.images[0],
      warehouse: product.warehouse,
    });
    setAddedState(true);
    window.setTimeout(() => setAddedState(false), 1500);
  };

  const modal = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        open ? 'pointer-events-auto' : 'pointer-events-none'
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          'absolute inset-0 bg-navy-950/60 backdrop-blur-sm transition-opacity',
          open ? 'opacity-100' : 'opacity-0'
        )}
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden',
          'transition-all duration-200',
          open ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        role="dialog"
        aria-modal="true"
        ref={modalRef}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow"
          aria-label="Close quick view"
        >
          <X className="w-5 h-5 text-warm-600" />
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          <div className="relative aspect-square bg-warm-50">
            <Image
              src={product.images[0] || '/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              unoptimized
            />
          </div>

          <div className="p-6 sm:p-8">
            <p className="text-xs font-semibold text-gold-600 uppercase tracking-widest mb-2">
              {product.categoryLabel}
            </p>
            <h3 className="text-2xl font-playfair font-semibold text-warm-900 mb-3">
              {product.name}
            </h3>

            <div className="flex items-center gap-2 mb-4">
              {product.compareAtPrice && (
                <span className="text-sm text-warm-400 line-through">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
              <span className="text-xl font-bold text-warm-900">
                ${effectivePrice.toFixed(2)}
              </span>
            </div>

            <p className="text-sm text-warm-600 line-clamp-3 mb-6">
              {product.description || 'A curated pick from the MooreItems collection.'}
            </p>

            {product.variants.length > 0 && (
              <div className="mb-6">
                <VariantSelector
                  variants={product.variants}
                  selectedVariantId={selectedVariant?.id}
                  onSelect={setSelectedVariant}
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-warm-900 mb-3">
                Quantity
              </label>
              <QuantityStepper value={quantity} onChange={setQuantity} />
            </div>

            <CustomButton
              variant="primary"
              size="lg"
              className={cn('w-full justify-center', addedState && 'bg-success text-white')}
              onClick={handleAdd}
            >
              {addedState ? (
                <>
                  <Check className="w-5 h-5" />
                  Added!
                </>
              ) : (
                'Add to Cart'
              )}
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
