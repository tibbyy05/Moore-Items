'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CustomButton } from '@/components/ui/custom-button';

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(signInError?.message || 'Unable to sign in');
      setLoading(false);
      return;
    }

    const { data: adminProfile } = await supabase
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (!adminProfile) {
      await supabase.auth.signOut();
      router.replace('/?error=not-admin');
      return;
    }

    router.replace('/admin');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <h1 className="text-2xl font-playfair font-semibold text-[#1a1a2e] mb-2">Admin Login</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in to manage MooreItems.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white text-[#1a1a2e] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              placeholder="you@mooreitems.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white text-[#1a1a2e] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gold-500/40"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <CustomButton
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
            type="submit"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </CustomButton>
        </form>
      </div>
    </div>
  );
}
