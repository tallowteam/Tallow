/**
 * API Metrics Middleware
 * Records request duration and counts for Prometheus monitoring
 *
 * Usage:
 * ```typescript
 * import { withAPIMetrics } from '@/lib/middleware/api-metrics';
 *
 * async function handler(req: NextRequest): Promise<NextResponse> {
 *   // Your handler logic
 * }
 *
 * export const GET = withAPIMetrics(handler);
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { Histogram, Counter, Registry } from 'prom-client';
import { register } from '@/lib/monitoring/metrics';

// Cast the stub register to the expected Registry type
const registryStub = register as unknown as Registry;

/**
 * Request duration histogram
 * Tracks latency distribution across API endpoints
 */
export const apiRequestDuration = new Histogram({
  name: 'tallow_api_request_duration_seconds',
  help: 'API request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registryStub],
});

/**
 * Request counter
 * Tracks total number of requests by endpoint
 */
export const apiRequestTotal = new Counter({
  name: 'tallow_api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'path', 'status'],
  registers: [registryStub],
});

/**
 * Request size histogram
 * Tracks request body sizes
 */
export const apiRequestSize = new Histogram({
  name: 'tallow_api_request_size_bytes',
  help: 'API request body size in bytes',
  labelNames: ['method', 'path'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  registers: [registryStub],
});

/**
 * Response size histogram
 * Tracks response body sizes
 */
export const apiResponseSize = new Histogram({
  name: 'tallow_api_response_size_bytes',
  help: 'API response body size in bytes',
  labelNames: ['method', 'path', 'status'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000],
  registers: [registryStub],
});

/**
 * Active requests gauge
 * Tracks currently processing requests
 */
import { Gauge } from 'prom-client';

export const apiActiveRequests = new Gauge({
  name: 'tallow_api_active_requests',
  help: 'Number of currently active API requests',
  labelNames: ['method', 'path'],
  registers: [registryStub],
});

/**
 * Error counter by type
 * Categorizes errors for better debugging
 */
export const apiErrorsByType = new Counter({
  name: 'tallow_api_errors_by_type_total',
  help: 'Total API errors by error type',
  labelNames: ['method', 'path', 'error_type'],
  registers: [registryStub],
});

/**
 * Normalize path to prevent label cardinality explosion
 * Replaces dynamic segments (UUIDs, IDs) with placeholders
 */
function normalizePath(path: string): string {
  return path
    // Replace UUIDs (standard format with hyphens)
    .replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '/:id')
    // Replace UUIDs without hyphens
    .replace(/\/[a-f0-9]{32}/gi, '/:id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace room codes (4-8 alphanumeric)
    .replace(/\/[A-Z0-9]{4,8}(?=\/|$)/gi, '/:code')
    // Limit path length to prevent memory issues
    .slice(0, 100);
}

/**
 * Categorize error type from error object
 */
function categorizeError(error: unknown): string {
  if (error instanceof TypeError) {
    return 'type_error';
  }
  if (error instanceof SyntaxError) {
    return 'syntax_error';
  }
  if (error instanceof RangeError) {
    return 'range_error';
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('network')) {
      return 'network';
    }
    if (message.includes('auth')) {
      return 'auth';
    }
    if (message.includes('permission')) {
      return 'permission';
    }
    if (message.includes('validation')) {
      return 'validation';
    }
    if (message.includes('not found')) {
      return 'not_found';
    }
    return 'application_error';
  }
  return 'unknown';
}

/**
 * Get content length from request
 */
function getRequestSize(req: NextRequest): number {
  const contentLength = req.headers.get('content-length');
  return contentLength ? parseInt(contentLength, 10) : 0;
}

/**
 * API Handler type definition
 */
export type APIHandler = (req: NextRequest) => Promise<NextResponse>;

/**
 * Wrap an API handler with metrics collection
 *
 * Features:
 * - Request duration tracking (histogram)
 * - Request/response counting
 * - Request/response size tracking
 * - Active request gauge
 * - Error categorization
 *
 * @param handler - The API route handler function
 * @returns Wrapped handler with metrics instrumentation
 */
export function withAPIMetrics(handler: APIHandler): APIHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = performance.now();
    const path = normalizePath(req.nextUrl.pathname);
    const method = req.method;

    // Track active requests
    apiActiveRequests.inc({ method, path });

    // Track request size
    const requestSize = getRequestSize(req);
    if (requestSize > 0) {
      apiRequestSize.observe({ method, path }, requestSize);
    }

    try {
      const response = await handler(req);
      const duration = (performance.now() - start) / 1000;
      const status = response.status.toString();

      // Record metrics
      apiRequestDuration.observe({ method, path, status }, duration);
      apiRequestTotal.inc({ method, path, status });

      // Track response size if available
      const responseSize = response.headers.get('content-length');
      if (responseSize) {
        apiResponseSize.observe({ method, path, status }, parseInt(responseSize, 10));
      }

      return response;
    } catch (error) {
      const duration = (performance.now() - start) / 1000;
      const errorType = categorizeError(error);

      // Record error metrics
      apiRequestDuration.observe({ method, path, status: '500' }, duration);
      apiRequestTotal.inc({ method, path, status: '500' });
      apiErrorsByType.inc({ method, path, error_type: errorType });

      throw error;
    } finally {
      // Decrement active requests
      apiActiveRequests.dec({ method, path });
    }
  };
}

/**
 * Create a metrics-wrapped handler with custom path normalization
 * Useful when you want to override the default path normalization
 */
export function withAPIMetricsCustomPath(
  handler: APIHandler,
  customPath: string
): APIHandler {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = performance.now();
    const path = customPath;
    const method = req.method;

    apiActiveRequests.inc({ method, path });

    const requestSize = getRequestSize(req);
    if (requestSize > 0) {
      apiRequestSize.observe({ method, path }, requestSize);
    }

    try {
      const response = await handler(req);
      const duration = (performance.now() - start) / 1000;
      const status = response.status.toString();

      apiRequestDuration.observe({ method, path, status }, duration);
      apiRequestTotal.inc({ method, path, status });

      const responseSize = response.headers.get('content-length');
      if (responseSize) {
        apiResponseSize.observe({ method, path, status }, parseInt(responseSize, 10));
      }

      return response;
    } catch (error) {
      const duration = (performance.now() - start) / 1000;
      const errorType = categorizeError(error);

      apiRequestDuration.observe({ method, path, status: '500' }, duration);
      apiRequestTotal.inc({ method, path, status: '500' });
      apiErrorsByType.inc({ method, path, error_type: errorType });

      throw error;
    } finally {
      apiActiveRequests.dec({ method, path });
    }
  };
}

/**
 * Record a manual metric for cases where the middleware wrapper doesn't fit
 * Useful for streaming responses or WebSocket upgrades
 */
export function recordAPIMetric(
  method: string,
  path: string,
  status: number,
  durationMs: number,
  options?: {
    requestSize?: number;
    responseSize?: number;
    errorType?: string;
  }
): void {
  const normalizedPath = normalizePath(path);
  const durationSeconds = durationMs / 1000;
  const statusStr = status.toString();

  apiRequestDuration.observe({ method, path: normalizedPath, status: statusStr }, durationSeconds);
  apiRequestTotal.inc({ method, path: normalizedPath, status: statusStr });

  if (options?.requestSize) {
    apiRequestSize.observe({ method, path: normalizedPath }, options.requestSize);
  }

  if (options?.responseSize) {
    apiResponseSize.observe({ method, path: normalizedPath, status: statusStr }, options.responseSize);
  }

  if (options?.errorType) {
    apiErrorsByType.inc({ method, path: normalizedPath, error_type: options.errorType });
  }
}

const apiMetrics = {
  withAPIMetrics,
  withAPIMetricsCustomPath,
  recordAPIMetric,
  apiRequestDuration,
  apiRequestTotal,
  apiRequestSize,
  apiResponseSize,
  apiActiveRequests,
  apiErrorsByType,
  normalizePath,
};

export default apiMetrics;
