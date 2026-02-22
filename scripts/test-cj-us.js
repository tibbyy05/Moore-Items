// scripts/test-cj-us.js
// Run with: node scripts/test-cj-us.js

const fs = require('fs');

const BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1';

function loadApiKey() {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const match = envFile.match(/CJ_API_KEY=(.+)/);
  return match?.[1]?.trim() || '';
}

async function run() {
  const CJ_API_KEY = loadApiKey();
  if (!CJ_API_KEY) {
    console.log('[test] Missing CJ_API_KEY in .env.local');
    return;
  }

  // Step 1: Get auth token
  console.log('[test] Getting auth token...');
  const authRes = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  });
  const authData = await authRes.json();
  console.log('[test] Auth response code:', authData.code);
  const token = authData.data?.accessToken;
  if (!token) {
    console.log('[test] NO TOKEN:', JSON.stringify(authData));
    return;
  }
  console.log('[test] Got token');

  // Step 2: Call product list V2 with US warehouse filter
  console.log('[test] Fetching US warehouse products...');
  await new Promise((r) => setTimeout(r, 3000));
  const listRes = await fetch(
    `${BASE_URL}/product/listV2?page=1&size=5&countryCode=US&orderBy=1&sort=desc`,
    {
      headers: { 'CJ-Access-Token': token },
    }
  );
  const listData = await listRes.json();

  // Step 3: Log the FULL structure
  console.log('[test] Response code:', listData.code);
  console.log('[test] Response result:', listData.result);
  console.log('[test] Data keys:', Object.keys(listData.data || {}));
  console.log(
    '[test] Full response (first 2000 chars):',
    JSON.stringify(listData).substring(0, 2000)
  );
}

run().catch(console.error);
