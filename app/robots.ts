/**
 * Robots.txt Generation
 *
 * Generates robots.txt for search engine crawlers.
 * Defines crawling rules and sitemap location.
 */

import { MetadataRoute } from 'next';
import { SEO } from '@/lib/seo/constants';

/**
 * Generate robots.txt configuration
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = SEO.site.url;

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/static/',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
      {
        userAgent: 'anthropic-ai',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
