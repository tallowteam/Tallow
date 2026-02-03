/**
 * Tallow Design System - TypeScript Type Definitions
 *
 * This file contains shared types used across the design system.
 */

/**
 * Size variants used across components
 */
export type Size = 'sm' | 'md' | 'lg';

/**
 * Extended size variants for components that need more granular control
 */
export type ExtendedSize = Size | 'xs' | 'xl';

/**
 * Color variants for status indication
 */
export type StatusVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Button-specific variants
 */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';

/**
 * Card variants
 */
export type CardVariant = 'default' | 'highlighted' | 'interactive';

/**
 * Spinner color variants
 */
export type SpinnerVariant = 'primary' | 'white' | 'neutral';

/**
 * Tooltip positioning
 */
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

/**
 * Modal sizes
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

/**
 * Common component props that can be extended
 */
export interface BaseComponentProps {
  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Data test ID for testing
   */
  'data-testid'?: string;
}

/**
 * Props for components that support loading state
 */
export interface LoadingProps {
  /**
   * Whether the component is in loading state
   */
  loading?: boolean;
}

/**
 * Props for components that can be disabled
 */
export interface DisableableProps {
  /**
   * Whether the component is disabled
   */
  disabled?: boolean;
}

/**
 * Props for components that support full width layout
 */
export interface FullWidthProps {
  /**
   * Whether the component should take full width
   */
  fullWidth?: boolean;
}

/**
 * Design system color palette
 */
export interface ColorPalette {
  neutral: {
    950: string;
    900: string;
    800: string;
    700: string;
    600: string;
    500: string;
    400: string;
    300: string;
    200: string;
    100: string;
  };
  primary: {
    light: string;
    default: string;
    dark: string;
  };
  danger: {
    light: string;
    default: string;
    dark: string;
  };
  success: {
    light: string;
    default: string;
    dark: string;
  };
  warning: {
    light: string;
    default: string;
    dark: string;
  };
}

/**
 * Design system spacing scale
 */
export type Spacing = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 64;

/**
 * Design system border radius scale
 */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

/**
 * Animation duration options
 */
export type AnimationDuration = 'fast' | 'base' | 'slow';

/**
 * Focus visible styles configuration
 */
export interface FocusStyles {
  outline?: boolean;
  ring?: boolean;
  ringColor?: string;
  ringOffset?: number;
}
