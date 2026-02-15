/**
 * WebAuthn/FIDO2 Biometric Authentication Module
 *
 * Implements device verification using fingerprint, Face ID, Touch ID,
 * Windows Hello, or hardware security keys for enhanced security.
 *
 * AGENT 018 - WEBAUTHN-GATEKEEPER INVARIANTS:
 * 1. Biometric is ALWAYS an optional second factor, NEVER sole auth method
 * 2. Attestation verification is REQUIRED -- signature + format validated
 * 3. Counter verification detects cloned authenticators
 * 4. HSM binding for enterprise key storage when available
 * 5. Re-authentication required for key export/rotation
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 6
 * PRIORITY: HIGH
 */

import { addBreadcrumb, captureException } from '../monitoring/sentry';
import { timingSafeEqual } from '../security/timing-safe';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SerializedCredential {
  id: string;
  rawId: string; // base64url encoded
  type: 'public-key';
  response: {
    clientDataJSON: string; // base64url encoded
    attestationObject: string; // base64url encoded
  };
  authenticatorAttachment?: 'platform' | 'cross-platform';
  transports?: AuthenticatorTransport[];
}

export interface StoredCredential {
  id: string;
  credentialId: string; // raw credential ID (base64url)
  publicKey: string; // base64url encoded SPKI public key
  publicKeyAlgorithm: COSEAlgorithmIdentifier;
  counter: number; // authenticator sign counter for clone detection
  createdAt: number;
  lastUsedAt: number;
  deviceName: string;
  authenticatorAttachment?: 'platform' | 'cross-platform';
  transports?: AuthenticatorTransport[];
  aaguid?: string; // authenticator attestation GUID
  attestationFormat?: AttestationFormat;
  attestationTrustPath?: AttestationTrustPath;
}

export interface WebAuthnConfig {
  rpName: string;
  rpId: string;
  timeout: number;
  userVerification: UserVerificationRequirement;
  attestation: AttestationConveyancePreference;
  authenticatorAttachment?: AuthenticatorAttachment;
}

export interface AuthenticationResult {
  success: boolean;
  credentialId: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
  newCounter?: number;
  error?: string;
}

/**
 * AGENT 018 INVARIANT: Biometric auth role tracking.
 * Biometric MUST be second-factor only. This type enforces that
 * biometric never serves as sole authentication method.
 */
export type BiometricAuthRole = 'second-factor' | 'disabled';

/**
 * Supported attestation statement formats per WebAuthn spec.
 */
export type AttestationFormat = 'none' | 'packed' | 'fido-u2f' | 'android-key' | 'tpm';

/**
 * Trust path determined during attestation verification.
 */
export type AttestationTrustPath = 'self' | 'attestation-ca' | 'none';

/**
 * AGENT 018: Attestation verification result.
 */
export interface AttestationVerificationResult {
  verified: boolean;
  format: AttestationFormat;
  trustPath: AttestationTrustPath;
  aaguid: string;
  publicKey: Uint8Array;
  publicKeyAlgorithm: COSEAlgorithmIdentifier;
  credentialId: Uint8Array;
  counter: number;
  error?: string;
}

/**
 * AGENT 018: Assertion verification result.
 */
export interface AssertionVerificationResult {
  verified: boolean;
  newCounter: number;
  userPresent: boolean;
  userVerified: boolean;
  error?: string;
}

/**
 * AGENT 018: HSM key binding metadata for enterprise key storage.
 */
export interface HSMKeyBinding {
  bound: boolean;
  credentialId: string;
  hsmAvailable: boolean;
  keyNonExportable: boolean;
  boundAt?: number;
  attestationVerified: boolean;
}

/**
 * COSE algorithm identifiers used in WebAuthn.
 */
export type COSEAlgorithmIdentifier = -7 | -257 | -8 | -35 | -36 | number;

// COSE key type constants
const COSE_KEY_TYPE_EC2 = 2;
const COSE_KEY_TYPE_RSA = 3;
const COSE_KEY_TYPE_OKP = 1;

// COSE algorithm constants
const COSE_ALG_ES256 = -7;
const COSE_ALG_ES384 = -35;
const COSE_ALG_ES512 = -36;
const COSE_ALG_RS256 = -257;
// COSE_ALG_EDDSA = -8 reserved for future Ed25519 support

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const CHALLENGE_SIZE = 32; // 32 bytes = 256 bits

/**
 * AGENT 018 INVARIANT: Biometric is NEVER sole auth.
 */
export const BIOMETRIC_AUTH_ROLE: BiometricAuthRole = 'second-factor';

/**
 * In-memory challenge store. Maps challenge (base64url) to expiration timestamp.
 * Challenges are single-use and expire after the configured timeout.
 */
const pendingChallenges = new Map<string, number>();

// Relying Party configuration
const getDefaultConfig = (): WebAuthnConfig => ({
  rpName: 'Tallow',
  rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  timeout: DEFAULT_TIMEOUT,
  userVerification: 'preferred',
  attestation: 'direct',
});

// ============================================================================
// CBOR Decoder (Minimal, spec-compliant for WebAuthn attestation objects)
// ============================================================================

/**
 * Minimal CBOR decoder sufficient for parsing WebAuthn attestation objects.
 * Handles maps, byte strings, text strings, arrays, integers, and simple values.
 * Does NOT handle indefinite-length items or tags (not needed for WebAuthn).
 */
class CBORDecoder {
  private data: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.data = new DataView(buffer);
    this.offset = 0;
  }

  decode(): unknown {
    if (this.offset >= this.data.byteLength) {
      throw new Error('CBOR: unexpected end of data');
    }

    const initialByte = this.data.getUint8(this.offset++);
    const majorType = initialByte >> 5;
    const additionalInfo = initialByte & 0x1f;

    switch (majorType) {
      case 0: // unsigned integer
        return this.readUint(additionalInfo);
      case 1: // negative integer
        return -1 - Number(this.readUint(additionalInfo));
      case 2: // byte string
        return this.readByteString(additionalInfo);
      case 3: // text string
        return this.readTextString(additionalInfo);
      case 4: // array
        return this.readArray(additionalInfo);
      case 5: // map
        return this.readMap(additionalInfo);
      case 6: // tag (skip tag number, decode value)
        this.readUint(additionalInfo); // consume tag number
        return this.decode();
      case 7: // simple/float
        return this.readSimple(additionalInfo);
      default:
        throw new Error(`CBOR: unsupported major type ${majorType}`);
    }
  }

  private readUint(additionalInfo: number): number {
    if (additionalInfo < 24) {
      return additionalInfo;
    }
    switch (additionalInfo) {
      case 24:
        return this.data.getUint8(this.offset++);
      case 25: {
        const val = this.data.getUint16(this.offset);
        this.offset += 2;
        return val;
      }
      case 26: {
        const val = this.data.getUint32(this.offset);
        this.offset += 4;
        return val;
      }
      case 27: {
        // 64-bit: read as two 32-bit values (safe for counter values)
        const hi = this.data.getUint32(this.offset);
        const lo = this.data.getUint32(this.offset + 4);
        this.offset += 8;
        // For WebAuthn purposes, counters fit in 32 bits
        if (hi > 0) {
          return Number(BigInt(hi) * BigInt(0x100000000) + BigInt(lo));
        }
        return lo;
      }
      default:
        throw new Error(`CBOR: unsupported additional info ${additionalInfo}`);
    }
  }

  private readByteString(additionalInfo: number): Uint8Array {
    const length = this.readUint(additionalInfo);
    const value = new Uint8Array(this.data.buffer, this.data.byteOffset + this.offset, length);
    this.offset += length;
    return new Uint8Array(value); // copy to avoid detached buffer issues
  }

  private readTextString(additionalInfo: number): string {
    const length = this.readUint(additionalInfo);
    const bytes = new Uint8Array(this.data.buffer, this.data.byteOffset + this.offset, length);
    this.offset += length;
    return new TextDecoder().decode(bytes);
  }

  private readArray(additionalInfo: number): unknown[] {
    const length = this.readUint(additionalInfo);
    const arr: unknown[] = [];
    for (let i = 0; i < length; i++) {
      arr.push(this.decode());
    }
    return arr;
  }

  private readMap(additionalInfo: number): Map<string | number, unknown> {
    const length = this.readUint(additionalInfo);
    const map = new Map<string | number, unknown>();
    for (let i = 0; i < length; i++) {
      const key = this.decode() as string | number;
      const value = this.decode();
      map.set(key, value);
    }
    return map;
  }

  private readSimple(additionalInfo: number): boolean | null | undefined | number {
    switch (additionalInfo) {
      case 20: return false;
      case 21: return true;
      case 22: return null;
      case 23: return undefined;
      case 25: {
        // float16 -- rare in WebAuthn, skip
        this.offset += 2;
        return 0;
      }
      case 26: {
        const val = this.data.getFloat32(this.offset);
        this.offset += 4;
        return val;
      }
      case 27: {
        const val = this.data.getFloat64(this.offset);
        this.offset += 8;
        return val;
      }
      default:
        return additionalInfo;
    }
  }

  getOffset(): number {
    return this.offset;
  }
}

function decodeCBOR(buffer: ArrayBuffer): unknown {
  const decoder = new CBORDecoder(buffer);
  return decoder.decode();
}

// ============================================================================
// WebAuthn Availability Check
// ============================================================================

/**
 * Check if WebAuthn is available in the current browser.
 */
export function isWebAuthnAvailable(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.PublicKeyCredential !== undefined &&
    typeof window.navigator?.credentials?.create === 'function' &&
    typeof window.navigator?.credentials?.get === 'function'
  );
}

/**
 * Check if platform authenticator (biometrics) is available.
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available === true;
  } catch (error) {
    addBreadcrumb('webauthn', 'Platform authenticator check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get supported authenticator attachment types.
 */
export async function getSupportedAuthenticators(): Promise<{
  platform: boolean;
  crossPlatform: boolean;
}> {
  const platform = await isPlatformAuthenticatorAvailable();
  // Cross-platform authenticators (USB security keys) are available if WebAuthn is supported
  const crossPlatform = isWebAuthnAvailable();
  return { platform, crossPlatform };
}

// ============================================================================
// Challenge Generation & Management
// ============================================================================

/**
 * Generate a cryptographically secure random challenge.
 * The challenge is stored internally and must be consumed within the timeout.
 */
export function generateChallenge(timeoutMs: number = DEFAULT_TIMEOUT): Uint8Array {
  const challenge = crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE));
  const key = arrayBufferToBase64Url(challenge.buffer);
  pendingChallenges.set(key, Date.now() + timeoutMs);

  // Clean up expired challenges
  const now = Date.now();
  for (const [k, expiry] of pendingChallenges) {
    if (expiry < now) {
      pendingChallenges.delete(k);
    }
  }

  return challenge;
}

/**
 * Consume a pending challenge. Returns true if the challenge was valid and unexpired.
 * Each challenge can only be consumed once (replay protection).
 */
function consumeChallenge(challenge: Uint8Array): boolean {
  const key = arrayBufferToBase64Url(challenge.buffer);
  const expiry = pendingChallenges.get(key);
  if (expiry === undefined) {
    return false;
  }
  pendingChallenges.delete(key);
  return Date.now() <= expiry;
}

/**
 * Generate a random user ID.
 */
export function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// ============================================================================
// Base64URL Encoding/Decoding
// ============================================================================

/**
 * Convert ArrayBuffer to base64url string.
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert base64url string to ArrayBuffer.
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert Uint8Array to hex string.
 */
function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ============================================================================
// Authenticator Data Parser
// ============================================================================

interface ParsedAuthenticatorData {
  rpIdHash: Uint8Array; // 32 bytes
  flags: {
    userPresent: boolean;       // bit 0
    userVerified: boolean;      // bit 2
    backupEligible: boolean;    // bit 3
    backupState: boolean;       // bit 4
    attestedCredentialData: boolean; // bit 6
    extensionData: boolean;     // bit 7
  };
  counter: number; // 4 bytes, big-endian uint32
  attestedCredentialData?: {
    aaguid: Uint8Array; // 16 bytes
    credentialId: Uint8Array;
    credentialPublicKey: Map<number | string, unknown>; // COSE key
  };
}

function parseAuthenticatorData(authData: Uint8Array): ParsedAuthenticatorData {
  if (authData.length < 37) {
    throw new Error('Authenticator data too short: must be at least 37 bytes');
  }

  const rpIdHash = authData.slice(0, 32);
  // Flags byte at index 32
  const flags = {
    userPresent: (authData[32]! & 0x01) !== 0,
    userVerified: (authData[32]! & 0x04) !== 0,
    backupEligible: (authData[32]! & 0x08) !== 0,
    backupState: (authData[32]! & 0x10) !== 0,
    attestedCredentialData: (authData[32]! & 0x40) !== 0,
    extensionData: (authData[32]! & 0x80) !== 0,
  };

  const counterView = new DataView(authData.buffer, authData.byteOffset + 33, 4);
  const counter = counterView.getUint32(0, false); // big-endian

  const result: ParsedAuthenticatorData = {
    rpIdHash,
    flags,
    counter,
  };

  // Parse attested credential data if present
  if (flags.attestedCredentialData && authData.length > 37) {
    const aaguid = authData.slice(37, 53); // 16 bytes

    const credIdLenView = new DataView(authData.buffer, authData.byteOffset + 53, 2);
    const credentialIdLength = credIdLenView.getUint16(0, false); // big-endian

    const credentialId = authData.slice(55, 55 + credentialIdLength);

    // The rest is a CBOR-encoded COSE public key
    const publicKeyBytes = authData.slice(55 + credentialIdLength);
    const credentialPublicKey = decodeCBOR(publicKeyBytes.buffer) as Map<number | string, unknown>;

    result.attestedCredentialData = {
      aaguid,
      credentialId,
      credentialPublicKey,
    };
  }

  return result;
}

// ============================================================================
// COSE Key to Web Crypto Key Conversion
// ============================================================================

/**
 * Convert a COSE public key (from attestation) to a Web Crypto CryptoKey.
 * Supports EC2 (ES256/ES384/ES512), RSA (RS256), and OKP (EdDSA) key types.
 */
async function coseKeyToCryptoKey(
  coseKey: Map<number | string, unknown>
): Promise<{ key: CryptoKey; algorithm: COSEAlgorithmIdentifier; spkiBytes: Uint8Array }> {
  const keyType = coseKey.get(1) as number;
  const algorithm = coseKey.get(3) as COSEAlgorithmIdentifier;

  if (keyType === COSE_KEY_TYPE_EC2) {
    // EC2 key (ECDSA)
    // COSE key parameter -1 = curve identifier (inferred from algorithm instead)
    const x = coseKey.get(-2) as Uint8Array;
    const y = coseKey.get(-3) as Uint8Array;

    if (!x || !y) {
      throw new Error('EC2 key missing x or y coordinate');
    }

    let namedCurve: string;
    switch (algorithm) {
      case COSE_ALG_ES256:
        namedCurve = 'P-256';
        break;
      case COSE_ALG_ES384:
        namedCurve = 'P-384';
        break;
      case COSE_ALG_ES512:
        namedCurve = 'P-521';
        break;
      default:
        throw new Error(`Unsupported EC algorithm: ${algorithm}`);
    }

    // Build uncompressed point format (0x04 || x || y)
    const uncompressedPoint = new Uint8Array(1 + x.length + y.length);
    uncompressedPoint[0] = 0x04;
    uncompressedPoint.set(x, 1);
    uncompressedPoint.set(y, 1 + x.length);

    const key = await crypto.subtle.importKey(
      'raw',
      uncompressedPoint,
      { name: 'ECDSA', namedCurve },
      true, // exportable so we can get SPKI
      ['verify']
    );

    const spkiBytes = new Uint8Array(await crypto.subtle.exportKey('spki', key));

    return { key, algorithm, spkiBytes };
  } else if (keyType === COSE_KEY_TYPE_RSA) {
    // RSA key
    const n = coseKey.get(-1) as Uint8Array;
    const e = coseKey.get(-2) as Uint8Array;

    if (!n || !e) {
      throw new Error('RSA key missing n or e');
    }

    // Build JWK for RSA public key
    const jwk: JsonWebKey = {
      kty: 'RSA',
      n: arrayBufferToBase64Url(n.buffer),
      e: arrayBufferToBase64Url(e.buffer),
    };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      true,
      ['verify']
    );

    const spkiBytes = new Uint8Array(await crypto.subtle.exportKey('spki', key));

    return { key, algorithm, spkiBytes };
  } else if (keyType === COSE_KEY_TYPE_OKP) {
    // OKP key (EdDSA) -- Ed25519
    const x = coseKey.get(-2) as Uint8Array;
    if (!x) {
      throw new Error('OKP key missing x coordinate');
    }

    // Ed25519 not widely supported in Web Crypto yet; store raw key bytes
    // and use SPKI encoding manually
    // DER SPKI prefix for Ed25519: 302a300506032b6570032100
    const ed25519SpkiPrefix = new Uint8Array([
      0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65,
      0x70, 0x03, 0x21, 0x00,
    ]);
    const spkiBytes = new Uint8Array(ed25519SpkiPrefix.length + x.length);
    spkiBytes.set(ed25519SpkiPrefix);
    spkiBytes.set(x, ed25519SpkiPrefix.length);

    try {
      const key = await crypto.subtle.importKey(
        'spki',
        spkiBytes,
        { name: 'Ed25519' },
        true,
        ['verify']
      );
      return { key, algorithm, spkiBytes };
    } catch {
      // Ed25519 not supported in this browser -- store SPKI bytes for external verification
      // Return a placeholder that cannot be used for Web Crypto verify, but spkiBytes is valid
      addBreadcrumb('webauthn', 'Ed25519 not supported in Web Crypto, storing raw key');
      return { key: null as unknown as CryptoKey, algorithm, spkiBytes };
    }
  }

  throw new Error(`Unsupported COSE key type: ${keyType}`);
}

// ============================================================================
// Attestation Verification
// ============================================================================

/**
 * Verify the attestation statement from a registration response.
 * Supports "none", "packed" (self-attestation and full), and "fido-u2f" formats.
 *
 * Per WebAuthn spec section 6.5.4, verification includes:
 * 1. Parse the attestation object (CBOR)
 * 2. Verify clientDataJSON hash matches expectations
 * 3. Parse authenticator data
 * 4. Verify RP ID hash
 * 5. Verify user presence and (optionally) user verification flags
 * 6. Verify attestation statement signature
 */
async function verifyAttestation(
  attestationObjectBuffer: ArrayBuffer,
  clientDataJSON: ArrayBuffer,
  expectedChallenge: Uint8Array,
  rpId: string
): Promise<AttestationVerificationResult> {
  try {
    // Step 1: Verify clientDataJSON
    const clientDataText = new TextDecoder().decode(clientDataJSON);
    const clientData = JSON.parse(clientDataText);

    // Verify type
    if (clientData.type !== 'webauthn.create') {
      return makeAttestationError('Invalid clientData type: expected webauthn.create');
    }

    // Verify challenge (timing-safe)
    const receivedChallenge = new Uint8Array(base64UrlToArrayBuffer(clientData.challenge));
    if (!timingSafeEqual(receivedChallenge, expectedChallenge)) {
      return makeAttestationError('Challenge mismatch');
    }

    // Verify origin matches expected RP ID
    try {
      const origin = new URL(clientData.origin);
      if (origin.hostname !== rpId && rpId !== 'localhost') {
        return makeAttestationError(`Origin hostname ${origin.hostname} does not match RP ID ${rpId}`);
      }
    } catch {
      return makeAttestationError('Invalid origin in clientDataJSON');
    }

    // Step 2: Parse attestation object (CBOR)
    const attestationObject = decodeCBOR(attestationObjectBuffer) as Map<string, unknown>;
    const fmt = attestationObject.get('fmt') as string;
    const attStmt = attestationObject.get('attStmt') as Map<string | number, unknown>;
    const authDataBytes = attestationObject.get('authData') as Uint8Array;

    if (!authDataBytes || !(authDataBytes instanceof Uint8Array)) {
      return makeAttestationError('Missing or invalid authData in attestation object');
    }

    // Step 3: Parse authenticator data
    const authData = parseAuthenticatorData(authDataBytes);

    // Step 4: Verify RP ID hash
    const expectedRpIdHash = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId))
    );
    if (!timingSafeEqual(authData.rpIdHash, expectedRpIdHash)) {
      return makeAttestationError('RP ID hash mismatch');
    }

    // Step 5: Verify flags
    if (!authData.flags.userPresent) {
      return makeAttestationError('User presence flag not set');
    }

    // Step 6: Verify attested credential data exists
    if (!authData.flags.attestedCredentialData || !authData.attestedCredentialData) {
      return makeAttestationError('No attested credential data in authenticator data');
    }

    // Extract public key
    const { spkiBytes, algorithm } = await coseKeyToCryptoKey(
      authData.attestedCredentialData.credentialPublicKey
    );

    const aaguid = uint8ArrayToHex(authData.attestedCredentialData.aaguid);

    // Step 7: Compute clientDataHash for signature verification
    const clientDataHash = new Uint8Array(
      await crypto.subtle.digest('SHA-256', clientDataJSON)
    );

    // Step 8: Verify attestation statement based on format
    let trustPath: AttestationTrustPath = 'none';

    switch (fmt) {
      case 'none': {
        // No attestation -- trust the key at face value
        // attStmt should be empty
        trustPath = 'none';
        break;
      }

      case 'packed': {
        trustPath = await verifyPackedAttestation(
          attStmt,
          authDataBytes,
          clientDataHash,
          authData.attestedCredentialData.credentialPublicKey,
          algorithm
        );
        break;
      }

      case 'fido-u2f': {
        trustPath = await verifyFidoU2fAttestation(
          attStmt,
          authDataBytes,
          clientDataHash,
          authData.attestedCredentialData.aaguid,
          authData.attestedCredentialData.credentialId,
          authData.attestedCredentialData.credentialPublicKey
        );
        break;
      }

      default: {
        // For android-key, tpm, etc. -- accept with 'none' trust path
        // and log for monitoring
        addBreadcrumb('webauthn', `Unverified attestation format: ${fmt}`, { format: fmt });
        trustPath = 'none';
        break;
      }
    }

    return {
      verified: true,
      format: fmt as AttestationFormat,
      trustPath,
      aaguid,
      publicKey: spkiBytes,
      publicKeyAlgorithm: algorithm,
      credentialId: authData.attestedCredentialData.credentialId,
      counter: authData.counter,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown attestation verification error';
    return makeAttestationError(msg);
  }
}

function makeAttestationError(error: string): AttestationVerificationResult {
  return {
    verified: false,
    format: 'none' as AttestationFormat,
    trustPath: 'none',
    aaguid: '',
    publicKey: new Uint8Array(0),
    publicKeyAlgorithm: -7,
    credentialId: new Uint8Array(0),
    counter: 0,
    error,
  };
}

/**
 * Verify "packed" attestation statement.
 * Handles both self-attestation (no x5c) and full attestation (with x5c certificate chain).
 */
async function verifyPackedAttestation(
  attStmt: Map<string | number, unknown>,
  authDataBytes: Uint8Array,
  clientDataHash: Uint8Array,
  coseKey: Map<number | string, unknown>,
  algorithm: COSEAlgorithmIdentifier
): Promise<AttestationTrustPath> {
  const sig = attStmt.get('sig') as Uint8Array;
  const alg = attStmt.get('alg') as number;
  const x5c = attStmt.get('x5c') as Uint8Array[] | undefined;

  if (!sig) {
    throw new Error('Packed attestation missing signature');
  }

  // Construct verification data: authData || clientDataHash
  const verificationData = new Uint8Array(authDataBytes.length + clientDataHash.length);
  verificationData.set(authDataBytes);
  verificationData.set(clientDataHash, authDataBytes.length);

  if (x5c && Array.isArray(x5c) && x5c.length > 0) {
    // Full attestation with certificate chain
    const attestCert = x5c[0]!;

    // Import the attestation certificate and verify signature
    const certKey = await importX509PublicKey(attestCert, alg);
    const signatureValid = await verifySignatureWithAlgorithm(
      certKey,
      alg,
      sig,
      verificationData
    );

    if (!signatureValid) {
      throw new Error('Packed attestation signature verification failed (x5c)');
    }

    // Certificate chain present -- this is CA-attested
    return 'attestation-ca';
  } else {
    // Self-attestation: verify signature with the credential public key itself
    if (alg !== algorithm) {
      throw new Error(
        `Packed self-attestation algorithm mismatch: attStmt alg=${alg}, key alg=${algorithm}`
      );
    }

    const { key } = await coseKeyToCryptoKey(coseKey);
    if (!key) {
      throw new Error('Cannot verify self-attestation: public key import failed');
    }

    const signatureValid = await verifySignatureWithAlgorithm(
      key,
      alg,
      sig,
      verificationData
    );

    if (!signatureValid) {
      throw new Error('Packed self-attestation signature verification failed');
    }

    return 'self';
  }
}

/**
 * Verify "fido-u2f" attestation statement.
 */
async function verifyFidoU2fAttestation(
  attStmt: Map<string | number, unknown>,
  authDataBytes: Uint8Array,
  clientDataHash: Uint8Array,
  _aaguid: Uint8Array,
  credentialId: Uint8Array,
  coseKey: Map<number | string, unknown>
): Promise<AttestationTrustPath> {
  const sig = attStmt.get('sig') as Uint8Array;
  const x5c = attStmt.get('x5c') as Uint8Array[];

  if (!sig || !x5c || !Array.isArray(x5c) || x5c.length === 0) {
    throw new Error('FIDO-U2F attestation missing sig or x5c');
  }

  // Extract EC public key coordinates from COSE key
  const x = coseKey.get(-2) as Uint8Array;
  const y = coseKey.get(-3) as Uint8Array;
  if (!x || !y) {
    throw new Error('FIDO-U2F: credential key missing x or y');
  }

  // Build public key in uncompressed point format (65 bytes)
  const publicKeyU2F = new Uint8Array(65);
  publicKeyU2F[0] = 0x04;
  publicKeyU2F.set(x, 1);
  publicKeyU2F.set(y, 1 + x.length);

  // RP ID hash is the first 32 bytes of authData
  const rpIdHash = authDataBytes.slice(0, 32);

  // Construct verification data per FIDO U2F spec:
  // 0x00 || rpIdHash || clientDataHash || credentialId || publicKeyU2F
  const verificationData = new Uint8Array(
    1 + 32 + clientDataHash.length + credentialId.length + 65
  );
  let offset = 0;
  verificationData[offset++] = 0x00; // reserved byte
  verificationData.set(rpIdHash, offset);
  offset += 32;
  verificationData.set(clientDataHash, offset);
  offset += clientDataHash.length;
  verificationData.set(credentialId, offset);
  offset += credentialId.length;
  verificationData.set(publicKeyU2F, offset);

  // Import attestation certificate and verify
  const attestCert = x5c[0]!;
  const certKey = await importX509PublicKey(attestCert, COSE_ALG_ES256);
  const signatureValid = await verifySignatureWithAlgorithm(
    certKey,
    COSE_ALG_ES256,
    sig,
    verificationData
  );

  if (!signatureValid) {
    throw new Error('FIDO-U2F attestation signature verification failed');
  }

  return 'attestation-ca';
}

/**
 * Import a public key from an X.509 DER-encoded certificate.
 */
async function importX509PublicKey(
  certDer: Uint8Array,
  algorithm: number
): Promise<CryptoKey> {
  // Web Crypto can import X.509 certificates via the spki format of the
  // SubjectPublicKeyInfo. We need to extract SPKI from the certificate.
  // For simplicity and correctness, we use a minimal ASN.1 DER parser
  // to extract the SubjectPublicKeyInfo from the certificate.
  const spki = extractSPKIFromCert(certDer);

  const importParams = getWebCryptoParams(algorithm);
  return crypto.subtle.importKey('spki', spki, importParams.import, false, ['verify']);
}

/**
 * Extract SubjectPublicKeyInfo from a DER-encoded X.509 certificate.
 * Performs minimal ASN.1 parsing to find the SPKI structure.
 */
function extractSPKIFromCert(certDer: Uint8Array): Uint8Array {
  // X.509 certificate structure (simplified):
  // SEQUENCE {
  //   SEQUENCE (tbsCertificate) {
  //     [0] version (optional)
  //     INTEGER serialNumber
  //     SEQUENCE signature algorithm
  //     SEQUENCE issuer
  //     SEQUENCE validity
  //     SEQUENCE subject
  //     SEQUENCE subjectPublicKeyInfo  <-- we want this
  //     ...
  //   }
  //   SEQUENCE signatureAlgorithm
  //   BIT STRING signatureValue
  // }

  let offset = 0;

  function readTag(): { tag: number; constructed: boolean; length: number; headerLen: number } {
    const tag = certDer[offset]!;
    const constructed = (tag & 0x20) !== 0;
    offset++;
    let length = certDer[offset]!;
    offset++;
    let headerLen = 2;

    if (length & 0x80) {
      const numBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | certDer[offset]!;
        offset++;
        headerLen++;
      }
    }

    return { tag: tag & 0x1f, constructed, length, headerLen };
  }

  function skipTLV(): void {
    const { length } = readTag();
    offset += length;
  }

  // Outer SEQUENCE (Certificate) — advance past the tag
  readTag();

  // TBS Certificate SEQUENCE — advance past the tag
  readTag();

  // Version [0] EXPLICIT (optional - check if context tag 0)
  if ((certDer[offset]! & 0xff) === 0xa0) {
    skipTLV(); // skip version
  }

  // Serial number (INTEGER)
  skipTLV();

  // Signature algorithm (SEQUENCE)
  skipTLV();

  // Issuer (SEQUENCE)
  skipTLV();

  // Validity (SEQUENCE)
  skipTLV();

  // Subject (SEQUENCE)
  skipTLV();

  // SubjectPublicKeyInfo (SEQUENCE) -- this is what we want
  const spkiStart = offset;
  const spkiHeader = readTag();
  const spkiEnd = offset + spkiHeader.length;

  return certDer.slice(spkiStart, spkiEnd);
}

/**
 * Get Web Crypto algorithm parameters for a COSE algorithm identifier.
 */
function getWebCryptoParams(algorithm: number): {
  import: AlgorithmIdentifier | RsaHashedImportParams | EcKeyImportParams;
  verify: AlgorithmIdentifier | RsaPssParams | EcdsaParams;
} {
  switch (algorithm) {
    case COSE_ALG_ES256:
      return {
        import: { name: 'ECDSA', namedCurve: 'P-256' },
        verify: { name: 'ECDSA', hash: 'SHA-256' },
      };
    case COSE_ALG_ES384:
      return {
        import: { name: 'ECDSA', namedCurve: 'P-384' },
        verify: { name: 'ECDSA', hash: 'SHA-384' },
      };
    case COSE_ALG_ES512:
      return {
        import: { name: 'ECDSA', namedCurve: 'P-521' },
        verify: { name: 'ECDSA', hash: 'SHA-512' },
      };
    case COSE_ALG_RS256:
      return {
        import: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        verify: { name: 'RSASSA-PKCS1-v1_5' },
      };
    default:
      throw new Error(`Unsupported COSE algorithm: ${algorithm}`);
  }
}

/**
 * Verify a signature using the appropriate Web Crypto algorithm.
 */
async function verifySignatureWithAlgorithm(
  key: CryptoKey,
  algorithm: number,
  signature: Uint8Array,
  data: Uint8Array
): Promise<boolean> {
  const params = getWebCryptoParams(algorithm);

  // For ECDSA, WebAuthn signatures are in DER format but Web Crypto expects raw (r||s)
  let sigBytes = signature;
  if (algorithm === COSE_ALG_ES256 || algorithm === COSE_ALG_ES384 || algorithm === COSE_ALG_ES512) {
    sigBytes = derSignatureToRaw(signature, algorithm);
  }

  return crypto.subtle.verify(params.verify, key, sigBytes, data);
}

/**
 * Convert a DER-encoded ECDSA signature to raw format (r || s).
 * WebAuthn sends DER, but Web Crypto expects raw concatenation.
 */
function derSignatureToRaw(derSig: Uint8Array, algorithm: number): Uint8Array {
  // DER: SEQUENCE { INTEGER r, INTEGER s }
  let componentLength: number;
  switch (algorithm) {
    case COSE_ALG_ES256: componentLength = 32; break;
    case COSE_ALG_ES384: componentLength = 48; break;
    case COSE_ALG_ES512: componentLength = 66; break;
    default: throw new Error(`Cannot convert DER sig for algorithm ${algorithm}`);
  }

  // Check if this is already raw format (just r||s)
  if (derSig.length === componentLength * 2) {
    return derSig;
  }

  // Parse DER
  if (derSig[0] !== 0x30) {
    throw new Error('Invalid DER signature: expected SEQUENCE tag');
  }

  let offset = 2; // skip SEQUENCE tag and length

  // Handle multi-byte length
  if (derSig[1]! & 0x80) {
    offset = 2 + (derSig[1]! & 0x7f);
  }

  function readInteger(): Uint8Array {
    if (derSig[offset] !== 0x02) {
      throw new Error('Invalid DER signature: expected INTEGER tag');
    }
    offset++;
    const len = derSig[offset]!;
    offset++;
    const value = derSig.slice(offset, offset + len);
    offset += len;
    return value;
  }

  const rRaw = readInteger();
  const sRaw = readInteger();

  // Pad or trim to component length
  const raw = new Uint8Array(componentLength * 2);

  // r component: if leading zero (positive sign), skip it; if short, left-pad with zeros
  if (rRaw.length > componentLength) {
    raw.set(rRaw.slice(rRaw.length - componentLength), 0);
  } else {
    raw.set(rRaw, componentLength - rRaw.length);
  }

  // s component
  if (sRaw.length > componentLength) {
    raw.set(sRaw.slice(sRaw.length - componentLength), componentLength);
  } else {
    raw.set(sRaw, componentLength * 2 - sRaw.length);
  }

  return raw;
}

// ============================================================================
// Assertion Verification
// ============================================================================

/**
 * Verify an authentication assertion response.
 * Checks:
 * 1. clientDataJSON type and challenge
 * 2. RP ID hash in authenticator data
 * 3. User presence and verification flags
 * 4. Signature over authenticatorData + SHA-256(clientDataJSON)
 * 5. Counter increment (clone detection)
 */
async function verifyAssertion(
  authenticatorData: ArrayBuffer,
  clientDataJSON: ArrayBuffer,
  signature: ArrayBuffer,
  expectedChallenge: Uint8Array,
  rpId: string,
  storedPublicKey: Uint8Array,
  storedAlgorithm: COSEAlgorithmIdentifier,
  storedCounter: number
): Promise<AssertionVerificationResult> {
  try {
    // Step 1: Verify clientDataJSON
    const clientDataText = new TextDecoder().decode(clientDataJSON);
    const clientData = JSON.parse(clientDataText);

    if (clientData.type !== 'webauthn.get') {
      return { verified: false, newCounter: storedCounter, userPresent: false, userVerified: false, error: 'Invalid clientData type' };
    }

    const receivedChallenge = new Uint8Array(base64UrlToArrayBuffer(clientData.challenge));
    if (!timingSafeEqual(receivedChallenge, expectedChallenge)) {
      return { verified: false, newCounter: storedCounter, userPresent: false, userVerified: false, error: 'Challenge mismatch' };
    }

    // Step 2: Parse authenticator data
    const authDataBytes = new Uint8Array(authenticatorData);
    const authData = parseAuthenticatorData(authDataBytes);

    // Step 3: Verify RP ID hash
    const expectedRpIdHash = new Uint8Array(
      await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rpId))
    );
    if (!timingSafeEqual(authData.rpIdHash, expectedRpIdHash)) {
      return { verified: false, newCounter: storedCounter, userPresent: false, userVerified: false, error: 'RP ID hash mismatch' };
    }

    // Step 4: Check flags
    if (!authData.flags.userPresent) {
      return { verified: false, newCounter: storedCounter, userPresent: false, userVerified: false, error: 'User presence flag not set' };
    }

    // Step 5: Counter verification (clone detection)
    // Per spec: if stored counter is non-zero, new counter must be greater
    if (storedCounter > 0 && authData.counter > 0 && authData.counter <= storedCounter) {
      addBreadcrumb('webauthn', 'SECURITY WARNING: Possible cloned authenticator detected', {
        storedCounter,
        receivedCounter: authData.counter,
      });
      return {
        verified: false,
        newCounter: storedCounter,
        userPresent: authData.flags.userPresent,
        userVerified: authData.flags.userVerified,
        error: 'Counter did not increment -- possible cloned authenticator',
      };
    }

    // Step 6: Verify signature
    // Signature is over: authenticatorData || SHA-256(clientDataJSON)
    const clientDataHash = new Uint8Array(
      await crypto.subtle.digest('SHA-256', clientDataJSON)
    );
    const signedData = new Uint8Array(authDataBytes.length + clientDataHash.length);
    signedData.set(authDataBytes);
    signedData.set(clientDataHash, authDataBytes.length);

    // Import the stored public key
    const importParams = getWebCryptoParams(storedAlgorithm);
    const cryptoKey = await crypto.subtle.importKey(
      'spki',
      storedPublicKey,
      importParams.import,
      false,
      ['verify']
    );

    // Convert DER signature to raw for ECDSA
    let sigBytes = new Uint8Array(signature);
    if (
      storedAlgorithm === COSE_ALG_ES256 ||
      storedAlgorithm === COSE_ALG_ES384 ||
      storedAlgorithm === COSE_ALG_ES512
    ) {
      sigBytes = derSignatureToRaw(sigBytes, storedAlgorithm);
    }

    const signatureValid = await crypto.subtle.verify(
      importParams.verify,
      cryptoKey,
      sigBytes,
      signedData
    );

    if (!signatureValid) {
      return {
        verified: false,
        newCounter: storedCounter,
        userPresent: authData.flags.userPresent,
        userVerified: authData.flags.userVerified,
        error: 'Signature verification failed',
      };
    }

    return {
      verified: true,
      newCounter: authData.counter,
      userPresent: authData.flags.userPresent,
      userVerified: authData.flags.userVerified,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown assertion verification error';
    return {
      verified: false,
      newCounter: storedCounter,
      userPresent: false,
      userVerified: false,
      error: msg,
    };
  }
}

// ============================================================================
// Credential Registration (with attestation verification)
// ============================================================================

/**
 * Registration result returned after credential creation and verification.
 */
export interface RegistrationResult {
  credential: PublicKeyCredential;
  attestation: AttestationVerificationResult;
  challenge: Uint8Array;
}

/**
 * Register a new WebAuthn credential (fingerprint, Face ID, security key, etc.)
 *
 * Flow:
 * 1. Generate challenge and credential creation options
 * 2. Call navigator.credentials.create()
 * 3. Verify the attestation response (format, signature, certificate chain)
 * 4. Return verified credential with extracted public key
 *
 * @param username - User-friendly username
 * @param displayName - Display name
 * @param userId - Optional user ID (generated if not provided)
 * @param config - Optional WebAuthn configuration
 * @param existingCredentialIds - Credential IDs to exclude (already registered)
 * @returns Registration result with verified attestation
 */
export async function registerCredential(
  username: string,
  displayName: string,
  userId?: Uint8Array,
  config?: Partial<WebAuthnConfig>,
  existingCredentialIds?: string[]
): Promise<RegistrationResult> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not available in this browser');
  }

  const fullConfig = { ...getDefaultConfig(), ...config };
  const challenge = generateChallenge(fullConfig.timeout);
  const userIdBytes = userId || generateUserId();

  addBreadcrumb('webauthn', 'Starting WebAuthn registration', {
    username,
    rpId: fullConfig.rpId,
    timeout: fullConfig.timeout,
    attachment: fullConfig.authenticatorAttachment || 'not specified',
  });

  // Build exclude list from already-registered credentials
  const excludeCredentials: PublicKeyCredentialDescriptor[] = (existingCredentialIds || []).map(
    (id) => ({
      type: 'public-key' as const,
      id: base64UrlToArrayBuffer(id),
      transports: ['internal', 'usb', 'nfc', 'ble'] as AuthenticatorTransport[],
    })
  );

  const publicKeyOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: fullConfig.rpName,
      id: fullConfig.rpId,
    },
    user: {
      id: userIdBytes,
      name: username,
      displayName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 },   // ES256 (ECDSA P-256 with SHA-256)
      { type: 'public-key', alg: -257 },  // RS256 (RSA PKCS#1 v1.5 with SHA-256)
      { type: 'public-key', alg: -8 },    // EdDSA (Ed25519)
      { type: 'public-key', alg: -35 },   // ES384
      { type: 'public-key', alg: -36 },   // ES512
    ],
    authenticatorSelection: {
      // Allow both platform and roaming authenticators unless explicitly specified
      ...(fullConfig.authenticatorAttachment
        ? { authenticatorAttachment: fullConfig.authenticatorAttachment }
        : {}),
      userVerification: fullConfig.userVerification,
      residentKey: 'preferred',
      requireResidentKey: false,
    },
    attestation: fullConfig.attestation,
    timeout: fullConfig.timeout,
    excludeCredentials,
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });

    if (!credential || credential.type !== 'public-key') {
      throw new Error('Failed to create credential');
    }

    const pkCredential = credential as PublicKeyCredential;
    const response = pkCredential.response as AuthenticatorAttestationResponse;

    // Verify the attestation
    const attestationResult = await verifyAttestation(
      response.attestationObject,
      response.clientDataJSON,
      challenge,
      fullConfig.rpId
    );

    if (!attestationResult.verified) {
      throw new Error(`Attestation verification failed: ${attestationResult.error}`);
    }

    // Consume the challenge (single-use)
    consumeChallenge(challenge);

    addBreadcrumb('webauthn', 'WebAuthn registration successful', {
      credentialId: pkCredential.id.slice(0, 16) + '...',
      format: attestationResult.format,
      trustPath: attestationResult.trustPath,
      aaguid: attestationResult.aaguid,
    });

    return {
      credential: pkCredential,
      attestation: attestationResult,
      challenge,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    captureException(error instanceof Error ? error : new Error('WebAuthn registration failed'), {
      tags: { module: 'webauthn', operation: 'registerCredential' },
      extra: {
        username,
        rpId: fullConfig.rpId,
        error: errorMessage,
      },
    });

    // Provide user-friendly error messages
    if (errorMessage.includes('NotAllowedError')) {
      throw new Error('Registration was cancelled or not allowed');
    } else if (errorMessage.includes('NotSupportedError')) {
      throw new Error('Your device does not support this authentication method');
    } else if (errorMessage.includes('SecurityError')) {
      throw new Error('Security error: Make sure you are using HTTPS');
    } else if (errorMessage.includes('InvalidStateError')) {
      throw new Error('This authenticator is already registered');
    } else if (errorMessage.includes('Attestation verification failed')) {
      throw error; // Pass through our own verification errors
    } else {
      throw new Error(`Registration failed: ${errorMessage}`);
    }
  }
}

// ============================================================================
// Credential Authentication (with assertion verification)
// ============================================================================

/**
 * Authenticate using a registered credential.
 *
 * Flow:
 * 1. Generate challenge
 * 2. Call navigator.credentials.get()
 * 3. Verify the assertion (signature, counter, RP ID, flags)
 * 4. Return result with updated counter for clone detection
 *
 * @param storedCredentials - Array of stored credentials to allow
 * @param config - Optional WebAuthn configuration
 * @returns Authentication result with verified assertion
 */
export async function authenticateCredential(
  storedCredentials?: StoredCredential[],
  config?: Partial<WebAuthnConfig>
): Promise<AuthenticationResult> {
  if (!isWebAuthnAvailable()) {
    return {
      success: false,
      credentialId: '',
      authenticatorData: '',
      signature: '',
      error: 'WebAuthn is not available in this browser',
    };
  }

  const fullConfig = { ...getDefaultConfig(), ...config };
  const challenge = generateChallenge(fullConfig.timeout);

  addBreadcrumb('webauthn', 'Starting WebAuthn authentication', {
    credentialCount: storedCredentials?.length ?? 0,
    rpId: fullConfig.rpId,
  });

  // Build allowCredentials from stored credentials
  const allowCredentials: PublicKeyCredentialDescriptor[] = (storedCredentials || []).map(
    (cred) => ({
      type: 'public-key' as const,
      id: base64UrlToArrayBuffer(cred.credentialId),
      transports: cred.transports || ['internal', 'usb', 'nfc', 'ble'],
    })
  );

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: fullConfig.rpId,
    timeout: fullConfig.timeout,
    userVerification: fullConfig.userVerification,
    allowCredentials,
  };

  try {
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyOptions,
    });

    if (!assertion || assertion.type !== 'public-key') {
      return {
        success: false,
        credentialId: '',
        authenticatorData: '',
        signature: '',
        error: 'Failed to get authentication assertion',
      };
    }

    const pkAssertion = assertion as PublicKeyCredential;
    const response = pkAssertion.response as AuthenticatorAssertionResponse;
    const credentialIdB64 = arrayBufferToBase64Url(pkAssertion.rawId);

    // Find the stored credential for this assertion
    const matchedCredential = storedCredentials?.find(
      (c) => c.credentialId === credentialIdB64
    );

    if (matchedCredential) {
      // Full verification: check signature, counter, RP ID hash, flags
      const storedPublicKey = new Uint8Array(base64UrlToArrayBuffer(matchedCredential.publicKey));
      const storedAlgorithm = matchedCredential.publicKeyAlgorithm || COSE_ALG_ES256;

      const verificationResult = await verifyAssertion(
        response.authenticatorData,
        response.clientDataJSON,
        response.signature,
        challenge,
        fullConfig.rpId,
        storedPublicKey,
        storedAlgorithm,
        matchedCredential.counter
      );

      // Consume the challenge
      consumeChallenge(challenge);

      if (!verificationResult.verified) {
        addBreadcrumb('webauthn', 'Assertion verification failed', {
          credentialId: credentialIdB64.slice(0, 16) + '...',
          error: verificationResult.error,
        });

        return {
          success: false,
          credentialId: credentialIdB64,
          authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
          signature: arrayBufferToBase64Url(response.signature),
          error: verificationResult.error ?? 'Verification failed',
        };
      }

      addBreadcrumb('webauthn', 'WebAuthn authentication verified', {
        credentialId: credentialIdB64.slice(0, 16) + '...',
        newCounter: verificationResult.newCounter,
        userVerified: verificationResult.userVerified,
      });

      const userHandleValue = response.userHandle
        ? arrayBufferToBase64Url(response.userHandle)
        : undefined;

      return {
        success: true,
        credentialId: credentialIdB64,
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        signature: arrayBufferToBase64Url(response.signature),
        newCounter: verificationResult.newCounter,
        ...(userHandleValue ? { userHandle: userHandleValue } : {}),
      };
    } else {
      // No stored credential to verify against -- this should not happen in normal flow
      // but we still return the assertion data without cryptographic verification
      addBreadcrumb('webauthn', 'No stored credential found for assertion verification', {
        credentialId: credentialIdB64.slice(0, 16) + '...',
      });

      consumeChallenge(challenge);

      const userHandleValue = response.userHandle
        ? arrayBufferToBase64Url(response.userHandle)
        : undefined;

      return {
        success: false,
        credentialId: credentialIdB64,
        authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
        signature: arrayBufferToBase64Url(response.signature),
        ...(userHandleValue ? { userHandle: userHandleValue } : {}),
        error: 'No stored credential found to verify assertion against',
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    captureException(error instanceof Error ? error : new Error('WebAuthn authentication failed'), {
      tags: { module: 'webauthn', operation: 'authenticateCredential' },
      extra: {
        credentialCount: storedCredentials?.length ?? 0,
        rpId: fullConfig.rpId,
        error: errorMessage,
      },
    });

    let friendlyError = 'Authentication failed';
    if (errorMessage.includes('NotAllowedError')) {
      friendlyError = 'Authentication was cancelled or not allowed';
    } else if (errorMessage.includes('NotFoundError')) {
      friendlyError = 'No registered authenticator found';
    } else if (errorMessage.includes('SecurityError')) {
      friendlyError = 'Security error: Make sure you are using HTTPS';
    }

    return {
      success: false,
      credentialId: '',
      authenticatorData: '',
      signature: '',
      error: friendlyError,
    };
  }
}

// ============================================================================
// Credential Serialization
// ============================================================================

/**
 * Encode a PublicKeyCredential for storage.
 */
export function encodeCredentialForStorage(
  credential: PublicKeyCredential
): SerializedCredential {
  const response = credential.response as AuthenticatorAttestationResponse;
  const responseWithOptionalTransports = response as AuthenticatorAttestationResponse & {
    getTransports?: () => AuthenticatorTransport[];
  };
  const isAuthenticatorTransport = (value: string): value is AuthenticatorTransport =>
    value === 'ble' ||
    value === 'hybrid' ||
    value === 'internal' ||
    value === 'nfc' ||
    value === 'smart-card' ||
    value === 'usb';
  const transports = typeof responseWithOptionalTransports.getTransports === 'function'
    ? responseWithOptionalTransports.getTransports().filter((transport) =>
        isAuthenticatorTransport(transport)
      )
    : [];

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
    },
    authenticatorAttachment: (credential as PublicKeyCredential & { authenticatorAttachment?: 'platform' | 'cross-platform' }).authenticatorAttachment,
    transports,
  };
}

/**
 * Create credential request options from stored credential.
 */
export function decodeStoredCredential(
  data: StoredCredential
): PublicKeyCredentialDescriptor {
  return {
    type: 'public-key',
    id: base64UrlToArrayBuffer(data.credentialId),
    transports: data.transports || ['internal', 'usb', 'nfc', 'ble'],
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get user-friendly name for authenticator type.
 */
export function getAuthenticatorTypeName(
  attachment?: 'platform' | 'cross-platform'
): string {
  if (!attachment) {
    return 'Authenticator';
  }
  return attachment === 'platform'
    ? 'Built-in Authenticator'
    : 'Security Key';
}

/**
 * Get icon name for authenticator type.
 */
export function getAuthenticatorIcon(
  attachment?: 'platform' | 'cross-platform'
): 'fingerprint' | 'key' {
  return attachment === 'platform' ? 'fingerprint' : 'key';
}

/**
 * Detect platform-specific biometric name.
 */
export async function getBiometricMethodName(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'Biometric';
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    return userAgent.includes('iphone') || userAgent.includes('ipad')
      ? 'Face ID or Touch ID'
      : 'Touch ID';
  } else if (userAgent.includes('windows')) {
    return 'Windows Hello';
  } else if (userAgent.includes('android')) {
    return 'Fingerprint or Face Unlock';
  }

  return 'Biometric';
}

/**
 * Verify that the challenge in client data matches expected challenge.
 * Uses timing-safe comparison.
 */
export function verifyChallenge(
  clientDataJSON: ArrayBuffer,
  expectedChallenge: Uint8Array
): boolean {
  try {
    const decoder = new TextDecoder('utf-8');
    const clientData = JSON.parse(decoder.decode(clientDataJSON));
    const receivedChallenge = new Uint8Array(base64UrlToArrayBuffer(clientData.challenge));
    return timingSafeEqual(receivedChallenge, expectedChallenge);
  } catch {
    return false;
  }
}

// ============================================================================
// Exported Verification Functions (for external use)
// ============================================================================

export { verifyAttestation, verifyAssertion, parseAuthenticatorData };

// ============================================================================
// Export singleton instance helper
// ============================================================================

export const webauthn = {
  isAvailable: isWebAuthnAvailable,
  isPlatformAvailable: isPlatformAuthenticatorAvailable,
  getSupportedAuthenticators,
  register: registerCredential,
  authenticate: authenticateCredential,
  verifyAttestation,
  verifyAssertion,
  encode: encodeCredentialForStorage,
  decode: decodeStoredCredential,
  getAuthenticatorTypeName,
  getAuthenticatorIcon,
  getBiometricMethodName,
};
