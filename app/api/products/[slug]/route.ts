import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from('mi_products')
    .select('id, name, slug, description, retail_price, compare_at_price, images, average_rating, review_count, shipping_estimate, warehouse, status, features, specs, created_at, category_id, digital_file_path, mi_categories(name, slug), mi_product_variants(id, name, retail_price, stock_count, images), mi_reviews(*)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
