const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => { const eq = line.indexOf('='); if (eq > 0) env[line.substring(0,eq).trim()] = line.substring(eq+1).trim(); });
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// ─── Review count varies by price tier ───
function getReviewCount(retailPrice) {
  const rand = Math.random();
  if (retailPrice >= 100) {
    return Math.floor(8 + rand * 27); // 8-35
  } else if (retailPrice >= 30) {
    return Math.floor(4 + rand * 16); // 4-20
  } else {
    return Math.floor(1 + rand * 11); // 1-12
  }
}

// ─── Rating distribution: 4-5 stars only ───
function generateRating() {
  const rand = Math.random();
  if (rand < 0.65) return 5;  // 65% five-star
  return 4;                    // 35% four-star
}

// ─── Realistic names ───
const FIRST_NAMES = [
  'Sarah', 'Michael', 'Jessica', 'David', 'Emily', 'James', 'Ashley', 'Robert',
  'Amanda', 'John', 'Stephanie', 'Chris', 'Jennifer', 'Daniel', 'Lauren', 'Mark',
  'Nicole', 'Kevin', 'Rachel', 'Brian', 'Megan', 'Steven', 'Heather', 'Jason',
  'Melissa', 'Tyler', 'Samantha', 'Ryan', 'Rebecca', 'Justin', 'Elizabeth', 'Andrew',
  'Maria', 'Alex', 'Angela', 'Brandon', 'Christina', 'Nathan', 'Lisa', 'Patrick',
  'Brittany', 'Scott', 'Catherine', 'Greg', 'Diana', 'Joe', 'Karen', 'Eric',
  'Tanya', 'Matt', 'Vanessa', 'Derek', 'Michelle', 'Tom', 'Patricia', 'Marcus',
  'Hannah', 'Carlos', 'Sophie', 'Luis', 'Priya', 'Raj', 'Yuki', 'Wei',
  'Fatima', 'Ahmed', 'Olivia', 'Ethan', 'Ava', 'Noah', 'Isabella', 'Liam',
  'Sophia', 'Mason', 'Charlotte', 'Logan', 'Amelia', 'Lucas', 'Harper', 'Aiden',
];

const LAST_INITIALS = 'ABCDEFGHIJKLMNOPRSTUVWZ'.split('');

function randomName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastInit = LAST_INITIALS[Math.floor(Math.random() * LAST_INITIALS.length)];
  return `${first} ${lastInit}.`;
}

// ─── Review dates: 1-60 days ago (always recent) ───
function randomDate() {
  const daysAgo = Math.floor(1 + Math.random() * 59); // 1-60 days ago
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(Math.floor(Math.random() * 14) + 8);
  d.setMinutes(Math.floor(Math.random() * 60));
  return d.toISOString();
}

// ─── Country distribution ───
function randomCountry() {
  const r = Math.random();
  if (r < 0.75) return 'US';
  if (r < 0.85) return 'CA';
  if (r < 0.93) return 'GB';
  if (r < 0.97) return 'AU';
  return 'DE';
}

// ─── Review titles: all positive ───
const FIVE_STAR_TITLES = [
  'Absolutely love it!', 'Exceeded my expectations', 'Best purchase this year',
  'Highly recommend!', 'Perfect quality', 'Amazing product', 'Worth every penny',
  'So happy with this', 'Exactly what I needed', 'Outstanding!',
  'Couldn\'t be happier', 'Five stars all the way', 'Fantastic find',
  'Just perfect', 'Impressed!', 'Love it!', 'Great buy',
  'Better than expected', 'Obsessed!', 'Must-have product',
  'Top notch quality', 'Will buy again', 'Incredible value',
  'Blew me away', 'Game changer', 'So worth it',
];

const FOUR_STAR_TITLES = [
  'Really good quality', 'Very satisfied', 'Solid purchase',
  'Happy with it', 'Good value', 'Works great',
  'Nice product', 'Would buy again', 'Pretty impressed',
  'Better than expected', 'Reliable product', 'Very good',
  'Pleased with my purchase', 'Quality product', 'Nice find',
  'Does the job perfectly', 'Great for the price', 'Solid quality',
];

function getTitle(rating) {
  const list = rating === 5 ? FIVE_STAR_TITLES : FOUR_STAR_TITLES;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Review bodies: all positive ───
const FIVE_STAR_BODIES = [
  'Shipping was fast and the product arrived in perfect condition. Really happy with the quality.',
  'This is exactly what I was looking for. The build quality is excellent and it looks great.',
  'I was a bit hesitant ordering online but this exceeded my expectations. Solid construction and beautiful design.',
  'Great product for the price point. Packaging was secure and delivery was quick.',
  'Very pleased with this purchase. It matches the photos perfectly and feels well-made.',
  'My family loves it! Easy to set up and the quality is much better than I anticipated.',
  'Ordered this after reading other reviews and I\'m glad I did. Totally worth it.',
  'The quality really surprised me. Feels premium and looks even better in person.',
  'Fast shipping, great packaging, and the product itself is top notch. Will order again.',
  'This has become one of my favorite purchases. Would definitely order from here again.',
  'Bought this as a gift and the recipient absolutely loved it. Great quality.',
  'Super happy with this. It\'s well-designed and functional. No complaints at all.',
  'I\'ve been using this for a few weeks now and it\'s held up perfectly. Great investment.',
  'The attention to detail on this product is impressive. Very well crafted.',
  'Arrived earlier than expected and the quality is fantastic. Highly recommended.',
  'Really well-made product. You can tell they didn\'t cut corners on materials.',
  'Exactly as described. Clean packaging, fast delivery, and quality product.',
  'Been looking for something like this for months. So glad I found it here.',
  'Compared to similar products I\'ve tried, this one stands out in quality and value.',
  'This product just works. Simple, effective, and well-built. What more could you ask for?',
  'Incredible quality for the price. I\'ve paid double for worse at other stores.',
  'My second purchase from this store and once again impressed. Consistent quality.',
  'So much better than what I had before. Upgraded and couldn\'t be happier.',
  'Looks amazing in my home. Friends keep asking where I got it.',
  'The photos don\'t do it justice — it\'s even nicer in person!',
  'Delivered right on time and packaged carefully. The product itself is fantastic.',
  'I keep coming back to this store. Always great quality and fair prices.',
  'Exactly what the description said. No surprises, just a great product.',
  'My go-to store now. This product sealed the deal — amazing quality.',
  'Worth every penny and then some. I\'d recommend this to anyone.',
];

const FOUR_STAR_BODIES = [
  'Good quality product that does what it\'s supposed to. Very happy with the purchase.',
  'Really nice product overall. Arrived quickly and well-packaged. Would recommend.',
  'Solid purchase. The quality is good and it looks just like the photos. Happy with it.',
  'Works well and looks great. Shipping was fast too. Would order from here again.',
  'Nice product for the price. A couple small things I\'d tweak but overall very satisfied.',
  'Better quality than I expected for this price range. Pleasantly surprised.',
  'Good value for money. Does exactly what I need it to do. No complaints.',
  'Happy with this purchase. The materials feel durable and it looks good.',
  'Solid quality and fast delivery. Would definitely consider buying from here again.',
  'Nice product. Packaging was great and it arrived in perfect condition.',
  'Pretty impressed with the quality. It\'s become a staple in my daily routine.',
  'Great product for the price. Not quite perfect but very close. Would recommend.',
  'Looks good, works well, and arrived on time. That\'s all I can ask for.',
  'Pleased with the purchase. Good quality materials and thoughtful design.',
  'Does the job well. Good construction and the price is very fair.',
];

function getBody(rating) {
  const list = rating === 5 ? FIVE_STAR_BODIES : FOUR_STAR_BODIES;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── Main ───
async function main() {
  const DRY_RUN = process.argv.includes('--dry-run');
  console.log(`=== Review Generator V3 ${DRY_RUN ? '(DRY RUN)' : ''} ===`);
  console.log('Changes: All 4-5 star reviews, dates within last 60 days\n');

  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${URL}/rest/v1/mi_products?select=id,name,retail_price,category_id&status=eq.active&limit=500&offset=${offset}`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  console.log(`Found ${all.length} active products\n`);

  if (DRY_RUN) {
    let total = 0;
    const buckets = { '1-5': 0, '6-10': 0, '11-15': 0, '16-20': 0, '21-25': 0, '26-30': 0, '31-35': 0 };
    for (const p of all) {
      const count = getReviewCount(p.retail_price);
      total += count;
      if (count <= 5) buckets['1-5']++;
      else if (count <= 10) buckets['6-10']++;
      else if (count <= 15) buckets['11-15']++;
      else if (count <= 20) buckets['16-20']++;
      else if (count <= 25) buckets['21-25']++;
      else if (count <= 30) buckets['26-30']++;
      else buckets['31-35']++;
    }
    console.log(`Total reviews to generate: ~${total}`);
    console.log('Distribution of review counts per product:');
    Object.entries(buckets).forEach(([k, v]) => console.log(`  ${k} reviews: ${v} products`));
    console.log('\nAll reviews will be 4-5 stars, dated within last 60 days');
    console.log('Run without --dry-run to apply');
    return;
  }

  // Delete ALL existing generated reviews
  console.log('Deleting existing generated reviews...');
  // Delete in batches to avoid timeout
  let deleted = 0;
  while (true) {
    const check = await fetch(`${URL}/rest/v1/mi_reviews?source=eq.generated&select=id&limit=1`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const remaining = await check.json();
    if (!remaining || remaining.length === 0) break;
    
    const delRes = await fetch(`${URL}/rest/v1/mi_reviews?source=eq.generated&limit=5000`, {
      method: 'DELETE',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Prefer': 'return=minimal' }
    });
    deleted++;
    console.log(`  Delete batch ${deleted}...`);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('All old reviews deleted.\n');

  let totalGenerated = 0;
  let productsDone = 0;

  for (const product of all) {
    const reviewCount = getReviewCount(product.retail_price);
    const reviews = [];

    for (let i = 0; i < reviewCount; i++) {
      const rating = generateRating();
      reviews.push({
        product_id: product.id,
        customer_name: randomName(),
        rating,
        title: getTitle(rating),
        body: getBody(rating),
        is_verified: Math.random() < 0.8,
        is_approved: true,
        created_at: randomDate(),
        reviewer_country: randomCountry(),
        source: 'generated',
        images: null,
      });
    }

    const insertRes = await fetch(`${URL}/rest/v1/mi_reviews`, {
      method: 'POST',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify(reviews),
    });

    if (!insertRes.ok) {
      console.error(`  Error for ${product.name}: ${await insertRes.text()}`);
      continue;
    }

    const actualAvg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await fetch(`${URL}/rest/v1/mi_products?id=eq.${product.id}`, {
      method: 'PATCH',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        review_count: reviewCount,
        average_rating: Math.round(actualAvg * 10) / 10,
      }),
    });

    totalGenerated += reviewCount;
    productsDone++;
    if (productsDone % 100 === 0) console.log(`  ${productsDone}/${all.length} products... (${totalGenerated} reviews)`);
    await new Promise(r => setTimeout(r, 30));
  }

  console.log(`\nDone! Generated ${totalGenerated} reviews for ${productsDone} products`);
  console.log('All reviews: 4-5 stars, dated within last 60 days');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });