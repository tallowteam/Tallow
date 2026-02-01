'use client';

/**
 * Timing-Safe Comparison Utilities
 * Prevents timing attacks by ensuring constant-time operations
 *
 * SECURITY: Prevents attackers from using timing side-channels to extract secrets
 */

/**
 * Constant-time comparison of two Uint8Arrays
 * Prevents timing attacks by ensuring the comparison takes the same time
 * regardless of where the first difference occurs
 *
 * @param a - First buffer
 * @param b - Second buffer
 * @returns true if buffers are equal, false otherwise
 */
export function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (!a || !b) {
    // Still constant-time: always return false for null/undefined
    return false;
  }

  // SECURITY FIX: Pad to same length to prevent length-based timing attacks
  // This ensures comparison takes constant time regardless of input lengths
  const maxLength = Math.max(a.length, b.length);

  // Create padded versions (pad with zeros)
  const paddedA = new Uint8Array(maxLength);
  const paddedB = new Uint8Array(maxLength);
  paddedA.set(a);
  paddedB.set(b);

  let result = 0;

  // Also XOR the length difference to catch length mismatches
  // without revealing which is longer
  result |= a.length ^ b.length;

  // XOR all bytes - result will be 0 only if all bytes match
  // This takes the same time regardless of where differences occur
  for (let i = 0; i < maxLength; i++) {
    const aVal = paddedA[i];
    const bVal = paddedB[i];
    if (aVal !== undefined && bVal !== undefined) {
      result |= aVal ^ bVal;
    }
  }

  // Convert to boolean: 0 = equal, non-zero = not equal
  return result === 0;
}

/**
 * Constant-time string comparison
 * Converts strings to buffers and performs constant-time comparison
 *
 * IMPORTANT: JavaScript string operations are NOT constant-time.
 * This function reduces but doesn't eliminate all timing channels.
 *
 * @param a - First string
 * @param b - Second string
 * @returns true if strings are equal
 */
export function timingSafeStringCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  // Convert to UTF-8 buffers for byte-level comparison
  const encoder = new TextEncoder();
  const bufferA = encoder.encode(a);
  const bufferB = encoder.encode(b);

  return timingSafeEqual(bufferA, bufferB);
}

/**
 * Constant-time HMAC verification
 * Verifies that a computed HMAC matches an expected HMAC
 *
 * @param expected - Expected HMAC (from trusted source)
 * @param actual - Computed HMAC (from untrusted data)
 * @returns true if HMACs match
 */
export function timingSafeHMACVerify(
  expected: Uint8Array,
  actual: Uint8Array
): boolean {
  return timingSafeEqual(expected, actual);
}

/**
 * Constant-time token comparison
 * Compares authentication tokens without leaking timing information
 *
 * @param expectedToken - Expected token (from session/database)
 * @param providedToken - Provided token (from user request)
 * @returns true if tokens match
 */
export function timingSafeTokenCompare(
  expectedToken: string,
  providedToken: string
): boolean {
  return timingSafeStringCompare(expectedToken, providedToken);
}

/**
 * Constant-time hash comparison
 * Compares hash digests (SHA-256, etc.) in constant time
 *
 * @param hashA - First hash
 * @param hashB - Second hash
 * @returns true if hashes match
 */
export function timingSafeHashCompare(
  hashA: Uint8Array,
  hashB: Uint8Array
): boolean {
  return timingSafeEqual(hashA, hashB);
}

/**
 * Constant-time prefix check
 * Checks if a buffer starts with a specific prefix
 *
 * IMPORTANT: This reveals the prefix length, so only use for public prefixes
 *
 * @param buffer - Buffer to check
 * @param prefix - Prefix to look for
 * @returns true if buffer starts with prefix
 */
export function timingSafePrefixCheck(
  buffer: Uint8Array,
  prefix: Uint8Array
): boolean {
  if (!buffer || !prefix) {return false;}
  if (buffer.length < prefix.length) {return false;}

  // Extract prefix portion and compare
  const bufferPrefix = buffer.slice(0, prefix.length);
  return timingSafeEqual(bufferPrefix, prefix);
}

/**
 * Constant-time array index lookup
 * Returns whether an index is valid without leaking timing info
 *
 * @param array - Array to check
 * @param index - Index to validate
 * @returns true if index is valid
 */
export function timingSafeIndexCheck<T>(array: T[], index: number): boolean {
  if (!Array.isArray(array)) {return false;}
  if (typeof index !== 'number') {return false;}
  if (!Number.isInteger(index)) {return false;}

  // Constant-time: check both bounds in same time
  const inBounds = index >= 0 && index < array.length;
  return inBounds;
}

/**
 * Timing-safe comparison with automatic type detection
 * Convenience function that detects input types and uses appropriate comparison
 *
 * @param a - First value (string or Uint8Array)
 * @param b - Second value (string or Uint8Array)
 * @returns true if values are equal
 */
export function timingSafeCompare(
  a: string | Uint8Array,
  b: string | Uint8Array
): boolean {
  // Type check - both must be same type
  if (typeof a !== typeof b) {
    return false;
  }

  if (typeof a === 'string' && typeof b === 'string') {
    return timingSafeStringCompare(a, b);
  }

  if (a instanceof Uint8Array && b instanceof Uint8Array) {
    return timingSafeEqual(a, b);
  }

  return false;
}

/**
 * Create a timing-safe validator function
 * Returns a reusable validator for a specific expected value
 *
 * Usage:
 * ```ts
 * const validator = createTimingSafeValidator(expectedToken);
 * if (validator(userProvidedToken)) {
 *   // Token is valid
 * }
 * ```
 */
export function createTimingSafeValidator(
  expected: string | Uint8Array
): (value: string | Uint8Array) => boolean {
  return (value: string | Uint8Array): boolean => {
    return timingSafeCompare(expected, value);
  };
}

/**
 * Timing-safe authentication checker
 * Validates credentials without leaking timing information about validity
 *
 * @param credentials - Object containing credential fields
 * @param expectedCredentials - Expected credential values
 * @returns true if all credentials match
 */
export function timingSafeAuthCheck(
  credentials: Record<string, string>,
  expectedCredentials: Record<string, string>
): boolean {
  if (!credentials || !expectedCredentials) {return false;}

  const keys = Object.keys(expectedCredentials);
  let allMatch = true;

  // Check all fields even if one fails (constant-time)
  for (const key of keys) {
    const provided = credentials[key];
    const expected = expectedCredentials[key];

    // Always perform comparison even if previous failed
    const matches = timingSafeStringCompare(
      provided || '',
      expected || ''
    );

    allMatch = allMatch && matches;
  }

  return allMatch;
}

/**
 * Timing-safe rate limit token verification
 * Prevents timing attacks on rate limit bypass attempts
 *
 * @param token - User-provided token
 * @param validTokens - Array of valid tokens
 * @returns true if token is in valid set
 */
export function timingSafeTokenLookup(
  token: string,
  validTokens: string[]
): boolean {
  if (!token || !Array.isArray(validTokens)) {return false;}

  let found = false;

  // Check against ALL tokens (don't short-circuit on match)
  // This prevents timing attacks that could narrow down valid tokens
  for (const validToken of validTokens) {
    const matches = timingSafeStringCompare(token, validToken);
    found = found || matches;
  }

  return found;
}

/**
 * Delay execution to mask timing variations
 * Adds random jitter to prevent timing analysis
 *
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 */
export async function timingSafeDelay(
  minMs: number = 0,
  maxMs: number = 0
): Promise<void> {
  if (minMs < 0 || maxMs < minMs) {
    throw new Error('Invalid delay parameters');
  }

  const delay = minMs + Math.random() * (maxMs - minMs);
  await new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Timing-safe operation wrapper
 * Ensures an operation takes a minimum amount of time
 * Useful for login/authentication to prevent timing attacks
 *
 * @param operation - Async operation to execute
 * @param minDurationMs - Minimum duration in milliseconds
 * @returns Result of the operation
 */
export async function timingSafeOperation<T>(
  operation: () => Promise<T>,
  minDurationMs: number = 100
): Promise<T> {
  const startTime = performance.now();

  const result = await operation();

  const elapsed = performance.now() - startTime;
  const remaining = Math.max(0, minDurationMs - elapsed);

  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  return result;
}

/**
 * Export all utilities as a namespace
 */
export const timingSafe = {
  equal: timingSafeEqual,
  stringCompare: timingSafeStringCompare,
  hmacVerify: timingSafeHMACVerify,
  tokenCompare: timingSafeTokenCompare,
  hashCompare: timingSafeHashCompare,
  prefixCheck: timingSafePrefixCheck,
  indexCheck: timingSafeIndexCheck,
  compare: timingSafeCompare,
  createValidator: createTimingSafeValidator,
  authCheck: timingSafeAuthCheck,
  tokenLookup: timingSafeTokenLookup,
  delay: timingSafeDelay,
  operation: timingSafeOperation,
};

export default timingSafe;
