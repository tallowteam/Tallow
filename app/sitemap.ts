import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tallow.app';
  const currentDate = new Date();

  // Primary routes (highest priority)
  const primaryRoutes = [
    '',
    '/features',
    '/security',
    '/pricing',
    '/transfer',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.9,
  }));

  // Secondary routes
  const secondaryRoutes = [
    '/about',
    '/how-it-works',
    '/docs',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Documentation routes
  const docsRoutes = [
    '/docs/api',
    '/docs/architecture',
    '/docs/guides',
    '/docs/guides/getting-started',
    '/docs/guides/local-transfer',
    '/docs/guides/internet-transfer',
    '/docs/guides/security',
    '/docs/hooks',
    '/docs/playground',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Legal / info routes
  const legalRoutes = [
    '/privacy',
    '/terms',
    '/settings',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'yearly' as const,
    priority: 0.5,
  }));

  return [...primaryRoutes, ...secondaryRoutes, ...docsRoutes, ...legalRoutes];
}
