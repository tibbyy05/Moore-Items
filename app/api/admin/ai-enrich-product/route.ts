import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are a product copywriter for Moore Items, an e-commerce store positioned as 'Nordstrom meets Target' — elevated, curated, and accessible. Write benefit-first, clean, and informal copy. Never use hype or filler words.

Always treat the current product name and description as the source of truth. CJ data is supplementary context only.

For product titles: lead with the most searchable descriptor and include all core function keywords naturally. Keep under 70 characters.

For meta titles: identify all primary function keywords from the product name and description (e.g. a product that both blends and juices should include both 'blender' and 'juicer'). Capture multiple search intents by including all core use-case terms. Format as: '[Primary Keywords] | [Benefit or Use Case]'. Keep under 60 characters.

In the description, always include a short 'Perfect For Making' or 'Great For' section as an h3 with a bullet list of 4–6 specific use cases relevant to the product (e.g. smoothies, iced coffee, protein shakes, detox drinks for a blender). These should be concrete, specific things the customer can make or do with the product — not generic benefits. This section drives both SEO long-tail traffic and purchase intent.`;

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

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    // Fetch product from Supabase
    const { data: product, error: dbError } = await supabase
      .from('mi_products')
      .select('id, cj_pid, name, description, whats_included, images')
      .eq('id', productId)
      .single();

    if (dbError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch CJ product details if we have a CJ product ID
    let cjData = null;
    if (product.cj_pid) {
      try {
        cjData = await cjClient.getProduct(product.cj_pid);
      } catch (cjError: any) {
        console.error('[ai-enrich] CJ API error:', cjError.message);
        // Return partial data with CJ error info
        return NextResponse.json({
          current: product,
          cjData: null,
          cjError: cjError.message,
        });
      }
    }

    // Build context for Claude
    const imageCount = Array.isArray(product.images) ? product.images.length : 0;

    const userMessage = `Here is the product data to enrich:

CURRENT PRODUCT:
- Title: ${product.name || 'None'}
- Description: ${product.description || 'None'}

CJ PRODUCT DATA:
${cjData ? `- Product Name: ${cjData.productNameEn || 'N/A'}
- Description: ${cjData.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1000) || 'N/A'}
- Category: ${cjData.categoryName || 'N/A'}
- Weight: ${cjData.productWeight ? cjData.productWeight + 'g' : 'N/A'}
- Unit: ${cjData.productUnit || 'N/A'}
- Variants: ${cjData.variants?.map((v: any) => v.variantNameEn).join(', ') || 'None'}` : 'No CJ data available.'}

NUMBER OF PRODUCT IMAGES: ${imageCount}

Return ONLY a raw JSON object with no markdown, no backticks, no preamble. Fields:
- "title": string, under 70 chars, SEO-optimized, benefit-first
- "description": string, rich HTML using h2, h3, p, ul/li tags only, benefit-driven prose, 150–300 words
- "whats_included": string array, cleaned up from CJ specs (e.g. "1x Blender Cup")
- "meta_title": string, under 60 chars, keyword-rich
- "meta_description": string, under 155 chars, conversion-focused
- "alt_texts": string array with exactly ${imageCount} entries, one per product image, descriptive and SEO-friendly`;

    // Call Claude API
    let enriched = null;
    let enrichedError: string | undefined;

    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      });

      const textBlock = message.content.find((b) => b.type === 'text');
      const rawText = (textBlock as any)?.text || '';
      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      enriched = JSON.parse(cleaned);
    } catch (aiError: any) {
      console.error('[ai-enrich] Claude API/parse error:', aiError.message);
      enrichedError = 'Failed to parse AI response';
    }

    if (enrichedError) {
      return NextResponse.json({ current: product, cjData, enrichedError });
    }

    return NextResponse.json({
      current: product,
      cjData,
      enriched,
    });
  } catch (err: any) {
    console.error('[ai-enrich] Error:', err.message);
    return NextResponse.json(
      { error: 'Failed to fetch product data' },
      { status: 500 }
    );
  }
}
