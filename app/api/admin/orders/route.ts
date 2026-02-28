import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerSupabaseClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: adminProfile } = await authClient
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!adminProfile) {
      return NextResponse.json({ error: 'Not an admin' }, { status: 403 });
    }

    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const status = searchParams.get('status');
    const fulfillment = searchParams.get('fulfillment');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('mi_orders')
      .select(
        `
        *,
        mi_order_items (
          id,
          name,
          image_url,
          quantity,
          unit_price,
          total,
          variant_id
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('payment_status', status);
    }
    if (fulfillment && fulfillment !== 'all') {
      query = query.eq('fulfillment_status', fulfillment);
    }
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: orders, error, count } = await query;

    if (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: allOrders } = await supabase
      .from('mi_orders')
      .select('payment_status, fulfillment_status, email');

    const summarySource = (allOrders || []) as Array<{
      payment_status?: string | null;
      fulfillment_status?: string | null;
      email?: string | null;
    }>;

    const summary = {
      total: summarySource.length,
      paid: summarySource.filter((order) => order.payment_status === 'paid').length,
      pending: summarySource.filter((order) => order.payment_status === 'pending').length,
      unfulfilled: summarySource.filter((order) => order.fulfillment_status === 'unfulfilled').length,
      processing: summarySource.filter((order) => order.fulfillment_status === 'processing').length,
      shipped: summarySource.filter((order) => order.fulfillment_status === 'shipped').length,
      delivered: summarySource.filter((order) => order.fulfillment_status === 'delivered').length,
      customers: new Set(summarySource.map((order) => order.email).filter(Boolean)).size,
    };

    return NextResponse.json({
      orders: orders || [],
      total: count || 0,
      page,
      limit,
      summary,
    });
  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}