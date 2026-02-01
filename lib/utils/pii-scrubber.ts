/**
 * PII Scrubbing Utilities
 * Removes sensitive information before sending to external services
 */

/**
 * Scrub file paths (Windows and Unix)
 * Replaces user directories and file paths with safe placeholders
 */
export function scrubFilePath(text: string): string {
  return text
    // Windows user directories
    .replace(/[A-Z]:\\Users\\[^\\]+/gi, '<USER_DIR>')
    // Linux home directories
    .replace(/\/home\/[^/]+/gi, '<USER_DIR>')
    // macOS user directories
    .replace(/\/Users\/[^/]+/gi, '<USER_DIR>')
    // Remaining Windows paths
    .replace(/[A-Z]:\\[^\s"']+/gi, '<PATH>')
    // Unix absolute paths (be careful not to replace protocol slashes)
    .replace(/(?<![a-z]:)\/(?:var|tmp|opt|etc|usr|private)[^\s"']*/gi, '<PATH>');
}

/**
 * Scrub email addresses
 * Replaces email patterns with placeholder
 */
export function scrubEmail(text: string): string {
  return text.replace(/\b[\w.-]+@[\w.-]+\.\w+\b/gi, '<EMAIL>');
}

/**
 * Scrub IP addresses (both IPv4 and IPv6)
 */
export function scrubIP(text: string): string {
  return text
    // IPv4 addresses
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<IP>')
    // IPv6 addresses (full form)
    .replace(/([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}/gi, '<IPV6>')
    // IPv6 addresses (compressed form with ::)
    .replace(/([0-9a-f]{1,4}:){1,7}:/gi, '<IPV6>')
    .replace(/:([0-9a-f]{1,4}:){1,7}/gi, '<IPV6>')
    .replace(/([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}/gi, '<IPV6>');
}

/**
 * Scrub phone numbers (various formats)
 */
export function scrubPhoneNumber(text: string): string {
  return text
    // International format: +1-234-567-8900
    .replace(/\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '<PHONE>')
    // Simple 10-digit format
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '<PHONE>');
}

/**
 * Scrub credit card numbers
 */
export function scrubCreditCard(text: string): string {
  // Match 13-19 digit card numbers with optional separators
  return text.replace(/\b(?:\d{4}[-\s]?){3,4}\d{1,4}\b/g, '<CARD>');
}

/**
 * Scrub Social Security Numbers (US)
 */
export function scrubSSN(text: string): string {
  return text.replace(/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g, '<SSN>');
}

/**
 * Scrub API keys and tokens (common patterns)
 */
export function scrubApiKeys(text: string): string {
  return text
    // Bearer tokens
    .replace(/Bearer\s+[A-Za-z0-9\-_=]+/gi, 'Bearer <TOKEN>')
    // API keys in common formats
    .replace(/(?:api[_-]?key|apikey|api_secret|secret_key|access_token|auth_token)["']?\s*[:=]\s*["']?[A-Za-z0-9\-_=]+["']?/gi, '<API_KEY>')
    // Generic long alphanumeric strings that look like tokens (32+ chars)
    .replace(/\b[A-Za-z0-9]{32,}\b/g, '<TOKEN>');
}

/**
 * Scrub UUIDs (could identify users/sessions)
 */
export function scrubUUID(text: string): string {
  return text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
    '<UUID>'
  );
}

/**
 * Scrub usernames from common patterns
 */
export function scrubUsername(text: string): string {
  return text
    // @mentions
    .replace(/@[A-Za-z0-9_-]+/g, '@<USER>')
    // Common username patterns in URLs
    .replace(/\/users?\/[^/\s]+/gi, '/user/<USER>')
    .replace(/\/profiles?\/[^/\s]+/gi, '/profile/<USER>');
}

/**
 * Comprehensive PII scrubbing - applies all scrubbers
 * Order matters: more specific patterns should be processed first
 */
export function scrubPII(text: string): string {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let scrubbed = text;

  // Apply scrubbers in order from most specific to least specific
  scrubbed = scrubCreditCard(scrubbed);
  scrubbed = scrubSSN(scrubbed);
  scrubbed = scrubApiKeys(scrubbed);
  scrubbed = scrubUUID(scrubbed);
  scrubbed = scrubEmail(scrubbed);
  scrubbed = scrubPhoneNumber(scrubbed);
  scrubbed = scrubIP(scrubbed);
  scrubbed = scrubFilePath(scrubbed);
  scrubbed = scrubUsername(scrubbed);

  return scrubbed;
}

/**
 * Scrub PII from an Error object
 * Returns a new error with scrubbed message and stack trace
 */
export function scrubErrorPII(error: Error): Error {
  const scrubbedError = new Error(scrubPII(error.message));
  scrubbedError.name = error.name;

  if (error.stack) {
    scrubbedError.stack = scrubPII(error.stack);
  }

  return scrubbedError;
}

/**
 * Scrub PII from an object recursively
 * Useful for scrubbing context objects sent with errors
 */
export function scrubObjectPII<T extends Record<string, unknown>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const scrubbed: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      scrubbed[key] = scrubPII(value);
    } else if (Array.isArray(value)) {
      scrubbed[key] = value.map((item) =>
        typeof item === 'string'
          ? scrubPII(item)
          : typeof item === 'object' && item !== null
            ? scrubObjectPII(item as Record<string, unknown>)
            : item
      );
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubObjectPII(value as Record<string, unknown>);
    } else {
      scrubbed[key] = value;
    }
  }

  return scrubbed as T;
}

/**
 * Hash user identifier for tracking without PII
 * Uses SHA-256 and returns first 16 characters
 */
export async function hashUserId(userId: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(userId);

  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hash));

  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16);
}

/**
 * Synchronous hash using a simple but consistent algorithm
 * Use when async is not possible (e.g., in beforeSend callbacks)
 */
export function hashUserIdSync(userId: string): string {
  // Simple FNV-1a hash for synchronous use
  let hash = 2166136261;
  for (let i = 0; i < userId.length; i++) {
    hash ^= userId.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  // Convert to hex and ensure consistent length
  const hashStr = (hash >>> 0).toString(16).padStart(8, '0');
  return hashStr + hashStr; // Return 16 chars for consistency with async version
}

/**
 * Check if a string likely contains PII
 * Useful for validation before sending data
 */
export function containsPII(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }

  // Check for email
  if (/\b[\w.-]+@[\w.-]+\.\w+\b/i.test(text)) {
    return true;
  }

  // Check for IP addresses
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(text)) {
    return true;
  }

  // Check for credit card patterns
  if (/\b(?:\d{4}[-\s]?){3}\d{4}\b/.test(text)) {
    return true;
  }

  // Check for SSN pattern
  if (/\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/.test(text)) {
    return true;
  }

  // Check for file paths with usernames
  if (/[A-Z]:\\Users\\[^\\]+/i.test(text) || /\/(?:home|Users)\/[^/]+/i.test(text)) {
    return true;
  }

  return false;
}
