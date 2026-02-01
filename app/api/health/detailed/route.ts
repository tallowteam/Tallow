/**
 * Detailed Health Status Endpoint
 * Comprehensive health check with all system information
 *
 * Returns detailed status of all components and dependencies
 * Should be protected in production (not exposed publicly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { register } from '@/lib/monitoring/metrics';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface ComponentHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  metrics?: Record<string, number | string>;
  lastChecked: string;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  components: ComponentHealth[];
  system: {
    platform: string;
    nodeVersion: string;
    memory: {
      total: number;
      used: number;
      percentage: number;
    };
    cpu?: {
      count: number;
      usage?: number;
    };
  };
}

/**
 * Check system memory
 */
function checkSystemMemory(): ComponentHealth {
  const memUsage = process.memoryUsage();
  const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'Memory usage normal';

  if (percentage > 90) {
    status = 'unhealthy';
    message = 'Critical memory usage';
  } else if (percentage > 75) {
    status = 'degraded';
    message = 'High memory usage';
  }

  return {
    name: 'memory',
    status,
    message,
    metrics: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      percentage: parseFloat(percentage.toFixed(2)),
      external: memUsage.external,
      rss: memUsage.rss,
    },
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check environment configuration
 */
function checkEnvironment(): ComponentHealth {
  const requiredVars = [
    'NEXT_PUBLIC_SIGNALING_URL',
    'NEXTAUTH_SECRET',
  ];

  const optionalVars = [
    'NEXT_PUBLIC_SENTRY_DSN',
    'NEXT_PUBLIC_PLAUSIBLE_DOMAIN',
    'STRIPE_SECRET_KEY',
    'RESEND_API_KEY',
  ];

  const missing = requiredVars.filter(v => !process.env[v]);
  const configured = requiredVars.filter(v => !!process.env[v]).length;
  const optionalConfigured = optionalVars.filter(v => !!process.env[v]).length;

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'All required environment variables configured';

  if (missing.length > 0) {
    status = 'unhealthy';
    message = `Missing required variables: ${missing.join(', ')}`;
  } else if (optionalConfigured < optionalVars.length / 2) {
    status = 'degraded';
    message = 'Some optional features not configured';
  }

  return {
    name: 'environment',
    status,
    message,
    metrics: {
      requiredConfigured: configured,
      requiredTotal: requiredVars.length,
      optionalConfigured,
      optionalTotal: optionalVars.length,
    },
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check metrics registry
 */
async function checkMetrics(): Promise<ComponentHealth> {
  try {
    const metrics = await register.metrics();

    return {
      name: 'metrics',
      status: 'healthy',
      message: 'Metrics collection active',
      metrics: {
        metricsCount: metrics.split('\n').filter(l => l && !l.startsWith('#')).length,
      },
      lastChecked: new Date().toISOString(),
    };
  } catch (error) {
    return {
      name: 'metrics',
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Metrics collection failed',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Check monitoring integrations
 */
function checkMonitoring(): ComponentHealth {
  const sentryConfigured = !!process.env['NEXT_PUBLIC_SENTRY_DSN'];
  const plausibleConfigured = !!process.env['NEXT_PUBLIC_PLAUSIBLE_DOMAIN'];

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'All monitoring integrations active';

  if (!sentryConfigured && !plausibleConfigured) {
    status = 'degraded';
    message = 'No monitoring integrations configured';
  } else if (!sentryConfigured || !plausibleConfigured) {
    status = 'degraded';
    message = 'Some monitoring integrations not configured';
  }

  return {
    name: 'monitoring',
    status,
    message,
    metrics: {
      sentry: sentryConfigured ? 'configured' : 'not configured',
      plausible: plausibleConfigured ? 'configured' : 'not configured',
    },
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Get overall system health
 */
async function getSystemHealth(): Promise<SystemHealth> {
  const components: ComponentHealth[] = [];

  // Check all components
  components.push(checkSystemMemory());
  components.push(checkEnvironment());
  components.push(await checkMetrics());
  components.push(checkMonitoring());

  // Determine overall status
  const hasUnhealthy = components.some(c => c.status === 'unhealthy');
  const hasDegraded = components.some(c => c.status === 'degraded');

  let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  }

  // Get system info
  const memUsage = process.memoryUsage();

  return {
    status: overallStatus,
    version: process.env['npm_package_version'] || '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    components,
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: {
        total: memUsage.heapTotal,
        used: memUsage.heapUsed,
        percentage: parseFloat(((memUsage.heapUsed / memUsage.heapTotal) * 100).toFixed(2)),
      },
      cpu: {
        count: require('os').cpus().length,
      },
    },
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Optional authentication check for detailed health endpoint
    const authHeader = request.headers.get('authorization');
    const healthToken = process.env['HEALTH_CHECK_TOKEN'];

    if (healthToken && (!authHeader || authHeader !== `Bearer ${healthToken}`)) {
      return jsonResponse(
        { error: 'Unauthorized' },
        401
      );
    }

    const health = await getSystemHealth();

    return jsonResponse(health, health.status === 'healthy' ? 200 : 503);
  } catch (error) {
    return jsonResponse(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
      },
      503
    );
  }
}
