/**
 * scripts/fix-null-color-variants.js
 *
 * Deactivate (is_active=false, stock_count=0) all mi_product_variants
 * with color IS NULL or color = '-' for a specific product slug.
 *
 * Usage:  node scripts/fix-null-color-variants.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// ── Load .env.local ──────────────────────────────────────────────
const envPath = path.resolve(__dirname, '..', '.env.local');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i === -1) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const SLUG = 'vintage-court-lantern-sleeves-large-lapel-jacket-ybqy';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  // 1. Look up product
  const { data: product, error: prodErr } = await supabase
    .from('mi_products')
    .select('id, name')
    .eq('slug', SLUG)
    .single();

  if (prodErr || !product) {
    console.error('Product not found:', prodErr?.message);
    process.exit(1);
  }

  console.log(`Product: ${product.name} (${product.id})\n`);

  // 2. Find variants with null or '-' color
  const { data: targets, error: fetchErr } = await supabase
    .from('mi_product_variants')
    .select('id, cj_vid, color, size, stock_count, is_active')
    .eq('product_id', product.id)
    .or('color.is.null,color.eq.-');

  if (fetchErr) {
    console.error('Failed to query variants:', fetchErr.message);
    process.exit(1);
  }

  if (!targets || targets.length === 0) {
    console.log('No variants with null/"-" color found. Nothing to do.');
    return;
  }

  console.log(`Found ${targets.length} variants to deactivate:\n`);
  console.table(targets.map(v => ({
    cj_vid: v.cj_vid,
    color: v.color ?? '(null)',
    size: v.size,
    stock_count: v.stock_count,
    is_active: v.is_active,
  })));

  // 3. Deactivate them
  const ids = targets.map(v => v.id);
  const { data: updated, error: updateErr } = await supabase
    .from('mi_product_variants')
    .update({ is_active: false, stock_count: 0 })
    .in('id', ids)
    .select('id');

  if (updateErr) {
    console.error('Update failed:', updateErr.message);
    process.exit(1);
  }

  console.log(`\nUpdated ${updated.length} rows — set is_active=false, stock_count=0`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
