import { NextRequest, NextResponse } from 'next/server';
import { downloadTempFile } from '@/lib/storage/temp-file-storage';
import { decryptFile, decryptFileName } from '@/lib/crypto/file-encryption-pqc';
import { secureLog } from '@/lib/utils/secure-logger';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import {
  ApiErrors,
  handlePreflight,
  withCORS,
  SECURITY_HEADERS,
} from '@/lib/api/response';

/**
 * Download File API
 * Handles secure file downloads with encryption key validation
 *
 * SECURITY CONSIDERATIONS:
 * - POST method: Encryption key passed in request body (SECURE - recommended)
 * - GET method: DEPRECATED - key in URL appears in server logs/browser history
 * - Key is never logged or stored on server
 * - Key is immediately used for decryption and not retained
 * - File is decrypted in memory and streamed to client
 * - Rate limiting prevents brute-force key guessing
 *
 * MIGRATION: Use POST requests with key in body via /download/secure/[fileId] page
 */

// Rate limiter: 10 download attempts per minute per IP
const downloadRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  message: 'Too many download attempts. Please try again later.',
});

/**
 * Sanitize filename for Content-Disposition header
 * Prevents header injection attacks
 */
function sanitizeFilename(filename: string): string {
  // Remove or replace potentially dangerous characters
  return filename
    .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_')
    .replace(/\r|\n/g, '')
    .substring(0, 255);
}

/**
 * OPTIONS - Handle CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return handlePreflight(request);
}

/**
 * Process download with validated parameters
 * Shared between GET (deprecated) and POST (secure) methods
 */
async function processDownload(
  fileId: string,
  token: string,
  key: string,
  origin: string | null
): Promise<NextResponse> {
  try {
    // Retrieve encrypted file from storage
    const { encryptedFile, metadata: _metadata } = await downloadTempFile(fileId, token);

    // Convert hex key to Uint8Array
    // SECURITY: Key exists only in memory during decryption
    const keyMatches = key.match(/.{1,2}/g);
    if (!keyMatches) {
      return withCORS(ApiErrors.badRequest('Invalid encryption key format'), origin);
    }
    const encryptionKey = new Uint8Array(
      keyMatches.map(byte => parseInt(byte, 16))
    );

    // Decrypt file (key is used here and then garbage collected)
    const decryptedBlob = await decryptFile(encryptedFile, encryptionKey);

    // Decrypt filename
    const rawFileName = await decryptFileName(encryptedFile, encryptionKey);

    // Sanitize filename for Content-Disposition header
    const fileName = sanitizeFilename(rawFileName);

    // Log without sensitive info (file ID is OK, but not key or full filename)
    secureLog.log(`[Download] File downloaded: ${fileId}`);

    // Build secure response headers
    const headers = new Headers();

    // Security headers
    Object.entries(SECURITY_HEADERS).forEach(([headerKey, value]) => {
      headers.set(headerKey, value);
    });

    // File download headers
    headers.set('Content-Type', 'application/octet-stream');
    // Use RFC 5987 encoding for non-ASCII filenames
    const encodedFilename = encodeURIComponent(fileName).replace(/['()]/g, escape);
    headers.set('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFilename}`);
    headers.set('Content-Length', decryptedBlob.size.toString());

    // Override cache control for downloads (don't cache encrypted files)
    headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    // Prevent embedding/framing of downloaded content
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Content-Security-Policy', "default-src 'none'");

    return new NextResponse(decryptedBlob, { headers });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('expired')) {
        return withCORS(ApiErrors.notFound('File not found or has expired'), origin);
      }
      if (error.message.includes('Invalid download token')) {
        return withCORS(ApiErrors.forbidden('Invalid download token'), origin);
      }
      if (error.message.includes('Download limit reached')) {
        return withCORS(ApiErrors.gone('This download link has already been used'), origin);
      }
      if (error.message.includes('hash mismatch') || error.message.includes('corrupted')) {
        // Don't reveal internal error details
        secureLog.error('[Download] File integrity check failed:', error.message);
        return withCORS(ApiErrors.internalError('File verification failed'), origin);
      }
      if (error.message.includes('decrypt')) {
        // Decryption failed - could be wrong key or corrupted data
        secureLog.error('[Download] Decryption failed:', error.message);
        return withCORS(ApiErrors.badRequest('Unable to decrypt file. Invalid key or corrupted data.'), origin);
      }
    }

    secureLog.error('[Download] Download failed:', error);
    return withCORS(ApiErrors.internalError('Failed to download file'), origin);
  }
}

/**
 * Validate common download parameters
 * Returns error response if validation fails, null if valid
 */
function validateDownloadParams(
  fileId: string | null,
  token: string | null,
  key: string | null,
  origin: string | null
): NextResponse | null {
  if (!fileId) {
    return withCORS(ApiErrors.badRequest('fileId is required'), origin);
  }

  if (!token) {
    return withCORS(ApiErrors.badRequest('token is required'), origin);
  }

  if (!key) {
    return withCORS(ApiErrors.badRequest('key is required'), origin);
  }

  // Validate file ID format (prevent path traversal)
  // Format: timestamp-uuid32hex
  if (!/^[0-9]+-[a-f0-9]{32}$/.test(fileId)) {
    return withCORS(ApiErrors.badRequest('Invalid file ID format'), origin);
  }

  // Validate token format (64 hex chars = 256-bit token)
  if (!/^[a-f0-9]{64}$/.test(token)) {
    return withCORS(ApiErrors.badRequest('Invalid token format'), origin);
  }

  // Validate key format (64 hex chars = 256-bit AES key)
  // SECURITY: Key is only validated for format, never logged or stored
  if (!/^[a-f0-9]{64}$/.test(key)) {
    return withCORS(ApiErrors.badRequest('Invalid encryption key format'), origin);
  }

  return null; // Validation passed
}

/**
 * POST - Secure download endpoint (RECOMMENDED)
 * Encryption key is passed in request body, NOT in URL
 * This prevents key exposure in server logs, browser history, and referrer headers
 */
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');

  try {
    // Apply rate limiting
    const rateLimitError = downloadRateLimiter.check(request);
    if (rateLimitError) {
      return withCORS(rateLimitError, origin);
    }

    // Parse request body
    let body: { fileId?: string; token?: string; key?: string };
    try {
      body = await request.json();
    } catch {
      return withCORS(ApiErrors.badRequest('Invalid JSON body'), origin);
    }

    const { fileId, token, key } = body;

    // Validate parameters
    const validationError = validateDownloadParams(fileId ?? null, token ?? null, key ?? null, origin);
    if (validationError) {
      return validationError;
    }

    // At this point, validation passed so all params are defined
    // Process download (key is in memory only, not logged)
    return await processDownload(fileId as string, token as string, key as string, origin);
  } catch (error) {
    secureLog.error('[Download] Error in download-file POST API:', error);
    return withCORS(ApiErrors.internalError(), origin);
  }
}

/**
 * GET - Legacy download endpoint (DEPRECATED)
 * WARNING: Key in URL appears in server logs, browser history, and referrer headers
 * Use POST method via /download/secure/[fileId] page instead
 */
export async function GET(request: NextRequest) {
  const origin = request.headers.get('origin');

  // Log deprecation warning (without sensitive data)
  secureLog.log('[Download] DEPRECATED: GET request with key in URL. Use POST method instead.');

  try {
    // Apply rate limiting
    const rateLimitError = downloadRateLimiter.check(request);
    if (rateLimitError) {
      return withCORS(rateLimitError, origin);
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');
    const token = searchParams.get('token');
    const key = searchParams.get('key'); // SECURITY WARNING: Key in URL is insecure

    // Validate parameters
    const validationError = validateDownloadParams(fileId, token, key, origin);
    if (validationError) {
      return validationError;
    }

    // At this point, validation passed so all params are defined
    // Process download
    return await processDownload(fileId as string, token as string, key as string, origin);
  } catch (error) {
    secureLog.error('[Download] Error in download-file GET API:', error);
    return withCORS(ApiErrors.internalError(), origin);
  }
}

// Export for runtime configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
