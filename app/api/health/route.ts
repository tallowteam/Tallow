/**
 * Health Check Endpoint
 *
 * Basic liveness probe for container orchestration (Kubernetes, Docker, etc.)
 * Returns 200 OK if the application is running, 503 if not healthy
 *
 * This endpoint is intentionally simple and does not check dependencies
 * to ensure fast response times for health checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withAPIMetrics(async (_request: NextRequest): Promise<NextResponse> => {
  try {
    return jsonResponse(
      {
        status: 'ok',
        service: 'tallow',
        version: (process.env as Record<string, string | undefined>)['npm_package_version'] ?? '1.0.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      200
    );
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        service: 'tallow',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      503
    );
  }
});
