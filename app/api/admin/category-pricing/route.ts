import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

export async function GET() {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { data, error: fetchError } = await supabase
    .from('mi_category_pricing')
    .select('*')
    .order('category_name');

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: NextRequest) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Expected an array of category pricing rules' }, { status: 400 });
  }

  let updated = 0;

  for (const row of body) {
    const { error: upsertError } = await supabase
      .from('mi_category_pricing')
      .upsert(
        {
          category_slug: row.category_slug,
          category_name: row.category_name,
          min_price: row.min_price,
          target_margin: row.target_margin,
          markup_override: row.markup_override,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'category_slug' }
      );

    if (!upsertError) updated += 1;
  }

  return NextResponse.json({ success: true, updated });
}
