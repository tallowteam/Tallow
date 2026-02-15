import { describe, expect, it } from 'vitest';

import {
  consumeOneTimePrekey,
  generateIdentityKeyPair,
  generateSignedPrekey,
  initializePrekeyStore,
  rotateSignedPrekeyIfNeeded,
  secureDeletePrekeyPair,
  verifySignedPrekey,
} from '@/lib/crypto/signed-prekeys';
import { createKeyRotationManager } from '@/lib/security/key-rotation';

describe('key lifecycle invariants', () => {
  it('creates and verifies signed prekeys with identity signatures', async () => {
    const identity = generateIdentityKeyPair();
    const signedPrekey = await generateSignedPrekey(identity, 1);

    expect(signedPrekey.public.keyId).toBe(1);
    expect(verifySignedPrekey(signedPrekey.public, identity.publicKey)).toBe(true);
  });

  it('rotates stale signed prekeys and retains previous key for transition', async () => {
    const identity = generateIdentityKeyPair();
    const store = await initializePrekeyStore(identity);

    const oldKeyId = store.signedPrekey.public.keyId;
    store.signedPrekey.public.createdAt = Date.now() - (8 * 24 * 60 * 60 * 1000);

    const rotated = await rotateSignedPrekeyIfNeeded(store, identity);

    expect(rotated).toBe(true);
    expect(store.previousSignedPrekey?.public.keyId).toBe(oldKeyId);
    expect(store.signedPrekey.public.keyId).not.toBe(oldKeyId);
  });

  it('revokes one-time prekeys by consuming them once', async () => {
    const identity = generateIdentityKeyPair();
    const store = await initializePrekeyStore(identity);
    const prekeyId = store.oneTimePrekeys[0]?.public.keyId;

    expect(prekeyId).toBeDefined();
    if (prekeyId === undefined) {
      throw new Error('Expected one-time prekey to exist');
    }

    const firstUse = consumeOneTimePrekey(store, prekeyId);
    const secondUse = consumeOneTimePrekey(store, prekeyId);

    expect(firstUse).not.toBeNull();
    expect(secondUse).toBeNull();
  });

  it('destroys key material by securely wiping private prekey bytes', async () => {
    const identity = generateIdentityKeyPair();
    const signedPrekey = await generateSignedPrekey(identity, 9);

    secureDeletePrekeyPair(signedPrekey.private);

    expect(
      Array.from(signedPrekey.private.kyber.secretKey).every((byte) => byte === 0)
    ).toBe(true);
    expect(
      Array.from(signedPrekey.private.x25519.privateKey).every((byte) => byte === 0)
    ).toBe(true);
  });

  it('rotates and destroys session keys with forward-secrecy manager', () => {
    const manager = createKeyRotationManager({ enableAutoRotation: false });
    const initialSecret = crypto.getRandomValues(new Uint8Array(32));

    const initial = manager.initialize(initialSecret);
    const rotated = manager.rotateKeys();

    expect(initial.generation).toBe(0);
    expect(rotated.generation).toBe(1);

    manager.destroy();

    expect(Array.from(rotated.encryptionKey).every((byte) => byte === 0)).toBe(true);
    expect(Array.from(rotated.authKey).every((byte) => byte === 0)).toBe(true);
    expect(manager.getCurrentKeys()).toBeNull();
  });
});
