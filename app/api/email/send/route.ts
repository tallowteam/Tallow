/**
 * Email Send API Route
 * POST /api/email/send
 *
 * Sends share-by-email notifications with file transfer links
 *
 * Rate Limits:
 * - POST: 10 requests per hour per IP (prevent spam)
 *
 * Security:
 * - Input validation and sanitization
 * - Rate limiting per IP
 * - CSRF protection
 * - Email format validation
 * - Disposable email detection (warning only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { secureLog } from '@/lib/utils/secure-logger';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { requireCSRFToken } from '@/lib/security/csrf';
import {
  ApiErrors,
  successResponse,
  handlePreflight,
  withCORS,
} from '@/lib/api/response';
import {
  validateEmailDetailed,
  sanitizeEmailInput,
  isDisposableEmail,
} from '@/lib/email/email-validation';
import { shareEmailTemplate } from '@/lib/email/email-templates';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Rate limiter: 10 emails per hour per IP to prevent spam
 */
const emailRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many email requests. Please try again later.',
});

/**
 * Initialize Resend client
 */
const resend = new Resend(process.env['RESEND_API_KEY'] || 'placeholder_key');

/**
 * Request body interface
 */
interface SendEmailRequest {
  to: string;
  subject?: string;
  shareLink: string;
  senderName: string;
  message?: string;
  fileName?: string;
  fileCount?: number;
  fileSize?: string;
  expiresAt?: string;
}

/**
 * Response interface
 */
interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  warning?: string;
}

/**
 * Sanitize text input to prevent XSS
 */
function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }

  return sanitized.trim();
}

/**
 * Guarantee unsubscribe controls are present in both HTML and text outputs.
 */
function withUnsubscribeFooter(
  template: { html: string; text: string },
  unsubscribeUrl: string
): { html: string; text: string } {
  const hasHtmlUnsubscribe = /unsubscribe/i.test(template.html);
  const hasTextUnsubscribe = /unsubscribe/i.test(template.text);

  const htmlFooter = `
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #334155;text-align:center;font-size:12px;color:#94A3B8;">
  <a href="${unsubscribeUrl}" style="color:#9333EA;text-decoration:none;">Unsubscribe</a> from transfer emails
</div>`.trim();
  const textFooter = `\n\nUnsubscribe: ${unsubscribeUrl}`;

  return {
    html: hasHtmlUnsubscribe ? template.html : `${template.html}\n${htmlFooter}`,
    text: hasTextUnsubscribe ? template.text : `${template.text}${textFooter}`,
  };
}

/**
 * OPTIONS - Handle CORS preflight
 */
export const OPTIONS = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  return handlePreflight(request);
});

/**
 * POST /api/email/send - Send share email
 */
export const POST = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // CSRF Protection
    const csrfError = requireCSRFToken(request);
    if (csrfError) {
      return withCORS(csrfError, request.headers.get('origin'));
    }

    // Rate limiting - 10 emails per hour per IP
    const rateLimitError = emailRateLimiter.check(request);
    if (rateLimitError) {
      return withCORS(rateLimitError, request.headers.get('origin'));
    }

    // Validate content type
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return withCORS(
        ApiErrors.badRequest('Content-Type must be application/json'),
        request.headers.get('origin')
      );
    }

    // Parse request body
    let body: SendEmailRequest;
    try {
      body = await request.json();
    } catch {
      return withCORS(
        ApiErrors.badRequest('Invalid JSON body'),
        request.headers.get('origin')
      );
    }

    // Validate required fields
    if (!body.to || typeof body.to !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Recipient email is required'),
        request.headers.get('origin')
      );
    }

    if (!body.shareLink || typeof body.shareLink !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Share link is required'),
        request.headers.get('origin')
      );
    }

    if (!body.senderName || typeof body.senderName !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Sender name is required'),
        request.headers.get('origin')
      );
    }

    // Sanitize and validate email
    const sanitizedEmail = sanitizeEmailInput(body.to);
    const emailValidation = validateEmailDetailed(sanitizedEmail);

    if (!emailValidation.valid) {
      return withCORS(
        ApiErrors.badRequest(emailValidation.error || 'Invalid email address', {
          suggestion: emailValidation.suggestion,
        }),
        request.headers.get('origin')
      );
    }

    // Sanitize inputs
    const senderName = sanitizeText(body.senderName);
    const message = body.message ? sanitizeText(body.message) : undefined;
    const fileName = body.fileName ? sanitizeText(body.fileName) : undefined;

    // Validate share link format (must be HTTPS in production)
    const shareLink = body.shareLink.trim();
    try {
      const url = new URL(shareLink);
      if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
        return withCORS(
          ApiErrors.badRequest('Share link must use HTTPS in production'),
          request.headers.get('origin')
        );
      }
    } catch {
      return withCORS(
        ApiErrors.badRequest('Invalid share link URL'),
        request.headers.get('origin')
      );
    }

    // Validate file count
    const fileCount = body.fileCount && Number(body.fileCount) > 0
      ? Number(body.fileCount)
      : undefined;

    // Parse expiration date if provided
    let expiresAt: Date | undefined;
    if (body.expiresAt) {
      try {
        expiresAt = new Date(body.expiresAt);
        if (isNaN(expiresAt.getTime())) {
          return withCORS(
            ApiErrors.badRequest('Invalid expiration date format'),
            request.headers.get('origin')
          );
        }
      } catch {
        return withCORS(
          ApiErrors.badRequest('Invalid expiration date'),
          request.headers.get('origin')
        );
      }
    }

    // Check if Resend API key is configured
    const apiKey = process.env['RESEND_API_KEY'];
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!apiKey || apiKey === 'placeholder_key') {
      if (isDevelopment) {
        // Development mode: Log to console instead of sending
        secureLog.log('[Email API] Development mode - Email not sent:');
        secureLog.log({
          to: sanitizedEmail,
          from: process.env['RESEND_FROM_EMAIL'] || 'noreply@tallow.app',
          subject: body.subject || `${senderName} shared files with you via Tallow`,
          senderName,
          shareLink,
          message,
          fileName,
          fileCount,
          fileSize: body.fileSize,
          expiresAt: expiresAt?.toISOString(),
        });

        const response: SendEmailResponse = {
          success: true,
          messageId: `dev_${Date.now()}`,
          warning: 'Development mode: Email logged to console (RESEND_API_KEY not configured)',
        };

        return withCORS(
          successResponse(response as unknown as Record<string, unknown>),
          request.headers.get('origin')
        );
      } else {
        return withCORS(
          ApiErrors.serviceUnavailable('Email service not configured'),
          request.headers.get('origin')
        );
      }
    }

    // Generate email template
    const unsubscribeUrl = `https://tallow.app/email-preferences?email=${encodeURIComponent(sanitizedEmail)}`;
     
    const template = shareEmailTemplate({
      senderName,
      shareLink,
      message: message ?? '',
      fileName: fileName ?? '',
      fileCount: fileCount ?? 0,
      fileSize: body.fileSize ?? '',
      expiresAt: expiresAt ?? new Date(),
    });
    const finalTemplate = withUnsubscribeFooter(template, unsubscribeUrl);

    // Send email via Resend
    try {
      const { data, error } = await resend.emails.send({
        from: process.env['RESEND_FROM_EMAIL'] || 'Tallow <noreply@tallow.app>',
        to: sanitizedEmail,
        subject: body.subject || template.subject,
        html: finalTemplate.html,
        text: finalTemplate.text,
        headers: {
          'List-Unsubscribe': `<mailto:unsubscribe@tallow.app>, <${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
        tags: [
          { name: 'type', value: 'share_notification' },
          { name: 'sender', value: senderName },
        ],
      });

      if (error) {
        secureLog.error('[Email API] Resend error:', error);
        return withCORS(
          ApiErrors.badGateway(`Failed to send email: ${error.message}`),
          request.headers.get('origin')
        );
      }

      secureLog.log(`[Email API] Sent email to ${sanitizedEmail} (ID: ${data?.id})`);

      // Check for disposable email (warning only)
      let warning: string | undefined;
      if (isDisposableEmail(sanitizedEmail)) {
        warning = 'Recipient email appears to be a disposable address';
        secureLog.warn(`[Email API] Disposable email detected: ${sanitizedEmail}`);
      }

      const response = {
        success: true as const,
        messageId: data?.id ?? '',
        ...(warning ? { warning } : {}),
      };

      return withCORS(
        successResponse(response as unknown as Record<string, unknown>),
        request.headers.get('origin')
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      secureLog.error('[Email API] Failed to send email:', errorMessage);
      return withCORS(
        ApiErrors.internalError(),
        request.headers.get('origin')
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    secureLog.error('[Email API] POST error:', errorMessage);
    return withCORS(
      ApiErrors.internalError(),
      request.headers.get('origin')
    );
  }
});
