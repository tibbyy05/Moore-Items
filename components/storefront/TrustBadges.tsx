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
  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 text-xs text-warm-600">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-gold-500 flex-shrink-0" />
              <span className="font-medium whitespace-nowrap">{item.compactLabel}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-warm-700">
      {TRUST_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.title} className="bg-warm-50 border border-warm-100 rounded-xl px-4 py-4">
            <Icon className="text-gold-500 w-10 h-10 mb-3" />
            <p className="font-semibold text-warm-900">{item.title}</p>
            <p className="text-sm text-warm-600 mt-1">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
}
