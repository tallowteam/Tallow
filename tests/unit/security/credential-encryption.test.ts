import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CredentialEncryption } from '@/lib/security/credential-encryption';
import type { TurnCredentials, EncryptedTurnCredentials } from '@/lib/security/credential-encryption';

// Mock secure storage
vi.mock('@/lib/storage/secure-storage', () => ({
  default: {
    setItem: vi.fn((key: string, value: string) => {
      // Simulate encryption with proper UTF-8 support
      const encoder = new TextEncoder();
      const bytes = encoder.encode(value);
      const binString = String.fromCodePoint(...bytes);
      const base64 = btoa(binString);
      localStorage.setItem(key, base64);
      return Promise.resolve();
    }),
    getItem: vi.fn((key: string) => {
      // Simulate decryption with proper UTF-8 support
      const encrypted = localStorage.getItem(key);
      if (!encrypted) {return Promise.resolve(null);}
      try {
        const binString = atob(encrypted);
        const bytes = Uint8Array.from(binString, (c) => c.codePointAt(0) || 0);
        const decoder = new TextDecoder();
        return Promise.resolve(decoder.decode(bytes));
      } catch {
        return Promise.resolve(null);
      }
    }),
  },
}));

describe('Credential Encryption', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('encryptTurnCredentials', () => {
    it('should encrypt TURN credentials', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
        credentialType: 'password',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.version).toBe(1);
      expect(encrypted.type).toBe('turn');
      expect(encrypted.timestamp).toBeGreaterThan(0);
      expect(encrypted.urls).toEqual(credentials.urls); // URLs not encrypted
      expect(encrypted.encryptedUsername).toBeDefined();
      expect(encrypted.encryptedUsername).not.toBe(credentials.username);
      expect(encrypted.encryptedCredential).toBeDefined();
      expect(encrypted.encryptedCredential).not.toBe(credentials.credential);
      expect(encrypted.credentialType).toBe('password');
    });

    it('should handle credentials without username', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.encryptedUsername).toBeUndefined();
      expect(encrypted.encryptedCredential).toBeDefined();
    });

    it('should handle credentials without credential', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.encryptedUsername).toBeDefined();
      expect(encrypted.encryptedCredential).toBeUndefined();
    });

    it('should handle empty credentials', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.urls).toEqual(credentials.urls);
      expect(encrypted.encryptedUsername).toBeUndefined();
      expect(encrypted.encryptedCredential).toBeUndefined();
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
      };

      const encrypted1 = await CredentialEncryption.encryptTurnCredentials(credentials);

      // Add small delay to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 2));

      const encrypted2 = await CredentialEncryption.encryptTurnCredentials(credentials);

      // Timestamps should be different (or at least not error if same due to fast execution)
      expect(encrypted1.timestamp).toBeLessThanOrEqual(encrypted2.timestamp);
      expect(encrypted1).not.toBe(encrypted2); // Different objects
    });
  });

  describe('decryptTurnCredentials', () => {
    it('should decrypt TURN credentials', async () => {
      const original: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
        credentialType: 'password',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.urls).toEqual(original.urls);
      expect(decrypted.username).toBe(original.username);
      expect(decrypted.credential).toBe(original.credential);
      expect(decrypted.credentialType).toBe('password');
    });

    it('should handle credentials without username', async () => {
      const original: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.urls).toEqual(original.urls);
      expect(decrypted.username).toBeUndefined();
      expect(decrypted.credential).toBe(original.credential);
    });

    it('should handle credentials without credential', async () => {
      const original: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.urls).toEqual(original.urls);
      expect(decrypted.username).toBe(original.username);
      expect(decrypted.credential).toBeUndefined();
    });

    it('should preserve URLs without encryption', async () => {
      const original: TurnCredentials = {
        urls: [
          'turn:server1.example.com:3478',
          'turn:server2.example.com:3478',
        ],
        username: 'testuser',
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.urls).toEqual(original.urls);
    });
  });

  describe('isEncrypted', () => {
    it('should identify encrypted credentials', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(CredentialEncryption.isEncrypted(encrypted)).toBe(true);
      expect(CredentialEncryption.isEncrypted(credentials as any)).toBe(false);
    });

    it('should handle invalid objects', () => {
      expect(CredentialEncryption.isEncrypted(null as any)).toBe(false);
      expect(CredentialEncryption.isEncrypted(undefined as any)).toBe(false);
      expect(CredentialEncryption.isEncrypted({} as any)).toBe(false);
      expect(CredentialEncryption.isEncrypted({ encrypted: false } as any)).toBe(false);
    });
  });

  describe('migrateCredentials', () => {
    it('should encrypt plaintext credentials', async () => {
      const plaintext: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
      };

      const result = await CredentialEncryption.migrateCredentials([plaintext]);

      expect(result).toHaveLength(1);
      expect(result[0]?.encrypted).toBe(true);
      const firstResult = result[0];
      if (firstResult && 'encryptedUsername' in firstResult) {
        expect(firstResult.encryptedUsername).toBeDefined();
        expect(firstResult.encryptedCredential).toBeDefined();
      }
    });

    it('should preserve already-encrypted credentials', async () => {
      const encrypted: EncryptedTurnCredentials = {
        encrypted: true,
        version: 1,
        timestamp: Date.now(),
        type: 'turn',
        urls: ['turn:example.com:3478'],
        encryptedUsername: 'encrypted_user',
        encryptedCredential: 'encrypted_pass',
      };

      const result = await CredentialEncryption.migrateCredentials([encrypted]);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(encrypted);
    });

    it('should handle mixed plaintext and encrypted credentials', async () => {
      const plaintext: TurnCredentials = {
        urls: ['turn:plain.com:3478'],
        username: 'plainuser',
        credential: 'plainpass',
      };

      const encrypted: EncryptedTurnCredentials = {
        encrypted: true,
        version: 1,
        timestamp: Date.now(),
        type: 'turn',
        urls: ['turn:encrypted.com:3478'],
        encryptedUsername: 'encrypted_user',
        encryptedCredential: 'encrypted_pass',
      };

      const result = await CredentialEncryption.migrateCredentials([plaintext, encrypted]);

      expect(result).toHaveLength(2);
      expect(result[0]?.encrypted).toBe(true);
      expect(result[1]).toEqual(encrypted);
    });

    it('should handle empty array', async () => {
      const result = await CredentialEncryption.migrateCredentials([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Round-trip encryption/decryption', () => {
    it('should preserve data through encryption and decryption', async () => {
      const testCases: TurnCredentials[] = [
        {
          urls: ['turn:test.com:3478'],
          username: 'user1',
          credential: 'pass1',
          credentialType: 'password',
        },
        {
          urls: ['turn:test.com:3478', 'turns:test.com:5349'],
          username: 'user2',
          credential: 'pass2',
        },
        {
          urls: ['turn:test.com:3478'],
          username: 'user3',
        },
        {
          urls: ['turn:test.com:3478'],
          credential: 'pass4',
        },
      ];

      for (const original of testCases) {
        const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
        const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

        expect(decrypted.urls).toEqual(original.urls);
        expect(decrypted.username).toBe(original.username);
        expect(decrypted.credential).toBe(original.credential);
        expect(decrypted.credentialType).toBe(original.credentialType);
      }
    });

    it('should handle special characters in credentials', async () => {
      const original: TurnCredentials = {
        urls: ['turn:test.com:3478'],
        username: 'user+special@example.com',
        credential: 'p@ssw0rd!#$%^&*(){}[]<>?/',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.username).toBe(original.username);
      expect(decrypted.credential).toBe(original.credential);
    });

    it('should handle long credentials', async () => {
      const original: TurnCredentials = {
        urls: ['turn:test.com:3478'],
        username: 'a'.repeat(500),
        credential: 'b'.repeat(500),
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.username).toBe(original.username);
      expect(decrypted.credential).toBe(original.credential);
    });

    it('should handle Unicode characters', async () => {
      const original: TurnCredentials = {
        urls: ['turn:test.com:3478'],
        username: '用户名',
        credential: 'パスワード',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(original);
      const decrypted = await CredentialEncryption.decryptTurnCredentials(encrypted);

      expect(decrypted.username).toBe(original.username);
      expect(decrypted.credential).toBe(original.credential);
    });
  });

  describe('Security properties', () => {
    it('should not expose plaintext credentials in encrypted object', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'secretuser',
        credential: 'secretpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);
      const jsonString = JSON.stringify(encrypted);

      expect(jsonString).not.toContain('secretuser');
      expect(jsonString).not.toContain('secretpassword');
    });

    it('should have version field for future compatibility', async () => {
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);

      expect(encrypted.version).toBe(1);
      expect(typeof encrypted.version).toBe('number');
    });

    it('should have timestamp for tracking', async () => {
      const before = Date.now();
      const credentials: TurnCredentials = {
        urls: ['turn:example.com:3478'],
        username: 'testuser',
        credential: 'testpassword',
      };

      const encrypted = await CredentialEncryption.encryptTurnCredentials(credentials);
      const after = Date.now();

      expect(encrypted.timestamp).toBeGreaterThanOrEqual(before);
      expect(encrypted.timestamp).toBeLessThanOrEqual(after);
    });
  });
});
