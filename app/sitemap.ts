import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tallow.app';
  const currentDate = new Date();

  // Static routes
  const routes = [
    '',
    '/features',
    '/security',
    '/pricing',
    '/about',
    '/docs',
    '/transfer',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
