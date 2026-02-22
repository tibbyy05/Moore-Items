'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { CartItem as CartItemType } from '@/lib/types';
import { QuantityStepper } from '@/components/product/QuantityStepper';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b border-warm-200 last:border-0">
      <Link
        href={`/product/${item.slug || item.productId}`}
        className="relative w-20 h-20 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0"
      >
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          href={`/product/${item.slug || item.productId}`}
          className="font-semibold text-warm-900 hover:text-gold-600 transition-colors line-clamp-2"
        >
          {item.name}
        </Link>
        {item.variantName && (
          <p className="text-sm text-warm-500 mt-1">{item.variantName}</p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <QuantityStepper
            value={item.quantity}
            onChange={onUpdateQuantity}
            size="sm"
          />
          <p className="font-bold text-warm-900">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
      </div>

      <button
        onClick={onRemove}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-warm-50 text-warm-500 hover:text-danger transition-colors"
        aria-label="Remove item"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
