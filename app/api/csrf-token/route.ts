import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, setCSRFCookie } from '@/lib/security/csrf';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { SECURITY_HEADERS, handlePreflight, withCORS } from '@/lib/api/response';

/**
 * CSRF Token Endpoint
 * GET /api/csrf-token
 *
 * Returns a CSRF token and sets it in a cookie.
 * Client-side code should call this on app initialization.
 *
 * Rate limited to prevent token generation abuse.
 */

// Rate limiter: 30 requests per minute per IP (generous for page loads)
const csrfRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  message: 'Too many token requests. Please try again later.',
});

/**
 * OPTIONS - Handle CORS preflight
 */
export const OPTIONS = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  return handlePreflight(request);
});

export const GET = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  const origin = request.headers.get('origin');

  // Apply rate limiting
  const rateLimitError = csrfRateLimiter.check(request);
  if (rateLimitError) {
    return withCORS(rateLimitError, origin);
  }

  // Generate new CSRF token
  const token = generateCSRFToken();

  // Create response with token in body
  const response = NextResponse.json(
    {
      token,
      message: 'CSRF token generated',
    },
    {
      status: 200,
      headers: SECURITY_HEADERS,
    }
  );

  // Set token in cookie
  setCSRFCookie(response, token);

  return withCORS(response, origin);
});

// Export for runtime configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
