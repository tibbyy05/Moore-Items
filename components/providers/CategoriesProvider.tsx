'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  productCount: number;
  gradient: string;
  iconColor: string;
}

interface CategoriesContextValue {
  categories: CategoryItem[];
  loading: boolean;
}

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (response.ok) {
        const mapped: CategoryItem[] = (data.categories || []).map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          iconName: category.icon_name || 'Sparkles',
          productCount: category.product_count || 0,
          gradient: category.icon_gradient || 'from-warm-100 to-warm-50',
          iconColor: category.icon_color || 'text-warm-600',
        }));
        mapped.sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
        setCategories(mapped);
      }
      setLoading(false);
    };

    fetchCategories();
  }, []);

  const value = useMemo(() => ({ categories, loading }), [categories, loading]);

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) {
    throw new Error('useCategories must be used within CategoriesProvider');
  }
  return context;
}
