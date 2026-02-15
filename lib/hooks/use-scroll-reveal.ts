'use client';

import { useEffect } from 'react';
import {
  initScrollRevealFallback,
  type ScrollRevealOptions,
} from '@/lib/ui/motion-choreographer';

/**
 * useScrollReveal
 *
 * React hook that initializes IntersectionObserver-based scroll-reveal
 * as a fallback for browsers that do not support CSS animation-timeline: view().
 *
 * How it works:
 * 1. On Chrome (supports animation-timeline): no-op, CSS handles everything.
 * 2. On Firefox/Safari (no animation-timeline): uses IntersectionObserver to
 *    add the 'scroll-revealed' class to [data-scroll-reveal] elements as
 *    they enter the viewport. CSS transitions handle the visual animation.
 * 3. If prefers-reduced-motion: no-op, elements are visible immediately via CSS.
 *
 * Usage:
 *   In your root layout or page:
 *   ```tsx
 *   useScrollReveal();
 *   ```
 *
 *   In your JSX, add data-scroll-reveal to animated elements:
 *   ```html
 *   <section data-scroll-reveal className={styles.hero}>...</section>
 *   ```
 *
 *   In your CSS, use the fallback pattern:
 *   ```css
 *   @supports not (animation-timeline: view()) {
 *     .hero {
 *       opacity: 0;
 *       transform: translateY(30px);
 *       transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
 *                   transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
 *     }
 *     .hero:global(.scroll-revealed) {
 *       opacity: 1;
 *       transform: none;
 *     }
 *   }
 *   ```
 *
 * @param options - IntersectionObserver configuration
 */
export function useScrollReveal(options?: ScrollRevealOptions): void {
  useEffect(() => {
    const cleanup = initScrollRevealFallback(options);
    return cleanup;
  }, [options]);
}
