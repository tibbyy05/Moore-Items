import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return adminProfile ? user : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: page, error } = await supabase
    .from('mi_landing_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !page) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
  }

  // Get product info
  let product = null;
  const productIds = (page as any).product_ids || [];
  if (productIds.length > 0) {
    const { data: products } = await supabase
      .from('mi_products')
      .select('id, name, slug, retail_price, images, description')
      .in('id', productIds);
    product = products?.[0] || null;
  }

  return NextResponse.json({ page: { ...page, product } });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Fetch existing for status comparison
  const { data: existing } = await supabase
    .from('mi_landing_pages')
    .select('is_active, published_at')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Landing page not found' }, { status: 404 });
  }

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };

  if (body.name !== undefined) updateData.name = body.name;
  if (body.slug !== undefined) updateData.slug = body.slug;
  if (body.product_id !== undefined) updateData.product_ids = body.product_id ? [body.product_id] : [];
  if (body.headline !== undefined) updateData.headline = body.headline;
  if (body.subheadline !== undefined) updateData.subheadline = body.subheadline;
  if (body.template !== undefined) updateData.template = body.template;
  if (body.sections !== undefined) updateData.sections = body.sections;
  if (body.quantity_discounts !== undefined) updateData.quantity_discounts = body.quantity_discounts;
  if (body.promo_codes !== undefined) updateData.promo_codes = body.promo_codes;
  if (body.hero_image_url !== undefined) updateData.hero_image_url = body.hero_image_url;
  if (body.meta_title !== undefined) updateData.meta_title = body.meta_title;
  if (body.meta_description !== undefined) updateData.meta_description = body.meta_description;

  if (body.status !== undefined) {
    const goingLive = body.status === 'live';
    updateData.is_active = goingLive;

    // Set published_at on first publish
    if (goingLive && !(existing as any).published_at) {
      updateData.published_at = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from('mi_landing_pages')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('mi_landing_pages')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
