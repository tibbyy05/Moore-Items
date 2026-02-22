import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { syncCJProducts } from '@/lib/cj/sync';

export async function POST(request: NextRequest) {
  console.log('[admin sync] Sync request received');
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    console.log('[admin sync] Sync params', body);
    const result = await syncCJProducts(
      body.categoryId,
      body.pageNum,
      body.pageSize,
      body.resync,
      body.warehouse || 'all',
      {
        includeShipping: body.includeShipping !== false,
        includeReviews: Boolean(body.includeReviews),
      }
    );
    console.log('[admin sync] Sync completed', {
      synced: result.synced,
      updated: result.updated,
      hidden: result.hidden,
      errors: result.errors.length,
    });
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('[admin sync] Sync failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
