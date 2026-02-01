/**
 * Plausible Analytics Script Component
 * Loads the Plausible analytics script with privacy-first configuration
 */

'use client';

import Script from 'next/script';
import { secureLog } from '@/lib/utils/secure-logger';

const PLAUSIBLE_DOMAIN = process.env['NEXT_PUBLIC_PLAUSIBLE_DOMAIN'];
const PLAUSIBLE_HOST = process.env['NEXT_PUBLIC_PLAUSIBLE_HOST'] || 'https://plausible.io';

/**
 * Check if analytics should be loaded
 */
function shouldLoadAnalytics(): boolean {
  if (typeof window === 'undefined') {return false;}

  // Respect Do Not Track
  const dnt = navigator.doNotTrack || (window as any).doNotTrack || (navigator as any).msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') {
    return false;
  }

  // Disable in development
  if (process.env.NODE_ENV === 'development') {
    return false;
  }

  // Check if domain is configured
  if (!PLAUSIBLE_DOMAIN) {
    return false;
  }

  return true;
}

export function PlausibleScript() {
  // Don't render script if analytics should not be loaded
  if (!shouldLoadAnalytics()) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      src={`${PLAUSIBLE_HOST}/js/script.js`}
      strategy="afterInteractive"
      onLoad={() => {
        secureLog.debug('[Plausible] Analytics script loaded');
      }}
      onError={() => {
        secureLog.error('[Plausible] Failed to load analytics script');
      }}
    />
  );
}

/**
 * Extended Plausible script with custom events support
 * Use this if you want additional features like outbound link tracking
 */
export function PlausibleScriptExtended() {
  if (!shouldLoadAnalytics()) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={PLAUSIBLE_DOMAIN}
      // Use extended script for custom events, outbound links, etc.
      src={`${PLAUSIBLE_HOST}/js/script.outbound-links.js`}
      strategy="afterInteractive"
      onLoad={() => {
        secureLog.debug('[Plausible] Extended analytics script loaded');
      }}
      onError={() => {
        secureLog.error('[Plausible] Failed to load analytics script');
      }}
    />
  );
}
