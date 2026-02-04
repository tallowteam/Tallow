/**
 * Theme System
 * Complete theme management with dark/light modes and customization
 */

export { ThemeProvider, themeScript } from './theme-provider';
export { useTheme, useSystemTheme } from './use-theme';
export { ThemeToggle, themeToggleStyles } from './theme-toggle';

export {
  darkTheme,
  lightTheme,
  themes,
  getTheme,
  resolveSystemTheme,
  getResolvedTheme,
} from './themes';

export type { Theme, ThemeMode } from './themes';

export {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  hexToHsl,
  hslToHex,
  lighten,
  darken,
  saturate,
  adjustHue,
  getContrastRatio,
  meetsContrastRequirement,
  mix,
  addAlpha,
  getComplementary,
  getTriadic,
  getAnalogous,
  isLight,
  getReadableTextColor,
} from './colors';

export type { HSL, RGB } from './colors';

export {
  setCssVariable,
  getCssVariable,
  removeCssVariable,
  setCssVariables,
  applyTheme,
  getThemeVariables,
  resetThemeVariables,
  cssVar,
  cssVarWithFallback,
  hasCssVariable,
  updateThemeVariablesWithTransition,
} from './css-variables';
