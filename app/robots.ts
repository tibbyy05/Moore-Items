import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/auth', '/account'],
    },
    sitemap: 'https://mooreitems.com/sitemap.xml',
  };
}
