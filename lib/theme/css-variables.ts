/**
 * CSS Variable Utilities
 * Set and get CSS variables programmatically with type safety
 */

import type { Theme } from './themes';

/**
 * Flatten nested object to dot notation
 */
function flattenObject(
  obj: Record<string, any>,
  prefix = ''
): Record<string, string> {
  return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
    const value = obj[key];
    const newKey = prefix ? `${prefix}-${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(acc, flattenObject(value, newKey));
    } else {
      acc[newKey] = value;
    }

    return acc;
  }, {});
}

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Set CSS variable on element
 */
export function setCssVariable(
  name: string,
  value: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.setProperty(`--${name}`, value);
}

/**
 * Get CSS variable value
 */
export function getCssVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  return getComputedStyle(element).getPropertyValue(`--${name}`).trim();
}

/**
 * Remove CSS variable
 */
export function removeCssVariable(
  name: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.removeProperty(`--${name}`);
}

/**
 * Set multiple CSS variables at once
 */
export function setCssVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  Object.entries(variables).forEach(([name, value]) => {
    setCssVariable(name, value, element);
  });
}

/**
 * Apply theme to CSS variables
 */
export function applyTheme(
  theme: Theme,
  element: HTMLElement = document.documentElement
): void {
  const flattened = flattenObject(theme as any);
  const variables: Record<string, string> = {};

  Object.entries(flattened).forEach(([key, value]) => {
    const cssVarName = `color-${toKebabCase(key)}`;
    variables[cssVarName] = value;
  });

  setCssVariables(variables, element);
}

/**
 * Get all theme CSS variables
 */
export function getThemeVariables(
  element: HTMLElement = document.documentElement
): Record<string, string> {
  const computedStyle = getComputedStyle(element);
  const variables: Record<string, string> = {};

  for (let i = 0; i < computedStyle.length; i++) {
    const prop = computedStyle[i];
    if (prop.startsWith('--color-')) {
      variables[prop.substring(2)] = computedStyle.getPropertyValue(prop).trim();
    }
  }

  return variables;
}

/**
 * Reset all theme variables to default
 */
export function resetThemeVariables(
  element: HTMLElement = document.documentElement
): void {
  const variables = getThemeVariables(element);
  Object.keys(variables).forEach((name) => {
    removeCssVariable(name, element);
  });
}

/**
 * Create CSS variable reference
 */
export function cssVar(name: string): string {
  return `var(--${name})`;
}

/**
 * Create CSS variable reference with fallback
 */
export function cssVarWithFallback(name: string, fallback: string): string {
  return `var(--${name}, ${fallback})`;
}

/**
 * Check if CSS variable is set
 */
export function hasCssVariable(
  name: string,
  element: HTMLElement = document.documentElement
): boolean {
  const value = getCssVariable(name, element);
  return value !== '';
}

/**
 * Batch update CSS variables with transition
 */
export function updateThemeVariablesWithTransition(
  variables: Record<string, string>,
  duration: number = 200,
  element: HTMLElement = document.documentElement
): Promise<void> {
  return new Promise((resolve) => {
    const originalTransition = element.style.transition;
    element.style.transition = `all ${duration}ms ease-in-out`;

    setCssVariables(variables, element);

    setTimeout(() => {
      element.style.transition = originalTransition;
      resolve();
    }, duration);
  });
}
