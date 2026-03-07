#!/usr/bin/env node
// Register CJ webhook subscriptions with the secret query parameter.
// Usage: CJ_ACCESS_TOKEN=... CJ_WEBHOOK_SECRET=... node scripts/register-cj-webhooks.js

const CJ_API = 'https://developers.cjdropshipping.com/api2.0/v1/webhooks';
const TOKEN = process.env.CJ_ACCESS_TOKEN;
const SECRET = process.env.CJ_WEBHOOK_SECRET;

if (!TOKEN) { console.error('CJ_ACCESS_TOKEN is required'); process.exit(1); }
if (!SECRET) { console.error('CJ_WEBHOOK_SECRET is required'); process.exit(1); }

const BASE = `https://mooreitems.com/api/webhooks/cj?secret=${SECRET}`;

const HOOKS = [
  { type: 'STOCK',   url: BASE },
  { type: 'VARIANT', url: BASE },
  { type: 'PRODUCT', url: BASE },
];

async function register() {
  for (const hook of HOOKS) {
    console.log(`Registering ${hook.type} → ${hook.url.replace(SECRET, '***')}`);
    const res = await fetch(CJ_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': TOKEN,
      },
      body: JSON.stringify({ subscribeTopic: hook.type, callbackUrl: hook.url }),
    });
    const json = await res.json();
    console.log(`  → ${res.status}`, json.result ? 'OK' : json.message);
  }
}

register().catch(err => { console.error(err); process.exit(1); });
