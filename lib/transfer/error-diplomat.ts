/**
 * Error Diplomat -- Error Classification & Recovery System
 *
 * Classifies errors into actionable categories with user-friendly messages,
 * recovery options, and retry policies. Used by all route-level error
 * boundaries and the shared RouteErrorFallback component.
 *
 * @module lib/transfer/error-diplomat
 */

// ============================================================================
// ERROR KINDS
// ============================================================================

/**
 * The five error categories that cover all failure modes in Tallow.
 *
 * - network:    Connection lost, timeout, WebRTC/ICE failures
 * - crypto:     Encryption, decryption, signature, PQC verification failures
 * - transfer:   File I/O, chunk processing, upload/download interruptions
 * - permission: Camera, Bluetooth, file system, notification access denied
 * - unknown:    Anything that does not match the above categories
 */
export type ErrorKind =
  | 'network'
  | 'crypto'
  | 'transfer'
  | 'permission'
  | 'unknown';

/** @deprecated Use ErrorKind instead. Kept for backward compatibility. */
export type TransferErrorKind = 'crypto' | 'network' | 'file' | 'generic';

// ============================================================================
// RESOLUTION TYPES
// ============================================================================

/** The action buttons available for error recovery. */
export type RecoveryAction = 'retry' | 'resume' | 'reconnect' | 'request-permission' | 'report' | 'go-home';

/** Retry policy for transient (auto-retryable) errors. */
export interface RetryPolicy {
  /** Maximum number of automatic retry attempts. */
  maxAttempts: number;
  /** Initial delay in milliseconds before the first retry. */
  initialDelayMs: number;
  /** Multiplier applied after each failed attempt (exponential backoff). */
  backoffMultiplier: number;
  /** Hard ceiling for delay between retries. */
  maxDelayMs: number;
}

/** Full resolution payload returned by classifyError. */
export interface ErrorResolution {
  /** Which category this error falls into. */
  kind: ErrorKind;
  /** A plain-language message answering "What happened?" */
  headline: string;
  /** A plain-language message answering "What can I do?" */
  guidance: string;
  /** Whether the error is likely transient and worth auto-retrying. */
  retryable: boolean;
  /** Ordered list of recovery actions to show the user. */
  actions: RecoveryAction[];
  /** Retry policy (only meaningful when retryable is true). */
  retryPolicy: RetryPolicy;
  /** Semantic color token name for the error icon. */
  iconVariant: 'warning' | 'error' | 'lock' | 'wifi' | 'shield';
}

/** @deprecated Use ErrorResolution instead. Kept for backward compatibility. */
export interface TransferErrorResolution {
  kind: TransferErrorKind;
  message: string;
  retryable: boolean;
}

// ============================================================================
// MARKER DICTIONARIES
// ============================================================================

const NETWORK_MARKERS = [
  'network',
  'connection',
  'timeout',
  'timed out',
  'webrtc',
  'ice',
  'stun',
  'turn',
  'offline',
  'unreachable',
  'dns',
  'socket',
  'econnrefused',
  'econnreset',
  'enotfound',
  'fetch failed',
  'load failed',
  'failed to fetch',
  'abort',
  'net::err',
  'networkerror',
] as const;

const CRYPTO_MARKERS = [
  'crypto',
  'decrypt',
  'encrypt',
  'signature',
  'pqc',
  'kyber',
  'verification failed',
  'ratchet',
  'secure channel',
  'handshake',
  'certificate',
  'integrity',
  'hmac',
  'digest mismatch',
  'key exchange',
  'ml-kem',
] as const;

const TRANSFER_MARKERS = [
  'file',
  'blob',
  'chunk',
  'upload',
  'download',
  'transfer',
  'read error',
  'write error',
  'disk full',
  'quota',
  'storage',
  'stream',
  'corrupt',
  'checksum',
  'too large',
  'size limit',
] as const;

const PERMISSION_MARKERS = [
  'permission',
  'not allowed',
  'denied',
  'notallowederror',
  'securityerror',
  'camera',
  'microphone',
  'bluetooth',
  'geolocation',
  'notification',
  'clipboard',
  'screen capture',
  'user gesture',
  'blocked',
] as const;

// ============================================================================
// DEFAULT RETRY POLICIES
// ============================================================================

const TRANSIENT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelayMs: 1_000,
  backoffMultiplier: 2,
  maxDelayMs: 8_000,
};

const NO_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 0,
  initialDelayMs: 0,
  backoffMultiplier: 1,
  maxDelayMs: 0,
};

// ============================================================================
// CLASSIFICATION ENGINE
// ============================================================================

function includesAnyMarker(
  normalized: string,
  markers: readonly string[],
): boolean {
  return markers.some((marker) => normalized.includes(marker));
}

/**
 * Classify any error into an actionable ErrorResolution.
 *
 * This is the primary API. Every route-level error boundary calls this to
 * determine the headline, guidance, retry policy, and available actions.
 */
export function classifyError(
  error: Error | string | null | undefined,
): ErrorResolution {
  const rawMessage =
    typeof error === 'string'
      ? error
      : error?.message ?? '';
  const normalized = rawMessage.toLowerCase().trim();

  // -- Network errors: transient, auto-retryable --
  if (includesAnyMarker(normalized, NETWORK_MARKERS)) {
    return {
      kind: 'network',
      headline: 'Connection lost',
      guidance:
        'Your network connection was interrupted. We will retry automatically, or you can try again manually.',
      retryable: true,
      actions: ['retry', 'go-home'],
      retryPolicy: TRANSIENT_RETRY_POLICY,
      iconVariant: 'wifi',
    };
  }

  // -- Crypto errors: NOT auto-retryable, require reconnect --
  if (includesAnyMarker(normalized, CRYPTO_MARKERS)) {
    return {
      kind: 'crypto',
      headline: 'Security verification failed',
      guidance:
        'The secure connection could not be verified. Please reconnect and confirm the security code with your peer.',
      retryable: false,
      actions: ['reconnect', 'report', 'go-home'],
      retryPolicy: NO_RETRY_POLICY,
      iconVariant: 'lock',
    };
  }

  // -- Permission errors: NOT auto-retryable, require user action --
  if (includesAnyMarker(normalized, PERMISSION_MARKERS)) {
    return {
      kind: 'permission',
      headline: 'Permission needed',
      guidance:
        'This feature requires access that your browser has blocked. Please allow the requested permission and try again.',
      retryable: false,
      actions: ['request-permission', 'retry', 'go-home'],
      retryPolicy: NO_RETRY_POLICY,
      iconVariant: 'shield',
    };
  }

  // -- Transfer / file errors: retryable --
  if (includesAnyMarker(normalized, TRANSFER_MARKERS)) {
    return {
      kind: 'transfer',
      headline: 'Transfer interrupted',
      guidance:
        'The file transfer was interrupted. Your data is safe. You can resume where you left off or restart the transfer.',
      retryable: true,
      actions: ['resume', 'retry', 'go-home'],
      retryPolicy: TRANSIENT_RETRY_POLICY,
      iconVariant: 'warning',
    };
  }

  // -- Unknown / catch-all --
  return {
    kind: 'unknown',
    headline: 'Something unexpected happened',
    guidance:
      'An unexpected error occurred. You can try again, or copy the error details and send them to our team.',
    retryable: true,
    actions: ['retry', 'report', 'go-home'],
    retryPolicy: {
      ...TRANSIENT_RETRY_POLICY,
      maxAttempts: 1,
    },
    iconVariant: 'error',
  };
}

// ============================================================================
// EXPONENTIAL BACKOFF HELPER
// ============================================================================

/**
 * Calculate the delay for a given retry attempt using the provided policy.
 *
 * @param attempt  Zero-based attempt index (0 = first retry).
 * @param policy   Retry policy with backoff parameters.
 * @returns Delay in milliseconds, capped at policy.maxDelayMs.
 */
export function getRetryDelay(attempt: number, policy: RetryPolicy): number {
  const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
  return Math.min(delay, policy.maxDelayMs);
}

// ============================================================================
// ERROR REPORT BUILDER
// ============================================================================

export interface ErrorReport {
  kind: ErrorKind;
  headline: string;
  message: string;
  stack: string | undefined;
  digest: string | undefined;
  url: string;
  timestamp: string;
  userAgent: string;
}

/**
 * Build a structured, copyable error report for bug reporting.
 *
 * The report deliberately omits PII. The user can paste it into a GitHub
 * issue or support channel.
 */
export function buildErrorReport(
  error: Error & { digest?: string },
  resolution: ErrorResolution,
): ErrorReport {
  return {
    kind: resolution.kind,
    headline: resolution.headline,
    message: sanitizeMessage(error.message),
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    digest: error.digest,
    url: typeof window !== 'undefined' ? window.location.href : '',
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

/**
 * Format an ErrorReport as a human-readable string for clipboard.
 */
export function formatReportForClipboard(report: ErrorReport): string {
  const lines: string[] = [
    `--- Tallow Error Report ---`,
    `Category: ${report.kind}`,
    `Summary:  ${report.headline}`,
    `Message:  ${report.message}`,
    `Page:     ${report.url}`,
    `Time:     ${report.timestamp}`,
    `Browser:  ${report.userAgent}`,
  ];

  if (report.digest) {
    lines.push(`Digest:   ${report.digest}`);
  }

  if (report.stack) {
    lines.push('', 'Stack Trace:', report.stack);
  }

  lines.push('--- End Report ---');
  return lines.join('\n');
}

// ============================================================================
// BACKWARD-COMPATIBLE LEGACY API
// ============================================================================

/**
 * @deprecated Use classifyError() instead. This function is preserved so that
 * existing callers and tests continue to work without changes.
 */
export function classifyTransferError(
  rawMessage: string | null | undefined,
): TransferErrorResolution {
  const fallbackMessage = 'Something went wrong during transfer. Please retry.';
  const normalized = (rawMessage ?? '').trim();

  if (!normalized) {
    return { kind: 'generic', message: fallbackMessage, retryable: true };
  }

  if (includesAnyMarker(normalized.toLowerCase(), CRYPTO_MARKERS)) {
    return {
      kind: 'crypto',
      message:
        'Connection not secure. Reconnect and verify the security code before retrying.',
      retryable: false,
    };
  }

  if (includesAnyMarker(normalized.toLowerCase(), NETWORK_MARKERS)) {
    return {
      kind: 'network',
      message: 'Network connection problem. Check your connection and retry.',
      retryable: true,
    };
  }

  if (includesAnyMarker(normalized.toLowerCase(), TRANSFER_MARKERS)) {
    return {
      kind: 'file',
      message:
        'File processing error. Check file access, size, and format, then retry.',
      retryable: true,
    };
  }

  const singleLineMessage = normalized.split('\n')[0]?.trim() ?? '';
  return {
    kind: 'generic',
    message: singleLineMessage || fallbackMessage,
    retryable: true,
  };
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/** Strip file paths and limit length for display. */
function sanitizeMessage(message: string): string {
  let sanitized = message.split('\n')[0] ?? message;
  // Remove Windows file paths
  sanitized = sanitized.replace(/[A-Z]:\\[^\s"']+/gi, '[path]');
  // Remove Unix file paths
  sanitized = sanitized.replace(/\/[^\s"']+\//g, '[path]');
  // Cap length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + '...';
  }
  return sanitized;
}
