import { createAdminClient } from '@/lib/supabase/admin';
import { getGoogleCategory } from '@/lib/seo/google-categories';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://www.mooreitems.com';
const BRAND = 'MooreItems';
const FREE_SHIPPING_THRESHOLD = 50;
const BATCH_SIZE = 1000;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}

function formatPrice(price: number): string {
  return `${price.toFixed(2)} USD`;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  retail_price: number;
  compare_at_price: number | null;
  images: string[] | null;
  stock_count: number;
  digital_file_path: string | null;
  mi_categories: { name: string; slug: string } | null;
}

function productToXml(product: ProductRow): string {
  const categorySlug = product.mi_categories?.slug || '';
  const categoryName = product.mi_categories?.name || 'General';
  const googleCat = getGoogleCategory(categorySlug);
  const description = truncate(stripHtml(product.description || ''), 5000);
  const title = truncate(product.name, 150);
  const images = product.images || [];
  const availability = product.stock_count > 0 ? 'in_stock' : 'out_of_stock';
  const shippingPrice = product.retail_price >= FREE_SHIPPING_THRESHOLD ? 0 : 4.99;

  let entry = `    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${SITE_URL}/product/${escapeXml(product.slug)}</g:link>
      <g:image_link>${images[0] ? escapeXml(images[0]) : ''}</g:image_link>\n`;

  for (let i = 1; i < Math.min(images.length, 6); i++) {
    entry += `      <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
  }

  // If compare_at_price exists and is higher, it's the original "was" price.
  // Google: price = original, sale_price = current selling price.
  if (product.compare_at_price && product.compare_at_price > product.retail_price) {
    entry += `      <g:price>${formatPrice(product.compare_at_price)}</g:price>\n`;
    entry += `      <g:sale_price>${formatPrice(product.retail_price)}</g:sale_price>\n`;
  } else {
    entry += `      <g:price>${formatPrice(product.retail_price)}</g:price>\n`;
  }

  entry += `      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(BRAND)}</g:brand>
      <g:product_type>${escapeXml(categoryName)}</g:product_type>
      <g:google_product_category>${googleCat.id}</g:google_product_category>
      <g:identifier_exists>false</g:identifier_exists>
      <g:shipping>
        <g:country>US</g:country>
        <g:price>${formatPrice(shippingPrice)}</g:price>
      </g:shipping>
    </item>`;

  return entry;
}

export async function GET() {
  try {
    const supabase = createAdminClient();

    let allProducts: ProductRow[] = [];
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from('mi_products')
        .select('id, name, slug, description, retail_price, compare_at_price, images, stock_count, digital_file_path, mi_categories(name, slug)')
        .eq('status', 'active')
        .is('digital_file_path', null)
        .range(from, from + BATCH_SIZE - 1);

      if (error) {
        return new Response(`<error>${escapeXml(error.message)}</error>`, {
          status: 500,
          headers: { 'Content-Type': 'application/xml' },
        });
      }

      if (!data || data.length === 0) break;
      allProducts = allProducts.concat(data as unknown as ProductRow[]);
      if (data.length < BATCH_SIZE) break;
      from += BATCH_SIZE;
    }

    const items = allProducts.map(productToXml).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(BRAND)} Product Feed</title>
    <link>${SITE_URL}</link>
    <description>Product feed for Google Merchant Center</description>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=21600, s-maxage=21600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><error>${escapeXml(message)}</error>`, {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
