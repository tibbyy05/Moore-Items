import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/products/', '/api/categories/', '/api/reviews/', '/api/search/', '/api/feeds/'],
      disallow: ['/admin', '/api/admin/', '/api/webhooks/', '/api/checkout/', '/api/subscribe/', '/api/account/', '/api/downloads/', '/api/orders/', '/auth', '/account'],
    },
    sitemap: [
      'https://www.mooreitems.com/sitemap.xml',
      'https://www.mooreitems.com/api/feeds/google-merchant',
    ],
  };
}
