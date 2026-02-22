import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (slug) {
    const { data, error } = await supabase
      .from('mi_categories')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data || null });
  }

  const { data, error } = await supabase
    .from('mi_categories')
    .select('*, mi_products(count)')
    .eq('is_active', true)
    .eq('mi_products.status', 'active')
    .order('sort_order', { ascending: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const categories = (data || []).map((cat: any) => ({
    ...cat,
    product_count: cat.mi_products?.[0]?.count || 0,
  }));
  return NextResponse.json({ categories });
}
