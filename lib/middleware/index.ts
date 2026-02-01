/**
 * Middleware Exports
 * Centralized exports for all middleware utilities
 */

// Rate limiting middleware
export {
  RateLimiter,
  createRateLimiter,
  strictRateLimiter,
  moderateRateLimiter,
  generousRateLimiter,
  apiRateLimiter,
  type RateLimitConfig,
} from './rate-limit';

// API metrics middleware
export {
  withAPIMetrics,
  withAPIMetricsCustomPath,
  recordAPIMetric,
  apiRequestDuration,
  apiRequestTotal,
  apiRequestSize,
  apiResponseSize,
  apiActiveRequests,
  apiErrorsByType,
  type APIHandler,
} from './api-metrics';
