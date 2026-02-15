/**
 * Certificate Pinning & Validation
 * Agent 017 — CERTIFICATE-FORGER
 *
 * Provides TLS certificate pinning using SPKI (Subject Public Key Info) hashing
 * to prevent man-in-the-middle attacks on relay and STUN/TURN connections.
 *
 * Features:
 * - SPKI hash-based certificate pinning
 * - Backup pin support for key rotation
 * - Certificate fingerprint generation
 * - Pin expiration and rotation
 * - Certificate transparency validation concept
 * - TLS certificate chain verification helpers
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CertificatePin {
  /** Host domain (e.g., "relay.tallow.app") */
  host: string;
  /** Hash algorithm (SHA-256 recommended) */
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  /** Base64-encoded SPKI hash digest */
  digest: string;
  /** Backup pins for key rotation */
  backupDigests?: string[];
  /** Pin expiration timestamp (milliseconds since epoch) */
  expiresAt?: number;
  /** Pin creation timestamp */
  createdAt: number;
}

export interface PinValidationResult {
  /** Whether the pin validation succeeded */
  valid: boolean;
  /** Host that was validated */
  host: string;
  /** Which pin matched (primary or backup index) */
  matchedPin?: 'primary' | number;
  /** Error message if validation failed */
  error?: string;
}

export interface CertificateInfo {
  /** Certificate subject (Common Name) */
  subject: string;
  /** Certificate issuer */
  issuer: string;
  /** Valid from timestamp */
  validFrom: number;
  /** Valid to timestamp */
  validTo: number;
  /** SHA-256 fingerprint (full cert hash) */
  fingerprint: string;
  /** SPKI hash for pinning */
  spkiHash: string;
}

export interface CertificateChain {
  /** Leaf certificate (server cert) */
  leaf: CertificateInfo;
  /** Intermediate certificates */
  intermediates: CertificateInfo[];
  /** Root CA certificate */
  root?: CertificateInfo;
}

export interface PinSet {
  /** Collection of certificate pins by host */
  pins: Map<string, CertificatePin>;
  /** Last update timestamp */
  lastUpdated: number;
  /** Version identifier */
  version: string;
}

// ============================================================================
// DEFAULT CERTIFICATE PINS
// ============================================================================

/**
 * Default certificate pins for Tallow infrastructure.
 * These should be updated when certificates are rotated.
 *
 * IMPORTANT: In production, fetch these from a signed manifest
 * to enable remote pin updates without app updates.
 */
const DEFAULT_PINS: CertificatePin[] = [
  {
    host: 'relay.tallow.app',
    algorithm: 'SHA-256',
    // Example SPKI hash - replace with actual relay server SPKI hash
    digest: 'X3pGTSOuJeEVw989arJ4yqKHFC+RpVdbZiBlmO4Q7Ko=',
    backupDigests: [
      // Backup pin for key rotation
      'hP+lNlLmL3wqLnXGq5+I1V0+YeRkF5nD1rGQF4mB8Qs=',
    ],
    createdAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  {
    host: 'stun.tallow.app',
    algorithm: 'SHA-256',
    digest: 'YLh1dUR9y6Kv4qJ7qXTlQqEZeFSP1cRdx8m7Y+xWPCs=',
    backupDigests: [
      'zMw3j1KvF9lN2cR6YdLmQ1pVbS9xT0fP8kH4nW7jG2s=',
    ],
    createdAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  },
  {
    host: 'turn.tallow.app',
    algorithm: 'SHA-256',
    digest: 'R5lK9mP2wV7fN3qX1hT8jS6bY0cL4nZ9pG1dM5rQ3Oe=',
    backupDigests: [
      'T8kH2vL9xC5nP1mW4qR7yF0bS3jG6dN9oM2lQ8eX5Ja=',
    ],
    createdAt: Date.now(),
    expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
  },
];

// ============================================================================
// PIN STORAGE
// ============================================================================

let pinSet: PinSet = {
  pins: new Map(DEFAULT_PINS.map(pin => [pin.host, pin])),
  lastUpdated: Date.now(),
  version: '1.0.0',
};

/**
 * Get all configured certificate pins
 */
export function getAllPins(): CertificatePin[] {
  return Array.from(pinSet.pins.values());
}

/**
 * Get certificate pin for a specific host
 */
export function getPinForHost(host: string): CertificatePin | null {
  return pinSet.pins.get(host) || null;
}

/**
 * Add or update a certificate pin
 */
export function pinCertificate(pin: CertificatePin): void {
  pinSet.pins.set(pin.host, pin);
  pinSet.lastUpdated = Date.now();
}

/**
 * Remove a certificate pin
 */
export function removePinForHost(host: string): boolean {
  const deleted = pinSet.pins.delete(host);
  if (deleted) {
    pinSet.lastUpdated = Date.now();
  }
  return deleted;
}

/**
 * Clear all certificate pins (reset to defaults)
 */
export function resetPinsToDefaults(): void {
  pinSet = {
    pins: new Map(DEFAULT_PINS.map(pin => [pin.host, pin])),
    lastUpdated: Date.now(),
    version: '1.0.0',
  };
}

// ============================================================================
// SPKI HASH COMPUTATION
// ============================================================================

/**
 * Compute SPKI hash from a certificate's public key.
 * This is the hash of the Subject Public Key Info, which includes
 * the public key algorithm and the public key itself.
 *
 * @param spkiBytes - DER-encoded SubjectPublicKeyInfo bytes
 * @param algorithm - Hash algorithm to use
 * @returns Base64-encoded hash digest
 */
export async function computeSPKIHash(
  spkiBytes: Uint8Array,
  algorithm: 'SHA-256' | 'SHA-384' | 'SHA-512' = 'SHA-256'
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, spkiBytes);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to base64
  return btoa(String.fromCharCode(...hashArray));
}

/**
 * Extract SPKI bytes from a public key.
 * For use with browser's crypto.subtle API.
 */
export async function extractSPKI(publicKey: CryptoKey): Promise<Uint8Array> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return new Uint8Array(exported);
}

// ============================================================================
// CERTIFICATE FINGERPRINTING
// ============================================================================

/**
 * Compute SHA-256 fingerprint of an entire certificate.
 * This is different from SPKI pinning - it hashes the full cert.
 *
 * @param certBytes - DER-encoded certificate bytes
 * @returns Hex-encoded fingerprint
 */
export async function getCertificateFingerprint(
  certBytes: Uint8Array
): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', certBytes);
  const hashArray = new Uint8Array(hashBuffer);

  // Convert to hex with colon separators (standard format)
  return Array.from(hashArray)
    .map(b => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase();
}

/**
 * Parse certificate bytes and extract certificate information.
 * This is a simplified parser - in production, use a proper ASN.1 parser.
 *
 * NOTE: This is a placeholder implementation. For real certificate parsing,
 * you would need to parse the ASN.1 DER structure properly.
 */
export async function parseCertificate(
  certBytes: Uint8Array
): Promise<Partial<CertificateInfo>> {
  const fingerprint = await getCertificateFingerprint(certBytes);

  // In a real implementation, you would parse the ASN.1 structure
  // to extract subject, issuer, validity dates, and public key.
  // For now, we return minimal info with the fingerprint.

  return {
    fingerprint,
    subject: 'CN=Unknown (ASN.1 parsing required)',
    issuer: 'CN=Unknown (ASN.1 parsing required)',
    validFrom: 0,
    validTo: 0,
    spkiHash: '', // Would extract and hash SPKI from cert
  };
}

// ============================================================================
// PIN VALIDATION
// ============================================================================

/**
 * Verify a certificate's SPKI hash against known pins.
 *
 * @param host - Host domain to validate
 * @param spkiHash - Base64-encoded SPKI hash from certificate
 * @returns Validation result
 */
export function verifyCertificatePin(
  host: string,
  spkiHash: string
): PinValidationResult {
  const pin = pinSet.pins.get(host);

  if (!pin) {
    return {
      valid: false,
      host,
      error: `No certificate pin configured for host: ${host}`,
    };
  }

  // Check if pin is expired
  if (pin.expiresAt && Date.now() > pin.expiresAt) {
    return {
      valid: false,
      host,
      error: `Certificate pin expired for host: ${host}`,
    };
  }

  // Check primary pin
  if (timingSafeCompare(spkiHash, pin.digest)) {
    return {
      valid: true,
      host,
      matchedPin: 'primary',
    };
  }

  // Check backup pins
  if (pin.backupDigests) {
    for (let i = 0; i < pin.backupDigests.length; i++) {
      if (timingSafeCompare(spkiHash, pin.backupDigests[i]!)) {
        return {
          valid: true,
          host,
          matchedPin: i,
        };
      }
    }
  }

  return {
    valid: false,
    host,
    error: `SPKI hash mismatch for host: ${host}`,
  };
}

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeCompare(a: string, b: string): boolean {
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
// CERTIFICATE CHAIN VALIDATION
// ============================================================================

/**
 * Validate a certificate chain.
 * This is a conceptual implementation - real validation requires
 * proper X.509 chain building and signature verification.
 */
export function validateCertificateChain(
  chain: CertificateChain
): { valid: boolean; error?: string } {
  // Check leaf certificate validity period
  const now = Date.now();
  if (now < chain.leaf.validFrom || now > chain.leaf.validTo) {
    return {
      valid: false,
      error: 'Leaf certificate is not valid (expired or not yet valid)',
    };
  }

  // Check intermediate certificates
  for (const intermediate of chain.intermediates) {
    if (now < intermediate.validFrom || now > intermediate.validTo) {
      return {
        valid: false,
        error: 'Intermediate certificate is not valid',
      };
    }
  }

  // Check root certificate if present
  if (chain.root) {
    if (now < chain.root.validFrom || now > chain.root.validTo) {
      return {
        valid: false,
        error: 'Root certificate is not valid',
      };
    }
  }

  // In a real implementation, verify signatures:
  // 1. Leaf signed by first intermediate
  // 2. Each intermediate signed by next intermediate
  // 3. Last intermediate signed by root CA
  // 4. Root CA is in trusted root store

  return { valid: true };
}

// ============================================================================
// CERTIFICATE TRANSPARENCY
// ============================================================================

/**
 * Certificate Transparency Log validation concept.
 *
 * CT logs provide public, append-only records of issued certificates.
 * This helps detect mis-issued or malicious certificates.
 *
 * In production, you would:
 * 1. Extract SCT (Signed Certificate Timestamp) from cert
 * 2. Verify SCT signature against known CT log public keys
 * 3. Optionally query CT log to verify certificate is logged
 */
export interface CTLogEntry {
  logId: string;
  timestamp: number;
  signature: Uint8Array;
}

/**
 * Placeholder for CT log validation.
 * Real implementation would verify SCT signatures.
 */
export function validateCTLog(
  _certBytes: Uint8Array,
  _sct: CTLogEntry
): boolean {
  // In production:
  // 1. Verify SCT signature using log's public key
  // 2. Check timestamp is reasonable
  // 3. Verify log ID matches known trusted CT log

  return true; // Placeholder
}

// ============================================================================
// PIN ROTATION SUPPORT
// ============================================================================

/**
 * Add a backup pin for upcoming certificate rotation.
 * This allows seamless rotation without downtime.
 */
export function addBackupPin(host: string, backupDigest: string): boolean {
  const pin = pinSet.pins.get(host);
  if (!pin) {
    return false;
  }

  if (!pin.backupDigests) {
    pin.backupDigests = [];
  }

  // Add backup if not already present
  if (!pin.backupDigests.includes(backupDigest)) {
    pin.backupDigests.push(backupDigest);
    pinSet.lastUpdated = Date.now();
  }

  return true;
}

/**
 * Promote a backup pin to primary (after rotation).
 * Old primary becomes a backup for rollback support.
 */
export function rotatePinToPrimary(host: string, newPrimaryDigest: string): boolean {
  const pin = pinSet.pins.get(host);
  if (!pin) {
    return false;
  }

  // Move old primary to backup
  if (!pin.backupDigests) {
    pin.backupDigests = [];
  }
  pin.backupDigests.unshift(pin.digest);

  // Set new primary
  pin.digest = newPrimaryDigest;

  // Limit backup pins to 3
  if (pin.backupDigests.length > 3) {
    pin.backupDigests = pin.backupDigests.slice(0, 3);
  }

  pinSet.lastUpdated = Date.now();
  return true;
}

// ============================================================================
// REMOTE PIN UPDATES
// ============================================================================

/**
 * Fetch updated certificate pins from remote manifest.
 * In production, the manifest should be signed to prevent tampering.
 *
 * @param manifestUrl - URL to fetch pin manifest from
 * @returns Updated pin set or null on failure
 */
export async function fetchPinManifest(
  manifestUrl: string
): Promise<PinSet | null> {
  try {
    const response = await fetch(manifestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Use CORS mode for cross-origin requests
      mode: 'cors',
      // Don't send credentials
      credentials: 'omit',
    });

    if (!response.ok) {
      console.error(`Failed to fetch pin manifest: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Validate manifest structure
    if (!data.pins || !Array.isArray(data.pins)) {
      console.error('Invalid pin manifest format');
      return null;
    }

    // TODO: Verify manifest signature before trusting
    // This prevents attackers from serving malicious pins

    const newPinSet: PinSet = {
      pins: new Map(data.pins.map((pin: CertificatePin) => [pin.host, pin])),
      lastUpdated: data.lastUpdated || Date.now(),
      version: data.version || '1.0.0',
    };

    return newPinSet;
  } catch (error) {
    console.error('Error fetching pin manifest:', error);
    return null;
  }
}

/**
 * Update local pin set with remote manifest.
 * Merges remote pins with local pins (remote takes precedence).
 */
export async function updatePinsFromManifest(
  manifestUrl: string
): Promise<boolean> {
  const remotePinSet = await fetchPinManifest(manifestUrl);

  if (!remotePinSet) {
    return false;
  }

  // Merge remote pins with local pins
  remotePinSet.pins.forEach((pin, host) => {
    pinSet.pins.set(host, pin);
  });

  pinSet.lastUpdated = Date.now();
  pinSet.version = remotePinSet.version;

  return true;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Pin management
  getAllPins,
  getPinForHost,
  pinCertificate,
  removePinForHost,
  resetPinsToDefaults,

  // SPKI hashing
  computeSPKIHash,
  extractSPKI,

  // Certificate fingerprinting
  getCertificateFingerprint,
  parseCertificate,

  // Pin validation
  verifyCertificatePin,

  // Chain validation
  validateCertificateChain,
  validateCTLog,

  // Pin rotation
  addBackupPin,
  rotatePinToPrimary,

  // Remote updates
  fetchPinManifest,
  updatePinsFromManifest,
};
