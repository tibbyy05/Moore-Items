/**
 * analyze-uncategorized-hg.js
 * Find Home & Garden products that don't match base keywords, then bucket them.
 * Usage: node scripts/analyze-uncategorized-hg.js
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

const BASE_KEYWORDS = [
  'bath',
  'shower',
  'towel',
  'bathroom',
  'soap',
  'toilet',
  'toothbrush',
  'faucet',
  'drain',
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
  'LED',
  'lamp',
  'light',
  'lantern',
  'chandelier',
  'bulb',
  'candle',
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
  'bracket',
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
  'bed',
  'blanket',
  'sheet',
  'duvet',
  'pillowcase',
  'comforter',
  'mattress',
  'quilt',
  'throw',
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
];

const BUCKETS = {
  Furniture: [
    'sofa',
    'couch',
    'chair',
    'table',
    'desk',
    'cabinet',
    'dresser',
    'bench',
    'recliner',
    'futon',
    'sectional',
    'ottoman',
    'stool',
    'bookcase',
    'vanity',
    'wardrobe',
    'nightstand',
  ],
  'Outdoor Structures': [
    'gazebo',
    'canopy',
    'carport',
    'pergola',
    'tent',
    'shed',
    'awning',
    'shelter',
    'greenhouse',
    'arbor',
  ],
  'Cleaning & Household': [
    'vacuum',
    'mop',
    'broom',
    'cleaning',
    'trash',
    'garbage',
    'laundry',
    'iron',
    'steamer',
    'duster',
    'sponge',
  ],
  'Automotive & Sport': [
    'car',
    'vehicle',
    'bike',
    'bicycle',
    'motorcycle',
    'kayak',
    'camping',
    'fishing',
    'gym',
    'exercise',
    'fitness',
    'treadmill',
    'dumbbell',
  ],
};

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function matchesKeyword(name, keyword) {
  const pattern = new RegExp(`\\b${escapeRegex(keyword).replace(/\\s+/g, '\\\\s+')}\\b`, 'i');
  return pattern.test(name);
}

async function main() {
  console.log('=== Analyze Home & Garden Uncategorized ===\n');

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

  const baseFiltered = products.filter((product) => {
    const name = product.name || '';
    return !BASE_KEYWORDS.some((kw) => matchesKeyword(name, kw));
  });

  const buckets = {};
  Object.keys(BUCKETS).forEach((key) => {
    buckets[key] = [];
  });
  buckets['Still Uncategorized'] = [];

  for (const product of baseFiltered) {
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
      buckets['Still Uncategorized'].push(name);
    }
  }

  console.log(`Total active Home & Garden products: ${products.length}`);
  console.log(`Remaining after base keyword filter: ${baseFiltered.length}\n`);

  for (const [bucket, list] of Object.entries(buckets)) {
    console.log(`=== ${bucket} (${list.length}) ===`);
    list.slice(0, 15).forEach((name) => console.log(`  - ${name}`));
    console.log('');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
