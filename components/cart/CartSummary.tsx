import React from 'react';
import Link from 'next/link';
import { Shield, RotateCcw } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';

interface CartSummaryProps {
  subtotal: number;
  discount?: number;
  shipping?: number | 'calculated';
  showCheckoutButton?: boolean;
  showContinueShopping?: boolean;
}

export function CartSummary({
  subtotal,
  discount = 0,
  shipping = 'calculated',
  showCheckoutButton = true,
  showContinueShopping = false,
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
