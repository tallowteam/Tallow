/**
 * Theme Registry and Type Definitions
 * Central export for all theme configurations
 */

import { darkTheme } from './dark';
import { lightTheme } from './light';

export { darkTheme } from './dark';
export { lightTheme } from './light';

/**
 * Theme type definition
 */
export type Theme = typeof darkTheme;

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Theme registry
 */
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

/**
 * Get theme by mode
 */
export function getTheme(mode: Exclude<ThemeMode, 'system'>): Theme {
  return themes[mode];
}

/**
 * Resolve system theme preference
 */
export function resolveSystemTheme(): Exclude<ThemeMode, 'system'> {
  if (typeof window === 'undefined') return 'dark';

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  return mediaQuery.matches ? 'dark' : 'light';
}

/**
 * Get resolved theme (handles system mode)
 */
export function getResolvedTheme(mode: ThemeMode): Theme {
  const resolvedMode = mode === 'system' ? resolveSystemTheme() : mode;
  return getTheme(resolvedMode);
}
