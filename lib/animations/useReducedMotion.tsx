/**
 * useReducedMotion Hook
 *
 * Detects user's motion preferences for accessibility.
 * Respects prefers-reduced-motion media query.
 */

'use client';

import React, { useEffect, useState } from 'react';

/**
 * Hook to detect if user prefers reduced motion
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReducedMotion();
 *
 * return (
 *   <div
 *     className={prefersReducedMotion ? 'no-animation' : 'with-animation'}
 *   >
 *     Content
 *   </div>
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  // Default to false (enable animations) for SSR
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if window.matchMedia is available
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Handle changes
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefersReducedMotion(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => {
        mediaQuery.removeListener(handleChange);
      };
    }

    return undefined;
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook to get safe animation duration based on motion preferences
 *
 * @param duration - Desired animation duration in milliseconds
 * @returns number - 0 if reduced motion preferred, otherwise the duration
 *
 * @example
 * ```tsx
 * const duration = useSafeDuration(500);
 * // duration will be 0 if user prefers reduced motion, 500 otherwise
 * ```
 */
export function useSafeDuration(duration: number): number {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? 0 : duration;
}

/**
 * Hook to conditionally apply animation based on motion preferences
 *
 * @param animationClass - CSS class for animation
 * @param fallbackClass - CSS class when reduced motion is preferred
 * @returns string - Appropriate CSS class based on preferences
 *
 * @example
 * ```tsx
 * const animationClass = useSafeAnimation('animate-fade-in', 'opacity-100');
 * // Returns 'opacity-100' if reduced motion, 'animate-fade-in' otherwise
 * ```
 */
export function useSafeAnimation(
  animationClass: string,
  fallbackClass?: string
): string {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? (fallbackClass || '') : animationClass;
}

/**
 * Higher-order function to create motion-safe components
 *
 * @param Component - React component to wrap
 * @returns Component with motion-safe behavior
 *
 * @example
 * ```tsx
 * const SafeAnimatedDiv = withReducedMotion(AnimatedDiv);
 * ```
 */
export function withReducedMotion<P extends object>(
  Component: React.ComponentType<P & { prefersReducedMotion?: boolean }>
): React.ComponentType<P> {
  return function ReducedMotionWrapper(props: P) {
    const prefersReducedMotion = useReducedMotion();
    return React.createElement(Component, { ...props, prefersReducedMotion });
  };
}
