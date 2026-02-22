'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface GoogleButtonProps {
  label: string;
}

export function GoogleButton({ label }: GoogleButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 rounded-xl border border-warm-200 bg-white text-warm-800 py-3 font-semibold hover:border-gold-500 hover:text-warm-900 transition-colors"
    >
      <span className="sr-only">Google</span>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.33 1.53 8.23 2.81l5.98-5.98C34.54 3.4 29.74 1.5 24 1.5 14.69 1.5 6.69 6.91 2.76 14.77l6.98 5.42C11.46 13.88 17.27 9.5 24 9.5z"
        />
        <path
          fill="#34A853"
          d="M46.5 24.5c0-1.57-.14-3.08-.41-4.54H24v9.08h12.66c-.55 2.98-2.22 5.5-4.73 7.2l7.27 5.64c4.24-3.91 6.3-9.67 6.3-16.38z"
        />
        <path
          fill="#4A90E2"
          d="M9.74 28.19A14.41 14.41 0 0 1 9 24c0-1.46.25-2.87.74-4.19l-6.98-5.42A22.42 22.42 0 0 0 1.5 24c0 3.65.88 7.09 2.26 10.11l6.98-5.92z"
        />
        <path
          fill="#FBBC05"
          d="M24 46.5c5.74 0 10.54-1.9 14.05-5.18l-7.27-5.64c-2.01 1.35-4.58 2.15-6.78 2.15-6.73 0-12.54-4.38-14.26-10.69l-6.98 5.92C6.69 41.09 14.69 46.5 24 46.5z"
        />
      </svg>
      <span>{loading ? 'Connecting...' : label}</span>
    </button>
  );
}
