/**
 * Register CJ Dropshipping Webhooks
 *
 * One-time script to register stock, product, and logistics webhooks
 * pointing to https://mooreitems.com/api/webhooks/cj
 *
 * Usage:
 *   node scripts/register-cj-webhooks.js
 */

const fs = require('fs');
const path = require('path');

// --- Load .env.local ---
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});

const CJ_API_KEY = env.CJ_API_KEY;
const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';
const WEBHOOK_URL = 'https://mooreitems.com/api/webhooks/cj';

if (!CJ_API_KEY) {
  console.error('Missing CJ_API_KEY in .env.local');
  process.exit(1);
}

async function getAccessToken() {
  const res = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const data = await res.json();
  if (!data.result) {
    throw new Error(`Auth failed: ${data.message}`);
  }
  return data.data.accessToken;
}

async function registerWebhook(token, type) {
  const res = await fetch(`${BASE_URL}/information/webhook/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify({
      type,
      callbackUrl: WEBHOOK_URL,
    }),
  });

  const data = await res.json();
  const success = data.code === 200 || data.result === true;
  return { type, success, message: data.message, code: data.code };
}

async function main() {
  console.log('=== Register CJ Webhooks ===');
  console.log('Webhook URL:', WEBHOOK_URL);
  console.log();

  console.log('Authenticating...');
  const token = await getAccessToken();
  console.log('Authenticated successfully\n');

  const types = ['STOCK', 'PRODUCT', 'LOGISTICS'];

  for (const type of types) {
    // Respect CJ rate limit (1 QPS)
    if (types.indexOf(type) > 0) {
      await new Promise((r) => setTimeout(r, 3000));
    }

    console.log(`Registering ${type} webhook...`);
    const result = await registerWebhook(token, type);

    if (result.success) {
      console.log(`  ${type}: OK`);
    } else {
      console.error(`  ${type}: FAILED — ${result.message} (code: ${result.code})`);
    }
  }

  console.log('\nDone.');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
