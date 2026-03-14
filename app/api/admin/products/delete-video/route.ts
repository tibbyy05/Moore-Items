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

  const body = await request.json();
  const { productId, cloudflareId } = body;

  if (!productId || !cloudflareId) {
    return NextResponse.json(
      { error: 'productId and cloudflareId are required' },
      { status: 400 }
    );
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
    // Delete from Cloudflare Stream (best-effort — don't fail if CF delete fails)
    await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${cloudflareId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${streamToken}`,
        },
      }
    ).catch((err) => {
      console.error('[Delete Video] Cloudflare delete failed:', err);
    });

    // Remove from videos array in DB
    const adminSupabase = createAdminClient();
    const { data: product, error: fetchError } = await adminSupabase
      .from('mi_products')
      .select('videos')
      .eq('id', productId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
    }

    const currentVideos: any[] = product?.videos || [];
    const filteredVideos = currentVideos
      .filter((v: any) => v.cloudflare_id !== cloudflareId)
      .map((v: any, i: number) => ({ ...v, sort_order: i }));

    const { error: updateError } = await adminSupabase
      .from('mi_products')
      .update({ videos: filteredVideos })
      .eq('id', productId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Delete Video] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}
