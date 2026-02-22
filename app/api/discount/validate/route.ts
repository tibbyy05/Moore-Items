import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const code = String(body?.code || '').trim().toUpperCase();
    const subtotal = Number(body?.subtotal || 0);

    if (!code) {
      return NextResponse.json({ valid: false, message: 'Invalid code' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: discount, error } = await supabase
      .from('mi_discount_codes')
      .select('*')
      .ilike('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !discount) {
      return NextResponse.json({ valid: false, message: 'Invalid code' }, { status: 200 });
    }

    const minimum = parseFloat(String(discount.min_order_amount || 0));
    if (subtotal < minimum) {
      return NextResponse.json(
        { valid: false, message: `Minimum order is $${minimum.toFixed(2)}` },
        { status: 200 }
      );
    }

    const type = String(discount.type || 'fixed');
    const value = parseFloat(String(discount.value || 0));
    const discountAmount =
      type === 'percentage' ? Math.max(0, (subtotal * value) / 100) : Math.max(0, value);

    return NextResponse.json({
      valid: true,
      discount_amount: Math.min(discountAmount, subtotal),
      discount_type: type,
      description: discount.description || null,
    });
  } catch (error) {
    console.error('Discount validation error', error);
    return NextResponse.json({ valid: false, message: 'Invalid code' }, { status: 500 });
  }
}
