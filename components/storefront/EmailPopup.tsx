'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'mi_popup_dismissed';
const DISCOUNT_CODE = 'WELCOME10';

export function EmailPopup() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'already'>('idle');
  const [copied, setCopied] = useState(false);

  const isBlockedRoute = useMemo(() => {
    if (!pathname) return false;
    return (
      pathname.startsWith('/admin') ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/signup') ||
      pathname.startsWith('/checkout')
    );
  }, [pathname]);

  useEffect(() => {
    if (isBlockedRoute) return;
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1';
    if (dismissed) return;
    const timer = window.setTimeout(() => {
      setIsOpen(true);
      setIsVisible(true);
    }, 10000);
    return () => window.clearTimeout(timer);
  }, [isBlockedRoute]);

  useEffect(() => {
    if (isBlockedRoute) {
      setIsOpen(false);
      setIsVisible(false);
    }
  }, [isBlockedRoute]);

  const dismiss = () => {
    setIsVisible(false);
    window.setTimeout(() => setIsOpen(false), 200);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) {
      setError('Please enter a valid email.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to subscribe');
      }

      if (data?.status === 'already_subscribed') {
        setStatus('already');
      } else {
        setStatus('success');
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(DISMISS_KEY, '1');
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DISCOUNT_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (!isOpen || isBlockedRoute) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center px-4 transition-opacity duration-300',
        isVisible ? 'opacity-100' : 'opacity-0'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-popup-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-xl rounded-3xl bg-[#0f1629] text-white shadow-2xl border border-white/10 overflow-hidden">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-gold-400">
            MooreItems Exclusive
          </p>
          <h2
            id="email-popup-title"
            className="mt-3 text-3xl sm:text-4xl font-playfair font-semibold text-white"
          >
            Get 10% Off Your First Order
          </h2>
          <p className="mt-4 text-base sm:text-lg text-white/80">
            Join the MooreItems family and get exclusive deals delivered to your inbox.
          </p>

          {status === 'success' || status === 'already' ? (
            <div className="mt-6 rounded-2xl bg-white/10 p-5">
              <p className="text-white/80 text-sm">
                {status === 'already'
                  ? 'Welcome back! Your code is ready.'
                  : 'You are in! Use this code at checkout:'}
              </p>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 rounded-xl border border-gold-500/40 bg-white/5 px-4 py-3 text-lg font-semibold tracking-widest text-gold-300">
                  {DISCOUNT_CODE}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-5 py-3 text-sm font-semibold text-white hover:bg-gold-400 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Code'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-full bg-white/10 border border-white/20 px-5 py-4 text-base text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-gold-500"
                required
              />
              {error && <p className="text-sm text-red-300">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-gold-500 px-6 py-4 text-sm font-semibold tracking-wide text-white hover:bg-gold-400 transition-colors disabled:opacity-60"
              >
                {loading ? 'Submitting...' : 'GET MY 10% OFF'}
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={dismiss}
            className="mt-6 text-sm text-white/60 hover:text-white underline"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  );
}
