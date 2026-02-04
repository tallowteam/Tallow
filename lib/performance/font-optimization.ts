/**
 * Font Optimization Utilities
 *
 * Provides utilities for optimizing font loading to prevent
 * layout shifts (CLS) and improve FCP/LCP.
 *
 * @module lib/performance/font-optimization
 */

// ============================================================================
// TYPES
// ============================================================================

export interface FontConfig {
  /** Font family name */
  family: string;
  /** Font source URL */
  src: string;
  /** Font weight */
  weight?: number | string;
  /** Font style */
  style?: 'normal' | 'italic' | 'oblique';
  /** Font display strategy */
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  /** Unicode range */
  unicodeRange?: string;
  /** Preload this font */
  preload?: boolean;
  /** Font format */
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype';
}

export interface FontSubsetConfig {
  /** Characters to include */
  characters?: string;
  /** Use Latin subset */
  latin?: boolean;
  /** Use Latin Extended subset */
  latinExtended?: boolean;
}

export interface FontLoadingState {
  /** Font is loading */
  loading: boolean;
  /** Font loaded successfully */
  loaded: boolean;
  /** Font failed to load */
  failed: boolean;
  /** Error message if failed */
  error?: string;
}

// ============================================================================
// FONT PRELOADING
// ============================================================================

/**
 * Preload a font file
 *
 * @example
 * preloadFont('/fonts/inter-var.woff2', 'woff2');
 */
export function preloadFont(
  src: string,
  format: 'woff2' | 'woff' = 'woff2',
  crossOrigin = true
): void {
  if (typeof document === 'undefined') return;

  // Check if already preloaded
  const existing = document.querySelector(`link[href="${src}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'font';
  link.type = `font/${format}`;
  link.href = src;
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Preload multiple fonts
 *
 * @example
 * preloadFonts([
 *   { src: '/fonts/inter-var.woff2', format: 'woff2' },
 *   { src: '/fonts/playfair.woff2', format: 'woff2' },
 * ]);
 */
export function preloadFonts(
  fonts: Array<{ src: string; format?: 'woff2' | 'woff' }>
): void {
  fonts.forEach((font) => preloadFont(font.src, font.format));
}

// ============================================================================
// FONT LOADING API
// ============================================================================

/**
 * Load a font using the CSS Font Loading API
 *
 * @example
 * await loadFont({
 *   family: 'Inter',
 *   src: '/fonts/inter-var.woff2',
 *   weight: '100 900',
 *   display: 'swap',
 * });
 */
export async function loadFont(config: FontConfig): Promise<FontFace> {
  if (typeof FontFace === 'undefined') {
    throw new Error('Font Loading API not supported');
  }

  const descriptors: FontFaceDescriptors = {
    style: config.style || 'normal',
    weight: String(config.weight || 'normal'),
    display: config.display || 'swap',
  };

  if (config.unicodeRange) {
    descriptors.unicodeRange = config.unicodeRange;
  }

  const fontFace = new FontFace(config.family, `url(${config.src})`, descriptors);

  // Load the font
  await fontFace.load();

  // Add to document fonts
  (document.fonts as FontFaceSet & { add(font: FontFace): void }).add(fontFace);

  return fontFace;
}

/**
 * Load multiple fonts in parallel
 *
 * @example
 * await loadFonts([
 *   { family: 'Inter', src: '/fonts/inter-var.woff2' },
 *   { family: 'Playfair Display', src: '/fonts/playfair.woff2' },
 * ]);
 */
export async function loadFonts(
  configs: FontConfig[]
): Promise<FontFace[]> {
  return Promise.all(configs.map((config) => loadFont(config)));
}

/**
 * Check if a font is loaded
 *
 * @example
 * const isLoaded = isFontLoaded('Inter', '400');
 */
export function isFontLoaded(family: string, weight = 'normal'): boolean {
  if (typeof document === 'undefined') return false;
  return document.fonts.check(`${weight} 16px "${family}"`);
}

/**
 * Wait for a font to be loaded
 *
 * @example
 * await waitForFont('Inter');
 */
export async function waitForFont(
  family: string,
  weight = 'normal',
  timeout = 3000
): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  // Already loaded
  if (isFontLoaded(family, weight)) return true;

  // Wait for fonts ready
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), timeout);

    document.fonts.ready.then(() => {
      clearTimeout(timer);
      resolve(isFontLoaded(family, weight));
    });
  });
}

/**
 * Wait for all fonts to be loaded
 *
 * @example
 * await waitForFontsReady();
 * document.body.classList.add('fonts-loaded');
 */
export async function waitForFontsReady(): Promise<FontFaceSet> {
  if (typeof document === 'undefined') {
    return Promise.resolve(new Set() as unknown as FontFaceSet);
  }
  return document.fonts.ready;
}

// ============================================================================
// FONT DISPLAY STRATEGIES
// ============================================================================

/**
 * Apply FOUT (Flash of Unstyled Text) mitigation
 * Shows fallback font immediately, swaps when loaded
 *
 * @example
 * applyFOUTStrategy('Inter', 'system-ui');
 */
export function applyFOUTStrategy(
  fontFamily: string,
  fallbackFamily: string
): () => void {
  if (typeof document === 'undefined') return () => {};

  // Add class to body for CSS targeting
  document.body.classList.add('fonts-loading');
  document.body.style.fontFamily = fallbackFamily;

  // Wait for font and swap
  waitForFont(fontFamily).then((loaded) => {
    if (loaded) {
      document.body.classList.remove('fonts-loading');
      document.body.classList.add('fonts-loaded');
      document.body.style.fontFamily = `"${fontFamily}", ${fallbackFamily}`;
    }
  });

  return () => {
    document.body.classList.remove('fonts-loading', 'fonts-loaded');
  };
}

/**
 * Apply FOIT (Flash of Invisible Text) mitigation
 * Hides text until font loads, with timeout fallback
 *
 * @example
 * applyFOITStrategy('Playfair Display', 3000);
 */
export function applyFOITStrategy(
  fontFamily: string,
  timeout = 3000
): () => void {
  if (typeof document === 'undefined') return () => {};

  // Hide text initially
  const style = document.createElement('style');
  style.textContent = `
    .fonts-loading body {
      visibility: hidden;
    }
    .fonts-loading.fonts-timeout body {
      visibility: visible;
    }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add('fonts-loading');

  // Timeout fallback
  const timer = setTimeout(() => {
    document.documentElement.classList.add('fonts-timeout');
  }, timeout);

  // Wait for font
  waitForFont(fontFamily).then(() => {
    clearTimeout(timer);
    document.documentElement.classList.remove('fonts-loading', 'fonts-timeout');
  });

  return () => {
    clearTimeout(timer);
    document.documentElement.classList.remove('fonts-loading', 'fonts-timeout');
    style.remove();
  };
}

// ============================================================================
// FONT METRICS AND FALLBACKS
// ============================================================================

/**
 * Common fallback font stacks
 */
export const fontStacks = {
  /** System sans-serif */
  system:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  /** System serif */
  serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
  /** System monospace */
  mono: 'ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace',
  /** Inter-like system fonts */
  inter:
    'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

/**
 * Font metric adjustments for reducing CLS
 * These are approximate metrics - measure for your specific fonts
 */
export const fontMetrics: Record<
  string,
  { sizeAdjust?: number; ascentOverride?: number; descentOverride?: number }
> = {
  // Adjust system fonts to match Inter
  'system-to-inter': {
    sizeAdjust: 1.0,
    ascentOverride: 0.9,
    descentOverride: 0.22,
  },
  // Adjust system fonts to match Playfair Display
  'system-to-playfair': {
    sizeAdjust: 1.07,
    ascentOverride: 0.96,
    descentOverride: 0.23,
  },
};

/**
 * Generate @font-face CSS with size adjustments
 *
 * @example
 * const css = generateFontFaceCSS({
 *   family: 'Inter',
 *   src: '/fonts/inter-var.woff2',
 *   display: 'swap',
 * });
 */
export function generateFontFaceCSS(config: FontConfig): string {
  const format = config.format || 'woff2';
  const weight = config.weight || 'normal';
  const style = config.style || 'normal';
  const display = config.display || 'swap';

  let css = `
@font-face {
  font-family: "${config.family}";
  src: url("${config.src}") format("${format}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: ${display};`;

  if (config.unicodeRange) {
    css += `
  unicode-range: ${config.unicodeRange};`;
  }

  css += `
}`;

  return css.trim();
}

/**
 * Generate fallback font-face with metrics override
 *
 * @example
 * const css = generateFallbackFontCSS('Inter Fallback', 'Arial', {
 *   sizeAdjust: 1.07,
 *   ascentOverride: 0.9,
 * });
 */
export function generateFallbackFontCSS(
  family: string,
  source: string,
  metrics: { sizeAdjust?: number; ascentOverride?: number; descentOverride?: number }
): string {
  let css = `
@font-face {
  font-family: "${family}";
  src: local("${source}");`;

  if (metrics.sizeAdjust) {
    css += `
  size-adjust: ${metrics.sizeAdjust * 100}%;`;
  }

  if (metrics.ascentOverride) {
    css += `
  ascent-override: ${metrics.ascentOverride * 100}%;`;
  }

  if (metrics.descentOverride) {
    css += `
  descent-override: ${metrics.descentOverride * 100}%;`;
  }

  css += `
}`;

  return css.trim();
}

// ============================================================================
// UNICODE RANGES
// ============================================================================

/**
 * Common unicode ranges for subsetting
 */
export const unicodeRanges = {
  /** Basic Latin */
  latin: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  /** Latin Extended */
  latinExtended:
    'U+0100-024F, U+0259, U+1E00-1EFF, U+2020, U+20A0-20AB, U+20AD-20CF, U+2113, U+2C60-2C7F, U+A720-A7FF',
  /** Cyrillic */
  cyrillic: 'U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  /** Greek */
  greek: 'U+0370-03FF',
  /** Vietnamese */
  vietnamese:
    'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+1EA0-1EF9, U+20AB',
};

// ============================================================================
// CSS GENERATION
// ============================================================================

/**
 * Generate complete font CSS including fallbacks
 *
 * @example
 * const css = generateCompleteFontCSS([
 *   {
 *     family: 'Inter',
 *     src: '/fonts/inter-var.woff2',
 *     weight: '100 900',
 *   },
 * ]);
 */
export function generateCompleteFontCSS(configs: FontConfig[]): string {
  const fontFaces = configs.map((config) => generateFontFaceCSS(config));
  return fontFaces.join('\n\n');
}

// ============================================================================
// NEXT.JS FONT OPTIMIZATION HELPERS
// ============================================================================

/**
 * Get optimal font loading configuration for Next.js
 */
export function getNextFontConfig(): {
  subsets: string[];
  display: 'swap' | 'optional';
  preload: boolean;
  adjustFontFallback: boolean;
} {
  return {
    subsets: ['latin'],
    display: 'swap',
    preload: true,
    adjustFontFallback: true,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  preloadFont,
  preloadFonts,
  loadFont,
  loadFonts,
  isFontLoaded,
  waitForFont,
  waitForFontsReady,
  applyFOUTStrategy,
  applyFOITStrategy,
  fontStacks,
  fontMetrics,
  generateFontFaceCSS,
  generateFallbackFontCSS,
  unicodeRanges,
  generateCompleteFontCSS,
  getNextFontConfig,
};
