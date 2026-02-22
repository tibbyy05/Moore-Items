import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function requireAdmin(request: NextRequest) {
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

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { name, slug, description, category_id, images, retail_price, status, ...rest } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
  }

  const retailPrice = parseFloat(String(retail_price));
  if (!retailPrice || retailPrice <= 0) {
    return NextResponse.json({ error: 'Valid retail price is required' }, { status: 400 });
  }

  const productData = {
    name: name.trim(),
    slug: slug || name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').substring(0, 80) + '-' + Date.now().toString(36),
    description: description || null,
    category_id: category_id || null,
    images: images || null,
    cj_price: rest.cj_price ?? 0,
    shipping_cost: rest.shipping_cost ?? 0,
    stripe_fee: rest.stripe_fee ?? Math.round((retailPrice * 0.029 + 0.3) * 100) / 100,
    total_cost: rest.total_cost ?? Math.round((retailPrice * 0.029 + 0.3) * 100) / 100,
    markup_multiplier: rest.markup_multiplier ?? 1,
    retail_price: retailPrice,
    margin_dollars: rest.margin_dollars ?? Math.round((retailPrice - (retailPrice * 0.029 + 0.3)) * 100) / 100,
    margin_percent: rest.margin_percent ?? Math.round(((retailPrice - (retailPrice * 0.029 + 0.3)) / retailPrice) * 1000) / 10,
    stock_count: rest.stock_count ?? 0,
    warehouse: rest.warehouse ?? null,
    status: status || 'pending',
  };

  const { data, error: insertError } = await supabase
    .from('mi_products')
    .insert(productData)
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ product: data });
}
