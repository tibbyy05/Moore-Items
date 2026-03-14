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

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const streamToken = process.env.CLOUDFLARE_STREAM_TOKEN;

  if (!accountId || !streamToken) {
    return NextResponse.json(
      { error: 'Cloudflare Stream is not configured' },
      { status: 500 }
    );
  }

  let body: { productId?: string; fileName?: string; fileSize?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { productId, fileName, fileSize } = body;

  console.log('[Upload Video] productId:', productId, 'fileName:', fileName, 'fileSize:', fileSize);

  if (!productId) {
    return NextResponse.json({ error: 'No productId provided' }, { status: 400 });
  }

  if (!fileName) {
    return NextResponse.json({ error: 'No fileName provided' }, { status: 400 });
  }

  try {
    // Step 1: Request a direct upload URL from Cloudflare Stream
    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${streamToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ maxDurationSeconds: 3600 }),
      }
    );

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.success) {
      console.error('[Upload Video] Cloudflare direct_upload error:', cfData);
      return NextResponse.json(
        { error: cfData.errors?.[0]?.message || 'Failed to get upload URL from Cloudflare' },
        { status: 502 }
      );
    }

    const uid = cfData.result.uid;
    const uploadURL = cfData.result.uploadURL;

    console.log('[Upload Video] Got direct upload URL, uid:', uid);

    // Step 2: Save pending video entry to mi_products.videos
    const adminSupabase = createAdminClient();
    const { data: product, error: fetchError } = await adminSupabase
      .from('mi_products')
      .select('videos')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('[Upload Video] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }

    const currentVideos: any[] = product?.videos || [];

    const newVideo = {
      cloudflare_id: uid,
      url: `https://iframe.videodelivery.net/${uid}`,
      status: 'processing',
      thumbnail: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
      sort_order: currentVideos.length,
    };

    const updatedVideos = [...currentVideos, newVideo];

    const { error: dbError } = await adminSupabase
      .from('mi_products')
      .update({ videos: updatedVideos })
      .eq('id', productId);

    if (dbError) {
      console.error('[Upload Video] DB error:', dbError);
      return NextResponse.json({ error: 'Failed to save video' }, { status: 500 });
    }

    // Step 3: Return upload URL and video ID to client
    return NextResponse.json({
      success: true,
      uploadURL,
      videoId: uid,
    });
  } catch (err: any) {
    console.error('[Upload Video] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Video upload failed' },
      { status: 500 }
    );
  }
}
