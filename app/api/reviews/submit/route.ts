import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, rating, reviewText, reviewerName, reviewerEmail } = body;

    // --- Validation ---
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer from 1 to 5.' }, { status: 400 });
    }
    if (typeof reviewText !== 'string' || reviewText.length < 10 || reviewText.length > 1000) {
      return NextResponse.json({ error: 'Review must be between 10 and 1000 characters.' }, { status: 400 });
    }
    if (typeof reviewerName !== 'string' || reviewerName.length < 1 || reviewerName.length > 50) {
      return NextResponse.json({ error: 'Name must be between 1 and 50 characters.' }, { status: 400 });
    }
    if (typeof reviewerEmail !== 'string' || !EMAIL_RE.test(reviewerEmail)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const emailLower = reviewerEmail.toLowerCase();

    // --- Purchase verification ---
    // Orders store the checkout email in the `email` column
    const { data: orderMatch } = await supabase
      .from('mi_orders')
      .select('id, mi_order_items!inner(product_id)')
      .eq('payment_status', 'paid')
      .ilike('email', emailLower)
      .eq('mi_order_items.product_id', productId)
      .limit(1)
      .single();

    if (!orderMatch) {
      return NextResponse.json(
        { error: 'You must purchase this product before leaving a review.' },
        { status: 403 }
      );
    }

    // --- Duplicate check ---
    const { data: existing } = await supabase
      .from('mi_reviews')
      .select('id')
      .ilike('reviewer_email', emailLower)
      .eq('product_id', productId)
      .eq('source', 'customer')
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this product.' },
        { status: 409 }
      );
    }

    // --- Insert review ---
    const { error: insertError } = await supabase.from('mi_reviews').insert({
      product_id: productId,
      rating,
      body: reviewText,
      customer_name: reviewerName,
      reviewer_email: emailLower,
      source: 'customer',
      verified_purchase: true,
      is_approved: true,
      status: 'approved',
      order_id: orderMatch.id,
      created_at: new Date().toISOString(),
    });

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already reviewed this product.' },
          { status: 409 }
        );
      }
      throw insertError;
    }

    // --- Recalculate product rating ---
    const { data: stats } = await supabase
      .from('mi_reviews')
      .select('rating')
      .eq('product_id', productId)
      .or('is_approved.eq.true,status.eq.approved');

    if (stats) {
      const total = stats.length;
      const avgRating =
        Math.round((stats.reduce((sum, r) => sum + Number(r.rating), 0) / total) * 10) / 10;

      await supabase
        .from('mi_products')
        .update({ average_rating: avgRating, review_count: total })
        .eq('id', productId);
    }

    return NextResponse.json({ success: true, message: 'Review submitted successfully.' });
  } catch {
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
