import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/products/', '/api/categories/', '/api/reviews/', '/api/search/', '/api/feeds/'],
      disallow: ['/admin', '/api/admin/', '/api/webhooks/', '/api/checkout/', '/api/subscribe/', '/api/account/', '/api/downloads/', '/api/orders/', '/auth', '/account'],
    },
    sitemap: [
      'https://mooreitems.com/sitemap.xml',
      'https://mooreitems.com/api/feeds/google-merchant',
    ],
  };
}
