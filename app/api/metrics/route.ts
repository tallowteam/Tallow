/**
 * Prometheus Metrics Endpoint
 * Exposes application metrics in Prometheus format
 *
 * Usage:
 * - Configure Prometheus to scrape: http://localhost:3000/api/metrics
 * - Metrics are exposed in OpenMetrics format
 * - Set METRICS_TOKEN env var to enable Bearer token authentication
 * - If METRICS_TOKEN is not set, access is unrestricted (dev mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics, getContentType } from '@/lib/monitoring/metrics-server';
import { secureLog } from '@/lib/utils/secure-logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/metrics
 * Returns all registered metrics in Prometheus format
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check for metrics endpoint
    // If METRICS_TOKEN is set, require Bearer token authentication
    // If METRICS_TOKEN is not set (dev mode), allow unrestricted access
    const authHeader = request.headers.get('authorization');
    const metricsToken = process.env['METRICS_TOKEN'];

    if (metricsToken && (!authHeader || authHeader !== `Bearer ${metricsToken}`)) {
      secureLog.warn('[Metrics] Unauthorized access attempt to metrics endpoint');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get metrics from registry
    const metrics = await getMetrics();
    const contentType = getContentType();

    // Return metrics in Prometheus text format
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    secureLog.error('[Metrics] Error generating metrics:', error);

    return NextResponse.json(
      {
        error: 'Failed to generate metrics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * HEAD /api/metrics
 * Health check for metrics endpoint
 */
export async function HEAD(request: NextRequest) {
  // Apply same authentication check to HEAD requests
  const authHeader = request.headers.get('authorization');
  const metricsToken = process.env['METRICS_TOKEN'];

  if (metricsToken && (!authHeader || authHeader !== `Bearer ${metricsToken}`)) {
    return new NextResponse(null, { status: 401 });
  }

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': getContentType(),
    },
  });
}
