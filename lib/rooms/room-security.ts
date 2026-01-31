'use client';

/**
 * Room Security Module
 *
 * Implements security controls for transfer rooms:
 * - Room code validation (minimum 6 characters)
 * - Password strength requirements
 * - Rate limiting for room operations
 * - Anti-enumeration protection
 * - Failed attempt tracking
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 6
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';
import {
  deriveKeyArgon2id,
  deriveKeyPBKDF2,
  isArgon2Available,
  ARGON2_DEFAULTS,
  PBKDF2_DEFAULTS,
} from '../crypto/argon2-browser';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RoomCodeValidation {
  valid: boolean;
  reason?: string;
  suggestions?: string[];
}

export interface PasswordStrength {
  score: number; // 0-4 (weak to strong)
  valid: boolean;
  feedback: string[];
  suggestions: string[];
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds
  attemptsRemaining?: number;
}

// ============================================================================
// Constants
// ============================================================================

const MIN_ROOM_CODE_LENGTH = 6;
const MAX_ROOM_CODE_LENGTH = 16;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_ROOM_CREATION_ATTEMPTS = 5; // per window
const MAX_JOIN_ATTEMPTS = 10; // per window
const MAX_FAILED_PASSWORD_ATTEMPTS = 3; // before exponential backoff

// Exponential backoff delays (milliseconds)
const BACKOFF_DELAYS = [1000, 2000, 5000, 10000, 30000, 60000];

// ============================================================================
// Room Code Validation
// ============================================================================

/**
 * Validate room code meets security requirements
 */
export function validateRoomCode(code: string): RoomCodeValidation {
  const suggestions: string[] = [];

  // Check length
  if (!code || code.length < MIN_ROOM_CODE_LENGTH) {
    return {
      valid: false,
      reason: `Room code must be at least ${MIN_ROOM_CODE_LENGTH} characters`,
      suggestions: ['Use a longer code for better security'],
    };
  }

  if (code.length > MAX_ROOM_CODE_LENGTH) {
    return {
      valid: false,
      reason: `Room code must be at most ${MAX_ROOM_CODE_LENGTH} characters`,
    };
  }

  // Check character set (alphanumeric, no ambiguous characters)
  const validChars = /^[A-HJ-NP-Z2-9]+$/i;
  if (!validChars.test(code)) {
    return {
      valid: false,
      reason: 'Room code contains invalid characters',
      suggestions: [
        'Use only letters and numbers',
        'Avoid ambiguous characters (I, O, 0, 1, L)',
      ],
    };
  }

  // Check for common weak patterns
  const weakPatterns = [
    /^(.)\1+$/, // All same character (e.g., "AAAAAA")
    /^(012|123|234|345|456|567|678|789|890)+$/, // Sequential numbers
    /^(ABC|BCD|CDE|DEF|EFG|FGH)+$/i, // Sequential letters
  ];

  for (const pattern of weakPatterns) {
    if (pattern.test(code)) {
      suggestions.push('Avoid using sequential or repetitive patterns');
      break;
    }
  }

  return {
    valid: true,
    ...(suggestions.length > 0 ? { suggestions } : {}),
  };
}

/**
 * Generate a secure room code
 * Uses CSPRNG with proper entropy
 */
export function generateSecureRoomCode(length: number = 8): string {
  if (length < MIN_ROOM_CODE_LENGTH || length > MAX_ROOM_CODE_LENGTH) {
    length = 8; // Default
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);

  let code = '';
  for (let i = 0; i < length; i++) {
    const value = values[i];
    if (value !== undefined) {
      code += chars[value % chars.length];
    }
  }

  return code;
}

// ============================================================================
// Password Strength Validation
// ============================================================================

/**
 * Validate password strength for protected rooms
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      score: 0,
      valid: false,
      feedback: [`Password must be at least ${MIN_PASSWORD_LENGTH} characters`],
      suggestions: ['Use a longer password'],
    };
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      score: 0,
      valid: false,
      feedback: [`Password must be at most ${MAX_PASSWORD_LENGTH} characters`],
      suggestions: [],
    };
  }

  // Length bonus
  if (password.length >= 12) {score++;}
  if (password.length >= 16) {score++;}

  // Character variety checks
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let varietyCount = 0;
  if (hasLowercase) {varietyCount++;}
  if (hasUppercase) {varietyCount++;}
  if (hasNumbers) {varietyCount++;}
  if (hasSpecial) {varietyCount++;}

  if (varietyCount >= 3) {score++;}
  if (varietyCount === 4) {score++;}

  // Check for common weak patterns
  const weakPatterns = [
    { pattern: /(.)\1{2,}/, message: 'Avoid repeated characters' },
    { pattern: /^[a-z]+$/i, message: 'Include numbers or special characters' },
    { pattern: /^[0-9]+$/, message: 'Include letters' },
    { pattern: /(password|pass|pwd|123|abc|qwerty)/i, message: 'Avoid common words' },
    { pattern: /(012|123|234|345|456|567|678|789)/, message: 'Avoid sequential patterns' },
  ];

  for (const { pattern, message } of weakPatterns) {
    if (pattern.test(password)) {
      feedback.push(message);
      score = Math.max(0, score - 1);
    }
  }

  // Generate suggestions based on missing elements
  if (!hasLowercase || !hasUppercase) {
    suggestions.push('Include both uppercase and lowercase letters');
  }
  if (!hasNumbers) {
    suggestions.push('Include numbers');
  }
  if (!hasSpecial) {
    suggestions.push('Include special characters (!@#$%^&*)');
  }
  if (password.length < 12) {
    suggestions.push('Use at least 12 characters for better security');
  }

  // Determine validity (require score >= 2 for basic security)
  const valid = score >= 2 && varietyCount >= 3;

  if (!valid && feedback.length === 0) {
    feedback.push('Password is too weak');
  }

  return {
    score: Math.min(score, 4),
    valid,
    feedback,
    suggestions,
  };
}

/**
 * Hash password for protected rooms
 * Uses Argon2id (memory-hard, GPU/ASIC resistant) with PBKDF2 fallback
 *
 * Format: version:salt:hash (all hex-encoded)
 * - version 1: Argon2id (64MB memory, 3 iterations, 4 parallelism)
 * - version 2: PBKDF2 fallback (600K iterations)
 */
export async function hashRoomPassword(password: string, saltHex?: string): Promise<string> {
  // Generate 32-byte salt if not provided (256 bits for maximum security)
  const saltBytes = saltHex
    ? new Uint8Array(saltHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) ?? [])
    : crypto.getRandomValues(new Uint8Array(32));

  // Validate salt is at least 16 bytes
  if (saltBytes.length < 16) {
    throw new Error('Salt must be at least 16 bytes');
  }

  let hashBytes: Uint8Array;
  let version: number;

  // Try Argon2id first (preferred), fall back to PBKDF2
  const argon2Available = await isArgon2Available();

  if (argon2Available) {
    // Use Argon2id with recommended parameters
    hashBytes = await deriveKeyArgon2id(password, saltBytes, {
      memory: ARGON2_DEFAULTS.memory,      // 64 MiB
      iterations: ARGON2_DEFAULTS.iterations, // 3 passes
      parallelism: ARGON2_DEFAULTS.parallelism, // 4 threads
      hashLength: 32,                       // 256-bit output
    });
    version = 1; // Argon2id
  } else {
    // Fallback to PBKDF2 with OWASP 2023 recommendations
    hashBytes = await deriveKeyPBKDF2(password, saltBytes, {
      iterations: PBKDF2_DEFAULTS.iterations, // 600K iterations
      keyLength: 32,
    });
    version = 2; // PBKDF2 fallback
  }

  // Convert to hex
  const hashHex = Array.from(hashBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHexOut = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');

  // Return version:salt:hash format
  return `${version}:${saltHexOut}:${hashHex}`;
}

/**
 * Verify password against hash
 * Supports both Argon2id (v1) and PBKDF2 (v2) hash formats
 */
export async function verifyRoomPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split(':');

    // Handle new format: version:salt:hash
    if (parts.length === 3) {
      const [versionStr, saltHex, expectedHash] = parts;
      const version = parseInt(versionStr ?? '0', 10);

      if (!saltHex || !expectedHash) {
        return false;
      }

      // Convert salt from hex to bytes
      const saltBytes = new Uint8Array(
        saltHex.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) ?? []
      );

      let computedHashBytes: Uint8Array;

      if (version === 1) {
        // Argon2id hash
        const argon2Available = await isArgon2Available();
        if (!argon2Available) {
          secureLog.error('[RoomSecurity] Cannot verify Argon2id hash: WASM not available');
          return false;
        }
        computedHashBytes = await deriveKeyArgon2id(password, saltBytes, {
          memory: ARGON2_DEFAULTS.memory,
          iterations: ARGON2_DEFAULTS.iterations,
          parallelism: ARGON2_DEFAULTS.parallelism,
          hashLength: 32,
        });
      } else if (version === 2) {
        // PBKDF2 hash
        computedHashBytes = await deriveKeyPBKDF2(password, saltBytes, {
          iterations: PBKDF2_DEFAULTS.iterations,
          keyLength: 32,
        });
      } else {
        secureLog.error('[RoomSecurity] Unknown hash version:', version);
        return false;
      }

      const computedHashHex = Array.from(computedHashBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Constant-time comparison to prevent timing attacks
      return constantTimeCompare(computedHashHex, expectedHash);
    }

    // Legacy format: salt:hash (old SHA-256 based hashes)
    // These cannot be verified with the new Argon2id system
    // Rooms with legacy hashes must be recreated
    if (parts.length === 2) {
      secureLog.warn('[RoomSecurity] Legacy hash format detected - room must be recreated with new password');
      return false;
    }

    return false;
  } catch (error) {
    secureLog.error('[RoomSecurity] Password verification failed:', error);
    return false;
  }
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  attempts: number;
  firstAttemptTime: number;
  lastAttemptTime: number;
  failedAttempts: number;
}

class RateLimiter {
  private records: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.records.entries()) {
      // Remove entries older than rate limit window
      if (now - entry.lastAttemptTime > RATE_LIMIT_WINDOW_MS) {
        this.records.delete(key);
      }
    }
  }

  checkLimit(key: string, maxAttempts: number): RateLimitResult {
    const now = Date.now();
    const entry = this.records.get(key);

    if (!entry) {
      // First attempt
      this.records.set(key, {
        attempts: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
        failedAttempts: 0,
      });
      return { allowed: true, attemptsRemaining: maxAttempts - 1 };
    }

    // Check if window has expired
    if (now - entry.firstAttemptTime > RATE_LIMIT_WINDOW_MS) {
      // Reset window
      this.records.set(key, {
        attempts: 1,
        firstAttemptTime: now,
        lastAttemptTime: now,
        failedAttempts: 0,
      });
      return { allowed: true, attemptsRemaining: maxAttempts - 1 };
    }

    // Check limit
    if (entry.attempts >= maxAttempts) {
      const retryAfter = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - entry.firstAttemptTime)) / 1000);
      return { allowed: false, retryAfter };
    }

    // Increment attempts
    entry.attempts++;
    entry.lastAttemptTime = now;
    this.records.set(key, entry);

    return { allowed: true, attemptsRemaining: maxAttempts - entry.attempts };
  }

  recordFailure(key: string): void {
    const entry = this.records.get(key);
    if (entry) {
      entry.failedAttempts++;
      this.records.set(key, entry);
    }
  }

  getBackoffDelay(key: string): number {
    const entry = this.records.get(key);
    if (!entry || entry.failedAttempts === 0) {return 0;}

    const delayIndex = Math.min(entry.failedAttempts - 1, BACKOFF_DELAYS.length - 1);
    return BACKOFF_DELAYS[delayIndex] || 0;
  }

  reset(key: string): void {
    this.records.delete(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.records.clear();
  }
}

// Global rate limiters
const roomCreationLimiter = new RateLimiter();
const roomJoinLimiter = new RateLimiter();
const passwordAttemptLimiter = new RateLimiter();

// ============================================================================
// Rate Limiting API
// ============================================================================

/**
 * Check if room creation is allowed
 */
export function checkRoomCreationLimit(deviceId: string): RateLimitResult {
  return roomCreationLimiter.checkLimit(
    `create:${deviceId}`,
    MAX_ROOM_CREATION_ATTEMPTS
  );
}

/**
 * Check if room join is allowed
 */
export function checkRoomJoinLimit(deviceId: string, roomCode: string): RateLimitResult {
  return roomJoinLimiter.checkLimit(
    `join:${deviceId}:${roomCode}`,
    MAX_JOIN_ATTEMPTS
  );
}

/**
 * Check if password attempt is allowed
 */
export function checkPasswordAttemptLimit(deviceId: string, roomCode: string): {
  allowed: boolean;
  backoffDelay: number;
} {
  const key = `password:${deviceId}:${roomCode}`;
  const result = passwordAttemptLimiter.checkLimit(key, MAX_FAILED_PASSWORD_ATTEMPTS);

  if (!result.allowed) {
    const backoffDelay = passwordAttemptLimiter.getBackoffDelay(key);
    return { allowed: false, backoffDelay };
  }

  return { allowed: true, backoffDelay: 0 };
}

/**
 * Record failed password attempt
 */
export function recordFailedPasswordAttempt(deviceId: string, roomCode: string): void {
  const key = `password:${deviceId}:${roomCode}`;
  passwordAttemptLimiter.recordFailure(key);

  const failureCount = passwordAttemptLimiter.getBackoffDelay(key);
  secureLog.warn(`[RoomSecurity] Failed password attempt for room ${roomCode}`, {
    deviceId: deviceId.substring(0, 8) + '...',
    failureCount,
  });
}

/**
 * Reset rate limits for a specific operation
 */
export function resetRateLimit(type: 'creation' | 'join' | 'password', deviceId: string, roomCode?: string): void {
  switch (type) {
    case 'creation':
      roomCreationLimiter.reset(`create:${deviceId}`);
      break;
    case 'join':
      if (roomCode) {
        roomJoinLimiter.reset(`join:${deviceId}:${roomCode}`);
      }
      break;
    case 'password':
      if (roomCode) {
        passwordAttemptLimiter.reset(`password:${deviceId}:${roomCode}`);
      }
      break;
  }
}

// ============================================================================
// Anti-Enumeration Protection
// ============================================================================

/**
 * Add timing jitter to prevent timing-based enumeration attacks
 * Uses crypto.getRandomValues() for cryptographically secure randomness
 */
export async function addTimingJitter(minMs: number = 100, maxMs: number = 500): Promise<void> {
  // Use crypto.getRandomValues() instead of Math.random() for security
  const randomBuffer = new Uint32Array(1);
  crypto.getRandomValues(randomBuffer);
  // Convert to a value between 0 and 1 (divide by max uint32 value)
  const randomValue = (randomBuffer[0] ?? 0) / 0xFFFFFFFF;
  const jitter = minMs + randomValue * (maxMs - minMs);
  await new Promise(resolve => setTimeout(resolve, jitter));
}

/**
 * Generate a random delay for failed authentication
 * Helps prevent enumeration and brute-force attacks
 */
export async function addAuthenticationDelay(failedAttempts: number): Promise<void> {
  const baseDelay = 1000; // 1 second base
  const maxDelay = 10000; // 10 seconds max
  const delay = Math.min(baseDelay * Math.pow(2, failedAttempts - 1), maxDelay);

  await new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================================================
// Security Event Logging
// ============================================================================

export interface SecurityEvent {
  type: 'rate_limit' | 'weak_password' | 'invalid_code' | 'failed_auth' | 'enumeration_attempt';
  severity: 'info' | 'warning' | 'error';
  deviceId: string;
  roomCode?: string;
  details: any;
  timestamp: number;
}

/**
 * Log security event for monitoring and alerting
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: Date.now(),
  };

  secureLog.warn('[RoomSecurity] Security event:', {
    type: fullEvent.type,
    severity: fullEvent.severity,
    deviceId: fullEvent.deviceId.substring(0, 8) + '...',
    roomCode: fullEvent.roomCode,
  });

  // In production, send to monitoring system
  // Example: sendToSentryOrDatadog(fullEvent);
}

// ============================================================================
// Export
// ============================================================================

export const RoomSecurity = {
  validateRoomCode,
  generateSecureRoomCode,
  validatePasswordStrength,
  hashRoomPassword,
  verifyRoomPassword,
  checkRoomCreationLimit,
  checkRoomJoinLimit,
  checkPasswordAttemptLimit,
  recordFailedPasswordAttempt,
  resetRateLimit,
  addTimingJitter,
  addAuthenticationDelay,
  logSecurityEvent,
};

export default RoomSecurity;
