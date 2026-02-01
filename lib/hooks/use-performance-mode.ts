/**
 * Performance Mode Detection Hook
 * Detects device capabilities and provides optimized animation settings
 *
 * Used to conditionally disable expensive effects on low-power devices:
 * - Large blur effects (120px+ blur)
 * - Continuous floating animations
 * - Scroll-based parallax transforms
 * - Multiple layered glassmorphism effects
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PerformanceSettings {
  /** Device is in low-power mode (low memory, CPU, or reduced motion) */
  isLowPower: boolean;
  /** Should reduce/disable blur effects */
  reduceBlur: boolean;
  /** Should reduce scroll-linked animations */
  reduceScrollAnimations: boolean;
  /** Should disable parallax effects */
  reduceParallax: boolean;
  /** Maximum number of concurrent animated elements */
  maxAnimatedElements: number;
  /** Should use GPU acceleration hints */
  useGpuHints: boolean;
  /** Should disable floating/continuous animations */
  disableFloatingAnimations: boolean;
  /** Device has touch input */
  hasTouch: boolean;
  /** Screen width < 768px */
  isSmallScreen: boolean;
  /** User prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Connection is slow (2g, slow-2g, or save-data) */
  isSlowConnection: boolean;
}

const defaultSettings: PerformanceSettings = {
  isLowPower: false,
  reduceBlur: false,
  reduceScrollAnimations: false,
  reduceParallax: false,
  maxAnimatedElements: 20,
  useGpuHints: true,
  disableFloatingAnimations: false,
  hasTouch: false,
  isSmallScreen: false,
  prefersReducedMotion: false,
  isSlowConnection: false,
};

interface NavigatorWithExtras extends Navigator {
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    downlink?: number;
  };
  deviceMemory?: number;
  // hardwareConcurrency is already defined in Navigator, no need to redeclare
}

function detectPerformance(): PerformanceSettings {
  if (typeof window === 'undefined') {return defaultSettings;}

  const nav = navigator as NavigatorWithExtras;

  // Detect touch devices
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  // Detect small screens
  const isSmallScreen = window.innerWidth < 768;

  // Detect slow connections
  const isSlowConnection =
    nav.connection?.effectiveType === '2g' ||
    nav.connection?.effectiveType === 'slow-2g' ||
    nav.connection?.saveData === true ||
    (nav.connection?.downlink !== undefined && nav.connection.downlink < 1);

  // Detect low hardware specs
  const isLowMemory = (nav.deviceMemory || 8) <= 4;
  const isLowCPU = (nav.hardwareConcurrency || 4) <= 4;

  // Detect reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Calculate if device is "low power"
  const isLowPower = isLowMemory || isLowCPU || prefersReducedMotion ||
                     (isSmallScreen && hasTouch) || isSlowConnection;

  return {
    isLowPower,
    reduceBlur: isSmallScreen || hasTouch || isLowPower,
    reduceScrollAnimations: isLowPower || prefersReducedMotion,
    reduceParallax: isLowPower || isSmallScreen,
    maxAnimatedElements: isLowPower ? 5 : isSmallScreen ? 10 : 20,
    useGpuHints: !isLowPower,
    disableFloatingAnimations: isLowPower || prefersReducedMotion,
    hasTouch,
    isSmallScreen,
    prefersReducedMotion,
    isSlowConnection,
  };
}

/**
 * Hook to detect device performance capabilities
 *
 * @example
 * ```tsx
 * const perf = usePerformanceMode();
 *
 * // Conditionally render expensive effects
 * {!perf.reduceBlur && <BlurOrb />}
 *
 * // Simplify animations on low-power devices
 * const animation = perf.isLowPower
 *   ? { opacity: 1 }
 *   : { opacity: 1, y: 0, scale: 1 };
 * ```
 */
export function usePerformanceMode(): PerformanceSettings {
  const [settings, setSettings] = useState<PerformanceSettings>(defaultSettings);

  const updateSettings = useCallback(() => {
    setSettings(detectPerformance());
  }, []);

  useEffect(() => {
    // Initial detection
    updateSettings();

    // Update on resize (screen size changes)
    const handleResize = () => {
      updateSettings();
    };

    // Update on reduced motion preference change
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => {
      updateSettings();
    };

    window.addEventListener('resize', handleResize);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, [updateSettings]);

  return settings;
}

/**
 * Get performance-optimized blur value
 *
 * @param desiredBlur - The ideal blur amount in pixels
 * @param settings - Performance settings from usePerformanceMode
 * @returns Optimized blur value (0 on mobile/low-power, reduced on touch)
 */
export function getOptimizedBlur(
  desiredBlur: number,
  settings: PerformanceSettings
): number {
  if (settings.reduceBlur) {
    return 0;
  }
  if (settings.hasTouch) {
    return Math.round(desiredBlur * 0.5);
  }
  return desiredBlur;
}

/**
 * Get performance-optimized animation duration
 *
 * @param desiredDuration - The ideal animation duration in seconds
 * @param settings - Performance settings from usePerformanceMode
 * @returns Optimized duration (0.01 for reduced motion, shortened for low-power)
 */
export function getOptimizedDuration(
  desiredDuration: number,
  settings: PerformanceSettings
): number {
  if (settings.prefersReducedMotion) {
    return 0.01;
  }
  if (settings.isLowPower) {
    return desiredDuration * 0.5;
  }
  return desiredDuration;
}

export default usePerformanceMode;
