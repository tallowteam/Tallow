'use client';

/**
 * RouteErrorFallback -- Shared error recovery UI for all route error.tsx files.
 *
 * Features:
 *   - Error classification (network / crypto / transfer / permission / unknown)
 *   - Auto-retry with exponential backoff for transient errors
 *   - Countdown timer visible to the user
 *   - Contextual recovery buttons (Retry, Resume, Reconnect, Report, Go Home)
 *   - Copy-to-clipboard error report
 *   - Accessible: focus management, aria-live region for retry status
 *   - CSS Modules using design tokens
 *
 * @module components/error/RouteErrorFallback
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  classifyError,
  getRetryDelay,
  buildErrorReport,
  formatReportForClipboard,
  type ErrorResolution,
} from '@/lib/transfer/error-diplomat';
import styles from './route-error-fallback.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface RouteErrorFallbackProps {
  /** The error thrown by the route segment. */
  error: Error & { digest?: string };
  /** Next.js-provided reset function that re-renders the route segment. */
  reset: () => void;
  /** Human-readable name of the route, e.g. "Transfer" or "Settings". */
  routeName?: string;
  /** Where the "Go Home" / fallback link should point. Defaults to "/". */
  fallbackHref?: string;
  /** Label for the fallback link. Defaults to "Go Home". */
  fallbackLabel?: string;
  /**
   * Override the error classification. Useful when a route knows better
   * than the generic classifier what kind of error occurred.
   */
  overrideResolution?: Partial<ErrorResolution>;
}

// ============================================================================
// SVG ICONS (inline to avoid additional imports)
// ============================================================================

function WifiIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ErrorCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

const ICON_MAP: Record<ErrorResolution['iconVariant'], () => React.ReactElement> = {
  wifi: WifiIcon,
  lock: LockIcon,
  shield: ShieldIcon,
  warning: WarningIcon,
  error: ErrorCircleIcon,
};

const ICON_STYLE_MAP: Record<ErrorResolution['iconVariant'], string> = {
  wifi: styles.iconWifi ?? '',
  lock: styles.iconLock ?? '',
  shield: styles.iconShield ?? '',
  warning: styles.iconWarning ?? '',
  error: styles.iconError ?? '',
};

const BADGE_STYLE_MAP: Record<string, string> = {
  network: styles.badgeNetwork ?? '',
  crypto: styles.badgeCrypto ?? '',
  transfer: styles.badgeTransfer ?? '',
  permission: styles.badgePermission ?? '',
  unknown: styles.badgeUnknown ?? '',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function RouteErrorFallback({
  error,
  reset,
  routeName,
  fallbackHref = '/',
  fallbackLabel = 'Go Home',
  overrideResolution,
}: RouteErrorFallbackProps) {
  // --- Classify the error ---
  const baseResolution = classifyError(error);
  const resolution: ErrorResolution = overrideResolution
    ? { ...baseResolution, ...overrideResolution }
    : baseResolution;

  // --- Auto-retry state ---
  const [attempt, setAttempt] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoRetryExhausted, setAutoRetryExhausted] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // --- Focus heading on mount for screen readers ---
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  // --- Dev logging ---
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[RouteErrorFallback] ${resolution.kind} error on ${routeName ?? 'unknown route'}:`,
        error,
      );
    }
  }, [error, resolution.kind, routeName]);

  // --- Auto-retry engine ---
  const scheduleRetry = useCallback(() => {
    const { retryPolicy } = resolution;
    if (!resolution.retryable || attempt >= retryPolicy.maxAttempts) {
      setAutoRetryExhausted(true);
      return;
    }

    const delayMs = getRetryDelay(attempt, retryPolicy);
    const delaySeconds = Math.ceil(delayMs / 1000);
    setCountdown(delaySeconds);

    // Tick countdown every second
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    // Execute retry after delay
    timerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setCountdown(null);
      setAttempt((prev) => prev + 1);
      reset();
    }, delayMs);
  }, [attempt, resolution, reset]);

  useEffect(() => {
    if (resolution.retryable && attempt < resolution.retryPolicy.maxAttempts) {
      scheduleRetry();
    } else if (resolution.retryable && attempt >= resolution.retryPolicy.maxAttempts) {
      setAutoRetryExhausted(true);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [attempt, resolution.retryable, resolution.retryPolicy.maxAttempts, scheduleRetry]);

  // --- Manual retry (cancels auto-retry countdown) ---
  const handleManualRetry = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    setAttempt((prev) => prev + 1);
    reset();
  }, [reset]);

  // --- Copy error report to clipboard ---
  const handleCopyReport = useCallback(async () => {
    try {
      const report = buildErrorReport(error, resolution);
      const text = formatReportForClipboard(report);
      await navigator.clipboard.writeText(text);
      setCopyFeedback('Error details copied to clipboard');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch {
      // Fallback: select text in a hidden textarea
      setCopyFeedback('Could not access clipboard. Please try again.');
      setTimeout(() => setCopyFeedback(''), 3000);
    }
  }, [error, resolution]);

  // --- Render icon ---
  const IconComponent = ICON_MAP[resolution.iconVariant];
  const iconClassName = `${styles.iconBox} ${ICON_STYLE_MAP[resolution.iconVariant]}`;
  const badgeClassName = `${styles.kindBadge} ${BADGE_STYLE_MAP[resolution.kind] ?? styles.badgeUnknown}`;

  return (
    <div className={styles.container} role="alert">
      {/* Error Icon */}
      <div className={iconClassName}>
        <IconComponent />
      </div>

      {/* Kind badge */}
      <div className={badgeClassName}>{resolution.kind}</div>

      {/* Contextual page name */}
      {routeName && (
        <p className={styles.contextLine}>
          Error on the {routeName} page
        </p>
      )}

      {/* Headline -- focusable for a11y */}
      <h2
        ref={headingRef}
        className={styles.headline}
        tabIndex={-1}
      >
        {resolution.headline}
      </h2>

      {/* Guidance */}
      <p className={styles.guidance}>{resolution.guidance}</p>

      {/* Auto-retry countdown (aria-live for screen readers) */}
      <div aria-live="polite" aria-atomic="true">
        {countdown !== null && (
          <div className={styles.retryStatus}>
            <span className={styles.spinner} />
            Retrying in {countdown}s (attempt {attempt + 1} of{' '}
            {resolution.retryPolicy.maxAttempts})
          </div>
        )}

        {autoRetryExhausted && resolution.retryable && (
          <p className={styles.retryExhausted}>
            Automatic retries exhausted. You can still retry manually.
          </p>
        )}
      </div>

      {/* Recovery actions */}
      <div className={styles.actions}>
        {resolution.actions.map((action) => {
          switch (action) {
            case 'retry':
              return (
                <button
                  key="retry"
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleManualRetry}
                >
                  Try Again
                </button>
              );
            case 'resume':
              return (
                <button
                  key="resume"
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleManualRetry}
                >
                  Resume Transfer
                </button>
              );
            case 'reconnect':
              return (
                <button
                  key="reconnect"
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleManualRetry}
                >
                  Reconnect
                </button>
              );
            case 'request-permission':
              return (
                <button
                  key="request-permission"
                  type="button"
                  className={styles.btnPrimary}
                  onClick={handleManualRetry}
                >
                  Grant Permission
                </button>
              );
            case 'report':
              return (
                <button
                  key="report"
                  type="button"
                  className={styles.btnGlass}
                  onClick={handleCopyReport}
                  aria-label="Copy error details to clipboard for bug reporting"
                >
                  <ClipboardIcon />
                  Copy Error Report
                </button>
              );
            case 'go-home':
              return (
                <Link
                  key="go-home"
                  href={fallbackHref}
                  className={styles.btnGlass}
                >
                  {fallbackLabel}
                </Link>
              );
            default:
              return null;
          }
        })}
      </div>

      {/* Copy feedback */}
      <div className={styles.copyFeedback} aria-live="polite">
        {copyFeedback}
      </div>
    </div>
  );
}
