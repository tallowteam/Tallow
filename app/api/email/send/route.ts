/**
 * Email Transfer API - Send
 * POST /api/email/send
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmailTransfer } from '@/lib/email/email-service';
import { validateCSRFToken } from '@/lib/security/csrf';
import { secureLog } from '@/lib/utils/secure-logger';
import { strictRateLimiter } from '@/lib/middleware/rate-limit';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import type { EmailTransferOptions } from '@/lib/email/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
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
    if (!body.recipientEmail || typeof body.recipientEmail !== 'string') {
      return NextResponse.json(
        { error: 'recipientEmail is required' },
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

    // Validate email format (RFC 5322 compliant)
    const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;
    if (!emailRegex.test(body.recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare transfer options
    const options: EmailTransferOptions = {
      recipientEmail: body.recipientEmail,
      senderName: body.senderName,
      senderEmail: body.senderEmail,
      files: body.files.map((file: any) => ({
        filename: file.filename,
        content: file.content, // Base64 or Buffer
        size: file.size,
        contentType: file.contentType,
        checksum: file.checksum,
      })),
      compress: body.compress !== false, // Default true
      password: body.password,
      virusScan: body.virusScan || false,
      expiresAt: body.expiresAt,
      expiresIn: body.expiresIn,
      maxDownloads: body.maxDownloads,
      notifyOnDownload: body.notifyOnDownload || false,
      notifyOnExpire: body.notifyOnExpire || false,
      webhookUrl: body.webhookUrl,
      priority: body.priority || 'normal',
      retryOnFailure: body.retryOnFailure !== false, // Default true
      maxRetries: body.maxRetries || 3,
      template: body.template,
      templateData: body.templateData,
      branding: body.branding,
      metadata: body.metadata,
      trackOpens: body.trackOpens !== false, // Default true
      trackClicks: body.trackClicks !== false, // Default true
    };

    // Send email transfer
    const deliveryStatus = await sendEmailTransfer(options);

    secureLog.log(
      `[API] Email transfer sent: ${deliveryStatus.id} to ${options.recipientEmail}`
    );

    return NextResponse.json({
      success: true,
      transfer: deliveryStatus,
    });
  } catch (error) {
    secureLog.error('[API] Failed to send email transfer:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
});
