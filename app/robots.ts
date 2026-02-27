import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/feeds/google-merchant'],
      disallow: ['/admin', '/api', '/auth', '/account'],
    },
    sitemap: [
      'https://www.mooreitems.com/sitemap.xml',
      'https://www.mooreitems.com/api/feeds/google-merchant',
    ],
  };
}
