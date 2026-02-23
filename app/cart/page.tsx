'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Loader2, Truck, Download } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useCart } from '@/components/providers/CartProvider';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { CustomButton } from '@/components/ui/custom-button';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { ProductCard } from '@/components/product/ProductCard';
import { useAuth } from '@/components/providers/AuthProvider';
import { Product } from '@/lib/types';

interface DiscountState {
  code: string;
  amount: number;
  description?: string;
}

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { user } = useAuth();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<DiscountState | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    if (!discount) return;
    if (!items.length) {
      setDiscount(null);
      setDiscountError('');
      return;
    }
    if (subtotal < (discount.amount || 0)) {
      setDiscount(null);
      setDiscountError('');
    }
  }, [items.length, subtotal, discount]);

  useEffect(() => {
    const fetchRecommendations = async () => {
      const response = await fetch('/api/products?limit=12');
      const data = await response.json();
      if (!response.ok) return;

      const mapped = (data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.retail_price,
        compareAtPrice: product.compare_at_price || null,
        createdAt: product.created_at || undefined,
        images: product.images || [],
        rating: product.average_rating || product.rating || 0,
        reviewCount: product.review_count || 0,
        category: product.mi_categories?.slug || '',
        categoryLabel: product.mi_categories?.name || 'Uncategorized',
        badge: product.badge || null,
        variants:
          product.mi_product_variants?.map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            color: variant.color || undefined,
            size: variant.size || undefined,
            price: variant.retail_price || product.retail_price,
            inStock: variant.stock_count > 0,
          })) || [],
        description: product.description || '',
        shippingDays: product.shipping_days || '7-12 days',
        warehouse: product.warehouse || 'CN',
        inStock: product.stock_count > 0,
        stockCount: product.stock_count || 0,
      }));

      const shuffled = mapped.sort(() => 0.5 - Math.random());
      setRecommendations(shuffled.slice(0, 4));
    };

    fetchRecommendations();
  }, []);

  const discountAmount = discount?.amount || 0;
  const total = Math.max(subtotal - discountAmount, 0);

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Enter a discount code.');
      return;
    }
    setIsApplying(true);
    setDiscountError('');
    setDiscount(null);
    try {
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountCode.trim(), subtotal }),
      });
      const data = await response.json();
      if (!response.ok || !data.valid) {
        setDiscountError(data?.message || 'Invalid code');
        return;
      }
      setDiscount({
        code: discountCode.trim(),
        amount: data.discount_amount,
        description: data.description,
      });
    } catch {
      setDiscountError('Unable to apply code.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCheckout = async () => {
    if (!items.length) return;
    setIsCheckingOut(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          discountCode: discount?.code || undefined,
          email: user?.email || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Checkout failed');
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      setDiscount(null);
      setDiscountCode('');
      setDiscountError('');
    }
  }, [items.length]);

  return (
    <>
      <Header />
      <CartDrawer />
      <main className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-playfair font-semibold text-warm-900 mb-8">
            Your Cart
          </h1>

          {items.length === 0 ? (
            <div className="bg-warm-50 border border-warm-200 rounded-2xl p-10 text-center">
              <h2 className="text-xl font-semibold text-warm-900 mb-2">Your cart is empty</h2>
              <p className="text-warm-600 mb-6">
                Discover curated favorites and start building your order.
              </p>
              <CustomButton variant="primary" asChild>
                <Link href="/shop">Continue Shopping</Link>
              </CustomButton>
            </div>
          ) : (
            <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_360px]">
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId ?? 'default'}`}
                    className="flex flex-col sm:flex-row gap-4 p-4 border border-warm-200 rounded-2xl"
                  >
                    <Link
                      href={`/product/${item.slug}`}
                      className="relative w-28 h-28 rounded-xl overflow-hidden bg-warm-50 flex-shrink-0"
                    >
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 120px"
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/product/${item.slug}`}
                            className="text-lg font-semibold text-warm-900 hover:text-gold-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                          {item.variantName && (
                            <p className="text-sm text-warm-500 mt-1">{item.variantName}</p>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.variantId ?? undefined)}
                          className="p-2 rounded-lg hover:bg-warm-50 text-warm-400 hover:text-danger transition-colors"
                          aria-label="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-warm-500">Unit price</p>
                          <p className="text-base font-semibold text-warm-900">
                            ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <QuantityStepper
                          value={item.quantity}
                          onChange={(qty) =>
                            updateQuantity(item.productId, qty, item.variantId ?? undefined)
                          }
                        />
                        <div className="text-right">
                          <p className="text-sm text-warm-500">Line total</p>
                          <p className="text-lg font-semibold text-warm-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="bg-warm-50 border border-warm-200 rounded-2xl p-6 h-fit">
                <h2 className="text-lg font-semibold text-warm-900 mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm text-warm-700">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-warm-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shipping</span>
                    <span className={items.every((i) => i.isDigital) ? 'text-green-600 font-semibold' : 'text-warm-500'}>
                      {items.every((i) => i.isDigital) ? 'Free' : 'Calculated at checkout'}
                    </span>
                  </div>
                  {discount && (
                    <div className="flex items-center justify-between text-success">
                      <span>Discount</span>
                      <span>- ${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 border-t border-warm-200 pt-4 flex items-center justify-between">
                  <span className="text-base font-semibold text-warm-900">Total</span>
                  <span className="text-xl font-semibold text-warm-900">
                    ${total.toFixed(2)}
                  </span>
                </div>

                {items.every((i) => i.isDigital) ? (
                  <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 rounded-lg px-4 py-3 mt-4">
                    <Download className="w-4 h-4 flex-shrink-0" />
                    <span>
                      Instant Digital Download — available immediately after purchase
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-lg px-4 py-3 mt-4">
                    <Truck className="w-4 h-4 flex-shrink-0" />
                    <span>
                      {items.some((i) => i.isDigital)
                        ? 'Digital items available instantly — physical items ship in 2-5 business days'
                        : 'All items ship from US warehouses — estimated delivery in 2-5 business days'}
                    </span>
                  </div>
                )}

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-warm-900 mb-2">
                    Discount code
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={discountCode}
                      onChange={(event) => setDiscountCode(event.target.value)}
                      placeholder="Enter code"
                      className="w-full px-3 py-2 rounded-lg border border-warm-200 bg-white text-warm-900 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
                    />
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      onClick={handleApplyDiscount}
                      disabled={isApplying}
                      className="w-full sm:w-auto"
                    >
                      {isApplying ? 'Applying...' : 'Apply'}
                    </CustomButton>
                  </div>
                  {discount?.description && (
                    <p className="text-xs text-success mt-2">{discount.description}</p>
                  )}
                  {discountError && (
                    <p className="text-xs text-danger mt-2">{discountError}</p>
                  )}
                </div>

                <CustomButton
                  variant="primary"
                  size="lg"
                  className="w-full mt-6"
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                >
                  {isCheckingOut ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    'Proceed to Checkout'
                  )}
                </CustomButton>

                <div className="mt-6">
                  <TrustBadges variant="compact" />
                </div>
              </aside>
            </div>
          )}

          {recommendations.length > 0 && (
            <section className="mt-16">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-playfair font-semibold text-warm-900">
                  You might also like
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {recommendations.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
