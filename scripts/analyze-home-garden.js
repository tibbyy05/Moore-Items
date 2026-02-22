/**
 * analyze-home-garden.js
 * Analyze Home & Garden products into keyword buckets.
 * Usage: node scripts/analyze-home-garden.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const eq = line.indexOf('=');
  if (eq > 0) {
    const key = line.substring(0, eq).trim();
    const val = line.substring(eq + 1).trim();
    if (key && val) env[key] = val;
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Found keys:', Object.keys(env).join(', '));
  process.exit(1);
}

async function supabaseGet(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

const BUCKETS = {
  'Bath & Bathroom': [
    'bath',
    'shower',
    'towel',
    'bathroom',
    'soap',
    'toilet',
    'toothbrush',
    'faucet',
    'drain',
  ],
  'Garden & Outdoor': [
    'garden',
    'plant',
    'planter',
    'pot',
    'outdoor',
    'solar',
    'patio',
    'lawn',
    'watering',
    'flower',
    'seed',
    'fence',
    'bird',
  ],
  Lighting: [
    'LED',
    'lamp',
    'light',
    'lantern',
    'chandelier',
    'bulb',
    'string light',
    'night light',
    'candle holder',
  ],
  'Storage & Organization': [
    'organizer',
    'storage',
    'shelf',
    'rack',
    'hook',
    'hanger',
    'bin',
    'basket',
    'holder',
    'mount',
    'wall mount',
    'bracket',
  ],
  'Home Decor': [
    'decor',
    'art',
    'frame',
    'vase',
    'cushion',
    'pillow',
    'curtain',
    'rug',
    'mat',
    'tapestry',
    'sticker',
    'wall',
    'mirror',
    'clock',
  ],
  'Bedding & Textiles': [
    'bed',
    'blanket',
    'sheet',
    'duvet',
    'pillowcase',
    'comforter',
    'mattress',
    'quilt',
    'throw',
  ],
  'Tools & Hardware': [
    'tool',
    'wrench',
    'drill',
    'tape',
    'screw',
    'cable',
    'wire',
    'clip',
    'clamp',
    'cutter',
    'repair',
  ],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesKeyword(name, keyword) {
  const pattern = new RegExp(`\\b${escapeRegex(keyword).replace(/\s+/g, '\\s+')}\\b`, 'i');
  return pattern.test(name);
}

async function main() {
  console.log('=== Analyze Home & Garden ===\n');

  const categories = await supabaseGet('mi_categories', 'select=id,slug,name');
  const homeGarden = categories.find((c) => c.slug === 'home-garden' || c.name === 'Home & Garden');
  if (!homeGarden) {
    console.error('Home & Garden category not found.');
    process.exit(1);
  }

  const products = await supabaseGet(
    'mi_products',
    `select=id,name&status=eq.active&category_id=eq.${homeGarden.id}&order=name.asc&limit=5000`
  );

  const buckets = {};
  Object.keys(BUCKETS).forEach((key) => {
    buckets[key] = [];
  });
  buckets.Uncategorized = [];

  for (const product of products) {
    const name = product.name || '';
    let matched = false;
    for (const [bucket, keywords] of Object.entries(BUCKETS)) {
      if (keywords.some((kw) => matchesKeyword(name, kw))) {
        buckets[bucket].push(name);
        matched = true;
        break;
      }
    }
    if (!matched) {
      buckets.Uncategorized.push(name);
    }
  }

  console.log(`Total active Home & Garden products: ${products.length}\n`);
  for (const [bucket, list] of Object.entries(buckets)) {
    console.log(`=== ${bucket} (${list.length}) ===`);
    list.slice(0, 10).forEach((name) => console.log(`  - ${name}`));
    console.log('');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
