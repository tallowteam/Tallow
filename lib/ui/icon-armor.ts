export const ICON_SIZES = Object.freeze({
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
});

export const ICON_STROKES = Object.freeze({
  regular: 1.5,
  bold: 2,
});

export const SECURITY_ICON_COLORS = Object.freeze({
  safe: 'var(--success)',
  warning: 'var(--warning)',
  danger: 'var(--destructive)',
});

export type AllowedIconSize = (typeof ICON_SIZES)[keyof typeof ICON_SIZES];

export function isAllowedIconSize(value: number): value is AllowedIconSize {
  return Object.values(ICON_SIZES).includes(value as AllowedIconSize);
}
