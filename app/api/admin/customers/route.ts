import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return adminProfile ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('mi_orders')
    .select('email, created_at, total, shipping_address');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  interface CustomerEntry {
    id: string;
    name: string;
    email: string;
    phone: string;
    location: string;
    orderCount: number;
    totalSpent: number;
    status: 'active' | 'inactive';
    joinedAt: string;
    lastOrderAt: string;
  }

  const grouped = new Map<string, CustomerEntry>();

  (data || []).forEach((order) => {
    const email = order.email || 'unknown';
    const address = (order.shipping_address || {}) as {
      name?: string;
      phone?: string;
      city?: string;
      state?: string;
    };
    const name = address.name || email;
    const location = [address.city, address.state].filter(Boolean).join(', ') || '\u2014';
    const total = Number(order.total || 0);

    const existing = grouped.get(email);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpent += total;
      existing.joinedAt =
        new Date(existing.joinedAt) < new Date(order.created_at)
          ? existing.joinedAt
          : order.created_at;
      existing.lastOrderAt =
        new Date(existing.lastOrderAt) > new Date(order.created_at)
          ? existing.lastOrderAt
          : order.created_at;
    } else {
      grouped.set(email, {
        id: email,
        name,
        email,
        phone: address.phone || '\u2014',
        location,
        orderCount: 1,
        totalSpent: total,
        status: 'active',
        joinedAt: order.created_at,
        lastOrderAt: order.created_at,
      });
    }
  });

  const now = new Date();
  const customers = Array.from(grouped.values()).map((customer) => {
    const lastOrder = new Date(customer.lastOrderAt);
    const diffDays = (now.getTime() - lastOrder.getTime()) / (1000 * 60 * 60 * 24);
    return {
      ...customer,
      status: (diffDays <= 30 ? 'active' : 'inactive') as 'active' | 'inactive',
    };
  });

  return NextResponse.json({ customers });
}
