import { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

const BASE_URL = 'https://www.mooreitems.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/shop`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${BASE_URL}/trending`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/deals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/new-arrivals`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/shipping-policy`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/returns`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/faq`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy-policy`, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Category pages
  const { data: categories } = await supabase
    .from('mi_categories')
    .select('slug, updated_at');

  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
    url: `${BASE_URL}/category/${cat.slug}`,
    lastModified: cat.updated_at ? new Date(cat.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  // Product pages (active only, fetched in batches)
  let allProducts: Array<{ slug: string; updated_at: string | null }> = [];
  let from = 0;
  const batchSize = 1000;

  while (true) {
    const { data } = await supabase
      .from('mi_products')
      .select('slug, updated_at')
      .eq('status', 'active')
      .range(from, from + batchSize - 1);

    if (!data || data.length === 0) break;
    allProducts = allProducts.concat(data);
    if (data.length < batchSize) break;
    from += batchSize;
  }

  const productPages: MetadataRoute.Sitemap = allProducts.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
