import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Fluid container - adjusts to browser width, not fixed device breakpoints
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
    },
    // Custom breakpoints for all device sizes
    screens: {
      'xs': '375px',      // Small phones (iPhone SE, etc.)
      'sm': '640px',      // Large phones / Small tablets
      'md': '768px',      // Tablets portrait
      'lg': '1024px',     // Tablets landscape / Small laptops
      'xl': '1280px',     // Laptops / Desktop
      '2xl': '1440px',    // Large desktop
      '3xl': '1920px',    // Full HD monitors
      '4xl': '2560px',    // QHD / 2K monitors
      '5xl': '3440px',    // Ultrawide / 4K
      '6xl': '3840px',    // 4K TV
      '8k': '7680px',     // 8K displays
      // Special breakpoints
      'touch': { 'raw': '(pointer: coarse)' },
      'stylus': { 'raw': '(pointer: fine) and (hover: none)' },
      'mouse': { 'raw': '(pointer: fine) and (hover: hover)' },
      'portrait': { 'raw': '(orientation: portrait)' },
      'landscape': { 'raw': '(orientation: landscape)' },
      'retina': { 'raw': '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)' },
      'reduced-motion': { 'raw': '(prefers-reduced-motion: reduce)' },
      'print': { 'raw': 'print' },
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui"],
        mono: ["var(--font-geist-mono)", "ui-monospace"],
        serif: ["var(--font-cormorant)", "ui-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      // Spacing scale following 8pt grid
      spacing: {
        '4.5': '1.125rem',  // 18px
        '13': '3.25rem',    // 52px
        '15': '3.75rem',    // 60px
        '18': '4.5rem',     // 72px
        '22': '5.5rem',     // 88px
        '26': '6.5rem',     // 104px
        '30': '7.5rem',     // 120px
        '34': '8.5rem',     // 136px
        '38': '9.5rem',     // 152px
        '42': '10.5rem',    // 168px
        '50': '12.5rem',    // 200px
        '58': '14.5rem',    // 232px
        '66': '16.5rem',    // 264px
        '74': '18.5rem',    // 296px
        '82': '20.5rem',    // 328px
        '90': '22.5rem',    // 360px
        '100': '25rem',     // 400px
        '120': '30rem',     // 480px
        '140': '35rem',     // 560px
        '160': '40rem',     // 640px
      },
      // Animation durations
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
        '1200': '1200ms',
        '1500': '1500ms',
        '2000': '2000ms',
      },
      // Animation timing functions
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      // Z-index scale
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'nav': '50',
        'modal': '100',
        'toast': '200',
        'tooltip': '150',
      },
      // Max width utilities
      maxWidth: {
        '8xl': '88rem',    // 1408px
        '9xl': '96rem',    // 1536px
        '10xl': '104rem',  // 1664px
        'prose-sm': '55ch',
        'prose': '65ch',
        'prose-lg': '75ch',
      },
      // Typography line heights
      lineHeight: {
        'tighter': '1.1',
        'snug': '1.375',
      },
      // Letter spacing
      letterSpacing: {
        'super-wide': '0.2em',
        'ultra-wide': '0.25em',
      },
      // Box shadows for depth
      boxShadow: {
        'soft-sm': '0 2px 8px -2px rgba(0, 0, 0, 0.05)',
        'soft': '0 4px 16px -4px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 32px -8px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 16px 48px -12px rgba(0, 0, 0, 0.12)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'glow-sm': '0 0 12px -2px',
        'glow': '0 0 24px -4px',
        'glow-lg': '0 0 40px -8px',
      },
      // Aspect ratios
      aspectRatio: {
        'ultrawide': '21/9',
        'cinema': '2.35/1',
        'golden': '1.618/1',
      },
    },
  },
  plugins: [],
};

export default config;
