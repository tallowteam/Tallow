/**
 * Analytics Module
 *
 * Privacy-friendly analytics using Plausible.
 * No cookies, no PII, respects DNT.
 *
 * @module analytics
 */

// Export analytics singleton
export { analytics, PlausibleAnalytics } from './plausible';

// Export types
export type {
  PlausibleEventProps,
  TransferStartedProps,
  TransferCompletedProps,
  ThemeChangedProps,
  LanguageChangedProps,
} from './plausible';

// Export provider and hooks
export { AnalyticsProvider, useAnalytics } from './analytics-provider';

// ============================================================================
// CONVENIENCE EXPORT
// ============================================================================

/**
 * Track a custom event
 *
 * @example
 * ```ts
 * import { trackEvent } from '@/lib/analytics';
 *
 * trackEvent('button_clicked', { buttonName: 'download' });
 * ```
 */
export { analytics as trackEvent } from './plausible';
