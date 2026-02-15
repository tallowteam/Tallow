import { describe, expect, it } from 'vitest';
import {
  SYMMETRIC_AUTH_TAG_BYTES,
  SYMMETRIC_DIRECTION_RECEIVER,
  SYMMETRIC_DIRECTION_SENDER,
  SYMMETRIC_NONCE_BYTES,
  AEGIS_NONCE_BYTES,
  SymmetricNonceCounter,
  SymmetricSentinel,
  buildDirectionalNonce,
} from '@/lib/crypto/symmetric';
import {
  CIPHER_NONCE_SIZES,
  CIPHER_TAG_SIZES,
  CIPHER_KEY_SIZES,
  isCipherAllowedInFips,
  selectSymmetricCipher,
  getSupportedCiphers,
  negotiateCipher,
  isValidCipherAlgorithm,
  type SymmetricCipherAlgorithm,
} from '@/lib/crypto/cipher-selection';

// ---------------------------------------------------------------------------
// Nonce construction
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Nonce Construction', () => {
  it('builds 96-bit directional nonces with direction-flag + counter encoding', () => {
    const senderNonce = buildDirectionalNonce('sender', 7n);
    const receiverNonce = buildDirectionalNonce('receiver', 11n);

    expect(senderNonce).toHaveLength(SYMMETRIC_NONCE_BYTES);
    expect(receiverNonce).toHaveLength(SYMMETRIC_NONCE_BYTES);

    const senderView = new DataView(senderNonce.buffer, senderNonce.byteOffset, senderNonce.byteLength);
    const receiverView = new DataView(receiverNonce.buffer, receiverNonce.byteOffset, receiverNonce.byteLength);

    expect(senderView.getUint32(0, false)).toBe(SYMMETRIC_DIRECTION_SENDER);
    expect(senderView.getBigUint64(4, false)).toBe(7n);
    expect(receiverView.getUint32(0, false)).toBe(SYMMETRIC_DIRECTION_RECEIVER);
    expect(receiverView.getBigUint64(4, false)).toBe(11n);
  });

  it('rejects counter values outside the valid 64-bit range', () => {
    expect(() => buildDirectionalNonce('sender', -1n)).toThrow(/out of range/);
    expect(() => buildDirectionalNonce('sender', 2n ** 64n)).toThrow(/out of range/);
  });

  it('AEGIS_NONCE_BYTES is 32 (256-bit)', () => {
    expect(AEGIS_NONCE_BYTES).toBe(32);
  });
});

// ---------------------------------------------------------------------------
// Nonce counter
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Nonce Counter', () => {
  it('rejects nonce reuse within the same symmetric session', () => {
    const nonceCounter = new SymmetricNonceCounter();
    const nonce = nonceCounter.getNextNonce('sender');

    expect(() => nonceCounter.reserveNonce(nonce)).toThrow(/Nonce reuse detected/);
  });

  it('generates monotonically increasing sender and receiver counters independently', () => {
    const nc = new SymmetricNonceCounter();

    nc.getNextNonce('sender');   // counter 0
    nc.getNextNonce('sender');   // counter 1
    nc.getNextNonce('receiver'); // counter 0

    expect(nc.getCounter('sender')).toBe(2n);
    expect(nc.getCounter('receiver')).toBe(1n);
  });

  it('resets both counters and the used-nonce set', () => {
    const nc = new SymmetricNonceCounter();
    nc.getNextNonce('sender');
    nc.getNextNonce('receiver');

    nc.reset();

    expect(nc.getCounter('sender')).toBe(0n);
    expect(nc.getCounter('receiver')).toBe(0n);

    // After reset, nonce 0 should be usable again (no "reuse" error).
    expect(() => nc.getNextNonce('sender')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// AES-256-GCM round-trip
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: AES-256-GCM', () => {
  it('encrypts/decrypts with explicit auth tag bytes', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('symmetric-sentinel aes-gcm roundtrip');
    const aad = new TextEncoder().encode('chunk:42');

    const encrypted = await sentinel.encryptChunk(plaintext, key, {
      direction: 'sender',
      associatedData: aad,
    });

    expect(encrypted.cipher).toBe('AES-256-GCM');
    expect(encrypted.nonce).toHaveLength(SYMMETRIC_NONCE_BYTES);
    expect(encrypted.authTag).toHaveLength(SYMMETRIC_AUTH_TAG_BYTES);

    const decrypted = await sentinel.decryptChunk(encrypted, key, { associatedData: aad });
    expect(decrypted).toEqual(plaintext);
  });

  it('enforces auth-tag verification before plaintext release', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('tamper-check');
    const aad = new TextEncoder().encode('chunk:7');

    const encrypted = await sentinel.encryptChunk(plaintext, key, {
      direction: 'sender',
      associatedData: aad,
    });

    const tampered = {
      ...encrypted,
      authTag: new Uint8Array(encrypted.authTag),
    };
    tampered.authTag[0] ^= 0xff;

    await expect(
      sentinel.decryptChunk(tampered, key, { associatedData: aad })
    ).rejects.toThrow(/Authentication tag verification failed before plaintext release/);
  });

  it('rejects decryption when AAD differs', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('aad-mismatch');

    const encrypted = await sentinel.encryptChunk(plaintext, key, {
      direction: 'sender',
      associatedData: new TextEncoder().encode('aad-a'),
    });

    await expect(
      sentinel.decryptChunk(encrypted, key, {
        associatedData: new TextEncoder().encode('aad-b'),
      })
    ).rejects.toThrow(/Authentication tag verification failed/);
  });
});

// ---------------------------------------------------------------------------
// ChaCha20-Poly1305 round-trip
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: ChaCha20-Poly1305', () => {
  it('supports ChaCha20-Poly1305 with the same 96-bit nonce contract', async () => {
    const sentinel = new SymmetricSentinel('CHACHA20-POLY1305');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('symmetric-sentinel chacha roundtrip');

    const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    expect(encrypted.cipher).toBe('CHACHA20-POLY1305');
    expect(encrypted.nonce).toHaveLength(SYMMETRIC_NONCE_BYTES);
    expect(encrypted.authTag).toHaveLength(SYMMETRIC_AUTH_TAG_BYTES);

    const decrypted = await sentinel.decryptChunk(encrypted, key);
    expect(decrypted).toEqual(plaintext);
  });

  it('enforces auth-tag verification for ChaCha20', async () => {
    const sentinel = new SymmetricSentinel('CHACHA20-POLY1305');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('chacha tamper');

    const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    const tampered = { ...encrypted, authTag: new Uint8Array(encrypted.authTag) };
    tampered.authTag[0] ^= 0xff;

    await expect(sentinel.decryptChunk(tampered, key)).rejects.toThrow(
      /Authentication tag verification failed/
    );
  });
});

// ---------------------------------------------------------------------------
// AEGIS-256 round-trip (through SymmetricSentinel)
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: AEGIS-256', () => {
  it('encrypts/decrypts with AEGIS-256 cipher through the sentinel', async () => {
    const sentinel = new SymmetricSentinel('AEGIS-256');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('symmetric-sentinel aegis-256 roundtrip');
    const aad = new TextEncoder().encode('chunk:99');

    const encrypted = await sentinel.encryptChunk(plaintext, key, {
      direction: 'sender',
      associatedData: aad,
    });

    expect(encrypted.cipher).toBe('AEGIS-256');
    // The stored nonce should still be 12 bytes (the counter nonce, not the expanded one).
    expect(encrypted.nonce).toHaveLength(SYMMETRIC_NONCE_BYTES);
    expect(encrypted.authTag).toHaveLength(SYMMETRIC_AUTH_TAG_BYTES);

    const decrypted = await sentinel.decryptChunk(encrypted, key, { associatedData: aad });
    expect(decrypted).toEqual(plaintext);
  });

  it('enforces auth-tag verification for AEGIS-256', async () => {
    const sentinel = new SymmetricSentinel('AEGIS-256');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('aegis tamper');

    const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    const tampered = { ...encrypted, authTag: new Uint8Array(encrypted.authTag) };
    tampered.authTag[0] ^= 0xff;

    await expect(sentinel.decryptChunk(tampered, key)).rejects.toThrow(
      /Authentication tag verification failed/
    );
  });

  it('rejects decryption when AAD differs for AEGIS-256', async () => {
    const sentinel = new SymmetricSentinel('AEGIS-256');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('aegis aad test');

    const encrypted = await sentinel.encryptChunk(plaintext, key, {
      direction: 'sender',
      associatedData: new TextEncoder().encode('context-1'),
    });

    await expect(
      sentinel.decryptChunk(encrypted, key, {
        associatedData: new TextEncoder().encode('context-2'),
      })
    ).rejects.toThrow(/Authentication tag verification failed/);
  });

  it('handles empty plaintext with AEGIS-256', async () => {
    const sentinel = new SymmetricSentinel('AEGIS-256');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new Uint8Array(0);

    const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    expect(encrypted.ciphertext).toHaveLength(0);

    const decrypted = await sentinel.decryptChunk(encrypted, key);
    expect(decrypted).toHaveLength(0);
  });

  it('handles various sizes near block boundaries with AEGIS-256', async () => {
    const sentinel = new SymmetricSentinel('AEGIS-256');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const sizes = [1, 15, 16, 17, 31, 32, 33, 63, 64, 65, 256, 1000];

    for (const size of sizes) {
      const plaintext = crypto.getRandomValues(new Uint8Array(size));
      const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
      const decrypted = await sentinel.decryptChunk(encrypted, key);
      expect(decrypted).toEqual(plaintext);
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-cipher interop (negative tests)
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Cross-cipher rejection', () => {
  it('cannot decrypt AES-256-GCM data with ChaCha20-Poly1305', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('cross-cipher test');

    const encrypted = await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });

    await expect(
      sentinel.decryptChunk(encrypted, key, { cipher: 'CHACHA20-POLY1305' })
    ).rejects.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Cipher selection
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Cipher Selection', () => {
  it('returns AES-256-GCM in FIPS mode regardless of other preferences', () => {
    const result = selectSymmetricCipher({
      fipsMode: true,
      preferAegis: true,
      preferChaCha: true,
    });
    expect(result).toBe('AES-256-GCM');
  });

  it('returns AES-256-GCM as default when no preferences are set', () => {
    const result = selectSymmetricCipher({});
    // In test (Node.js with WebCrypto), AES-256-GCM should be selected.
    expect(result).toBe('AES-256-GCM');
  });

  it('returns AEGIS-256 when preferred and AES-NI is hinted', () => {
    const result = selectSymmetricCipher({ preferAegis: true, allowAegis: true });
    // In test environment (Node.js, no navigator), hasAesNiHint() returns true.
    expect(result).toBe('AEGIS-256');
  });

  it('returns ChaCha20-Poly1305 when preferred', () => {
    const result = selectSymmetricCipher({ preferChaCha: true });
    expect(result).toBe('CHACHA20-POLY1305');
  });

  it('does not select AEGIS-256 when disallowed', () => {
    const result = selectSymmetricCipher({ preferAegis: true, allowAegis: false });
    expect(result).not.toBe('AEGIS-256');
  });
});

describe('SYMMETRIC-SENTINEL: Cipher Metadata Constants', () => {
  it('exposes correct nonce sizes for all ciphers', () => {
    expect(CIPHER_NONCE_SIZES['AES-256-GCM']).toBe(12);
    expect(CIPHER_NONCE_SIZES['CHACHA20-POLY1305']).toBe(12);
    expect(CIPHER_NONCE_SIZES['AEGIS-256']).toBe(32);
  });

  it('exposes correct tag sizes for all ciphers', () => {
    expect(CIPHER_TAG_SIZES['AES-256-GCM']).toBe(16);
    expect(CIPHER_TAG_SIZES['CHACHA20-POLY1305']).toBe(16);
    expect(CIPHER_TAG_SIZES['AEGIS-256']).toBe(16);
  });

  it('exposes correct key sizes for all ciphers', () => {
    expect(CIPHER_KEY_SIZES['AES-256-GCM']).toBe(32);
    expect(CIPHER_KEY_SIZES['CHACHA20-POLY1305']).toBe(32);
    expect(CIPHER_KEY_SIZES['AEGIS-256']).toBe(32);
  });
});

describe('SYMMETRIC-SENTINEL: FIPS Compliance', () => {
  it('only allows AES-256-GCM in FIPS mode', () => {
    expect(isCipherAllowedInFips('AES-256-GCM')).toBe(true);
    expect(isCipherAllowedInFips('CHACHA20-POLY1305')).toBe(false);
    expect(isCipherAllowedInFips('AEGIS-256')).toBe(false);
  });
});

describe('SYMMETRIC-SENTINEL: Cipher Negotiation', () => {
  it('negotiates the first common cipher (initiator preference wins)', () => {
    const result = negotiateCipher(
      ['AEGIS-256', 'AES-256-GCM'],
      ['AES-256-GCM', 'CHACHA20-POLY1305']
    );
    expect(result).toBe('AES-256-GCM');
  });

  it('returns null when no common cipher exists', () => {
    const result = negotiateCipher(['AEGIS-256'], ['CHACHA20-POLY1305']);
    expect(result).toBeNull();
  });

  it('returns the initiator preferred cipher when both support it', () => {
    const result = negotiateCipher(
      ['CHACHA20-POLY1305', 'AES-256-GCM'],
      ['AES-256-GCM', 'CHACHA20-POLY1305']
    );
    expect(result).toBe('CHACHA20-POLY1305');
  });
});

describe('SYMMETRIC-SENTINEL: getSupportedCiphers', () => {
  it('returns at least AES-256-GCM in a standard environment', () => {
    const ciphers = getSupportedCiphers();
    expect(ciphers).toContain('AES-256-GCM');
  });

  it('excludes ChaCha20-Poly1305 and AEGIS-256 in FIPS mode', () => {
    const ciphers = getSupportedCiphers({ fipsMode: true });
    expect(ciphers).not.toContain('CHACHA20-POLY1305');
    expect(ciphers).not.toContain('AEGIS-256');
    expect(ciphers).toContain('AES-256-GCM');
  });

  it('excludes AEGIS-256 when allowAegis is false', () => {
    const ciphers = getSupportedCiphers({ allowAegis: false });
    expect(ciphers).not.toContain('AEGIS-256');
  });
});

describe('SYMMETRIC-SENTINEL: isValidCipherAlgorithm', () => {
  it('accepts all three valid cipher names', () => {
    expect(isValidCipherAlgorithm('AES-256-GCM')).toBe(true);
    expect(isValidCipherAlgorithm('CHACHA20-POLY1305')).toBe(true);
    expect(isValidCipherAlgorithm('AEGIS-256')).toBe(true);
  });

  it('rejects invalid cipher names', () => {
    expect(isValidCipherAlgorithm('AES-128-GCM')).toBe(false);
    expect(isValidCipherAlgorithm('DES')).toBe(false);
    expect(isValidCipherAlgorithm('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SymmetricSentinel instance API
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Sentinel Instance API', () => {
  it('reports the default cipher', () => {
    const sentinel = new SymmetricSentinel('CHACHA20-POLY1305');
    expect(sentinel.getDefaultCipher()).toBe('CHACHA20-POLY1305');
  });

  it('allows changing the default cipher', () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    sentinel.setDefaultCipher('AEGIS-256');
    expect(sentinel.getDefaultCipher()).toBe('AEGIS-256');
  });

  it('exposes nonce size per cipher via static method', () => {
    expect(SymmetricSentinel.nonceSizeForCipher('AES-256-GCM')).toBe(12);
    expect(SymmetricSentinel.nonceSizeForCipher('CHACHA20-POLY1305')).toBe(12);
    expect(SymmetricSentinel.nonceSizeForCipher('AEGIS-256')).toBe(32);
  });

  it('tracks nonce counters per direction', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new Uint8Array(8);

    expect(sentinel.getNonceCounter('sender')).toBe(0n);
    expect(sentinel.getNonceCounter('receiver')).toBe(0n);

    await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    await sentinel.encryptChunk(plaintext, key, { direction: 'receiver' });

    expect(sentinel.getNonceCounter('sender')).toBe(2n);
    expect(sentinel.getNonceCounter('receiver')).toBe(1n);
  });

  it('resets nonce state', async () => {
    const sentinel = new SymmetricSentinel('AES-256-GCM');
    const key = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new Uint8Array(8);

    await sentinel.encryptChunk(plaintext, key, { direction: 'sender' });
    expect(sentinel.getNonceCounter('sender')).toBe(1n);

    sentinel.resetNonceState();
    expect(sentinel.getNonceCounter('sender')).toBe(0n);
    expect(sentinel.getNonceCounter('receiver')).toBe(0n);
  });
});

// ---------------------------------------------------------------------------
// Multi-cipher sequential encryption
// ---------------------------------------------------------------------------

describe('SYMMETRIC-SENTINEL: Multi-cipher pipeline', () => {
  const ciphers: SymmetricCipherAlgorithm[] = ['AES-256-GCM', 'CHACHA20-POLY1305', 'AEGIS-256'];

  for (const cipher of ciphers) {
    it(`round-trips 10 sequential chunks with ${cipher}`, async () => {
      const sentinel = new SymmetricSentinel(cipher);
      const key = crypto.getRandomValues(new Uint8Array(32));

      for (let i = 0; i < 10; i++) {
        const plaintext = new TextEncoder().encode(`chunk-${i}-${cipher}`);
        const aad = new Uint8Array(4);
        new DataView(aad.buffer).setUint32(0, i, false);

        const encrypted = await sentinel.encryptChunk(plaintext, key, {
          direction: 'sender',
          associatedData: aad,
        });

        const decrypted = await sentinel.decryptChunk(encrypted, key, {
          associatedData: aad,
        });

        expect(new TextDecoder().decode(decrypted)).toBe(`chunk-${i}-${cipher}`);
      }

      expect(sentinel.getNonceCounter('sender')).toBe(10n);
    });
  }
});
