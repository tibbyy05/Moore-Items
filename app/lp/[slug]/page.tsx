import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { LandingPageClient } from './LandingPageClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: page } = await supabase
    .from('mi_landing_pages')
    .select('meta_title, meta_description')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  return {
    title: page?.meta_title || 'MooreItems',
    description: page?.meta_description || '',
    robots: { index: false, follow: false },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: page, error } = await supabase
    .from('mi_landing_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error || !page) return notFound();

  const productIds = page.product_ids || [];
  if (productIds.length === 0) return notFound();

  const { data: product } = await supabase
    .from('mi_products')
    .select(
      'id, name, retail_price, images, description, slug, warehouse, warehouse_status, shipping_days, delivery_time, shipping_estimate, video_url, videos, mi_categories(name, slug), mi_product_variants(id, name, color, size, retail_price, stock_count, image_url, is_active)'
    )
    .eq('id', productIds[0])
    .eq('mi_product_variants.is_active', true)
    .single();

  if (!product) return notFound();

  // Unwrap mi_categories from array to single object (Supabase join returns array)
  const shaped = {
    ...product,
    mi_categories: Array.isArray(product.mi_categories)
      ? product.mi_categories[0] || null
      : product.mi_categories,
  };

  return <LandingPageClient page={page} product={shaped as any} />;
}
