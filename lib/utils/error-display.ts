/**
 * Error Display Utilities
 *
 * Helper functions for displaying AppError objects in React components
 * and other UI contexts.
 *
 * @module utils/error-display
 */

import type { AppError } from '../types/shared';
import { formatErrorMessage, getErrorDescription, getRecoverySuggestion } from './error-handling';

/**
 * Get a displayable error message from various error types
 *
 * @param error - Error object, string, or null
 * @returns Human-readable error message
 *
 * @example
 * ```tsx
 * <div className="error">{getErrorMessage(error)}</div>
 * ```
 */
export function getErrorMessage(error: AppError | string | null | undefined): string {
  if (!error) {return '';}
  if (typeof error === 'string') {return error;}
  return formatErrorMessage(error);
}

/**
 * Get a short error title for display
 *
 * @param error - Error object or string
 * @returns Short error title
 *
 * @example
 * ```tsx
 * <h3>{getErrorTitle(error)}</h3>
 * <p>{getErrorMessage(error)}</p>
 * ```
 */
export function getErrorTitle(error: AppError | string | null | undefined): string {
  if (!error) {return '';}
  if (typeof error === 'string') {return 'Error';}
  return getErrorDescription(error);
}

/**
 * Get error recovery suggestion if available
 *
 * @param error - Error object
 * @returns Recovery suggestion or null
 */
export function getErrorRecovery(error: AppError | string | null | undefined): string | null {
  if (!error) {return null;}
  if (typeof error === 'string') {return null;}
  return getRecoverySuggestion(error);
}

/**
 * Check if error has recovery suggestion
 *
 * @param error - Error object
 * @returns True if recovery suggestion exists
 */
export function hasRecoverySuggestion(error: AppError | string | null | undefined): boolean {
  return getErrorRecovery(error) !== null;
}

/**
 * Format error for toast notification
 *
 * @param error - Error object
 * @returns Object with title and description for toast
 *
 * @example
 * ```tsx
 * import { toast } from 'sonner';
 * const { title, description } = formatErrorForToast(error);
 * toast.error(title, { description });
 * ```
 */
export function formatErrorForToast(error: AppError | string | null | undefined): {
  title: string;
  description: string | null;
} {
  if (!error) {
    return {
      title: 'An error occurred',
      description: null,
    };
  }

  if (typeof error === 'string') {
    return {
      title: 'Error',
      description: error,
    };
  }

  return {
    title: getErrorDescription(error),
    description: getRecoverySuggestion(error),
  };
}

/**
 * Get error severity level for styling
 *
 * @param error - Error object
 * @returns Severity level
 */
export function getErrorSeverity(
  error: AppError | string | null | undefined
): 'error' | 'warning' | 'info' {
  if (!error) {return 'info';}
  if (typeof error === 'string') {return 'error';}

  // Network errors are often temporary
  if (error.type === 'network') {
    if (error.code === 'TIMEOUT' || error.code === 'PEER_DISCONNECTED') {
      return 'warning';
    }
  }

  // Validation errors are user-fixable
  if (error.type === 'validation') {
    return 'warning';
  }

  // Crypto and storage errors are critical
  if (error.type === 'crypto' || error.type === 'storage') {
    return 'error';
  }

  return 'error';
}

/**
 * Get icon name for error type
 *
 * @param error - Error object
 * @returns Icon name (for lucide-react or similar)
 */
export function getErrorIcon(error: AppError | string | null | undefined): string {
  if (!error) {return 'info';}
  if (typeof error === 'string') {return 'alert-circle';}

  switch (error.type) {
    case 'network':
      return 'wifi-off';
    case 'crypto':
      return 'shield-x';
    case 'validation':
      return 'alert-triangle';
    case 'transfer':
      return 'x-circle';
    case 'storage':
      return 'hard-drive-x';
    default:
      return 'alert-circle';
  }
}

/**
 * Format error for logging
 *
 * @param error - Error object
 * @param context - Additional context
 * @returns Formatted log object
 */
export function formatErrorForLogging(
  error: AppError | Error | string | null | undefined,
  context?: Record<string, unknown>
): Record<string, unknown> {
  if (!error) {
    return {
      message: 'Unknown error',
      context,
    };
  }

  if (typeof error === 'string') {
    return {
      message: error,
      context,
    };
  }

  if (error instanceof Error && !('type' in error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
    };
  }

  // AppError
  const appError = error as AppError;
  return {
    type: appError.type,
    code: appError.code,
    message: appError.message,
    timestamp: appError.timestamp,
    details: appError.details,
    recovery: appError.recovery,
    context,
  };
}
