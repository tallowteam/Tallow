/**
 * Feedback Components
 *
 * Production-ready feedback and notification components for Tallow.
 * All components follow React 19 best practices with TypeScript strict mode.
 */

// Toast Notifications
export { Toast } from './Toast';
export type { ToastProps, ToastVariant, ToastAction } from './Toast';

export { ToastProvider, useToast, useToastHelpers } from './ToastProvider';

// Inline Alert
export { Alert } from './Alert';
export type { AlertProps, AlertVariant } from './Alert';

// Progress Indicators
export { Progress } from './Progress';
export type { ProgressProps } from './Progress';

// Loading Skeletons
export { Skeleton, SkeletonGroup } from './Skeleton';
export type { SkeletonProps, SkeletonGroupProps } from './Skeleton';

// Empty State
export { EmptyState } from './EmptyState';
export type { EmptyStateProps } from './EmptyState';

// Error Handling
export { ErrorBoundary } from './ErrorBoundary';
export type { ErrorBoundaryProps } from './ErrorBoundary';

// Confirmation Dialog
export { ConfirmDialog } from './ConfirmDialog';
export type { ConfirmDialogProps } from './ConfirmDialog';
