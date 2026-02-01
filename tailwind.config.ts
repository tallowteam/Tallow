import type { Config } from "tailwindcss";
import type { PluginAPI } from "tailwindcss/types/config";

/**
 * TALLOW DESIGN SYSTEM 2026 - MONOCHROME DARK MODE
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
 *
 * Design Philosophy:
 * - Pure monochrome: black (#191610) background, white (#fefefc) accent
 * - Dark mode only (no light mode)
 * - Cormorant Garamond for display, Inter for body
 * - Organic border radii (24px cards, 60px pills)
 * - Spring-based animations with white glow effects
 * - Bento grid and glassmorphism
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type FontSizeValue = [
  fontSize: string,
  configuration: {
    lineHeight: string;
    letterSpacing?: string;
    fontWeight?: string;
  }
];

type KeyframeDefinition = Record<string, Record<string, string>>;

// ============================================================================
// DESIGN TOKENS
// ============================================================================

const DESIGN_TOKENS = {
  // Core Colors - EUVEKA Palette
  white: "#fefefc",
  black: "#191610",
  accent: "#fefefc",
  error: "#ff4f4f",

  // Spacing Grid (4px base)
  spacing: {
    "2.5": "10px",
    "4": "16px",
    "5": "20px",
    "8": "32px",
    "10": "40px",
    "15": "60px",
    "20": "80px",
    "30": "120px",
  },

  // Organic Border Radii (Euveka specification)
  radii: {
    organic: {
      sm: "12px",
      DEFAULT: "20px",
      md: "24px",
      lg: "28px",
      xl: "32px",
      "2xl": "60px",
    },
  },

  // Spring Easing Curves
  easing: {
    spring: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
    springTight: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    springLoose: "cubic-bezier(0.25, 0.8, 0.5, 1)",
    smooth: "cubic-bezier(0.16, 1, 0.3, 1)",
    easeOutExpo: "cubic-bezier(0.19, 1, 0.22, 1)",
    organic: "cubic-bezier(0.45, 0.05, 0.55, 0.95)",
  },
} as const;

// ============================================================================
// COLOR SCALES - EXACT EUVEKA PALETTE
// ============================================================================

const colors = {
  // CSS Variable References
  background: "var(--background)",
  foreground: "var(--foreground)",

  // Primary - EUVEKA White Accent
  primary: {
    DEFAULT: "#fefefc",
    foreground: "#191610",
  },

  // Secondary - EUVEKA Charcoal
  secondary: {
    DEFAULT: "#242018",
    foreground: "#fefefc",
  },

  // Muted - EUVEKA Warm Charcoal
  muted: {
    DEFAULT: "#2c261c",
    foreground: "#b2987d",
  },

  // EUVEKA Neutrals - EXACT warm grayscale from euveka.com
  euveka: {
    dark: "#191610",        // Primary dark background
    bg: "#fefefc",          // Primary light background
    50: "#fefdfb",          // Lightest neutral
    100: "#fcf6ec",         // Cream
    200: "#f3ede2",         // Warm off-white
    300: "#e5dac7",         // Sand light
    400: "#d6cec2",         // Sand medium
    500: "#b2987d",         // Sand dark / muted text
    600: "#544a36",         // Brown muted
    700: "#2c261c",         // Dark brown
    800: "#242018",         // Darker charcoal
    900: "#191610",         // Darkest (primary dark)
  },

  // Stone - Updated to EUVEKA warm tones
  stone: {
    50: "#fefdfb",
    100: "#fcf6ec",
    200: "#f3ede2",
    300: "#e5dac7",
    400: "#d6cec2",
    500: "#b2987d",
    600: "#544a36",
    700: "#2c261c",
    800: "#242018",
    900: "#191610",
    950: "#0f0e0a",
  },

  // Neutral - EUVEKA warm grayscale
  neutral: {
    50: "#fefdfb",
    100: "#fcf6ec",
    200: "#f3ede2",
    300: "#e5dac7",
    400: "#d6cec2",
    500: "#b2987d",
    600: "#544a36",
    700: "#2c261c",
    800: "#242018",
    900: "#191610",
    950: "#0f0e0a",
  },

  // Accent - EUVEKA White
  accent: {
    DEFAULT: "#fefefc",
    50: "#ffffff",
    100: "#fefefc",
    200: "#f5f5f3",
    300: "#e5e5e3",
    400: "#d5d5d3",
    500: "#c5c5c3",
    600: "#a5a5a3",
    700: "#858583",
    800: "#656563",
    900: "#454543",
    950: "#252523",
    foreground: "#191610",
  },

  // Surface Colors
  surface: {
    DEFAULT: "var(--surface)",
    primary: "var(--surface-primary)",
    secondary: "var(--surface-secondary)",
    tertiary: "var(--surface-tertiary)",
    elevated: "var(--surface-elevated)",
    overlay: "var(--surface-overlay)",
    inset: "var(--surface-inset)",
  },

  // Text Colors
  text: {
    DEFAULT: "var(--text-primary)",
    primary: "var(--text-primary)",
    secondary: "var(--text-secondary)",
    muted: "var(--text-muted)",
    disabled: "var(--text-disabled)",
    inverse: "var(--text-inverse)",
  },

  // Border Colors
  border: {
    DEFAULT: "var(--border)",
    light: "var(--border-light)",
    hover: "var(--border-hover)",
    focus: "var(--border-focus)",
  },

  // Component Colors (shadcn/ui compatibility)
  card: {
    DEFAULT: "var(--card)",
    foreground: "var(--card-foreground)",
    border: "var(--card-border)",
  },
  popover: {
    DEFAULT: "var(--popover)",
    foreground: "var(--popover-foreground)",
  },
  input: {
    DEFAULT: "var(--input)",
    border: "var(--input-border)",
    focus: "var(--input-focus)",
    placeholder: "var(--input-placeholder)",
  },
  destructive: {
    DEFAULT: "#ff4f4f",  // EUVEKA error red
    foreground: "#ffffff",
  },
  ring: "#fefefc",

  // Status Colors - EUVEKA palette
  success: {
    DEFAULT: "#22c55e",
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#14532d",
    950: "#052e16",
    foreground: "#ffffff",
  },
  warning: {
    DEFAULT: "#f59e0b",
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
    950: "#451a03",
    foreground: "#191610",
  },
  error: {
    DEFAULT: "#ff4f4f",  // EUVEKA error red
    50: "#fff2f2",
    100: "#ffe5e5",
    200: "#ffcccc",
    300: "#ffb3b3",
    400: "#ff8080",
    500: "#ff4f4f",
    600: "#e63e3e",
    700: "#cc2e2e",
    800: "#b31f1f",
    900: "#991010",
    950: "#660808",
    foreground: "#ffffff",
  },

  // Chart Colors - Monochromatic
  chart: {
    1: "#fefefc",
    2: "#a8a29e",
    3: "#78716c",
    4: "#57534e",
    5: "#44403c",
    6: "#292524",
  },

  // Sidebar
  sidebar: {
    DEFAULT: "var(--sidebar)",
    foreground: "var(--sidebar-foreground)",
    primary: "#fefefc",
    "primary-foreground": "#191610",
    accent: "var(--sidebar-accent)",
    "accent-foreground": "var(--sidebar-accent-foreground)",
    border: "var(--sidebar-border)",
    ring: "#fefefc",
  },
};

// ============================================================================
// FLUID TYPOGRAPHY
// ============================================================================

const fontSize: Record<string, FontSizeValue> = {
  // Extra small
  "2xs": ["0.625rem", { lineHeight: "0.875rem", letterSpacing: "0.02em" }],

  // Fluid body sizes (clamp-based)
  "fluid-xs": ["clamp(0.6875rem, 0.65rem + 0.1875vw, 0.75rem)", { lineHeight: "1.5" }],
  "fluid-sm": ["clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)", { lineHeight: "1.5" }],
  "fluid-base": ["clamp(0.875rem, 0.8rem + 0.375vw, 1rem)", { lineHeight: "1.6" }],
  "fluid-lg": ["clamp(1rem, 0.925rem + 0.375vw, 1.125rem)", { lineHeight: "1.5" }],
  "fluid-xl": ["clamp(1.125rem, 1rem + 0.625vw, 1.25rem)", { lineHeight: "1.4" }],

  // Fluid heading sizes
  "fluid-2xl": ["clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)", { lineHeight: "1.3", letterSpacing: "-0.01em" }],
  "fluid-3xl": ["clamp(1.5rem, 1.25rem + 1.25vw, 2rem)", { lineHeight: "1.2", letterSpacing: "-0.02em" }],
  "fluid-4xl": ["clamp(1.875rem, 1.5rem + 1.875vw, 2.5rem)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
  "fluid-5xl": ["clamp(2.25rem, 1.75rem + 2.5vw, 3rem)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
  "fluid-6xl": ["clamp(3rem, 2.25rem + 3.75vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
  "fluid-7xl": ["clamp(3.75rem, 2.75rem + 5vw, 5rem)", { lineHeight: "1", letterSpacing: "-0.04em" }],
  "fluid-8xl": ["clamp(4.5rem, 3.25rem + 6.25vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.04em" }],

  // Display sizes (hero headlines)
  "display-sm": ["clamp(2.5rem, 2rem + 2.5vw, 3.5rem)", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
  "display-md": ["clamp(3rem, 2.25rem + 3.75vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
  "display-lg": ["clamp(4rem, 3rem + 5vw, 6rem)", { lineHeight: "1", letterSpacing: "-0.04em" }],
  "display-xl": ["clamp(5rem, 3.5rem + 7.5vw, 8rem)", { lineHeight: "0.95", letterSpacing: "-0.05em" }],
  "display-2xl": ["clamp(6rem, 4rem + 10vw, 10rem)", { lineHeight: "0.9", letterSpacing: "-0.05em" }],

  // Static fallbacks
  "3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "-0.02em" }],
  "4xl": ["2.25rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
  "5xl": ["3rem", { lineHeight: "1.15", letterSpacing: "-0.03em" }],
  "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
  "7xl": ["4.5rem", { lineHeight: "1.05", letterSpacing: "-0.04em" }],
  "8xl": ["6rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
  "9xl": ["8rem", { lineHeight: "1", letterSpacing: "-0.05em" }],
};

// ============================================================================
// KEYFRAME ANIMATIONS - WHITE GLOW EFFECTS
// ============================================================================

const keyframes: KeyframeDefinition = {
  // Fade animations
  "fade-in": {
    "0%": "opacity: 0",
    "100%": "opacity: 1",
  },
  "fade-out": {
    "0%": "opacity: 1",
    "100%": "opacity: 0",
  },
  "fade-up": {
    "0%": "opacity: 0; transform: translateY(24px)",
    "100%": "opacity: 1; transform: translateY(0)",
  },
  "fade-down": {
    "0%": "opacity: 0; transform: translateY(-24px)",
    "100%": "opacity: 1; transform: translateY(0)",
  },
  "fade-left": {
    "0%": "opacity: 0; transform: translateX(24px)",
    "100%": "opacity: 1; transform: translateX(0)",
  },
  "fade-right": {
    "0%": "opacity: 0; transform: translateX(-24px)",
    "100%": "opacity: 1; transform: translateX(0)",
  },

  // Scale animations
  "scale-in": {
    "0%": "opacity: 0; transform: scale(0.92)",
    "100%": "opacity: 1; transform: scale(1)",
  },
  "scale-out": {
    "0%": "opacity: 1; transform: scale(1)",
    "100%": "opacity: 0; transform: scale(0.92)",
  },
  "scale-up": {
    "0%": "opacity: 0; transform: scale(0.85)",
    "100%": "opacity: 1; transform: scale(1)",
  },
  "scale-bounce": {
    "0%": "opacity: 0; transform: scale(0.9)",
    "50%": "transform: scale(1.03)",
    "100%": "opacity: 1; transform: scale(1)",
  },

  // White glow pulse animations
  "glow-pulse": {
    "0%, 100%": "box-shadow: 0 0 20px rgba(254, 254, 252, 0.25)",
    "50%": "box-shadow: 0 0 40px rgba(254, 254, 252, 0.5)",
  },
  "glow-pulse-soft": {
    "0%, 100%": "box-shadow: 0 0 12px rgba(254, 254, 252, 0.15)",
    "50%": "box-shadow: 0 0 28px rgba(254, 254, 252, 0.35)",
  },
  "glow-breathe": {
    "0%, 100%": "box-shadow: 0 0 16px rgba(254, 254, 252, 0.2); opacity: 0.9",
    "50%": "box-shadow: 0 0 36px rgba(254, 254, 252, 0.45); opacity: 1",
  },
  "glow-intense": {
    "0%, 100%": "box-shadow: 0 0 30px rgba(254, 254, 252, 0.3), 0 0 60px rgba(254, 254, 252, 0.15)",
    "50%": "box-shadow: 0 0 50px rgba(254, 254, 252, 0.5), 0 0 100px rgba(254, 254, 252, 0.25)",
  },

  // Float animation
  float: {
    "0%, 100%": "transform: translateY(0)",
    "50%": "transform: translateY(-12px)",
  },
  "float-slow": {
    "0%, 100%": "transform: translateY(0)",
    "50%": "transform: translateY(-16px)",
  },
  "float-gentle": {
    "0%, 100%": "transform: translateY(0) rotate(0deg)",
    "25%": "transform: translateY(-6px) rotate(0.5deg)",
    "75%": "transform: translateY(-4px) rotate(-0.5deg)",
  },

  // Slide animations
  "slide-up": {
    "0%": "opacity: 0; transform: translateY(100%)",
    "100%": "opacity: 1; transform: translateY(0)",
  },
  "slide-down": {
    "0%": "opacity: 0; transform: translateY(-100%)",
    "100%": "opacity: 1; transform: translateY(0)",
  },
  "slide-left": {
    "0%": "opacity: 0; transform: translateX(100%)",
    "100%": "opacity: 1; transform: translateX(0)",
  },
  "slide-right": {
    "0%": "opacity: 0; transform: translateX(-100%)",
    "100%": "opacity: 1; transform: translateX(0)",
  },

  // Bounce animations
  "bounce-soft": {
    "0%": "transform: translateY(0)",
    "50%": "transform: translateY(-8px)",
    "100%": "transform: translateY(0)",
  },
  "bounce-in": {
    "0%": "opacity: 0; transform: scale(0.3)",
    "50%": "transform: scale(1.05)",
    "70%": "transform: scale(0.95)",
    "100%": "opacity: 1; transform: scale(1)",
  },

  // Shimmer loading effect
  shimmer: {
    "0%": "background-position: -200% 0",
    "100%": "background-position: 200% 0",
  },

  // Shake animation
  shake: {
    "0%, 100%": "transform: translateX(0)",
    "10%, 30%, 50%, 70%, 90%": "transform: translateX(-4px)",
    "20%, 40%, 60%, 80%": "transform: translateX(4px)",
  },
  "shake-soft": {
    "0%, 100%": "transform: translateX(0)",
    "25%": "transform: translateX(-2px)",
    "75%": "transform: translateX(2px)",
  },

  // Ripple effect
  ripple: {
    "0%": "transform: scale(0); opacity: 1",
    "100%": "transform: scale(4); opacity: 0",
  },

  // Spin variations
  "spin-slow": {
    "0%": "transform: rotate(0deg)",
    "100%": "transform: rotate(360deg)",
  },

  // Pulse variations
  "pulse-soft": {
    "0%, 100%": "opacity: 1",
    "50%": "opacity: 0.5",
  },
  "pulse-scale": {
    "0%, 100%": "transform: scale(1); opacity: 1",
    "50%": "transform: scale(1.05); opacity: 0.85",
  },

  // Gradient shift
  "gradient-shift": {
    "0%": "background-position: 0% 50%",
    "50%": "background-position: 100% 50%",
    "100%": "background-position: 0% 50%",
  },

  // Border glow - WHITE
  "border-glow": {
    "0%, 100%": "border-color: rgba(254, 254, 252, 0.3)",
    "50%": "border-color: rgba(254, 254, 252, 0.8)",
  },

  // Bento card reveal
  "bento-reveal": {
    "0%": "opacity: 0; transform: translateY(32px) scale(0.95)",
    "100%": "opacity: 1; transform: translateY(0) scale(1)",
  },

  // Accordion (Radix UI)
  "accordion-down": {
    "0%": "height: 0; opacity: 0",
    "100%": "height: var(--radix-accordion-content-height); opacity: 1",
  },
  "accordion-up": {
    "0%": "height: var(--radix-accordion-content-height); opacity: 1",
    "100%": "height: 0; opacity: 0",
  },

  // Collapsible (Radix UI)
  "collapsible-down": {
    "0%": "height: 0; opacity: 0",
    "100%": "height: var(--radix-collapsible-content-height); opacity: 1",
  },
  "collapsible-up": {
    "0%": "height: var(--radix-collapsible-content-height); opacity: 1",
    "100%": "height: 0; opacity: 0",
  },

  // Progress bar
  progress: {
    "0%": "width: 0%",
    "100%": "width: 100%",
  },
  "progress-indeterminate": {
    "0%": "transform: translateX(-100%)",
    "100%": "transform: translateX(200%)",
  },

  // Blink cursor
  blink: {
    "0%, 100%": "opacity: 1",
    "50%": "opacity: 0",
  },

  // Entrance wobble
  wobble: {
    "0%": "transform: translateX(0%)",
    "15%": "transform: translateX(-25%) rotate(-5deg)",
    "30%": "transform: translateX(20%) rotate(3deg)",
    "45%": "transform: translateX(-15%) rotate(-3deg)",
    "60%": "transform: translateX(10%) rotate(2deg)",
    "75%": "transform: translateX(-5%) rotate(-1deg)",
    "100%": "transform: translateX(0%)",
  },

  // Parallax float
  "parallax-float": {
    "0%": "transform: translateY(0) scale(1)",
    "33%": "transform: translateY(-8px) scale(1.01)",
    "66%": "transform: translateY(-4px) scale(1.005)",
    "100%": "transform: translateY(0) scale(1)",
  },

  // Text reveal
  "text-reveal": {
    "0%": "clip-path: inset(0 100% 0 0)",
    "100%": "clip-path: inset(0 0 0 0)",
  },

  // Morph blob
  "morph-blob": {
    "0%, 100%": "border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%",
    "50%": "border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%",
  },
};

// Convert keyframes to proper Tailwind format
const formattedKeyframes: Record<string, Record<string, Record<string, string>>> = {};
for (const [name, frames] of Object.entries(keyframes)) {
  formattedKeyframes[name] = {};
  for (const [key, value] of Object.entries(frames)) {
    const properties: Record<string, string> = {};
    value.split(";").forEach((prop) => {
      const [propName, propValue] = prop.split(":").map((s) => s.trim());
      if (propName && propValue) {
        // Convert kebab-case to camelCase for Tailwind
        const camelPropName = propName.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        properties[camelPropName] = propValue;
      }
    });
    formattedKeyframes[name][key] = properties;
  }
}

// ============================================================================
// TAILWIND CONFIGURATION
// ============================================================================

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    // =========================================================================
    // BREAKPOINTS
    // =========================================================================
    screens: {
      // Mobile-first breakpoints
      xs: "375px",
      sm: "480px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      "3xl": "1920px",
      "4xl": "2560px",  // 4K / Ultra-wide
      "5xl": "3840px",  // True 4K

      // Capability-based queries
      touch: { raw: "(pointer: coarse)" },
      stylus: { raw: "(pointer: fine) and (hover: none)" },
      mouse: { raw: "(pointer: fine) and (hover: hover)" },
      portrait: { raw: "(orientation: portrait)" },
      landscape: { raw: "(orientation: landscape)" },
      retina: { raw: "(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)" },
      "reduced-motion": { raw: "(prefers-reduced-motion: reduce)" },
      "prefers-dark": { raw: "(prefers-color-scheme: dark)" },
      print: { raw: "print" },

      // Container queries
      "container-sm": { raw: "(min-width: 20rem)" },
      "container-md": { raw: "(min-width: 28rem)" },
      "container-lg": { raw: "(min-width: 32rem)" },
    },

    // =========================================================================
    // CONTAINER
    // =========================================================================
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "3rem",
        xl: "4rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },

    extend: {
      // =======================================================================
      // COLORS
      // =======================================================================
      colors,

      // =======================================================================
      // FONT FAMILIES - Cormorant Garamond + Inter
      // =======================================================================
      fontFamily: {
        // Display - Cormorant Garamond (elegant serif)
        display: [
          "var(--font-cormorant)",
          "Cormorant Garamond",
          "Cormorant",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        // Sans - Inter (clean body text)
        sans: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // Body alias
        body: [
          "var(--font-inter)",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        // Mono - Geist Mono
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "JetBrains Mono",
          "Fira Code",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
        // Serif fallback
        serif: [
          "var(--font-cormorant)",
          "Cormorant Garamond",
          "Georgia",
          "ui-serif",
          "serif",
        ],
      },

      // =======================================================================
      // FONT SIZES (Fluid)
      // =======================================================================
      fontSize,

      // =======================================================================
      // LINE HEIGHT
      // =======================================================================
      lineHeight: {
        tighter: "1.1",
        tight: "1.25",
        snug: "1.375",
        relaxed: "1.625",
        loose: "1.75",
        "extra-loose": "2",
      },

      // =======================================================================
      // LETTER SPACING
      // =======================================================================
      letterSpacing: {
        tightest: "-0.05em",
        "extra-tight": "-0.04em",
        "super-wide": "0.15em",
        "ultra-wide": "0.2em",
      },

      // =======================================================================
      // SPACING (4px grid based)
      // =======================================================================
      spacing: {
        // Custom specified values
        "2.5": "10px",
        "4": "16px",
        "5": "20px",
        "8": "32px",
        "10": "40px",
        "15": "60px",
        "20": "80px",
        "30": "120px",

        // Extended 4px grid
        "0.5": "2px",
        "1.5": "6px",
        "3.5": "14px",
        "4.5": "18px",
        "13": "52px",
        "17": "68px",
        "18": "72px",
        "19": "76px",
        "22": "88px",
        "26": "104px",
        "34": "136px",
        "38": "152px",
        "42": "168px",
        "46": "184px",
        "50": "200px",
        "54": "216px",
        "58": "232px",
        "62": "248px",
        "66": "264px",
        "70": "280px",
        "74": "296px",
        "78": "312px",
        "82": "328px",
        "86": "344px",
        "90": "360px",
        "94": "376px",
        "100": "400px",
        "112": "448px",
        "120": "480px",
        "128": "512px",
        "140": "560px",
        "160": "640px",
        "180": "720px",
        "200": "800px",
      },

      // =======================================================================
      // BORDER RADIUS - EUVEKA SPECIFICATION
      // Cards: 24-32px, Buttons/Pills: 60px
      // =======================================================================
      borderRadius: {
        none: "0",
        xs: "4px",
        sm: "8px",
        DEFAULT: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",       // EUVEKA card radius
        "2xl": "28px",
        "3xl": "32px",    // EUVEKA large card radius
        "4xl": "40px",
        "5xl": "48px",
        "6xl": "60px",    // EUVEKA button/pill radius
        full: "9999px",

        // EUVEKA Named scale
        card: "24px",           // Standard card
        "card-lg": "32px",      // Large card
        button: "60px",         // Button/pill shape
        pill: "60px",           // Pill buttons
        "organic-sm": "20px",
        organic: "24px",
        "organic-md": "28px",
        "organic-lg": "32px",
        "organic-xl": "60px",
      },

      // =======================================================================
      // BOX SHADOWS - WHITE GLOW FOCUS
      // =======================================================================
      boxShadow: {
        // Subtle shadows
        "subtle-xs": "0 1px 2px rgba(0, 0, 0, 0.03)",
        "subtle-sm": "0 2px 4px rgba(0, 0, 0, 0.04)",
        subtle: "0 4px 8px rgba(0, 0, 0, 0.05)",
        "subtle-md": "0 6px 12px rgba(0, 0, 0, 0.06)",
        "subtle-lg": "0 8px 16px rgba(0, 0, 0, 0.07)",

        // Tactile shadows (physical feel)
        "tactile-xs": "0 1px 2px rgba(0, 0, 0, 0.05), 0 1px 4px rgba(0, 0, 0, 0.05)",
        "tactile-sm": "0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04)",
        tactile: "0 4px 8px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        "tactile-md": "0 6px 16px rgba(0, 0, 0, 0.1), 0 3px 6px rgba(0, 0, 0, 0.05)",
        "tactile-lg": "0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",
        "tactile-xl": "0 20px 48px rgba(0, 0, 0, 0.14), 0 8px 16px rgba(0, 0, 0, 0.08)",
        "tactile-2xl": "0 32px 64px rgba(0, 0, 0, 0.16), 0 12px 24px rgba(0, 0, 0, 0.1)",

        // Elevated (floating elements)
        "elevated-sm": "0 4px 12px rgba(0, 0, 0, 0.1)",
        elevated: "0 8px 24px rgba(0, 0, 0, 0.12)",
        "elevated-md": "0 12px 36px rgba(0, 0, 0, 0.14)",
        "elevated-lg": "0 16px 48px rgba(0, 0, 0, 0.16)",
        "elevated-xl": "0 24px 64px rgba(0, 0, 0, 0.18)",

        // Card shadows
        card: "0 4px 16px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        "card-active": "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-lg": "0 12px 48px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.06)",

        // WHITE glow effects
        "glow-white-xs": "0 0 8px rgba(254, 254, 252, 0.2)",
        "glow-white-sm": "0 0 12px rgba(254, 254, 252, 0.25)",
        "glow-white": "0 0 20px rgba(254, 254, 252, 0.3)",
        "glow-white-md": "0 0 30px rgba(254, 254, 252, 0.35)",
        "glow-white-lg": "0 0 40px rgba(254, 254, 252, 0.4)",
        "glow-white-xl": "0 0 60px rgba(254, 254, 252, 0.5)",
        "glow-white-2xl": "0 0 80px rgba(254, 254, 252, 0.6)",
        "glow-white-intense": "0 0 40px rgba(254, 254, 252, 0.5), 0 0 80px rgba(254, 254, 252, 0.3)",

        // Alias for backwards compatibility
        glow: "0 0 20px rgba(254, 254, 252, 0.3)",
        "glow-sm": "0 0 12px rgba(254, 254, 252, 0.25)",
        "glow-md": "0 0 30px rgba(254, 254, 252, 0.35)",
        "glow-lg": "0 0 40px rgba(254, 254, 252, 0.4)",
        "glow-xl": "0 0 60px rgba(254, 254, 252, 0.5)",

        // Status glows (warm tones)
        "glow-success": "0 0 20px rgba(34, 197, 94, 0.3)",
        "glow-warning": "0 0 20px rgba(245, 158, 11, 0.3)",
        "glow-error": "0 0 20px rgba(239, 68, 68, 0.3)",

        // Inner shadows
        "inner-sm": "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
        inner: "inset 0 2px 4px rgba(0, 0, 0, 0.08)",
        "inner-md": "inset 0 4px 8px rgba(0, 0, 0, 0.1)",
        "inner-lg": "inset 0 6px 12px rgba(0, 0, 0, 0.12)",
        "inner-glow": "inset 0 0 20px rgba(254, 254, 252, 0.08)",

        // Border shadows - WHITE
        "border-glow": "0 0 0 2px rgba(254, 254, 252, 0.2)",
        "border-glow-strong": "0 0 0 3px rgba(254, 254, 252, 0.3)",

        // Dark mode shadows
        "dark-sm": "0 2px 8px rgba(0, 0, 0, 0.5)",
        dark: "0 4px 16px rgba(0, 0, 0, 0.6)",
        "dark-lg": "0 8px 32px rgba(0, 0, 0, 0.7)",
        "dark-xl": "0 16px 48px rgba(0, 0, 0, 0.8)",

        // Soft shadows
        "soft-sm": "0 2px 8px -2px rgba(0, 0, 0, 0.35)",
        soft: "0 4px 16px -4px rgba(0, 0, 0, 0.45)",
        "soft-lg": "0 8px 32px -8px rgba(0, 0, 0, 0.55)",
        "soft-xl": "0 16px 48px -12px rgba(0, 0, 0, 0.65)",

        // Elevation system
        "elevation-1": "0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)",
        "elevation-2": "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)",
        "elevation-3": "0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)",
        "elevation-4": "0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)",
        "elevation-5": "0 25px 50px rgba(0, 0, 0, 0.15)",
      },

      // =======================================================================
      // KEYFRAMES
      // =======================================================================
      keyframes: formattedKeyframes,

      // =======================================================================
      // ANIMATIONS
      // =======================================================================
      animation: {
        // Fade animations
        "fade-in": `fade-in 0.4s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-in-fast": `fade-in 0.2s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-in-slow": `fade-in 0.6s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-out": `fade-out 0.3s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-up": `fade-up 0.6s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-up-fast": `fade-up 0.4s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-down": `fade-down 0.6s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-left": `fade-left 0.6s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "fade-right": `fade-right 0.6s ${DESIGN_TOKENS.easing.smooth} forwards`,

        // Scale animations (spring easing)
        "scale-in": `scale-in 0.4s ${DESIGN_TOKENS.easing.springTight} forwards`,
        "scale-in-fast": `scale-in 0.2s ${DESIGN_TOKENS.easing.springTight} forwards`,
        "scale-out": `scale-out 0.2s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "scale-up": `scale-up 0.4s ${DESIGN_TOKENS.easing.springTight} forwards`,
        "scale-bounce": `scale-bounce 0.5s ${DESIGN_TOKENS.easing.springTight} forwards`,

        // Slide animations
        "slide-up": `slide-up 0.5s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "slide-down": `slide-down 0.5s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "slide-left": `slide-left 0.5s ${DESIGN_TOKENS.easing.smooth} forwards`,
        "slide-right": `slide-right 0.5s ${DESIGN_TOKENS.easing.smooth} forwards`,

        // Bounce animations
        "bounce-soft": "bounce-soft 2s ease-in-out infinite",
        "bounce-in": `bounce-in 0.6s ${DESIGN_TOKENS.easing.springTight} forwards`,

        // Glow animations - WHITE
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "glow-pulse-fast": "glow-pulse 1s ease-in-out infinite",
        "glow-pulse-soft": "glow-pulse-soft 3s ease-in-out infinite",
        "glow-breathe": "glow-breathe 4s ease-in-out infinite",
        "glow-intense": "glow-intense 3s ease-in-out infinite",

        // Float animations
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "float-fast": "float 4s ease-in-out infinite",
        "float-gentle": "float-gentle 5s ease-in-out infinite",

        // Spin
        "spin-slow": "spin-slow 3s linear infinite",

        // Pulse
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "pulse-scale": "pulse-scale 2s ease-in-out infinite",

        // Shimmer
        shimmer: "shimmer 2s linear infinite",

        // Shake
        shake: "shake 0.5s ease-in-out",
        "shake-soft": "shake-soft 0.3s ease-in-out",

        // Ripple
        ripple: "ripple 0.6s linear forwards",

        // Accordion/Collapsible
        "accordion-down": "accordion-down 0.25s ease-out forwards",
        "accordion-up": "accordion-up 0.25s ease-out forwards",
        "collapsible-down": "collapsible-down 0.3s ease-out forwards",
        "collapsible-up": "collapsible-up 0.3s ease-out forwards",

        // Progress
        progress: "progress 1s ease-out forwards",
        "progress-indeterminate": "progress-indeterminate 1.5s ease-in-out infinite",

        // Blink
        blink: "blink 1s step-end infinite",

        // Gradient
        "gradient-shift": "gradient-shift 3s ease infinite",

        // Border - WHITE glow
        "border-glow": "border-glow 2s ease-in-out infinite",

        // Bento
        "bento-reveal": `bento-reveal 0.7s ${DESIGN_TOKENS.easing.smooth} forwards`,

        // Wobble
        wobble: "wobble 0.8s ease-in-out",

        // Parallax float
        "parallax-float": "parallax-float 10s ease-in-out infinite",

        // Morph
        "morph-blob": "morph-blob 8s ease-in-out infinite",
      },

      // =======================================================================
      // TRANSITION TIMING FUNCTIONS (Spring Easing)
      // =======================================================================
      transitionTimingFunction: {
        smooth: DESIGN_TOKENS.easing.smooth,
        spring: DESIGN_TOKENS.easing.spring,
        "spring-tight": DESIGN_TOKENS.easing.springTight,
        "spring-loose": DESIGN_TOKENS.easing.springLoose,
        "ease-out-expo": DESIGN_TOKENS.easing.easeOutExpo,
        organic: DESIGN_TOKENS.easing.organic,
        bounce: DESIGN_TOKENS.easing.springTight,
        "bounce-soft": "cubic-bezier(0.34, 1.2, 0.64, 1)",
        "ease-in-out-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },

      // =======================================================================
      // TRANSITION DURATIONS
      // =======================================================================
      transitionDuration: {
        "0": "0ms",
        "75": "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "300": "300ms",
        "350": "350ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "900": "900ms",
        "1000": "1000ms",
        "1200": "1200ms",
        "1500": "1500ms",
        "2000": "2000ms",
      },

      // =======================================================================
      // Z-INDEX
      // =======================================================================
      zIndex: {
        "0": "0",
        "1": "1",
        "2": "2",
        "5": "5",
        dropdown: "50",
        sticky: "100",
        fixed: "200",
        drawer: "300",
        "modal-backdrop": "400",
        modal: "500",
        popover: "600",
        tooltip: "700",
        toast: "800",
        spotlight: "900",
        max: "9999",
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },

      // =======================================================================
      // MAX WIDTH
      // =======================================================================
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
        "10xl": "104rem",
        "prose-sm": "55ch",
        prose: "65ch",
        "prose-lg": "75ch",
        "prose-xl": "85ch",
        content: "1200px",
        wide: "1400px",
        "full-bleed": "1800px",
      },

      // =======================================================================
      // ASPECT RATIOS
      // =======================================================================
      aspectRatio: {
        auto: "auto",
        square: "1 / 1",
        video: "16 / 9",
        photo: "4 / 3",
        portrait: "3 / 4",
        "portrait-tall": "9 / 16",
        ultrawide: "21 / 9",
        cinema: "2.35 / 1",
        golden: "1.618 / 1",
        card: "5 / 7",
        hero: "16 / 6",
        banner: "3 / 1",
      },

      // =======================================================================
      // BACKDROP BLUR - EUVEKA uses filter blur(84px)
      // =======================================================================
      backdropBlur: {
        xs: "2px",
        "3xl": "64px",
        "4xl": "84px",    // EUVEKA blur specification
        "5xl": "96px",
        euveka: "84px",   // EUVEKA primary blur effect
      },

      // =======================================================================
      // BACKGROUND IMAGES - NO BLUE GRADIENTS
      // =======================================================================
      backgroundImage: {
        // Gradients
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-shine": "linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.1) 50%, transparent 75%)",

        // Black & White gradients
        "gradient-dark": "linear-gradient(135deg, #0a0a08 0%, #1a1918 100%)",
        "gradient-dark-deep": "linear-gradient(135deg, #000000 0%, #0a0a08 100%)",
        "gradient-light": "linear-gradient(135deg, #fefefc 0%, #f5f5f4 100%)",
        "gradient-white-fade": "linear-gradient(135deg, rgba(254,254,252,0.2) 0%, transparent 100%)",
        "gradient-black-fade": "linear-gradient(135deg, rgba(10,10,8,0.2) 0%, transparent 100%)",

        // Warm neutral gradients
        "gradient-warm": "linear-gradient(135deg, #fefefc 0%, #faf8f5 100%)",
        "gradient-sand": "linear-gradient(135deg, #f5f0ea 0%, #e8dfd3 100%)",
        "gradient-stone": "linear-gradient(135deg, #f5f5f4 0%, #e7e5e4 100%)",

        // Mesh gradients (monochromatic)
        "mesh-dark": "radial-gradient(at 40% 20%, rgba(254, 254, 252, 0.05) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(168, 162, 158, 0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(120, 113, 108, 0.05) 0px, transparent 50%)",
        "mesh-light": "radial-gradient(at 40% 20%, rgba(10, 10, 8, 0.03) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(26, 25, 24, 0.03) 0px, transparent 50%)",
        "mesh-warm": "radial-gradient(at 20% 30%, rgba(184, 163, 137, 0.1) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(212, 196, 176, 0.08) 0px, transparent 50%)",

        // Noise texture
        noise:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",

        // Dot patterns
        "dots-light": "radial-gradient(circle, rgba(0,0,0,0.1) 1px, transparent 1px)",
        "dots-dark": "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
      },

      // =======================================================================
      // GRID TEMPLATE COLUMNS
      // =======================================================================
      gridTemplateColumns: {
        "13": "repeat(13, minmax(0, 1fr))",
        "14": "repeat(14, minmax(0, 1fr))",
        "15": "repeat(15, minmax(0, 1fr))",
        "16": "repeat(16, minmax(0, 1fr))",

        // Auto-fit responsive
        "auto-fit-xs": "repeat(auto-fit, minmax(120px, 1fr))",
        "auto-fit-sm": "repeat(auto-fit, minmax(180px, 1fr))",
        "auto-fit-md": "repeat(auto-fit, minmax(250px, 1fr))",
        "auto-fit-lg": "repeat(auto-fit, minmax(320px, 1fr))",
        "auto-fit-xl": "repeat(auto-fit, minmax(400px, 1fr))",

        // Auto-fill responsive
        "auto-fill-xs": "repeat(auto-fill, minmax(120px, 1fr))",
        "auto-fill-sm": "repeat(auto-fill, minmax(180px, 1fr))",
        "auto-fill-md": "repeat(auto-fill, minmax(250px, 1fr))",
        "auto-fill-lg": "repeat(auto-fill, minmax(320px, 1fr))",

        // Bento layouts
        "bento-2": "repeat(2, 1fr)",
        "bento-3": "repeat(3, 1fr)",
        "bento-4": "repeat(4, 1fr)",
        "bento-6": "repeat(6, 1fr)",

        // Asymmetric
        sidebar: "280px 1fr",
        "sidebar-lg": "320px 1fr",
        "content-sidebar": "1fr 300px",
        golden: "1fr 1.618fr",
        "golden-reverse": "1.618fr 1fr",
      },

      // =======================================================================
      // GRID TEMPLATE ROWS
      // =======================================================================
      gridTemplateRows: {
        "7": "repeat(7, minmax(0, 1fr))",
        "8": "repeat(8, minmax(0, 1fr))",
        "9": "repeat(9, minmax(0, 1fr))",
        "10": "repeat(10, minmax(0, 1fr))",
        "12": "repeat(12, minmax(0, 1fr))",

        // Layout rows
        "header-content": "auto 1fr",
        "header-content-footer": "auto 1fr auto",
        "content-footer": "1fr auto",
      },

      // =======================================================================
      // WIDTH
      // =======================================================================
      width: {
        content: "65ch",
        "wide-content": "75ch",
      },

      // =======================================================================
      // HEIGHT
      // =======================================================================
      height: {
        "screen-dvh": "100dvh",
        "screen-svh": "100svh",
        "screen-lvh": "100lvh",
      },

      // =======================================================================
      // MIN HEIGHT
      // =======================================================================
      minHeight: {
        "screen-dvh": "100dvh",
        "screen-svh": "100svh",
        "screen-lvh": "100lvh",
      },
    },
  },

  // ===========================================================================
  // PLUGINS
  // ===========================================================================
  plugins: [
    // -------------------------------------------------------------------------
    // Bento Grid Plugin
    // -------------------------------------------------------------------------
    function ({ addComponents, addUtilities, theme }: PluginAPI) {
      // Bento Grid Components
      addComponents({
        // Base bento grid
        ".bento-grid": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        },

        // Responsive bento variants
        ".bento-grid-2": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "repeat(2, 1fr)",
          "@screen md": {
            gridTemplateColumns: "repeat(2, 1fr)",
          },
          "@media (max-width: 640px)": {
            gridTemplateColumns: "1fr",
          },
        },
        ".bento-grid-3": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "repeat(3, 1fr)",
          "@screen lg": {
            gridTemplateColumns: "repeat(3, 1fr)",
          },
          "@media (max-width: 1024px)": {
            gridTemplateColumns: "repeat(2, 1fr)",
          },
          "@media (max-width: 640px)": {
            gridTemplateColumns: "1fr",
          },
        },
        ".bento-grid-4": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "repeat(4, 1fr)",
          "@screen xl": {
            gridTemplateColumns: "repeat(4, 1fr)",
          },
          "@media (max-width: 1280px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
          },
          "@media (max-width: 1024px)": {
            gridTemplateColumns: "repeat(2, 1fr)",
          },
          "@media (max-width: 640px)": {
            gridTemplateColumns: "1fr",
          },
        },
        ".bento-grid-6": {
          display: "grid",
          gap: theme("spacing.4"),
          gridTemplateColumns: "repeat(6, 1fr)",
          "@media (max-width: 1280px)": {
            gridTemplateColumns: "repeat(4, 1fr)",
          },
          "@media (max-width: 1024px)": {
            gridTemplateColumns: "repeat(3, 1fr)",
          },
          "@media (max-width: 768px)": {
            gridTemplateColumns: "repeat(2, 1fr)",
          },
          "@media (max-width: 480px)": {
            gridTemplateColumns: "1fr",
          },
        },

        // Featured bento layout
        ".bento-featured": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "2fr 1fr",
          gridTemplateRows: "1fr 1fr",
          "@media (max-width: 1024px)": {
            gridTemplateColumns: "1fr",
            gridTemplateRows: "auto",
          },
        },

        // Masonry-like bento
        ".bento-masonry": {
          display: "grid",
          gap: theme("spacing.6"),
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gridAutoRows: "minmax(200px, auto)",
          gridAutoFlow: "dense",
        },
      });

      // Bento Span Utilities
      addUtilities({
        // Column spans
        ".bento-span-2": {
          gridColumn: "span 2",
          "@media (max-width: 640px)": {
            gridColumn: "span 1",
          },
        },
        ".bento-span-3": {
          gridColumn: "span 3",
          "@media (max-width: 1024px)": {
            gridColumn: "span 2",
          },
          "@media (max-width: 640px)": {
            gridColumn: "span 1",
          },
        },
        ".bento-span-4": {
          gridColumn: "span 4",
          "@media (max-width: 1280px)": {
            gridColumn: "span 3",
          },
          "@media (max-width: 1024px)": {
            gridColumn: "span 2",
          },
          "@media (max-width: 640px)": {
            gridColumn: "span 1",
          },
        },
        ".bento-span-full": {
          gridColumn: "1 / -1",
        },

        // Row spans
        ".bento-row-2": {
          gridRow: "span 2",
        },
        ".bento-row-3": {
          gridRow: "span 3",
        },
      });
    },

    // -------------------------------------------------------------------------
    // Glassmorphism Plugin (Dark Variant Focus)
    // -------------------------------------------------------------------------
    function ({ addUtilities }: PluginAPI) {
      addUtilities({
        // Glass effects - Dark variant primary
        ".glass": {
          background: "rgba(26, 25, 24, 0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        },
        ".glass-dark": {
          background: "rgba(10, 10, 8, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        },
        ".glass-darker": {
          background: "rgba(0, 0, 0, 0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        },
        ".glass-subtle": {
          background: "rgba(26, 25, 24, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        },
        ".glass-strong": {
          background: "rgba(10, 10, 8, 0.95)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
        },
        ".glass-light": {
          background: "rgba(254, 254, 252, 0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        },
        ".glass-warm": {
          background: "rgba(38, 38, 38, 0.8)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        },
        ".glass-frost": {
          background: "rgba(26, 25, 24, 0.7)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
        },

        // Glass borders
        ".glass-border": {
          border: "1px solid rgba(254, 254, 252, 0.1)",
        },
        ".glass-border-light": {
          border: "1px solid rgba(254, 254, 252, 0.15)",
        },
        ".glass-border-strong": {
          border: "1px solid rgba(254, 254, 252, 0.2)",
        },
      });
    },

    // -------------------------------------------------------------------------
    // Animation Utilities Plugin
    // -------------------------------------------------------------------------
    function ({ addUtilities }: PluginAPI) {
      // Stagger delay utilities
      const staggerDelays: Record<string, { animationDelay: string; opacity: string }> = {};
      for (let i = 1; i <= 12; i++) {
        staggerDelays[`.stagger-${i}`] = {
          animationDelay: `${i * 0.05}s`,
          opacity: "0",
        };
      }

      // Extended stagger for larger grids
      for (let i = 1; i <= 6; i++) {
        staggerDelays[`.stagger-slow-${i}`] = {
          animationDelay: `${i * 0.1}s`,
          opacity: "0",
        };
        staggerDelays[`.stagger-fast-${i}`] = {
          animationDelay: `${i * 0.025}s`,
          opacity: "0",
        };
      }

      addUtilities({
        ...staggerDelays,

        // Animation fill modes
        ".animate-fill-forwards": {
          animationFillMode: "forwards",
        },
        ".animate-fill-backwards": {
          animationFillMode: "backwards",
        },
        ".animate-fill-both": {
          animationFillMode: "both",
        },

        // Animation play states
        ".animate-paused": {
          animationPlayState: "paused",
        },
        ".animate-running": {
          animationPlayState: "running",
        },

        // Reduced motion safe animations
        ".motion-safe": {
          "@media (prefers-reduced-motion: no-preference)": {
            animationDuration: "var(--animation-duration, 0.3s)",
          },
          "@media (prefers-reduced-motion: reduce)": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },

        // Will change hints
        ".will-animate": {
          willChange: "transform, opacity",
        },
        ".will-scroll": {
          willChange: "scroll-position",
        },
        ".will-transform": {
          willChange: "transform",
        },
      });
    },

    // -------------------------------------------------------------------------
    // Typography Utilities Plugin
    // -------------------------------------------------------------------------
    function ({ addUtilities }: PluginAPI) {
      addUtilities({
        // Text gradient utilities - Monochromatic
        ".text-gradient": {
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },
        ".text-gradient-white": {
          backgroundImage: "linear-gradient(135deg, #fefefc 0%, #a8a29e 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },
        ".text-gradient-dark": {
          backgroundImage: "linear-gradient(135deg, #78716c 0%, #292524 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },
        ".text-gradient-warm": {
          backgroundImage: "linear-gradient(135deg, #d4c4b0 0%, #9a8268 100%)",
          backgroundClip: "text",
          WebkitBackgroundClip: "text",
          color: "transparent",
        },

        // Text glow - WHITE only
        ".text-glow": {
          textShadow: "0 0 20px rgba(254, 254, 252, 0.3)",
        },
        ".text-glow-sm": {
          textShadow: "0 0 10px rgba(254, 254, 252, 0.25)",
        },
        ".text-glow-lg": {
          textShadow: "0 0 30px rgba(254, 254, 252, 0.4), 0 0 60px rgba(254, 254, 252, 0.2)",
        },
        ".text-glow-intense": {
          textShadow: "0 0 20px rgba(254, 254, 252, 0.5), 0 0 40px rgba(254, 254, 252, 0.3), 0 0 80px rgba(254, 254, 252, 0.15)",
        },

        // Touch target utilities (WCAG compliance)
        ".touch-target": {
          minHeight: "44px",
          minWidth: "44px",
        },
        ".touch-target-lg": {
          minHeight: "48px",
          minWidth: "48px",
        },

        // Performance utilities
        ".gpu-accelerate": {
          transform: "translateZ(0)",
          backfaceVisibility: "hidden",
        },
        ".content-auto": {
          contentVisibility: "auto",
          containIntrinsicSize: "0 500px",
        },
        ".lazy-render": {
          contain: "layout style paint",
        },

        // Safe area utilities (iOS notch)
        ".safe-top": {
          paddingTop: "env(safe-area-inset-top)",
        },
        ".safe-bottom": {
          paddingBottom: "env(safe-area-inset-bottom)",
        },
        ".safe-left": {
          paddingLeft: "env(safe-area-inset-left)",
        },
        ".safe-right": {
          paddingRight: "env(safe-area-inset-right)",
        },
        ".safe-all": {
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        },

        // Organic shadow utilities
        ".shadow-organic": {
          boxShadow: "0 4px 20px -2px rgba(0, 0, 0, 0.15), 0 2px 8px -2px rgba(0, 0, 0, 0.1)",
        },
        ".shadow-organic-lg": {
          boxShadow: "0 8px 40px -4px rgba(0, 0, 0, 0.2), 0 4px 16px -4px rgba(0, 0, 0, 0.1)",
        },

        // Scrollbar styling - Dark theme
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "&::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "rgba(254, 254, 252, 0.2)",
            borderRadius: "9999px",
          },
        },

        // Focus visible ring - WHITE
        ".focus-ring": {
          outline: "none",
          "&:focus-visible": {
            boxShadow: "0 0 0 2px var(--background), 0 0 0 4px #fefefc",
          },
        },

        // Smooth scroll
        ".scroll-smooth": {
          scrollBehavior: "smooth",
        },

        // Selection styling - Monochrome
        ".selection-white": {
          "&::selection": {
            backgroundColor: "rgba(254, 254, 252, 0.2)",
          },
        },
        ".selection-dark": {
          "&::selection": {
            backgroundColor: "rgba(10, 10, 8, 0.3)",
            color: "#fefefc",
          },
        },
      });
    },
  ],
};

export default config;
