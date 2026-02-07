/**
 * Email Status API Route
 * GET /api/email/status/[id]
 *
 * Check email delivery status by message ID
 *
 * Rate Limits:
 * - GET: 30 requests per minute (moderate)
 *
 * Security:
 * - Rate limiting per IP
 * - ID format validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import {
  jsonResponse,
  ApiErrors,
  handlePreflight,
  withCORS,
} from '@/lib/api/response';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Rate limiter: 30 requests per minute
 */
const statusRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60 * 1000, // 1 minute
  message: 'Too many status check requests. Please try again later.',
});

/**
 * Email status type
 */
type EmailStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'complained';

/**
 * Response interface
 */
interface EmailStatusResponse {
  id: string;
  status: EmailStatus;
  timestamp: string;
  details?: {
    queuedAt?: string;
    sentAt?: string;
    deliveredAt?: string;
    failedAt?: string;
    error?: string;
  };
}

/**
 * In-memory status storage (in production, use database or cache)
 * This is a simple mock implementation
 */
const emailStatuses = new Map<string, EmailStatusResponse>();

/**
 * Validate message ID format
 * Resend IDs are typically UUIDs or similar alphanumeric strings
 */
function isValidMessageId(id: string): boolean {
  // Allow alphanumeric, hyphens, and underscores (up to 128 chars)
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

/**
 * OPTIONS - Handle CORS preflight
 */
export const OPTIONS = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  return handlePreflight(request);
});

/**
 * GET /api/email/status/[id] - Check email status
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ): Promise<NextResponse> {
    try {
      // Rate limiting
      const rateLimitError = statusRateLimiter.check(request);
      if (rateLimitError) {
        return withCORS(rateLimitError, request.headers.get('origin'));
      }

      // Get message ID from params
      const { id } = await params;

      if (!id) {
        return withCORS(
          ApiErrors.badRequest('Message ID is required'),
          request.headers.get('origin')
        );
      }

      // Validate ID format to prevent injection
      if (!isValidMessageId(id)) {
        return withCORS(
          ApiErrors.badRequest('Invalid message ID format'),
          request.headers.get('origin')
        );
      }

      // Check if this is a development mode ID
      if (id.startsWith('dev_')) {
        const response: EmailStatusResponse = {
          id,
          status: 'sent',
          timestamp: new Date().toISOString(),
          details: {
            sentAt: new Date().toISOString(),
          },
        };

        return withCORS(
          jsonResponse(response),
          request.headers.get('origin')
        );
      }

      // In production, you would query Resend API or your database
      // For now, check in-memory storage
      let status = emailStatuses.get(id);

      if (!status) {
        // If not in our storage, assume it was sent (default status)
        // In production, you'd query the Resend API:
        // const resend = new Resend(process.env.RESEND_API_KEY);
        // const email = await resend.emails.get(id);

        status = {
          id,
          status: 'sent',
          timestamp: new Date().toISOString(),
          details: {
            sentAt: new Date().toISOString(),
          },
        };

        secureLog.log(`[Email Status API] Status check for ${id}: sent (default)`);
      } else {
        secureLog.log(`[Email Status API] Status check for ${id}: ${status.status}`);
      }

      return withCORS(
        jsonResponse(status),
        request.headers.get('origin')
      );
    } catch (error) {
      secureLog.error('[Email Status API] GET error:', error);
      return withCORS(
        ApiErrors.internalError(),
        request.headers.get('origin')
      );
    }
  }

/**
 * Update email status (internal use)
 * This would typically be called by webhooks from Resend
 */
export function updateEmailStatus(
  id: string,
  status: EmailStatus,
  details?: EmailStatusResponse['details']
): void {
  emailStatuses.set(id, {
    id,
    status,
    timestamp: new Date().toISOString(),
    details: details ?? {},
  });
}

/**
 * Export for testing and internal use
 */
export const __internal = {
  emailStatuses,
  updateEmailStatus,
};
