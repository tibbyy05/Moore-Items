import { Metadata } from 'next';
import { fetchCategoryBySlug } from '@/lib/seo/fetchers';
import { SITE_URL, SITE_NAME } from '@/lib/seo/constants';
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from '@/lib/seo/json-ld';
import { CategoryPageClient } from './CategoryPageClient';

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace === -1) return truncated + '...';
  return truncated.slice(0, lastSpace) + '...';
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const category = await fetchCategoryBySlug(params.slug);
  if (!category) {
    return { title: `Category Not Found | ${SITE_NAME}` };
  }

  const title = `Shop ${category.name} Online - Free Shipping Over $50 | ${SITE_NAME}`;
  const description = category.description
    ? truncateAtWord(category.description, 155)
    : `Browse our curated selection of ${category.name.toLowerCase()} products. Free shipping on orders over $50.`;

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
        <>
          <BreadcrumbJsonLd
            items={[
              { name: 'Home', url: SITE_URL },
              {
                name: category.name,
                url: `${SITE_URL}/category/${category.slug}`,
              },
            ]}
          />
          <CollectionPageJsonLd
            name={category.name}
            description={
              category.description ||
              `Shop ${category.name} products at ${SITE_NAME}.`
            }
            url={`${SITE_URL}/category/${category.slug}`}
            productCount={0}
          />
          {category.faq_json && category.faq_json.length > 0 && (
            <FAQPageJsonLd faqs={category.faq_json} />
          )}
        </>
      )}
      <CategoryPageClient
        params={params}
        categoryDescription={category?.description || null}
        categoryFaqs={category?.faq_json || null}
      />
    </>
  );
}
