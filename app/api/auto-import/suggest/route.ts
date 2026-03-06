import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cjClient } from '@/lib/cj/client';
import { calculatePricing } from '@/lib/pricing';
import { parsePriceValue, detectUSWarehouse } from '@/lib/cj/sync';
import { sendAutoImportDigest } from '@/lib/email/sendgrid';
import Anthropic from '@anthropic-ai/sdk';

async function checkAuth(request: NextRequest): Promise<{ authorized: boolean }> {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  const cronSecret = process.env.AUTO_IMPORT_SECRET;
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

interface ScoredCandidate {
  cj_pid: string;
  name: string;
  image: string | null;
  category: string | null;
  cjPrice: number;
  shippingCost: number;
  retailPrice: number;
  marginPercent: number;
  warehouse: string;
  usStock: number;
  variantCount: number;
  score: number;
  reasoning: string;
  seasonOk: boolean;
  brandFit: boolean;
  qualityOk: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { authorized } = await checkAuth(request);
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const batchId = `auto-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36)}`;

    // 1. Fetch 30 US warehouse products from CJ
    const randomPage = Math.floor(Math.random() * 5) + 1;
    console.log(`[auto-import] Fetching CJ products page ${randomPage}...`);

    const cjResponse = await cjClient.getProductsV2({
      page: randomPage,
      size: 30,
      countryCode: 'US',
      orderBy: 1,
      sort: 'desc',
    });

    const cjProducts = cjResponse?.list || [];
    if (cjProducts.length === 0) {
      return NextResponse.json({ error: 'No products returned from CJ' }, { status: 502 });
    }

    // 2. Deduplicate against existing products and pending suggestions
    const pids = cjProducts.map((p: any) => p.pid).filter(Boolean);

    const { data: existingProducts } = await supabase
      .from('mi_products')
      .select('cj_pid')
      .in('cj_pid', pids);

    const { data: existingSuggestions } = await supabase
      .from('mi_auto_import_suggestions')
      .select('cj_pid')
      .in('cj_pid', pids)
      .eq('status', 'pending');

    const existingPids = new Set([
      ...(existingProducts || []).map((p: any) => p.cj_pid),
      ...(existingSuggestions || []).map((s: any) => s.cj_pid),
    ]);

    const newProducts = cjProducts.filter((p: any) => p.pid && !existingPids.has(p.pid));
    console.log(`[auto-import] ${cjProducts.length} fetched, ${newProducts.length} after dedup`);

    if (newProducts.length === 0) {
      return NextResponse.json({ message: 'No new products after deduplication', suggested: 0 });
    }

    // 3. Compute quick pricing and filter non-viable
    const viableCandidates: Array<{
      product: any;
      cjPrice: number;
      shippingCost: number;
      retailPrice: number;
      marginPercent: number;
      isUS: boolean;
    }> = [];

    for (const product of newProducts) {
      const cjPrice = parsePriceValue(product.sellPrice ?? product.productSellPrice);
      if (cjPrice === null || cjPrice <= 0) continue;

      const isUS = detectUSWarehouse(product);
      const shippingCost = Math.max(cjPrice * 0.3, 3);
      const pricing = calculatePricing(cjPrice, shippingCost);

      if (pricing.marginPercent < 15) continue;

      viableCandidates.push({
        product,
        cjPrice,
        shippingCost,
        retailPrice: pricing.retailPrice,
        marginPercent: pricing.marginPercent,
        isUS,
      });
    }

    console.log(`[auto-import] ${viableCandidates.length} viable candidates (>=15% margin)`);

    if (viableCandidates.length === 0) {
      return NextResponse.json({ message: 'No viable products found', suggested: 0 });
    }

    // 4. AI scoring with Claude Haiku
    const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });
    const candidateList = viableCandidates
      .map(
        (c, i) =>
          `${i + 1}. "${c.product.productNameEn || c.product.productName}" — CJ $${c.cjPrice.toFixed(2)}, Retail $${c.retailPrice.toFixed(2)}, Margin ${c.marginPercent.toFixed(1)}%, ${c.product.variants?.length || 0} variants, Category: ${c.product.categoryName || 'Unknown'}`
      )
      .join('\n');

    let scoredCandidates: ScoredCandidate[] = [];

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        const anthropic = new Anthropic({ apiKey });
        const response = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4096,
          system:
            'You are a product selection AI for MooreItems.com, an e-commerce store positioned as "Nordstrom meets Target" — quality products at accessible prices. Score products 0-100. Output ONLY valid JSON — no markdown fences, no explanation.',
          messages: [
            {
              role: 'user',
              content: `Score each product 0-100 for MooreItems.com. Consider:
- Season fit: Is this product appropriate for ${currentMonth}?
- Brand fit: Does it match "Nordstrom meets Target" positioning? (quality, aspirational but accessible)
- Margin quality: Higher margins are better
- Product quality signals: Clear name, good category, multiple variants = better

Current month: ${currentMonth}

Products:
${candidateList}

Output a JSON array with one object per product:
[{"index":1,"score":75,"reasoning":"Good margin, fits brand...","season_ok":true,"brand_fit":true,"quality_ok":true}]

Score ALL products. Be selective — only give 70+ to genuinely good fits.`,
            },
          ],
        });

        const rawText = response.content
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('')
          .trim();

        const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        const scores = JSON.parse(jsonText);

        if (Array.isArray(scores)) {
          for (const s of scores) {
            const idx = (s.index || 0) - 1;
            if (idx < 0 || idx >= viableCandidates.length) continue;
            const c = viableCandidates[idx];
            scoredCandidates.push({
              cj_pid: c.product.pid,
              name: c.product.productNameEn || c.product.productName || 'Unknown',
              image: c.product.productImage || null,
              category: c.product.categoryName || null,
              cjPrice: c.cjPrice,
              shippingCost: c.shippingCost,
              retailPrice: c.retailPrice,
              marginPercent: c.marginPercent,
              warehouse: c.isUS ? 'US' : 'CN',
              usStock: 0,
              variantCount: c.product.variants?.length || 0,
              score: Math.min(100, Math.max(0, s.score || 0)),
              reasoning: String(s.reasoning || '').slice(0, 500),
              seasonOk: s.season_ok !== false,
              brandFit: s.brand_fit !== false,
              qualityOk: s.quality_ok !== false,
            });
          }
        }
      } catch (err) {
        console.error('[auto-import] AI scoring failed:', err);
      }
    }

    // Fallback: if AI scoring failed, use margin-based scoring
    if (scoredCandidates.length === 0) {
      scoredCandidates = viableCandidates.map((c) => ({
        cj_pid: c.product.pid,
        name: c.product.productNameEn || c.product.productName || 'Unknown',
        image: c.product.productImage || null,
        category: c.product.categoryName || null,
        cjPrice: c.cjPrice,
        shippingCost: c.shippingCost,
        retailPrice: c.retailPrice,
        marginPercent: c.marginPercent,
        warehouse: c.isUS ? 'US' : 'CN',
        usStock: 0,
        variantCount: c.product.variants?.length || 0,
        score: Math.round(Math.min(100, c.marginPercent * 2)),
        reasoning: 'Scored by margin (AI unavailable)',
        seasonOk: true,
        brandFit: true,
        qualityOk: true,
      }));
    }

    // 5. Take top 10 by score
    scoredCandidates.sort((a, b) => b.score - a.score);
    const top10 = scoredCandidates.slice(0, 10);

    // 6. Insert into database
    const rows = top10.map((c) => ({
      batch_id: batchId,
      cj_pid: c.cj_pid,
      product_name: c.name,
      product_image: c.image,
      cj_category: c.category,
      cj_price: c.cjPrice,
      shipping_cost: c.shippingCost,
      retail_price: c.retailPrice,
      margin_percent: c.marginPercent,
      warehouse: c.warehouse,
      us_stock: c.usStock,
      variant_count: c.variantCount,
      ai_score: c.score,
      ai_reasoning: c.reasoning,
      ai_season_ok: c.seasonOk,
      ai_brand_fit: c.brandFit,
      ai_quality_ok: c.qualityOk,
      status: 'pending',
    }));

    const { error: insertError } = await supabase
      .from('mi_auto_import_suggestions')
      .insert(rows);

    if (insertError) {
      console.error('[auto-import] Insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 7. Send digest email
    const batchDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    await sendAutoImportDigest({
      batchDate,
      suggestionCount: top10.length,
      suggestions: top10.map((c) => ({
        productName: c.name,
        productImage: c.image,
        cjPrice: c.cjPrice,
        retailPrice: c.retailPrice,
        marginPercent: c.marginPercent,
        aiScore: c.score,
        aiReasoning: c.reasoning,
      })),
    }).catch((err) => {
      console.error('[auto-import] Email send error:', err);
    });

    console.log(`[auto-import] Batch ${batchId}: ${top10.length} suggestions saved`);

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      suggested: top10.length,
      fetched: cjProducts.length,
      after_dedup: newProducts.length,
      viable: viableCandidates.length,
      top_scores: top10.map((c) => ({ name: c.name, score: c.score })),
    });
  } catch (err: any) {
    console.error('[auto-import] Suggest error:', err);
    return NextResponse.json(
      { error: err?.message || 'Suggest failed' },
      { status: 500 }
    );
  }
}
