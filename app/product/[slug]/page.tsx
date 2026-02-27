import { Metadata } from 'next';
import { fetchProductBySlug } from '@/lib/seo/fetchers';
import { SITE_URL, SITE_NAME } from '@/lib/seo/constants';
import { ProductJsonLd, BreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { ProductPageClient } from './ProductPageClient';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchProductBySlug(params.slug);
  if (!product) {
    return { title: `Product Not Found | ${SITE_NAME}` };
  }

  const plainDescription =
    stripHtml(product.description).slice(0, 160) ||
    `Shop ${product.name} at ${SITE_NAME}. Free shipping on orders over $50.`;
  const title = `${product.name} | ${SITE_NAME}`;
  const image = product.images?.[0] || `${SITE_URL}/TransparentLogo.png`;

  return {
    title,
    description: plainDescription,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title,
      description: plainDescription,
      url: `/product/${product.slug}`,
      type: 'website',
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: plainDescription,
      images: [image],
    },
    other: {
      'product:price:amount': product.retail_price.toFixed(2),
      'product:price:currency': 'USD',
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await fetchProductBySlug(params.slug);

  const categoryName = product?.mi_categories?.name || 'Uncategorized';
  const categorySlug = product?.mi_categories?.slug || '';

  return (
    <>
      {product && (
        <>
          <ProductJsonLd
            name={product.name}
            description={product.description}
            slug={product.slug}
            images={product.images || []}
            price={product.retail_price}
            compareAtPrice={product.compare_at_price}
            inStock={product.stock_count > 0}
            rating={product.average_rating || 0}
            reviewCount={product.review_count || 0}
            categoryName={categoryName}
            sku={product.id}
          />
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: SITE_URL },
              {
                name: categoryName,
                url: `${SITE_URL}/category/${categorySlug}`,
              },
              {
                name: product.name,
                url: `${SITE_URL}/product/${product.slug}`,
              },
            ]}
          />
        </>
      )}
      <ProductPageClient params={params} initialData={product} />
    </>
  );
}
