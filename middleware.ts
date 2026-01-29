import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the pathname
  const { pathname } = request.nextUrl;

  // Prevent any redirect from root to /app
  // The root path should always serve the landing page
  if (pathname === '/' && request.headers.get('x-middleware-rewrite')) {
    return NextResponse.next();
  }

  // Let Next.js handle the routing normally
  return NextResponse.next();
}

// Configure which paths the middleware runs on
export const config = {
  // Run on all paths except static files and API routes  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, fonts, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ico|json|txt)).*)',
  ],
};
