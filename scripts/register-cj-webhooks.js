#!/usr/bin/env node
const TOKEN = process.env.CJ_ACCESS_TOKEN;
const SECRET = process.env.CJ_WEBHOOK_SECRET;
if (!TOKEN) { console.error('CJ_ACCESS_TOKEN is required'); process.exit(1); }
if (!SECRET) { console.error('CJ_WEBHOOK_SECRET is required'); process.exit(1); }

const BASE = `https://mooreitems.com/api/webhooks/cj?secret=${SECRET}`;

async function register() {
  console.log(`Registering all webhooks ? ${BASE.replace(SECRET, '***')}`);
  const res = await fetch('https://developers.cjdropshipping.com/api2.0/v1/webhook/set', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      stock:    { type: 'ENABLE', callbackUrls: [BASE] },
      product:  { type: 'ENABLE', callbackUrls: [BASE] },
      logistics:{ type: 'ENABLE', callbackUrls: [BASE] },
      order:    { type: 'ENABLE', callbackUrls: [BASE] },
    }),
  });
  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Result:', json.result ? 'OK' : json.message);
  console.log(JSON.stringify(json, null, 2));
}
register().catch(err => { console.error(err); process.exit(1); });
