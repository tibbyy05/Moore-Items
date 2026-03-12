import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/products/', '/api/categories/', '/api/reviews/', '/api/search/', '/api/feeds/'],
      disallow: ['/admin', '/api/admin/', '/api/webhooks/', '/api/checkout/', '/api/subscribe/', '/api/account/', '/api/downloads/', '/api/orders/', '/auth', '/account', '/services/', '/lp/'],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/api/feeds/google-merchant`,
    ],
  };
}
