// ─── Cron Schedule ─────────────────────────────────────────────────
// 2AM daily:  POST /.netlify/functions/auto-import-suggest?key=AUTO_IMPORT_SECRET
// Uses the AUTO_IMPORT_SECRET env var for query-param auth.
// ───────────────────────────────────────────────────────────────────

import type { Config } from '@netlify/functions';

export default async (req: Request) => {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get('key');
    const cronSecret = process.env.AUTO_IMPORT_SECRET;

    if (!cronSecret || key !== cronSecret) {
      console.error('[auto-import-cron] Unauthorized — invalid or missing key');
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('[auto-import-cron] Starting daily product suggestion run...');

    const siteUrl = process.env.URL || 'https://mooreitems.com';
    const response = await fetch(`${siteUrl}/api/auto-import/suggest?key=${cronSecret}`, {
      method: 'POST',
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[auto-import-cron] Suggest route failed:', data);
      return new Response(JSON.stringify(data), { status: response.status });
    }

    console.log(`[auto-import-cron] Complete: ${data.suggested} suggestions saved`);
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[auto-import-cron] Fatal error:', err);
    return new Response('Internal error', { status: 500 });
  }
};

export const config: Config = {
  schedule: '0 2 * * *',
};
