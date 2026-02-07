/**
 * Prometheus Metrics Endpoint
 *
 * Exposes application metrics in Prometheus text exposition format.
 * This endpoint should be scraped by Prometheus server for monitoring.
 *
 * Security: In production, this endpoint should be:
 * - Behind internal network/VPN
 * - Protected by firewall rules
 * - Only accessible to monitoring infrastructure
 *
 * @see https://prometheus.io/docs/instrumenting/exposition_formats/
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRegistry } from '@/lib/metrics/prometheus';

// Force dynamic rendering - metrics must be fresh
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/metrics
 *
 * Returns all registered metrics in Prometheus text format.
 *
 * Response format:
 * - Content-Type: text/plain; version=0.0.4; charset=utf-8
 * - Body: Prometheus text exposition format
 *
 * Example output:
 * ```
 * # HELP tallow_transfers_total Total number of file transfers
 * # TYPE tallow_transfers_total counter
 * tallow_transfers_total{status="success"} 42
 * tallow_transfers_total{status="failed"} 3
 *
 * # HELP tallow_active_connections Number of currently active peer connections
 * # TYPE tallow_active_connections gauge
 * tallow_active_connections{type="webrtc"} 5
 * ```
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const registry = getRegistry();
    const metrics = registry.serialize();

    // Prometheus expects specific content type
    return new NextResponse(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        // Prevent caching - metrics should always be fresh
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    // Log error but don't expose details to prevent information leakage
    console.error('Error generating metrics:', error);

    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

/**
 * HEAD /api/metrics
 *
 * Health check for metrics endpoint.
 * Prometheus uses HEAD requests to check if endpoint is available.
 */
export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
