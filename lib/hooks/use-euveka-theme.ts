/**
 * useEuvekaTheme Hook
 *
 * Integrates Euveka theme preferences with the existing next-themes setup
 * and the Zustand scroll animation store.
 *
 * Features:
 * - Sync with next-themes
 * - Euveka-specific theme values
 * - Theme-aware animation configs
 * - CSS custom property management
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useTheme } from 'next-themes';
import { useScrollAnimationStore, selectEuvekaTheme, selectResolvedTheme } from '@/lib/stores/scroll-animation-store';
import type { EuvekaTheme } from '@/lib/stores/scroll-animation-store';

export interface UseEuvekaThemeReturn {
  /** Current Euveka theme setting */
  theme: EuvekaTheme;
  /** Resolved theme (always 'dark' or 'light') */
  resolvedTheme: 'dark' | 'light';
  /** Whether dark mode is active */
  isDark: boolean;
  /** Whether system theme is being used */
  isSystem: boolean;
  /** Set the theme */
  setTheme: (theme: EuvekaTheme) => void;
  /** Toggle between dark and light */
  toggleTheme: () => void;
  /** Reset to system preference */
  resetToSystem: () => void;
  /** Theme-specific colors for Euveka design */
  colors: EuvekaColors;
  /** Theme-specific glow configuration */
  glow: EuvekaGlow;
  /** Whether component is mounted (for hydration) */
  mounted: boolean;
}

export interface EuvekaColors {
  /** Primary color (white for dark, black for light) */
  primary: string;
  /** Primary foreground */
  primaryForeground: string;
  /** Background color */
  background: string;
  /** Foreground color */
  foreground: string;
  /** Muted color */
  muted: string;
  /** Accent color */
  accent: string;
  /** Border color */
  border: string;
  /** Card background */
  card: string;
}

export interface EuvekaGlow {
  /** Glow color */
  color: string;
  /** Glow intensity (0-1) */
  intensity: number;
  /** Box shadow for glow effect */
  boxShadow: string;
  /** Text shadow for glow effect */
  textShadow: string;
}

/**
 * EXACT EUVEKA DESIGN SYSTEM COLORS
 *
 * EUVEKA PALETTE:
 * - Dark: #191610 (background)
 * - Light: #fefefc (background)
 * - Neutrals: #fefdfb, #fcf6ec, #f3ede2, #e5dac7, #d6cec2, #b2987d, #544a36, #2c261c, #242018
 * - Accent: #fefefc (electric blue)
 * - Error: #ff4f4f
 */
const EUVEKA_COLORS = {
  dark: {
    primary: '#fefefc',
    primaryForeground: '#191610',
    background: '#191610',
    foreground: '#fefefc',
    muted: '#2c261c',
    accent: '#fefefc',
    border: 'rgba(44, 38, 28, 1)',
    card: '#242018',
  },
  light: {
    primary: '#191610',
    primaryForeground: '#fefefc',
    background: '#fefefc',
    foreground: '#191610',
    muted: '#fcf6ec',
    accent: '#fefefc',
    border: 'rgba(214, 206, 194, 1)',
    card: '#fefdfb',
  },
} as const;

/**
 * EUVEKA Neutral Scale (for reference)
 */
export const EUVEKA_NEUTRALS = {
  50: '#fefdfb',
  100: '#fcf6ec',
  200: '#f3ede2',
  300: '#e5dac7',
  400: '#d6cec2',
  500: '#b2987d',
  600: '#544a36',
  700: '#2c261c',
  800: '#242018',
  900: '#191610',
} as const;

const EUVEKA_GLOW = {
  dark: {
    color: 'rgba(254, 254, 252, 0.3)',
    intensity: 1,
    boxShadow: '0 0 24px rgba(254, 254, 252, 0.3)',
    textShadow: '0 0 20px rgba(254, 254, 252, 0.3)',
  },
  light: {
    color: 'rgba(254, 254, 252, 0.2)',
    intensity: 0.7,
    boxShadow: '0 0 20px rgba(254, 254, 252, 0.2)',
    textShadow: '0 0 10px rgba(254, 254, 252, 0.15)',
  },
} as const;

export function useEuvekaTheme(): UseEuvekaThemeReturn {
  // next-themes hook
  const {
    theme: nextTheme,
    resolvedTheme: nextResolvedTheme,
    setTheme: setNextTheme,
  } = useTheme();

  // Zustand store
  const euvekaTheme = useScrollAnimationStore(selectEuvekaTheme);
  const storeResolvedTheme = useScrollAnimationStore(selectResolvedTheme);
  const { setEuvekaTheme, setResolvedTheme } = useScrollAnimationStore();

  // Track mounted state for hydration
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync Zustand store with next-themes
  useEffect(() => {
    if (nextResolvedTheme === 'dark' || nextResolvedTheme === 'light') {
      setResolvedTheme(nextResolvedTheme);
    }
  }, [nextResolvedTheme, setResolvedTheme]);

  // Sync next-themes when Euveka theme changes
  useEffect(() => {
    if (euvekaTheme !== nextTheme) {
      setNextTheme(euvekaTheme);
    }
  }, [euvekaTheme, nextTheme, setNextTheme]);

  // Set theme
  const setTheme = useCallback(
    (theme: EuvekaTheme) => {
      setEuvekaTheme(theme);
      setNextTheme(theme);
    },
    [setEuvekaTheme, setNextTheme]
  );

  // Toggle between dark and light
  const toggleTheme = useCallback(() => {
    const newTheme = storeResolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [storeResolvedTheme, setTheme]);

  // Reset to system preference
  const resetToSystem = useCallback(() => {
    setTheme('system');
  }, [setTheme]);

  // Derived values
  const isDark = storeResolvedTheme === 'dark';
  const isSystem = euvekaTheme === 'system';

  // Theme-specific values
  const colors = useMemo<EuvekaColors>(
    () => (isDark ? EUVEKA_COLORS.dark : EUVEKA_COLORS.light),
    [isDark]
  );

  const glow = useMemo<EuvekaGlow>(
    () => (isDark ? EUVEKA_GLOW.dark : EUVEKA_GLOW.light),
    [isDark]
  );

  return {
    theme: euvekaTheme,
    resolvedTheme: storeResolvedTheme,
    isDark,
    isSystem,
    setTheme,
    toggleTheme,
    resetToSystem,
    colors,
    glow,
    mounted,
  };
}

// Need to import React for useState
import * as React from 'react';

/**
 * Hook for getting Euveka-style CSS custom properties
 */
export function useEuvekaStyles() {
  const { colors, glow } = useEuvekaTheme();

  return useMemo(
    () => ({
      '--euveka-primary': colors.primary,
      '--euveka-primary-foreground': colors.primaryForeground,
      '--euveka-background': colors.background,
      '--euveka-foreground': colors.foreground,
      '--euveka-muted': colors.muted,
      '--euveka-accent': colors.accent,
      '--euveka-border': colors.border,
      '--euveka-card': colors.card,
      '--euveka-glow-color': glow.color,
      '--euveka-glow-shadow': glow.boxShadow,
      '--euveka-text-glow': glow.textShadow,
    }),
    [colors, glow]
  );
}

/**
 * Hook for Euveka animation variants based on theme
 */
export function useEuvekaAnimationVariants() {
  const { isDark, glow } = useEuvekaTheme();
  const { animationPreferences } = useScrollAnimationStore();

  return useMemo(() => {
    const baseVariants = {
      hidden: {
        opacity: 0,
        y: 24,
      },
      visible: {
        opacity: 1,
        y: 0,
      },
      exit: {
        opacity: 0,
        y: -12,
      },
    };

    // Add glow effect for hover states in dark mode
    if (isDark && animationPreferences.enableGlowEffects) {
      return {
        ...baseVariants,
        hover: {
          scale: 1.02,
          boxShadow: glow.boxShadow,
        },
        tap: {
          scale: 0.98,
        },
      };
    }

    return {
      ...baseVariants,
      hover: {
        scale: 1.02,
      },
      tap: {
        scale: 0.98,
      },
    };
  }, [isDark, glow, animationPreferences.enableGlowEffects]);
}

export default useEuvekaTheme;
