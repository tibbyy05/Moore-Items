import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cjClient } from '@/lib/cj/client';

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: adminProfile } = await supabase
    .from('mi_admin_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!adminProfile) {
    return { supabase, error: NextResponse.json({ error: 'Not an admin' }, { status: 403 }) };
  }

  return { supabase, error: null };
}

// GET — list watchlist items
export async function GET(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'watching';
  const sort = searchParams.get('sort') || 'created_at';
  const order = searchParams.get('order') || 'desc';

  try {
    let query = supabase
      .from('mi_scout_watchlist')
      .select('*');

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Sort options
    if (sort === 'margin') {
      query = query.order('calculated_margin', { ascending: order === 'asc' });
    } else if (sort === 'price') {
      query = query.order('cj_wholesale_price', { ascending: order === 'asc' });
    } else {
      query = query.order('created_at', { ascending: order === 'asc' });
    }

    const { data, error: queryError } = await query;

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    return NextResponse.json({ items: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to fetch watchlist' }, { status: 500 });
  }
}

// POST — add to watchlist
export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const {
      cj_pid,
      cj_product_name,
      cj_thumbnail,
      cj_wholesale_price,
      calculated_retail_price,
      calculated_margin,
      us_stock_at_save,
      variant_count,
      notes,
    } = body;

    if (!cj_pid || !cj_product_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if already on watchlist
    const { data: existing } = await supabase
      .from('mi_scout_watchlist')
      .select('id, status')
      .eq('cj_pid', cj_pid)
      .maybeSingle();

    if (existing) {
      // If dismissed, reactivate
      if (existing.status === 'dismissed') {
        const { data: updated, error: updateError } = await supabase
          .from('mi_scout_watchlist')
          .update({
            status: 'watching',
            cj_product_name,
            cj_thumbnail,
            cj_wholesale_price,
            calculated_retail_price,
            calculated_margin,
            us_stock_at_save,
            variant_count,
            notes: notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }
        return NextResponse.json({ item: updated, reactivated: true });
      }
      return NextResponse.json(
        { error: 'Product already on watchlist', existing_id: existing.id },
        { status: 409 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from('mi_scout_watchlist')
      .insert({
        cj_pid,
        cj_product_name,
        cj_thumbnail,
        cj_wholesale_price,
        calculated_retail_price,
        calculated_margin,
        us_stock_at_save,
        variant_count,
        notes: notes || null,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ item: inserted });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to add to watchlist' }, { status: 500 });
  }
}

// DELETE — remove from watchlist
export async function DELETE(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing watchlist item ID' }, { status: 400 });
    }

    const { error: deleteError } = await supabase
      .from('mi_scout_watchlist')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to remove from watchlist' }, { status: 500 });
  }
}

// PATCH — update watchlist item (notes, status, refresh stock)
export async function PATCH(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const { id, notes, status, refresh_stock } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing watchlist item ID' }, { status: 400 });
    }

    // Refresh stock from CJ API
    if (refresh_stock) {
      const { data: item } = await supabase
        .from('mi_scout_watchlist')
        .select('cj_pid')
        .eq('id', id)
        .single();

      if (item) {
        try {
          const stockResponse = await cjClient.getProductStock(item.cj_pid);
          const raw = (stockResponse as any)?.data || stockResponse;
          const inventories = Array.isArray(raw) ? raw : raw?.inventories || [];
          let usStock = 0;
          for (const inv of inventories) {
            if (inv.countryCode === 'US') {
              usStock += inv.quantity || inv.totalInventoryNum || 0;
            }
          }

          const { data: updated, error: updateError } = await supabase
            .from('mi_scout_watchlist')
            .update({
              us_stock_at_save: usStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 });
          }

          return NextResponse.json({ item: updated, stock_refreshed: true });
        } catch (err: any) {
          return NextResponse.json(
            { error: `Stock refresh failed: ${err?.message}` },
            { status: 500 }
          );
        }
      }
    }

    // Update notes/status
    const updateData: any = { updated_at: new Date().toISOString() };
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data: updated, error: updateError } = await supabase
      .from('mi_scout_watchlist')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update watchlist' }, { status: 500 });
  }
}
