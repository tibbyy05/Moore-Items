import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const sort = searchParams.get('sort') || 'newest';

  let query = supabase
    .from('mi_reviews')
    .select('*', { count: 'exact' })
    .eq('product_id', params.productId)
    .eq('is_approved', true);

  query = query.order('created_at', { ascending: sort !== 'newest' });
  query = query.range((page - 1) * limit, page * limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: ratingRows } = await supabase
    .from('mi_reviews')
    .select('rating')
    .eq('product_id', params.productId)
    .eq('is_approved', true);

  const total = ratingRows?.length || 0;
  const averageRating =
    total > 0
      ? Math.round(
          ((ratingRows || []).reduce((sum, row) => sum + Number(row.rating || 0), 0) / total) * 10
        ) / 10
      : 0;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: (ratingRows || []).filter((row) => Number(row.rating || 0) === star).length,
  }));

  return NextResponse.json({
    reviews: data || [],
    total: count || 0,
    averageRating,
    distribution,
  });
}
