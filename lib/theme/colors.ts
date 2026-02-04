/**
 * Color Utilities
 * HSL manipulation, contrast checking, color mixing, and alpha channel support
 */

/**
 * HSL color representation
 */
export interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * RGB color representation
 */
export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parse hex color to RGB
 */
export function hexToRgb(hex: string): RGB | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Convert RGB to hex
 */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

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

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to RGB
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Parse hex color to HSL
 */
export function hexToHsl(hex: string): HSL | null {
  const rgb = hexToRgb(hex);
  return rgb ? rgbToHsl(rgb) : null;
}

/**
 * Convert HSL to hex
 */
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/**
 * Lighten a color by a percentage
 */
export function lighten(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.l = Math.min(100, hsl.l + amount);
  return hslToHex(hsl);
}

/**
 * Darken a color by a percentage
 */
export function darken(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.l = Math.max(0, hsl.l - amount);
  return hslToHex(hsl);
}

/**
 * Adjust saturation of a color
 */
export function saturate(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.s = Math.min(100, Math.max(0, hsl.s + amount));
  return hslToHex(hsl);
}

/**
 * Adjust hue of a color
 */
export function adjustHue(hex: string, amount: number): string {
  const hsl = hexToHsl(hex);
  if (!hsl) return hex;

  hsl.h = (hsl.h + amount) % 360;
  if (hsl.h < 0) hsl.h += 360;
  return hslToHex(hsl);
}

/**
 * Calculate relative luminance for contrast calculation
 */
function getLuminance(rgb: RGB): number {
  const val = [rgb.r, rgb.g, rgb.b].map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * val[0] + 0.7152 * val[1] + 0.0722 * val[2];
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG contrast requirements
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  large: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return large ? ratio >= 4.5 : ratio >= 7;
  }

  return large ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Mix two colors together
 */
export function mix(color1: string, color2: string, weight: number = 0.5): string {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return color1;

  const w = weight * 2 - 1;
  const w1 = (w + 1) / 2;
  const w2 = 1 - w1;

  return rgbToHex({
    r: Math.round(rgb1.r * w1 + rgb2.r * w2),
    g: Math.round(rgb1.g * w1 + rgb2.g * w2),
    b: Math.round(rgb1.b * w1 + rgb2.b * w2),
  });
}

/**
 * Add alpha channel to hex color
 */
export function addAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const a = Math.min(1, Math.max(0, alpha));
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${a})`;
}

/**
 * Get complementary color
 */
export function getComplementary(hex: string): string {
  return adjustHue(hex, 180);
}

/**
 * Get triadic colors
 */
export function getTriadic(hex: string): [string, string] {
  return [adjustHue(hex, 120), adjustHue(hex, 240)];
}

/**
 * Get analogous colors
 */
export function getAnalogous(hex: string): [string, string] {
  return [adjustHue(hex, 30), adjustHue(hex, -30)];
}

/**
 * Check if color is light or dark
 */
export function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;

  const luminance = getLuminance(rgb);
  return luminance > 0.5;
}

/**
 * Get readable text color for background
 */
export function getReadableTextColor(background: string): string {
  return isLight(background) ? '#000000' : '#ffffff';
}
