import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

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

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const videoId = request.nextUrl.searchParams.get('videoId');
  const productId = request.nextUrl.searchParams.get('productId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;

  if (!accountId || !streamToken) {
    return NextResponse.json(
      { error: 'Cloudflare Stream is not configured' },
      { status: 500 }
    );
  }

  try {
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${videoId}`,
      {
        headers: {
          Authorization: `Bearer ${streamToken}`,
        },
      }
    );

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.success) {
      return NextResponse.json(
        { error: cfData.errors?.[0]?.message || 'Failed to check video status' },
        { status: 502 }
      );
    }

    const result = cfData.result;
    const isReady = result.status?.state === 'ready' || result.readyToStream === true;
    const status = isReady ? 'ready' : 'processing';
    const thumbnail = `https://videodelivery.net/${videoId}/thumbnails/thumbnail.jpg`;
    const duration = result.duration || null;

    // If ready and productId provided, update the video entry in the videos array
    if (isReady && productId) {
      const adminSupabase = createAdminClient();
      const { data: product } = await adminSupabase
        .from('mi_products')
        .select('videos')
        .eq('id', productId)
        .single();

      if (product?.videos) {
        const videos = (product.videos as any[]).map((v: any) =>
          v.cloudflare_id === videoId ? { ...v, status: 'ready' } : v
        );

        await adminSupabase
          .from('mi_products')
          .update({ videos })
          .eq('id', productId);
      }
    }

    return NextResponse.json({ status, thumbnail, duration });
  } catch (err: any) {
    console.error('[Video Status] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to check video status' },
      { status: 500 }
    );
  }
}
