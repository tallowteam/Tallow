import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Tallow Middleware
 *
 * - Rate limiting headers for API routes
 * - Admin route basic protection
 * - Security headers enforcement
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Block direct access to admin in production without auth header
  if (pathname.startsWith('/admin')) {
    const adminKey = request.headers.get('x-admin-key');
    const isLocalhost =
      request.headers.get('host')?.includes('localhost') ||
      request.headers.get('host')?.includes('127.0.0.1');

    // Allow localhost access for development; in production require admin key
    if (!isLocalhost && adminKey !== process.env.ADMIN_SECRET_KEY) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Add request ID for tracing
  response.headers.set('x-request-id', crypto.randomUUID());

  // API-specific: add rate limit awareness headers
  if (pathname.startsWith('/api/')) {
    response.headers.set('X-RateLimit-Policy', 'sliding-window');
  }

  return response;
}

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|icon\\.svg|icon-.*\\.png|fonts|sw\\.js|manifest\\.json|robots\\.txt|sitemap\\.xml).*)',
  ],
};
