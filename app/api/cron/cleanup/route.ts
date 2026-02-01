/**
 * Cron Job API - Cleanup Expired Files
 * DELETE /api/cron/cleanup
 *
 * This endpoint should be called periodically (e.g., via cron job or Vercel Cron)
 * to clean up expired files from S3 storage
 *
 * Example cron configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { cleanupExpiredFilesS3 } from '@/lib/storage/temp-file-storage';
import { cleanupExpiredTransfers } from '@/lib/email/email-storage';
import { secureLog } from '@/lib/utils/secure-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Verify cron authorization
 */
function verifyCronAuth(request: NextRequest): boolean {
  // Vercel Cron provides a special header
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env['CRON_SECRET'];

  if (process.env['VERCEL'] === '1') {
    // On Vercel, check for Vercel Cron header
    const vercelCronHeader = request.headers.get('x-vercel-cron');
    if (vercelCronHeader) {
      return true;
    }
  }

  // Check for Bearer token
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // SECURITY: No development bypass - always require authentication
  // To test locally, set CRON_SECRET in .env and use Bearer token
  secureLog.warn('[Cron] Authentication failed - missing valid credentials');
  return false;
}

/**
 * GET - Run cleanup job
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    if (!verifyCronAuth(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    secureLog.log('[Cron] Starting cleanup job...');

    // Clean up expired files from S3
    let filesDeleted = 0;
    try {
      filesDeleted = await cleanupExpiredFilesS3();
      secureLog.log(`[Cron] Deleted ${filesDeleted} expired files from S3`);
    } catch (error) {
      secureLog.error('[Cron] S3 cleanup failed:', error);
    }

    // Clean up expired transfer records
    let transfersDeleted = 0;
    try {
      transfersDeleted = await cleanupExpiredTransfers();
      secureLog.log(`[Cron] Deleted ${transfersDeleted} expired transfer records`);
    } catch (error) {
      secureLog.error('[Cron] Transfer cleanup failed:', error);
    }

    const duration = Date.now() - startTime;

    const result = {
      success: true,
      filesDeleted,
      transfersDeleted,
      duration,
      timestamp: new Date().toISOString(),
    };

    secureLog.log(`[Cron] Cleanup completed in ${duration}ms`);

    return NextResponse.json(result);
  } catch (error) {
    secureLog.error('[Cron] Cleanup job failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Manual cleanup trigger (same as GET)
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
