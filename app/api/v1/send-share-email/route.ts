import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireApiKey } from '@/lib/api/auth';
import { requireCSRFToken } from '@/lib/security/csrf';
import { moderateRateLimiter } from '@/lib/middleware/rate-limit';

/**
 * API v1: Send Share Email
 * POST /api/v1/send-share-email
 */

// Lazy initialization - only create Resend instance when needed
let resend: Resend | null = null;
function getResend() {
    if (!resend && process.env['RESEND_API_KEY']) {
        resend = new Resend(process.env['RESEND_API_KEY']);
    }
    return resend;
}

// RFC 5322 compliant email validation regex
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

function buildShareEmailHtml(shareUrl: string, fileCount: number, totalSize: number, senderName?: string): string {
    const sizeFormatted = formatFileSize(totalSize);
    // CRITICAL FIX: Sanitize senderName to prevent XSS
    const sanitizedSenderName = senderName ? escapeHtml(senderName) : null;
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
                                        <a href="${shareUrl}" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:500;">Download Files</a>
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

export async function POST(request: NextRequest) {
    try {
        // CRITICAL FIX: Require API key authentication to prevent spam abuse
        const authError = requireApiKey(request);
        if (authError) {return authError;}

        // CSRF Protection: Prevent cross-site request forgery
        const csrfError = requireCSRFToken(request);
        if (csrfError) {return csrfError;}

        // Rate limiting: 5 requests/minute per IP
        const rateLimitError = moderateRateLimiter.check(request);
        if (rateLimitError) {return rateLimitError;}

        const { email, shareId, senderName, fileCount, totalSize } = await request.json();

        // Validate required fields
        if (!email || !shareId || typeof fileCount !== 'number' || typeof totalSize !== 'number') {
            return NextResponse.json(
                { error: 'Missing required fields: email, shareId, fileCount, and totalSize are required' },
                { status: 400 }
            );
        }

        // Validate email format
        if (!EMAIL_REGEX.test(email)) {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Generate share URL
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        const shareUrl = `${origin}/share/${shareId}`;

        // Check if API key is configured
        const resendClient = getResend();
        if (!resendClient) {
            secureLog.log('RESEND_API_KEY not configured, returning share URL only');
            return NextResponse.json(
                { success: true, shareUrl, emailSkipped: true },
                { status: 200 }
            );
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
            return NextResponse.json(
                { error: 'Failed to send email', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, shareUrl },
            { status: 200 }
        );
    } catch (error) {
        secureLog.error('Error in send-share-email API:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
