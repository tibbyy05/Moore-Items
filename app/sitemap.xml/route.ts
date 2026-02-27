import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://www.mooreitems.com';
const PRODUCTS_PER_PAGE = 24;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(date: string | null): string {
  if (!date) return '';
  return `<lastmod>${new Date(date).toISOString()}</lastmod>`;
}

function urlEntry(
  loc: string,
  opts: {
    lastmod?: string | null;
    changefreq: string;
    priority: number;
    imageUrl?: string | null;
  }
): string {
  let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>\n`;
  if (opts.lastmod) entry += `    ${formatDate(opts.lastmod)}\n`;
  entry += `    <changefreq>${opts.changefreq}</changefreq>\n`;
  entry += `    <priority>${opts.priority.toFixed(1)}</priority>\n`;
  if (opts.imageUrl) {
    entry += `    <image:image>\n      <image:loc>${escapeXml(opts.imageUrl)}</image:loc>\n    </image:image>\n`;
  }
  entry += `  </url>`;
  return entry;
}

export async function GET() {
  const supabase = createAdminClient();

  // Static pages
  const staticEntries = [
    urlEntry(BASE_URL, { changefreq: 'daily', priority: 1.0 }),
    urlEntry(`${BASE_URL}/shop`, { changefreq: 'daily', priority: 0.8 }),
    urlEntry(`${BASE_URL}/trending`, { changefreq: 'daily', priority: 0.8 }),
    urlEntry(`${BASE_URL}/deals`, { changefreq: 'daily', priority: 0.8 }),
    urlEntry(`${BASE_URL}/new-arrivals`, { changefreq: 'daily', priority: 0.8 }),
    urlEntry(`${BASE_URL}/about`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/contact`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/faq`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/shipping-policy`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/returns`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/privacy-policy`, { changefreq: 'monthly', priority: 0.3 }),
    urlEntry(`${BASE_URL}/terms`, { changefreq: 'monthly', priority: 0.3 }),
  ];

  // Category pages
  const { data: categories } = await supabase
    .from('mi_categories')
    .select('slug, updated_at, product_count');

  const categoryEntries: string[] = [];
  for (const cat of categories || []) {
    categoryEntries.push(
      urlEntry(`${BASE_URL}/category/${cat.slug}`, {
        lastmod: cat.updated_at,
        changefreq: 'daily',
        priority: 0.8,
      })
    );

    // Paginated category pages
    const totalPages = Math.ceil((cat.product_count || 0) / PRODUCTS_PER_PAGE);
    for (let p = 2; p <= totalPages; p++) {
      categoryEntries.push(
        urlEntry(`${BASE_URL}/category/${cat.slug}?page=${p}`, {
          lastmod: cat.updated_at,
          changefreq: 'daily',
          priority: 0.5,
        })
      );
    }
  }

  // Product pages (batched fetch)
  let allProducts: Array<{
    slug: string;
    updated_at: string | null;
    images: string[] | null;
  }> = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data } = await supabase
      .from('mi_products')
      .select('slug, updated_at, images')
      .eq('status', 'active')
      .range(from, from + batchSize - 1);

    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  const productEntries = allProducts.map((product) =>
    urlEntry(`${BASE_URL}/product/${product.slug}`, {
      lastmod: product.updated_at,
      changefreq: 'weekly',
      priority: 0.6,
      imageUrl: product.images?.[0] || null,
    })
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${[...staticEntries, ...categoryEntries, ...productEntries].join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
