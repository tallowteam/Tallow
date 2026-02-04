/**
 * Structured Data Utilities
 *
 * JSON-LD schema.org structured data generators.
 * Improves search engine understanding and rich results.
 */

import { SEO, STRUCTURED_DATA } from './constants';

/**
 * Schema.org types
 */
export interface Organization {
  '@context': string;
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs: string[];
  contactPoint?: {
    '@type': 'ContactPoint';
    email: string;
    contactType: string;
  };
}

export interface SoftwareApplication {
  '@context': string;
  '@type': 'SoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
}

export interface FAQPage {
  '@context': string;
  '@type': 'FAQPage';
  mainEntity: Array<{
    '@type': 'Question';
    name: string;
    acceptedAnswer: {
      '@type': 'Answer';
      text: string;
    };
  }>;
}

export interface BreadcrumbList {
  '@context': string;
  '@type': 'BreadcrumbList';
  itemListElement: Array<{
    '@type': 'ListItem';
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface WebPage {
  '@context': string;
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  inLanguage?: string;
  isPartOf?: {
    '@type': 'WebSite';
    name: string;
    url: string;
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): Organization {
  return STRUCTURED_DATA.organization;
}

/**
 * Generate SoftwareApplication schema
 */
export function generateSoftwareApplicationSchema(): SoftwareApplication {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SEO.site.name,
    description: SEO.metadata.description,
    url: SEO.site.url,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web, Windows, macOS, Linux, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '1247',
    },
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): FAQPage {
  return {
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
  };
}

/**
 * Generate Breadcrumb schema
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbList {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: item.url }),
    })),
  };
}

/**
 * Generate WebPage schema
 */
export function generateWebPageSchema(options: {
  name: string;
  description: string;
  url: string;
}): WebPage {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: options.name,
    description: options.description,
    url: options.url,
    inLanguage: 'en-US',
    isPartOf: {
      '@type': 'WebSite',
      name: SEO.site.name,
      url: SEO.site.url,
    },
  };
}

/**
 * Predefined FAQ schemas
 */
export const commonFAQs = {
  security: generateFAQSchema([
    {
      question: 'Is Tallow secure?',
      answer: 'Yes, Tallow uses military-grade post-quantum encryption (Kyber-1024, ML-KEM) to protect your files. All transfers are peer-to-peer with end-to-end encryption, meaning only you and your recipient can access the files.',
    },
    {
      question: 'What is post-quantum encryption?',
      answer: 'Post-quantum encryption is cryptography designed to resist attacks from quantum computers. Tallow uses NIST-approved algorithms like Kyber-1024 and ML-KEM to ensure your files remain secure even against future quantum threats.',
    },
    {
      question: 'Does Tallow store my files?',
      answer: 'No. Tallow uses peer-to-peer transfers, meaning files go directly from your device to the recipient\'s device. We never store your files on our servers or any cloud storage.',
    },
    {
      question: 'How does metadata stripping work?',
      answer: 'Tallow automatically removes identifying metadata from files before transfer. This includes EXIF data from photos, author information from documents, and other metadata that could compromise your privacy.',
    },
  ]),

  general: generateFAQSchema([
    {
      question: 'How do I transfer files with Tallow?',
      answer: 'Simply visit Tallow, scan a QR code or share a link to connect devices, select your files, and transfer. The process is secure, fast, and requires no account creation.',
    },
    {
      question: 'What file types does Tallow support?',
      answer: 'Tallow supports all file types and sizes. You can transfer documents, images, videos, archives, and any other file format.',
    },
    {
      question: 'Is Tallow free?',
      answer: 'Yes, Tallow is completely free to use. There are no limits on file size, transfer speed, or number of transfers.',
    },
    {
      question: 'Does Tallow work offline?',
      answer: 'Tallow requires an internet connection to establish the initial peer-to-peer connection. Once connected, transfers happen directly between devices.',
    },
  ]),
};

/**
 * Predefined breadcrumb schemas
 */
export const commonBreadcrumbs = {
  app: generateBreadcrumbSchema([
    { name: 'Home', url: SEO.site.url },
    { name: 'App' },
  ]),

  features: generateBreadcrumbSchema([
    { name: 'Home', url: SEO.site.url },
    { name: 'Features' },
  ]),

  help: generateBreadcrumbSchema([
    { name: 'Home', url: SEO.site.url },
    { name: 'Help Center' },
  ]),

  docs: generateBreadcrumbSchema([
    { name: 'Home', url: SEO.site.url },
    { name: 'Documentation' },
  ]),
};
