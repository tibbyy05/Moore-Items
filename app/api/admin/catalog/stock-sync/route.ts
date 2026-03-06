// ─── Thin proxy to Netlify Background Function ────────────────────
// All sync logic lives in netlify/functions/stock-sync-background.mts
// This route validates auth, then fires the background function and
// returns 202 immediately so neither cron nor the admin UI times out.
// ───────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function checkAuth(request: NextRequest): Promise<{ authorized: boolean }> {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const cronSecret = process.env.STOCK_SYNC_SECRET;
  if (cronSecret && key === cronSecret) {
    return { authorized: true };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { authorized: false };

    const { data: adminProfile } = await supabase
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return { authorized: !!adminProfile };
  } catch {
    return { authorized: false };
  }
}

export async function POST(request: NextRequest) {
  const { authorized } = await checkAuth(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode') || 'full';
  const cronSecret = process.env.STOCK_SYNC_SECRET || '';

  // Fire the background function (Netlify returns 202 immediately)
  const siteUrl = process.env.URL || `https://${request.headers.get('host')}`;
  const bgUrl = `${siteUrl}/.netlify/functions/stock-sync-background?key=${encodeURIComponent(cronSecret)}&mode=${mode}`;

  fetch(bgUrl, { method: 'POST' }).catch((err) =>
    console.error('[stock-sync] Failed to invoke background function:', err)
  );

  return NextResponse.json(
    { status: 'accepted', mode, message: 'Stock sync started in background. Results will be emailed.' },
    { status: 202 }
  );
}
