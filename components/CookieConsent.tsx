'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'mi_cookie_consent';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    window.dispatchEvent(new Event('mi:cookie-consent-accepted'));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-[#0f1629] text-[#f7f6f3] font-sans">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        <p className="text-sm leading-snug text-center sm:text-left">
          We use cookies to personalize your experience and improve our services.
          By continuing to use MooreItems, you agree to our use of cookies.{' '}
          <Link href="/privacy-policy" className="text-[#c8a45e] underline hover:opacity-80">
            Privacy Policy
          </Link>
        </p>
        <div className="flex gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={decline}
            className="flex-1 sm:flex-initial px-5 py-2 text-sm rounded border border-[#f7f6f3] text-[#f7f6f3] bg-transparent hover:bg-white/10 transition-colors cursor-pointer"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 sm:flex-initial px-5 py-2 text-sm rounded bg-[#c8a45e] text-[#0f1629] font-semibold hover:bg-[#b8944e] transition-colors cursor-pointer"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
