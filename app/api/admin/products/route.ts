import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const status = searchParams.get('status');
  const category = searchParams.get('category');
  const warehouse = searchParams.get('warehouse');
  const search = searchParams.get('search');
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  let query = supabase
    .from('mi_products')
    .select('*, mi_categories(name, slug), mi_product_variants(count)', { count: 'exact' });

  if (status && status !== 'all') query = query.eq('status', status);
  if (category && category !== 'all') {
    const { data: categoryData } = await supabase
      .from('mi_categories')
      .select('id')
      .eq('slug', category)
      .maybeSingle();
    if (categoryData?.id) {
      query = query.eq('category_id', categoryData.id);
    } else {
      query = query.eq('category_id', '__none__');
    }
  }
  if (warehouse && warehouse !== 'all') query = query.eq('warehouse', warehouse);
  if (search) query = query.or(`name.ilike.%${search}%,cj_pid.ilike.%${search}%`);

  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * limit, page * limit - 1);

  const { data, error: dbError, count } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count || 0) / limit),
  });
}

export async function PATCH(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;
  const body = await request.json();
  const { id, ...updates } = body;

  if (updates.markup_multiplier || updates.retail_price) {
    const { data: product } = await supabase
      .from('mi_products')
      .select('cj_price, shipping_cost')
      .eq('id', id)
      .single();

    if (product) {
      const { calculatePricing } = await import('@/lib/pricing');

      if (updates.markup_multiplier) {
        const pricing = calculatePricing(
          product.cj_price,
          product.shipping_cost,
          updates.markup_multiplier
        );
        Object.assign(updates, {
          retail_price: pricing.retailPrice,
          stripe_fee: pricing.stripeFee,
          total_cost: pricing.totalCost,
          margin_dollars: pricing.marginDollars,
          margin_percent: pricing.marginPercent,
          status: pricing.isViable ? updates.status || 'active' : 'hidden',
        });
      }

      if (updates.retail_price) {
        const retailPrice = parseFloat(String(updates.retail_price));
        const baseCost =
          parseFloat(String(product.cj_price || 0)) +
          parseFloat(String(product.shipping_cost || 0));
        const stripeFee = retailPrice * 0.029 + 0.3;
        const totalCost = baseCost + stripeFee;
        const marginDollars = retailPrice - totalCost;
        const marginPercent = retailPrice > 0 ? (marginDollars / retailPrice) * 100 : 0;

        Object.assign(updates, {
          retail_price: retailPrice,
          stripe_fee: Math.round(stripeFee * 100) / 100,
          total_cost: Math.round(totalCost * 100) / 100,
          margin_dollars: Math.round(marginDollars * 100) / 100,
          margin_percent: Math.round(marginPercent * 10) / 10,
        });
      }
    }
  }

  const { data, error: updateError } = await supabase
    .from('mi_products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}

export async function DELETE(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  const { error: deleteError } = await supabase
    .from('mi_products')
    .delete()
    .eq('id', id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
