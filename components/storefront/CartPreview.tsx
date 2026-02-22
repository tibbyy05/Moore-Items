'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { CustomButton } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

interface CartPreviewProps {
  open: boolean;
  onClose: () => void;
}

export function CartPreview({ open, onClose }: CartPreviewProps) {
  const { items, subtotal, removeItem } = useCart();
  const previewItems = items.slice(0, 3);
  const remainingCount = items.length - previewItems.length;

  return (
    <div
      className={cn(
        'absolute right-0 mt-3 w-[320px] bg-white border border-warm-200 rounded-2xl shadow-xl overflow-hidden transition-all',
        open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
      )}
    >
      <div className="p-4 border-b border-warm-100">
        <p className="font-semibold text-warm-900">Cart</p>
      </div>

      {items.length === 0 ? (
        <div className="p-6 text-sm text-warm-600">Your cart is empty.</div>
      ) : (
        <>
          <div className="max-h-[260px] overflow-y-auto">
            {previewItems.map((item) => (
              <div key={`${item.productId}-${item.variantId || 'default'}`} className="flex gap-3 p-4">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-warm-50">
                  <Image
                    src={item.image || '/placeholder.svg'}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/product/${item.slug || item.productId}`}
                    className="text-sm font-semibold text-warm-900 line-clamp-2"
                    onClick={onClose}
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-warm-500">
                    {item.quantity} × ${item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.productId, item.variantId)}
                  className="p-1 rounded-full hover:bg-warm-50"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4 text-warm-400" />
                </button>
              </div>
            ))}
          </div>

          {remainingCount > 0 && (
            <div className="px-4 pb-2 text-xs text-warm-500">
              And {remainingCount} more item{remainingCount > 1 ? 's' : ''}
            </div>
          )}

          <div className="border-t border-warm-100 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-warm-600">Subtotal</span>
              <span className="font-semibold text-warm-900">${subtotal.toFixed(2)}</span>
            </div>
            <CustomButton variant="primary" size="sm" className="w-full" asChild>
              <Link href="/cart" onClick={onClose}>
                View Cart
              </Link>
            </CustomButton>
            <CustomButton
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                onClose();
                alert('Checkout functionality coming soon!');
              }}
            >
              Checkout
            </CustomButton>
          </div>
        </>
      )}
    </div>
  );
}
