'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { CartItem } from './CartItem';
import { CustomButton } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const { items, itemCount, subtotal, updateQuantity, removeItem, isCartOpen, closeCart } =
    useCart();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-navy-950/60 backdrop-blur-sm z-50 transition-opacity duration-300',
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 transition-transform duration-300 flex flex-col',
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-xl font-playfair font-semibold text-warm-900">
            Shopping Cart
            {itemCount > 0 && (
              <span className="ml-2 text-warm-500">({itemCount})</span>
            )}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 rounded-lg hover:bg-warm-50 transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5 text-warm-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-warm-50 flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-warm-400" />
            </div>
            <h3 className="text-lg font-semibold text-warm-900 mb-2">
              Your cart is empty
            </h3>
            <p className="text-warm-600 mb-6">
              Add some items to get started!
            </p>
            <CustomButton variant="primary" onClick={closeCart} asChild>
              <Link href="/">Continue Shopping</Link>
            </CustomButton>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.variantId || 'default'}`}
                  item={item}
                  onUpdateQuantity={(quantity) =>
                    updateQuantity(item.productId, quantity, item.variantId)
                  }
                  onRemove={() => removeItem(item.productId, item.variantId)}
                />
              ))}
            </div>

            <div className="border-t border-warm-200 px-6 py-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-warm-700">Subtotal</span>
                <span className="text-2xl font-bold text-warm-900">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <CustomButton variant="primary" size="lg" className="w-full" asChild>
                <Link href="/cart" onClick={closeCart}>
                  View Cart
                </Link>
              </CustomButton>

              <CustomButton variant="secondary" size="lg" className="w-full" asChild>
                <Link href="/cart" onClick={closeCart}>
                  Checkout
                </Link>
              </CustomButton>
            </div>
          </>
        )}
      </div>
    </>
  );
}
