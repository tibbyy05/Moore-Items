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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Get the code
  const { data: code, error } = await supabase
    .from('mi_discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !code) {
    return NextResponse.json({ error: 'Code not found' }, { status: 404 });
  }

  // Get recent usage history
  const { data: usage } = await supabase
    .from('mi_discount_code_usage')
    .select('*')
    .eq('discount_code_id', id)
    .order('used_at', { ascending: false })
    .limit(50);

  // Calculate payout summary for influencer codes
  let payoutSummary = null;
  if (code.code_type === 'influencer') {
    const usageRows = usage || [];
    payoutSummary = {
      totalPayout: usageRows.reduce((sum, u) => sum + Number(u.influencer_payout || 0), 0),
      pendingPayout: usageRows
        .filter((u) => u.payout_status === 'pending')
        .reduce((sum, u) => sum + Number(u.influencer_payout || 0), 0),
      paidPayout: usageRows
        .filter((u) => u.payout_status === 'paid')
        .reduce((sum, u) => sum + Number(u.influencer_payout || 0), 0),
      pendingCount: usageRows.filter((u) => u.payout_status === 'pending').length,
    };
  }

  return NextResponse.json({ code, usage: usage || [], payoutSummary });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();
  const body = await request.json();

  // Build update object from allowed fields
  const allowedFields = [
    'code', 'type', 'value', 'is_active', 'min_order_amount',
    'code_type', 'influencer_name', 'influencer_email', 'influencer_platform',
    'payout_per_use', 'payout_percent', 'max_uses', 'starts_at', 'expires_at', 'notes',
  ];

  const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
  for (const field of allowedFields) {
    if (field in body) {
      updateData[field] = body[field];
    }
  }

  // Uppercase code if provided
  if (updateData.code) {
    updateData.code = String(updateData.code).trim().toUpperCase();

    // Check for duplicate (excluding self)
    const { data: existing } = await supabase
      .from('mi_discount_codes')
      .select('id')
      .ilike('code', updateData.code)
      .neq('id', id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'A code with this name already exists' }, { status: 409 });
    }
  }

  const { data, error } = await supabase
    .from('mi_discount_codes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ code: data });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  // Usage rows cascade-delete via FK
  const { error } = await supabase
    .from('mi_discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
