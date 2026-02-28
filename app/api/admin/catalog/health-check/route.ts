import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendHealthCheckAlert } from '@/lib/email/sendgrid';

interface CheckResult {
  name: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  found: number;
  autoFixed: number;
  items: { id: string; name: string }[];
}

async function checkAuth(request: NextRequest): Promise<{ authorized: boolean }> {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const cronSecret = process.env.HEALTH_CHECK_SECRET;
  if (cronSecret && key === cronSecret) {
    return { authorized: true };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { authorized: false };

    const { data: adminProfile } = await supabase
      .from('mi_admin_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return { authorized: !!adminProfile };
  } catch {
    return { authorized: false };
  }
}

// Paginated fetch to avoid Supabase's default 1000-row limit
async function fetchAll<T>(
  supabase: ReturnType<typeof createAdminClient>,
  table: string,
  select: string,
  filters: (query: any) => any
): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let all: T[] = [];
  let offset = 0;

  while (true) {
    let query = supabase.from(table).select(select).range(offset, offset + PAGE_SIZE - 1);
    query = filters(query);
    const { data, error } = await query;
    if (error) throw error;
    const rows = (data || []) as T[];
    all = all.concat(rows);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return all;
}

export async function POST(request: NextRequest) {
  const { authorized } = await checkAuth(request);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const checks: CheckResult[] = [];

  // Get total active products count
  const { count: totalActive } = await supabase
    .from('mi_products')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active');

  const totalActiveProducts = totalActive || 0;

  // ─── CHECK 1: Zero-stock variants (HIGH) ─── AUTO-FIX ───
  {
    const affected = await fetchAll<any>(
      supabase,
      'mi_product_variants',
      'id, product_id, mi_products!inner(id, name, status)',
      (q: any) => q.eq('is_active', true).eq('stock_count', 0).eq('mi_products.status', 'active')
    );
    let autoFixed = 0;

    if (affected.length > 0) {
      const variantIds = affected.map((v) => v.id);
      const { error } = await supabase
        .from('mi_product_variants')
        .update({ stock_count: 100 })
        .in('id', variantIds);

      if (!error) autoFixed = variantIds.length;
    }

    // Dedupe by product
    const productMap = new Map<string, string>();
    for (const v of affected) {
      const p = v.mi_products;
      if (p && !productMap.has(p.id)) productMap.set(p.id, p.name);
    }

    checks.push({
      name: 'Zero-stock variants',
      severity: 'HIGH',
      found: affected.length,
      autoFixed,
      items: Array.from(productMap, ([id, name]) => ({ id, name })),
    });
  }

  // ─── CHECK 2: Missing reviews (MEDIUM) ───
  {
    const data = await fetchAll<any>(supabase, 'mi_products', 'id, name', (q: any) =>
      q.eq('status', 'active').or('review_count.is.null,review_count.eq.0')
    );

    const items = data.map((p: any) => ({ id: p.id, name: p.name }));
    checks.push({
      name: 'Missing reviews',
      severity: 'MEDIUM',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 3: Missing images (HIGH) ───
  {
    const data = await fetchAll<any>(supabase, 'mi_products', 'id, name, images', (q: any) =>
      q.eq('status', 'active')
    );

    const items = data
      .filter((p) => {
        if (!p.images) return true;
        if (Array.isArray(p.images) && p.images.length === 0) return true;
        return false;
      })
      .map((p) => ({ id: p.id, name: p.name }));

    checks.push({
      name: 'Missing images',
      severity: 'HIGH',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 4: Missing category (HIGH) ───
  {
    const data = await fetchAll<any>(supabase, 'mi_products', 'id, name', (q: any) =>
      q.eq('status', 'active').is('category_id', null)
    );

    const items = data.map((p: any) => ({ id: p.id, name: p.name }));
    checks.push({
      name: 'Missing category',
      severity: 'HIGH',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 5: Pricing issues (HIGH) ───
  {
    const data = await fetchAll<any>(
      supabase, 'mi_products', 'id, name, retail_price, cj_price, margin_percent',
      (q: any) => q.eq('status', 'active').not('cj_pid', 'is', null)
    );

    const items = data
      .filter((p) => {
        const retail = Number(p.retail_price || 0);
        const cj = Number(p.cj_price || 0);
        const margin = Number(p.margin_percent || 0);
        if (retail <= 0) return true;
        if (cj > 0 && retail < cj) return true;
        if (cj > 0 && margin < 0.40) return true;
        return false;
      })
      .map((p) => ({ id: p.id, name: p.name }));

    checks.push({
      name: 'Pricing issues',
      severity: 'HIGH',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 6: Missing weight (LOW) ───
  {
    const data = await fetchAll<any>(
      supabase, 'mi_products', 'id, name, cj_raw_data',
      (q: any) => q.eq('status', 'active').not('cj_pid', 'is', null)
    );

    const items = data
      .filter((p) => {
        if (!p.cj_raw_data || typeof p.cj_raw_data !== 'object') return true;
        const raw = String((p.cj_raw_data as any).productWeight ?? '');
        if (!raw) return true;
        // productWeight can be a single value "350" or a range "1.00-912.00"
        const weight = parseFloat(raw);
        return !Number.isFinite(weight) || weight <= 0;
      })
      .map((p) => ({ id: p.id, name: p.name }));

    checks.push({
      name: 'Missing weight',
      severity: 'LOW',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 7: Missing description (MEDIUM) ───
  {
    const data = await fetchAll<any>(supabase, 'mi_products', 'id, name, description', (q: any) =>
      q.eq('status', 'active')
    );

    const items = data
      .filter((p) => !p.description || String(p.description).trim() === '')
      .map((p) => ({ id: p.id, name: p.name }));

    checks.push({
      name: 'Missing description',
      severity: 'MEDIUM',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 8: Orphaned products (HIGH) ───
  {
    const activeProducts = await fetchAll<any>(supabase, 'mi_products', 'id, name', (q: any) =>
      q.eq('status', 'active')
    );

    // Build set of all product_ids that have at least one active variant
    const variantRows = await fetchAll<any>(
      supabase, 'mi_product_variants', 'product_id',
      (q: any) => q.eq('is_active', true)
    );
    const productsWithVariants = new Set(variantRows.map((v: any) => v.product_id));

    const items = activeProducts
      .filter((p: any) => !productsWithVariants.has(p.id))
      .map((p: any) => ({ id: p.id, name: p.name }));

    checks.push({
      name: 'Orphaned products',
      severity: 'HIGH',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 9: Category count drift (LOW) ─── AUTO-FIX ───
  {
    const categories = await fetchAll<any>(supabase, 'mi_categories', 'id, name, product_count', (q: any) => q);

    const productsByCategory = await fetchAll<any>(
      supabase, 'mi_products', 'category_id',
      (q: any) => q.eq('status', 'active').not('category_id', 'is', null)
    );

    const actualCounts = new Map<string, number>();
    for (const p of productsByCategory) {
      actualCounts.set(p.category_id, (actualCounts.get(p.category_id) || 0) + 1);
    }

    const drifted: { id: string; name: string }[] = [];
    let autoFixed = 0;

    for (const cat of categories || []) {
      const actual = actualCounts.get(cat.id) || 0;
      const stored = cat.product_count || 0;
      if (actual !== stored) {
        drifted.push({ id: cat.id, name: cat.name });
        const { error } = await supabase
          .from('mi_categories')
          .update({ product_count: actual })
          .eq('id', cat.id);
        if (!error) autoFixed++;
      }
    }

    checks.push({
      name: 'Category count drift',
      severity: 'LOW',
      found: drifted.length,
      autoFixed,
      items: drifted,
    });
  }

  // ─── CHECK 10: Stale pending (LOW) ───
  {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('mi_products')
      .select('id, name')
      .eq('status', 'pending')
      .lt('created_at', sevenDaysAgo);

    const items = (data || []).map((p) => ({ id: p.id, name: p.name }));
    checks.push({
      name: 'Stale pending',
      severity: 'LOW',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── Summary ───
  const totalIssues = checks.reduce((sum, c) => sum + c.found, 0);
  const totalAutoFixed = checks.reduce((sum, c) => sum + c.autoFixed, 0);
  const needsAttention = totalIssues - totalAutoFixed;
  const healthScore = totalActiveProducts > 0
    ? Math.min(100, Math.max(0, Math.round((1 - needsAttention / totalActiveProducts) * 100)))
    : 100;

  const timestamp = new Date().toISOString();

  // Send alert email if there are unresolved issues (fire-and-forget)
  if (needsAttention > 0) {
    sendHealthCheckAlert({
      healthScore,
      totalIssues,
      totalAutoFixed,
      needsAttention,
      checks,
      timestamp,
    }).catch((err) => console.error('[HealthCheck] Failed to send alert email:', err));
  }

  return NextResponse.json({
    timestamp,
    total_active_products: totalActiveProducts,
    checks,
    summary: {
      total_issues: totalIssues,
      auto_fixed: totalAutoFixed,
      needs_attention: needsAttention,
      health_score: healthScore,
    },
  });
}
