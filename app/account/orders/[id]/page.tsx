'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';

const STATUS_STEPS = [
  { key: 'unfulfilled', label: 'Order Placed', icon: Package },
  { key: 'processing', label: 'Processing', icon: Clock },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

function getStatusIndex(status: string) {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
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
      const { data: orderData } = await supabase
        .from('mi_orders')
        .select('*')
        .eq('id', params.id)
        .eq('email', user.email)
        .single();

      if (!orderData) {
        router.replace('/account/orders');
        return;
      }

      setOrder(orderData);

      const { data: orderItems } = await supabase
        .from('mi_order_items')
        .select('*')
        .eq('order_id', params.id);

      setItems(orderItems || []);
      setLoading(false);
    };
    load();
  }, [params.id, router, user, authLoading]);

  if (loading || authLoading) return <p className="text-warm-600 py-12">Loading...</p>;
  if (!order) return null;

  const statusIndex = getStatusIndex(order.fulfillment_status);

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-sm text-warm-600 hover:text-warm-900 mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-playfair font-semibold text-warm-900">
            Order #{order.order_number || order.id.slice(0, 8)}
          </h2>
          <p className="text-sm text-warm-600 mt-1">
            Placed on{' '}
            {new Date(order.created_at).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
        <span
          className={cn(
            'inline-block text-sm font-semibold px-3 py-1 rounded-full self-start',
            order.fulfillment_status === 'delivered' && 'bg-green-100 text-green-700',
            order.fulfillment_status === 'shipped' && 'bg-blue-100 text-blue-700',
            order.fulfillment_status === 'processing' && 'bg-yellow-100 text-yellow-700',
            order.fulfillment_status === 'unfulfilled' && 'bg-warm-200 text-warm-600'
          )}
        >
          {order.fulfillment_status || 'Processing'}
        </span>
      </div>

      <div className="bg-warm-50 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between">
          {STATUS_STEPS.map((step, index) => {
            const isCompleted = index <= statusIndex;
            const isCurrent = index === statusIndex;
            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center mb-2',
                    isCompleted ? 'bg-green-500 text-white' : 'bg-warm-200 text-warm-400',
                    isCurrent && 'ring-4 ring-green-200'
                  )}
                >
                  <step.icon className="w-5 h-5" />
                </div>
                <p
                  className={cn(
                    'text-xs font-medium text-center',
                    isCompleted ? 'text-warm-900' : 'text-warm-400'
                  )}
                >
                  {step.label}
                </p>
                {index < STATUS_STEPS.length - 1 && <div className="hidden" />}
              </div>
            );
          })}
        </div>
        <div className="flex mt-[-36px] mb-6 px-[20px]">
          {STATUS_STEPS.slice(0, -1).map((_, index) => (
            <div key={index} className="flex-1 h-1 mx-1 rounded" style={{ marginTop: '20px' }}>
              <div
                className={cn(
                  'h-full rounded',
                  index < statusIndex ? 'bg-green-500' : 'bg-warm-200'
                )}
              />
            </div>
          ))}
        </div>
      </div>

      {order.tracking_number && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Tracking Number</p>
              <p className="text-sm text-blue-600 font-mono">{order.tracking_number}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">Items</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-warm-50 rounded-xl p-4">
              {item.image && (
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-warm-100 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.product_name || 'Product'}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-warm-900 truncate">
                  {item.product_name || 'Product'}
                </p>
                {item.variant_name && <p className="text-xs text-warm-500">{item.variant_name}</p>}
                <p className="text-sm text-warm-600">Qty: {item.quantity}</p>
              </div>
              <p className="font-semibold text-warm-900">
                ${Number(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-warm-50 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-warm-900 mb-4">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-warm-600">
            <span>Subtotal</span>
            <span>${Number(order.subtotal || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-warm-600">
            <span>Shipping</span>
            <span>
              {Number(order.shipping_cost || 0) === 0
                ? 'Free'
                : `$${Number(order.shipping_cost).toFixed(2)}`}
            </span>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${Number(order.discount_amount).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-warm-900 text-base pt-2 border-t border-warm-200">
            <span>Total</span>
            <span>${Number(order.total || 0).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {order.shipping_address && (
        <div className="bg-warm-50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-warm-900 mb-3">Shipping Address</h3>
          <div className="text-sm text-warm-700 space-y-1">
            {order.shipping_address.name && (
              <p className="font-medium">{order.shipping_address.name}</p>
            )}
            {order.shipping_address.line1 && <p>{order.shipping_address.line1}</p>}
            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
            <p>
              {[order.shipping_address.city, order.shipping_address.state, order.shipping_address.postal_code]
                .filter(Boolean)
                .join(', ')}
            </p>
            {order.shipping_address.country && <p>{order.shipping_address.country}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
