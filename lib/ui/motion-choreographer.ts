/**
 * MOTION-CHOREOGRAPHER (Agent 033)
 *
 * Centralized animation system for TALLOW's magazine aesthetic.
 *
 * Responsibilities:
 * - Standard easing and duration constants
 * - Compositor-safe property enforcement
 * - Reduced motion detection (non-hook, for plain modules)
 * - Scroll-reveal fallback orchestration via IntersectionObserver
 * - Motion duration/easing utilities that respect user preferences
 */

// ============================================
// Easing & Duration Constants
// ============================================

/** Standard smooth deceleration easing for all entrance animations */
export const MOTION_EASING = 'cubic-bezier(0.16, 1, 0.3, 1)' as const;

/** Default spring easing for interactive elements */
export const MOTION_EASING_SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)' as const;

/** Linear easing for marquee / infinite loops */
export const MOTION_EASING_LINEAR = 'linear' as const;

/** Standard entrance animation duration in ms */
export const MOTION_DURATION_MS = 600 as const;

/** Fast transition duration for hover/focus states */
export const MOTION_DURATION_FAST_MS = 150 as const;

/** Slow animation for large scroll reveals */
export const MOTION_DURATION_SLOW_MS = 1000 as const;

/** Card hover Y offset in px */
export const MOTION_CARD_HOVER_Y_PX = -2 as const;

/** Tap/press scale factor */
export const MOTION_TAP_SCALE = 0.98 as const;

// ============================================
// Compositor-Safe Properties
// ============================================

export const COMPOSITOR_SAFE_MOTION_PROPERTIES = ['transform', 'opacity'] as const;

export type CompositorSafeMotionProperty =
  (typeof COMPOSITOR_SAFE_MOTION_PROPERTIES)[number];

export function isCompositorSafeMotionProperty(
  property: string
): property is CompositorSafeMotionProperty {
  return (COMPOSITOR_SAFE_MOTION_PROPERTIES as readonly string[]).includes(property);
}

// ============================================
// Reduced Motion Detection (non-React)
// ============================================

/**
 * Check if user prefers reduced motion.
 * Safe to call from plain TypeScript modules (no React dependency).
 * Returns false during SSR.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Check if browser supports CSS scroll-driven animations.
 * Returns false during SSR.
 */
export function supportsScrollTimeline(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return false;
  return CSS.supports('animation-timeline', 'view()');
}

// ============================================
// Motion Duration & Easing Utilities
// ============================================

/**
 * Returns the appropriate animation duration.
 * If the user prefers reduced motion, returns 0.
 * Otherwise returns the base duration.
 *
 * @param baseMs - Duration in milliseconds when motion is allowed
 * @returns Duration in ms (0 if reduced motion is active)
 */
export function getMotionDuration(baseMs: number): number {
  if (prefersReducedMotion()) return 0;
  return baseMs;
}

/**
 * Returns the appropriate animation easing.
 * If the user prefers reduced motion, returns 'linear' (instant when duration is 0).
 * Otherwise returns the standard TALLOW easing.
 *
 * @param customEasing - Override easing for specific use cases
 * @returns CSS easing string
 */
export function getMotionEasing(customEasing?: string): string {
  if (prefersReducedMotion()) return MOTION_EASING_LINEAR;
  return customEasing ?? MOTION_EASING;
}

/**
 * Get a CSS transition string that respects reduced motion.
 *
 * @param property - CSS property to transition
 * @param durationMs - Duration in ms
 * @param easing - Optional custom easing
 * @returns Full CSS transition value or 'none'
 */
export function getMotionTransition(
  property: string,
  durationMs: number,
  easing?: string
): string {
  const duration = getMotionDuration(durationMs);
  if (duration === 0) return 'none';
  return `${property} ${duration}ms ${getMotionEasing(easing)}`;
}

// ============================================
// Essential Motion (loading, progress)
// ============================================

/**
 * Returns a slowed-down duration for essential animations
 * (loading spinners, progress bars) under reduced motion.
 * These should not be eliminated entirely, only slowed.
 *
 * @param baseMs - Normal duration
 * @returns Slowed duration (3x slower) if reduced motion, base otherwise
 */
export function getEssentialMotionDuration(baseMs: number): number {
  if (prefersReducedMotion()) return baseMs * 3;
  return baseMs;
}

// ============================================
// Scroll Reveal CSS Class Names
// ============================================

/**
 * CSS class applied to elements when they enter the viewport
 * (used as IntersectionObserver fallback for browsers without animation-timeline).
 */
export const SCROLL_REVEALED_CLASS = 'scroll-revealed' as const;

/**
 * CSS class for opt-in motion-safe animations.
 * Elements with this class only animate when motion is allowed.
 */
export const MOTION_SAFE_CLASS = 'motion-safe' as const;

/**
 * CSS class for essential motion that should persist (slowed) under reduced motion.
 */
export const MOTION_ESSENTIAL_CLASS = 'motion-essential' as const;

// ============================================
// Scroll Reveal Observer (non-React)
// ============================================

export interface ScrollRevealOptions {
  /** IntersectionObserver threshold (0-1) */
  threshold?: number;
  /** IntersectionObserver root margin */
  rootMargin?: string;
  /** Only reveal once */
  once?: boolean;
}

const DEFAULT_SCROLL_REVEAL_OPTIONS: Required<ScrollRevealOptions> = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px',
  once: true,
};

/**
 * Initialize scroll-reveal observers for all elements with
 * [data-scroll-reveal] attribute. This is the IntersectionObserver
 * fallback for browsers that do not support animation-timeline: view().
 *
 * Call once from a client-side layout or page component's useEffect.
 * No-ops if the browser supports animation-timeline natively.
 * No-ops if user prefers reduced motion.
 *
 * @returns Cleanup function to disconnect all observers
 */
export function initScrollRevealFallback(
  options?: ScrollRevealOptions
): () => void {
  // If browser supports animation-timeline, the CSS handles it natively
  if (supportsScrollTimeline()) return () => {};

  // If reduced motion, elements should already be visible via CSS
  if (prefersReducedMotion()) return () => {};

  // Not in browser
  if (typeof window === 'undefined') return () => {};

  const opts = { ...DEFAULT_SCROLL_REVEAL_OPTIONS, ...options };
  const observers: IntersectionObserver[] = [];

  const elements = document.querySelectorAll('[data-scroll-reveal]');

  if (elements.length === 0) return () => {};

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add(SCROLL_REVEALED_CLASS);
          if (opts.once) {
            observer.unobserve(entry.target);
          }
        } else if (!opts.once) {
          entry.target.classList.remove(SCROLL_REVEALED_CLASS);
        }
      }
    },
    {
      threshold: opts.threshold,
      rootMargin: opts.rootMargin,
    }
  );

  elements.forEach((el) => observer.observe(el));
  observers.push(observer);

  return () => {
    observers.forEach((obs) => obs.disconnect());
  };
}

// ============================================
// Type Exports
// ============================================

export type MotionEasing = typeof MOTION_EASING | typeof MOTION_EASING_SPRING | typeof MOTION_EASING_LINEAR;
