'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, Heart, ChevronRight } from 'lucide-react';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AccountDashboard() {
  const router = useRouter();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { items: wishlistItems } = useWishlist();
  const { user, customer, loading: authLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      const supabase = createClient();
      const { data: orders, count } = await supabase
        .from('mi_orders')
        .select('id, order_number, created_at, total, fulfillment_status, payment_status', {
          count: 'exact',
        })
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentOrders(orders || []);
      setOrderCount(count || 0);
      setLoading(false);
    };
    load();
  }, [router, user, authLoading]);

  if (loading || authLoading) return <p className="text-warm-600 py-12">Loading...</p>;

  const firstName =
    customer?.full_name?.split(' ')[0] ||
    user?.user_metadata?.full_name?.split(' ')[0] ||
    'there';

  return (
    <div>
      <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-2">
        Welcome back, {firstName}!
      </h2>
      <p className="text-warm-600 mb-8">{user?.email}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link
          href="/account/orders"
          className="bg-warm-50 rounded-xl p-6 hover:bg-warm-100 transition group"
        >
          <Package className="w-6 h-6 text-gold-500 mb-2" />
          <p className="text-2xl font-bold text-warm-900">{orderCount}</p>
          <p className="text-sm text-warm-600">Total Orders</p>
        </Link>
        <Link
          href="/account/wishlist"
          className="bg-warm-50 rounded-xl p-6 hover:bg-warm-100 transition group"
        >
          <Heart className="w-6 h-6 text-gold-500 mb-2" />
          <p className="text-2xl font-bold text-warm-900">{wishlistItems.length}</p>
          <p className="text-sm text-warm-600">Wishlist Items</p>
        </Link>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-warm-900">Recent Orders</h3>
          {orderCount > 3 && (
            <Link
              href="/account/orders"
              className="text-sm text-gold-600 hover:text-gold-700 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        {recentOrders.length === 0 ? (
          <div className="bg-warm-50 rounded-xl p-8 text-center">
            <Package className="w-8 h-8 text-warm-400 mx-auto mb-3" />
            <p className="text-warm-600 mb-4">You haven't placed any orders yet.</p>
            <Link
              href="/shop"
              className="inline-flex px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/account/orders/${order.id}`}
                className="flex items-center justify-between bg-warm-50 rounded-xl p-4 hover:bg-warm-100 transition"
              >
                <div>
                  <p className="font-semibold text-warm-900">
                    Order #{order.order_number || order.id.slice(0, 8)}
                  </p>
                  <p className="text-sm text-warm-600">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-warm-900">
                    ${Number(order.total || 0).toFixed(2)}
                  </p>
                  <span
                    className={cn(
                      'inline-block text-xs font-semibold px-2 py-0.5 rounded-full',
                      order.fulfillment_status === 'delivered' && 'bg-green-100 text-green-700',
                      order.fulfillment_status === 'shipped' && 'bg-blue-100 text-blue-700',
                      order.fulfillment_status === 'processing' && 'bg-yellow-100 text-yellow-700',
                      order.fulfillment_status === 'unfulfilled' && 'bg-warm-200 text-warm-600'
                    )}
                  >
                    {order.fulfillment_status || 'Processing'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
