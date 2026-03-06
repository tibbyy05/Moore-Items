import Anthropic from '@anthropic-ai/sdk';

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function categorizeWithAI(
  productName: string,
  description: string,
  categories: Array<{ id: string; name: string; slug: string }>
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const categoryList = categories
    .filter((c) => c.slug !== 'digital-downloads')
    .map((c) => c.name)
    .join(', ');

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system:
        'You are a product categorization assistant. Respond with ONLY the exact category name — no explanation, no quotes, no punctuation.',
      messages: [
        {
          role: 'user',
          content: `Which category best fits this product?

Product: ${productName}
Description: ${stripHtml(description).slice(0, 300)}

Categories: ${categoryList}

Respond with the exact category name only.`,
        },
      ],
    });

    const chosenCategory = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const match = categories.find(
      (c) => c.name.toLowerCase() === chosenCategory.toLowerCase()
    );
    return match?.id || null;
  } catch {
    return null;
  }
}

export async function generateReviewsForProduct(
  supabase: any,
  productId: string,
  productName: string,
  description: string,
  retailPrice: number,
  categoryName: string
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return 0;

  const reviewCount = Math.floor(Math.random() * 16) + 15; // 15-30

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system:
        'You generate realistic, varied product reviews for an e-commerce store. Output ONLY valid JSON — no markdown fences, no explanation, no extra text.',
      messages: [
        {
          role: 'user',
          content: `Generate ${reviewCount} realistic product reviews for this product:

Product: ${productName}
Category: ${categoryName}
Price: $${retailPrice.toFixed(2)}
Description: ${stripHtml(description).slice(0, 500)}

Requirements:
- Each review must have: customer_name, rating (integer 3-5), title, body, reviewer_country
- Rating distribution: 65% should be 5-star, 35% should be 4-star, optionally 1-2 three-star reviews
- customer_name: realistic first name + last initial (e.g. "Sarah M.", "James T.")
- title: short, natural review title (3-8 words)
- body: 1-3 sentences, specific to this product's features/use. Vary tone and length.
- reviewer_country: mostly "US" (75%), occasionally "CA" or "GB"
- Make each review distinct in tone and focus

Output format — a JSON array:
[{"customer_name":"...","rating":5,"title":"...","body":"...","reviewer_country":"US"}]`,
        },
      ],
    });

    const rawText = response.content
      .map((b) => (b.type === 'text' ? b.text : ''))
      .join('')
      .trim();

    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    const reviews = JSON.parse(jsonText);

    if (!Array.isArray(reviews)) return 0;

    const now = Date.now();
    let insertedCount = 0;

    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 4)));
      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
      const isVerified = Math.random() < 0.8;

      const { error: insertError } = await supabase.from('mi_reviews').insert({
        product_id: productId,
        customer_id: null,
        rating,
        customer_name: String(review.customer_name || 'Customer').slice(0, 50),
        title: String(review.title || '').slice(0, 200),
        body: String(review.body || '').slice(0, 2000),
        is_verified: isVerified,
        created_at: createdAt,
        is_approved: true,
        source: 'ai-generated',
        cj_comment_id: null,
        images: [],
        reviewer_country: String(review.reviewer_country || 'US').slice(0, 5),
      });

      if (!insertError) insertedCount++;
    }

    // Update product review stats
    const { data: allReviews } = await supabase
      .from('mi_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    const totalReviews = allReviews?.length || 0;
    const avgRating =
      totalReviews > 0
        ? Math.round(
            ((allReviews || []).reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) /
              totalReviews) *
              10
          ) / 10
        : 0;

    await supabase
      .from('mi_products')
      .update({ review_count: totalReviews, average_rating: avgRating })
      .eq('id', productId);

    return insertedCount;
  } catch (err) {
    console.error('[product-enrichment] Review generation failed:', err);
    return 0;
  }
}
