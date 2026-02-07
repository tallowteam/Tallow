/**
 * Utility Functions Index
 * @module utils
 */

export * from './error-handling';
export * from './file-utils';
export * from './uuid';
export * from './clipboard';
export * from './device-detection';
export * from './accessibility';
export * from './focus-management';
export * from './secure-logger';
export * from './performance-metrics';
export * from './barcode-detector-polyfill';
export * from './qr-code-generator';

/**
 * Utility function for conditional class names (similar to clsx/classnames)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
