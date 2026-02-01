/**
 * Responsive Breakpoint Hook
 * Detects current device breakpoint and provides utilities for responsive behavior
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'tv';
export type Orientation = 'portrait' | 'landscape';

export interface BreakpointState {
  breakpoint: Breakpoint;
  width: number;
  height: number;
  orientation: Orientation;
  isMobile: boolean;
  isTablet: boolean;
  isLaptop: boolean;
  isDesktop: boolean;
  isTV: boolean;
  isTouchDevice: boolean;
  isRetina: boolean;
}

const BREAKPOINT_VALUES = {
  mobile: { min: 0, max: 767 },
  tablet: { min: 768, max: 1023 },
  laptop: { min: 1024, max: 1439 },
  desktop: { min: 1440, max: 1919 },
  tv: { min: 1920, max: Infinity },
} as const;

/**
 * Determines current breakpoint based on window width
 */
function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINT_VALUES.tablet.min) {return 'mobile';}
  if (width < BREAKPOINT_VALUES.laptop.min) {return 'tablet';}
  if (width < BREAKPOINT_VALUES.desktop.min) {return 'laptop';}
  if (width < BREAKPOINT_VALUES.tv.min) {return 'desktop';}
  return 'tv';
}

/**
 * Detects if device has touch capabilities
 */
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') {return false;}
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/**
 * Detects if device has high DPI (Retina) display
 */
function isRetina(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.devicePixelRatio >= 2;
}

/**
 * Hook to detect and respond to breakpoint changes
 */
export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(() => {
    if (typeof window === 'undefined') {
      return {
        breakpoint: 'desktop',
        width: 1920,
        height: 1080,
        orientation: 'landscape',
        isMobile: false,
        isTablet: false,
        isLaptop: false,
        isDesktop: true,
        isTV: false,
        isTouchDevice: false,
        isRetina: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const breakpoint = getBreakpoint(width);
    const orientation: Orientation = height > width ? 'portrait' : 'landscape';

    return {
      breakpoint,
      width,
      height,
      orientation,
      isMobile: breakpoint === 'mobile',
      isTablet: breakpoint === 'tablet',
      isLaptop: breakpoint === 'laptop',
      isDesktop: breakpoint === 'desktop',
      isTV: breakpoint === 'tv',
      isTouchDevice: isTouchDevice(),
      isRetina: isRetina(),
    };
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const updateBreakpoint = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const breakpoint = getBreakpoint(width);
        const orientation: Orientation = height > width ? 'portrait' : 'landscape';

        setState({
          breakpoint,
          width,
          height,
          orientation,
          isMobile: breakpoint === 'mobile',
          isTablet: breakpoint === 'tablet',
          isLaptop: breakpoint === 'laptop',
          isDesktop: breakpoint === 'desktop',
          isTV: breakpoint === 'tv',
          isTouchDevice: isTouchDevice(),
          isRetina: isRetina(),
        });
      }, 150); // 150ms debounce
    };

    window.addEventListener('resize', updateBreakpoint);
    window.addEventListener('orientationchange', updateBreakpoint);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateBreakpoint);
      window.removeEventListener('orientationchange', updateBreakpoint);
    };
  }, []);

  return state;
}

/**
 * Hook to check if current breakpoint matches any of the provided breakpoints
 */
export function useMatchBreakpoint(
  ...breakpoints: Breakpoint[]
): boolean {
  const { breakpoint } = useBreakpoint();
  return useMemo(() => breakpoints.includes(breakpoint), [breakpoint, breakpoints]);
}

/**
 * Hook to get responsive value based on current breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>): T | undefined {
  const { breakpoint } = useBreakpoint();

  return useMemo(() => {
    // Try exact breakpoint first
    if (values[breakpoint] !== undefined) {
      return values[breakpoint];
    }

    // Fallback to closest smaller breakpoint
    const breakpointOrder: Breakpoint[] = ['mobile', 'tablet', 'laptop', 'desktop', 'tv'];
    const currentIndex = breakpointOrder.indexOf(breakpoint);

    for (let i = currentIndex - 1; i >= 0; i--) {
      const fallbackBreakpoint = breakpointOrder[i] as Breakpoint;
      if (fallbackBreakpoint && values[fallbackBreakpoint] !== undefined) {
        return values[fallbackBreakpoint];
      }
    }

    // Return first available value as last resort
    return Object.values(values)[0];
  }, [breakpoint, values]);
}

/**
 * Hook to detect if screen width is within a custom range
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {return;}

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

/**
 * Utility to get columns for responsive grids
 */
export function getResponsiveColumns(breakpoint: Breakpoint): number {
  const columnMap: Record<Breakpoint, number> = {
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    tv: 4,
  };
  return columnMap[breakpoint];
}

/**
 * Utility to get spacing value for breakpoint
 */
export function getResponsiveSpacing(
  breakpoint: Breakpoint,
  type: 'container' | 'section' | 'card' = 'container'
): number {
  const spacingMap: Record<Breakpoint, Record<'container' | 'section' | 'card', number>> = {
    mobile: { container: 16, section: 48, card: 16 },
    tablet: { container: 24, section: 64, card: 24 },
    laptop: { container: 32, section: 80, card: 24 },
    desktop: { container: 40, section: 96, card: 32 },
    tv: { container: 64, section: 128, card: 48 },
  };
  return spacingMap[breakpoint][type];
}

/**
 * Utility to check if breakpoint is mobile-like (mobile or tablet in portrait)
 */
export function isMobileBreakpoint(breakpoint: Breakpoint, orientation: Orientation): boolean {
  return breakpoint === 'mobile' || (breakpoint === 'tablet' && orientation === 'portrait');
}

/**
 * Utility to check if device supports hover interactions
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') {return false;}
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Utility to get optimal font scale for breakpoint
 */
export function getFontScale(breakpoint: Breakpoint): number {
  const scaleMap: Record<Breakpoint, number> = {
    mobile: 0.875,
    tablet: 1,
    laptop: 1,
    desktop: 1.125,
    tv: 1.5,
  };
  return scaleMap[breakpoint];
}
