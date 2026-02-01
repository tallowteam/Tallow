/**
 * API Response Utilities
 * Centralized utilities for consistent API responses with security headers
 */

import { NextResponse } from 'next/server';

/**
 * Standard security headers for all API responses
 */
export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Prevent framing (clickjacking protection)
  'X-Frame-Options': 'DENY',
  // Enable XSS filter in older browsers
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy for privacy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (restrict browser features)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Cache control for sensitive data
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

/**
 * CORS headers for cross-origin requests
 */
export function getCORSHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = process.env['ALLOWED_ORIGINS']?.split(',') || [];
  const isAllowedOrigin = origin && (
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV === 'development'
  );

  return {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-API-Key, X-Request-ID',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Create a JSON response with security headers
 */
export function jsonResponse<T>(
  data: T,
  status: number = 200,
  additionalHeaders?: Record<string, string>
): NextResponse<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...SECURITY_HEADERS,
    ...(additionalHeaders || {}),
  };

  return NextResponse.json(data, { status, headers });
}

/**
 * Create an error response with appropriate status code
 */
export function errorResponse(
  message: string,
  status: number,
  code?: string,
  details?: Record<string, unknown>
): NextResponse {
  return jsonResponse(
    {
      error: message,
      ...(code ? { code } : {}),
      ...(details && process.env.NODE_ENV !== 'production' ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
    status
  );
}

/**
 * Standard error responses
 */
export const ApiErrors = {
  // 400 Bad Request
  badRequest: (message = 'Bad request', details?: Record<string, unknown>) =>
    errorResponse(message, 400, 'BAD_REQUEST', details),

  // 401 Unauthorized
  unauthorized: (message = 'Unauthorized') =>
    errorResponse(message, 401, 'UNAUTHORIZED'),

  // 403 Forbidden
  forbidden: (message = 'Forbidden') =>
    errorResponse(message, 403, 'FORBIDDEN'),

  // 404 Not Found
  notFound: (message = 'Resource not found') =>
    errorResponse(message, 404, 'NOT_FOUND'),

  // 405 Method Not Allowed
  methodNotAllowed: (allowed: string[]) =>
    NextResponse.json(
      { error: 'Method not allowed', allowed },
      {
        status: 405,
        headers: {
          ...SECURITY_HEADERS,
          'Allow': allowed.join(', '),
        },
      }
    ),

  // 409 Conflict
  conflict: (message = 'Resource conflict') =>
    errorResponse(message, 409, 'CONFLICT'),

  // 410 Gone
  gone: (message = 'Resource no longer available') =>
    errorResponse(message, 410, 'GONE'),

  // 422 Unprocessable Entity
  unprocessableEntity: (message = 'Validation failed', details?: Record<string, unknown>) =>
    errorResponse(message, 422, 'VALIDATION_ERROR', details),

  // 429 Too Many Requests
  tooManyRequests: (retryAfter?: number) =>
    NextResponse.json(
      { error: 'Too many requests. Please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
      {
        status: 429,
        headers: {
          ...SECURITY_HEADERS,
          ...(retryAfter ? { 'Retry-After': retryAfter.toString() } : {}),
        },
      }
    ),

  // 500 Internal Server Error
  internalError: (message = 'Internal server error') =>
    errorResponse(message, 500, 'INTERNAL_ERROR'),

  // 502 Bad Gateway
  badGateway: (message = 'Bad gateway') =>
    errorResponse(message, 502, 'BAD_GATEWAY'),

  // 503 Service Unavailable
  serviceUnavailable: (message = 'Service temporarily unavailable', retryAfter?: number) =>
    NextResponse.json(
      { error: message, code: 'SERVICE_UNAVAILABLE' },
      {
        status: 503,
        headers: {
          ...SECURITY_HEADERS,
          ...(retryAfter ? { 'Retry-After': retryAfter.toString() } : {}),
        },
      }
    ),
};

/**
 * Success response wrapper
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse {
  return jsonResponse(
    {
      success: true,
      ...data,
    },
    status
  );
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(request: Request): NextResponse {
  const origin = request.headers.get('origin');

  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCORSHeaders(origin),
      ...SECURITY_HEADERS,
    },
  });
}

/**
 * Add CORS headers to an existing response
 */
export function withCORS(response: NextResponse, origin?: string | null): NextResponse {
  const corsHeaders = getCORSHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Add security headers to an existing response
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Rate limit headers
 */
export function withRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', Math.floor(resetTime / 1000).toString());

  return response;
}

/**
 * Add deprecation headers to mark an endpoint as deprecated
 * Follows RFC 8594 (Sunset Header) and draft-dalal-deprecation-header
 */
export function addDeprecationHeaders(
  response: NextResponse,
  successorPath: string,
  sunsetDate = 'Sat, 01 Mar 2026 00:00:00 GMT'
): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', sunsetDate);
  response.headers.set('Link', `<${successorPath}>; rel="successor-version"`);
  return response;
}

/**
 * API Response utilities namespace
 */
const apiResponse = {
  jsonResponse,
  errorResponse,
  successResponse,
  handlePreflight,
  withCORS,
  withSecurityHeaders,
  withRateLimitHeaders,
  addDeprecationHeaders,
  ApiErrors,
  SECURITY_HEADERS,
  getCORSHeaders,
};

export default apiResponse;
