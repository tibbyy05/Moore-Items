'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useToast } from '@/components/storefront/ToastProvider';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/AuthProvider';

interface WishlistContextValue {
  items: string[];
  toggleWishlist: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  loading: boolean;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);
const STORAGE_KEY = 'mi_wishlist_v1';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const [itemsSet, setItemsSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();
  const initializedRef = useRef(false);
  const { user, customer, loading: authLoading } = useAuth();
  const customerId = customer?.id || null;

  useEffect(() => {
    const init = async () => {
      if (authLoading) return;
      const supabase = createClient();

      if (user && customerId) {
        const { data: dbWishlist } = await supabase
          .from('mi_wishlists')
          .select('product_id')
          .eq('customer_id', customerId);

        const dbIds = (dbWishlist || []).map((w: any) => w.product_id);

        let localIds: string[] = [];
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) localIds = JSON.parse(stored);
        } catch {}

        const newIds = localIds.filter((id) => !dbIds.includes(id));
        if (newIds.length > 0) {
          const inserts = newIds.map((product_id) => ({
            customer_id: customerId,
            product_id,
          }));
          for (const item of inserts) {
            const { error } = await supabase.from('mi_wishlists').insert(item);
            if (error && error.code !== '23505') {
              console.error('Wishlist insert error:', error);
            }
          }
        }

        const allIds = Array.from(new Set([...dbIds, ...localIds]));
        setItems(allIds);
        setItemsSet(new Set(allIds));
        localStorage.removeItem(STORAGE_KEY);
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setItems(parsed);
            setItemsSet(new Set(parsed));
          } else {
            setItems([]);
            setItemsSet(new Set());
          }
        } catch {}
      }

      initializedRef.current = true;
      setLoading(false);
    };

    init();
  }, [user, customerId, authLoading]);

  useEffect(() => {
    if (!initializedRef.current) return;
    if (!user) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch {}
    }
  }, [items, user]);

  const toggleWishlist = useCallback(
    async (productId: string, productName?: string) => {
      const exists = itemsSet.has(productId);

      setItems((current) =>
        exists ? current.filter((id) => id !== productId) : [...current, productId]
      );
      setItemsSet((current) => {
        const next = new Set(current);
        if (exists) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });

      pushToast(exists ? 'Removed from wishlist' : 'Added to wishlist', {
        description: productName || undefined,
        type: exists ? 'info' : 'success',
      });

      if (customerId) {
        const supabase = createClient();
        if (exists) {
          await supabase
            .from('mi_wishlists')
            .delete()
            .eq('customer_id', customerId)
            .eq('product_id', productId);
        } else {
          const { error } = await supabase
            .from('mi_wishlists')
            .insert({ customer_id: customerId, product_id: productId });
          if (error && error.code !== '23505') {
            console.error('Wishlist insert error:', error);
          }
        }
      }
    },
    [itemsSet, customerId, pushToast]
  );

  const value = useMemo(
    () => ({
      items,
      toggleWishlist,
      isWishlisted: (productId: string) => itemsSet.has(productId),
      loading,
    }),
    [items, itemsSet, toggleWishlist, loading]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
}
