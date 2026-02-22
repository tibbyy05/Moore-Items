'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface AuthContextValue {
  user: any | null;
  customerId: string | null;
  customer: any | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [customer, setCustomer] = useState<any | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        setUser(null);
        setCustomer(null);
        setCustomerId(null);
        setLoading(false);
        return;
      }

      setUser(authUser);
      const { data: cust } = await supabase
        .from('mi_customers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .single();
      setCustomer(cust || null);
      setCustomerId(cust?.id || null);
      setLoading(false);
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      const nextUser = session?.user || null;
      setUser(nextUser);
      if (!nextUser) {
        setCustomer(null);
        setCustomerId(null);
        setLoading(false);
        return;
      }
      supabase
        .from('mi_customers')
        .select('*')
        .eq('auth_user_id', nextUser.id)
        .single()
        .then(({ data }) => {
          setCustomer(data || null);
          setCustomerId(data?.id || null);
          setLoading(false);
        });
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = useMemo(
    () => ({ user, customer, customerId, loading }),
    [user, customer, customerId, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
