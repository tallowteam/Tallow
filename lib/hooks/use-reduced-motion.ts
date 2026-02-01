/**
 * React hook for detecting and managing reduced motion preference
 * Respects both system preference and user override
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for user override first
    const userPreference = localStorage.getItem('tallow_reduced_motion');
    if (userPreference !== null) {
      setPrefersReducedMotion(userPreference === 'true');
      return;
    }

    // Check system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      // Only update if no user override
      const userPref = localStorage.getItem('tallow_reduced_motion');
      if (userPref === null) {
        setPrefersReducedMotion(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook that provides both state and setter for reduced motion preference
 */
export function useReducedMotionSetting() {
  const [reducedMotion, setReducedMotionState] = useState<boolean | null>(null);

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('tallow_reduced_motion');
    if (stored !== null) {
      setReducedMotionState(stored === 'true');
    } else {
      // Use system preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotionState(mediaQuery.matches);
    }
  }, []);

  const setReducedMotion = (value: boolean | null) => {
    if (value === null) {
      // Clear override, use system preference
      localStorage.removeItem('tallow_reduced_motion');
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotionState(mediaQuery.matches);
    } else {
      // Set user override
      localStorage.setItem('tallow_reduced_motion', String(value));
      setReducedMotionState(value);
    }
  };

  return { reducedMotion, setReducedMotion };
}
