import { cache } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export interface ProductPageData {
  id: string;
  name: string;
  slug: string;
  retail_price: number;
  compare_at_price: number | null;
  description: string;
  images: string[];
  stock_count: number;
  status: string;
  created_at: string;
  average_rating: number;
  review_count: number;
  shipping_days: string;
  warehouse: string;
  badge: string | null;
  cj_pid: string | null;
  digital_file_path: string | null;
  mi_categories: { name: string; slug: string } | null;
  mi_product_variants: Array<{
    id: string;
    name: string;
    color: string | null;
    size: string | null;
    retail_price: number | null;
    stock_count: number | null;
    is_active: boolean;
    image_url: string | null;
  }>;
}

export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export interface CategoryPageData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  faq_json: CategoryFaqItem[] | null;
}

export const fetchProductBySlug = cache(
  async (slug: string): Promise<ProductPageData | null> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('mi_products')
      .select('*, mi_categories(name, slug), mi_product_variants(*)')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return data as ProductPageData;
  }
);

export const fetchCategoryBySlug = cache(
  async (slug: string): Promise<CategoryPageData | null> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('mi_categories')
      .select('id, name, slug, description, faq_json')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as CategoryPageData;
  }
);
