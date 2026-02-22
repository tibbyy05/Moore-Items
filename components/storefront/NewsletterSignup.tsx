'use client';

import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { useToast } from '@/components/storefront/ToastProvider';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { pushToast } = useToast();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      pushToast('Welcome to MooreItems!', {
        description: 'Your 15% off code is on the way.',
        type: 'success',
      });
      setEmail('');
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <section className="bg-warm-50 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
          <Gift className="w-8 h-8 text-gold-500" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-4">
          Get 15% Off Your First Order
        </h2>
        <p className="text-base sm:text-lg text-warm-600 mb-8 max-w-2xl mx-auto">
          Join our newsletter for early access to new arrivals, exclusive deals, and curated finds.
        </p>
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-white rounded-xl border border-warm-200">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 bg-transparent text-warm-900 placeholder:text-warm-400 focus:outline-none"
            />
            <CustomButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="whitespace-nowrap"
            >
              {isSubmitting ? 'Subscribing...' : 'Get My 15%'}
            </CustomButton>
          </div>
          <p className="text-xs text-warm-500 mt-3">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
