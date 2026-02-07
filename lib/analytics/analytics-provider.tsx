'use client';

/**
 * Analytics Provider Component
 *
 * Wraps the app and initializes Plausible analytics.
 * Tracks page views on route changes automatically.
 *
 * @module analytics/analytics-provider
 */

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { analytics } from './plausible';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface AnalyticsProviderProps {
  children: React.ReactNode;
  domain?: string;
  apiHost?: string;
}

// ============================================================================
// ANALYTICS PROVIDER
// ============================================================================

export function AnalyticsProvider({
  children,
  domain,
  apiHost,
}: AnalyticsProviderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize analytics on mount
  useEffect(() => {
    // Check for environment variable
    const plausibleDomain =
      domain || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    const plausibleApiHost =
      apiHost || process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST;

    if (!plausibleDomain) {
      console.log('[Analytics] Plausible domain not configured, skipping initialization');
      return;
    }

    // Initialize Plausible
    analytics.init(plausibleDomain, plausibleApiHost);

    console.log('[Analytics] Initialized with domain:', plausibleDomain);
  }, [domain, apiHost]);

  // Track pageviews on route changes
  useEffect(() => {
    if (!analytics.isEnabled()) {
      return;
    }

    // Build full URL with search params
    const url = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    // Small delay to ensure the page has loaded
    const timeout = setTimeout(() => {
      analytics.trackPageview(url);
      console.log('[Analytics] Pageview tracked:', url);
    }, 0);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  return <>{children}</>;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access analytics instance
 */
export function useAnalytics() {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageview: analytics.trackPageview.bind(analytics),
    trackTransferStarted: analytics.trackTransferStarted.bind(analytics),
    trackTransferCompleted: analytics.trackTransferCompleted.bind(analytics),
    trackRoomCreated: analytics.trackRoomCreated.bind(analytics),
    trackRoomJoined: analytics.trackRoomJoined.bind(analytics),
    trackFriendAdded: analytics.trackFriendAdded.bind(analytics),
    trackThemeChanged: analytics.trackThemeChanged.bind(analytics),
    trackLanguageChanged: analytics.trackLanguageChanged.bind(analytics),
    isEnabled: analytics.isEnabled.bind(analytics),
    setConsent: analytics.setConsent.bind(analytics),
  };
}
