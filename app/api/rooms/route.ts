import { NextRequest, NextResponse } from 'next/server';
import { secureLog } from '@/lib/utils/secure-logger';
import { createRateLimiter } from '@/lib/middleware/rate-limit';
import { withAPIMetrics } from '@/lib/middleware/api-metrics';
import { requireCSRFToken } from '@/lib/security/csrf';
import {
  jsonResponse,
  ApiErrors,
  successResponse,
  handlePreflight,
  withCORS,
} from '@/lib/api/response';

/**
 * Room API Routes
 * Handles room persistence and cleanup
 *
 * Rate Limits:
 * - GET: 60 requests/minute (moderate)
 * - POST: 10 requests/minute (strict - prevent spam room creation)
 * - DELETE: 30 requests/minute (moderate)
 */

// Rate limiters for different operations
const getRateLimiter = createRateLimiter({
  maxRequests: 60,
  windowMs: 60000,
  message: 'Too many room lookup requests. Please try again later.',
});

const postRateLimiter = createRateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  message: 'Too many room creation requests. Please try again later.',
});

const deleteRateLimiter = createRateLimiter({
  maxRequests: 30,
  windowMs: 60000,
  message: 'Too many room deletion requests. Please try again later.',
});

/**
 * Generate a cryptographically secure random salt
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/**
 * Derive key from password using PBKDF2 (OWASP 2023 recommended parameters)
 * Server-compatible implementation using Web Crypto API
 */
async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array,
  options?: {
    iterations?: number;
    keyLength?: number;
  }
): Promise<Uint8Array> {
  const iterations = options?.iterations || 600000; // OWASP 2023 recommendation
  const keyLength = options?.keyLength || 32;

  // Import password as key material
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // Derive key using PBKDF2 with SHA-256
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    keyLength * 8
  );

  return new Uint8Array(derivedBits);
}

/**
 * Room API Routes
 * Handles room persistence and cleanup
 */

// In-memory room storage (in production, use Redis or a database)
const rooms = new Map<string, {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  expiresAt: string | null;
  isPasswordProtected: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  maxMembers: number;
  members: unknown[];
}>();

// Cleanup expired rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.expiresAt && new Date(room.expiresAt).getTime() < now) {
      rooms.delete(code);
      secureLog.log(`[Rooms API] Cleaned up expired room: ${code}`);
    }
  }
}, 5 * 60 * 1000);

/**
 * Validate room code format (alphanumeric, 4-8 characters)
 */
function isValidRoomCode(code: string): boolean {
  return /^[A-Z0-9]{4,8}$/.test(code);
}

/**
 * Sanitize room name
 */
function sanitizeRoomName(name: string): string {
  return name
    .replace(/[<>"'&]/g, '')
    .trim()
    .substring(0, 50);
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * OPTIONS - Handle CORS preflight
 */
export const OPTIONS = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  return handlePreflight(request);
});

/**
 * GET /api/rooms?code=XXXXX - Get room info
 */
export const GET = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // Apply rate limiting
    const rateLimitError = getRateLimiter.check(request);
    if (rateLimitError) {
      return withCORS(rateLimitError, request.headers.get('origin'));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();

    if (!code) {
      return withCORS(
        ApiErrors.badRequest('Room code is required'),
        request.headers.get('origin')
      );
    }

    // Validate code format
    if (!isValidRoomCode(code)) {
      return withCORS(
        ApiErrors.badRequest('Invalid room code format'),
        request.headers.get('origin')
      );
    }

    const room = rooms.get(code);

    if (!room) {
      return withCORS(
        ApiErrors.notFound('Room not found'),
        request.headers.get('origin')
      );
    }

    // Check if expired
    if (room.expiresAt && new Date(room.expiresAt).getTime() < Date.now()) {
      rooms.delete(code);
      return withCORS(
        ApiErrors.gone('Room has expired'),
        request.headers.get('origin')
      );
    }

    // Return room info (without password hash)
    const response = jsonResponse({
      id: room.id,
      code: room.code,
      name: room.name,
      ownerId: room.ownerId,
      ownerName: room.ownerName,
      createdAt: room.createdAt,
      expiresAt: room.expiresAt,
      isPasswordProtected: room.isPasswordProtected,
      maxMembers: room.maxMembers,
      memberCount: room.members.length,
    });

    return withCORS(response, request.headers.get('origin'));
  } catch (error) {
    secureLog.error('[Rooms API] GET error:', error);
    return withCORS(
      ApiErrors.internalError(),
      request.headers.get('origin')
    );
  }
});

/**
 * POST /api/rooms - Create a new room
 */
export const POST = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // CSRF Protection: Prevent cross-site request forgery
    const csrfError = requireCSRFToken(request);
    if (csrfError) {
      return withCORS(csrfError, request.headers.get('origin'));
    }

    // Apply rate limiting
    const rateLimitError = postRateLimiter.check(request);
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

    let body;
    try {
      body = await request.json();
    } catch {
      return withCORS(
        ApiErrors.badRequest('Invalid JSON body'),
        request.headers.get('origin')
      );
    }

    const { id, code, name, ownerId, ownerName, password, expiresAt, maxMembers } = body;

    // Validate required fields with type checking
    if (!id || typeof id !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Valid room ID is required'),
        request.headers.get('origin')
      );
    }

    if (!code || typeof code !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Valid room code is required'),
        request.headers.get('origin')
      );
    }

    if (!ownerId || typeof ownerId !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Valid owner ID is required'),
        request.headers.get('origin')
      );
    }

    if (!ownerName || typeof ownerName !== 'string') {
      return withCORS(
        ApiErrors.badRequest('Valid owner name is required'),
        request.headers.get('origin')
      );
    }

    // Validate and normalize code format
    const normalizedCode = code.toUpperCase();
    if (!isValidRoomCode(normalizedCode)) {
      return withCORS(
        ApiErrors.badRequest('Room code must be 4-8 alphanumeric characters'),
        request.headers.get('origin')
      );
    }

    // Validate ID format (prevent injection)
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
      return withCORS(
        ApiErrors.badRequest('Invalid room ID format'),
        request.headers.get('origin')
      );
    }

    // Validate owner ID format
    if (!/^[a-zA-Z0-9-]{1,64}$/.test(ownerId)) {
      return withCORS(
        ApiErrors.badRequest('Invalid owner ID format'),
        request.headers.get('origin')
      );
    }

    // Validate maxMembers (2-50)
    const validMaxMembers = Math.min(Math.max(2, Number(maxMembers) || 10), 50);

    // Check if code already exists
    if (rooms.has(normalizedCode)) {
      return withCORS(
        ApiErrors.conflict('Room code already exists'),
        request.headers.get('origin')
      );
    }

    // Hash password if provided using PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    if (password) {
      if (typeof password !== 'string' || password.length < 4 || password.length > 128) {
        return withCORS(
          ApiErrors.badRequest('Password must be 4-128 characters'),
          request.headers.get('origin')
        );
      }
      const { hash, salt } = await hashPasswordSecure(password);
      passwordHash = hash;
      passwordSalt = salt;
    }

    // Validate expiration time
    let validExpiresAt: string | null = null;
    if (expiresAt) {
      const expirationDate = new Date(expiresAt);
      if (isNaN(expirationDate.getTime())) {
        return withCORS(
          ApiErrors.badRequest('Invalid expiration date format'),
          request.headers.get('origin')
        );
      }
      // Do not allow expiration more than 7 days in the future
      const maxExpiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
      if (expirationDate.getTime() > maxExpiration) {
        return withCORS(
          ApiErrors.badRequest('Expiration cannot be more than 7 days in the future'),
          request.headers.get('origin')
        );
      }
      validExpiresAt = expirationDate.toISOString();
    }

    // Create room
    const room: {
      id: string;
      code: string;
      name: string;
      ownerId: string;
      ownerName: string;
      createdAt: string;
      expiresAt: string | null;
      isPasswordProtected: boolean;
      passwordHash?: string;
      passwordSalt?: string;
      maxMembers: number;
      members: unknown[];
    } = {
      id,
      code: normalizedCode,
      name: sanitizeRoomName(name || `Room ${normalizedCode}`),
      ownerId,
      ownerName: sanitizeRoomName(ownerName),
      createdAt: new Date().toISOString(),
      expiresAt: validExpiresAt,
      isPasswordProtected: !!password,
      maxMembers: validMaxMembers,
      members: [],
    };

    // Add password hash and salt if password was provided
    if (passwordHash && passwordSalt) {
      room.passwordHash = passwordHash;
      room.passwordSalt = passwordSalt;
    }

    rooms.set(normalizedCode, room);

    secureLog.log(`[Rooms API] Created room: ${normalizedCode}`);

    const response = successResponse({
      room: {
        id: room.id,
        code: room.code,
        name: room.name,
        ownerId: room.ownerId,
        createdAt: room.createdAt,
        expiresAt: room.expiresAt,
        isPasswordProtected: room.isPasswordProtected,
        maxMembers: room.maxMembers,
      },
    }, 201);

    return withCORS(response, request.headers.get('origin'));
  } catch (error) {
    secureLog.error('[Rooms API] POST error:', error);
    return withCORS(
      ApiErrors.internalError(),
      request.headers.get('origin')
    );
  }
});

/**
 * DELETE /api/rooms?code=XXXXX&ownerId=XXXXX - Delete a room
 */
export const DELETE = withAPIMetrics(async (request: NextRequest): Promise<NextResponse> => {
  try {
    // CSRF Protection: Prevent cross-site request forgery
    const csrfError = requireCSRFToken(request);
    if (csrfError) {
      return withCORS(csrfError, request.headers.get('origin'));
    }

    // Apply rate limiting
    const rateLimitError = deleteRateLimiter.check(request);
    if (rateLimitError) {
      return withCORS(rateLimitError, request.headers.get('origin'));
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.toUpperCase();
    const ownerId = searchParams.get('ownerId');

    if (!code) {
      return withCORS(ApiErrors.badRequest('Room code is required'), request.headers.get('origin'));
    }

    if (!ownerId) {
      return withCORS(ApiErrors.badRequest('Owner ID is required'), request.headers.get('origin'));
    }

    // Validate formats
    if (!isValidRoomCode(code)) {
      return withCORS(ApiErrors.badRequest('Invalid room code format'), request.headers.get('origin'));
    }

    if (!/^[a-zA-Z0-9-]{1,64}$/.test(ownerId)) {
      return withCORS(ApiErrors.badRequest('Invalid owner ID format'), request.headers.get('origin'));
    }

    const room = rooms.get(code);

    if (!room) {
      return withCORS(ApiErrors.notFound('Room not found'), request.headers.get('origin'));
    }

    // Verify ownership (use timing-safe comparison for security)
    if (!timingSafeEquals(room.ownerId, ownerId)) {
      return withCORS(ApiErrors.forbidden('Only the room owner can delete the room'), request.headers.get('origin'));
    }

    rooms.delete(code);

    secureLog.log(`[Rooms API] Deleted room: ${code}`);

    const response = jsonResponse({ success: true, message: 'Room deleted successfully' });
    return withCORS(response, request.headers.get('origin'));
  } catch (error) {
    secureLog.error('[Rooms API] DELETE error:', error);
    return withCORS(ApiErrors.internalError(), request.headers.get('origin'));
  }
});

/**
 * Secure password hashing using PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
 * Returns both the hash and salt for storage
 */
async function hashPasswordSecure(password: string): Promise<{ hash: string; salt: string }> {
  const salt = generateSalt();
  const derivedKey = await deriveKeyFromPassword(password, salt, {
    iterations: 600000,
    keyLength: 32,
  });

  // Convert to hex strings for storage
  const hashHex = Array.from(derivedKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const saltHex = Array.from(salt)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return { hash: hashHex, salt: saltHex };
}

/**
 * Verify password against stored hash and salt using constant-time comparison
 */
async function verifyPasswordSecure(
  password: string,
  storedHash: string,
  storedSalt: string
): Promise<boolean> {
  // Convert salt from hex string back to Uint8Array
  const saltBytes = new Uint8Array(
    storedSalt.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );

  // Derive key from provided password
  const derivedKey = await deriveKeyFromPassword(password, saltBytes, {
    iterations: 600000,
    keyLength: 32,
  });

  // Convert to hex for comparison
  const derivedHash = Array.from(derivedKey)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison to prevent timing attacks
  if (derivedHash.length !== storedHash.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < derivedHash.length; i++) {
    result |= derivedHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }

  return result === 0;
}

// Export for use in join room endpoint
export { verifyPasswordSecure };

// Export for runtime configuration
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
