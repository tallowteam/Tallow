/**
 * Reduced Motion Context
 * Provides global access to reduced motion preference throughout the app
 */

'use client';

import * as React from 'react';
import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

interface ReducedMotionContextValue {
  reducedMotion: boolean;
  setReducedMotion: (value: boolean | null) => void;
  isSystemPreference: boolean;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue | undefined>(undefined);

export function ReducedMotionProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [isSystemPreference, setIsSystemPreference] = useState(true);

  useEffect(() => {
    // Check for user override
    const stored = localStorage.getItem('tallow_reduced_motion');

    if (stored !== null) {
      setReducedMotionState(stored === 'true');
      setIsSystemPreference(false);
      return;
    }

    // Use system preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionState(mediaQuery.matches);
    setIsSystemPreference(true);

    // Listen for system preference changes
    const handleChange = (event: MediaQueryListEvent) => {
      // Only update if no user override
      const userPref = localStorage.getItem('tallow_reduced_motion');
      if (userPref === null) {
        setReducedMotionState(event.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply data attribute to document for CSS
  useEffect(() => {
    if (reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
  }, [reducedMotion]);

  const setReducedMotion = useCallback((value: boolean | null) => {
    if (value === null) {
      // Clear override, use system preference
      localStorage.removeItem('tallow_reduced_motion');
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotionState(mediaQuery.matches);
      setIsSystemPreference(true);
    } else {
      // Set user override
      localStorage.setItem('tallow_reduced_motion', String(value));
      setReducedMotionState(value);
      setIsSystemPreference(false);
    }
  }, []);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  const contextValue = useMemo(() => ({
    reducedMotion,
    setReducedMotion,
    isSystemPreference,
  }), [reducedMotion, setReducedMotion, isSystemPreference]);

  return (
    <ReducedMotionContext.Provider value={contextValue}>
      {children}
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotionContext() {
  const context = useContext(ReducedMotionContext);
  if (context === undefined) {
    throw new Error('useReducedMotionContext must be used within a ReducedMotionProvider');
  }
  return context;
}
