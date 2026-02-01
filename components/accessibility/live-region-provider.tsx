'use client';

/**
 * Live Region Provider
 * Provides accessible live regions for dynamic content announcements
 * WCAG 2.1 AA Success Criterion 4.1.3 (Status Messages)
 *
 * Usage:
 * ```tsx
 * import { announce } from '@/components/accessibility/live-region-provider';
 *
 * // Polite announcement (doesn't interrupt)
 * announce('File uploaded successfully');
 *
 * // Assertive announcement (interrupts screen reader)
 * announce('Error: Connection lost', 'assertive');
 * ```
 */

import { ReactNode } from 'react';

/**
 * Announce a message to screen readers via live region
 * @param message - Message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const regionId = priority === 'polite' ? 'live-region-polite' : 'live-region-assertive';
  const region = document.getElementById(regionId);

  if (region) {
    // Clear previous message
    region.textContent = '';

    // Use setTimeout to ensure screen readers detect the change
    setTimeout(() => {
      region.textContent = message;

      // Auto-clear after 5 seconds to prevent stale announcements
      setTimeout(() => {
        region.textContent = '';
      }, 5000);
    }, 100);
  }
}

/**
 * LiveRegionProvider Component
 * Renders hidden live regions for screen reader announcements
 */
export function LiveRegionProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Polite live region - waits for screen reader to finish speaking */}
      <div
        id="live-region-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        aria-relevant="additions text"
      />

      {/* Assertive live region - interrupts screen reader immediately */}
      <div
        id="live-region-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        aria-relevant="additions text"
      />

      {children}
    </>
  );
}

/**
 * Hook for using announcements in components
 */
export function useAnnounce() {
  return { announce };
}

export default LiveRegionProvider;
