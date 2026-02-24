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

function parseJsonResponse(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

const POLISH_SYSTEM_PROMPT = `You are a product listing expert for MooreItems.com, a curated online store positioned as "Nordstrom meets Target." Polish raw CJ Dropshipping listings into professional product pages.

Rules for NAME:
- Remove brand prefixes (EELHOE, YOMDID, etc.), quantity prefixes ("2Pcs", "5 Pack"), measurement spam ("14x10x5cm"), year references ("2024 NEW")
- 3-8 words, Title Case, descriptive and appealing
- Don't make it clickbait

Rules for DESCRIPTION:
- Rewrite raw HTML/text as clean marketing copy
- 2-3 short paragraphs, plain text with paragraph breaks (no HTML tags)
- Lead with benefit, include key specs naturally
- Strip CJ marketing ("Best seller!", "Hot sale!", Chinese characters, ALL CAPS)
- Tone: warm, helpful, trustworthy

Rules for CATEGORY:
- Choose from: home-furniture, fashion, health-beauty, jewelry, garden-outdoor, pet-supplies, kitchen-dining, electronics, tools-hardware, kids-toys, sports-outdoors, storage-organization, digital-downloads
- Only suggest different category if current one is clearly wrong

Respond ONLY with valid JSON, no markdown fences:
{
  "cleanedName": "...",
  "cleanedDescription": "...",
  "suggestedCategory": "slug",
  "categoryChanged": true/false,
  "categoryReason": "reason if changed, empty if not"
}`;

async function callPolishAI(
  anthropic: Anthropic,
  productName: string,
  description: string,
  categorySlug: string,
  retailPrice: number,
  firstImage: string | null
): Promise<Record<string, unknown>> {
  const userMessage = `Product Name: ${productName}
Description: ${description}
Current Category: ${categorySlug}
Price: $${retailPrice.toFixed(2)}${firstImage ? `\nFirst Image: ${firstImage}` : ''}`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: POLISH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const rawText = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  const parsed = parseJsonResponse(rawText);
  if (parsed) return parsed;

  // Retry once on parse failure
  const retryResponse = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: POLISH_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userMessage },
      { role: 'assistant', content: rawText },
      {
        role: 'user',
        content:
          'Your previous response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences or extra text.',
      },
    ],
  });

  const retryText = retryResponse.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  const retryParsed = parseJsonResponse(retryText);
  if (retryParsed) return retryParsed;

  throw new Error('Failed to get valid JSON from AI after retry');
}

async function generateReviews(
  anthropic: Anthropic,
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  productId: string,
  productName: string,
  description: string,
  categoryName: string,
  price: string
): Promise<number> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system:
      'You generate realistic, varied product reviews for an e-commerce store. Output ONLY valid JSON — no markdown fences, no explanation, no extra text.',
    messages: [
      {
        role: 'user',
        content: `Generate 3-5 realistic product reviews for this product:

Product: ${productName}
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
    return 0;
  }

  if (!Array.isArray(reviews) || reviews.length === 0) return 0;

  const now = Date.now();
  let insertedCount = 0;

  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Math.round(Number(review.rating) || 4)));
    const customerName = String(review.customer_name || 'Customer').slice(0, 50);
    const title = String(review.title || '').slice(0, 200);
    const body = String(review.body || '').slice(0, 2000);
    const country = String(review.reviewer_country || 'US').slice(0, 5);

    const daysAgo = Math.floor(Math.random() * 90) + 1;
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const isVerified = Math.random() < 0.8;

    const { error: insertError } = await supabase
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
      });

    if (!insertError) insertedCount++;
  }

  // Re-aggregate review stats
  const { data: allReviews } = await supabase
    .from('mi_reviews')
    .select('rating')
    .eq('product_id', productId)
    .eq('is_approved', true);

  const reviewCount = allReviews?.length || 0;
  const averageRating =
    reviewCount > 0
      ? Math.round(
          ((allReviews || []).reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviewCount) * 10
        ) / 10
      : 0;

  await supabase
    .from('mi_products')
    .update({ review_count: reviewCount, average_rating: averageRating })
    .eq('id', productId);

  return insertedCount;
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { productId, productName, description, categorySlug, retailPrice, images } = body;

    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Missing productId' },
        { status: 400 }
      );
    }

    // Validate product exists
    const { data: product, error: productError } = await supabase
      .from('mi_products')
      .select('id, name, category_id, mi_categories(name)')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'AI service not configured' },
        { status: 500 }
      );
    }

    const anthropic = new Anthropic({ apiKey });

    // Step 1 & 2: Polish with Claude Sonnet
    const rawDescription = stripHtml(description || '').slice(0, 2000);
    const firstImage =
      Array.isArray(images) && images.length > 0 ? String(images[0]) : null;

    const polishResult = await callPolishAI(
      anthropic,
      productName || product.name || '',
      rawDescription,
      categorySlug || '',
      Number(retailPrice || 0),
      firstImage
    );

    // Step 3: Generate reviews
    const categoryName = (product as any).mi_categories?.name || 'General';
    const price = Number(retailPrice || 0).toFixed(2);
    const reviewDescription = stripHtml(description || '').slice(0, 500);

    const reviewsGenerated = await generateReviews(
      anthropic,
      supabase,
      productId,
      String(polishResult.cleanedName || productName || product.name),
      reviewDescription,
      categoryName,
      price
    );

    // Step 4: Return combined result
    return NextResponse.json({
      success: true,
      polish: {
        originalName: productName || product.name,
        cleanedName: polishResult.cleanedName || '',
        originalDescription: stripHtml(description || '').slice(0, 500),
        cleanedDescription: polishResult.cleanedDescription || '',
        originalCategory: categorySlug || '',
        suggestedCategory: polishResult.suggestedCategory || categorySlug || '',
        categoryChanged: polishResult.categoryChanged || false,
        categoryReason: polishResult.categoryReason || '',
        reviewsGenerated,
      },
    });
  } catch (err: any) {
    console.error('Polish product error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to polish product' },
      { status: 500 }
    );
  }
}
