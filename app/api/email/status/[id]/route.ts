/**
 * Email Transfer API - Status Check
 * GET /api/email/status/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDeliveryStatus } from '@/lib/email/email-service';
import { secureLog } from '@/lib/utils/secure-logger';
import { generousRateLimiter } from '@/lib/middleware/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting (10 requests/minute)
    const rateLimitResponse = generousRateLimiter.check(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id } = await params;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Transfer ID is required' },
        { status: 400 }
      );
    }

    // Get delivery status
    const status = await getDeliveryStatus(id);

    if (!status) {
      return NextResponse.json(
        { error: 'Transfer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    secureLog.error('[API] Failed to get delivery status:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
