import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { supabase, error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { supabase, error: null };
}

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

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
    .limit(1);

  return NextResponse.json({ product: { ...product, variants: variants || [] } });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body?.productId) {
    return NextResponse.json({ error: 'productId is required' }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from('mi_settings')
    .upsert({ key: 'featured_product_id', value: { id: body.productId } }, { onConflict: 'key' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { error: upsertError } = await supabase
    .from('mi_settings')
    .upsert({ key: 'featured_product_id', value: null }, { onConflict: 'key' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
