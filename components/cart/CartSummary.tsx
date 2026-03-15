import React from 'react';
import Link from 'next/link';
import { Shield, RotateCcw, Truck, Globe, Download } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import type { CartItem } from '@/lib/types';

interface CartSummaryProps {
  subtotal: number;
  discount?: number;
  shipping?: number | 'calculated';
  showCheckoutButton?: boolean;
  showContinueShopping?: boolean;
  items?: CartItem[];
}

export function CartSummary({
  subtotal,
  discount = 0,
  shipping = 'calculated',
  showCheckoutButton = true,
  showContinueShopping = false,
  items = [],
}: CartSummaryProps) {
  const shippingCost = shipping === 'calculated' ? 0 : shipping;
  const total = subtotal - discount + shippingCost;

  return (
    <div className="bg-warm-50 border border-warm-200 rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-playfair font-semibold text-warm-900">
        Order Summary
      </h3>

      <div className="space-y-3 py-4 border-y border-warm-200">
        <div className="flex justify-between text-warm-700">
          <span>Subtotal</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="font-semibold">-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-warm-700">
          <span>Shipping</span>
          <span className="font-semibold">
            {shipping === 'calculated'
              ? 'Calculated at checkout'
              : shipping === 0
              ? 'FREE'
              : `$${shipping.toFixed(2)}`}
          </span>
        </div>
      </div>

      {items.length > 0 && (() => {
        const hasDigital = items.some((i) => i.warehouse_status === 'DIGITAL' || i.isDigital);
        const hasUSItems = items.some((i) => i.warehouse_status === 'US' && !i.isDigital);
        const hasCNItems = items.some((i) => i.warehouse_status !== 'US' && i.warehouse_status !== 'DIGITAL' && !i.isDigital);

        if (!hasUSItems && !hasCNItems && hasDigital) {
          return (
            <div className="flex items-center gap-2 text-sm text-violet-700 bg-violet-50 rounded-lg px-4 py-3">
              <Download className="w-4 h-4 flex-shrink-0" />
              <span>Instant delivery</span>
            </div>
          );
        }

        if (!hasUSItems && !hasCNItems) return null;

        const shippingMessage = hasUSItems && hasCNItems
          ? 'US items: 2\u20135 days \u00b7 International items: 7\u201320 days'
          : hasCNItems
            ? 'Delivered in 7\u201320 business days'
            : 'Delivered in 2\u20135 business days';

        const isCNOnly = hasCNItems && !hasUSItems;
        return (
          <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-3 ${isCNOnly ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'}`}>
            {isCNOnly ? <Globe className="w-4 h-4 flex-shrink-0" /> : <Truck className="w-4 h-4 flex-shrink-0" />}
            <span>{hasDigital ? `Digital items available instantly \u2014 ${shippingMessage.charAt(0).toLowerCase() + shippingMessage.slice(1)}` : shippingMessage}</span>
          </div>
        );
      })()}

      <div className="flex justify-between text-lg">
        <span className="font-semibold text-warm-900">Total</span>
        <span className="font-bold text-warm-900">${total.toFixed(2)}</span>
      </div>

      {showCheckoutButton && (
        <CustomButton
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => alert('Checkout functionality coming soon!')}
        >
          Proceed to Checkout
        </CustomButton>
      )}

      {showContinueShopping && (
        <Link
          href="/"
          className="block text-center text-sm font-medium text-warm-600 hover:text-warm-900 transition-colors"
        >
          Continue Shopping
        </Link>
      )}

      <div className="pt-4 border-t border-warm-200 space-y-2">
        <div className="flex items-center gap-2 text-sm text-warm-600">
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>Secure checkout</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-warm-600">
          <RotateCcw className="w-4 h-4 flex-shrink-0" />
          <span>30-day free returns</span>
        </div>
      </div>
    </div>
  );
}
