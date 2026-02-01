/**
 * Email Transfer API - Batch Send
 * POST /api/email/batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendBatchEmailTransfers } from '@/lib/email/email-service';
import { validateCSRFToken } from '@/lib/security/csrf';
import { secureLog } from '@/lib/utils/secure-logger';
import { strictRateLimiter } from '@/lib/middleware/rate-limit';
import type { EmailBatchRequest } from '@/lib/email/types';
import { MAX_BATCH_SIZE } from '@/lib/email/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (3 requests/minute)
    const rateLimitResponse = strictRateLimiter.check(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // CSRF protection
    const csrfValid = validateCSRFToken(request);
    if (!csrfValid) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!Array.isArray(body.recipients) || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'recipients array is required' },
        { status: 400 }
      );
    }

    if (body.recipients.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} recipients per batch` },
        { status: 400 }
      );
    }

    if (!body.senderName || typeof body.senderName !== 'string') {
      return NextResponse.json(
        { error: 'senderName is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        { error: 'At least one file is required' },
        { status: 400 }
      );
    }

    // Validate all email formats (RFC 5322 compliant)
    const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;
    for (const email of body.recipients) {
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: `Invalid email format: ${email}` },
          { status: 400 }
        );
      }
    }

    // Prepare batch request
    const batchRequest: EmailBatchRequest = {
      recipients: body.recipients,
      senderName: body.senderName,
      files: body.files.map((file: any) => ({
        filename: file.filename,
        content: file.content,
        size: file.size,
        contentType: file.contentType,
        checksum: file.checksum,
      })),
      options: {
        senderEmail: body.senderEmail,
        compress: body.compress !== false,
        password: body.password,
        virusScan: body.virusScan || false,
        expiresAt: body.expiresAt,
        expiresIn: body.expiresIn,
        maxDownloads: body.maxDownloads,
        notifyOnDownload: body.notifyOnDownload || false,
        notifyOnExpire: body.notifyOnExpire || false,
        webhookUrl: body.webhookUrl,
        priority: body.priority || 'normal',
        retryOnFailure: body.retryOnFailure !== false,
        maxRetries: body.maxRetries || 3,
        template: body.template,
        templateData: body.templateData,
        branding: body.branding,
        metadata: body.metadata,
        trackOpens: body.trackOpens !== false,
        trackClicks: body.trackClicks !== false,
      },
      batchId: body.batchId,
    };

    // Send batch
    const batchStatus = await sendBatchEmailTransfers(batchRequest);

    secureLog.log(
      `[API] Batch email transfer completed: ${batchStatus.batchId}, ` +
      `${batchStatus.sent} sent, ${batchStatus.failed} failed`
    );

    return NextResponse.json({
      success: true,
      batch: batchStatus,
    });
  } catch (error) {
    secureLog.error('[API] Failed to send batch email transfers:', error);

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
