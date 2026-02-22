import { NextResponse } from 'next/server';
import { syncCJProducts } from '@/lib/cj/sync';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
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