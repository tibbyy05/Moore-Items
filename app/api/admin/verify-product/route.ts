import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';

async function requireAdmin(request: NextRequest) {
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

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const pid = searchParams.get('pid');

  if (!pid) {
    return NextResponse.json({ error: 'Missing pid' }, { status: 400 });
  }

  try {
    const product = await cjClient.getProduct(pid);
    let stockData: any = null;
    let stockError: string | null = null;

    try {
      const stockResponse = await cjClient.getProductStock(pid);
      stockData = stockResponse?.data || stockResponse;
    } catch (error: any) {
      stockError = error?.message || 'Stock lookup failed';
    }

    return NextResponse.json({
      data: product,
      stock: stockData,
      stockError,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'CJ request failed' }, { status: 500 });
  }
}
