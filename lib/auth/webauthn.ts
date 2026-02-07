'use client';

/**
 * WebAuthn/FIDO2 Biometric Authentication Module
 *
 * Implements optional device verification using fingerprint, Face ID, Touch ID,
 * or Windows Hello for enhanced security without requiring passwords.
 *
 * SECURITY IMPACT: 8 | PRIVACY IMPACT: 6
 * PRIORITY: HIGH
 */

import { captureException, addBreadcrumb } from '../monitoring/sentry';

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
  publicKey: string; // base64url encoded public key
  counter: number;
  createdAt: number;
  lastUsedAt: number;
  deviceName: string;
  authenticatorAttachment?: 'platform' | 'cross-platform';
  transports?: AuthenticatorTransport[];
}

export interface WebAuthnConfig {
  rpName: string;
  rpId: string;
  timeout: number;
  userVerification: UserVerificationRequirement;
  attestation: AttestationConveyancePreference;
}

export interface AuthenticationResult {
  success: boolean;
  credentialId: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
  error?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TIMEOUT = 60000; // 60 seconds
const CHALLENGE_SIZE = 32; // 32 bytes = 256 bits

// Relying Party configuration
const getDefaultConfig = (): WebAuthnConfig => ({
  rpName: 'Tallow',
  rpId: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
  timeout: DEFAULT_TIMEOUT,
  userVerification: 'preferred', // Use biometrics if available
  attestation: 'none', // Privacy-focused: don't request attestation
});

// ============================================================================
// WebAuthn Availability Check
// ============================================================================

/**
 * Check if WebAuthn is available in the current browser
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
 * Check if platform authenticator (biometrics) is available
 */
export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnAvailable()) {
    return false;
  }

  try {
    const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available === true;
  } catch (error) {
    addBreadcrumb('Platform authenticator check failed', 'webauthn', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return false;
  }
}

/**
 * Get supported authenticator attachment types
 */
export async function getSupportedAuthenticators(): Promise<{
  platform: boolean;
  crossPlatform: boolean;
}> {
  const platform = await isPlatformAuthenticatorAvailable();

  // Cross-platform authenticators (USB security keys) are harder to detect
  // We'll assume they're available if WebAuthn is supported
  const crossPlatform = isWebAuthnAvailable();

  return { platform, crossPlatform };
}

// ============================================================================
// Challenge Generation
// ============================================================================

/**
 * Generate a cryptographically secure random challenge
 */
export function generateChallenge(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(CHALLENGE_SIZE));
}

/**
 * Generate a random user ID
 */
export function generateUserId(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(16));
}

// ============================================================================
// Base64URL Encoding/Decoding
// ============================================================================

/**
 * Convert ArrayBuffer to base64url string
 */
export function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  // Convert to base64url
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Convert base64url string to ArrayBuffer
 */
export function base64UrlToArrayBuffer(base64url: string): ArrayBuffer {
  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if necessary
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

// ============================================================================
// Credential Registration
// ============================================================================

/**
 * Register a new WebAuthn credential (fingerprint, Face ID, etc.)
 *
 * @param username - User-friendly username (e.g., "Alice")
 * @param displayName - Display name (e.g., "Alice Johnson")
 * @param userId - Optional user ID (will be generated if not provided)
 * @param config - Optional WebAuthn configuration
 * @returns The created credential
 */
export async function registerCredential(
  username: string,
  displayName: string,
  userId?: Uint8Array,
  config?: Partial<WebAuthnConfig>
): Promise<PublicKeyCredential> {
  if (!isWebAuthnAvailable()) {
    throw new Error('WebAuthn is not available in this browser');
  }

  const fullConfig = { ...getDefaultConfig(), ...config };
  const challenge = generateChallenge();
  const userIdBytes = userId || generateUserId();

  addBreadcrumb('Starting WebAuthn registration', 'webauthn', {
    username,
    rpId: fullConfig.rpId,
    timeout: fullConfig.timeout,
  });

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
      // Prefer ES256 (ECDSA with SHA-256)
      { type: 'public-key', alg: -7 },
      // Also support RS256 (RSA with SHA-256)
      { type: 'public-key', alg: -257 },
      // EdDSA (Ed25519)
      { type: 'public-key', alg: -8 },
    ],
    authenticatorSelection: {
      // Prefer platform authenticators (biometrics)
      authenticatorAttachment: 'platform',
      // Require user verification (biometric or PIN)
      userVerification: fullConfig.userVerification,
      // Require resident key for passwordless
      residentKey: 'preferred',
      requireResidentKey: false,
    },
    attestation: fullConfig.attestation,
    timeout: fullConfig.timeout,
    // Exclude already registered credentials
    excludeCredentials: [],
  };

  try {
    const credential = await navigator.credentials.create({
      publicKey: publicKeyOptions,
    });

    if (!credential || credential.type !== 'public-key') {
      throw new Error('Failed to create credential');
    }

    addBreadcrumb('WebAuthn registration successful', 'webauthn', {
      credentialId: credential.id.slice(0, 16) + '...',
      type: credential.type,
    });

    return credential as PublicKeyCredential;
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
    } else {
      throw new Error(`Registration failed: ${errorMessage}`);
    }
  }
}

// ============================================================================
// Credential Authentication
// ============================================================================

/**
 * Authenticate using a registered credential
 *
 * @param credentialId - Optional credential ID to authenticate with (if known)
 * @param config - Optional WebAuthn configuration
 * @returns Authentication result with signature
 */
export async function authenticateCredential(
  credentialId?: string,
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
  const challenge = generateChallenge();

  addBreadcrumb('Starting WebAuthn authentication', 'webauthn', {
    hasCredentialId: !!credentialId,
    rpId: fullConfig.rpId,
  });

  const publicKeyOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: fullConfig.rpId,
    timeout: fullConfig.timeout,
    userVerification: fullConfig.userVerification,
    // If credential ID is provided, only allow that credential
    allowCredentials: credentialId
      ? [
          {
            type: 'public-key',
            id: base64UrlToArrayBuffer(credentialId),
            transports: ['internal', 'usb', 'nfc', 'ble'],
          },
        ]
      : [],
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

    const userHandleValue = response.userHandle
      ? arrayBufferToBase64Url(response.userHandle)
      : undefined;
    const result: AuthenticationResult = {
      success: true,
      credentialId: arrayBufferToBase64Url(pkAssertion.rawId),
      authenticatorData: arrayBufferToBase64Url(response.authenticatorData),
      signature: arrayBufferToBase64Url(response.signature),
      ...(userHandleValue ? { userHandle: userHandleValue } : {}),
    };

    addBreadcrumb('WebAuthn authentication successful', 'webauthn', {
      credentialId: result.credentialId.slice(0, 16) + '...',
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    captureException(error instanceof Error ? error : new Error('WebAuthn authentication failed'), {
      tags: { module: 'webauthn', operation: 'authenticateCredential' },
      extra: {
        hasCredentialId: !!credentialId,
        rpId: fullConfig.rpId,
        error: errorMessage,
      },
    });

    // Provide user-friendly error messages
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
 * Encode a PublicKeyCredential for storage
 */
export function encodeCredentialForStorage(
  credential: PublicKeyCredential
): SerializedCredential {
  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: arrayBufferToBase64Url(credential.rawId),
    type: 'public-key',
    response: {
      clientDataJSON: arrayBufferToBase64Url(response.clientDataJSON),
      attestationObject: arrayBufferToBase64Url(response.attestationObject),
    },
    authenticatorAttachment: (credential as any).authenticatorAttachment,
    // @ts-expect-error - getTransports may not be available in all browsers
    transports: response.getTransports?.() || [],
  };
}

/**
 * Create credential request options from stored credential
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
 * Get user-friendly name for authenticator type
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
 * Get icon name for authenticator type (for UI)
 */
export function getAuthenticatorIcon(
  attachment?: 'platform' | 'cross-platform'
): 'fingerprint' | 'key' {
  return attachment === 'platform' ? 'fingerprint' : 'key';
}

/**
 * Detect platform-specific biometric name
 */
export async function getBiometricMethodName(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'Biometric';
  }

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes('mac') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
    // macOS or iOS
    return userAgent.includes('iphone') || userAgent.includes('ipad')
      ? 'Face ID or Touch ID'
      : 'Touch ID';
  } else if (userAgent.includes('windows')) {
    // Windows
    return 'Windows Hello';
  } else if (userAgent.includes('android')) {
    // Android
    return 'Fingerprint or Face Unlock';
  }

  return 'Biometric';
}

/**
 * Verify that the challenge in client data matches expected challenge
 */
export function verifyChallenge(
  clientDataJSON: ArrayBuffer,
  expectedChallenge: Uint8Array
): boolean {
  try {
    const decoder = new TextDecoder('utf-8');
    const clientData = JSON.parse(decoder.decode(clientDataJSON));
    const receivedChallenge = base64UrlToArrayBuffer(clientData.challenge);

    // Compare challenges
    const receivedBytes = new Uint8Array(receivedChallenge);
    if (receivedBytes.length !== expectedChallenge.length) {
      return false;
    }

    for (let i = 0; i < expectedChallenge.length; i++) {
      if (receivedBytes[i] !== expectedChallenge[i]) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// Export singleton instance helper
// ============================================================================

export const webauthn = {
  isAvailable: isWebAuthnAvailable,
  isPlatformAvailable: isPlatformAuthenticatorAvailable,
  getSupportedAuthenticators,
  register: registerCredential,
  authenticate: authenticateCredential,
  encode: encodeCredentialForStorage,
  decode: decodeStoredCredential,
  getAuthenticatorTypeName,
  getAuthenticatorIcon,
  getBiometricMethodName,
};
