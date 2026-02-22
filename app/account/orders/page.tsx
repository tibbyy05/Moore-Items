'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        router.replace('/login');
        return;
      }
      const supabase = createClient();
      const { data } = await supabase
        .from('mi_orders')
        .select(
          'id, order_number, created_at, total, subtotal, fulfillment_status, payment_status, shipping_method'
        )
        .eq('email', user.email)
        .order('created_at', { ascending: false });

      setOrders(data || []);
      setLoading(false);
    };
    load();
  }, [router, user, authLoading]);

  if (loading || authLoading) return <p className="text-warm-600 py-12">Loading...</p>;

  return (
    <div>
      <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-6">Order History</h2>

      {orders.length === 0 ? (
        <div className="bg-warm-50 rounded-xl p-8 text-center">
          <Package className="w-8 h-8 text-warm-400 mx-auto mb-3" />
          <p className="text-warm-600 mb-4">No orders yet.</p>
          <Link
            href="/shop"
            className="inline-flex px-6 py-2.5 rounded-lg bg-[#0f1629] text-white font-semibold hover:bg-navy-900 transition text-sm"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="flex items-center justify-between bg-warm-50 rounded-xl p-5 hover:bg-warm-100 transition group"
            >
              <div>
                <p className="font-semibold text-warm-900">
                  Order #{order.order_number || order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-warm-600 mt-1">
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold text-warm-900">
                    ${Number(order.total || 0).toFixed(2)}
                  </p>
                  <span
                    className={cn(
                      'inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1',
                      order.fulfillment_status === 'delivered' && 'bg-green-100 text-green-700',
                      order.fulfillment_status === 'shipped' && 'bg-blue-100 text-blue-700',
                      order.fulfillment_status === 'processing' && 'bg-yellow-100 text-yellow-700',
                      order.fulfillment_status === 'unfulfilled' && 'bg-warm-200 text-warm-600'
                    )}
                  >
                    {order.fulfillment_status || 'Processing'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-warm-400 group-hover:text-warm-600 transition" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
