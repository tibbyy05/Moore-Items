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

  // ─── CHECK 1: Zero-stock products (HIGH) ─── AUTO-FIX ───
  // A product is zero-stock ONLY if status='active', it has active variants,
  // and NO variant has stock_count > 0. Products already out_of_stock/hidden
  // are excluded — they're already handled.
  {
    const activeProducts = await fetchAll<any>(
      supabase, 'mi_products', 'id, name',
      (q: any) => q.eq('status', 'active')
    );

    // Products that have at least one active variant with stock > 0
    const variantsWithStock = await fetchAll<any>(
      supabase, 'mi_product_variants', 'product_id',
      (q: any) => q.eq('is_active', true).gt('stock_count', 0)
    );
    const productsWithStock = new Set(variantsWithStock.map((v: any) => v.product_id));

    // Products that have any active variant at all (those without are caught by CHECK 8)
    const allActiveVariants = await fetchAll<any>(
      supabase, 'mi_product_variants', 'product_id',
      (q: any) => q.eq('is_active', true)
    );
    const productsWithVariants = new Set(allActiveVariants.map((v: any) => v.product_id));

    // Zero-stock = has active variants but none with stock > 0
    const zeroStockProducts = activeProducts.filter(
      (p: any) => productsWithVariants.has(p.id) && !productsWithStock.has(p.id)
    );

    let autoFixed = 0;

    // Auto-fix: mark these products as out_of_stock so they don't accumulate
    if (zeroStockProducts.length > 0) {
      const productIds = zeroStockProducts.map((p: any) => p.id);
      const { error } = await supabase
        .from('mi_products')
        .update({ status: 'out_of_stock' })
        .in('id', productIds);

      if (!error) autoFixed = productIds.length;
    }

    checks.push({
      name: 'Zero-stock products',
      severity: 'HIGH',
      found: zeroStockProducts.length,
      autoFixed,
      items: zeroStockProducts.map((p: any) => ({ id: p.id, name: p.name })),
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

  // ─── CHECK 11: Price Drift (MEDIUM) ───
  {
    const data = await fetchAll<any>(supabase, 'mi_products', 'id, name, price_drift_details', (q: any) =>
      q.eq('price_drift_flagged', true)
    );

    const items = data.map((p: any) => {
      const details = p.price_drift_details;
      const variant = details?.variants?.[0];
      let suffix = '';
      if (variant) {
        suffix = ` — $${variant.storedPrice.toFixed(2)} → $${variant.currentPrice.toFixed(2)} (${variant.driftPct > 0 ? '+' : ''}${variant.driftPct}%)`;
      } else if (details?.maxDriftPct !== undefined) {
        suffix = ` — ${details.maxDriftPct > 0 ? '+' : ''}${details.maxDriftPct}% drift`;
      }
      return { id: p.id, name: p.name + suffix };
    });

    checks.push({
      name: 'Price Drift',
      severity: 'MEDIUM',
      found: items.length,
      autoFixed: 0,
      items,
    });
  }

  // ─── CHECK 12: Placeholder price products (HIGH) ───
  {
    const data = await fetchAll<any>(
      supabase, 'mi_products', 'id, name, cj_price',
      (q: any) => q.eq('status', 'active').gte('cj_price', 999)
    );

    const items = data.map((p: any) => ({
      id: p.id,
      name: `${p.name} — CJ $${Number(p.cj_price).toFixed(2)}`,
    }));

    checks.push({
      name: 'Placeholder price products',
      severity: 'HIGH',
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
