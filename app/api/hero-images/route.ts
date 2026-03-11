import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('mi_hero_images')
    .select('id, product_id, image_url, product_name, slot')
    .eq('is_active', true)
    .order('slot', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Join with mi_products to get slug
  const productIds = (data || []).map((h) => h.product_id);
  const { data: products } = await supabase
    .from('mi_products')
    .select('id, slug')
    .in('id', productIds.length > 0 ? productIds : ['00000000-0000-0000-0000-000000000000']);

  const slugMap = new Map((products || []).map((p) => [p.id, p.slug]));

  const items = (data || []).map((h) => ({
    id: h.id,
    productId: h.product_id,
    slug: slugMap.get(h.product_id) || '',
    name: h.product_name || '',
    image: h.image_url,
    slot: h.slot,
  }));

  return NextResponse.json({ items });
}
