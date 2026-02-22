import { cjClient } from '@/lib/cj/client';
import { createAdminClient } from '@/lib/supabase/admin';

const hasCjkChars = (text: string) => /[\u3040-\u30ff\u3400-\u9fff]/.test(text);

const pickMixedRatings = (reviews: any[], limit: number) => {
  const buckets = {
    5: reviews.filter((r) => r.score === 5),
    4: reviews.filter((r) => r.score === 4),
    3: reviews.filter((r) => r.score === 3),
  };

  const picked: any[] = [];
  const takeFrom = (score: 5 | 4 | 3, count: number) => {
    const list = buckets[score];
    for (let i = 0; i < Math.min(count, list.length); i += 1) {
      picked.push(list[i]);
    }
  };

  takeFrom(5, 4);
  takeFrom(4, 3);
  takeFrom(3, 3);

  if (picked.length < limit) {
    const remaining = reviews.filter((r) => !picked.includes(r));
    picked.push(...remaining.slice(0, limit - picked.length));
  }

  return picked.slice(0, limit);
};

export async function syncReviewsForProduct(
  cjPid: string,
  productId: string,
  productName?: string
) {
  const supabase = createAdminClient();
  const response = await cjClient.getProductReviews(cjPid, 1, 50);

  if (!response || typeof response !== 'object') {
    console.log('[reviews] Unexpected response:', JSON.stringify(response));
  }

  const list = response?.list || [];
  console.log(
    `[reviews] Product: ${productName || 'Unknown'}, CJ PID: ${cjPid}, CJ response total: ${
      response?.total || 0
    }, reviews in list: ${list.length || 0}`
  );
  const filtered = list
    .map((review: any) => ({
      ...review,
      score: Number(review.score || 0),
      comment: String(review.comment || '').trim(),
    }))
    .filter((review: any) => review.score >= 3 && review.comment.length > 0);
  console.log(`[reviews] After filter: ${filtered.length} reviews kept`);

  let finalReviews = filtered.filter((review: any) => !hasCjkChars(review.comment));
  if (finalReviews.length < 3) {
    finalReviews = filtered.filter((review: any) => !hasCjkChars(review.comment));
  }

  const mixed = pickMixedRatings(finalReviews, 10);

  let synced = 0;
  for (const review of mixed) {
    const { error } = await supabase.from('mi_reviews').upsert(
      {
        product_id: productId,
        customer_id: null,
        rating: review.score,
        customer_name: review.commentUser || 'Customer',
        title: '',
        body: review.comment,
        is_verified: true,
        created_at: review.commentDate ? new Date(review.commentDate).toISOString() : undefined,
        is_approved: true,
        source: 'cj',
        cj_comment_id: review.commentId,
        images: review.commentUrls || [],
        reviewer_country: review.countryCode || null,
      },
      { onConflict: 'cj_comment_id' }
    );

    if (!error) {
      synced += 1;
    }
  }

  const { data: reviews } = await supabase
    .from('mi_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true);

  const reviewCount = reviews?.length || 0;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          ((reviews || []).reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviewCount) *
            10
        ) / 10
      : 0;

  await supabase
    .from('mi_products')
    .update({
      review_count: reviewCount,
      average_rating: averageRating,
    })
    .eq('id', productId);

  return { synced, reviewCount, averageRating };
}

export async function syncReviewsForAll() {
  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from('mi_products')
    .select('id, cj_pid, name, status')
    .in('status', ['active', 'pending'])
    .not('cj_pid', 'is', null);

  const list = products || [];
  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < list.length; i += 1) {
    const product = list[i];
    try {
      await syncReviewsForProduct(product.cj_pid, product.id, product.name);
      synced += 1;
    } catch (error) {
      errors += 1;
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  return { synced, skipped, errors };
}
