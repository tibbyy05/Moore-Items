import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export async function GET(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('mi_auto_import_suggestions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: suggestions, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Group by batch
    const batches: Record<string, any[]> = {};
    for (const s of suggestions || []) {
      if (!batches[s.batch_id]) batches[s.batch_id] = [];
      batches[s.batch_id].push(s);
    }

    return NextResponse.json({
      suggestions: suggestions || [],
      batches: Object.entries(batches).map(([batch_id, items]) => ({
        batch_id,
        created_at: items[0]?.created_at,
        count: items.length,
        items,
      })),
      total: suggestions?.length || 0,
    });
  } catch (err: any) {
    console.error('[auto-import] List error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch suggestions' },
      { status: 500 }
    );
  }
}
