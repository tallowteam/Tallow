import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';
import { createElement } from 'react';
import { FileTransferEmail } from '@/lib/emails/file-transfer-email';
import { secureLog } from '@/lib/utils/secure-logger';
import { requireApiKey } from '@/lib/api/auth';

// Lazy initialization
let resend: Resend | null = null;
function getResend() {
  if (!resend && process.env['RESEND_API_KEY']) {
    resend = new Resend(process.env['RESEND_API_KEY']);
  }
  return resend;
}

// Rate limiting: max 3 file emails per minute per IP
const fileEmailRateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_FILE_EMAILS_PER_WINDOW = 3;
// RFC 5322 compliant email validation regex
const EMAIL_REGEX = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;

// No file size limits - unlimited (will auto-chunk large files)
const MAX_ATTACHMENT_SIZE = Number.MAX_SAFE_INTEGER;
const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER;

// Periodic cleanup of stale rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of fileEmailRateLimit) {
    if (now >= entry.resetTime) {
      fileEmailRateLimit.delete(key);
    }
  }
}, RATE_LIMIT_WINDOW);

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
 * Validate file name to prevent path traversal
 */
function sanitizeFileName(fileName: string): string {
  // Remove any path separators and null bytes
  const sanitized = fileName
    .replace(/[\/\\]/g, '_')
    .replace(/\0/g, '')
    .replace(/\.\./g, '_');

  // Limit length
  const maxLength = 255;
  if (sanitized.length > maxLength) {
    const ext = sanitized.substring(sanitized.lastIndexOf('.'));
    const name = sanitized.substring(0, maxLength - ext.length);
    return name + ext;
  }

  return sanitized;
}

/**
 * Convert base64 to Buffer for attachment
 */
function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64');
}

export async function POST(request: NextRequest) {
  try {
    // Require API key authentication
    const authError = requireApiKey(request);
    if (authError) {return authError;}

    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateEntry = fileEmailRateLimit.get(ip);

    if (rateEntry && now < rateEntry.resetTime) {
      if (rateEntry.count >= MAX_FILE_EMAILS_PER_WINDOW) {
        return NextResponse.json(
          { error: 'Too many file transfer requests. Please try again later.' },
          { status: 429 }
        );
      }
      rateEntry.count++;
    } else {
      fileEmailRateLimit.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    }

    // Parse request body
    const body = await request.json();
    const {
      recipientEmail,
      senderName,
      fileName,
      fileSize,
      fileData, // Base64 encoded file data (for attachments)
      downloadUrl, // For link mode
      expiresAt,
      mode, // 'attachment' or 'link'
    } = body;

    // Validate required fields
    if (!recipientEmail || !senderName || !fileName || !fileSize || !expiresAt || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientEmail, senderName, fileName, fileSize, expiresAt, mode' },
        { status: 400 }
      );
    }

    // Validate email format
    if (!EMAIL_REGEX.test(recipientEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate sender name (prevent XSS)
    if (typeof senderName !== 'string' || senderName.length > 100) {
      return NextResponse.json(
        { error: 'Invalid sender name' },
        { status: 400 }
      );
    }

    // Validate file size
    if (typeof fileSize !== 'number' || fileSize <= 0 || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be between 1 byte and ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate mode
    if (mode !== 'attachment' && mode !== 'link') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "attachment" or "link"' },
        { status: 400 }
      );
    }

    // Validate expiration timestamp
    if (typeof expiresAt !== 'number' || expiresAt <= Date.now()) {
      return NextResponse.json(
        { error: 'Invalid expiration time' },
        { status: 400 }
      );
    }

    // Sanitize file name
    const sanitizedFileName = sanitizeFileName(fileName);

    // Check if Resend API is configured
    const resendClient = getResend();
    if (!resendClient) {
      secureLog.log('RESEND_API_KEY not configured, cannot send file email');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 503 }
      );
    }

    // Prepare email based on mode
    const sanitizedSenderName = escapeHtml(senderName);
    const attachmentMode = mode === 'attachment';

    const emailData: any = {
      from: 'Tallow File Transfer <files@resend.dev>',
      to: [recipientEmail],
      subject: `${sanitizedSenderName} sent you a file: ${sanitizedFileName}`,
      react: createElement(FileTransferEmail, {
        senderName: sanitizedSenderName,
        fileName: sanitizedFileName,
        fileSize,
        expiresAt,
        downloadUrl: attachmentMode ? undefined : downloadUrl,
        attachmentMode,
      }),
    };

    // Add attachment if in attachment mode
    if (attachmentMode) {
      if (!fileData) {
        return NextResponse.json(
          { error: 'File data required for attachment mode' },
          { status: 400 }
        );
      }

      // Validate attachment size
      if (fileSize > MAX_ATTACHMENT_SIZE) {
        return NextResponse.json(
          { error: `File too large for attachment. Maximum size is ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB. Use link mode instead.` },
          { status: 400 }
        );
      }

      try {
        const fileBuffer = base64ToBuffer(fileData);

        // Verify buffer size matches declared size
        if (Math.abs(fileBuffer.length - fileSize) > 1000) {
          return NextResponse.json(
            { error: 'File data size mismatch' },
            { status: 400 }
          );
        }

        emailData.attachments = [
          {
            filename: sanitizedFileName,
            content: fileBuffer,
          },
        ];
      } catch (error) {
        secureLog.error('Failed to process file attachment:', error);
        return NextResponse.json(
          { error: 'Invalid file data' },
          { status: 400 }
        );
      }
    } else {
      // Link mode - validate download URL
      if (!downloadUrl || typeof downloadUrl !== 'string') {
        return NextResponse.json(
          { error: 'Download URL required for link mode' },
          { status: 400 }
        );
      }

      // Validate URL format
      try {
        const url = new URL(downloadUrl);
        const origin = request.headers.get('origin') || request.nextUrl.origin;
        const expectedOrigin = new URL(origin).origin;

        // Ensure URL is from our domain (prevent phishing)
        if (url.origin !== expectedOrigin) {
          return NextResponse.json(
            { error: 'Invalid download URL domain' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid download URL format' },
          { status: 400 }
        );
      }
    }

    // Send email
    secureLog.log(`[FileEmail] Sending file transfer email to ${recipientEmail} (${mode} mode)`);
    const { data, error } = await resendClient.emails.send(emailData);

    if (error) {
      secureLog.error('Error sending file transfer email:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error.message },
        { status: 500 }
      );
    }

    secureLog.log(`[FileEmail] Email sent successfully: ${data?.id}`);

    return NextResponse.json(
      {
        success: true,
        emailId: data?.id,
        message: 'File transfer email sent successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    secureLog.error('Error in send-file-email API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
