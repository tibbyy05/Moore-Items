'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Package, Download, Truck, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CustomButton } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

interface LookupItem {
  id: string;
  name: string;
  image_url: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  variant_info: string | null;
  is_digital: boolean;
  download_token?: string;
}

interface LookupOrder {
  id: string;
  order_number: string;
  created_at: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  payment_status: string;
  fulfillment_status: string;
  tracking_number: string | null;
}

export default function OrderLookupPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<LookupOrder | null>(null);
  const [items, setItems] = useState<LookupItem[]>([]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) {
      setError('Please enter both your order number and email address.');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);
    setItems([]);

    try {
      const response = await fetch('/api/orders/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          email: email.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Order not found.');
        return;
      }

      setOrder(data.order);
      setItems(data.items || []);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const allDigital = items.length > 0 && items.every((i) => i.is_digital);

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-white min-h-[60vh]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-warm-100 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7 text-warm-600" />
            </div>
            <h1 className="text-3xl font-playfair font-semibold text-warm-900 mb-2">
              Find Your Order
            </h1>
            <p className="text-warm-600">
              Enter your order number and email to view your order details and download digital products.
            </p>
          </div>

          {!order && (
            <form onSubmit={handleLookup} className="bg-warm-50 border border-warm-200 rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-warm-900 mb-1.5">
                  Order Number
                </label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="MI-1234567890-ABCDEF"
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-warm-900 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-warm-200 bg-white text-warm-900 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                />
              </div>

              {error && (
                <p className="text-sm text-danger">{error}</p>
              )}

              <CustomButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Looking up...
                  </span>
                ) : (
                  'Find Order'
                )}
              </CustomButton>

              <p className="text-xs text-warm-500 text-center">
                Your order number can be found in your confirmation email.
              </p>
            </form>
          )}

          {order && (
            <div className="space-y-6">
              <button
                onClick={() => { setOrder(null); setItems([]); setError(''); }}
                className="text-sm text-warm-600 hover:text-warm-900 transition"
              >
                &larr; Look up another order
              </button>

              {/* Order header */}
              <div className="bg-warm-50 border border-warm-200 rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-warm-500">Order number</p>
                    <p className="text-lg font-semibold text-warm-900 font-mono">
                      {order.order_number}
                    </p>
                    <p className="text-sm text-warm-600 mt-1">
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
                    {order.fulfillment_status === 'delivered'
                      ? allDigital ? 'Delivered — Digital' : 'Delivered'
                      : order.fulfillment_status || 'Processing'}
                  </span>
                </div>

                {order.tracking_number && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-blue-700 bg-blue-50 rounded-lg px-4 py-2.5">
                    <Truck className="w-4 h-4 flex-shrink-0" />
                    <span>Tracking: <span className="font-mono font-semibold">{order.tracking_number}</span></span>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="bg-white border border-warm-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-warm-900 mb-4">Items</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 border-b border-warm-100 pb-4 last:border-0 last:pb-0"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-warm-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-warm-900 truncate">{item.name}</p>
                        {item.variant_info && (
                          <p className="text-xs text-warm-500">{item.variant_info}</p>
                        )}
                        <p className="text-sm text-warm-600">Qty {item.quantity}</p>
                        {item.is_digital && (
                          <span className="inline-block text-xs font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded mt-1">
                            Digital Download
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {item.is_digital && item.download_token && (
                          <a
                            href={`/api/downloads/${order.id}/${item.id}?token=${item.download_token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gold-700 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </a>
                        )}
                        <p className="font-semibold text-warm-900">
                          ${Number(item.total || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-warm-50 border border-warm-200 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-warm-900 mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-warm-600">
                    <span>Subtotal</span>
                    <span>${Number(order.subtotal || 0).toFixed(2)}</span>
                  </div>
                  {!allDigital && (
                    <div className="flex justify-between text-warm-600">
                      <span>Shipping</span>
                      <span>
                        {Number(order.shipping_cost || 0) === 0
                          ? 'Free'
                          : `$${Number(order.shipping_cost).toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  {Number(order.discount_amount || 0) > 0 && (
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

              <div className="text-center">
                <CustomButton variant="primary" asChild>
                  <Link href="/shop">Continue Shopping</Link>
                </CustomButton>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
