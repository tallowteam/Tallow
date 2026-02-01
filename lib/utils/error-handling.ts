/**
 * Error Handling Utilities
 *
 * Provides type-safe error handling utilities for creating and managing
 * application errors with discriminated unions.
 *
 * @module utils/error-handling
 */

import type {
  AppError,
  NetworkError,
  CryptoError,
  ValidationError,
  TransferError,
  StorageError,
  NetworkTransport,
  Result,
} from '../types/shared';
import { secureLog } from '../utils/secure-logger';

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Create a network error
 *
 * @param code - Error code
 * @param message - Error message
 * @param options - Additional error options
 * @returns Network error object
 *
 * @example
 * ```typescript
 * const error = createNetworkError('CONNECTION_FAILED', 'Failed to connect to peer', {
 *   transport: 'webrtc-direct',
 *   retryCount: 3
 * });
 * ```
 */
export function createNetworkError(
  code: NetworkError['code'],
  message: string,
  options?: {
    transport?: NetworkTransport;
    retryCount?: number;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): NetworkError {
  return {
    type: 'network',
    code,
    message,
    timestamp: Date.now(),
    ...(options?.transport && { transport: options.transport }),
    ...(options?.retryCount !== undefined && { retryCount: options.retryCount }),
    ...(options?.details && { details: options.details }),
    ...(options?.recovery && { recovery: options.recovery }),
  };
}

/**
 * Create a crypto error
 *
 * @param code - Error code
 * @param message - Error message
 * @param options - Additional error options
 * @returns Crypto error object
 */
export function createCryptoError(
  code: CryptoError['code'],
  message: string,
  options?: {
    algorithm?: string;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): CryptoError {
  return {
    type: 'crypto',
    code,
    message,
    timestamp: Date.now(),
    ...(options?.algorithm && { algorithm: options.algorithm }),
    ...(options?.details && { details: options.details }),
    ...(options?.recovery && { recovery: options.recovery }),
  };
}

/**
 * Create a validation error
 *
 * @param code - Error code
 * @param message - Error message
 * @param options - Additional error options
 * @returns Validation error object
 */
export function createValidationError(
  code: ValidationError['code'],
  message: string,
  options?: {
    field?: string;
    value?: unknown;
    expected?: unknown;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): ValidationError {
  return {
    type: 'validation',
    code,
    message,
    timestamp: Date.now(),
    ...(options?.field && { field: options.field }),
    ...(options?.value !== undefined && { value: options.value }),
    ...(options?.expected !== undefined && { expected: options.expected }),
    ...(options?.details && { details: options.details }),
    ...(options?.recovery && { recovery: options.recovery }),
  };
}

/**
 * Create a transfer error
 *
 * @param code - Error code
 * @param message - Error message
 * @param options - Additional error options
 * @returns Transfer error object
 */
export function createTransferError(
  code: TransferError['code'],
  message: string,
  options?: {
    transferId?: string;
    progress?: number;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): TransferError {
  return {
    type: 'transfer',
    code,
    message,
    timestamp: Date.now(),
    ...(options?.transferId && { transferId: options.transferId }),
    ...(options?.progress !== undefined && { progress: options.progress }),
    ...(options?.details && { details: options.details }),
    ...(options?.recovery && { recovery: options.recovery }),
  };
}

/**
 * Create a storage error
 *
 * @param code - Error code
 * @param message - Error message
 * @param options - Additional error options
 * @returns Storage error object
 */
export function createStorageError(
  code: StorageError['code'],
  message: string,
  options?: {
    key?: string;
    details?: Record<string, unknown>;
    recovery?: string;
  }
): StorageError {
  return {
    type: 'storage',
    code,
    message,
    timestamp: Date.now(),
    ...(options?.key && { key: options.key }),
    ...(options?.details && { details: options.details }),
    ...(options?.recovery && { recovery: options.recovery }),
  };
}

// ============================================================================
// Error Conversion Functions
// ============================================================================

/**
 * Convert a standard Error to AppError
 *
 * @param error - Standard Error object
 * @param context - Error context for better categorization
 * @returns Appropriate AppError type
 */
export function toAppError(
  error: Error | AppError | unknown,
  context?: {
    operation?: string;
    component?: string;
  }
): AppError {
  // Already an AppError
  if (isAppError(error)) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    // Try to categorize based on error message
    const message = error.message.toLowerCase();

    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('disconnect')
    ) {
      return createNetworkError('CONNECTION_FAILED', error.message, context ? {
        details: context,
      } : undefined);
    }

    if (
      message.includes('encrypt') ||
      message.includes('decrypt') ||
      message.includes('key') ||
      message.includes('crypto')
    ) {
      return createCryptoError('ENCRYPTION_FAILED', error.message, context ? {
        details: context,
      } : undefined);
    }

    if (
      message.includes('invalid') ||
      message.includes('validation') ||
      message.includes('required')
    ) {
      return createValidationError('INVALID_INPUT', error.message, context ? {
        details: context,
      } : undefined);
    }

    if (message.includes('transfer') || message.includes('send') || message.includes('receive')) {
      return createTransferError('TRANSFER_FAILED', error.message, context ? {
        details: context,
      } : undefined);
    }

    if (
      message.includes('storage') ||
      message.includes('quota') ||
      message.includes('not found')
    ) {
      return createStorageError('READ_FAILED', error.message, context ? {
        details: context,
      } : undefined);
    }

    // Default to transfer error
    return createTransferError('TRANSFER_FAILED', error.message, context ? {
      details: context,
    } : undefined);
  }

  // Unknown error type
  return createTransferError('TRANSFER_FAILED', 'An unknown error occurred', {
    details: {
      ...context,
      originalError: String(error),
    },
  });
}

/**
 * Type guard to check if value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'code' in value &&
    'message' in value &&
    'timestamp' in value
  );
}

// ============================================================================
// Result Helpers
// ============================================================================

/**
 * Create a success result
 *
 * @param data - Success data
 * @returns Success result
 */
export function success<T>(data: T): Result<T, AppError> {
  return { success: true, data };
}

/**
 * Create a failure result
 *
 * @param error - Error object
 * @returns Failure result
 */
export function failure<T, E extends AppError = AppError>(error: E): Result<T, E> {
  return { success: false, error };
}

/**
 * Wrap a function to return a Result type
 *
 * @param fn - Function to wrap
 * @returns Wrapped function that returns Result
 *
 * @example
 * ```typescript
 * const safeParseJSON = wrapResult((str: string) => JSON.parse(str));
 * const result = safeParseJSON('{"key": "value"}');
 * if (result.success) {
 *   secureLog.log(result.data);
 * } else {
 *   secureLog.error(result.error);
 * }
 * ```
 */
export function wrapResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => TReturn
): (...args: TArgs) => Result<TReturn, AppError> {
  return (...args: TArgs): Result<TReturn, AppError> => {
    try {
      const data = fn(...args);
      return success(data);
    } catch (error) {
      return failure(toAppError(error));
    }
  };
}

/**
 * Wrap an async function to return a Result type
 *
 * @param fn - Async function to wrap
 * @returns Wrapped async function that returns Result
 */
export function wrapAsyncResult<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>
): (...args: TArgs) => Promise<Result<TReturn, AppError>> {
  return async (...args: TArgs): Promise<Result<TReturn, AppError>> => {
    try {
      const data = await fn(...args);
      return success(data);
    } catch (error) {
      return failure(toAppError(error));
    }
  };
}

// ============================================================================
// Error Message Formatting
// ============================================================================

/**
 * Format an AppError into a user-friendly message
 *
 * @param error - Application error
 * @returns Formatted error message
 */
export function formatErrorMessage(error: AppError): string {
  let message = error.message;

  // Add recovery suggestion if available
  if (error.recovery) {
    message += `\n\nSuggestion: ${error.recovery}`;
  }

  return message;
}

/**
 * Get a short error description for UI display
 *
 * @param error - Application error
 * @returns Short error description
 */
export function getErrorDescription(error: AppError): string {
  switch (error.type) {
    case 'network':
      return 'Network connection issue';
    case 'crypto':
      return 'Encryption/decryption failed';
    case 'validation':
      return 'Invalid input';
    case 'transfer':
      return 'Transfer failed';
    case 'storage':
      return 'Storage operation failed';
    default:
      return 'An error occurred';
  }
}

/**
 * Get recovery suggestions for common errors
 *
 * @param error - Application error
 * @returns Recovery suggestion
 */
export function getRecoverySuggestion(error: AppError): string | null {
  if (error.recovery) {
    return error.recovery;
  }

  // Provide default suggestions based on error type
  switch (error.type) {
    case 'network':
      if (error.code === 'CONNECTION_FAILED') {
        return 'Check your internet connection and try again';
      }
      if (error.code === 'TIMEOUT') {
        return 'The connection timed out. Please try again';
      }
      if (error.code === 'PEER_DISCONNECTED') {
        return 'The peer disconnected. Please reconnect and try again';
      }
      return 'Check your network connection';

    case 'crypto':
      if (error.code === 'KEY_GENERATION_FAILED') {
        return 'Refresh the page and try again';
      }
      if (error.code === 'DECRYPTION_FAILED') {
        return 'Verify the decryption key is correct';
      }
      return 'Please try again or contact support';

    case 'validation':
      if (error.code === 'FILE_TOO_LARGE') {
        return 'Choose a smaller file (max 4GB)';
      }
      if (error.code === 'EMPTY_FILE') {
        return 'The file appears to be empty';
      }
      return 'Please check your input and try again';

    case 'transfer':
      if (error.code === 'TRANSFER_CANCELLED') {
        return 'You can restart the transfer if needed';
      }
      if (error.code === 'INTEGRITY_CHECK_FAILED') {
        return 'Transfer again to ensure file integrity';
      }
      return 'Please try the transfer again';

    case 'storage':
      if (error.code === 'QUOTA_EXCEEDED') {
        return 'Clear some storage space and try again';
      }
      return 'Check your storage permissions';

    default:
      return null;
  }
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log an error with appropriate severity
 *
 * @param error - Application error
 * @param context - Additional context
 */
export function logError(
  error: AppError,
  context?: {
    component?: string;
    operation?: string;
    userId?: string;
  }
): void {
  const logData = {
    type: error.type,
    code: error.code,
    message: error.message,
    timestamp: new Date(error.timestamp).toISOString(),
    ...error.details,
    ...context,
  };

  // In production, send to error tracking service (e.g., Sentry)
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to error tracking service
    secureLog.error('[AppError]', logData);
  } else {
    // In development, log to console with color coding
    const color = getErrorColor(error.type);
    secureLog.error(
      `%c[${error.type.toUpperCase()}] ${error.code}`,
      `color: ${color}; font-weight: bold`,
      error.message,
      logData
    );
  }
}

/**
 * Get console color for error type
 */
function getErrorColor(type: AppError['type']): string {
  switch (type) {
    case 'network':
      return '#f59e0b'; // amber
    case 'crypto':
      return '#ef4444'; // red
    case 'validation':
      return '#3b82f6'; // blue
    case 'transfer':
      return '#8b5cf6'; // purple
    case 'storage':
      return '#10b981'; // green
    default:
      return '#6b7280'; // gray
  }
}
