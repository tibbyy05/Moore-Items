import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { error: null };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const body = await request.json();
  const updates: Record<string, any> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.stock_count !== undefined) updates.stock_count = Number(body.stock_count);
  if (body.retail_price !== undefined) updates.retail_price = Number(body.retail_price);
  if (body.shipping_cost !== undefined) updates.shipping_cost = Number(body.shipping_cost);
  if (body.is_active !== undefined) updates.is_active = Boolean(body.is_active);

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  console.log('[variant PATCH] id:', params.id, 'updates sent:', updates);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('mi_product_variants')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  console.log('[variant PATCH] supabase result:', JSON.stringify(data), 'error:', error);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ variant: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const admin = createAdminClient();

  // Get the variant's product_id before deleting
  const { data: variant, error: fetchError } = await admin
    .from('mi_product_variants')
    .select('product_id')
    .eq('id', params.id)
    .single();

  if (fetchError || !variant) {
    return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
  }

  const { error: deleteError } = await admin
    .from('mi_product_variants')
    .delete()
    .eq('id', params.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Check if any variants remain; if not, mark product out_of_stock
  const { count } = await admin
    .from('mi_product_variants')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', variant.product_id);

  if (count === 0) {
    await admin
      .from('mi_products')
      .update({ status: 'out_of_stock' })
      .eq('id', variant.product_id);
  }

  return NextResponse.json({ success: true, remaining: count });
}
