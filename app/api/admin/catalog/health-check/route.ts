import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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
    const { data: zeroStockVariants } = await supabase
      .from('mi_product_variants')
      .select('id, product_id, mi_products!inner(id, name, status)')
      .eq('is_active', true)
      .eq('stock_count', 0)
      .eq('mi_products.status', 'active');

    const affected = (zeroStockVariants || []) as any[];
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name')
      .eq('status', 'active')
      .or('review_count.is.null,review_count.eq.0');

    const items = (data || []).map((p) => ({ id: p.id, name: p.name }));
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name, images')
      .eq('status', 'active');

    const items = (data || [])
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name')
      .eq('status', 'active')
      .is('category_id', null);

    const items = (data || []).map((p) => ({ id: p.id, name: p.name }));
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name, retail_price, cj_price, margin_percent')
      .eq('status', 'active')
      .not('cj_pid', 'is', null);

    const items = (data || [])
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name, cj_raw_data')
      .eq('status', 'active')
      .not('cj_pid', 'is', null);

    const items = (data || [])
      .filter((p) => {
        if (!p.cj_raw_data || typeof p.cj_raw_data !== 'object') return true;
        const weight = Number((p.cj_raw_data as any).productWeight);
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
    const { data } = await supabase
      .from('mi_products')
      .select('id, name, description')
      .eq('status', 'active');

    const items = (data || [])
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
    const { data: activeProducts } = await supabase
      .from('mi_products')
      .select('id, name')
      .eq('status', 'active');

    const items: { id: string; name: string }[] = [];

    if (activeProducts && activeProducts.length > 0) {
      // Get counts of active variants per product
      const { data: variantCounts } = await supabase
        .from('mi_product_variants')
        .select('product_id')
        .eq('is_active', true)
        .in(
          'product_id',
          activeProducts.map((p) => p.id)
        );

      const productsWithVariants = new Set(
        (variantCounts || []).map((v) => v.product_id)
      );

      for (const p of activeProducts) {
        if (!productsWithVariants.has(p.id)) {
          items.push({ id: p.id, name: p.name });
        }
      }
    }

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
    const { data: categories } = await supabase
      .from('mi_categories')
      .select('id, name, product_count');

    const { data: productsByCategory } = await supabase
      .from('mi_products')
      .select('category_id')
      .eq('status', 'active')
      .not('category_id', 'is', null);

    const actualCounts = new Map<string, number>();
    for (const p of productsByCategory || []) {
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

  return NextResponse.json({
    timestamp: new Date().toISOString(),
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
