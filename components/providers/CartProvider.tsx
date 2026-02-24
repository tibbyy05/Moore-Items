'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/storefront/ToastProvider';
import { CartItem } from '@/lib/types';

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = 'mi_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CartItem[];
        const normalized = parsed.map((item) => ({
          ...item,
          variantId: item.variantId ?? null,
          warehouse: (item.warehouse || 'CN') as 'US' | 'CN' | 'CA',
        }));
        setItems(normalized);
      }
    } catch {
      setItems([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore write errors (private mode / storage full)
    }
  }, [items]);

  const addItem = useCallback((newItem: CartItem) => {
    let toastMessage: { title: string; description: string } | null = null;

    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) =>
          item.productId === newItem.productId &&
          (item.variantId ?? null) === (newItem.variantId ?? null)
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + newItem.quantity,
        };
        toastMessage = {
          title: 'Cart updated',
          description: `${newItem.name} quantity increased to ${updatedItems[existingItemIndex].quantity}`,
        };
        return updatedItems;
      }

      toastMessage = {
        title: 'Added to cart',
        description: `${newItem.name} has been added to your cart`,
      };
      return [...currentItems, newItem];
    });

    // Toast outside the updater to avoid StrictMode double-fire
    setTimeout(() => {
      if (toastMessage) {
        pushToast(toastMessage.title, {
          description: toastMessage.description,
          type: 'success',
        });
      }
    }, 0);
  }, [pushToast]);

  const removeItem = useCallback((productId: string, variantId?: string | null) => {
    let removedName: string | null = null;

    setItems((currentItems) => {
      const item = currentItems.find(
        (i) =>
          i.productId === productId &&
          (i.variantId ?? null) === (variantId ?? null)
      );

      if (item) {
        removedName = item.name;
      }

      return currentItems.filter(
        (i) =>
          !(i.productId === productId && (i.variantId ?? null) === (variantId ?? null))
      );
    });

    setTimeout(() => {
      if (removedName) {
        pushToast('Removed from cart', {
          description: `${removedName} has been removed from your cart`,
          type: 'info',
        });
      }
    }, 0);
  }, [pushToast]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantId?: string | null) => {
      if (quantity <= 0) {
        removeItem(productId, variantId);
        return;
      }

      setItems((currentItems) =>
        currentItems.map((item) =>
          item.productId === productId && (item.variantId ?? null) === (variantId ?? null)
            ? { ...item, quantity }
            : item
        )
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => {
    setItems([]);
    pushToast('Cart cleared', {
      description: 'All items have been removed from your cart',
      type: 'warning',
    });
  }, [pushToast]);

  const openCart = useCallback(() => {
    setIsCartOpen(true);
  }, []);

  const closeCart = useCallback(() => {
    setIsCartOpen(false);
  }, []);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const getCartTotal = useCallback(() => subtotal, [subtotal]);
  const getCartItemCount = useCallback(() => itemCount, [itemCount]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        getCartTotal,
        getCartItemCount,
        isCartOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
