import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

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

function stripHtml(html: string): string {
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

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from('mi_products')
      .select('id, name, description, retail_price, category_id, mi_categories(name)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const categoryName = (product as any).mi_categories?.name || 'General';
    const description = stripHtml(product.description || '').slice(0, 500);
    const price = Number(product.retail_price || 0).toFixed(2);

    // Call Claude Haiku to generate reviews
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:
        'You generate realistic, varied product reviews for an e-commerce store. Output ONLY valid JSON — no markdown fences, no explanation, no extra text.',
      messages: [
        {
          role: 'user',
          content: `Generate 3-5 realistic product reviews for this product:

Product: ${product.name}
Category: ${categoryName}
Price: $${price}
Description: ${description}

Requirements:
- Each review must have: customer_name, rating (integer 3-5), title, body, reviewer_country
- Rating distribution: at least one 5-star, at least one 4-star, optionally one 3-star. No ratings below 3.
- customer_name: realistic first name + last initial (e.g. "Sarah M.", "James T.")
- title: short, natural review title (3-8 words)
- body: 1-3 sentences, specific to this product's features/use. Vary tone and length.
- reviewer_country: mostly "US", occasionally "CA" or "GB"
- Make each review distinct in tone and focus

Output format — a JSON array:
[{"customer_name":"...","rating":5,"title":"...","body":"...","reviewer_country":"US"}]`,
        },
      ],
    });

    const rawText = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    // Strip markdown code fences if present
    const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let reviews: Array<{
      customer_name: string;
      rating: number;
      title: string;
      body: string;
      reviewer_country: string;
    }>;

    try {
      reviews = JSON.parse(jsonText);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: rawText },
        { status: 500 }
      );
    }

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json({ error: 'AI returned no reviews' }, { status: 500 });
    }

    // Sanitize and insert reviews
    const now = Date.now();
    const inserted: Array<{ id: string }> = [];

    for (const review of reviews) {
      const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 4)));
      const customerName = String(review.customer_name || 'Customer').slice(0, 50);
      const title = String(review.title || '').slice(0, 200);
      const body = String(review.body || '').slice(0, 2000);
      const country = String(review.reviewer_country || 'US').slice(0, 5);

      // Spread dates 1-90 days ago
      const daysAgo = Math.floor(Math.random() * 90) + 1;
      const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();

      // 80% chance of being verified
      const isVerified = Math.random() < 0.8;

      const { data: row, error: insertError } = await supabase
        .from('mi_reviews')
        .insert({
          product_id: productId,
          customer_id: null,
          rating,
          customer_name: customerName,
          title,
          body,
          is_verified: isVerified,
          created_at: createdAt,
          is_approved: true,
          source: 'ai-generated',
          cj_comment_id: null,
          images: [],
          reviewer_country: country,
        })
        .select('id')
        .single();

      if (!insertError && row) {
        inserted.push(row);
      }
    }

    // Re-aggregate review stats for this product
    const { data: allReviews } = await supabase
      .from('mi_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    const reviewCount = allReviews?.length || 0;
    const averageRating =
      reviewCount > 0
        ? Math.round(
            ((allReviews || []).reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount) *
              10
          ) / 10
        : 0;

    await supabase
      .from('mi_products')
      .update({ review_count: reviewCount, average_rating: averageRating })
      .eq('id', productId);

    return NextResponse.json({
      generated: inserted.length,
      totalReviews: reviewCount,
      averageRating,
    });
  } catch (err: any) {
    console.error('Generate reviews error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate reviews' },
      { status: 500 }
    );
  }
}
