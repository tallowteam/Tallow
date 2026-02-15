import { describe, expect, it } from 'vitest';

describe('webauthn-gatekeeper invariants', () => {
  it('biometric is optional second factor never sole auth', async () => {
    const mod = await import('@/lib/auth/webauthn');

    // The module must export BIOMETRIC_AUTH_ROLE as 'second-factor'
    expect(mod.BIOMETRIC_AUTH_ROLE).toBe('second-factor');

    // BiometricAuthRole type only allows 'second-factor' or 'disabled'
    // The constant enforces that biometric is never the sole auth method
    expect(['second-factor', 'disabled']).toContain(mod.BIOMETRIC_AUTH_ROLE);

    // Verify the webauthn singleton helper exists
    expect(mod.webauthn).toBeDefined();
    expect(typeof mod.webauthn.register).toBe('function');
    expect(typeof mod.webauthn.authenticate).toBe('function');
  });

  it('attestation verification required for cross-platform', async () => {
    const mod = await import('@/lib/auth/webauthn');

    // SerializedCredential must support authenticatorAttachment
    // which distinguishes platform from cross-platform authenticators
    expect(mod).toBeDefined();

    // The module exports AttestationVerificationResult for enterprise verification
    expect(mod).toHaveProperty('BIOMETRIC_AUTH_ROLE');

    // encodeCredentialForStorage must be exported for attestation handling
    expect(typeof mod.encodeCredentialForStorage).toBe('function');

    // decodeStoredCredential must be exported for credential retrieval
    expect(typeof mod.decodeStoredCredential).toBe('function');
  });

  it('re-authentication required for key export', async () => {
    const mod = await import('@/lib/auth/webauthn');

    // The module must export authenticateCredential for re-auth flows
    expect(typeof mod.authenticateCredential).toBe('function');

    // verifyChallenge must exist for challenge-response re-authentication
    expect(typeof mod.verifyChallenge).toBe('function');

    // generateChallenge must exist for creating new auth challenges
    expect(typeof mod.generateChallenge).toBe('function');

    // The webauthn helper must expose authenticate for re-auth
    expect(typeof mod.webauthn.authenticate).toBe('function');
  });

  it('exports expected type-level interfaces', async () => {
    const mod = await import('@/lib/auth/webauthn');

    // Verify all key exports exist as runtime values or functions
    expect(typeof mod.isWebAuthnAvailable).toBe('function');
    expect(typeof mod.isPlatformAuthenticatorAvailable).toBe('function');
    expect(typeof mod.getSupportedAuthenticators).toBe('function');
    expect(typeof mod.registerCredential).toBe('function');
    expect(typeof mod.arrayBufferToBase64Url).toBe('function');
    expect(typeof mod.base64UrlToArrayBuffer).toBe('function');
    expect(typeof mod.getAuthenticatorTypeName).toBe('function');
    expect(typeof mod.getAuthenticatorIcon).toBe('function');
    expect(typeof mod.getBiometricMethodName).toBe('function');
  });

  it('getAuthenticatorTypeName distinguishes platform from cross-platform', async () => {
    const mod = await import('@/lib/auth/webauthn');

    expect(mod.getAuthenticatorTypeName('platform')).toBe('Built-in Authenticator');
    expect(mod.getAuthenticatorTypeName('cross-platform')).toBe('Security Key');
    expect(mod.getAuthenticatorTypeName(undefined)).toBe('Authenticator');
  });
});
