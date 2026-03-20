const fs = require('fs');
const path = require('path');

// ============================================================
// DRY_RUN — set to false to execute updates
// ============================================================
const DRY_RUN = false;
const PRODUCT_ID = '8e3a80a3-6e8f-4682-a0a5-2d88e98f4885';

// Load env
const envPath = path.join(__dirname, '..', '.env.local');
const env = {};
fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) env[line.substring(0, idx).trim()] = line.substring(idx + 1).trim();
});
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseGet(table, query) {
  const res = await fetch(`${URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  });
  if (!res.ok) throw new Error(`GET ${table} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePatch(table, id, body) {
  const res = await fetch(`${URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${table} id=${id} failed: ${res.status} ${await res.text()}`);
}

async function main() {
  console.log(`\n=== activate-2pack-variants${DRY_RUN ? ' (DRY RUN)' : ''} ===\n`);

  // Fetch variants matching 2pc/2pcs/2 pcs/2pieces patterns
  const variants = await supabaseGet(
    'mi_product_variants',
    `select=id,name,retail_price,is_active,cj_price,product_id&product_id=eq.${PRODUCT_ID}&or=(name.ilike.*2pcs*,name.ilike.*2pc*,name.ilike.*2 pcs*,name.ilike.*2pieces*)`
  );

  console.log(`Found ${variants.length} matching variant(s):\n`);

  let updatedCount = 0;

  for (const v of variants) {
    console.log(`  [${v.id}] "${v.name}" — retail_price: $${v.retail_price?.toFixed(2) ?? 'null'}, is_active: ${v.is_active}`);

    if (DRY_RUN) {
      console.log(`    → WOULD UPDATE: $${v.retail_price?.toFixed(2) ?? 'null'} → $69.99, activate`);
    } else {
      await supabasePatch('mi_product_variants', v.id, {
        retail_price: 69.99,
        is_active: true,
      });
      console.log(`    → Updated "${v.name}" — was $${v.retail_price?.toFixed(2) ?? 'null'} → now $69.99, activated`);
    }
    updatedCount++;
  }

  // --- Targeted update: "white pink" variants ---
  console.log(`\n--- Checking "white pink" variants ---\n`);
  const whitePinkVariants = await supabaseGet(
    'mi_product_variants',
    `select=id,name,retail_price,is_active,cj_price,product_id&product_id=eq.${PRODUCT_ID}&name=ilike.*white pink*`
  );

  console.log(`Found ${whitePinkVariants.length} "white pink" variant(s):\n`);

  for (const v of whitePinkVariants) {
    console.log(`  [${v.id}] "${v.name}" — retail_price: $${v.retail_price?.toFixed(2) ?? 'null'}, is_active: ${v.is_active}`);

    if (DRY_RUN) {
      console.log(`    → WOULD UPDATE: $${v.retail_price?.toFixed(2) ?? 'null'} → $69.99, activate`);
    } else {
      await supabasePatch('mi_product_variants', v.id, {
        retail_price: 69.99,
        is_active: true,
      });
      console.log(`    → Updated "${v.name}" — was $${v.retail_price?.toFixed(2) ?? 'null'} → now $69.99, activated`);
    }
    updatedCount++;
  }

  console.log(`\n=== Summary ===`);
  console.log(`  Variants found: ${variants.length}`);
  console.log(`  Variants ${DRY_RUN ? 'would be' : ''} updated: ${updatedCount}`);
  if (DRY_RUN && updatedCount > 0) {
    console.log(`\n  Set DRY_RUN = false to execute updates.`);
  }
  console.log('');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
