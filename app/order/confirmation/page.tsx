'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCart } from '@/components/providers/CartProvider';

interface OrderItem {
  id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  warehouse?: 'US' | 'CN';
}

interface OrderDetails {
  id: string;
  order_number: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  shipping_address: {
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { clearCart } = useCart();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) return;
    const fetchOrder = async () => {
      setLoading(true);
      const response = await fetch(`/api/orders/${sessionId}`);
      const data = await response.json();
      if (response.ok) {
        setItems(data.items || []);
        setOrder(data.order || null);
        setSession(data.session || null);
        clearCart();
      }
      setLoading(false);
    };

    fetchOrder();
  }, [sessionId, clearCart]);

  const hasCN = items.some((item) => item.warehouse === 'CN');
  const deliveryEstimate = hasCN ? '10-18 business days' : '2-5 business days';
  const sessionAddress = session?.shipping_details?.address || session?.customer_details?.address;
  const sessionName = session?.shipping_details?.name || session?.customer_details?.name;
  const orderShippingAddress =
    typeof order?.shipping_address === 'string'
      ? (() => {
          try {
            return JSON.parse(order.shipping_address);
          } catch {
            return null;
          }
        })()
      : order?.shipping_address || null;
  const shippingAddress =
    orderShippingAddress ||
    (sessionAddress
      ? {
          name: sessionName || null,
          line1: sessionAddress.line1 || null,
          line2: sessionAddress.line2 || null,
          city: sessionAddress.city || null,
          state: sessionAddress.state || null,
          postal_code: sessionAddress.postal_code || null,
          country: sessionAddress.country || null,
        }
      : null);

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-success" />
            <h1 className="text-3xl font-playfair font-semibold text-warm-900">
              Order Confirmed!
            </h1>
          </div>

          {loading ? (
            <p className="text-warm-600">Loading your order details...</p>
          ) : !order ? (
            <div className="bg-warm-50 border border-warm-200 rounded-2xl p-8">
              <p className="text-warm-700 mb-4">We could not find that order.</p>
              <Link href="/shop" className="text-gold-600 hover:underline">
                Continue shopping
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_320px] gap-8">
              <div className="space-y-6">
                <div className="bg-warm-50 border border-warm-200 rounded-2xl p-6">
                  <p className="text-sm text-warm-500">Order number</p>
                  <p className="text-sm font-semibold text-warm-900 font-mono break-all">
                    {order.order_number}
                  </p>
                  <p className="text-sm text-warm-600 mt-2">
                    Estimated delivery: {deliveryEstimate}
                  </p>
                </div>

                <div className="bg-white border border-warm-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-warm-900 mb-4">Items</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 border-b border-warm-100 pb-4 last:border-0 last:pb-0"
                      >
                        <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0">
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-warm-900">{item.name}</p>
                          <p className="text-sm text-warm-500">Qty {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-warm-900">
                          ${Number(item.total || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-warm-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold text-warm-900 mb-4">Shipping</h2>
                  {shippingAddress ? (
                    <div className="text-sm text-warm-600 space-y-1">
                      <p className="font-semibold text-warm-900">{shippingAddress.name}</p>
                      <p>{shippingAddress.line1}</p>
                      {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                      <p>
                        {shippingAddress.city}, {shippingAddress.state}{' '}
                        {shippingAddress.postal_code}
                      </p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-warm-500">Address will appear once payment clears.</p>
                  )}
                </div>
              </div>

              <aside className="bg-warm-50 border border-warm-200 rounded-2xl p-6 h-fit">
                <h2 className="text-lg font-semibold text-warm-900 mb-4">Payment Summary</h2>
                <div className="space-y-3 text-sm text-warm-700">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span>${Number(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="text-success">
                      - ${Number(order.discount_amount || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span>${Number(order.shipping_cost || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-warm-200 pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-warm-900">Total</span>
                  <span className="text-xl font-semibold text-warm-900">
                    ${Number(order.total || 0).toFixed(2)}
                  </span>
                </div>
                <Link
                  href="/shop"
                  className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold-500 px-4 py-3 text-sm font-semibold text-white hover:bg-gold-600 transition-colors"
                >
                  Continue Shopping
                </Link>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
