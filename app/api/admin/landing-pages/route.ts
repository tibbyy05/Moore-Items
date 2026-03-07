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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: pages, error } = await supabase
    .from('mi_landing_pages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Collect all product_ids and fetch product names
  const allProductIds = (pages || []).flatMap((p: any) => p.product_ids || []);
  const uniqueProductIds = Array.from(new Set(allProductIds));

  let productMap: Record<string, { name: string; slug: string }> = {};
  if (uniqueProductIds.length > 0) {
    const { data: products } = await supabase
      .from('mi_products')
      .select('id, name, slug')
      .in('id', uniqueProductIds);

    (products || []).forEach((p: any) => {
      productMap[p.id] = { name: p.name, slug: p.slug };
    });
  }

  const pagesWithProducts = (pages || []).map((page: any) => ({
    ...page,
    products: (page.product_ids || [])
      .map((pid: string) => productMap[pid] || null)
      .filter(Boolean),
  }));

  return NextResponse.json({ pages: pagesWithProducts });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json();

  const { name, slug, product_id, template, sections, quantity_discounts,
    promo_codes, meta_title, meta_description, status, headline, subheadline } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
  }

  const insertData: Record<string, any> = {
    name,
    slug,
    product_ids: product_id ? [product_id] : [],
    template: template || null,
    sections: sections || null,
    quantity_discounts: quantity_discounts || null,
    promo_codes: promo_codes || null,
    headline: headline || null,
    subheadline: subheadline || null,
    meta_title: meta_title || null,
    meta_description: meta_description || null,
    is_active: status === 'live',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('mi_landing_pages')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ page: data }, { status: 201 });
}
