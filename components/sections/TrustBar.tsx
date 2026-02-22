import React from 'react';
import { Truck, Shield, RotateCcw, Headphones } from 'lucide-react';

export function TrustBar() {
  const features = [
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'On orders over $50',
    },
    {
      icon: Shield,
      title: 'Secure Checkout',
      description: 'Safe & encrypted',
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      description: '30-day policy',
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Always here to help',
    },
  ];

  return (
    <div className="bg-white border-b border-warm-200">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex flex-col sm:flex-row items-center sm:items-start gap-3 text-center sm:text-left">
                <div className="w-11 h-11 rounded-xl bg-gold-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-gold-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-warm-900 mb-0.5">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-warm-500">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
