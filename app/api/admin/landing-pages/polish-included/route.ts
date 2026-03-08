import { NextRequest, NextResponse } from 'next/server';
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
    const { raw, productName } = await request.json();

    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return NextResponse.json({ error: 'Paste some product features first' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: 'You rewrite raw product features into clean, benefit-focused bullets for a high-converting e-commerce landing page. Return ONLY valid JSON, no markdown, no explanation.',
      messages: [
        {
          role: 'user',
          content: `Product: ${productName || 'this product'}

Rewrite these raw features into 4-6 clean, benefit-focused items.
Return ONLY a JSON array:
[{ "icon": "emoji", "title": "short title max 4 words", "description": "one benefit-focused sentence max 15 words" }]

Raw features:
${raw.slice(0, 3000)}`,
        },
      ],
    });

    const rawText = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

    let items: Array<{ icon: string; title: string; description: string }>;
    try {
      items = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: 'Failed to parse AI response', raw: rawText },
        { status: 500 }
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'AI returned unexpected format' }, { status: 500 });
    }

    return NextResponse.json({ items });
  } catch (err: any) {
    console.error('Polish included error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to polish features' },
      { status: 500 }
    );
  }
}
