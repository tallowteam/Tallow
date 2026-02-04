/**
 * Theme Provider
 * Manages theme state with localStorage persistence and system preference detection
 */

'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import type { ThemeMode } from './themes';
import { resolveSystemTheme } from './themes';

const THEME_STORAGE_KEY = 'tallow-theme';

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: Exclude<ThemeMode, 'system'>;
  setTheme: (theme: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

/**
 * Get initial theme from localStorage or default
 */
function getInitialTheme(storageKey: string, defaultTheme: ThemeMode): ThemeMode {
  if (typeof window === 'undefined') return defaultTheme;

  try {
    const stored = localStorage.getItem(storageKey);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as ThemeMode;
    }
  } catch (error) {
    console.error('Failed to read theme from localStorage:', error);
  }

  return defaultTheme;
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(() =>
    getInitialTheme(storageKey, defaultTheme)
  );

  const [resolvedTheme, setResolvedTheme] = useState<Exclude<ThemeMode, 'system'>>(() =>
    theme === 'system' ? resolveSystemTheme() : theme
  );

  /**
   * Update theme
   */
  const setTheme = useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme);

      try {
        localStorage.setItem(storageKey, newTheme);
      } catch (error) {
        console.error('Failed to save theme to localStorage:', error);
      }

      const resolved = newTheme === 'system' ? resolveSystemTheme() : newTheme;
      setResolvedTheme(resolved);

      updateThemeAttributes(resolved);
    },
    [storageKey]
  );

  /**
   * Listen to system theme changes
   */
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolvedTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolvedTheme);
      updateThemeAttributes(newResolvedTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  /**
   * Initialize theme on mount
   */
  useEffect(() => {
    updateThemeAttributes(resolvedTheme);
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * Update HTML element attributes for theme
 */
function updateThemeAttributes(theme: Exclude<ThemeMode, 'system'>) {
  const root = document.documentElement;

  root.setAttribute('data-theme', theme);

  root.classList.remove('light', 'dark');
  root.classList.add(theme);

  root.style.colorScheme = theme;
}

/**
 * Theme Script (for embedding in HTML to prevent flash)
 */
export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'dark';
    var resolvedTheme = theme;

    if (theme === 'system') {
      var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      resolvedTheme = isDark ? 'dark' : 'light';
    }

    var root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    root.classList.add(resolvedTheme);
    root.style.colorScheme = resolvedTheme;
  } catch (e) {
    console.error('Theme initialization failed:', e);
  }
})();
`;
