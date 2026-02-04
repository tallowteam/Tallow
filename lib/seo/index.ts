/**
 * SEO Utilities
 *
 * Centralized exports for all SEO-related utilities.
 */

export * from './constants';
export * from './metadata';
export * from './structured-data';

// Re-export for convenience
export { SEO, PAGE_SEO, STRUCTURED_DATA } from './constants';
export { generateMetadata, pageMetadata, generateOGImageUrl, generateTwitterCard, generateCanonicalUrl } from './metadata';
export {
  generateOrganizationSchema,
  generateSoftwareApplicationSchema,
  generateFAQSchema,
  generateBreadcrumbSchema,
  generateWebPageSchema,
  commonFAQs,
  commonBreadcrumbs,
} from './structured-data';
