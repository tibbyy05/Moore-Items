'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { BarChart } from '@/components/admin/BarChart';
import {
  DollarSign,
  ShoppingCart,
  Package,
  TrendingUp,
  Sparkles,
  Plus,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

interface RecentOrder {
  id: string;
  order_number: string;
  total: number;
  email: string | null;
  payment_status: string;
  fulfillment_status: string;
  mi_order_items?: Array<{ name: string; image_url: string | null; quantity: number }>;
}

interface TopProduct {
  name: string;
  image_url: string | null;
  totalQty: number;
  totalOrders: number;
}

function buildEmptyChart() {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];
  const weekStart = new Date(todayKey + 'T00:00:00Z');
  weekStart.setDate(weekStart.getDate() - 6);
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return Array.from({ length: 7 }).map((_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    const dayKey = day.toISOString().split('T')[0];
    return {
      label: labels[day.getDay()],
      value: 0,
      isToday: dayKey === todayKey,
    };
  });
}

export default function AdminDashboard() {
  const supabase = createClient();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayOrders, setTodayOrders] = useState(0);
  const [activeProducts, setActiveProducts] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [needsPolish, setNeedsPolish] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [chartData, setChartData] = useState(buildEmptyChart());
  const [loading, setLoading] = useState(true);
  const [repricing, setRepricing] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setLoading(true);
      const todayDate = new Date();
      const todayStart = new Date(todayDate.toISOString().split('T')[0] + 'T00:00:00Z');
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 6);

      const { data: todayOrdersData } = await supabase
        .from('mi_orders')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', todayStart.toISOString());

      const revenueTodayValue =
        todayOrdersData?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;
      setTodayRevenue(revenueTodayValue);
      setTodayOrders(todayOrdersData?.length || 0);

      const { count: activeProductsCount } = await supabase
        .from('mi_products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setActiveProducts(activeProductsCount || 0);

      const { count: needsPolishCount } = await supabase
        .from('mi_products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or('review_count.eq.0,review_count.is.null');
      setNeedsPolish(needsPolishCount || 0);

      const { data: recentOrdersData } = await supabase
        .from('mi_orders')
        .select(
          `
          id,
          order_number,
          created_at,
          email,
          total,
          payment_status,
          fulfillment_status,
          mi_order_items (
            name,
            image_url,
            quantity
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentOrders((recentOrdersData as RecentOrder[]) || []);

      const { data: topSellers } = await supabase
        .from('mi_order_items')
        .select('product_id, name, image_url, quantity');

      const productSales: Record<
        string,
        { name: string; image_url: string | null; totalQty: number; totalOrders: number }
      > = {};

      (topSellers || []).forEach((item: any) => {
        const key = item.product_id || item.name;
        if (!productSales[key]) {
          productSales[key] = {
            name: item.name,
            image_url: item.image_url,
            totalQty: 0,
            totalOrders: 0,
          };
        }
        productSales[key].totalQty += item.quantity || 1;
        productSales[key].totalOrders += 1;
      });

      const topSellingProducts = Object.values(productSales)
        .sort((a, b) => b.totalQty - a.totalQty)
        .slice(0, 5);

      setTopProducts(topSellingProducts);

      const { data: weekOrdersData } = await supabase
        .from('mi_orders')
        .select('total, created_at')
        .eq('payment_status', 'paid')
        .gte('created_at', weekStart.toISOString());

      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyChart = Array.from({ length: 7 }).map((_, index) => {
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
      setChartData(weeklyChart);

      const { count: pageViews } = await supabase
        .from('mi_analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view');
      const { count: purchases } = await supabase
        .from('mi_analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'purchase');

      const conversionValue =
        pageViews && pageViews > 0 ? ((purchases || 0) / pageViews) * 100 : 0;
      setConversionRate(conversionValue);

      setLoading(false);
    };

    fetchDashboardStats();
  }, [supabase]);

  const weekTotal = useMemo(
    () => chartData.reduce((sum, day) => sum + day.value, 0),
    [chartData]
  );

  return (
    <>
      <div className="mb-8">
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e] mb-2">Dashboard</h1>
        <p className="text-sm text-gray-500">
          {today} — Welcome back, Danny
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6 mb-8">
        <StatCard
          label="Revenue Today"
          value={`$${todayRevenue.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          label="Orders Today"
          value={todayOrders.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          label="Products Active"
          value={activeProducts.toString()}
          icon={Package}
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate.toFixed(1)}%`}
          icon={TrendingUp}
        />
        <StatCard
          label="Needs Polish"
          value={needsPolish.toString()}
          icon={Sparkles}
          iconBgClassName="bg-violet-50"
          iconClassName="text-violet-500"
        />
      </div>

      <div className="flex gap-4 mb-8">
        <Link
          href="/admin/products/add"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Plus className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-[#1a1a2e] group-hover:text-indigo-600 transition-colors">
            Add Product
          </span>
        </Link>
        <button
          onClick={async () => {
            if (!window.confirm('Reprice all products using current pricing config?')) return;
            setRepricing(true);
            try {
              const res = await fetch('/api/admin/reprice', { method: 'POST' });
              const data = await res.json();
              if (!res.ok) throw new Error(data?.error || 'Reprice failed');
              toast.success(`Repriced ${data.updated} products`);
            } catch (err: any) {
              toast.error(err?.message || 'Reprice failed');
            } finally {
              setRepricing(false);
            }
          }}
          disabled={repricing}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 hover:shadow-md transition-shadow group disabled:opacity-60"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
            <RefreshCw className={`w-4 h-4 text-amber-600 ${repricing ? 'animate-spin' : ''}`} />
          </div>
          <span className="text-sm font-semibold text-[#1a1a2e] group-hover:text-amber-600 transition-colors">
            {repricing ? 'Repricing...' : 'Reprice All'}
          </span>
        </button>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 hover:shadow-md transition-shadow group"
        >
          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </div>
          <span className="text-sm font-semibold text-[#1a1a2e] group-hover:text-gray-600 transition-colors">
            View Store
          </span>
        </a>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-[#1a1a2e] mb-1">Revenue This Week</h2>
            <p className="text-2xl font-bold text-gold-500 font-variant-tabular">
              ${weekTotal.toFixed(2)}
            </p>
          </div>
          <BarChart data={chartData} height={240} />
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#1a1a2e] mb-4">Recent Orders</h2>
          <div className="space-y-3">
            {loading && recentOrders.length === 0
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`order-skeleton-${index}`}
                    className="p-3 bg-gray-100 rounded-lg animate-pulse"
                  >
                    <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
                    <div className="h-3 w-48 bg-gray-200 rounded" />
                  </div>
                ))
              : recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders`}
                    className="block p-3 bg-white rounded-lg hover:bg-gray-50 transition-colors cursor-pointer border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      {order.mi_order_items?.[0]?.image_url ? (
                        <img
                          src={order.mi_order_items[0].image_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1a1a2e] truncate">
                          {order.mi_order_items?.[0]?.name || 'Unknown item'}
                          {order.mi_order_items && order.mi_order_items.length > 1 && (
                            <span className="text-gray-400 font-normal">
                              {' '}
                              +{order.mi_order_items.length - 1} more
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {order.order_number}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-[#1a1a2e]">
                          ${Number(order.total || 0).toFixed(2)}
                        </p>
                        <span
                          className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 text-emerald-700'
                              : order.payment_status === 'pending'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {order.payment_status?.charAt(0).toUpperCase() +
                            order.payment_status?.slice(1)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold text-[#1a1a2e]">Top Selling Products</h2>
          <Link
            href="/admin/products"
            className="text-sm font-medium text-gold-500 hover:text-gold-400 transition-colors"
          >
            View All
          </Link>
        </div>

        {topProducts.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">
              No sales yet — top sellers will appear here after your first orders.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-3 p-4">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1a1a2e] truncate">{product.name}</p>
                  <p className="text-xs text-gray-400">
                    {product.totalQty} sold · {product.totalOrders} orders
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
