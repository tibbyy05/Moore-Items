require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
});

const fs = require('fs');
const path = require('path');
const { PRICING_CONFIG } = require('../lib/config/pricing');
const { calculatePricing, computeCompareAtPrice } = require('../lib/pricing');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach((line) => {
  const eq = line.indexOf('=');
  if (eq > 0) env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
});
const URL = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function main() {
  console.log('=== Reprice catalog ===\n');
  const all = [];
  let offset = 0;
  while (true) {
    const res = await fetch(
      `${URL}/rest/v1/mi_products?select=id,cj_price,shipping_cost,retail_price,compare_at_price,status&status=eq.active&limit=500&offset=${offset}`,
      {
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
      }
    );
    const batch = await res.json();
    if (!batch || batch.length === 0) break;
    all.push(...batch);
    offset += 500;
    if (batch.length < 500) break;
  }
  console.log(`Found ${all.length} products`);

  let updated = 0;
  let skipped = 0;
  for (const p of all) {
    const cjPrice = parseFloat(String(p.cj_price || 0));
    if (!Number.isFinite(cjPrice) || cjPrice <= 0) {
      skipped += 1;
      continue;
    }

    const shippingCost =
      Number.isFinite(Number(p.shipping_cost))
        ? Number(p.shipping_cost)
        : PRICING_CONFIG.shippingCostEstimate;
    const pricing = calculatePricing(cjPrice, shippingCost, PRICING_CONFIG.markupMultiplier);

    if (!pricing.isViable) {
      skipped += 1;
      continue;
    }

    const newCompare = computeCompareAtPrice(pricing.retailPrice);

    const res = await fetch(`${URL}/rest/v1/mi_products?id=eq.${p.id}`, {
      method: 'PATCH',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        retail_price: pricing.retailPrice,
        compare_at_price: newCompare,
        stripe_fee: pricing.stripeFee,
        total_cost: pricing.totalCost,
        margin_dollars: pricing.marginDollars,
        margin_percent: pricing.marginPercent,
        markup_multiplier: PRICING_CONFIG.markupMultiplier,
      }),
    });
    if (res.ok) updated++;
    if (updated % 100 === 0) console.log(`  ${updated}/${all.length}...`);
    await new Promise(r => setTimeout(r, 30));
  }
  console.log(`\nDone! Updated ${updated} prices. Skipped ${skipped} products`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });