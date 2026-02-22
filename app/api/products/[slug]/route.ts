import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = await createServerSupabaseClient();

  const { data: product, error } = await supabase
    .from('mi_products')
    .select('*, mi_categories(name, slug), mi_product_variants(*), mi_reviews(*)')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .single();

  if (error || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  return NextResponse.json({ product });
}
