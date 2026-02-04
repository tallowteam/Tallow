/**
 * Dark Theme Definition
 * Complete color tokens and design system values for dark mode
 */

export const darkTheme = {
  // Background Colors
  background: {
    primary: '#0a0a0a',
    secondary: '#111111',
    tertiary: '#171717',
    elevated: '#1a1a1a',
    overlay: 'rgba(0, 0, 0, 0.8)',
  },

  // Foreground Colors
  foreground: {
    primary: '#ffffff',
    secondary: '#a1a1a1',
    tertiary: '#666666',
    muted: '#404040',
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
    subtle: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
    glow: 'radial-gradient(circle at center, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
  },

  // Semantic Colors
  semantic: {
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.1)',
    successBorder: 'rgba(16, 185, 129, 0.2)',
    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.1)',
    warningBorder: 'rgba(245, 158, 11, 0.2)',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
    errorBorder: 'rgba(239, 68, 68, 0.2)',
    info: '#3b82f6',
    infoBg: 'rgba(59, 130, 246, 0.1)',
    infoBorder: 'rgba(59, 130, 246, 0.2)',
  },

  // Border Colors
  border: {
    primary: '#222222',
    secondary: '#333333',
    tertiary: '#404040',
    accent: '#7c3aed',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.6), 0 1px 2px -1px rgba(0, 0, 0, 0.6)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -2px rgba(0, 0, 0, 0.6)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.7), 0 4px 6px -4px rgba(0, 0, 0, 0.7)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.7)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
  },

  // Glow Effects
  glow: {
    sm: '0 0 10px rgba(124, 58, 237, 0.3)',
    base: '0 0 20px rgba(124, 58, 237, 0.4)',
    md: '0 0 30px rgba(124, 58, 237, 0.5)',
    lg: '0 0 40px rgba(124, 58, 237, 0.6)',
  },
} as const;

export type Theme = typeof darkTheme;
