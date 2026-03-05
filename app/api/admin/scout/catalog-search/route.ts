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

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;
    const body = await request.json();
    const { query, page = 1, pageSize = 20 } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    const trimmed = query.trim();
    const offset = (page - 1) * pageSize;

    // Search by name using ilike (case-insensitive pattern matching)
    const searchPattern = `%${trimmed}%`;

    const { data: products, error: queryError, count } = await supabase
      .from('mi_products')
      .select(
        `
        id, name, slug, description, images, cj_pid,
        retail_price, compare_at_price, cj_price, margin_percent, margin_dollars,
        total_cost, shipping_cost, stripe_fee,
        stock_count, warehouse, status,
        review_count, average_rating,
        category_id, mi_categories(name, slug)
      `,
        { count: 'exact' }
      )
      .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
      .order('name')
      .range(offset, offset + pageSize - 1);

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    const results = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      images: p.images || [],
      cj_pid: p.cj_pid,
      retail_price: p.retail_price,
      compare_at_price: p.compare_at_price,
      cj_price: p.cj_price,
      margin_percent: p.margin_percent,
      margin_dollars: p.margin_dollars,
      total_cost: p.total_cost,
      shipping_cost: p.shipping_cost,
      stripe_fee: p.stripe_fee,
      stock_count: p.stock_count,
      warehouse: p.warehouse,
      status: p.status,
      review_count: p.review_count,
      average_rating: p.average_rating,
      category_name: p.mi_categories?.name || null,
      category_slug: p.mi_categories?.slug || null,
      store_url: `/product/${p.slug}`,
      admin_url: `/admin/products/edit/${p.id}`,
      cj_url: p.cj_pid
        ? `https://cjdropshipping.com/product/detail/${p.cj_pid}.html`
        : null,
    }));

    return NextResponse.json({
      results,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Catalog search failed' },
      { status: 500 }
    );
  }
}
