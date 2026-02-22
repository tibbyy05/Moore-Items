const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const eq = line.indexOf('=');
  if (eq > 0) env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const CJ_API_BASE_URL = env.CJ_API_BASE_URL;
const CJ_API_KEY = env.CJ_API_KEY;

async function cjAuthenticate() {
  const response = await fetch(`${CJ_API_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const data = await response.json();
  if (!data?.result) {
    throw new Error(`CJ Auth failed: ${data?.message || 'Unknown error'}`);
  }
  return data.data.accessToken;
}

async function cjGetTracking(orderNumber, token) {
  const response = await fetch(`${CJ_API_BASE_URL}/logistic/trackingInfo?orderNumber=${orderNumber}`, {
    headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
  });
  const data = await response.json();
  if (data.code !== 200 && data.code !== 0) {
    throw new Error(`CJ API error: ${data.message} (code: ${data.code})`);
  }
  return data.data;
}

function extractTrackingInfo(payload) {
  let info = payload;
  if (Array.isArray(payload?.trackingInfoList)) info = payload.trackingInfoList[0];
  else if (Array.isArray(payload?.trackingInfo)) info = payload.trackingInfo[0];
  else if (Array.isArray(payload?.logisticTrackingInfo)) info = payload.logisticTrackingInfo[0];
  else if (Array.isArray(payload)) info = payload[0];

  const trackingNumber =
    info?.trackingNumber || info?.trackingNo || info?.tracking_no || info?.trackNumber || null;
  const trackingUrl =
    info?.trackingUrl || info?.tracking_url || info?.trackUrl || info?.logisticUrl || null;
  const carrier = info?.logisticName || info?.carrier || info?.logisticCompany || null;
  const status =
    info?.status ||
    info?.trackingStatus ||
    info?.logisticStatus ||
    payload?.status ||
    payload?.logisticStatus ||
    null;

  return { trackingNumber, trackingUrl, carrier, status };
}

async function supabaseGet(pathname) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function supabasePatch(pathname, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
}

async function fetchOrders() {
  const results = [];
  let offset = 0;
  while (true) {
    const batch = await supabaseGet(
      `mi_orders?select=id,order_number,cj_order_number,fulfillment_status&or=(fulfillment_status.eq.processing,fulfillment_status.eq.shipped)&cj_order_number=not.is.null&limit=500&offset=${offset}`
    );
    if (!Array.isArray(batch) || batch.length === 0) break;
    results.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  return results;
}

async function run() {
  console.log('=== Check CJ Tracking ===\n');
  const orders = await fetchOrders();
  console.log(`Found ${orders.length} orders to check\n`);

  if (orders.length === 0) return;

  const token = await cjAuthenticate();
  let updated = 0;

  for (const order of orders) {
    try {
      const trackingPayload = await cjGetTracking(order.cj_order_number, token);
      const { trackingNumber, trackingUrl, carrier, status } = extractTrackingInfo(trackingPayload);

      let nextStatus = order.fulfillment_status;
      if (typeof status === 'string' && status.toLowerCase().includes('delivered')) {
        nextStatus = 'delivered';
      } else if (trackingNumber) {
        nextStatus = 'shipped';
      }

      await supabasePatch(`mi_orders?id=eq.${order.id}`, {
        tracking_number: trackingNumber,
        tracking_url: trackingUrl,
        carrier,
        cj_status: status,
        fulfillment_status: nextStatus,
      });

      updated += 1;
      console.log(
        `Updated ${order.order_number}: ${trackingNumber || 'no tracking'} (${
          status || 'unknown'
        })`
      );
    } catch (error) {
      console.error(`Error tracking order ${order.order_number}:`, error.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log(`\nDone! Updated ${updated} orders.`);
}

run().catch((error) => {
  console.error('Fatal:', error);
  process.exit(1);
});
