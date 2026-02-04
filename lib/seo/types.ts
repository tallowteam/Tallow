/**
 * SEO Type Definitions
 *
 * TypeScript types for SEO utilities.
 * Ensures type safety across all SEO-related code.
 */

import { Metadata } from 'next';

/**
 * Open Graph image configuration
 */
export interface OGImageConfig {
  url: string;
  width: number;
  height: number;
  alt: string;
}

/**
 * Twitter card configuration
 */
export interface TwitterConfig {
  card: 'summary' | 'summary_large_image' | 'app' | 'player';
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  images?: string[];
}

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
 * SEO configuration structure
 */
export interface SEOConfig {
  site: {
    name: string;
    domain: string;
    url: string;
    tagline: string;
  };
  metadata: {
    title: {
      default: string;
      template: string;
    };
    description: string;
    keywords: string[];
  };
  social: {
    twitter: string;
    github: string;
    discord: string;
  };
  company: {
    name: string;
    email: string;
    support: string;
  };
  images: {
    og: OGImageConfig;
    twitter: Omit<OGImageConfig, 'url'> & { width: number; height: number };
  };
  locale: {
    default: string;
    supported: string[];
  };
}

/**
 * Page-specific SEO data structure
 */
export interface PageSEOData {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * FAQ item structure
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * Breadcrumb item structure
 */
export interface BreadcrumbItem {
  name: string;
  url?: string;
}

/**
 * Web page schema options
 */
export interface WebPageSchemaOptions {
  name: string;
  description: string;
  url: string;
}

/**
 * OG Image generation options
 */
export interface OGImageOptions {
  title?: string;
  subtitle?: string;
  theme?: 'dark' | 'light';
}

/**
 * Blog post metadata options
 */
export interface BlogPostMetadata {
  title: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  tags?: string[];
  image?: string;
}

/**
 * Product/Offer metadata options
 */
export interface ProductMetadata {
  name: string;
  description: string;
  price: string;
  currency: string;
  availability?: string;
  image?: string;
}

/**
 * Sitemap entry configuration
 */
export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Robots.txt rule configuration
 */
export interface RobotsRule {
  userAgent: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
  crawlDelay?: number;
}

/**
 * Type guard for checking if value is valid metadata
 */
export function isValidMetadata(value: unknown): value is Metadata {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('title' in value || 'description' in value)
  );
}

/**
 * Type guard for FAQ items
 */
export function isValidFAQItem(value: unknown): value is FAQItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'question' in value &&
    'answer' in value &&
    typeof (value as FAQItem).question === 'string' &&
    typeof (value as FAQItem).answer === 'string'
  );
}

/**
 * Type guard for breadcrumb items
 */
export function isValidBreadcrumbItem(value: unknown): value is BreadcrumbItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'name' in value &&
    typeof (value as BreadcrumbItem).name === 'string'
  );
}

/**
 * Helper type for schema.org types
 */
export type SchemaOrgType =
  | 'Organization'
  | 'WebSite'
  | 'WebPage'
  | 'SoftwareApplication'
  | 'FAQPage'
  | 'BreadcrumbList'
  | 'BlogPosting'
  | 'Article'
  | 'Product'
  | 'Offer'
  | 'ContactPoint'
  | 'ImageObject';

/**
 * Base schema interface
 */
export interface BaseSchema {
  '@context': 'https://schema.org';
  '@type': SchemaOrgType;
}

/**
 * Schema with ID
 */
export interface SchemaWithId extends BaseSchema {
  '@id': string;
}

/**
 * Helper type for JSON-LD any schema
 */
export type AnySchema = BaseSchema & Record<string, unknown>;
