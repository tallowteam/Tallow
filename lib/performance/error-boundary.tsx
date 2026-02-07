'use client';

/**
 * Error Boundary with Performance Reporting
 *
 * Catches React errors and reports them with performance context.
 *
 * @module lib/performance/error-boundary
 */

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { getNavigationTiming, getResourceSizeByType } from './monitoring';

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** Error handler */
  onError?: (error: Error, errorInfo: ErrorInfo, context: ErrorContext) => void;
  /** Report to external service */
  reportUrl?: string;
  /** Show detailed error in development */
  showDetails?: boolean;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export interface ErrorContext {
  componentStack: string | null;
  url: string;
  timestamp: number;
  navigationTiming: ReturnType<typeof getNavigationTiming>;
  resourceSizes: ReturnType<typeof getResourceSizeByType>;
  memoryUsage: MemoryInfo | null;
  userAgent: string;
}

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

/**
 * Error Boundary with performance context
 *
 * @example
 * <ErrorBoundary
 *   fallback={(error, reset) => (
 *     <div>
 *       <h2>Something went wrong</h2>
 *       <button onClick={reset}>Try again</button>
 *     </div>
 *   )}
 *   onError={(error, info, context) => {
 *     analytics.track('error', { error, context });
 *   }}
 * >
 *   <App />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    const context = this.getErrorContext(errorInfo);

    // Call error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, context);
    }

    // Report to external service
    if (this.props.reportUrl) {
      this.reportError(error, errorInfo, context);
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.group('[ErrorBoundary] Caught error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.info('Context:', context);
      // eslint-disable-next-line no-console
      console.groupEnd();
    }
  }

  getErrorContext(errorInfo: ErrorInfo): ErrorContext {
    let memoryUsage: MemoryInfo | null = null;

    // Get memory info if available
    if (typeof performance !== 'undefined') {
      const perfWithMemory = performance as Performance & {
        memory?: {
          usedJSHeapSize: number;
          totalJSHeapSize: number;
          jsHeapSizeLimit: number;
        };
      };
      if (perfWithMemory.memory) {
        memoryUsage = {
          usedJSHeapSize: perfWithMemory.memory.usedJSHeapSize,
          totalJSHeapSize: perfWithMemory.memory.totalJSHeapSize,
          jsHeapSizeLimit: perfWithMemory.memory.jsHeapSizeLimit,
        };
      }
    }

    return {
      componentStack: errorInfo.componentStack || null,
      url: typeof window !== 'undefined' ? window.location.href : '',
      timestamp: Date.now(),
      navigationTiming: getNavigationTiming(),
      resourceSizes: getResourceSizeByType(),
      memoryUsage,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    };
  }

  reportError(
    error: Error,
    errorInfo: ErrorInfo,
    context: ErrorContext
  ): void {
    const report = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context,
    };

    // Use sendBeacon for reliability
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(
        this.props.reportUrl!,
        JSON.stringify(report)
      );
    } else if (typeof fetch !== 'undefined') {
      fetch(this.props.reportUrl!, {
        method: 'POST',
        body: JSON.stringify(report),
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {
        // Ignore fetch errors
      });
    }
  }

  reset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback, showDetails } = this.props;

    if (hasError && error) {
      // Custom fallback
      if (typeof fallback === 'function') {
        return fallback(error, this.reset);
      }

      if (fallback) {
        return fallback;
      }

      // Default fallback
      return (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#1a1a1a',
            color: '#fff',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#888', marginBottom: '2rem' }}>
            We're sorry for the inconvenience. Please try again.
          </p>
          <button
            onClick={this.reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Try Again
          </button>

          {showDetails && process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '2rem',
                textAlign: 'left',
                maxWidth: '600px',
                width: '100%',
              }}
            >
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
                Error Details
              </summary>
              <pre
                style={{
                  backgroundColor: '#2a2a2a',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  overflow: 'auto',
                  fontSize: '0.875rem',
                }}
              >
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

// ============================================================================
// HOC FOR FUNCTION COMPONENTS
// ============================================================================

/**
 * HOC to wrap function components with error boundary
 *
 * @example
 * const SafeComponent = withErrorBoundary(MyComponent, {
 *   fallback: <div>Error occurred</div>,
 * });
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.ComponentType<P> {
  const Wrapped = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  Wrapped.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return Wrapped;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default ErrorBoundary;
