/**
 * Biometric Capability Detection & Integration
 * Agent 018 -- WEBAUTHN-GATEKEEPER
 *
 * Detects available biometric authentication methods and provides
 * a unified API for biometric operations. Works alongside webauthn.ts
 * for the full FIDO2/WebAuthn flow.
 *
 * Capabilities detected:
 * - Platform authenticator (Touch ID, Face ID, Windows Hello, fingerprint)
 * - Roaming authenticator (YubiKey, Titan Security Key via USB/NFC/BLE)
 * - User verification support
 * - Resident key / discoverable credential support
 * - Conditional mediation (passkey autofill)
 *
 * SECURITY INVARIANTS:
 * 1. Biometric data never leaves the device -- WebAuthn handles locally
 * 2. Biometric is ALWAYS second-factor, never sole authentication
 * 3. Re-authentication required for key export/rotation operations
 */

import {
  isWebAuthnAvailable,
  registerCredential,
  authenticateCredential,
  type StoredCredential,
  type WebAuthnConfig,
  type RegistrationResult,
  type AuthenticationResult,
  type AttestationFormat,
  type AttestationTrustPath,
} from '../auth/webauthn';
import {
  useWebAuthnStore,
  createStoredCredentialFromAttestation,
} from '../auth/webauthn-store';

// ============================================================================
// TYPES
// ============================================================================

export type BiometricType =
  | 'fingerprint'
  | 'face'
  | 'iris'
  | 'voice'
  | 'platform'      // Generic platform authenticator
  | 'security-key'  // Hardware security key (roaming)
  | 'none';

export type AuthenticatorCategory = 'platform' | 'roaming' | 'any';

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
  /** Whether conditional mediation (autofill/passkey) is supported */
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
  /** Whether roaming authenticators (security keys) are supported */
  roamingAuthenticatorSupported: boolean;
}

export interface BiometricChallenge {
  challenge: Uint8Array;
  timeout: number;
  rpId: string;
  rpName: string;
}

export interface BiometricRegistrationOptions {
  /** Username for credential display */
  username: string;
  /** Display name for credential */
  displayName: string;
  /** Preferred authenticator category */
  authenticatorCategory?: AuthenticatorCategory;
  /** Custom device name for the credential */
  deviceName?: string;
  /** Existing credential IDs to exclude (prevent re-registration) */
  existingCredentialIds?: string[];
  /** WebAuthn configuration overrides */
  config?: Partial<WebAuthnConfig>;
}

export interface BiometricRegistrationResult {
  success: boolean;
  credential?: StoredCredential;
  attestationFormat?: AttestationFormat;
  attestationTrustPath?: AttestationTrustPath;
  aaguid?: string;
  error?: string;
}

export interface BiometricAuthenticationOptions {
  /** Stored credentials to allow for authentication */
  storedCredentials?: StoredCredential[];
  /** WebAuthn configuration overrides */
  config?: Partial<WebAuthnConfig>;
}

export interface BiometricAuthenticationResult {
  success: boolean;
  credentialId?: string;
  newCounter?: number;
  userHandle?: string;
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
  if (/Android/.test(ua)) { os = 'android'; isMobile = true; }
  else if (/iPhone|iPad/.test(ua)) { os = 'ios'; isMobile = true; }
  else if (/Mac/.test(ua)) { os = 'macos'; }
  else if (/Win/.test(ua)) { os = 'windows'; }
  else if (/Linux/.test(ua)) { os = 'linux'; }

  // Browser detection (order matters -- Edge includes Chrome in UA)
  if (/Edg/.test(ua)) { browser = 'edge'; }
  else if (/Chrome/.test(ua) && !/Edg/.test(ua)) { browser = 'chrome'; }
  else if (/Firefox/.test(ua)) { browser = 'firefox'; }
  else if (/Safari/.test(ua) && !/Chrome/.test(ua)) { browser = 'safari'; }

  return { os, browser, isMobile };
}

function inferBiometricType(platform: BiometricCapabilities['platform']): BiometricType {
  switch (platform.os) {
    case 'macos':
      return 'fingerprint'; // Touch ID
    case 'ios':
      return 'face'; // Face ID on modern devices, Touch ID on older
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
      return 'Touch ID';
    case 'ios':
      return 'Face ID or Touch ID';
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
 * Checks for both platform authenticators (biometrics) and roaming
 * authenticators (security keys).
 */
export async function detectBiometricCapabilities(): Promise<BiometricCapabilities> {
  const platform = detectPlatform();
  const biometricType = inferBiometricType(platform);
  const label = getBiometricLabel(biometricType, platform.os);

  const publicKeyCredentialSupported = typeof PublicKeyCredential !== 'undefined';
  const webauthnSupported = publicKeyCredentialSupported;

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

  // Roaming authenticators (USB/NFC/BLE security keys) are supported
  // whenever WebAuthn is available -- we cannot detect their physical presence
  const roamingAuthenticatorSupported = webauthnSupported;

  return {
    available: platformAuthenticator || roamingAuthenticatorSupported,
    platformAuthenticator,
    webauthnSupported,
    publicKeyCredentialSupported,
    userVerificationAvailable,
    conditionalMediationSupported,
    biometricType: platformAuthenticator ? biometricType : (roamingAuthenticatorSupported ? 'security-key' : 'none'),
    label,
    platform,
    roamingAuthenticatorSupported,
  };
}

/**
 * Quick check if biometric auth is available (for conditional UI).
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === 'undefined') {
      return false;
    }
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * Check if any WebAuthn authenticator (platform or roaming) is supported.
 */
export function isAnyAuthenticatorSupported(): boolean {
  return isWebAuthnAvailable();
}

/**
 * Generate a random challenge for biometric authentication.
 */
export function generateBiometricChallenge(
  rpId: string = typeof window !== 'undefined' ? window.location.hostname : 'localhost',
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

// ============================================================================
// HIGH-LEVEL REGISTRATION
// ============================================================================

/**
 * Register a new biometric credential with full attestation verification.
 *
 * This is the primary entry point for biometric registration. It:
 * 1. Calls navigator.credentials.create() via the WebAuthn module
 * 2. Verifies the attestation response (format, signature, certificate chain)
 * 3. Stores the verified credential with encryption at rest
 *
 * Supports both platform authenticators (fingerprint/face) and roaming
 * authenticators (security keys) based on the authenticatorCategory option.
 */
export async function registerBiometric(
  options: BiometricRegistrationOptions
): Promise<BiometricRegistrationResult> {
  try {
    // Determine authenticator attachment preference
    let authenticatorAttachment: AuthenticatorAttachment | undefined;
    switch (options.authenticatorCategory) {
      case 'platform':
        authenticatorAttachment = 'platform';
        break;
      case 'roaming':
        authenticatorAttachment = 'cross-platform';
        break;
      case 'any':
      default:
        authenticatorAttachment = undefined; // let user choose
        break;
    }

    const config: Partial<WebAuthnConfig> = {
      ...options.config,
      ...(authenticatorAttachment ? { authenticatorAttachment } : {}),
    };

    // Register credential with attestation verification
    const result: RegistrationResult = await registerCredential(
      options.username,
      options.displayName,
      undefined,
      config,
      options.existingCredentialIds
    );

    // Extract transport info from the credential
    const response = result.credential.response as AuthenticatorAttestationResponse;
    const responseWithTransports = response as AuthenticatorAttestationResponse & {
      getTransports?: () => AuthenticatorTransport[];
    };
    const transports = typeof responseWithTransports.getTransports === 'function'
      ? responseWithTransports.getTransports() as AuthenticatorTransport[]
      : undefined;

    // Create stored credential from verified attestation data
    const storedCredential = createStoredCredentialFromAttestation(
      result.credential.id,
      result.attestation.publicKey,
      result.attestation.publicKeyAlgorithm,
      result.attestation.counter,
      result.attestation.aaguid,
      result.attestation.format,
      result.attestation.trustPath,
      (result.credential as PublicKeyCredential & {
        authenticatorAttachment?: 'platform' | 'cross-platform';
      }).authenticatorAttachment,
      transports,
      options.deviceName
    );

    // Store in encrypted IndexedDB via the store
    useWebAuthnStore.getState().addCredential(storedCredential);

    return {
      success: true,
      credential: storedCredential,
      attestationFormat: result.attestation.format,
      attestationTrustPath: result.attestation.trustPath,
      aaguid: result.attestation.aaguid,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown registration error',
    };
  }
}

// ============================================================================
// HIGH-LEVEL AUTHENTICATION
// ============================================================================

/**
 * Authenticate using a registered biometric credential.
 *
 * This is the primary entry point for biometric authentication. It:
 * 1. Retrieves stored credentials from the encrypted store
 * 2. Calls navigator.credentials.get() via the WebAuthn module
 * 3. Verifies the assertion (signature, counter, RP ID hash, flags)
 * 4. Updates the stored counter for clone detection
 *
 * @returns Authentication result with verified credential ID and updated counter
 */
export async function authenticateBiometric(
  options?: BiometricAuthenticationOptions
): Promise<BiometricAuthenticationResult> {
  try {
    const store = useWebAuthnStore.getState();

    // Use provided credentials or load from store
    const storedCredentials = options?.storedCredentials ?? store.credentials;

    if (storedCredentials.length === 0) {
      return {
        success: false,
        error: 'No registered credentials found',
      };
    }

    // Authenticate with assertion verification
    const result: AuthenticationResult = await authenticateCredential(
      storedCredentials,
      options?.config
    );

    if (!result.success) {
      return {
        success: false,
        credentialId: result.credentialId ?? '',
        error: result.error ?? 'Authentication failed',
      };
    }

    // Update stored counter from the verified assertion
    if (result.newCounter !== undefined && result.credentialId) {
      store.markCredentialUsed(result.credentialId, result.newCounter);
    }

    return {
      success: true,
      credentialId: result.credentialId,
      ...(result.newCounter !== undefined ? { newCounter: result.newCounter } : {}),
      ...(result.userHandle !== undefined ? { userHandle: result.userHandle } : {}),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown authentication error',
    };
  }
}

// ============================================================================
// CREDENTIAL MANAGEMENT
// ============================================================================

/**
 * Get all registered biometric credentials.
 */
export function getRegisteredCredentials(): StoredCredential[] {
  return useWebAuthnStore.getState().credentials;
}

/**
 * Get credentials filtered by authenticator type.
 */
export function getCredentialsByCategory(
  category: AuthenticatorCategory
): StoredCredential[] {
  const store = useWebAuthnStore.getState();
  switch (category) {
    case 'platform':
      return store.getCredentialsByType('platform');
    case 'roaming':
      return store.getCredentialsByType('cross-platform');
    case 'any':
    default:
      return store.credentials;
  }
}

/**
 * Remove a registered biometric credential.
 */
export function removeBiometricCredential(credentialId: string): void {
  useWebAuthnStore.getState().removeCredential(credentialId);
}

/**
 * Initialize the biometric store by hydrating from encrypted IndexedDB.
 * Should be called once during app initialization.
 */
export async function initializeBiometricStore(): Promise<void> {
  const store = useWebAuthnStore.getState();
  if (!store.hydrated) {
    await store.hydrateFromStorage();
  }
}
