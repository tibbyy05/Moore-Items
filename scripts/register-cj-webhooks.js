#!/usr/bin/env node
const path = require('path');
const fs = require('fs');

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
}

const CJ_API_KEY = process.env.CJ_API_KEY;
const SECRET = process.env.CJ_WEBHOOK_SECRET;
const CJ_BASE = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1';
if (!CJ_API_KEY) { console.error('CJ_API_KEY is required'); process.exit(1); }
if (!SECRET) { console.error('CJ_WEBHOOK_SECRET is required'); process.exit(1); }

const CALLBACK_BASE = `https://mooreitems.com/api/webhooks/cj?secret=${SECRET}`;

async function getAccessToken() {
  console.log('Authenticating with CJ...');
  const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const json = await res.json();
  if (json.code !== 200 && json.code !== 0) {
    throw new Error(`CJ Auth failed: ${json.message}`);
  }
  console.log('CJ auth OK');
  return json.data.accessToken;
}

async function register() {
  const token = await getAccessToken();

  console.log(`Registering all webhooks → ${CALLBACK_BASE.replace(SECRET, '***')}`);
  const res = await fetch(`${CJ_BASE}/webhook/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify({
      stock:    { type: 'ENABLE', callbackUrls: [CALLBACK_BASE] },
      product:  { type: 'ENABLE', callbackUrls: [CALLBACK_BASE] },
      logistics:{ type: 'ENABLE', callbackUrls: [CALLBACK_BASE] },
      order:    { type: 'ENABLE', callbackUrls: [CALLBACK_BASE] },
    }),
  });
  const json = await res.json();
  console.log('Status:', res.status);
  console.log('Result:', json.result ? 'OK' : json.message);
  console.log(JSON.stringify(json, null, 2));
}
register().catch(err => { console.error(err); process.exit(1); });
