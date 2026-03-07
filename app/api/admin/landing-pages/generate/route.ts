import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return adminProfile ? user : null;
}

interface QuantityDiscount {
  qty: number;
  label: string;
  discount_pct: number;
  badge: string;
}

const SYSTEM_PROMPT = `You are a direct-response e-commerce copywriter for MooreItems, positioned as 'Nordstrom meets Target' — aspirational quality at accessible prices. Write high-converting landing page copy for a single featured product. Focus on solving customer problems, not listing features. Use natural urgency and social proof. Tone: confident, warm, never spammy. Return ONLY valid JSON, no markdown, no preamble, no explanation.`;

function formatDeals(price: number, discounts: QuantityDiscount[]): string {
  const parts: string[] = [];

  // Always show single-unit price
  parts.push(`Buy 1 for $${price.toFixed(2)}`);

  for (const d of discounts) {
    if (d.discount_pct > 0) {
      const discounted = Math.round(price * (1 - d.discount_pct / 100) * 100) / 100;
      parts.push(`Buy ${d.qty} for $${discounted.toFixed(2)} each (save ${d.discount_pct}%)`);
    }
  }

  return parts.join(' | ');
}

function buildUserPrompt(
  productName: string,
  category: string,
  price: number,
  description: string,
  dealsString: string
): string {
  return `Write a complete landing page for this product:
Name: ${productName}
Category: ${category}
Price: $${price.toFixed(2)}
Description: ${description.slice(0, 400)}
Quantity deals: ${dealsString}

Return JSON with EXACTLY this structure:
{
  "hero": { "headline": "", "subheadline": "", "cta_text": "" },
  "benefits": [
    { "icon": "", "title": "", "body": "" }
  ],
  "feature_block_1": { "headline": "", "body": "", "image_position": "right" },
  "feature_block_2": { "headline": "", "body": "", "image_position": "left" },
  "social_proof": { "headline": "", "stat_1": "", "stat_2": "", "stat_3": "" },
  "testimonials": [
    { "name": "", "review": "", "stars": 5, "verified": true }
  ],
  "faq": [
    { "q": "", "a": "" }
  ],
  "closing_cta": { "headline": "", "urgency_line": "", "cta_text": "" }
}
Include exactly 4 benefits, 3 testimonials with realistic American names, 5 FAQ items.`;
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { product_id, product_name, product_description, product_price, category, quantity_discounts } = body;

    if (!product_name || !product_price) {
      return NextResponse.json({ error: 'product_name and product_price are required' }, { status: 400 });
    }

    const discounts: QuantityDiscount[] = Array.isArray(quantity_discounts) ? quantity_discounts : [];
    const dealsString = formatDeals(product_price, discounts);
    const userPrompt = buildUserPrompt(
      product_name,
      category || 'General',
      product_price,
      product_description || '',
      dealsString
    );

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const rawText = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    // Strip markdown fences if present
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let sections: Record<string, unknown>;
    try {
      sections = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: rawText },
        { status: 500 }
      );
    }

    // Auto-create promo codes for quantity discount tiers
    const promoCodes: Record<string, string> = {};
    const tiersWithDiscount = discounts.filter((d) => d.discount_pct > 0);

    if (tiersWithDiscount.length > 0 && product_name) {
      const supabase = createAdminClient();
      const slugBase = product_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 8)
        .toUpperCase();

      for (const tier of tiersWithDiscount) {
        const code = `LP-${slugBase}-${tier.qty}`;

        await supabase.from('mi_promo_codes').upsert(
          {
            code,
            type: 'percentage',
            value: tier.discount_pct,
            is_active: true,
            max_uses: 9999,
            notes: 'Auto-created for landing page quantity discount',
            used_count: 0,
            total_uses: 0,
            total_revenue: 0,
            total_discount_given: 0,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'code', ignoreDuplicates: true }
        );

        promoCodes[`qty_${tier.qty}`] = code;
      }
    }

    return NextResponse.json({ sections, promo_codes: promoCodes });
  } catch (err: any) {
    console.error('Landing page generate error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate landing page content' },
      { status: 500 }
    );
  }
}
