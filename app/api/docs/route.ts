/**
 * OpenAPI Documentation Endpoint
 *
 * Serves the OpenAPI 3.1 specification and Swagger UI
 *
 * Routes:
 * - GET /api/docs (Accept: application/json) - Returns raw OpenAPI spec
 * - GET /api/docs (Accept: text/html) - Returns Swagger UI
 * - GET /api/docs?format=json - Force JSON response
 * - GET /api/docs?format=html - Force HTML (Swagger UI) response
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/docs - Serve OpenAPI spec or Swagger UI
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Dynamically import the OpenAPI spec
    const { openApiSpec, generateSwaggerUI } = await import('@/lib/docs/openapi');

    // Determine response format
    const formatParam = new URL(request.url).searchParams.get('format');
    const acceptHeader = request.headers.get('accept') || '';

    const preferJson =
      formatParam === 'json' ||
      (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html'));

    // Return OpenAPI spec as JSON
    if (preferJson) {
      return jsonResponse(openApiSpec, 200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });
    }

    // Return Swagger UI as HTML
    const specUrl = new URL('/api/docs?format=json', request.nextUrl.origin).toString();
    const html = generateSwaggerUI(specUrl);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    });
  } catch (error) {
    console.error('[API Docs] Error:', error);
    return jsonResponse(
      {
        error: 'Failed to load API documentation',
        code: 'DOCS_ERROR',
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}

/**
 * HEAD /api/docs - Check if documentation is available
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
