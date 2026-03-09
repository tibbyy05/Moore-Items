import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
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
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const propertyId = process.env.GA4_PROPERTY_ID;
    const serviceAccountKey = JSON.parse(process.env.GA4_SERVICE_ACCOUNT_KEY || '{}');

    const auth = new GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const res = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics: [{ name: 'activeUsers' }],
        }),
      }
    );

    const data = await res.json();
    const activeUsers = Number(data.rows?.[0]?.metricValues?.[0]?.value ?? 0);

    return NextResponse.json({ activeUsers });
  } catch {
    return NextResponse.json({ activeUsers: 0 });
  }
}
