import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const revalidate = 300;

export async function GET() {
  const supabase = createAdminClient();

  const { data: setting } = await supabase
    .from('mi_settings')
    .select('value')
    .eq('key', 'featured_product_id')
    .single();

  const productId = setting?.value?.id;
  if (!productId) {
    return NextResponse.json({ product: null });
  }

  const { data: product } = await supabase
    .from('mi_products')
    .select('id, name, slug, images, retail_price, compare_at_price, average_rating, review_count, warehouse, shipping_days, sales_count, badge, description')
    .eq('id', productId)
    .eq('status', 'active')
    .single();

  if (!product) {
    return NextResponse.json({ product: null });
  }

  const { data: variants } = await supabase
    .from('mi_product_variants')
    .select('id, name, retail_price, stock_count, color, size')
    .eq('product_id', productId)
    .eq('is_active', true)
    .gt('stock_count', 0)
    .limit(3);

  return NextResponse.json({ product: { ...product, variants: variants || [] } });
}
