import { NextRequest, NextResponse } from 'next/server';
import { syncCJProducts } from '@/lib/cj/sync';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const { error: authError } = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();

  try {
    const body = await request.json().catch(() => ({}));

    const { data: deletedVariants, error: variantsError } = await supabase
      .from('mi_product_variants')
      .delete()
      .not('id', 'is', null)
      .select('id');

    if (variantsError) {
      return NextResponse.json({ error: variantsError.message }, { status: 500 });
    }

    const { data: deletedProducts, error: productsError } = await supabase
      .from('mi_products')
      .delete()
      .not('id', 'is', null)
      .select('id');

    if (productsError) {
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    console.log(
      '[admin resync] Deleted products:',
      deletedProducts?.length || 0,
      'variants:',
      deletedVariants?.length || 0
    );

    const result = await syncCJProducts(undefined, 1, 200, false, body.warehouse || 'all');
    return NextResponse.json({
      success: true,
      deletedProducts: deletedProducts?.length || 0,
      deletedVariants: deletedVariants?.length || 0,
      result,
    });
  } catch (error: any) {
    console.error('[admin resync] Failed', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}