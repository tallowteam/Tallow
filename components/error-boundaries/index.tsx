'use client';

/**
 * Error Boundaries Index
 * Export all error boundary components
 */

export { ErrorBoundary, withErrorBoundary } from '../error-boundary';
export { FeatureErrorBoundary, withFeatureErrorBoundary } from './feature-error-boundary';
export { AsyncErrorBoundary } from './async-error-boundary';

// Recovery UI components
export * from './recovery-ui';
