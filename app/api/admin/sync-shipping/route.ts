import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncShippingForAll, syncShippingForProduct } from '@/lib/cj/shipping-sync';

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

  const body = await request.json().catch(() => ({}));
  const mode = body?.mode;

  if (mode === 'bulk') {
    const adminClient = createAdminClient();
    const { data: products } = await adminClient
      .from('mi_products')
      .select('id, cj_pid, name')
      .not('cj_pid', 'is', null);

    return NextResponse.json({
      products: (products || []).map((product) => ({
        id: product.id,
        pid: product.cj_pid,
        name: product.name,
      })),
      total: products?.length || 0,
    });
  }

  if (body?.productId && body?.pid) {
    try {
      const result = await syncShippingForProduct(body.productId, body.pid);
      return NextResponse.json({ ...result, productId: body.productId });
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || 'Sync failed' }, { status: 500 });
    }
  }

  const result = await syncShippingForAll();
  return NextResponse.json(result);
}
