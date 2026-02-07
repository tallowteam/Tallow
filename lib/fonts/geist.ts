/**
 * Font Configuration — Tallow 3.0
 * Inter: primary UI font
 * Playfair Display: editorial display headings (weight 300)
 * JetBrains Mono: code blocks
 */

import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';

/**
 * Inter - Primary UI Font
 * Modern, clean sans-serif optimized for UI and readability
 */
export const geistSans = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-geist-sans',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
});

/**
 * JetBrains Mono - Code and Technical Content
 * Monospaced font optimized for code display
 */
export const geistMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-geist-mono',
  preload: true,
  fallback: ['Fira Code', 'SF Mono', 'monospace'],
});

/**
 * Playfair Display - Editorial Display Headings
 * Serif for large display text (weight 400)
 */
export const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-playfair',
  preload: true,
  fallback: ['Georgia', 'Times New Roman', 'serif'],
});

/**
 * Inter - exported separately for compatibility
 */
export const inter = geistSans;

/**
 * Font class names for use in className attributes
 */
export const fontClassNames = [
  geistSans.variable,
  geistMono.variable,
  playfairDisplay.variable,
].join(' ');
