import { SITE_URL, SITE_NAME } from './constants';

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/TransparentLogo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          email: 'support@mooreitems.com',
          contactType: 'customer service',
        },
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      }}
    />
  );
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface ProductJsonLdProps {
  name: string;
  description: string;
  slug: string;
  images: string[];
  price: number;
  compareAtPrice: number | null;
  inStock: boolean;
  rating: number;
  reviewCount: number;
  categoryName: string;
  sku: string;
}

export function ProductJsonLd(props: ProductJsonLdProps) {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: props.name,
    description: stripHtml(props.description).slice(0, 5000),
    image: props.images.slice(0, 5),
    url: `${SITE_URL}/product/${props.slug}`,
    sku: props.sku,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: props.categoryName,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/product/${props.slug}`,
      priceCurrency: 'USD',
      price: props.price.toFixed(2),
      availability: props.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: SITE_NAME },
    },
  };

  if (props.reviewCount > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: props.rating.toFixed(1),
      reviewCount: props.reviewCount,
    };
  }

  return <JsonLdScript data={data} />;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}

interface CollectionPageJsonLdProps {
  name: string;
  description: string;
  url: string;
  productCount: number;
}

export function CollectionPageJsonLd(props: CollectionPageJsonLdProps) {
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: props.name,
        description: props.description,
        url: props.url,
        numberOfItems: props.productCount,
        provider: {
          '@type': 'Organization',
          name: SITE_NAME,
          url: SITE_URL,
        },
      }}
    />
  );
}

interface FaqItem {
  question: string;
  answer: string;
}

export function FAQPageJsonLd({ faqs }: { faqs: FaqItem[] }) {
  if (faqs.length === 0) return null;
  return (
    <JsonLdScript
      data={{
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      }}
    />
  );
}
