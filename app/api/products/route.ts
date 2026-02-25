import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const clientTotal = searchParams.get('total');
  const limit = parseInt(searchParams.get('limit') || '20');
  const category = searchParams.get('category');
  const sort = searchParams.get('sort') || 'featured';
  const search = searchParams.get('q');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const warehouse = searchParams.get('warehouse');
  const ids = searchParams.get('ids');

  let query = supabase
    .from('mi_products')
    .select(
      'id, name, slug, retail_price, compare_at_price, images, average_rating, review_count, shipping_estimate, warehouse, mi_categories(name, slug)',
      { count: page > 1 && clientTotal ? 'planned' : 'exact' }
    )
    .eq('status', 'active');

    if (category) {
      const { data: cat } = await supabase
        .from('mi_categories')
        .select('id')
        .eq('slug', category)
        .single();
      if (cat) {
        query = query.eq('category_id', cat.id);
      } else {
        return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });
      }
    }
  if (search) query = query.ilike('name', `%${search}%`);
  if (minPrice) query = query.gte('retail_price', parseFloat(minPrice));
  if (maxPrice) query = query.lte('retail_price', parseFloat(maxPrice));
  if (warehouse) query = query.eq('warehouse', warehouse);
  if (ids) {
    const idArray = ids.split(',').filter(Boolean);
    if (idArray.length > 0) {
      query = query.in('id', idArray);
    }
  }

  switch (sort) {
    case 'price-asc':
      query = query.order('retail_price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('retail_price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
      query = query.order('average_rating', { ascending: false });
      break;
    case 'sales':
      query = query.order('sales_count', { ascending: false });
      break;
    default:
      query = query.order('sales_count', { ascending: false });
  }

  // Tiebreaker sort for deterministic pagination
  query = query.order('id');

  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const total = page > 1 && clientTotal ? parseInt(clientTotal) : count || 0;

  const trimmedProducts = (data || []).map((product: any) => ({
    ...product,
    images: Array.isArray(product.images) ? product.images.slice(0, 1) : product.images,
  }));
  console.log(
    '[products API] first images:',
    (trimmedProducts || []).slice(0, 3).map((p: any) => p.images?.[0])
  );

  return NextResponse.json({
    products: trimmedProducts,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
