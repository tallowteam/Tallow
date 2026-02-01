/**
 * useAnimationPreferences Hook
 *
 * Manages animation preferences for Euveka-style animations.
 * Integrates with the Zustand store and syncs with system preferences.
 *
 * Features:
 * - Reduced motion preference detection and override
 * - Animation speed control
 * - Glow effects toggle
 * - Parallax effects toggle
 * - Stagger animation control
 * - Spring configuration access
 * - System preference sync
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useScrollAnimationStore, selectAnimationPreferences, selectReducedMotion } from '@/lib/stores/scroll-animation-store';
import type { AnimationPreferences, SpringConfig } from '@/lib/stores/scroll-animation-store';

export interface UseAnimationPreferencesReturn {
  /** Current animation preferences */
  preferences: AnimationPreferences;
  /** Whether reduced motion is enabled */
  reducedMotion: boolean;
  /** Whether preference is from system */
  isSystemPreference: boolean;
  /** Set reduced motion preference (null = use system) */
  setReducedMotion: (value: boolean | null) => void;
  /** Toggle reduced motion */
  toggleReducedMotion: () => void;
  /** Enable/disable spring animations */
  setSpringAnimations: (enabled: boolean) => void;
  /** Enable/disable glow effects */
  setGlowEffects: (enabled: boolean) => void;
  /** Enable/disable parallax effects */
  setParallax: (enabled: boolean) => void;
  /** Set animation speed multiplier */
  setSpeedMultiplier: (multiplier: number) => void;
  /** Enable/disable stagger animations */
  setStagger: (enabled: boolean) => void;
  /** Set stagger delay in ms */
  setStaggerDelay: (delay: number) => void;
  /** Update multiple preferences at once */
  updatePreferences: (prefs: Partial<AnimationPreferences>) => void;
  /** Reset to defaults */
  resetToDefaults: () => void;
  /** Get spring config for animation type */
  getSpringConfig: (type?: 'default' | 'tight' | 'loose' | 'bouncy') => SpringConfig;
  /** Get framer-motion transition config */
  getMotionTransition: (type?: 'default' | 'tight' | 'loose' | 'bouncy') => {
    type: 'spring';
    stiffness: number;
    damping: number;
    mass: number;
  } | { duration: number };
  /** Whether animations should be disabled */
  shouldDisableAnimations: boolean;
  /** Animation duration modifier */
  durationMultiplier: number;
}

const DEFAULT_PREFERENCES: AnimationPreferences = {
  reducedMotion: false,
  isSystemPreference: true,
  enableSpringAnimations: true,
  enableGlowEffects: true,
  enableParallax: true,
  speedMultiplier: 1,
  enableStagger: true,
  staggerDelay: 50,
};

export function useAnimationPreferences(): UseAnimationPreferencesReturn {
  const preferences = useScrollAnimationStore(selectAnimationPreferences);
  const reducedMotion = useScrollAnimationStore(selectReducedMotion);
  const {
    setReducedMotion: storeSetReducedMotion,
    toggleReducedMotion: storeToggleReducedMotion,
    updateAnimationPreferences,
    getSpringConfig,
  } = useScrollAnimationStore();

  // Sync with system preference on mount
  useEffect(() => {
    if (preferences.isSystemPreference) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      storeSetReducedMotion(mediaQuery.matches ? true : null);

      const handleChange = (event: MediaQueryListEvent) => {
        if (useScrollAnimationStore.getState().animationPreferences.isSystemPreference) {
          storeSetReducedMotion(event.matches ? true : null);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    return undefined;
  }, [preferences.isSystemPreference, storeSetReducedMotion]);

  // Apply data attribute to document for CSS
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  // Individual preference setters
  const setReducedMotion = useCallback(
    (value: boolean | null) => {
      storeSetReducedMotion(value);
    },
    [storeSetReducedMotion]
  );

  const setSpringAnimations = useCallback(
    (enabled: boolean) => {
      updateAnimationPreferences({ enableSpringAnimations: enabled });
    },
    [updateAnimationPreferences]
  );

  const setGlowEffects = useCallback(
    (enabled: boolean) => {
      updateAnimationPreferences({ enableGlowEffects: enabled });
    },
    [updateAnimationPreferences]
  );

  const setParallax = useCallback(
    (enabled: boolean) => {
      updateAnimationPreferences({ enableParallax: enabled });
    },
    [updateAnimationPreferences]
  );

  const setSpeedMultiplier = useCallback(
    (multiplier: number) => {
      updateAnimationPreferences({
        speedMultiplier: Math.max(0.25, Math.min(4, multiplier)),
      });
    },
    [updateAnimationPreferences]
  );

  const setStagger = useCallback(
    (enabled: boolean) => {
      updateAnimationPreferences({ enableStagger: enabled });
    },
    [updateAnimationPreferences]
  );

  const setStaggerDelay = useCallback(
    (delay: number) => {
      updateAnimationPreferences({
        staggerDelay: Math.max(0, Math.min(500, delay)),
      });
    },
    [updateAnimationPreferences]
  );

  const resetToDefaults = useCallback(() => {
    updateAnimationPreferences(DEFAULT_PREFERENCES);
  }, [updateAnimationPreferences]);

  // Get framer-motion compatible transition config
  const getMotionTransition = useCallback(
    (type: 'default' | 'tight' | 'loose' | 'bouncy' = 'default') => {
      if (reducedMotion) {
        return { duration: 0.01 };
      }

      const spring = getSpringConfig(type);
      return {
        type: 'spring' as const,
        stiffness: spring.stiffness,
        damping: spring.damping,
        mass: spring.mass,
      };
    },
    [reducedMotion, getSpringConfig]
  );

  // Computed values
  const shouldDisableAnimations = useMemo(
    () => reducedMotion || !preferences.enableSpringAnimations,
    [reducedMotion, preferences.enableSpringAnimations]
  );

  const durationMultiplier = useMemo(
    () => (reducedMotion ? 0 : 1 / preferences.speedMultiplier),
    [reducedMotion, preferences.speedMultiplier]
  );

  return {
    preferences,
    reducedMotion,
    isSystemPreference: preferences.isSystemPreference,
    setReducedMotion,
    toggleReducedMotion: storeToggleReducedMotion,
    setSpringAnimations,
    setGlowEffects,
    setParallax,
    setSpeedMultiplier,
    setStagger,
    setStaggerDelay,
    updatePreferences: updateAnimationPreferences,
    resetToDefaults,
    getSpringConfig,
    getMotionTransition,
    shouldDisableAnimations,
    durationMultiplier,
  };
}

/**
 * Hook for getting spring transition config for framer-motion
 */
export function useSpringTransition(
  type: 'default' | 'tight' | 'loose' | 'bouncy' = 'default'
) {
  const { getMotionTransition, reducedMotion } = useAnimationPreferences();
  return useMemo(
    () => ({
      transition: getMotionTransition(type),
      reducedMotion,
    }),
    [getMotionTransition, type, reducedMotion]
  );
}

/**
 * Hook for stagger animation delays
 */
export function useStaggerDelay(index: number) {
  const { preferences, reducedMotion } = useAnimationPreferences();

  return useMemo(() => {
    if (reducedMotion || !preferences.enableStagger) {
      return 0;
    }
    return index * preferences.staggerDelay;
  }, [index, reducedMotion, preferences.enableStagger, preferences.staggerDelay]);
}

/**
 * Hook for glow effect classes
 */
export function useGlowEffect(enabled: boolean = true) {
  const { preferences, reducedMotion } = useAnimationPreferences();

  return useMemo(
    () => ({
      enabled: enabled && preferences.enableGlowEffects && !reducedMotion,
      className:
        enabled && preferences.enableGlowEffects && !reducedMotion
          ? 'animate-glow-pulse'
          : '',
    }),
    [enabled, preferences.enableGlowEffects, reducedMotion]
  );
}

/**
 * Hook for parallax effect values
 */
export function useParallaxEffect(strength: number = 1) {
  const { preferences, reducedMotion } = useAnimationPreferences();

  return useMemo(
    () => ({
      enabled: preferences.enableParallax && !reducedMotion,
      strength: preferences.enableParallax && !reducedMotion ? strength : 0,
      multiplier: preferences.enableParallax && !reducedMotion ? strength : 0,
    }),
    [strength, preferences.enableParallax, reducedMotion]
  );
}

export default useAnimationPreferences;
