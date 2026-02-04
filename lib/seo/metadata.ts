/**
 * Metadata Utilities
 *
 * Type-safe metadata generation for Next.js App Router.
 * Generates page-specific metadata with proper defaults.
 */

import { Metadata } from 'next';
import { SEO, PAGE_SEO } from './constants';

/**
 * Metadata generation options
 */
export interface MetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  noIndex?: boolean;
  canonical?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
}

/**
 * Generate metadata for a page
 */
export function generateMetadata(options: MetadataOptions = {}): Metadata {
  const {
    title = SEO.metadata.title.default,
    description = SEO.metadata.description,
    keywords = SEO.metadata.keywords,
    image = '/og-image.png',
    noIndex = false,
    canonical,
    alternates,
  } = options;

  const metadata: Metadata = {
    metadataBase: new URL(SEO.site.url),
    title,
    description,
    keywords,
    authors: [{ name: SEO.company.name }],
    creator: SEO.company.name,
    publisher: SEO.company.name,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: 'website',
      locale: SEO.locale.default,
      url: SEO.site.url,
      siteName: SEO.site.name,
      title,
      description,
      images: [
        {
          url: image,
          width: SEO.images.og.width,
          height: SEO.images.og.height,
          alt: SEO.images.og.alt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: SEO.social.twitter,
      images: [image],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };

  // Add canonical URL if provided
  if (canonical || alternates) {
    metadata.alternates = {
      canonical: canonical || alternates?.canonical,
      ...alternates,
    };
  }

  return metadata;
}

/**
 * Generate metadata for specific pages
 */
export const pageMetadata = {
  home: (): Metadata => generateMetadata({
    title: PAGE_SEO.home.title,
    description: PAGE_SEO.home.description,
    keywords: PAGE_SEO.home.keywords,
  }),

  app: (): Metadata => generateMetadata({
    title: PAGE_SEO.app.title,
    description: PAGE_SEO.app.description,
    keywords: PAGE_SEO.app.keywords,
  }),

  features: (): Metadata => generateMetadata({
    title: PAGE_SEO.features.title,
    description: PAGE_SEO.features.description,
    keywords: PAGE_SEO.features.keywords,
  }),

  privacy: (): Metadata => generateMetadata({
    title: PAGE_SEO.privacy.title,
    description: PAGE_SEO.privacy.description,
    keywords: PAGE_SEO.privacy.keywords,
  }),

  security: (): Metadata => generateMetadata({
    title: PAGE_SEO.security.title,
    description: PAGE_SEO.security.description,
    keywords: PAGE_SEO.security.keywords,
  }),

  terms: (): Metadata => generateMetadata({
    title: PAGE_SEO.terms.title,
    description: PAGE_SEO.terms.description,
    keywords: PAGE_SEO.terms.keywords,
  }),

  help: (): Metadata => generateMetadata({
    title: PAGE_SEO.help.title,
    description: PAGE_SEO.help.description,
    keywords: PAGE_SEO.help.keywords,
  }),

  docs: (): Metadata => generateMetadata({
    title: PAGE_SEO.docs.title,
    description: PAGE_SEO.docs.description,
    keywords: PAGE_SEO.docs.keywords,
  }),
};

/**
 * Generate Open Graph image URL
 */
export function generateOGImageUrl(options: {
  title?: string;
  subtitle?: string;
  theme?: 'dark' | 'light';
}): string {
  const params = new URLSearchParams();

  if (options.title) params.set('title', options.title);
  if (options.subtitle) params.set('subtitle', options.subtitle);
  if (options.theme) params.set('theme', options.theme);

  return `/api/og?${params.toString()}`;
}

/**
 * Generate Twitter card configuration
 */
export function generateTwitterCard(options: {
  title: string;
  description: string;
  image?: string;
}): Metadata['twitter'] {
  return {
    card: 'summary_large_image',
    title: options.title,
    description: options.description,
    creator: SEO.social.twitter,
    images: [options.image || '/og-image.png'],
  };
}

/**
 * Generate canonical URL
 */
export function generateCanonicalUrl(path: string): string {
  return `${SEO.site.url}${path}`;
}
