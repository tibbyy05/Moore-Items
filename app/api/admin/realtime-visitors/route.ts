import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
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
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createAdminClient();
    const propertyId = process.env.GA4_PROPERTY_ID;

    const { data: setting } = await supabaseAdmin
      .from('mi_settings')
      .select('value')
      .eq('key', 'ga4_service_account_key')
      .single();
    const credentials = typeof setting!.value === 'string'
      ? JSON.parse(setting!.value)
      : setting!.value;

    const auth = new GoogleAuth({
      credentials,
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

    console.log('[GA4] status:', res.status);
    const responseText = await res.text();
    console.log('[GA4] body:', responseText.substring(0, 500));

    if (!res.ok) {
      console.error(`[realtime-visitors] GA4 API error ${res.status}:`, responseText);
      return NextResponse.json({ activeUsers: 0, debug: `GA4 API ${res.status}: ${responseText}` });
    }

    const data = JSON.parse(responseText);
    const activeUsers = Number(data.rows?.[0]?.metricValues?.[0]?.value ?? 0);

    return NextResponse.json({ activeUsers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[realtime-visitors] Error:', message);
    return NextResponse.json({ activeUsers: 0, debug: message });
  }
}
