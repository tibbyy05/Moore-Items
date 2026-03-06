import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PRICING_CONFIG } from '@/lib/config/pricing';

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

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data } = await supabase
    .from('mi_settings')
    .select('value')
    .eq('key', 'pricing_config')
    .single();

  if (data?.value) {
    const cfg = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    return NextResponse.json(cfg);
  }

  return NextResponse.json({
    us_markup: PRICING_CONFIG.markupMultiplier,
    cn_markup: 2.2,
    us_min_margin: PRICING_CONFIG.minimumMargin,
    cn_min_margin: 0.45,
    us_shipping_estimate: PRICING_CONFIG.shippingCostEstimate,
    cn_shipping_estimate: 5.0,
    stripe_fee_percent: PRICING_CONFIG.stripeFeePercent,
    stripe_fee_fixed: PRICING_CONFIG.stripeFeeFixed,
    compare_at_min: PRICING_CONFIG.compareAtPriceMin,
    compare_at_max: PRICING_CONFIG.compareAtPriceMax,
    round_to_99: PRICING_CONFIG.roundTo99,
  });
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { error: upsertError } = await supabase
    .from('mi_settings')
    .upsert({ key: 'pricing_config', value: body }, { onConflict: 'key' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
