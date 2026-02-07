/**
 * Authentication Module Exports
 *
 * Centralized exports for authentication functionality
 */

// WebAuthn/FIDO2 Biometric Authentication
export {
  isWebAuthnAvailable,
  isPlatformAuthenticatorAvailable,
  getSupportedAuthenticators,
  generateChallenge,
  generateUserId,
  arrayBufferToBase64Url,
  base64UrlToArrayBuffer,
  registerCredential,
  authenticateCredential,
  encodeCredentialForStorage,
  decodeStoredCredential,
  getAuthenticatorTypeName,
  getAuthenticatorIcon,
  getBiometricMethodName,
  verifyChallenge,
  webauthn,
} from './webauthn';

export type {
  SerializedCredential,
  StoredCredential,
  WebAuthnConfig,
  AuthenticationResult,
} from './webauthn';

// WebAuthn Store
export {
  useWebAuthnStore,
  generateDeviceName,
  createStoredCredential,
  webauthnStore,
} from './webauthn-store';

export type {
  WebAuthnStoreState,
} from './webauthn-store';
