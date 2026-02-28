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

type Period = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_quarter' | 'all_time';

interface DateRange {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  groupBy: 'hour' | 'day' | 'week';
}

function getDateRange(period: Period): DateRange {
  const now = new Date();
  const todayStart = new Date(now.toISOString().split('T')[0] + 'T00:00:00Z');

  switch (period) {
    case 'today': {
      return { dateFrom: todayStart, dateTo: undefined, groupBy: 'hour' as const };
    }
    case 'this_week': {
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);
      return { dateFrom: weekStart, dateTo: undefined, groupBy: 'day' as const };
    }
    case 'last_week': {
      const dayOfWeek = todayStart.getDay();
      const thisWeekStart = new Date(todayStart);
      thisWeekStart.setDate(todayStart.getDate() - dayOfWeek);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const lastWeekEnd = new Date(thisWeekStart);
      lastWeekEnd.setMilliseconds(-1);
      return { dateFrom: lastWeekStart, dateTo: lastWeekEnd, groupBy: 'day' as const };
    }
    case 'this_month': {
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      return { dateFrom: monthStart, dateTo: undefined, groupBy: 'day' as const };
    }
    case 'last_month': {
      const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
      const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      lastMonthEnd.setMilliseconds(-1);
      return { dateFrom: lastMonthStart, dateTo: lastMonthEnd, groupBy: 'day' as const };
    }
    case 'this_quarter': {
      const quarterMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      const quarterStart = new Date(Date.UTC(now.getUTCFullYear(), quarterMonth, 1));
      return { dateFrom: quarterStart, dateTo: undefined, groupBy: 'week' as const };
    }
    case 'all_time': {
      return { dateFrom: undefined, dateTo: undefined, groupBy: 'week' as const };
    }
  }
}

function buildChartData(
  ordersData: Array<{ total: any; created_at: string }> | null,
  range: DateRange
) {
  const orders = ordersData || [];
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];

  if (range.groupBy === 'hour') {
    const dateFrom = range.dateFrom!;
    return Array.from({ length: 24 }).map((_, hour) => {
      const hourStr = hour.toString().padStart(2, '0');
      const hourRevenue = orders
        .filter((o) => {
          const d = new Date(o.created_at);
          return d >= dateFrom && d.getUTCHours() === hour;
        })
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
      return {
        label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
        value: hourRevenue,
        isToday: true,
      };
    });
  }

  if (range.groupBy === 'day') {
    const dateFrom = range.dateFrom!;
    const end = range.dateTo ? new Date(range.dateTo) : now;
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days: Array<{ label: string; value: number; isToday: boolean }> = [];
    const current = new Date(dateFrom);

    while (current <= end) {
      const dayKey = current.toISOString().split('T')[0];
      const dayRevenue = orders
        .filter((o) => String(o.created_at).startsWith(dayKey))
        .reduce((sum, o) => sum + Number(o.total || 0), 0);
      days.push({
        label: dayLabels[current.getDay()],
        value: dayRevenue,
        isToday: dayKey === todayKey,
      });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  // groupBy === 'week'
  if (orders.length === 0) return [];
  const dateFrom = range.dateFrom
    ? range.dateFrom
    : new Date(
        orders.reduce((min, o) => (o.created_at < min ? o.created_at : min), orders[0].created_at)
      );
  const end = range.dateTo ? new Date(range.dateTo) : now;
  const weeks: Array<{ label: string; value: number; isToday: boolean }> = [];
  const current = new Date(dateFrom);
  // Align to start of week (Sunday)
  current.setDate(current.getDate() - current.getDay());

  while (current <= end) {
    const weekEnd = new Date(current);
    weekEnd.setDate(current.getDate() + 6);
    const weekRevenue = orders
      .filter((o) => {
        const d = new Date(o.created_at);
        return d >= current && d <= weekEnd;
      })
      .reduce((sum, o) => sum + Number(o.total || 0), 0);
    const label = `${current.getUTCMonth() + 1}/${current.getUTCDate()}`;
    const isCurrentWeek = now >= current && now <= weekEnd;
    weeks.push({ label, value: weekRevenue, isToday: isCurrentWeek });
    current.setDate(current.getDate() + 7);
  }
  return weeks;
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get('period') || 'today') as Period;
  const validPeriods: Period[] = ['today', 'this_week', 'last_week', 'this_month', 'last_month', 'this_quarter', 'all_time'];
  const safePeriod = validPeriods.includes(period) ? period : 'today';
  const range = getDateRange(safePeriod);

  // Build the orders query for the selected period
  let ordersQuery = supabase
    .from('mi_orders')
    .select('total, created_at')
    .eq('payment_status', 'paid');

  if (range.dateFrom) {
    ordersQuery = ordersQuery.gte('created_at', range.dateFrom.toISOString());
  }
  if (range.dateTo) {
    ordersQuery = ordersQuery.lte('created_at', range.dateTo.toISOString());
  }

  const [
    { data: periodOrdersData },
    { count: activeProductsCount },
    { count: needsPolishCount },
    { data: recentOrdersData },
    { data: topSellers },
    { count: pageViews },
    { count: purchases },
  ] = await Promise.all([
    ordersQuery,
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
      .from('mi_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view'),
    supabase
      .from('mi_analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'purchase'),
  ]);

  const revenue =
    periodOrdersData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
  const orders = periodOrdersData?.length || 0;

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

  const chartData = buildChartData(periodOrdersData, range);

  const conversionRate =
    pageViews && pageViews > 0 ? ((purchases || 0) / pageViews) * 100 : 0;

  return NextResponse.json({
    revenue,
    orders,
    activeProducts: activeProductsCount || 0,
    needsPolish: needsPolishCount || 0,
    conversionRate,
    recentOrders: recentOrdersData || [],
    topProducts,
    chartData,
  });
}
