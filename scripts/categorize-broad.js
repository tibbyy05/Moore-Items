const fs = require('fs');
const path = require('path');
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => { const eq = line.indexOf('='); if (eq > 0) env[line.substring(0,eq).trim()] = line.substring(eq+1).trim(); });
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// Broader keyword patterns - order matters (first match wins)
const CATEGORY_RULES = [
  // Fashion (very broad - catches clothing items)
  { slug: 'fashion', patterns: [
    /\b(dress|dresses|shirt|shirts|blouse|top|tops|sweater|hoodie|hoodies|sweatshirt|jacket|coat|pants|jeans|leggings|skirt|jumpsuit|romper|cardigan|vest|trench|blazer|shorts|overalls)\b/i,
    /\b(women'?s|men'?s|ladies|unisex)\b.*\b(casual|elegant|fashion|slim|loose|vintage)\b/i,
    /\b(sleeve|sleeveless|long.?sleeve|short.?sleeve|v.?neck|crew.?neck|round.?neck|collar)\b/i,
    /\b(pullover|tunic|bodysuit|lingerie|underwear|bra|panties|socks|stockings|tights)\b/i,
    /\b(lace|crochet|knitted|embroidery|pleated|ruffle)\b.*\b(top|dress|skirt|shirt)\b/i,
    /\b(plus.?size|slim.?fit|loose.?fit|oversized)\b.*\b(women|shirt|dress|top|coat)\b/i,
    /\b(spring|summer|autumn|fall|winter)\b.*\b(new|fashion|casual|women|men)\b.*\b(shirt|dress|top|coat|jacket|sweater)\b/i,
    /\b(padded.?jacket|down.?jacket|puffer|trousers|joggers)\b/i,
    /\b(backless|off.?shoulder|halter|strapless|wrap.?dress)\b/i,
    /\b(hair\s+vendor|hair\s+unprocessed|wig|wigs|hairpiece|extensions)\b/i,
    /\b(handbag|purse|tote.?bag|clutch|crossbody|shoulder.?bag|wallet|backpack)\b/i,
    /\b(scarf|scarves|hat|cap|beanie|gloves|belt|suspenders|tie|bow.?tie)\b/i,
    /\b(sneaker|sneakers|sandal|sandals|heel|heels|boot|boots|loafer|slipper|slippers|shoe|shoes)\b/i,
    /\b(y2k|korean|european|retro|vintage)\b.*\b(fashion|style|women|dress|top)\b/i,
  ]},
  // Health & Beauty
  { slug: 'health-beauty', patterns: [
    /\b(cream|serum|moisturiz|lotion|cleanser|toner|sunscreen|spf|skincare|skin.?care)\b/i,
    /\b(makeup|cosmetic|lipstick|lip.?tint|lip.?gloss|mascara|eyeliner|eyeshadow|foundation|concealer|blush|bronzer|primer)\b/i,
    /\b(shampoo|conditioner|hair.?care|hair.?oil|hair.?mask|hair.?serum)\b/i,
    /\b(perfume|cologne|fragrance|deodorant)\b/i,
    /\b(vitamin|supplement|protein|collagen|probiotic)\b/i,
    /\b(massage|massager|acupressure|therapy|therapeutic)\b/i,
    /\b(dental|toothbrush|floss|whitening|oral.?care)\b/i,
    /\b(eelhoe|phofay|psoriasis|derma|acne|anti.?aging|wrinkle|repair.?cream)\b/i,
    /\b(nail.?art|nail.?polish|manicure|pedicure)\b/i,
    /\b(eye.?drop|eye.?cream|eye.?mask|eye.?repair|lash|eyelash)\b/i,
    /\b(razor|shaver|trimmer|epilator|wax)\b/i,
    /\b(scale|weight.?scale|body.?fat|fitness.?tracker|blood.?pressure|thermometer)\b/i,
  ]},
  // Home & Garden
  { slug: 'home-garden', patterns: [
    /\b(furniture|sofa|couch|table|desk|chair|bed|mattress|shelf|shelves|bookcase|cabinet|dresser|wardrobe)\b/i,
    /\b(canopy|pergola|greenhouse|garden|patio|lawn|fence|planter|flower.?stand|plant.?stand)\b/i,
    /\b(curtain|curtains|rug|carpet|mat|cushion|pillow|blanket|duvet|comforter|bedding)\b/i,
    /\b(lamp|light|lighting|chandelier|pendant|sconce|lantern|led.?strip)\b/i,
    /\b(storage|organizer|basket|bin|rack|hanger|hook|drawer|closet)\b/i,
    /\b(door|window|lock|knob|handle|hinge|latch)\b/i,
    /\b(paint|wallpaper|tile|grout|adhesive|sealant|caulk)\b/i,
    /\b(mop|broom|vacuum|dustpan|cleaning|cleaner)\b/i,
    /\b(wrench|plier|hammer|drill|saw|screwdriver|welder|welding|mig)\b/i,
    /\b(trailer|winch|jack|tow|hitch|ramp|dolly|chock)\b/i,
    /\b(candle|vase|frame|mirror|clock|decor|decoration|ornament)\b/i,
    /\b(towel|shower|bath|faucet|sink|toilet|plumb)\b/i,
    /\b(watercolor|art.?supplies|canvas|easel|paint.?brush)\b/i,
    /\b(tire|wheel|axle|motorcycle|atv|utv)\b/i,
    /\b(straps|rope|chain|wire|cable|cord)\b.*\b(heavy|load|capacity|lbs|duty)\b/i,
  ]},
  // Electronics
  { slug: 'electronics', patterns: [
    /\b(phone|tablet|laptop|computer|monitor|keyboard|mouse|headphone|earphone|earbud|speaker|bluetooth|wireless|usb|charger|cable|adapter|hub)\b/i,
    /\b(camera|webcam|drone|gopro|gimbal|tripod|microphone|mic)\b/i,
    /\b(smart.?watch|smartwatch|fitness.?band|gps|tracker)\b/i,
    /\b(battery|power.?bank|solar|led|projector|screen|display)\b/i,
    /\b(router|modem|wifi|ethernet|network|switch)\b/i,
    /\b(vr|virtual.?reality|gaming|controller|console|joystick)\b/i,
    /\b(refrigerant|hvac|digital|sensor|detector|alarm|thermostat)\b/i,
  ]},
  // Kitchen
  { slug: 'kitchen', patterns: [
    /\b(kitchen|cookware|bakeware|utensil|spatula|ladle|whisk|tong|peeler)\b/i,
    /\b(pot|pan|skillet|wok|griddle|grill|oven|microwave|toaster|blender|mixer|juicer|processor)\b/i,
    /\b(cup|mug|glass|bottle|tumbler|thermos|kettle|teapot|coffee)\b/i,
    /\b(plate|bowl|dish|tray|cutting.?board|knife.?set|chef.?knife|chopping)\b/i,
    /\b(food.?storage|container|lunch.?box|jar|canister)\b/i,
    /\b(spice|seasoning|recipe|apron|oven.?mitt)\b/i,
  ]},
  // Pet Supplies
  { slug: 'pet-supplies', patterns: [
    /\b(pet|dog|cat|puppy|kitten|bird|fish|aquarium|hamster|rabbit|reptile)\b/i,
    /\b(collar|leash|harness|kennel|crate|carrier|cage|terrarium)\b/i,
    /\b(pet.?bed|pet.?toy|chew|scratching|litter|feeder|fountain)\b/i,
  ]},
  // Kids & Toys
  { slug: 'kids-toys', patterns: [
    /\b(toy|toys|game|games|puzzle|puzzles|lego|block|blocks|doll|dolls|action.?figure)\b/i,
    /\b(baby|infant|toddler|newborn|stroller|crib|playpen|highchair|car.?seat)\b/i,
    /\b(children|child|kid|kids|boy|girl)\b.*\b(gift|play|learn|education)\b/i,
    /\b(bounce|bouncy|trampoline|slide|swing|sandbox|playhouse)\b/i,
    /\b(diaper|pacifier|teether|bottle|sippy|bib|onesie)\b/i,
  ]},
  // Jewelry
  { slug: 'jewelry', patterns: [
    /\b(necklace|bracelet|earring|ring|pendant|anklet|brooch|cufflink)\b/i,
    /\b(gold|silver|diamond|crystal|gemstone|pearl|zircon|titanium)\b.*\b(jewelry|jewel|chain|band|set)\b/i,
    /\b(stainless.?steel|sterling|14k|18k|24k)\b.*\b(ring|necklace|bracelet|earring|chain|pendant)\b/i,
    /\b(watch|watches|wristwatch|timepiece)\b/i,
  ]},
];

async function main() {
  console.log('=== Broad Categorizer V2 ===\n');

  // Get categories
  const catRes = await fetch(`${URL}/rest/v1/mi_categories?select=id,slug,name`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  const categories = await catRes.json();
  const catMap = {};
  categories.forEach(c => catMap[c.slug] = c.id);
  console.log('Categories:', Object.keys(catMap).join(', '));

  // Get uncategorized products
  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(`${URL}/rest/v1/mi_products?select=id,name&status=eq.active&category_id=is.null&limit=500&offset=${offset}`, {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
    });
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  console.log(`Found ${all.length} uncategorized products\n`);

  let categorized = 0;
  let failed = 0;
  const unmatched = [];

  for (const product of all) {
    let matched = false;
    for (const rule of CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(product.name)) {
          const catId = catMap[rule.slug];
          if (!catId) { console.log(`  No category ID for ${rule.slug}`); break; }
          
          const res = await fetch(`${URL}/rest/v1/mi_products?id=eq.${product.id}`, {
            method: 'PATCH',
            headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({ category_id: catId }),
          });
          
          if (res.ok) {
            categorized++;
            matched = true;
          } else {
            failed++;
          }
          break;
        }
      }
      if (matched) break;
    }
    
    if (!matched) {
      unmatched.push(product.name);
    }

    if ((categorized + failed + unmatched.length) % 100 === 0) {
      console.log(`  Progress: ${categorized} categorized, ${unmatched.length} unmatched...`);
    }
    
    await new Promise(r => setTimeout(r, 20));
  }

  console.log(`\nDone! Categorized: ${categorized}, Unmatched: ${unmatched.length}, Errors: ${failed}`);
  
  if (unmatched.length > 0 && unmatched.length <= 50) {
    console.log('\nUnmatched products:');
    unmatched.forEach(n => console.log('  -', n));
  } else if (unmatched.length > 50) {
    console.log(`\nFirst 30 unmatched:`);
    unmatched.slice(0, 30).forEach(n => console.log('  -', n));
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });