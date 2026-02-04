/**
 * Light Theme Definition
 * Complete color tokens and design system values for light mode
 */

export const lightTheme = {
  // Background Colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    elevated: '#ffffff',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },

  // Foreground Colors
  foreground: {
    primary: '#0a0a0a',
    secondary: '#525252',
    tertiary: '#737373',
    muted: '#a1a1a1',
  },

  // Accent Colors
  accent: {
    primary: '#7c3aed',
    secondary: '#6366f1',
    tertiary: '#3b82f6',
    hover: '#8b5cf6',
    active: '#6d28d9',
  },

  // Gradients
  gradient: {
    accent: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)',
    accentReverse: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #7c3aed 100%)',
    subtle: 'linear-gradient(180deg, #ffffff 0%, #f9fafb 100%)',
    glow: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.08) 0%, transparent 70%)',
  },

  // Semantic Colors
  semantic: {
    success: '#059669',
    successBg: 'rgba(5, 150, 105, 0.1)',
    successBorder: 'rgba(5, 150, 105, 0.2)',
    warning: '#d97706',
    warningBg: 'rgba(217, 119, 6, 0.1)',
    warningBorder: 'rgba(217, 119, 6, 0.2)',
    error: '#dc2626',
    errorBg: 'rgba(220, 38, 38, 0.1)',
    errorBorder: 'rgba(220, 38, 38, 0.2)',
    info: '#2563eb',
    infoBg: 'rgba(37, 99, 235, 0.1)',
    infoBorder: 'rgba(37, 99, 235, 0.2)',
  },

  // Border Colors
  border: {
    primary: '#e5e5e5',
    secondary: '#d4d4d4',
    tertiary: '#a3a3a3',
    accent: '#7c3aed',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // Glow Effects
  glow: {
    sm: '0 0 10px rgba(124, 58, 237, 0.2)',
    base: '0 0 20px rgba(124, 58, 237, 0.25)',
    md: '0 0 30px rgba(124, 58, 237, 0.3)',
    lg: '0 0 40px rgba(124, 58, 237, 0.35)',
  },
} as const;

export type Theme = typeof lightTheme;
