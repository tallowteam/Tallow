'use client';

/**
 * Symmetric cipher runtime selection.
 *
 * Priority contract (when auto-selecting):
 * 1. AEGIS-256 when explicitly enabled AND AES-NI hardware is likely available.
 *    AEGIS-256 is the fastest AEAD on AES-NI hardware but is NOT a NIST/FIPS
 *    approved algorithm, so it is gated behind an opt-in flag.
 * 2. AES-256-GCM as the default universal baseline (FIPS 140-3 compliant).
 * 3. ChaCha20-Poly1305 as the constant-time software fallback.
 *
 * Negotiation contract (for handshake):
 *   Both peers advertise their supported ciphers in preference order.
 *   The first cipher that appears in BOTH lists wins.
 *   If no overlap exists the handshake MUST fail -- never silently downgrade.
 */

export type SymmetricCipherAlgorithm = 'AEGIS-256' | 'AES-256-GCM' | 'CHACHA20-POLY1305';

export interface CipherSelectionOptions {
  /** When true, restrict to NIST-approved ciphers only (AES-256-GCM). */
  fipsMode?: boolean;
  /** Prefer AEGIS-256 when hardware hints suggest AES-NI is available. */
  preferAegis?: boolean;
  /** Allow AEGIS-256 at all (even if not preferred). Defaults to true. */
  allowAegis?: boolean;
  /** Prefer ChaCha20-Poly1305 over AES-256-GCM (useful for ARM without AES extensions). */
  preferChaCha?: boolean;
}

/**
 * Global priority order. AEGIS-256 is fastest on AES-NI hardware,
 * AES-256-GCM is the universal standard, ChaCha20 is the safe software fallback.
 */
export const CIPHER_SELECTION_PRIORITY: readonly SymmetricCipherAlgorithm[] = [
  'AEGIS-256',
  'AES-256-GCM',
  'CHACHA20-POLY1305',
] as const;

/** Nonce sizes in bytes for each cipher. */
export const CIPHER_NONCE_SIZES: Readonly<Record<SymmetricCipherAlgorithm, number>> = {
  'AES-256-GCM': 12,
  'CHACHA20-POLY1305': 12,
  'AEGIS-256': 32,
} as const;

/** Auth tag sizes in bytes for each cipher. */
export const CIPHER_TAG_SIZES: Readonly<Record<SymmetricCipherAlgorithm, number>> = {
  'AES-256-GCM': 16,
  'CHACHA20-POLY1305': 16,
  'AEGIS-256': 16,
} as const;

/** Key sizes in bytes for each cipher. */
export const CIPHER_KEY_SIZES: Readonly<Record<SymmetricCipherAlgorithm, number>> = {
  'AES-256-GCM': 32,
  'CHACHA20-POLY1305': 32,
  'AEGIS-256': 32,
} as const;

/**
 * Returns true if the cipher is approved for use in FIPS 140-3 mode.
 *
 * NIST FIPS 140-3 approved AEAD: AES-GCM only.
 * ChaCha20-Poly1305 is NOT NIST-approved (it is an IETF standard, RFC 8439).
 * AEGIS-256 is NOT NIST-approved (it is an IETF standard, RFC 9312).
 */
export function isCipherAllowedInFips(cipher: SymmetricCipherAlgorithm): boolean {
  return cipher === 'AES-256-GCM';
}

/**
 * Detect whether the WebCrypto API supports AES-GCM operations.
 */
function supportsAesGcmWebCrypto(): boolean {
  return (
    typeof crypto !== 'undefined' &&
    typeof crypto.subtle !== 'undefined' &&
    typeof crypto.subtle.importKey === 'function' &&
    typeof crypto.subtle.encrypt === 'function' &&
    typeof crypto.subtle.decrypt === 'function'
  );
}

/**
 * Heuristic: Does this CPU likely have AES-NI (or ARM AES extensions)?
 *
 * This cannot be detected with certainty from JavaScript. We use:
 * - Environment variable override (for CI/testing).
 * - User-agent sniffing for x86-64 (nearly all x86-64 CPUs since 2010 have AES-NI).
 * - Server-side Node.js: assume true (most server CPUs have AES-NI).
 *
 * When detection is inconclusive, we return false to be conservative.
 */
function hasAesNiHint(): boolean {
  const override = typeof process !== 'undefined'
    ? process.env?.NEXT_PUBLIC_TALLOW_FORCE_AES_NI
    : undefined;

  if (override === 'true') return true;
  if (override === 'false') return false;

  // Server-side: assume modern CPU with AES-NI.
  if (typeof navigator === 'undefined') return true;

  // Client-side: check user-agent for x86-64 or known AES-capable architectures.
  const ua = navigator.userAgent;
  if (/x86_64|x64|win64|amd64|intel/i.test(ua)) return true;

  // ARM with AES extensions is common on Apple Silicon and modern Android.
  // Detect Apple Silicon Macs and recent iOS devices.
  if (/Mac OS X.*ARM|iPhone|iPad/i.test(ua)) return true;

  return false;
}

/**
 * Returns the list of ciphers this runtime can support, in preference order.
 * Used during handshake to advertise capabilities.
 */
export function getSupportedCiphers(
  options: CipherSelectionOptions = {}
): SymmetricCipherAlgorithm[] {
  const fipsMode = options.fipsMode ??
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_TALLOW_FIPS_MODE === 'true'
      : false);
  const allowAegis = options.allowAegis ?? true;

  const supported: SymmetricCipherAlgorithm[] = [];

  // AEGIS-256 is always "available" (we have a pure-JS implementation),
  // but we only advertise it when allowed and hardware is favorable.
  if (!fipsMode && allowAegis && hasAesNiHint()) {
    supported.push('AEGIS-256');
  }

  // AES-256-GCM requires WebCrypto API.
  if (supportsAesGcmWebCrypto()) {
    supported.push('AES-256-GCM');
  }

  // ChaCha20-Poly1305 is always available (pure JS via @noble/ciphers).
  if (!fipsMode) {
    supported.push('CHACHA20-POLY1305');
  }

  // If FIPS mode and no WebCrypto (very unlikely), we have no ciphers.
  // In that case, AES-256-GCM still goes in -- the encrypt call will fail
  // at runtime which is the correct behavior (fail-closed).
  if (supported.length === 0) {
    supported.push('AES-256-GCM');
  }

  return supported;
}

/**
 * Select the best symmetric cipher for this runtime environment.
 *
 * Selection logic:
 * 1. FIPS mode -> AES-256-GCM (only NIST-approved option).
 * 2. preferAegis + allowAegis + AES-NI hint -> AEGIS-256.
 * 3. WebCrypto available + no ChaCha preference -> AES-256-GCM.
 * 4. preferChaCha or no WebCrypto -> ChaCha20-Poly1305.
 * 5. Inconclusive hardware detection -> ChaCha20-Poly1305 (safe fallback).
 */
export function selectSymmetricCipher(
  options: CipherSelectionOptions = {}
): SymmetricCipherAlgorithm {
  const fipsMode = options.fipsMode ??
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_TALLOW_FIPS_MODE === 'true'
      : false);
  const preferAegis = options.preferAegis ??
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_TALLOW_PREFER_AEGIS_256 === 'true'
      : false);
  const allowAegis = options.allowAegis ?? true;
  const preferChaCha = options.preferChaCha ??
    (typeof process !== 'undefined'
      ? process.env?.NEXT_PUBLIC_TALLOW_PREFER_CHACHA20 === 'true'
      : false);

  // FIPS mode: AES-256-GCM is the only approved cipher.
  if (fipsMode) {
    return 'AES-256-GCM';
  }

  // AEGIS-256: fastest on AES-NI hardware, but must be explicitly preferred.
  if (preferAegis && allowAegis && hasAesNiHint()) {
    return 'AEGIS-256';
  }

  // AES-256-GCM: universal default when WebCrypto is available.
  if (supportsAesGcmWebCrypto() && !preferChaCha) {
    return 'AES-256-GCM';
  }

  // ChaCha20-Poly1305: safe constant-time software fallback.
  return 'CHACHA20-POLY1305';
}

/**
 * Negotiate a cipher between two peers during handshake.
 *
 * Both peers provide their supported ciphers in preference order.
 * The initiator's preference takes priority (first match wins).
 *
 * Returns null if no common cipher is found -- the handshake MUST fail.
 * Callers must NOT fall back to an unauthenticated or weaker mode.
 */
export function negotiateCipher(
  initiatorCiphers: readonly SymmetricCipherAlgorithm[],
  responderCiphers: readonly SymmetricCipherAlgorithm[]
): SymmetricCipherAlgorithm | null {
  const responderSet = new Set(responderCiphers);

  for (const cipher of initiatorCiphers) {
    if (responderSet.has(cipher)) {
      return cipher;
    }
  }

  return null;
}

/**
 * Validate that a cipher string is a known algorithm.
 * Useful for parsing wire protocol messages.
 */
export function isValidCipherAlgorithm(value: string): value is SymmetricCipherAlgorithm {
  return value === 'AEGIS-256' || value === 'AES-256-GCM' || value === 'CHACHA20-POLY1305';
}
