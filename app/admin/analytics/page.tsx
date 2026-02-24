'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/BarChart';
import { TrendingUp, ShoppingCart, DollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PageViewRow {
  page: string;
  views: number;
}

interface TrafficRow {
  source: string;
  visitors: number;
  color: string;
}

export default function AnalyticsPage() {
  const supabase = createClient();
  const [chartData, setChartData] = useState<{ label: string; value: number; isToday?: boolean }[]>(
    []
  );
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [topPages, setTopPages] = useState<PageViewRow[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficRow[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const today = new Date();
      const todayKey = today.toISOString().split('T')[0];
      const weekStart = new Date(todayKey + 'T00:00:00Z');
      weekStart.setDate(weekStart.getDate() - 6);

      const { data: orders } = await supabase
        .from('mi_orders')
        .select('total, created_at, payment_status')
        .eq('payment_status', 'paid')
        .gte('created_at', weekStart.toISOString());

      const totalRevenueValue =
        orders?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
      setTotalRevenue(totalRevenueValue);
      setTotalOrders(orders?.length || 0);

      const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyChart = Array.from({ length: 7 }).map((_, index) => {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + index);
        const dayKey = day.toISOString().split('T')[0];
        const dayRevenue =
          orders
            ?.filter((order) => String(order.created_at).startsWith(dayKey))
            .reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

        return {
          label: labels[day.getDay()],
          value: dayRevenue,
          isToday: dayKey === todayKey,
        };
      });
      setChartData(weeklyChart);

      const { data: events } = await supabase
        .from('mi_analytics_events')
        .select('event_type, metadata')
        .eq('event_type', 'page_view');

      const pageMap = new Map<string, number>();
      const sourceMap = new Map<string, number>();

      (events || []).forEach((event) => {
        const metadata = (event.metadata || {}) as Record<string, string>;
        const page = metadata.path || metadata.page || 'Unknown';
        const source = metadata.source || 'Unknown';
        pageMap.set(page, (pageMap.get(page) || 0) + 1);
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);
      });

      const topPagesData = Array.from(pageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([page, views]) => ({ page, views }));

      const colors = ['bg-gold-500', 'bg-success', 'bg-info', 'bg-warning', 'bg-danger'];
      const trafficData = Array.from(sourceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([source, visitors], idx) => ({
          source,
          visitors,
          color: colors[idx] || 'bg-gray-400',
        }));

      setTopPages(topPagesData);
      setTrafficSources(trafficData);
    };

    fetchAnalytics();
  }, [supabase]);

  const avgOrderValue = useMemo(() => {
    return totalOrders > 0 ? totalRevenue / totalOrders : 0;
  }, [totalRevenue, totalOrders]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Analytics</h1>
        <p className="text-sm text-gray-500">Track performance metrics and insights</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
        />
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={totalOrders.toString()}
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Order Value"
          value={`$${avgOrderValue.toFixed(2)}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1a1a2e] mb-6">Weekly Revenue</h3>
          <BarChart data={chartData} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#1a1a2e] mb-6">Traffic Sources</h3>
          <div className="space-y-4">
            {trafficSources.length === 0 ? (
              <p className="text-sm text-gray-500">No traffic data yet.</p>
            ) : (
              trafficSources.map((item) => {
                const maxVisitors = Math.max(...trafficSources.map((entry) => entry.visitors));
                const percentage = (item.visitors / maxVisitors) * 100;
                return (
                  <div key={item.source}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#1a1a2e]">{item.source}</span>
                      <span className="text-sm font-semibold text-gray-600">{item.visitors}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#1a1a2e] mb-6">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Page
                </th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase">
                  Views
                </th>
              </tr>
            </thead>
            <tbody>
              {topPages.length === 0 ? (
                <tr>
                  <td className="py-6 px-4 text-sm text-gray-500" colSpan={2}>
                    No page view data yet.
                  </td>
                </tr>
              ) : (
                topPages.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 last:border-0">
                    <td className="py-3 px-4 text-sm text-[#1a1a2e] font-medium">{item.page}</td>
                    <td className="py-3 px-4 text-sm text-gray-700 text-right font-variant-tabular">
                      {item.views.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}