import { describe, it, expect, beforeEach } from 'vitest';
import {
  encrypt,
  decrypt,
  aegis256Encrypt,
  aegis256Decrypt,
  generateAegis256Key,
  encryptString,
  decryptString,
  serializeAegis256Data,
  deserializeAegis256Data,
  aegis256Service,
  resetAegis256NonceManager,
  getAegis256NonceStatus,
  type Aegis256EncryptedData,
} from '@/lib/crypto/aegis256';

describe('AEGIS-256 Core Functions', () => {
  it('should encrypt and decrypt with explicit nonce', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Hello, AEGIS-256!');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    expect(ciphertext).toHaveLength(plaintext.length);
    expect(tag).toHaveLength(16);

    const decrypted = decrypt(key, nonce, ciphertext, tag);

    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Hello, AEGIS-256!');
  });

  it('should fail decryption with wrong key', () => {
    const key1 = generateAegis256Key();
    const key2 = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret message');

    const { ciphertext, tag } = encrypt(key1, nonce, plaintext);
    const decrypted = decrypt(key2, nonce, ciphertext, tag);

    expect(decrypted).toBeNull();
  });

  it('should fail decryption with wrong nonce', () => {
    const key = generateAegis256Key();
    const nonce1 = crypto.getRandomValues(new Uint8Array(32));
    const nonce2 = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret message');

    const { ciphertext, tag } = encrypt(key, nonce1, plaintext);
    const decrypted = decrypt(key, nonce2, ciphertext, tag);

    expect(decrypted).toBeNull();
  });

  it('should fail decryption with tampered ciphertext', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret message');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    // Tamper with ciphertext
    ciphertext[0] ^= 1;

    const decrypted = decrypt(key, nonce, ciphertext, tag);

    expect(decrypted).toBeNull();
  });

  it('should fail decryption with tampered tag', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Secret message');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    // Tamper with tag
    tag[0] ^= 1;

    const decrypted = decrypt(key, nonce, ciphertext, tag);

    expect(decrypted).toBeNull();
  });

  it('should handle empty plaintext', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new Uint8Array(0);

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    expect(ciphertext).toHaveLength(0);
    expect(tag).toHaveLength(16);

    const decrypted = decrypt(key, nonce, ciphertext, tag);

    expect(decrypted).not.toBeNull();
    expect(decrypted!).toHaveLength(0);
  });

  it('should handle various plaintext sizes', () => {
    const key = generateAegis256Key();
    const sizes = [1, 15, 16, 17, 31, 32, 33, 63, 64, 65, 1000, 10000];

    sizes.forEach(size => {
      const nonce = crypto.getRandomValues(new Uint8Array(32));
      const plaintext = crypto.getRandomValues(new Uint8Array(size));

      const { ciphertext, tag } = encrypt(key, nonce, plaintext);
      const decrypted = decrypt(key, nonce, ciphertext, tag);

      expect(decrypted).not.toBeNull();
      expect(decrypted!).toEqual(plaintext);
    });
  });
});

describe('AEGIS-256 Associated Data', () => {
  it('should authenticate associated data', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');
    const ad = new TextEncoder().encode('user@example.com');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext, ad);
    const decrypted = decrypt(key, nonce, ciphertext, tag, ad);

    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Message');
  });

  it('should fail with wrong associated data', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');
    const ad1 = new TextEncoder().encode('context-1');
    const ad2 = new TextEncoder().encode('context-2');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext, ad1);
    const decrypted = decrypt(key, nonce, ciphertext, tag, ad2);

    expect(decrypted).toBeNull();
  });

  it('should fail when AD is missing on decryption', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');
    const ad = new TextEncoder().encode('context');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext, ad);
    const decrypted = decrypt(key, nonce, ciphertext, tag);

    expect(decrypted).toBeNull();
  });

  it('should fail when AD is provided but was not used on encryption', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');
    const ad = new TextEncoder().encode('context');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);
    const decrypted = decrypt(key, nonce, ciphertext, tag, ad);

    expect(decrypted).toBeNull();
  });

  it('should handle empty associated data', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');
    const ad = new Uint8Array(0);

    const { ciphertext, tag } = encrypt(key, nonce, plaintext, ad);
    const decrypted = decrypt(key, nonce, ciphertext, tag, ad);

    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Message');
  });
});

describe('AEGIS-256 High-Level API', () => {
  beforeEach(() => {
    resetAegis256NonceManager();
  });

  it('should encrypt and decrypt with automatic nonce', () => {
    const key = generateAegis256Key();
    const plaintext = new TextEncoder().encode('Automatic nonce test');

    const encrypted = aegis256Encrypt(plaintext, key);

    expect(encrypted.nonce).toHaveLength(32);
    expect(encrypted.ciphertext).toHaveLength(plaintext.length);
    expect(encrypted.tag).toHaveLength(16);

    const decrypted = aegis256Decrypt(encrypted, key);

    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Automatic nonce test');
  });

  it('should generate unique nonces for multiple encryptions', () => {
    const key = generateAegis256Key();
    const plaintext = new TextEncoder().encode('Test');

    const encrypted1 = aegis256Encrypt(plaintext, key);
    const encrypted2 = aegis256Encrypt(plaintext, key);
    const encrypted3 = aegis256Encrypt(plaintext, key);

    // Nonces should be unique
    expect(encrypted1.nonce).not.toEqual(encrypted2.nonce);
    expect(encrypted2.nonce).not.toEqual(encrypted3.nonce);
    expect(encrypted1.nonce).not.toEqual(encrypted3.nonce);

    // All should decrypt correctly
    expect(aegis256Decrypt(encrypted1, key)).not.toBeNull();
    expect(aegis256Decrypt(encrypted2, key)).not.toBeNull();
    expect(aegis256Decrypt(encrypted3, key)).not.toBeNull();
  });

  it('should handle invalid key size', () => {
    const invalidKey = new Uint8Array(16); // Wrong size
    const plaintext = new TextEncoder().encode('Test');

    expect(() => aegis256Encrypt(plaintext, invalidKey)).toThrow();
  });

  it('should return null for invalid encrypted data size', () => {
    const key = generateAegis256Key();
    const invalidData: Aegis256EncryptedData = {
      ciphertext: new Uint8Array(10),
      nonce: new Uint8Array(16), // Wrong size
      tag: new Uint8Array(16),
    };

    const result = aegis256Decrypt(invalidData, key);
    expect(result).toBeNull();
  });
});

describe('AEGIS-256 String Helpers', () => {
  it('should encrypt and decrypt strings', () => {
    const key = generateAegis256Key();
    const text = 'Hello, AEGIS-256! 🔒';

    const encrypted = encryptString(text, key);
    const decrypted = decryptString(encrypted, key);

    expect(decrypted).toBe(text);
  });

  it('should return null for wrong key', () => {
    const key1 = generateAegis256Key();
    const key2 = generateAegis256Key();
    const text = 'Secret message';

    const encrypted = encryptString(text, key1);
    const decrypted = decryptString(encrypted, key2);

    expect(decrypted).toBeNull();
  });

  it('should handle empty strings', () => {
    const key = generateAegis256Key();
    const text = '';

    const encrypted = encryptString(text, key);
    const decrypted = decryptString(encrypted, key);

    expect(decrypted).toBe('');
  });

  it('should handle Unicode strings', () => {
    const key = generateAegis256Key();
    const text = '你好世界 🌍 مرحبا بالعالم';

    const encrypted = encryptString(text, key);
    const decrypted = decryptString(encrypted, key);

    expect(decrypted).toBe(text);
  });

  it('should handle string with associated data', () => {
    const key = generateAegis256Key();
    const text = 'Message';
    const context = 'user@example.com';

    const encrypted = encryptString(text, key, context);
    const decrypted = decryptString(encrypted, key, context);

    expect(decrypted).toBe(text);
  });

  it('should fail with wrong associated data', () => {
    const key = generateAegis256Key();
    const text = 'Message';

    const encrypted = encryptString(text, key, 'context-1');
    const decrypted = decryptString(encrypted, key, 'context-2');

    expect(decrypted).toBeNull();
  });
});

describe('AEGIS-256 Serialization', () => {
  it('should serialize and deserialize encrypted data', () => {
    const key = generateAegis256Key();
    const plaintext = new TextEncoder().encode('Serialization test');

    const encrypted = aegis256Encrypt(plaintext, key);
    const serialized = serializeAegis256Data(encrypted);

    expect(typeof serialized).toBe('string');
    expect(serialized.length).toBeGreaterThan(0);

    const deserialized = deserializeAegis256Data(serialized);

    expect(deserialized.nonce).toEqual(encrypted.nonce);
    expect(deserialized.ciphertext).toEqual(encrypted.ciphertext);
    expect(deserialized.tag).toEqual(encrypted.tag);

    const decrypted = aegis256Decrypt(deserialized, key);
    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Serialization test');
  });

  it('should handle large data serialization', () => {
    const key = generateAegis256Key();
    const plaintext = new Uint8Array(100000); // 100KB
    for (let i = 0; i < plaintext.length; i++) {
      plaintext[i] = i % 256;
    }

    const encrypted = aegis256Encrypt(plaintext, key);
    const serialized = serializeAegis256Data(encrypted);
    const deserialized = deserializeAegis256Data(serialized);

    const decrypted = aegis256Decrypt(deserialized, key);
    expect(decrypted).not.toBeNull();
    expect(decrypted!).toEqual(plaintext);
  });
});

describe('AEGIS-256 Service', () => {
  beforeEach(() => {
    aegis256Service.resetNonceManager();
  });

  it('should provide singleton instance', () => {
    const instance1 = aegis256Service;
    const instance2 = aegis256Service;

    expect(instance1).toBe(instance2);
  });

  it('should generate valid keys', () => {
    const key = aegis256Service.generateKey();

    expect(key).toHaveLength(32);
    expect(key).toBeInstanceOf(Uint8Array);
  });

  it('should encrypt and decrypt', () => {
    const key = aegis256Service.generateKey();
    const plaintext = new TextEncoder().encode('Service test');

    const encrypted = aegis256Service.encrypt(plaintext, key);
    const decrypted = aegis256Service.decrypt(encrypted, key);

    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Service test');
  });

  it('should serialize and deserialize', () => {
    const key = aegis256Service.generateKey();
    const plaintext = new TextEncoder().encode('Serialize test');

    const encrypted = aegis256Service.encrypt(plaintext, key);
    const serialized = aegis256Service.serialize(encrypted);
    const deserialized = aegis256Service.deserialize(serialized);

    const decrypted = aegis256Service.decrypt(deserialized, key);
    expect(decrypted).not.toBeNull();
    expect(new TextDecoder().decode(decrypted!)).toBe('Serialize test');
  });

  it('should track nonce counter', () => {
    aegis256Service.resetNonceManager();

    const key = aegis256Service.generateKey();
    const plaintext = new TextEncoder().encode('Test');

    const status1 = aegis256Service.getNonceStatus();
    expect(status1.counter).toBe(0n);

    aegis256Service.encrypt(plaintext, key);

    const status2 = aegis256Service.getNonceStatus();
    expect(status2.counter).toBe(1n);

    aegis256Service.encrypt(plaintext, key);
    aegis256Service.encrypt(plaintext, key);

    const status3 = aegis256Service.getNonceStatus();
    expect(status3.counter).toBe(3n);
  });

  it('should reset nonce manager', () => {
    const key = aegis256Service.generateKey();
    const plaintext = new TextEncoder().encode('Test');

    aegis256Service.encrypt(plaintext, key);
    aegis256Service.encrypt(plaintext, key);

    const statusBefore = aegis256Service.getNonceStatus();
    expect(statusBefore.counter).toBeGreaterThan(0n);

    aegis256Service.resetNonceManager();

    const statusAfter = aegis256Service.getNonceStatus();
    expect(statusAfter.counter).toBe(0n);
  });

  it('should not be near capacity initially', () => {
    aegis256Service.resetNonceManager();

    const status = aegis256Service.getNonceStatus();
    expect(status.isNearCapacity).toBe(false);
  });
});

describe('AEGIS-256 Edge Cases', () => {
  it('should handle maximum size plaintext (near block boundary)', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));

    // Test sizes around block boundaries
    const sizes = [15, 16, 17, 31, 32, 33, 47, 48, 49];

    sizes.forEach(size => {
      const plaintext = crypto.getRandomValues(new Uint8Array(size));
      const { ciphertext, tag } = encrypt(key, nonce, plaintext);
      const decrypted = decrypt(key, nonce, ciphertext, tag);

      expect(decrypted).not.toBeNull();
      expect(decrypted!).toEqual(plaintext);
    });
  });

  it('should produce different ciphertext for same plaintext with different nonces', () => {
    const key = generateAegis256Key();
    const nonce1 = crypto.getRandomValues(new Uint8Array(32));
    const nonce2 = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Same plaintext');

    const { ciphertext: ct1 } = encrypt(key, nonce1, plaintext);
    const { ciphertext: ct2 } = encrypt(key, nonce2, plaintext);

    expect(ct1).not.toEqual(ct2);
  });

  it('should produce different ciphertext for same plaintext with different keys', () => {
    const key1 = generateAegis256Key();
    const key2 = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Same plaintext');

    const { ciphertext: ct1 } = encrypt(key1, nonce, plaintext);
    const { ciphertext: ct2 } = encrypt(key2, nonce, plaintext);

    expect(ct1).not.toEqual(ct2);
  });

  it('should handle rapid sequential encryptions', () => {
    const key = aegis256Service.generateKey();
    const plaintext = new TextEncoder().encode('Rapid test');

    const encrypted = [];
    for (let i = 0; i < 100; i++) {
      encrypted.push(aegis256Service.encrypt(plaintext, key));
    }

    // All should have unique nonces
    const nonces = encrypted.map(e => e.nonce);
    const uniqueNonces = new Set(nonces.map(n => n.join(',')));
    expect(uniqueNonces.size).toBe(100);

    // All should decrypt correctly
    encrypted.forEach(enc => {
      const dec = aegis256Service.decrypt(enc, key);
      expect(dec).not.toBeNull();
      expect(new TextDecoder().decode(dec!)).toBe('Rapid test');
    });
  });
});

describe('AEGIS-256 Security Properties', () => {
  it('should fail constant-time comparison with single bit difference', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Security test');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    // Flip each bit in the tag and verify all fail
    for (let i = 0; i < tag.length; i++) {
      for (let bit = 0; bit < 8; bit++) {
        const tamperedTag = new Uint8Array(tag);
        tamperedTag[i] ^= (1 << bit);

        const decrypted = decrypt(key, nonce, ciphertext, tamperedTag);
        expect(decrypted).toBeNull();
      }
    }
  });

  it('should fail with truncated ciphertext', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('This is a longer message');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    // Try with truncated ciphertext
    const truncated = ciphertext.slice(0, ciphertext.length - 1);
    const decrypted = decrypt(key, nonce, truncated, tag);

    expect(decrypted).toBeNull();
  });

  it('should fail with extended ciphertext', () => {
    const key = generateAegis256Key();
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const plaintext = new TextEncoder().encode('Message');

    const { ciphertext, tag } = encrypt(key, nonce, plaintext);

    // Try with extended ciphertext
    const extended = new Uint8Array(ciphertext.length + 1);
    extended.set(ciphertext);
    extended[ciphertext.length] = 0;

    const decrypted = decrypt(key, nonce, extended, tag);

    expect(decrypted).toBeNull();
  });

  it('should produce unpredictable ciphertext', () => {
    const key = generateAegis256Key();
    const plaintext = new Uint8Array(32); // All zeros

    const encrypted1 = aegis256Service.encrypt(plaintext, key);
    const encrypted2 = aegis256Service.encrypt(plaintext, key);

    // Ciphertexts should be different (due to different nonces)
    expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);

    // But both should decrypt to same plaintext
    const dec1 = aegis256Service.decrypt(encrypted1, key);
    const dec2 = aegis256Service.decrypt(encrypted2, key);

    expect(dec1).toEqual(plaintext);
    expect(dec2).toEqual(plaintext);
  });
});

describe('AEGIS-256 Nonce Manager', () => {
  beforeEach(() => {
    resetAegis256NonceManager();
  });

  it('should start with counter at 0', () => {
    const status = getAegis256NonceStatus();
    expect(status.counter).toBe(0n);
  });

  it('should increment counter on each encryption', () => {
    const key = generateAegis256Key();
    const plaintext = new TextEncoder().encode('Test');

    for (let i = 0; i < 10; i++) {
      aegis256Encrypt(plaintext, key);
      const status = getAegis256NonceStatus();
      expect(status.counter).toBe(BigInt(i + 1));
    }
  });

  it('should reset counter after reset', () => {
    const key = generateAegis256Key();
    const plaintext = new TextEncoder().encode('Test');

    aegis256Encrypt(plaintext, key);
    aegis256Encrypt(plaintext, key);

    const statusBefore = getAegis256NonceStatus();
    expect(statusBefore.counter).toBe(2n);

    resetAegis256NonceManager();

    const statusAfter = getAegis256NonceStatus();
    expect(statusAfter.counter).toBe(0n);
  });
});
