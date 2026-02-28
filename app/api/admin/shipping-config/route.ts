import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getShippingConfig, saveShippingConfig, DEFAULT_SHIPPING_CONFIG, ShippingConfig } from '@/lib/config/shipping';

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

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const config = await getShippingConfig();
    return NextResponse.json(config);
  } catch (err: any) {
    console.error('[shipping-config] GET error:', err);
    return NextResponse.json(DEFAULT_SHIPPING_CONFIG);
  }
}

export async function PUT(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();

    const config: ShippingConfig = {
      freeShippingEnabled: Boolean(body.freeShippingEnabled ?? DEFAULT_SHIPPING_CONFIG.freeShippingEnabled),
      freeShippingThreshold: Math.max(0, Number(body.freeShippingThreshold) || DEFAULT_SHIPPING_CONFIG.freeShippingThreshold),
      freeShippingWeightCapGrams: Math.max(0, Number(body.freeShippingWeightCapGrams) || DEFAULT_SHIPPING_CONFIG.freeShippingWeightCapGrams),
      useCJFreightQuotes: Boolean(body.useCJFreightQuotes ?? DEFAULT_SHIPPING_CONFIG.useCJFreightQuotes),
      freightMarkupPercent: Math.max(0, Number(body.freightMarkupPercent) || 0),
      flatRateShipping: Math.max(0, Number(body.flatRateShipping) || DEFAULT_SHIPPING_CONFIG.flatRateShipping),
      minimumShippingCharge: Math.max(0, Number(body.minimumShippingCharge) || 0),
    };

    await saveShippingConfig(config);
    return NextResponse.json(config);
  } catch (err: any) {
    console.error('[shipping-config] PUT error:', err);
    return NextResponse.json({ error: err.message || 'Failed to save' }, { status: 500 });
  }
}
