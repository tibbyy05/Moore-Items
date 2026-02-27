import { Metadata } from 'next';
import { fetchCategoryBySlug } from '@/lib/seo/fetchers';
import { SITE_URL, SITE_NAME } from '@/lib/seo/constants';
import { BreadcrumbJsonLd } from '@/lib/seo/json-ld';
import { CategoryPageClient } from './CategoryPageClient';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await fetchCategoryBySlug(params.slug);
  if (!category) {
    return { title: `Category Not Found | ${SITE_NAME}` };
  }

  const title = `${category.name} | Shop ${category.name} at ${SITE_NAME}`;
  const description = `Browse our curated selection of ${category.name.toLowerCase()} products. Free shipping on orders over $50.`;

  return {
    title,
    description,
    alternates: { canonical: `/category/${params.slug}` },
    openGraph: {
      title,
      description,
      url: `/category/${params.slug}`,
      siteName: SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const category = await fetchCategoryBySlug(params.slug);

  return (
    <>
      {category && (
        <BreadcrumbJsonLd
          items={[
            { name: 'Home', url: SITE_URL },
            {
              name: category.name,
              url: `${SITE_URL}/category/${category.slug}`,
            },
          ]}
        />
      )}
      <CategoryPageClient params={params} />
    </>
  );
}
