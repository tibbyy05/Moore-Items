// Run with: node scripts/export-products-excel.js
// Exports all mi_products to an Excel file with two sheets: Products + Summary

require('dotenv').config({ path: '.env.local' });
const XLSX = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OUTPUT_PATH = path.join(__dirname, 'output', 'mooreitems-master-product-list.xlsx');

async function fetchAllProducts() {
  const pageSize = 1000;
  let all = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('mi_products')
      .select('*, mi_categories(name)')
      .range(from, from + pageSize - 1)
      .order('name', { ascending: true });

    if (error) throw new Error('Supabase query failed: ' + error.message);
    if (!data || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return all;
}

function extractFromRaw(product, key) {
  if (!product.cj_raw_data) return '';
  try {
    const raw = typeof product.cj_raw_data === 'string'
      ? JSON.parse(product.cj_raw_data)
      : product.cj_raw_data;
    return raw[key] ?? '';
  } catch {
    return '';
  }
}

function autoWidth(sheet, data) {
  const colWidths = {};
  data.forEach((row) => {
    Object.keys(row).forEach((key) => {
      const len = String(row[key] ?? '').length;
      const headerLen = key.length;
      const max = Math.max(len, headerLen);
      if (!colWidths[key] || max > colWidths[key]) {
        colWidths[key] = max;
      }
    });
  });

  sheet['!cols'] = Object.values(colWidths).map((w) => ({ wch: Math.min(w + 2, 50) }));
}

async function run() {
  console.log('Fetching all products...');
  const products = await fetchAllProducts();
  console.log(`Fetched ${products.length} products`);

  // Sort by category then name
  products.sort((a, b) => {
    const catA = (a.mi_categories?.name || 'Uncategorized').toLowerCase();
    const catB = (b.mi_categories?.name || 'Uncategorized').toLowerCase();
    if (catA < catB) return -1;
    if (catA > catB) return 1;
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

  // Build Products sheet data
  const rows = products.map((p) => ({
    'ID': p.id,
    'Name': p.name || '',
    'Status': p.status || '',
    'Category': p.mi_categories?.name || 'Uncategorized',
    'CJ PID': p.cj_pid || '',
    'CJ Price': p.cj_price != null ? Number(p.cj_price) : '',
    'Shipping Cost': p.shipping_cost != null ? Number(p.shipping_cost) : '',
    'Stripe Fee': p.stripe_fee != null ? Number(p.stripe_fee) : '',
    'Total Cost': p.total_cost != null ? Number(p.total_cost) : '',
    'Retail Price': p.retail_price != null ? Number(p.retail_price) : '',
    'Compare At Price': p.compare_at_price != null ? Number(p.compare_at_price) : '',
    'Margin $': p.margin_dollars != null ? Number(p.margin_dollars) : '',
    'Margin %': p.margin_percent != null ? Number(p.margin_percent) : '',
    'Warehouse': p.warehouse || '',
    'Stock Count': p.stock_count != null ? Number(p.stock_count) : '',
    'Weight (g)': extractFromRaw(p, 'productWeight'),
    'Pack Weight (g)': extractFromRaw(p, 'packingWeight'),
    'CJ Inventory': extractFromRaw(p, 'warehouseInventoryNum'),
    'Review Count': p.review_count != null ? Number(p.review_count) : 0,
    'Average Rating': p.average_rating != null ? Number(p.average_rating) : 0,
    'Shipping Estimate': p.shipping_estimate || '',
    'Has Description': !!(p.description && p.description.trim().length > 0),
    'Image Count': Array.isArray(p.images) ? p.images.length : 0,
    'Created At': p.created_at || '',
  }));

  const wb = XLSX.utils.book_new();

  // --- Products sheet ---
  const ws = XLSX.utils.json_to_sheet(rows);
  autoWidth(ws, rows);

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  // Also set as pane (xlsx uses '!freeze' or '!pane' depending on version)
  ws['!views'] = [{ state: 'frozen', ySplit: 1 }];

  // Bold + gray background on header row
  const headerRange = XLSX.utils.decode_range(ws['!ref']);
  for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!ws[addr]) continue;
    ws[addr].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
    };
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  // --- Summary sheet ---
  // Category counts
  const categoryCounts = {};
  const statusCounts = {};

  products.forEach((p) => {
    const cat = p.mi_categories?.name || 'Uncategorized';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    const status = p.status || 'unknown';
    statusCounts[status] = (statusCounts[status] || 0) + 1;
  });

  const summaryRows = [];
  summaryRows.push({ 'Metric': 'TOTAL PRODUCTS', 'Value': products.length });
  summaryRows.push({ 'Metric': '', 'Value': '' });
  summaryRows.push({ 'Metric': '--- BY STATUS ---', 'Value': '' });

  Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([status, count]) => {
      summaryRows.push({ 'Metric': status, 'Value': count });
    });

  summaryRows.push({ 'Metric': '', 'Value': '' });
  summaryRows.push({ 'Metric': '--- BY CATEGORY ---', 'Value': '' });

  Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => {
      summaryRows.push({ 'Metric': cat, 'Value': count });
    });

  const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
  autoWidth(summaryWs, summaryRows);

  // Bold header for summary
  for (let col = 0; col <= 1; col++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: col });
    if (!summaryWs[addr]) continue;
    summaryWs[addr].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: 'E5E7EB' } },
    };
  }

  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

  // Write file
  XLSX.writeFile(wb, OUTPUT_PATH);
  console.log(`\nExported to: ${OUTPUT_PATH}`);
  console.log(`Total rows: ${rows.length}`);
  console.log(`Statuses:`, statusCounts);
  console.log(`Categories: ${Object.keys(categoryCounts).length}`);
}

run().catch((err) => {
  console.error('Export failed:', err.message || err);
  process.exit(1);
});
