import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const productId = formData.get('productId') as string | null;

  console.log('[Upload Video] file:', file?.name, file?.type, file?.size);
  console.log('[Upload Video] productId:', productId);
  console.log('[Upload Video] CF vars:',
    process.env.CLOUDFLARE_ACCOUNT_ID ? 'ACCOUNT_SET' : 'ACCOUNT_MISSING',
    process.env.CLOUDFLARE_STREAM_TOKEN ? 'TOKEN_SET' : 'TOKEN_MISSING'
  );

  if (!file) {
    return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
  }

  if (!productId) {
    return NextResponse.json({ error: 'No productId provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only MP4, MOV, and WebM videos are allowed' },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'File too large (max 500 MB)' }, { status: 400 });
  }

  try {
    // Upload to Cloudflare Stream
    const cfFormData = new FormData();
    cfFormData.append('file', file);

    const cfResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${streamToken}`,
        },
        body: cfFormData,
      }
    );

    const cfData = await cfResponse.json();

    if (!cfResponse.ok || !cfData.success) {
      console.error('[Upload Video] Cloudflare error:', cfData);
      return NextResponse.json(
        { error: cfData.errors?.[0]?.message || 'Cloudflare Stream upload failed' },
        { status: 502 }
      );
    }

    const uid = cfData.result.uid;

    // Get current videos array
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

    return NextResponse.json({
      success: true,
      videoId: uid,
      status: 'processing',
    });
  } catch (err: any) {
    console.error('[Upload Video] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Video upload failed' },
      { status: 500 }
    );
  }
}
