/**
 * Theme Hook
 * Get and set theme with localStorage persistence
 */

'use client';

import * as React from 'react';
import { useContext } from 'react';
import { ThemeContext } from './theme-provider';

/**
 * Hook to access and manipulate theme
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  const { theme, setTheme, resolvedTheme } = context;

  /**
   * Toggle between light and dark themes
   */
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'light' : 'dark');
  };

  /**
   * Set theme to system preference
   */
  const setSystemTheme = () => {
    setTheme('system');
  };

  /**
   * Check if theme is light
   */
  const isLight = resolvedTheme === 'light';

  /**
   * Check if theme is dark
   */
  const isDark = resolvedTheme === 'dark';

  /**
   * Check if using system theme
   */
  const isSystem = theme === 'system';

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    setSystemTheme,
    isLight,
    isDark,
    isSystem,
  };
}

/**
 * Hook to listen to system theme changes
 */
export function useSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';

  const [systemTheme, setSystemTheme] = React.useState<'light' | 'dark'>(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    return mediaQuery.matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return systemTheme;
}
