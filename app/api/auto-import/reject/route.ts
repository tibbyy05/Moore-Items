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

export async function POST(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin();
    if (error) return error;

    const body = await request.json();
    const { suggestion_ids } = body;

    if (!Array.isArray(suggestion_ids) || suggestion_ids.length === 0) {
      return NextResponse.json({ error: 'Missing suggestion_ids array' }, { status: 400 });
    }

    const { error: updateError, count } = await supabase
      .from('mi_auto_import_suggestions')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .in('id', suggestion_ids)
      .eq('status', 'pending');

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rejected: count || suggestion_ids.length,
    });
  } catch (err: any) {
    console.error('[auto-import] Reject error:', err);
    return NextResponse.json(
      { error: err?.message || 'Reject failed' },
      { status: 500 }
    );
  }
}
