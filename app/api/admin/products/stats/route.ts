import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const authClient = await createServerSupabaseClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await authClient
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    const supabase = createAdminClient();

    const [activeRes, hiddenRes, oosRes, categorizedRes, uncategorizedRes] =
      await Promise.all([
        supabase
          .from('mi_products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active'),
        supabase
          .from('mi_products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'hidden'),
        supabase
          .from('mi_products')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'out_of_stock'),
        supabase
          .from('mi_products')
          .select('id', { count: 'exact', head: true })
          .not('category_id', 'is', null),
        supabase
          .from('mi_products')
          .select('id', { count: 'exact', head: true })
          .is('category_id', null),
      ]);

    return NextResponse.json({
      active: activeRes.count ?? 0,
      hidden: hiddenRes.count ?? 0,
      outOfStock: oosRes.count ?? 0,
      categorized: categorizedRes.count ?? 0,
      uncategorized: uncategorizedRes.count ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
