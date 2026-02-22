'use client';

import React, { useState } from 'react';
import { Gift } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { toast } from 'sonner';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    setTimeout(() => {
      toast.success('Welcome to MooreItems!', {
        description: 'Check your email for your 15% discount code.',
      });
      setEmail('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <section className="relative bg-navy-900 py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gold-500 rounded-full opacity-[0.06] blur-3xl" />
        <div
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent"
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
          <Gift className="w-8 h-8 text-gold-500" />
        </div>

        <h2 className="text-3xl sm:text-4xl font-playfair font-semibold text-white mb-4">
          Get 15% Off Your First Order
        </h2>

        <p className="text-base sm:text-lg text-navy-200 mb-8 max-w-xl mx-auto">
          Subscribe to our newsletter and be the first to know about new arrivals, exclusive deals, and insider tips.
        </p>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3 p-2 bg-navy-800 rounded-xl border border-navy-600">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="flex-1 px-4 py-3 bg-transparent text-white placeholder:text-navy-400 focus:outline-none"
            />
            <CustomButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="whitespace-nowrap"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </CustomButton>
          </div>
          <p className="text-xs text-navy-400 mt-3">
            No spam, ever. Unsubscribe anytime.
          </p>
        </form>
      </div>
    </section>
  );
}
