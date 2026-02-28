import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'general' | 'influencer' | null (all)
  const active = searchParams.get('active'); // 'true' | 'false' | null (all)
  const search = searchParams.get('search'); // search by code or influencer name

  let query = supabase
    .from('mi_discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('code_type', type);
  }

  if (active === 'true') {
    query = query.eq('is_active', true);
  } else if (active === 'false') {
    query = query.eq('is_active', false);
  }

  if (search) {
    query = query.or(`code.ilike.%${search}%,influencer_name.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate summary stats
  const codes = data || [];
  const summary = {
    total: codes.length,
    active: codes.filter((c) => c.is_active).length,
    totalUses: codes.reduce((sum, c) => sum + (c.total_uses || 0), 0),
    totalRevenue: codes.reduce((sum, c) => sum + Number(c.total_revenue || 0), 0),
  };

  return NextResponse.json({ codes, summary });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const body = await request.json();
  const code = String(body.code || '').trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ error: 'Code is required' }, { status: 400 });
  }

  // Check for duplicate
  const { data: existing } = await supabase
    .from('mi_discount_codes')
    .select('id')
    .ilike('code', code)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'A code with this name already exists' }, { status: 409 });
  }

  const insertData: Record<string, any> = {
    code,
    type: body.type || 'percentage',
    value: Number(body.value || 0),
    is_active: body.is_active !== false,
    min_order_amount: Number(body.min_order_amount || 0),
    code_type: body.code_type || 'general',
    influencer_name: body.influencer_name || null,
    influencer_email: body.influencer_email || null,
    influencer_platform: body.influencer_platform || null,
    payout_per_use: body.payout_per_use ? Number(body.payout_per_use) : null,
    payout_percent: body.payout_percent ? Number(body.payout_percent) : null,
    max_uses: body.max_uses ? Number(body.max_uses) : null,
    starts_at: body.starts_at || null,
    expires_at: body.expires_at || null,
    notes: body.notes || null,
    total_uses: 0,
    total_revenue: 0,
    total_discount_given: 0,
    used_count: 0,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('mi_discount_codes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: data }, { status: 201 });
}
