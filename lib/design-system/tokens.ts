/**
 * TALLOW DESIGN SYSTEM - EXACT EUVEKA TOKENS
 *
 * Design tokens based on EXACT euveka.com design specifications:
 *
 * MONOCHROME COLOR PALETTE:
 * - Dark: #191610
 * - Background: #fefefc
 * - Neutrals: #fefdfb, #fcf6ec, #f3ede2, #e5dac7, #d6cec2, #b2987d, #544a36, #2c261c, #242018
 * - Accent: #fefefc (white)
 * - Error: #ff4f4f
 *
 * EUVEKA TYPOGRAPHY:
 * - Headlines: "PP Eiko" or "Cormorant Garamond", weight 100-300, line-height 0.95
 * - Body: "Inter", weight 400-500
 *
 * EUVEKA COMPONENTS:
 * - Buttons: pill shape (border-radius: 60px), height 56-64px
 * - Cards: border-radius 24-32px
 * - Blur effects: filter blur(84px)
 */

// ============================================================================
// EXACT EUVEKA COLOR PALETTE
// ============================================================================

export const euvekaColors = {
  // Core Named Colors
  dark: '#191610',
  background: '#fefefc',
  accent: '#fefefc',
  error: '#ff4f4f',

  // EXACT Neutral Scale from euveka.com
  neutrals: {
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
  },

  // Semantic Aliases
  text: {
    light: {
      primary: '#191610',
      secondary: '#2c261c',
      muted: '#544a36',
      disabled: '#b2987d',
    },
    dark: {
      primary: '#fefefc',
      secondary: '#d6cec2',
      muted: '#b2987d',
      disabled: '#544a36',
    },
  },

  // Border Colors
  border: {
    light: {
      default: '#d6cec2',
      subtle: '#e5dac7',
      hover: '#b2987d',
      focus: '#fefefc',
    },
    dark: {
      default: '#2c261c',
      subtle: '#544a36',
      hover: '#b2987d',
      focus: '#fefefc',
    },
  },

  // Status Colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ff4f4f',
    info: '#fefefc',
  },
} as const;

// ============================================================================
// EUVEKA SPACING SCALE
// ============================================================================

export const euvekaSpacing = {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '2.5': '10px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '15': '60px',
  '20': '80px',
  '24': '96px',
  '30': '120px',
} as const;

// ============================================================================
// EUVEKA BORDER RADIUS - EXACT SPECIFICATIONS
// ============================================================================

export const euvekaBorderRadius = {
  none: '0px',
  sm: '8px',
  DEFAULT: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',       // EUVEKA card radius
  '2xl': '28px',
  '3xl': '32px',    // EUVEKA large card radius
  '4xl': '40px',
  '5xl': '48px',
  '6xl': '60px',    // EUVEKA button/pill radius
  full: '9999px',

  // Named EUVEKA sizes
  card: '24px',
  cardLg: '32px',
  button: '60px',
  pill: '60px',
} as const;

// ============================================================================
// EUVEKA TYPOGRAPHY - EXACT SPECIFICATIONS
// ============================================================================

export const euvekaTypography = {
  fontFamily: {
    // PP Eiko style - elegant serif with thin weights
    display: ['var(--font-cormorant)', 'Cormorant Garamond', 'Georgia', 'serif'],
    // Body text
    body: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
  },
  fontWeight: {
    headline: {
      min: 100,
      max: 300,
    },
    body: {
      min: 400,
      max: 500,
    },
  },
  lineHeight: {
    headline: 0.95,  // EUVEKA specification
    body: 1.6,
  },
  fontSize: {
    'display-2xl': 'clamp(6rem, 4rem + 10vw, 10rem)',
    'display-xl': 'clamp(5rem, 3.5rem + 7.5vw, 8rem)',
    'display-lg': 'clamp(4rem, 3rem + 5vw, 6rem)',
    'display-md': 'clamp(3rem, 2.25rem + 3.75vw, 4.5rem)',
    'display-sm': 'clamp(2.5rem, 2rem + 2.5vw, 3.5rem)',
    'body-xl': 'clamp(1.25rem, 1vw + 0.75rem, 1.5rem)',
    'body-lg': 'clamp(1.125rem, 0.75vw + 0.75rem, 1.25rem)',
    'body': '1rem',
    'body-sm': '0.875rem',
  },
} as const;

// ============================================================================
// EUVEKA COMPONENT SPECIFICATIONS
// ============================================================================

export const euvekaComponents = {
  button: {
    height: {
      sm: '48px',
      default: '56px',
      lg: '64px',
    },
    borderRadius: '60px',  // Pill shape
  },
  card: {
    borderRadius: {
      default: '24px',
      lg: '32px',
    },
  },
  blur: {
    default: '84px',  // EUVEKA blur specification
    sm: '20px',
    lg: '120px',
  },
} as const;

// ============================================================================
// ANIMATION TOKENS
// ============================================================================

export const euvekaAnimations = {
  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '300ms',
    slow: '500ms',
    slower: '800ms',
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    smooth: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
} as const;

// ============================================================================
// THEME CONFIGURATIONS
// ============================================================================

export type ThemeName = 'default' | 'high-contrast';

export const themes = {
  default: {
    name: 'default',
    description: 'Black and white monochrome dark theme',
    colors: {
      background: '#191610',
      foreground: '#fefefc',
      primary: '#fefefc',
      primaryForeground: '#191610',
      accent: '#fefefc',
      accentForeground: '#191610',
      border: '#2c261c',
      ring: '#fefefc',
    },
  },
  'high-contrast': {
    name: 'high-contrast',
    description: 'WCAG AAA compliant high contrast theme',
    colors: {
      background: '#000000',
      foreground: '#ffffff',
      primary: '#ffff00',
      primaryForeground: '#000000',
      accent: '#ffff00',
      accentForeground: '#000000',
      border: '#ffffff',
      ring: '#ffff00',
    },
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getCSSVar(name: string): string {
  return `var(--${name})`;
}

export function hexToHSL(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {return '0 0% 0%';}

  const rHex = result[1] ?? '00';
  const gHex = result[2] ?? '00';
  const bHex = result[3] ?? '00';

  const r = parseInt(rHex, 16) / 255;
  const g = parseInt(gHex, 16) / 255;
  const b = parseInt(bHex, 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/**
 * Get EUVEKA neutral color by index (50-900)
 */
export function getEuvekaNeutral(index: keyof typeof euvekaColors.neutrals): string {
  return euvekaColors.neutrals[index];
}

/**
 * Get a complete EUVEKA theme configuration
 * (Always returns monochrome dark theme)
 */
export function getEuvekaTheme(_mode?: 'light' | 'dark') {
  return themes.default;
}

export default {
  euvekaColors,
  euvekaSpacing,
  euvekaBorderRadius,
  euvekaTypography,
  euvekaComponents,
  euvekaAnimations,
  themes,
  getCSSVar,
  hexToHSL,
  getEuvekaNeutral,
  getEuvekaTheme,
};
