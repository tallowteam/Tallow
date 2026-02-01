import { describe, it, expect } from 'vitest';
import {
  deriveRoomEncryptionKey,
  encryptRoomMessage,
  decryptRoomMessage,
  verifyMessageTimestamp,
} from '@/lib/rooms/room-crypto';

describe('Room Crypto', () => {
  describe('deriveRoomEncryptionKey', () => {
    it('should derive encryption key from room code', async () => {
      const roomCode = 'ABC12XYZ';
      const key = await deriveRoomEncryptionKey(roomCode);

      expect(key).toBeDefined();
      expect(key.key).toBeDefined();
      expect(key.version).toBe(1);
      expect(key.algorithm).toBe('PQC-HKDF-AES-256');
    });

    it('should derive same key for same room code', async () => {
      const roomCode = 'TEST1234';

      const key1 = await deriveRoomEncryptionKey(roomCode);
      const key2 = await deriveRoomEncryptionKey(roomCode);

      // Test that both keys can decrypt messages encrypted with the other
      const testMessage = { test: 'data' };
      const encrypted = await encryptRoomMessage(key1, testMessage);
      const decrypted = await decryptRoomMessage(key2, encrypted);

      expect(decrypted).toEqual(testMessage);
    });

    it('should derive different keys for different room codes', async () => {
      const key1 = await deriveRoomEncryptionKey('ROOM1111');
      const key2 = await deriveRoomEncryptionKey('ROOM2222');

      const testMessage = { test: 'data' };
      const encrypted1 = await encryptRoomMessage(key1, testMessage);

      // Should fail to decrypt with wrong key
      await expect(
        decryptRoomMessage(key2, encrypted1)
      ).rejects.toThrow();
    });

    it('should derive key with password protection', async () => {
      const roomCode = 'SECURE99';
      const password = 'mySecretPassword123';

      const keyWithPassword = await deriveRoomEncryptionKey(roomCode, password);

      expect(keyWithPassword).toBeDefined();
      expect(keyWithPassword.algorithm).toBe('PQC-HKDF-AES-256');
    });

    it('should derive different keys with and without password', async () => {
      const roomCode = 'ROOM5555';
      const password = 'password';

      const keyNoPassword = await deriveRoomEncryptionKey(roomCode);
      const keyWithPassword = await deriveRoomEncryptionKey(roomCode, password);

      const testMessage = { test: 'data' };
      const encrypted = await encryptRoomMessage(keyNoPassword, testMessage);

      // Should fail to decrypt with password-protected key
      await expect(
        decryptRoomMessage(keyWithPassword, encrypted)
      ).rejects.toThrow();
    });

    it('should be case-insensitive for room codes', async () => {
      const key1 = await deriveRoomEncryptionKey('TESTCODE');
      const key2 = await deriveRoomEncryptionKey('testcode');

      const testMessage = { test: 'data' };
      const encrypted = await encryptRoomMessage(key1, testMessage);
      const decrypted = await decryptRoomMessage(key2, encrypted);

      expect(decrypted).toEqual(testMessage);
    });
  });

  describe('encryptRoomMessage', () => {
    it('should encrypt messages correctly', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = {
        type: 'file-offer',
        fileName: 'test.pdf',
        fileSize: 12345,
      };

      const encrypted = await encryptRoomMessage(roomKey, message);

      expect(encrypted.encrypted).toBe(true);
      expect(encrypted.ct).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ts).toBeDefined();
      expect(encrypted.v).toBe(1);
      expect(typeof encrypted.ct).toBe('string');
      expect(typeof encrypted.iv).toBe('string');
    });

    it('should use unique IVs for each message', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted1 = await encryptRoomMessage(roomKey, message);
      const encrypted2 = await encryptRoomMessage(roomKey, message);

      // Same message should produce different ciphertexts due to unique IVs
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.ct).not.toBe(encrypted2.ct);
    });

    it('should handle different data types', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');

      const testCases = [
        { type: 'string', data: 'hello world' },
        { type: 'number', data: 42 },
        { type: 'boolean', data: true },
        { type: 'array', data: [1, 2, 3, 4, 5] },
        { type: 'nested', data: { level1: { level2: { value: 'deep' } } } },
        { type: 'null', data: null },
      ];

      for (const testCase of testCases) {
        const encrypted = await encryptRoomMessage(roomKey, testCase);
        expect(encrypted.encrypted).toBe(true);
      }
    });
  });

  describe('decryptRoomMessage', () => {
    it('should decrypt messages correctly', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const originalMessage = {
        type: 'member-joined',
        memberId: 'user-123',
        memberName: 'Alice',
      };

      const encrypted = await encryptRoomMessage(roomKey, originalMessage);
      const decrypted = await decryptRoomMessage(roomKey, encrypted);

      expect(decrypted).toEqual(originalMessage);
    });

    it('should preserve data types', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');

      const testCases = [
        { name: 'string', value: 'test string' },
        { name: 'number', value: 12345 },
        { name: 'boolean', value: true },
        { name: 'array', value: [1, 'two', 3] },
        { name: 'object', value: { nested: true, count: 42 } },
      ];

      for (const testCase of testCases) {
        const encrypted = await encryptRoomMessage(roomKey, testCase.value);
        const decrypted = await decryptRoomMessage(roomKey, encrypted);

        expect(decrypted).toEqual(testCase.value);
        expect(typeof decrypted).toBe(typeof testCase.value);
      }
    });

    it('should reject tampered ciphertext', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted = await encryptRoomMessage(roomKey, message);

      // Tamper with ciphertext
      const tamperedCt = encrypted.ct.split('').reverse().join('');
      const tampered = { ...encrypted, ct: tamperedCt };

      await expect(
        decryptRoomMessage(roomKey, tampered)
      ).rejects.toThrow();
    });

    it('should reject wrong IV', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted = await encryptRoomMessage(roomKey, message);

      // Use wrong IV
      const wrongIv = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(12))));
      const tampered = { ...encrypted, iv: wrongIv };

      await expect(
        decryptRoomMessage(roomKey, tampered)
      ).rejects.toThrow();
    });

    it('should fail with wrong encryption key', async () => {
      const roomKey1 = await deriveRoomEncryptionKey('ROOM1111');
      const roomKey2 = await deriveRoomEncryptionKey('ROOM2222');

      const message = { test: 'secret data' };
      const encrypted = await encryptRoomMessage(roomKey1, message);

      await expect(
        decryptRoomMessage(roomKey2, encrypted)
      ).rejects.toThrow();
    });
  });

  describe('Replay Protection', () => {
    it('should reject expired messages', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted = await encryptRoomMessage(roomKey, message);

      // Modify timestamp to be 31 seconds old
      const expired = { ...encrypted, ts: Date.now() - 31000 };

      await expect(
        decryptRoomMessage(roomKey, expired)
      ).rejects.toThrow(/expired|replay/i);
    });

    it('should accept fresh messages', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted = await encryptRoomMessage(roomKey, message);

      // Should work with current timestamp
      const decrypted = await decryptRoomMessage(roomKey, encrypted);
      expect(decrypted).toEqual(message);
    });

    it('should accept messages within replay window', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const message = { test: 'data' };

      const encrypted = await encryptRoomMessage(roomKey, message);

      // Set timestamp to 15 seconds ago (within 30s window)
      const recent = { ...encrypted, ts: Date.now() - 15000 };

      const decrypted = await decryptRoomMessage(roomKey, recent);
      expect(decrypted).toEqual(message);
    });
  });

  describe('verifyMessageTimestamp', () => {
    it('should accept current timestamp', () => {
      const now = Date.now();
      expect(verifyMessageTimestamp(now)).toBe(true);
    });

    it('should accept timestamp within max age', () => {
      const now = Date.now();
      expect(verifyMessageTimestamp(now - 30000, 60000)).toBe(true); // 30s ago, max 60s
      expect(verifyMessageTimestamp(now - 50000, 60000)).toBe(true); // 50s ago, max 60s
    });

    it('should reject timestamp exceeding max age', () => {
      const now = Date.now();
      expect(verifyMessageTimestamp(now - 70000, 60000)).toBe(false); // 70s ago, max 60s
    });

    it('should reject future timestamps', () => {
      const now = Date.now();
      expect(verifyMessageTimestamp(now + 1000)).toBe(false); // 1s in future
      expect(verifyMessageTimestamp(now + 10000)).toBe(false); // 10s in future
    });

    it('should use default max age if not specified', () => {
      const now = Date.now();
      expect(verifyMessageTimestamp(now - 30000)).toBe(true); // 30s ago (default 60s)
      expect(verifyMessageTimestamp(now - 70000)).toBe(false); // 70s ago (exceeds default)
    });
  });

  describe('Password Protection', () => {
    it('should require correct password to decrypt', async () => {
      const roomCode = 'SECURE88';
      const correctPassword = 'correctPassword123';
      const wrongPassword = 'wrongPassword456';

      const correctKey = await deriveRoomEncryptionKey(roomCode, correctPassword);
      const wrongKey = await deriveRoomEncryptionKey(roomCode, wrongPassword);

      const message = { secret: 'confidential data' };
      const encrypted = await encryptRoomMessage(correctKey, message);

      // Should work with correct password
      const decrypted = await decryptRoomMessage(correctKey, encrypted);
      expect(decrypted).toEqual(message);

      // Should fail with wrong password
      await expect(
        decryptRoomMessage(wrongKey, encrypted)
      ).rejects.toThrow();
    });

    it('should require password if message was encrypted with one', async () => {
      const roomCode = 'ROOM7777';
      const password = 'myPassword';

      const keyWithPassword = await deriveRoomEncryptionKey(roomCode, password);
      const keyWithoutPassword = await deriveRoomEncryptionKey(roomCode);

      const message = { protected: true };
      const encrypted = await encryptRoomMessage(keyWithPassword, message);

      // Should fail without password
      await expect(
        decryptRoomMessage(keyWithoutPassword, encrypted)
      ).rejects.toThrow();
    });
  });

  describe('Multi-Member Room Scenario', () => {
    it('should allow all members with correct credentials to communicate', async () => {
      const roomCode = 'SHARED99';
      const password = 'roomPassword';

      // Three members join the room
      const member1Key = await deriveRoomEncryptionKey(roomCode, password);
      const member2Key = await deriveRoomEncryptionKey(roomCode, password);
      const member3Key = await deriveRoomEncryptionKey(roomCode, password);

      // Member 1 sends message
      const message1 = { from: 'member1', text: 'Hello everyone!' };
      const encrypted1 = await encryptRoomMessage(member1Key, message1);

      // Members 2 and 3 can decrypt
      const decrypted1At2 = await decryptRoomMessage(member2Key, encrypted1);
      const decrypted1At3 = await decryptRoomMessage(member3Key, encrypted1);
      expect(decrypted1At2).toEqual(message1);
      expect(decrypted1At3).toEqual(message1);

      // Member 2 sends message
      const message2 = { from: 'member2', text: 'Hi back!' };
      const encrypted2 = await encryptRoomMessage(member2Key, message2);

      // Members 1 and 3 can decrypt
      const decrypted2At1 = await decryptRoomMessage(member1Key, encrypted2);
      const decrypted2At3 = await decryptRoomMessage(member3Key, encrypted2);
      expect(decrypted2At1).toEqual(message2);
      expect(decrypted2At3).toEqual(message2);
    });

    it('should prevent non-members from reading messages', async () => {
      const roomCode = 'PRIVATE1';
      const password = 'secretPassword';

      // Member with correct credentials
      const memberKey = await deriveRoomEncryptionKey(roomCode, password);

      // Attacker with wrong credentials
      const attackerKey = await deriveRoomEncryptionKey(roomCode, 'wrongPassword');

      const message = { secret: 'confidential information' };
      const encrypted = await encryptRoomMessage(memberKey, message);

      // Attacker should not be able to decrypt
      await expect(
        decryptRoomMessage(attackerKey, encrypted)
      ).rejects.toThrow();
    });
  });

  describe('Large Message Handling', () => {
    it('should handle large messages', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');

      // Create large message (1000 items)
      const largeMessage = {
        type: 'file-list',
        files: Array.from({ length: 1000 }, (_, i) => ({
          id: `file-${i}`,
          name: `document-${i}.pdf`,
          size: Math.floor(Math.random() * 10000000),
        })),
      };

      const encrypted = await encryptRoomMessage(roomKey, largeMessage);
      const decrypted = await decryptRoomMessage(roomKey, encrypted);

      expect(decrypted).toEqual(largeMessage);
    });

    it('should handle messages with special characters', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');

      const specialMessage = {
        text: '🚀 Hello 世界! © ® ™ €',
        emoji: '😀😃😄😁🤣',
        unicode: '\u0000\u0001\u0002',
        quotes: 'He said: "It\'s working!"',
      };

      const encrypted = await encryptRoomMessage(roomKey, specialMessage);
      const decrypted = await decryptRoomMessage(roomKey, encrypted);

      expect(decrypted).toEqual(specialMessage);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty messages', async () => {
      const roomKey = await deriveRoomEncryptionKey('ROOM1234');
      const emptyMessage = {};

      const encrypted = await encryptRoomMessage(roomKey, emptyMessage);
      const decrypted = await decryptRoomMessage(roomKey, encrypted);

      expect(decrypted).toEqual(emptyMessage);
    });

    it('should handle very short room codes', async () => {
      const shortCode = 'AB';
      const key = await deriveRoomEncryptionKey(shortCode);

      const message = { test: 'data' };
      const encrypted = await encryptRoomMessage(key, message);
      const decrypted = await decryptRoomMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it('should handle very long room codes', async () => {
      const longCode = 'A'.repeat(100);
      const key = await deriveRoomEncryptionKey(longCode);

      const message = { test: 'data' };
      const encrypted = await encryptRoomMessage(key, message);
      const decrypted = await decryptRoomMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });

    it('should handle special characters in password', async () => {
      const roomCode = 'ROOM1234';
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      const key = await deriveRoomEncryptionKey(roomCode, specialPassword);

      const message = { test: 'data' };
      const encrypted = await encryptRoomMessage(key, message);
      const decrypted = await decryptRoomMessage(key, encrypted);

      expect(decrypted).toEqual(message);
    });
  });
});
