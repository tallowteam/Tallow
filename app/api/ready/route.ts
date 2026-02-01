/**
 * Readiness Check Endpoint
 *
 * Kubernetes readiness probe - verifies that the application is ready to serve traffic
 * This is more comprehensive than the liveness probe and checks dependencies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { jsonResponse } from '@/lib/api/response';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheckResult {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  checks: {
    pqcLibrary: boolean;
    signalingServer: boolean;
    environment: boolean;
  };
  errors?: string[];
}

async function checkPQCLibrary(): Promise<boolean> {
  try {
    // Dynamically import PQC library to verify it's available
    await import('pqc-kyber');
    return true;
  } catch (error) {
    secureLog.error('PQC library check failed:', error);
    return false;
  }
}

async function checkSignalingServer(): Promise<boolean> {
  const signalingUrl = process.env['NEXT_PUBLIC_SIGNALING_URL'];

  // If no signaling URL is configured, skip this check (optional dependency)
  if (!signalingUrl) {
    return true;
  }

  try {
    // Parse the URL to get the base domain
    const url = new URL(signalingUrl);
    const healthEndpoint = `${url.protocol}//${url.host}/health`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(healthEndpoint, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data.status === 'ok';
    }
    return false;
  } catch (error) {
    secureLog.error('Signaling server check failed:', error);
    // Don't fail readiness if signaling is unavailable (graceful degradation)
    return true;
  }
}

function checkEnvironment(): boolean {
  // Verify critical environment variables are set
  const requiredEnvVars = ['NODE_ENV'];

  for (const envVar of requiredEnvVars) {
    // eslint-disable-next-line security/detect-object-injection -- Safe: accessing process.env with controlled, known keys
    if (!process.env[envVar]) {
      secureLog.error(`Missing required environment variable: ${envVar}`);
      return false;
    }
  }

  return true;
}

export const GET = withAPIMetrics(async (_request: NextRequest): Promise<NextResponse> => {
  const errors: string[] = [];

  try {
    // Run all health checks in parallel
    const [pqcLibrary, signalingServer, environment] = await Promise.all([
      checkPQCLibrary(),
      checkSignalingServer(),
      checkEnvironment(),
    ]);

    // Collect errors
    if (!pqcLibrary) {errors.push('PQC library not available');}
    if (!signalingServer) {errors.push('Signaling server not reachable');}
    if (!environment) {errors.push('Environment configuration incomplete');}

    const result: HealthCheckResult = {
      status: errors.length === 0 ? 'ok' : 'error',
      service: 'tallow',
      timestamp: new Date().toISOString(),
      checks: {
        pqcLibrary,
        signalingServer,
        environment,
      },
    };

    if (errors.length > 0) {
      result.errors = errors;
    }

    const statusCode = errors.length === 0 ? 200 : 503;

    return jsonResponse(result, statusCode);
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        service: 'tallow',
        timestamp: new Date().toISOString(),
        checks: {
          pqcLibrary: false,
          signalingServer: false,
          environment: false,
        },
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      },
      503
    );
  }
});
