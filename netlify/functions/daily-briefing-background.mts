// ─── Cron Schedule (cron-job.org) ──────────────────────────────────
// Daily at 7 AM EST:  POST /.netlify/functions/daily-briefing-background
// Header: x-briefing-secret: BRIEFING_SECRET
// Gathers sales, catalog health, fulfillment alerts, sends AI
// briefing email to Danny via Claude + SendGrid.
// ───────────────────────────────────────────────────────────────────

import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '../../lib/supabase/admin';
import { sendDailyBriefing } from '../../lib/email/sendgrid';

export default async (req: Request) => {
  try {
    // ─── Auth ───
    const secret = req.headers.get('x-briefing-secret');
    const expected = process.env.BRIEFING_SECRET;
    if (!expected || secret !== expected) {
      console.error('[daily-briefing-bg] Unauthorized — invalid or missing secret');
      return;
    }

    console.log('[daily-briefing-bg] Starting daily briefing...');

    const supabase = createAdminClient();

    // ─── Compute date ranges (EST) ───
    const now = new Date();
    const estOffset = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const yesterdayStart = new Date(estOffset);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(estOffset);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const yesterdayStartISO = yesterdayStart.toISOString();
    const yesterdayEndISO = yesterdayEnd.toISOString();
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // ─── a) SALES — yesterday ───
    const { data: yesterdayOrders } = await supabase
      .from('mi_orders')
      .select('total')
      .eq('payment_status', 'paid')
      .is('refund_status', null)
      .gte('created_at', yesterdayStartISO)
      .lte('created_at', yesterdayEndISO);

    const yesterdayCount = yesterdayOrders?.length ?? 0;
    const yesterdayRevenue = yesterdayOrders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) ?? 0;
    const yesterdayAvg = yesterdayCount > 0 ? yesterdayRevenue / yesterdayCount : 0;

    // 7-day sales
    const { data: weekOrders } = await supabase
      .from('mi_orders')
      .select('total')
      .eq('payment_status', 'paid')
      .is('refund_status', null)
      .gte('created_at', sevenDaysAgoISO);

    const weekCount = weekOrders?.length ?? 0;
    const weekRevenue = weekOrders?.reduce((sum: number, o: any) => sum + (o.total || 0), 0) ?? 0;

    // ─── b) CATALOG HEALTH ───
    const { count: activeProducts } = await supabase
      .from('mi_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active');

    const { count: outOfStockProducts } = await supabase
      .from('mi_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'out_of_stock');

    // Margin drift: (price - cost_price) / price < 0.15 AND active
    const { data: marginProducts } = await supabase
      .from('mi_products')
      .select('id, price, cost_price')
      .eq('status', 'active')
      .gt('price', 0)
      .gt('cost_price', 0);

    const marginDriftCount = (marginProducts ?? []).filter((p: any) => {
      const margin = (p.price - p.cost_price) / p.price;
      return margin < 0.15;
    }).length;

    // Stock changes in last 24h
    const { count: recentStockChanges } = await supabase
      .from('mi_products')
      .select('id', { count: 'exact', head: true })
      .gte('updated_at', twentyFourHoursAgo);

    // ─── c) PENDING AUTO-IMPORTS ───
    const { count: newlyImported } = await supabase
      .from('mi_products')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
      .gte('created_at', yesterdayStartISO);

    const { data: autoImportSetting } = await supabase
      .from('mi_settings')
      .select('value')
      .eq('key', 'auto_import_last_run')
      .maybeSingle();

    let autoImportStatus: string;
    if (!autoImportSetting?.value) {
      autoImportStatus = 'No run recorded yet';
    } else {
      const lastRunAge = Date.now() - new Date(autoImportSetting.value).getTime();
      const twentyFiveHoursMs = 25 * 60 * 60 * 1000;
      if (lastRunAge > twentyFiveHoursMs) {
        const hoursAgo = Math.round(lastRunAge / (60 * 60 * 1000));
        autoImportStatus = `ACTION REQUIRED: Last run was ${hoursAgo}h ago (missed scheduled run)`;
      } else {
        autoImportStatus = `ALL CLEAR: Last run ${autoImportSetting.value}`;
      }
    }

    // ─── d) FULFILLMENT ALERTS ───
    const { data: stuckOrders } = await supabase
      .from('mi_orders')
      .select('id, order_number, created_at, total')
      .eq('fulfillment_status', 'unfulfilled')
      .eq('payment_status', 'paid')
      .lt('created_at', twentyFourHoursAgo);

    const stuckCount = stuckOrders?.length ?? 0;

    // ─── Build data payload for Claude ───
    const briefingData = {
      sales: {
        yesterday: { orders: yesterdayCount, revenue: yesterdayRevenue, avgOrderValue: Math.round(yesterdayAvg * 100) / 100 },
        last7Days: { orders: weekCount, revenue: weekRevenue },
      },
      catalog: {
        activeProducts: activeProducts ?? 0,
        outOfStockProducts: outOfStockProducts ?? 0,
        marginDriftCount,
        stockChangesLast24h: recentStockChanges ?? 0,
      },
      autoImport: {
        newlyImportedYesterday: newlyImported ?? 0,
        status: autoImportStatus,
      },
      fulfillment: {
        stuckOrders: stuckCount,
        stuckOrderDetails: (stuckOrders ?? []).slice(0, 10).map((o: any) => ({
          orderNumber: o.order_number,
          createdAt: o.created_at,
          total: o.total,
        })),
      },
    };

    console.log('[daily-briefing-bg] Data gathered, calling Claude API...');

    // ─── Call Claude API ───
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('[daily-briefing-bg] ANTHROPIC_API_KEY not configured');
      return;
    }

    const anthropic = new Anthropic({ apiKey });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are the operations manager for MooreItems, a dropshipping e-commerce store targeting $10k/month revenue. Analyze the daily data and write a concise morning briefing for the owner Danny. Format with three sections: ACTION REQUIRED (specific tasks with urgency), WATCHING (trends worth monitoring), ALL CLEAR (things running normally). Be direct, specific, and prioritize what moves the needle toward revenue. If sales are $0, acknowledge it matter-of-factly — the store is pre-ads-launch. Flag anything that could hurt the upcoming Meta ads launch.`,
      messages: [
        {
          role: 'user',
          content: `Here is today's operational data for MooreItems:\n\n${JSON.stringify(briefingData, null, 2)}`,
        },
      ],
    });

    const briefingText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    // ─── Send email ───
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    await sendDailyBriefing({
      briefingText,
      date: today,
      orderCount: yesterdayCount,
      activeProducts: activeProducts ?? 0,
      marginAlerts: marginDriftCount,
      stuckOrders: stuckCount,
    });

    console.log(`[daily-briefing-bg] Briefing sent — ${yesterdayCount} orders, ${activeProducts ?? 0} active products, ${marginDriftCount} margin alerts, ${stuckCount} stuck orders`);
  } catch (err) {
    console.error('[daily-briefing-bg] Fatal error:', err);
  }
};
