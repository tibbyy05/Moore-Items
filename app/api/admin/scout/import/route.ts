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
    const { cj_pid } = body;

    if (!cj_pid || typeof cj_pid !== 'string') {
      return NextResponse.json({ error: 'Missing CJ product ID' }, { status: 400 });
    }

    const trimmedPid = cj_pid.trim();

    // Check if product already exists
    const { data: existing } = await supabase
      .from('mi_products')
      .select('id, name, slug')
      .eq('cj_pid', trimmedPid)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          error: `Product already exists: ${existing.name}`,
          product_id: existing.id,
          product_slug: existing.slug,
        },
        { status: 409 }
      );
    }

    // Trigger background function — fire and forget
    const secret = process.env.AUTO_IMPORT_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mooreitems.com';
    const bgUrl = `${siteUrl}/.netlify/functions/import-product-background?key=${encodeURIComponent(secret || '')}`;

    fetch(bgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cj_pid: trimmedPid }),
    }).catch((err) => {
      console.error('[scout] Failed to trigger background import:', err);
    });

    return NextResponse.json(
      {
        success: true,
        queued: true,
        message: 'Import started — product will appear in your catalog shortly.',
        cj_pid: trimmedPid,
      },
      { status: 202 }
    );
  } catch (err: any) {
    console.error('[scout] Import error:', err);
    return NextResponse.json(
      { error: err?.message || 'Import failed' },
      { status: 500 }
    );
  }
}
