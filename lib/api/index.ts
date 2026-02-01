/**
 * API Utilities - Centralized exports
 *
 * This module provides:
 * - Authentication utilities (API key validation)
 * - Response helpers with security headers
 * - Error response standardization
 * - CORS handling
 */

// Authentication
export {
  validateApiKey,
  requireApiKey,
  generateApiKey,
} from './auth';

// Response utilities
export {
  SECURITY_HEADERS,
  getCORSHeaders,
  jsonResponse,
  errorResponse,
  successResponse,
  handlePreflight,
  withCORS,
  withSecurityHeaders,
  withRateLimitHeaders,
  ApiErrors,
} from './response';

// Default export combining all utilities
export { default as apiResponse } from './response';
