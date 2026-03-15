import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

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

function formatDateLabel(yyyymmdd: string): string {
  const y = yyyymmdd.slice(0, 4);
  const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const d = parseInt(yyyymmdd.slice(6, 8), 10);
  const date = new Date(Number(y), m, d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTodayYYYYMMDD(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

const EMPTY_RESULT = {
  activeNow: 0,
  todayCount: 0,
  weekCount: 0,
  monthCount: 0,
  dailyData: [] as Array<{ date: string; visitors: number }>,
};

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
    const headers = {
      Authorization: `Bearer ${token.token}`,
      'Content-Type': 'application/json',
    };
    const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}`;

    // Run both calls in parallel
    const [realtimeRes, historicalRes] = await Promise.all([
      fetch(`${baseUrl}:runRealtimeReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ metrics: [{ name: 'activeUsers' }] }),
      }),
      fetch(`${baseUrl}:runReport`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dateRanges: [
            { startDate: 'today', endDate: 'today' },
            { startDate: '7daysAgo', endDate: 'today' },
            { startDate: '30daysAgo', endDate: 'today' },
          ],
          metrics: [{ name: 'activeUsers' }],
          dimensions: [{ name: 'date' }],
        }),
      }),
    ]);

    // Parse realtime
    let activeNow = 0;
    if (realtimeRes.ok) {
      const realtimeText = await realtimeRes.text();
      const realtimeData = JSON.parse(realtimeText);
      activeNow = Number(realtimeData.rows?.[0]?.metricValues?.[0]?.value ?? 0);
    } else {
      console.error('[visitors] Realtime API error:', realtimeRes.status);
    }

    // Parse historical
    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    const dailyMap = new Map<string, number>();

    if (historicalRes.ok) {
      const historicalText = await historicalRes.text();
      const historicalData = JSON.parse(historicalText);
      const rows = historicalData.rows || [];
      const todayStr = getTodayYYYYMMDD();

      // Each row has dimensionValues[0].value = date (YYYYMMDD),
      // and metricValues array with one entry per dateRange
      for (const row of rows) {
        const date = row.dimensionValues?.[0]?.value;
        if (!date) continue;

        const todayVal = Number(row.metricValues?.[0]?.value ?? 0);
        const weekVal = Number(row.metricValues?.[1]?.value ?? 0);
        const monthVal = Number(row.metricValues?.[2]?.value ?? 0);

        if (date === todayStr) todayCount += todayVal;
        weekCount += weekVal;
        monthCount += monthVal;

        // Accumulate daily data for chart (use the week range value)
        dailyMap.set(date, (dailyMap.get(date) || 0) + weekVal);
      }
    } else {
      console.error('[visitors] Historical API error:', historicalRes.status);
    }

    // Build sorted daily array for last 7 days
    const dailyData = Array.from(dailyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, visitors]) => ({
        date: formatDateLabel(date),
        visitors,
      }));

    return NextResponse.json({ activeNow, todayCount, weekCount, monthCount, dailyData });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[visitors] Error:', message);
    return NextResponse.json({ ...EMPTY_RESULT, debug: message });
  }
}
