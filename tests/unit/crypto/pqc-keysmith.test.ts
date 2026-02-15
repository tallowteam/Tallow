import { describe, expect, it } from 'vitest';
import {
  pqCrypto,
  PQC_DOMAIN_SESSION_AUTH_KEY,
  PQC_DOMAIN_SESSION_ENCRYPTION_KEY,
  PQC_DOMAIN_SESSION_ID,
} from '@/lib/crypto/pqc-crypto';

describe('pqc keysmith invariants', () => {
  it('defines explicit BLAKE3 domain separation contexts', () => {
    expect(PQC_DOMAIN_SESSION_ENCRYPTION_KEY).toBe('tallow.pqc.session.encryption-key.v1');
    expect(PQC_DOMAIN_SESSION_AUTH_KEY).toBe('tallow.pqc.session.auth-key.v1');
    expect(PQC_DOMAIN_SESSION_ID).toBe('tallow.pqc.session.id.v1');
  });

  it('derives distinct session keys from one shared secret', () => {
    const sharedSecret = pqCrypto.randomBytes(32);
    const sessionKeys = pqCrypto.deriveSessionKeys(sharedSecret);

    expect(sessionKeys.encryptionKey).toHaveLength(32);
    expect(sessionKeys.authKey).toHaveLength(32);
    expect(sessionKeys.sessionId).toHaveLength(16);
    expect(sessionKeys.encryptionKey).not.toEqual(sessionKeys.authKey);
    expect(sessionKeys.encryptionKey.slice(0, 16)).not.toEqual(sessionKeys.sessionId);
  });

  it('uses CSPRNG-backed random byte generation', () => {
    const bytes = pqCrypto.randomBytes(32);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes).toHaveLength(32);
    expect(Array.from(bytes).some((byte) => byte !== 0)).toBe(true);
  });
});
