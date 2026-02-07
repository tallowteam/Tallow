'use client';

/**
 * Cookie Banner Component
 *
 * Minimal privacy banner for analytics consent.
 * Shows once, stores consent in localStorage.
 *
 * @module components/ui/CookieBanner
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { analytics } from '@/lib/analytics';
import styles from './CookieBanner.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CookieBannerProps {
  /** Privacy policy page URL */
  privacyUrl?: string;
  /** Custom message */
  message?: string;
  /** Show decline button */
  showDecline?: boolean;
}

// ============================================================================
// COOKIE BANNER
// ============================================================================

export function CookieBanner({
  privacyUrl = '/privacy',
  message,
  showDecline = false,
}: CookieBannerProps) {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if consent already given
  useEffect(() => {
    setMounted(true);

    try {
      const consent = localStorage.getItem('tallow-analytics-consent');
      const bannerDismissed = localStorage.getItem('tallow-banner-dismissed');

      // Show banner if no consent recorded and banner not dismissed
      if (consent === null && bannerDismissed !== 'true') {
        setVisible(true);
      }
    } catch (error) {
      console.warn('[CookieBanner] Failed to read consent:', error);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('tallow-analytics-consent', 'true');
      localStorage.setItem('tallow-banner-dismissed', 'true');
      analytics.setConsent(true);
      setVisible(false);
    } catch (error) {
      console.warn('[CookieBanner] Failed to save consent:', error);
    }
  };

  const handleDecline = () => {
    try {
      localStorage.setItem('tallow-analytics-consent', 'false');
      localStorage.setItem('tallow-banner-dismissed', 'true');
      analytics.setConsent(false);
      setVisible(false);
    } catch (error) {
      console.warn('[CookieBanner] Failed to save consent:', error);
    }
  };

  // Don't render on server or if not visible
  if (!mounted || !visible) {
    return null;
  }

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className={styles.container}>
        <div className={styles.content}>
          <svg
            className={styles.icon}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>

          <p className={styles.message}>
            {message || (
              <>
                <strong>Privacy-friendly analytics.</strong> We use Plausible to
                understand how visitors interact with our site.{' '}
                <strong>No cookies, no tracking, no PII.</strong>{' '}
                <Link href={privacyUrl} className={styles.link}>
                  Learn more
                </Link>
              </>
            )}
          </p>
        </div>

        <div className={styles.actions}>
          {showDecline && (
            <button
              type="button"
              onClick={handleDecline}
              className={`${styles.button} ${styles.buttonSecondary}`}
              aria-label="Decline analytics"
            >
              Decline
            </button>
          )}
          <button
            type="button"
            onClick={handleAccept}
            className={`${styles.button} ${styles.buttonPrimary}`}
            aria-label="Accept analytics"
          >
            OK, Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default CookieBanner;
