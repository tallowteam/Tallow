/**
 * Biometric Capability Detection & Integration
 * Agent 018 — WEBAUTHN-GATEKEEPER
 *
 * Detects available biometric authentication methods and provides
 * a unified API for biometric operations. Works alongside webauthn.ts
 * for the full FIDO2/WebAuthn flow.
 *
 * Capabilities detected:
 * - Platform authenticator (Touch ID, Face ID, Windows Hello, fingerprint)
 * - Roaming authenticator (hardware security keys)
 * - User verification support
 * - Resident key support
 */

// ============================================================================
// TYPES
// ============================================================================

export type BiometricType =
  | 'fingerprint'
  | 'face'
  | 'iris'
  | 'voice'
  | 'platform'    // Generic platform authenticator
  | 'security-key' // Hardware security key
  | 'none';

export interface BiometricCapabilities {
  /** Whether any biometric authentication is available */
  available: boolean;
  /** Whether platform authenticator is available (Touch ID, Face ID, etc.) */
  platformAuthenticator: boolean;
  /** Whether WebAuthn API is supported */
  webauthnSupported: boolean;
  /** Whether PublicKeyCredential is available */
  publicKeyCredentialSupported: boolean;
  /** Whether user verification is available */
  userVerificationAvailable: boolean;
  /** Whether conditional mediation (autofill) is supported */
  conditionalMediationSupported: boolean;
  /** Detected biometric type */
  biometricType: BiometricType;
  /** Human-readable label for the biometric method */
  label: string;
  /** Platform information */
  platform: {
    os: string;
    browser: string;
    isMobile: boolean;
  };
}

export interface BiometricChallenge {
  challenge: Uint8Array;
  timeout: number;
  rpId: string;
  rpName: string;
}

export interface BiometricResult {
  success: boolean;
  credentialId?: string;
  attestation?: ArrayBuffer;
  error?: string;
}

// ============================================================================
// PLATFORM DETECTION
// ============================================================================

function detectPlatform(): BiometricCapabilities['platform'] {
  if (typeof navigator === 'undefined') {
    return { os: 'unknown', browser: 'unknown', isMobile: false };
  }

  const ua = navigator.userAgent;
  let os = 'unknown';
  let browser = 'unknown';
  let isMobile = false;

  // OS detection
  if (/Mac/.test(ua)) {os = 'macos';}
  else if (/Win/.test(ua)) {os = 'windows';}
  else if (/Linux/.test(ua)) {os = 'linux';}
  else if (/Android/.test(ua)) { os = 'android'; isMobile = true; }
  else if (/iPhone|iPad/.test(ua)) { os = 'ios'; isMobile = true; }

  // Browser detection
  if (/Chrome/.test(ua) && !/Edge/.test(ua)) {browser = 'chrome';}
  else if (/Firefox/.test(ua)) {browser = 'firefox';}
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {browser = 'safari';}
  else if (/Edge/.test(ua)) {browser = 'edge';}

  return { os, browser, isMobile };
}

function inferBiometricType(platform: BiometricCapabilities['platform']): BiometricType {
  switch (platform.os) {
    case 'macos':
    case 'ios':
      return 'fingerprint'; // Touch ID (or Face ID on newer devices)
    case 'windows':
      return 'face'; // Windows Hello (face or fingerprint)
    case 'android':
      return 'fingerprint'; // Most Android devices use fingerprint
    default:
      return 'platform';
  }
}

function getBiometricLabel(type: BiometricType, os: string): string {
  switch (os) {
    case 'macos':
    case 'ios':
      return 'Touch ID';
    case 'windows':
      return 'Windows Hello';
    case 'android':
      return 'Biometric Unlock';
    default:
      switch (type) {
        case 'fingerprint': return 'Fingerprint';
        case 'face': return 'Face Recognition';
        case 'security-key': return 'Security Key';
        default: return 'Biometric Authentication';
      }
  }
}

// ============================================================================
// CAPABILITY DETECTION
// ============================================================================

/**
 * Detect available biometric capabilities on the current device.
 */
export async function detectBiometricCapabilities(): Promise<BiometricCapabilities> {
  const platform = detectPlatform();
  const biometricType = inferBiometricType(platform);
  const label = getBiometricLabel(biometricType, platform.os);

  // Check WebAuthn API support
  const webauthnSupported = typeof window !== 'undefined' &&
    'PublicKeyCredential' in window;

  const publicKeyCredentialSupported = webauthnSupported &&
    typeof PublicKeyCredential !== 'undefined';

  // Check platform authenticator availability
  let platformAuthenticator = false;
  let userVerificationAvailable = false;
  let conditionalMediationSupported = false;

  if (publicKeyCredentialSupported) {
    try {
      platformAuthenticator = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      platformAuthenticator = false;
    }

    try {
      if ('isConditionalMediationAvailable' in PublicKeyCredential) {
        conditionalMediationSupported =
          await (PublicKeyCredential as unknown as {
            isConditionalMediationAvailable: () => Promise<boolean>;
          }).isConditionalMediationAvailable();
      }
    } catch {
      conditionalMediationSupported = false;
    }

    userVerificationAvailable = platformAuthenticator;
  }

  return {
    available: platformAuthenticator,
    platformAuthenticator,
    webauthnSupported,
    publicKeyCredentialSupported,
    userVerificationAvailable,
    conditionalMediationSupported,
    biometricType: platformAuthenticator ? biometricType : 'none',
    label,
    platform,
  };
}

/**
 * Quick check if biometric auth is available (for conditional UI).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !('PublicKeyCredential' in window)) {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Generate a random challenge for biometric authentication.
 */
export function generateBiometricChallenge(
  rpId: string = 'tallow.app',
  rpName: string = 'Tallow',
  timeout: number = 60000
): BiometricChallenge {
  return {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    timeout,
    rpId,
    rpName,
  };
}
