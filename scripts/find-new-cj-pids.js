require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const TOKEN_FILE = path.join(__dirname, '.cj-token-cache.json');

const SEARCHES = [
  { name: 'Jewelry', keyword: 'necklace' },
  { name: 'Pet Supplies', keyword: 'dog toy' },
  { name: 'Beauty', keyword: 'makeup brush' },
  { name: 'Electronics', keyword: 'earbuds' },
  { name: 'Phone Accessories', keyword: 'phone case' },
  { name: 'Beauty', keyword: 'hair clip' },
  { name: 'Pet Supplies', keyword: 'cat collar' },
  { name: 'Jewelry', keyword: 'bracelet' },
];

async function getToken() {
  try {
    const cached = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf-8'));
    if (cached.token && cached.expiry && new Date(cached.expiry) > new Date(Date.now() + 60000)) {
      console.log('Using cached CJ token');
      return cached.token;
    }
  } catch {}

  const authRes = await fetch(process.env.CJ_API_BASE_URL + '/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }),
  });
  const authData = await authRes.json();
  if (!authData.result) throw new Error('Auth failed: ' + authData.message);
  const token = authData.data.accessToken;
  fs.writeFileSync(TOKEN_FILE, JSON.stringify({ token, expiry: authData.data.accessTokenExpiryDate }));
  console.log('Got fresh CJ token');
  return token;
}

async function run() {
  const token = await getToken();
  const seenPids = new Set();
  const candidates = [];

  for (const search of SEARCHES) {
    if (candidates.length >= 15) break;
    await sleep(3100);

    // Use keyword search with US country code, pages 5-8 to avoid already-imported products
    const page = 5 + Math.floor(Math.random() * 4);
    const url =
      process.env.CJ_API_BASE_URL +
      `/product/list?pageNum=${page}&pageSize=50&countryCode=US&productNameEn=${encodeURIComponent(search.keyword)}`;

    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
    });
    const data = await res.json();
    const products = data.data?.list || [];
    console.log(`"${search.keyword}" (${search.name}) page ${page}: ${products.length} products`);

    for (const p of products) {
      if (seenPids.has(p.pid)) continue;
      seenPids.add(p.pid);

      const price = parseFloat(p.sellPrice);
      if (isNaN(price) || price > 20 || price <= 0) continue;
      if (typeof p.sellPrice === 'string' && p.sellPrice.includes('--')) continue;
      if (!p.productNameEn) continue;

      const nameLower = p.productNameEn.toLowerCase();
      if (/\b(table|desk|chair|sofa|cabinet|shelf|bookcase|dresser|bed frame|mattress)\b/.test(nameLower)) continue;

      candidates.push({
        pid: p.pid,
        name: p.productNameEn,
        price: price,
        category: search.name,
        keyword: search.keyword,
      });
    }
  }

  console.log(`\nFound ${candidates.length} candidates under $20 (non-furniture, US warehouse)\n`);

  if (candidates.length === 0) {
    console.log('No matching products. CJ may not have US-warehouse items for these keywords.');
    console.log('Trying without US filter on page 3...\n');

    // Fallback: try without US filter but note it
    for (const search of SEARCHES.slice(0, 4)) {
      if (candidates.length >= 10) break;
      await sleep(3100);

      const url =
        process.env.CJ_API_BASE_URL +
        `/product/list?pageNum=3&pageSize=50&productNameEn=${encodeURIComponent(search.keyword)}`;
      const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', 'CJ-Access-Token': token },
      });
      const data = await res.json();
      const products = data.data?.list || [];
      console.log(`"${search.keyword}" (any warehouse) page 3: ${products.length} products`);

      for (const p of products) {
        if (seenPids.has(p.pid)) continue;
        seenPids.add(p.pid);

        const price = parseFloat(p.sellPrice);
        if (isNaN(price) || price > 20 || price <= 0) continue;
        if (typeof p.sellPrice === 'string' && p.sellPrice.includes('--')) continue;
        if (!p.productNameEn) continue;

        const nameLower = p.productNameEn.toLowerCase();
        if (/\b(table|desk|chair|sofa|cabinet|shelf|bookcase|dresser|bed frame|mattress)\b/.test(nameLower)) continue;

        candidates.push({
          pid: p.pid,
          name: p.productNameEn,
          price: price,
          category: search.name,
          keyword: search.keyword,
        });
      }
    }
    console.log(`\nTotal candidates after fallback: ${candidates.length}\n`);
  }

  if (candidates.length === 0) {
    console.log('Still no products found.');
    return;
  }

  // Check which exist in DB
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const allPids = candidates.map((c) => c.pid);
  // Supabase .in() has a limit, batch if needed
  const batchSize = 50;
  const existingPids = new Set();
  for (let i = 0; i < allPids.length; i += batchSize) {
    const batch = allPids.slice(i, i + batchSize);
    const { data: existing } = await supabase
      .from('mi_products')
      .select('cj_pid')
      .in('cj_pid', batch);
    (existing || []).forEach((r) => existingPids.add(r.cj_pid));
  }

  const newProducts = candidates.filter((c) => !existingPids.has(c.pid));
  console.log(`New (not in DB): ${newProducts.length} / ${candidates.length}\n`);
  console.log('--- 5 CJ PIDs not in our database (under $20, small items) ---\n');

  newProducts.slice(0, 5).forEach((p, i) => {
    console.log(
      `${i + 1}. ${p.pid}`,
      `\n   Name: ${p.name}`,
      `\n   Price: $${p.price.toFixed(2)}`,
      `\n   Category: ${p.category}`,
      `\n`
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

run().catch(console.error);
