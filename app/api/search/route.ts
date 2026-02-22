import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || '';

  if (!query.trim()) {
    return NextResponse.json({ products: [] });
  }

  const { data, error } = await supabase
    .from('mi_products')
    .select('id, name, slug, retail_price, images, mi_categories(name, slug)')
    .eq('status', 'active')
    .ilike('name', `%${query}%`)
    .limit(6);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data || [] });
}
