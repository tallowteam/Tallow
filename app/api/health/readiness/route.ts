/**
 * Readiness Probe Endpoint
 * Checks if the application is ready to serve traffic
 *
 * Returns 200 if all dependencies are available
 * Returns 503 if any critical dependency is unavailable
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DependencyCheck {
  name: string;
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

/**
 * Check if environment variables are configured
 */
function checkEnvironment(): DependencyCheck {
  const startTime = Date.now();

  const requiredVars = [
    'NEXT_PUBLIC_SIGNALING_URL',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    return {
      name: 'environment',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: `Missing required environment variables: ${missing.join(', ')}`,
    };
  }

  return {
    name: 'environment',
    status: 'healthy',
    responseTime: Date.now() - startTime,
  };
}

/**
 * Check memory usage
 */
function checkMemory(): DependencyCheck {
  const startTime = Date.now();

  try {
    const memoryUsage = process.memoryUsage();
    const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsedPercent > 90) {
      return {
        name: 'memory',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: `High memory usage: ${heapUsedPercent.toFixed(2)}%`,
      };
    }

    return {
      name: 'memory',
      status: 'healthy',
      responseTime: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: 'memory',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

/**
 * Perform all readiness checks
 */
async function performReadinessChecks(): Promise<{
  ready: boolean;
  checks: DependencyCheck[];
}> {
  const checks: DependencyCheck[] = [];

  // Check environment
  checks.push(checkEnvironment());

  // Check memory
  checks.push(checkMemory());

  // Determine overall readiness
  const ready = checks.every(check => check.status === 'healthy');

  return { ready, checks };
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const { ready, checks } = await performReadinessChecks();

    const response = {
      status: ready ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks,
    };

    return jsonResponse(response, ready ? 200 : 503);
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Readiness check failed',
      },
      503
    );
  }
}

export async function HEAD(_request: NextRequest): Promise<NextResponse> {
  try {
    const { ready } = await performReadinessChecks();
    return new NextResponse(null, { status: ready ? 200 : 503 });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
