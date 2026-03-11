import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return adminProfile ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('mi_hero_images')
    .select('*')
    .order('slot', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { product_id, image_url, product_name, slot } = body;

  if (!product_id || !image_url) {
    return NextResponse.json({ error: 'product_id and image_url are required' }, { status: 400 });
  }

  const slotNum = typeof slot === 'number' && slot >= 1 && slot <= 4 ? slot : 1;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('mi_hero_images')
    .insert({
      product_id,
      image_url,
      product_name: product_name || null,
      slot: slotNum,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
