import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: page } = await supabase
      .from('mi_landing_pages')
      .select('id, views')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    await supabase
      .from('mi_landing_pages')
      .update({ views: (page.views || 0) + 1 })
      .eq('id', page.id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
  }
}
