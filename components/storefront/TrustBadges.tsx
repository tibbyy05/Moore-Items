'use client';

import React from 'react';
import { Shield, RefreshCw, Truck, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  {
    icon: Truck,
    title: 'Fast & Reliable Shipping',
    description: 'Tracked deliveries on every order.',
    compactLabel: 'Free Shipping on $50+',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Encrypted checkout you can trust.',
    compactLabel: 'Secure Checkout',
  },
  {
    icon: RefreshCw,
    title: 'Hassle-Free Returns',
    description: 'Easy returns if it’s not perfect.',
    compactLabel: 'Easy Returns',
  },
  {
    icon: CreditCard,
    title: 'Safe Payment',
    description: 'Major cards accepted.',
    compactLabel: 'Safe Payment',
  },
];

interface TrustBadgesProps {
  variant?: 'compact' | 'detailed';
}

export function TrustBadges({ variant = 'compact' }: TrustBadgesProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 text-warm-700", variant === 'detailed' ? 'sm:grid-cols-4 gap-4 text-sm' : 'sm:grid-cols-4 gap-3 text-xs')}>
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className={cn("bg-warm-50 border border-warm-100 rounded-xl flex items-start gap-2", variant === 'detailed' ? 'px-4 py-4 flex-col' : 'px-3 py-3')}>
            <Icon
              className={cn(
                'text-gold-500 flex-shrink-0',
                variant === 'detailed' ? 'w-10 h-10 mb-1' : 'w-4 h-4 mt-0.5'
              )}
            />
            <p className={cn("font-semibold text-warm-900", variant === 'compact' && 'leading-tight')}>
              {variant === 'compact' ? item.compactLabel : item.title}
            </p>
            {variant === 'detailed' && (
              <p className="text-sm text-warm-600 mt-1">{item.description}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
