import { Resend } from 'resend';
import { NextRequest } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireApiKey } from '@/lib/api/auth';
import { requireCSRFToken } from '@/lib/security/csrf';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import {
    ApiErrors,
    successResponse,
    handlePreflight,
    withCORS,
    addDeprecationHeaders,
} from '@/lib/api/response';

// Lazy initialization - only create Resend instance when needed
let resend: Resend | null = null;
function getResend() {
    if (!resend && process.env['RESEND_API_KEY']) {
        resend = new Resend(process.env['RESEND_API_KEY']);
    }
    return resend;
}

// Rate limiting: 10 emails per minute per IP (using centralized rate limiter)
const shareEmailRateLimiter = createRateLimiter({
    maxRequests: 10,
    windowMs: 60000, // 1 minute
    message: 'Too many email requests. Please try again later.',
});

// RFC 5322 compliant email validation regex
// More comprehensive validation to prevent invalid email addresses
const EMAIL_REGEX = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;

function formatFileSize(bytes: number): string {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Sanitize HTML to prevent XSS attacks
 */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Sanitize URL to prevent XSS attacks
 * Only allows http: and https: protocols
 */
function sanitizeUrl(url: string): string {
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
        }
        // Return escaped URL to prevent injection
        return escapeHtml(parsed.toString());
    } catch {
        // If URL parsing fails, return safe fallback
        return '#';
    }
}

function buildShareEmailHtml(shareUrl: string, fileCount: number, totalSize: number, senderName?: string): string {
    const sizeFormatted = formatFileSize(totalSize);
    // CRITICAL FIX: Sanitize both senderName and shareUrl to prevent XSS
    const sanitizedSenderName = senderName ? escapeHtml(senderName) : null;
    const sanitizedShareUrl = sanitizeUrl(shareUrl);
    const senderLine = sanitizedSenderName ? `<p style="color:#555;font-size:14px;">${sanitizedSenderName} has shared files with you.</p>` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.1);padding:40px;">
                    <tr>
                        <td>
                            <h1 style="margin:0 0 16px;font-size:24px;font-weight:600;color:#111;">You've received files</h1>
                            ${senderLine}
                            <p style="color:#333;font-size:15px;margin:16px 0;">${fileCount} file${fileCount !== 1 ? 's' : ''} (${sizeFormatted} total size)</p>
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${sanitizedShareUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:500;">Download Files</a>
                                    </td>
                                </tr>
                            </table>
                            <p style="color:#666;font-size:13px;line-height:1.5;margin:24px 0 0;border-top:1px solid #eee;padding-top:16px;">This link is active while the sender has their tab open. Files are transferred directly peer-to-peer with end-to-end encryption.</p>
                            <p style="color:#999;font-size:12px;margin:16px 0 0;">Sent via Tallow - Secure File Transfer</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`.trim();
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
    return handlePreflight(request);
}

export async function POST(request: NextRequest) {
    const origin = request.headers.get('origin');

    try {
        // Validate CSRF token for non-GET requests
        const csrfError = requireCSRFToken(request);
        if (csrfError) {
            return withCORS(csrfError, origin);
        }

        // CRITICAL FIX: Require API key authentication to prevent spam abuse
        const authError = requireApiKey(request);
        if (authError) {
            return withCORS(authError, origin);
        }

        // Validate content type
        const contentType = request.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            return withCORS(
                ApiErrors.badRequest('Content-Type must be application/json'),
                origin
            );
        }

        // Rate limiting (10 requests per minute per IP)
        const rateLimitResponse = shareEmailRateLimiter.check(request);
        if (rateLimitResponse) {
            return withCORS(rateLimitResponse, origin);
        }

        let body;
        try {
            body = await request.json();
        } catch {
            return withCORS(
                ApiErrors.badRequest('Invalid JSON body'),
                origin
            );
        }

        const { email, shareId, senderName, fileCount, totalSize } = body;

        // Validate required fields
        if (!email || typeof email !== 'string') {
            return withCORS(
                ApiErrors.badRequest('Valid email is required'),
                origin
            );
        }

        if (!shareId || typeof shareId !== 'string') {
            return withCORS(
                ApiErrors.badRequest('Valid shareId is required'),
                origin
            );
        }

        if (typeof fileCount !== 'number' || fileCount < 1) {
            return withCORS(
                ApiErrors.badRequest('Valid fileCount is required'),
                origin
            );
        }

        if (typeof totalSize !== 'number' || totalSize < 0) {
            return withCORS(
                ApiErrors.badRequest('Valid totalSize is required'),
                origin
            );
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            return withCORS(
                ApiErrors.badRequest('Invalid email format'),
                origin
            );
        }

        // Validate shareId format (prevent injection)
        if (!/^[a-zA-Z0-9-]{1,64}$/.test(shareId)) {
            return withCORS(
                ApiErrors.badRequest('Invalid shareId format'),
                origin
            );
        }

        // Validate senderName if provided
        if (senderName && (typeof senderName !== 'string' || senderName.length > 100)) {
            return withCORS(
                ApiErrors.badRequest('Invalid senderName'),
                origin
            );
        }

        // Generate share URL
        const requestOrigin = request.headers.get('origin') || request.nextUrl.origin;
        const shareUrl = `${requestOrigin}/share/${shareId}`;

        // Check if API key is configured
        const resendClient = getResend();
        if (!resendClient) {
            secureLog.log('RESEND_API_KEY not configured, returning share URL only');
            const response = withCORS(
                successResponse({ shareUrl, emailSkipped: true }),
                origin
            );
            return addDeprecationHeaders(response, '/api/v1/send-share-email');
        }

        const htmlBody = buildShareEmailHtml(shareUrl, fileCount, totalSize, senderName);

        const { error } = await resendClient.emails.send({
            from: 'Tallow <onboarding@resend.dev>',
            to: [email],
            subject: 'Someone shared files with you via Tallow',
            html: htmlBody,
        });

        if (error) {
            secureLog.error('Error sending share email:', error);
            const errorResponse = withCORS(
                ApiErrors.badGateway('Failed to send email'),
                origin
            );
            return addDeprecationHeaders(errorResponse, '/api/v1/send-share-email');
        }

        const response = withCORS(
            successResponse({ shareUrl }),
            origin
        );
        return addDeprecationHeaders(response, '/api/v1/send-share-email');
    } catch (error) {
        secureLog.error('Error in send-share-email API:', error);
        const errorResponse = withCORS(
            ApiErrors.internalError(),
            origin
        );
        return addDeprecationHeaders(errorResponse, '/api/v1/send-share-email');
    }
}

// Export for runtime configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
