/**
 * fix-uncategorized.js
 * Fixes uncategorized products with expanded keyword mapping.
 * Usage: node scripts/fix-uncategorized.js
 */
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
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
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  console.error('Found keys:', Object.keys(env).join(', '));
  process.exit(1);
}
console.log('Using Supabase URL:', SUPABASE_URL);

async function supabaseGet(table, params = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${params}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  if (!res.ok) throw new Error(`GET ${table} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, filter, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${filter}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json', 'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH failed (${res.status}): ${await res.text()}`);
}

const CATEGORY_MAP = {
  'womens-fashion': {
    primary: ['dress','skirt','blouse','legging','cardigan','sweater','bra','lingerie','tank top','camisole','romper','jumpsuit','tunic','kimono','sarong','bikini','swimsuit','swimwear','bathing suit','women','woman','ladies','female','handbag','purse','clutch','tote bag','crossbody','evening bag','makeup bag','cosmetic bag','hair clip','hair tie','scrunchie','headband','hair band','barrette','ponytail','wig','hair extension','eyelash','false lash','nail','manicure','pedicure','high heel','stiletto','wedge sandal','ballet flat','shapewear','corset','bodysuit','pantyhose','stocking','scarf','shawl','wrap','poncho','cape'],
    secondary: ['lace','floral print','bohemian','boho','feminine','maternity','nursing','pregnancy']
  },
  'pet-supplies': {
    primary: ['pet','dog','cat','puppy','kitten','aquarium','fish tank','bird','parrot','hamster','rabbit','reptile','turtle','collar','leash','harness','pet bed','dog bed','cat bed','pet toy','dog toy','cat toy','chew toy','squeaky','pet bowl','dog bowl','cat bowl','feeder','water fountain pet','litter','litter box','poop bag','waste bag','pet carrier','crate','kennel','pet clothes','dog clothes','pet costume','grooming','pet brush','deshedding','flea','tick','pet gate','pet door','pet stroller','pet backpack','catnip','scratching post','cat tree','cat tower'],
    secondary: ['animal','paw','bone shaped','fur','whisker']
  },
  'home-garden': {
    primary: ['curtain','pillow','cushion','blanket','throw','rug','carpet','mat','doormat','bedding','duvet','comforter','sheet','pillowcase','towel','bath towel','shower curtain','bathroom','soap dispenser','toothbrush holder','toilet','plunger','drain','wall art','canvas','poster','picture frame','photo frame','mirror','clock','wall clock','alarm clock','vase','flower pot','planter','plant pot','garden','watering can','hose','sprinkler','lawn','seed','soil','shelf','bookshelf','storage','organizer','basket','bin','hook','hanger','rack','coat rack','shoe rack','candle','incense','diffuser','air freshener','aromatherapy','lamp','light','bulb','led strip','fairy light','night light','chandelier','pendant light','desk lamp','floor lamp','furniture','table','chair','stool','bench','ottoman','sofa','couch','loveseat','recliner','tool','drill','hammer','screwdriver','wrench','plier','tape measure','level','saw','sandpaper','paint','roller','wallpaper','tile','grout','lock','deadbolt','door knob','door handle','hinge','fan','heater','humidifier','dehumidifier','air purifier','vacuum','mop','broom','dustpan','cleaning','sponge','trash can','garbage','recycle bin','laundry','iron','ironing board','clothes line','drying rack','window','blind','shade','mosquito net','outdoor','patio','deck','grill','bbq','barbecue','camping','tent','sleeping bag','lantern','flashlight','decoration','decor','ornament','figurine','statue','christmas','halloween','holiday','seasonal','sticker','wall sticker','decal','tapestry'],
    secondary: ['home','house','room','living room','bedroom','waterproof cover','dustproof','slipcover']
  },
  'health-beauty': {
    primary: ['skincare','skin care','moisturizer','serum','lotion','sunscreen','spf','face mask','facial','cleanser','toner','exfoliant','scrub','peel','acne','anti-aging','wrinkle','eye cream','lip balm','lip gloss','lipstick','makeup','cosmetic','foundation','concealer','mascara','eyeliner','eyeshadow','blush','bronzer','highlighter','contour','brush set','makeup brush','beauty blender','sponge makeup','perfume','cologne','fragrance','essential oil','hair care','shampoo','conditioner','hair mask','hair oil','hair dryer','curling iron','straightener','flat iron','trimmer','clipper','shaver','razor','electric shaver','toothbrush electric','teeth whitening','dental','floss','massage','massager','gua sha','jade roller','yoga','yoga mat','fitness','exercise','workout','gym','resistance band','dumbbell','weight','kettlebell','supplement','vitamin','protein','collagen','body scale','thermometer','blood pressure','first aid','bandage','brace','knee brace','posture','back support','neck pillow','eye mask','sleep mask','shaker bottle','pill box','pill organizer','essential oil diffuser','spa','bath bomb','bath salt','body wash','shower gel','deodorant','antiperspirant'],
    secondary: ['beauty','wellness','self care','self-care','organic','herbal','therapeutic']
  },
  'jewelry': {
    primary: ['necklace','bracelet','earring','pendant','charm','anklet','brooch','cufflink','tie clip','tie bar','chain','choker','bangle','hoop','stud','dangle','gold plated','silver plated','sterling silver','stainless steel jewelry','cubic zirconia','crystal','rhinestone','gemstone','pearl','diamond','ruby','sapphire','emerald','opal','turquoise','watch','wristwatch','smartwatch','watch band','watch strap','jewelry box','jewelry organizer','ring holder','engagement','wedding band','promise ring','beaded','handmade jewelry','bohemian jewelry'],
    secondary: ['jewel','gem','precious','accessory','accessories','titanium','tungsten']
  },
  'electronics': {
    primary: ['bluetooth','wireless','usb','charger','cable','adapter','headphone','earphone','earbud','speaker','microphone','phone case','phone holder','phone stand','phone mount','screen protector','tempered glass','tablet','ipad','laptop','computer','keyboard','mouse','mousepad','webcam','camera','tripod','selfie stick','gimbal','drone','rc car','remote control','robot','power bank','battery','portable charger','smart home','smart plug','smart bulb','alexa','google home','security camera','doorbell camera','baby monitor','gaming','controller','joystick','headset gaming','vr','virtual reality','ar glasses','sd card','memory card','flash drive','hard drive','ssd','hdmi','displayport','ethernet','wifi','router','rgb','neon','laser','projector','car charger','car mount','dashcam','gps','sensor','detector','solar panel','solar light','stylus','pen tablet','drawing tablet'],
    secondary: ['tech','gadget','device','electronic','portable','rechargeable','mini speaker']
  },
  'kids-toys': {
    primary: ['toy','toys','kids','children','child','baby','infant','toddler','newborn','nursery','puzzle','lego','building block','construction toy','doll','action figure','plush','stuffed animal','teddy bear','board game','card game','dice game','educational','learning','montessori','stem','crayons','coloring','art set','craft kit','play dough','stroller','car seat','high chair','playpen','crib','baby bottle','pacifier','teether','sippy cup','bib','diaper','diaper bag','wipes','changing pad','baby clothes','onesie','romper baby','bicycle kids','scooter','skateboard','roller skates','sandbox','swing','slide','trampoline','bounce house','water gun','bubble','kite','frisbee','costume kids','dress up','pretend play','rc toy','remote control toy','train set','race track'],
    secondary: ['kid','boy','girl','school','backpack kids','lunchbox','pencil case']
  },
  'kitchen': {
    primary: ['kitchen','cooking','baking','cookware','bakeware','pan','pot','skillet','wok','dutch oven','saucepan','knife','knives','cutting board','chopping board','spatula','ladle','tongs','whisk','peeler','grater','can opener','bottle opener','corkscrew','wine opener','blender','mixer','food processor','juicer','toaster','microwave','oven','air fryer','instant pot','coffee maker','coffee grinder','espresso','french press','tea kettle','teapot','tea infuser','mug','tumbler','plate','bowl','dish','dinnerware','tableware','silverware','fork','spoon','chopstick','straw','reusable straw','food storage','container','tupperware','mason jar','canister','spice rack','spice jar','seasoning','salt pepper','oven mitt','pot holder','apron','kitchen towel','refrigerator','fridge','ice maker','ice tray','ice mold','lunch box','bento','thermos','insulated','cooler bag','measuring cup','measuring spoon','kitchen scale','rolling pin','pastry','cookie cutter','cake mold','cake pan','piping bag','fondant','frosting','wine glass','cocktail','bar tool','ice bucket','water filter','pitcher','dispenser'],
    secondary: ['food','meal','recipe','dining','breakfast','snack','beverage','drink']
  }
};

function matchCategory(productName, categories) {
  const nameLower = productName.toLowerCase();
  for (const [slug, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords.primary) {
      if (nameLower.includes(kw.toLowerCase())) {
        const cat = categories.find(c => c.slug === slug);
        if (cat) return { category: cat, keyword: kw, confidence: 'primary' };
      }
    }
  }
  for (const [slug, keywords] of Object.entries(CATEGORY_MAP)) {
    for (const kw of keywords.secondary) {
      if (nameLower.includes(kw.toLowerCase())) {
        const cat = categories.find(c => c.slug === slug);
        if (cat) return { category: cat, keyword: kw, confidence: 'secondary' };
      }
    }
  }
  return null;
}

async function main() {
  console.log('=== Fix Uncategorized Products ===\n');
  const categories = await supabaseGet('mi_categories', 'select=id,slug,name');
  console.log(`Found ${categories.length} categories:`);
  categories.forEach(c => console.log(`  - ${c.name} (${c.slug})`));

  const products = await supabaseGet('mi_products',
    'category_id=is.null&select=id,name,cj_pid&status=eq.active&order=name.asc&limit=1000');
  console.log(`\nFound ${products.length} uncategorized products\n`);

  if (products.length === 0) { console.log('All products are categorized!'); return; }

  let matched = 0, unmatched = 0;
  const unmatchedProducts = [];
  const categoryStats = {};

  for (const product of products) {
    const match = matchCategory(product.name, categories);
    if (match) {
      try {
        await supabasePatch('mi_products', `id=eq.${product.id}`, { category_id: match.category.id });
        matched++;
        const catName = match.category.name;
        categoryStats[catName] = (categoryStats[catName] || 0) + 1;
        if (matched % 25 === 0) console.log(`  Categorized ${matched} products...`);
      } catch (err) { console.error(`  Error updating ${product.name}: ${err.message}`); }
    } else {
      unmatched++;
      unmatchedProducts.push(product.name);
    }
    await new Promise(r => setTimeout(r, 100));
  }

  console.log('\n=== Results ===');
  console.log(`Categorized: ${matched}`);
  console.log(`Still uncategorized: ${unmatched}`);
  if (Object.keys(categoryStats).length > 0) {
    console.log('\nBy category:');
    for (const [cat, count] of Object.entries(categoryStats).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${cat}: +${count}`);
    }
  }
  if (unmatchedProducts.length > 0) {
    console.log(`\n=== Still Uncategorized (${unmatchedProducts.length}) ===`);
    unmatchedProducts.forEach(name => console.log(`  - ${name}`));
  }
}

main().catch(err => { console.error('Fatal error:', err); process.exit(1); });