import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Anthropic from '@anthropic-ai/sdk';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { error: null };
}

function parseJsonResponse(raw: string): Record<string, unknown> | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function handleExtract(url: string) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  });

  if (res.status !== 200) {
    return NextResponse.json({ error: 'Failed to fetch URL' }, { status: 400 });
  }

  const html = (await res.text()).slice(0, 15000);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system:
      'You are a product data extractor. Extract product information from e-commerce HTML and return ONLY valid JSON with no markdown, no code fences, no explanation.',
    messages: [
      {
        role: 'user',
        content: `Extract this product data and return a single JSON object with these exact keys:
- title: string (raw product title)
- description: string (full description/specs, plain text no HTML)
- price: number (current price as a number e.g. 15.53)
- images: string[] (array of full image URLs found on page, max 8)
- variants: array of { name: string } if any options exist, else empty array
- polished_title: string (clean benefit-focused title, max 60 chars, remove brand names)
- polished_description: string (3 paragraphs: hook sentence, key features, why buy. ~150 words, conversational)
- suggested_category: string (pick ONE slug from this list exactly: electronics, home-garden, fashion, beauty, sports-outdoors, pets, kitchen, toys-games, office, automotive, health-wellness, jewelry)

HTML: ${html}`,
      },
    ],
  });

  const rawText = response.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  const extracted = parseJsonResponse(rawText);
  if (!extracted) {
    return NextResponse.json({ error: 'AI extraction failed' }, { status: 400 });
  }

  const cost = Number(extracted.price) || 0;
  const retail_price = Math.ceil(cost * 2.2 * 100) / 100 - 0.01;
  const compare_at_price = Math.ceil(retail_price * 1.4 * 100) / 100 - 0.01;
  const stripe_fee = parseFloat((retail_price * 0.029 + 0.3).toFixed(2));
  const margin_dollars = parseFloat((retail_price - cost - stripe_fee).toFixed(2));
  const margin_percent = parseFloat(((margin_dollars / retail_price) * 100).toFixed(1));

  return NextResponse.json({
    raw: {
      title: extracted.title,
      description: extracted.description,
      price: extracted.price,
      images: extracted.images,
      variants: extracted.variants,
    },
    polished: {
      title: extracted.polished_title,
      description: extracted.polished_description,
      suggested_category: extracted.suggested_category,
    },
    pricing: { cost, retail_price, compare_at_price, stripe_fee, margin_dollars, margin_percent },
    source_url: url,
  });
}

async function handleSave(data: Record<string, any>) {
  const adminSupabase = createAdminClient();

  let category_id: string | null = null;
  if (data.category_slug) {
    const { data: cat } = await adminSupabase
      .from('mi_categories')
      .select('id')
      .eq('slug', data.category_slug)
      .single();
    category_id = cat?.id || null;
  }

  const slug =
    String(data.name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .substring(0, 80) +
    '-' +
    Date.now().toString(36);

  const { data: inserted, error: insertError } = await adminSupabase
    .from('mi_products')
    .insert({
      name: data.name,
      slug,
      description: data.description,
      category_id,
      images: data.images,
      cj_price: data.cost,
      shipping_cost: 0,
      stripe_fee: data.stripe_fee,
      total_cost: data.cost + data.stripe_fee,
      retail_price: data.retail_price,
      compare_at_price: data.compare_at_price,
      margin_dollars: data.margin_dollars,
      margin_percent: data.margin_percent,
      markup_multiplier: 1,
      stock_count: data.stock_count || 999,
      warehouse: data.warehouse || 'US',
      delivery_time: data.delivery_time || 'Delivered in 3-7 days',
      shipping_days: '3-7',
      status: 'active',
      badge: 'New',
      supplier: 'aliexpress',
      source_url: data.source_url,
    })
    .select('id, slug')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, product_id: inserted.id, slug: inserted.slug });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'extract') {
      if (!body.url || typeof body.url !== 'string') {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
      }
      return handleExtract(body.url);
    }

    if (action === 'save') {
      if (!body.data || typeof body.data !== 'object') {
        return NextResponse.json({ error: 'Product data is required' }, { status: 400 });
      }
      return handleSave(body.data);
    }

    return NextResponse.json({ error: 'Invalid action. Use "extract" or "save".' }, { status: 400 });
  } catch (err: any) {
    console.error('Import URL error:', err);
    return NextResponse.json({ error: err?.message || 'Import failed' }, { status: 500 });
  }
}
