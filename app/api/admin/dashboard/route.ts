import { NextResponse } from 'next/server';
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

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const todayDate = new Date();
  const todayStart = new Date(todayDate.toISOString().split('T')[0] + 'T00:00:00Z');
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [
    { data: todayOrdersData },
    { count: activeProductsCount },
    { count: needsPolishCount },
    { data: recentOrdersData },
    { data: topSellers },
    { data: weekOrdersData },
    { count: pageViews },
    { count: purchases },
  ] = await Promise.all([
    supabase
      .from('mi_orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('mi_products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('mi_products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
      .or('review_count.eq.0,review_count.is.null'),
    supabase
      .from('mi_orders')
      .select(
        'id, order_number, created_at, email, total, payment_status, fulfillment_status, mi_order_items(name, image_url, quantity)'
      )
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('mi_order_items').select('product_id, name, image_url, quantity'),
    supabase
      .from('mi_orders')
      .select('total, created_at')
      .eq('payment_status', 'paid')
      .gte('created_at', weekStart.toISOString()),
    supabase
      .from('mi_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view'),
    supabase
      .from('mi_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'purchase'),
  ]);

  const todayRevenue =
    todayOrdersData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
  const todayOrders = todayOrdersData?.length || 0;

  const productSales: Record<
    string,
    { name: string; image_url: string | null; totalQty: number; totalOrders: number }
  > = {};
  (topSellers || []).forEach((item: any) => {
    const key = item.product_id || item.name;
    if (!productSales[key]) {
      productSales[key] = { name: item.name, image_url: item.image_url, totalQty: 0, totalOrders: 0 };
    }
    productSales[key].totalQty += item.quantity || 1;
    productSales[key].totalOrders += 1;
  });
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartData = Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const dayKey = day.toISOString().split('T')[0];
    const dayRevenue =
      weekOrdersData
        ?.filter((order) => String(order.created_at).startsWith(dayKey))
        .reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
    return {
      label: dayLabels[day.getDay()],
      value: dayRevenue,
      isToday: dayKey === todayStart.toISOString().split('T')[0],
    };
  });

  const conversionRate =
    pageViews && pageViews > 0 ? ((purchases || 0) / pageViews) * 100 : 0;

  return NextResponse.json({
    todayRevenue,
    todayOrders,
    activeProducts: activeProductsCount || 0,
    needsPolish: needsPolishCount || 0,
    conversionRate,
    recentOrders: recentOrdersData || [],
    topProducts,
    chartData,
  });
}
