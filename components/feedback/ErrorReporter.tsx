/**
 * ErrorReporter Component
 *
 * User-facing error dialog that allows users to report issues with optional descriptions.
 * Integrates with the unified error reporting system.
 *
 * @module components/feedback/ErrorReporter
 */

'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { reportErrorWithDescription } from '@/lib/monitoring/error-reporter';
import type { AppError } from '@/lib/types/shared';
import { isAppError, getErrorDescription, getRecoverySuggestion } from '@/lib/utils/error-handling';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import styles from './ErrorReporter.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorReporterProps {
  /** The error to report */
  error: Error | AppError;
  /** Component where error occurred */
  component?: string;
  /** Action that was being performed */
  action?: string;
  /** User ID for tracking (will be hashed) */
  userId?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Callback when user closes the dialog */
  onClose?: () => void;
  /** Callback when user clicks "Try Again" */
  onRetry?: () => void;
  /** Whether to show the dialog (controlled mode) */
  isOpen?: boolean;
  /** Custom title */
  title?: string;
  /** Custom children to render instead of default content */
  children?: ReactNode;
  /** Whether to show the "Report Issue" button */
  showReportButton?: boolean;
  /** Whether to show the description input */
  showDescriptionInput?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * ErrorReporter - User-facing error dialog
 *
 * @example
 * <ErrorReporter
 *   error={error}
 *   component="FileUpload"
 *   action="upload"
 *   onRetry={handleRetry}
 *   onClose={handleClose}
 * />
 */
export function ErrorReporter({
  error,
  component,
  action,
  userId,
  metadata,
  onClose,
  onRetry,
  isOpen = true,
  title,
  children,
  showReportButton = true,
  showDescriptionInput = true,
}: ErrorReporterProps) {
  const [userDescription, setUserDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  // Get error details
  const errorMessage = isAppError(error)
    ? error.message
    : error.message || 'An unexpected error occurred';

  const sanitizedMessage = sanitizeErrorMessage(errorMessage);
  const recoverySuggestion = isAppError(error) ? getRecoverySuggestion(error) : null;
  const errorDescription = isAppError(error) ? getErrorDescription(error) : 'Error';

  // Reset state when error changes
  useEffect(() => {
    setUserDescription('');
    setHasReported(false);
  }, [error]);

  // Handle report submission
  const handleReport = async () => {
    setIsReporting(true);

    try {
      // Report error with user description
      reportErrorWithDescription(
        error,
        {
          ...(component ? { component } : {}),
          ...(action ? { action } : {}),
          ...(userId ? { userId } : {}),
          ...(metadata ? { metadata } : {}),
        },
        userDescription
      );

      setHasReported(true);

      // Auto-close after successful report
      setTimeout(() => {
        onClose?.();
      }, 2000);
    } catch (err) {
      console.error('Failed to report error:', err);
    } finally {
      setIsReporting(false);
    }
  };

  // Handle retry
  const handleRetry = () => {
    onRetry?.();
    onClose?.();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose || (() => {})}
      title={title || 'Something went wrong'}
      size="md"
      closeOnEscape
      closeOnBackdropClick={false}
    >
      <div className={styles.errorReporter}>
        {children ? (
          children
        ) : (
          <>
            {/* Error Icon */}
            <div className={styles.iconContainer}>
              <svg
                className={styles.errorIcon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Error Description */}
            <div className={styles.content}>
              <h3 className={styles.errorType}>{errorDescription}</h3>
              <p className={styles.errorMessage}>{sanitizedMessage}</p>

              {recoverySuggestion && (
                <div className={styles.recoverySuggestion}>
                  <svg
                    className={styles.suggestionIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{recoverySuggestion}</span>
                </div>
              )}

              {/* User Description Input */}
              {showDescriptionInput && !hasReported && (
                <div className={styles.descriptionSection}>
                  <label htmlFor="error-description" className={styles.label}>
                    What were you doing when this happened? (Optional)
                  </label>
                  <textarea
                    id="error-description"
                    className={styles.textarea}
                    value={userDescription}
                    onChange={(e) => setUserDescription(e.target.value)}
                    placeholder="E.g., I was trying to upload a large file..."
                    rows={3}
                    maxLength={500}
                  />
                  <span className={styles.charCount}>
                    {userDescription.length}/500
                  </span>
                </div>
              )}

              {/* Success Message */}
              {hasReported && (
                <div className={styles.successMessage}>
                  <svg
                    className={styles.successIcon}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Thank you for reporting this issue!</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className={styles.actions}>
              {onRetry && !hasReported && (
                <Button
                  onClick={handleRetry}
                  variant="primary"
                  fullWidth
                >
                  Try Again
                </Button>
              )}

              {showReportButton && !hasReported && (
                <Button
                  onClick={handleReport}
                  variant="secondary"
                  fullWidth
                  disabled={isReporting}
                >
                  {isReporting ? 'Reporting...' : 'Report this issue'}
                </Button>
              )}

              {(hasReported || !showReportButton) && (
                <Button
                  onClick={onClose}
                  variant="secondary"
                  fullWidth
                >
                  Close
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitize error message for display
 * Remove stack traces, file paths, and other technical details
 */
function sanitizeErrorMessage(message: string): string {
  // Remove stack traces
  let sanitized = message.split('\n')[0] ?? message;

  // Remove file paths
  sanitized = sanitized.replace(/[A-Z]:\\[^\s"']+/gi, '[file path]');
  sanitized = sanitized.replace(/\/[^\s"']+\//g, '[file path]');

  // Limit length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + '...';
  }

  return sanitized;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorReporter;
