import { describe, it, expect } from 'vitest';
import {
  deriveKeyFromPassword,
  calculatePasswordStrength,
  generateSalt,
} from '../../../lib/crypto/argon2-browser';

describe('Password-Based Encryption', () => {
  describe('deriveKeyFromPassword', () => {
    it('should derive a key from password and salt', async () => {
      const password = 'MySecurePassword123!';
      const salt = generateSalt();

      const key = await deriveKeyFromPassword(password, salt);

      expect(key).toBeInstanceOf(Uint8Array);
      expect(key.length).toBe(32); // 256 bits
    });

    it('should derive different keys for different passwords', async () => {
      const salt = generateSalt();
      const password1 = 'password1';
      const password2 = 'password2';

      const key1 = await deriveKeyFromPassword(password1, salt);
      const key2 = await deriveKeyFromPassword(password2, salt);

      expect(key1).not.toEqual(key2);
    });

    it('should derive different keys for different salts', async () => {
      const password = 'MyPassword';
      const salt1 = generateSalt();
      const salt2 = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt1);
      const key2 = await deriveKeyFromPassword(password, salt2);

      expect(key1).not.toEqual(key2);
    });

    it('should derive same key for same password and salt', async () => {
      const password = 'MyPassword';
      const salt = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt);
      const key2 = await deriveKeyFromPassword(password, salt);

      expect(key1).toEqual(key2);
    });

    it('should support custom iterations', async () => {
      const password = 'MyPassword';
      const salt = generateSalt();

      const key1 = await deriveKeyFromPassword(password, salt, { iterations: 100000 });
      const key2 = await deriveKeyFromPassword(password, salt, { iterations: 200000 });

      // Different iterations should produce different keys
      expect(key1).not.toEqual(key2);
    });
  });

  describe('calculatePasswordStrength', () => {
    it('should score very weak passwords as 0-1', () => {
      expect(calculatePasswordStrength('123').score).toBeLessThanOrEqual(1);
      expect(calculatePasswordStrength('password').score).toBeLessThanOrEqual(1);
      expect(calculatePasswordStrength('abc').score).toBeLessThanOrEqual(1);
    });

    it('should score weak passwords as 0-2', () => {
      const result = calculatePasswordStrength('password123');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(2);
    });

    it('should score medium passwords as 1-3', () => {
      const result = calculatePasswordStrength('Password123');
      expect(result.score).toBeGreaterThanOrEqual(1);
      expect(result.score).toBeLessThanOrEqual(3);
    });

    it('should score strong passwords as 3-4', () => {
      const result = calculatePasswordStrength('MySecure123!Pass');
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it('should provide feedback for weak passwords', () => {
      const result = calculatePasswordStrength('pass');
      expect(result.feedback.length).toBeGreaterThan(0);
      expect(result.feedback.some(f => f.includes('characters'))).toBe(true);
    });

    it('should reward length', () => {
      const short = calculatePasswordStrength('aB3!');
      const long = calculatePasswordStrength('aB3!aB3!aB3!aB3!');
      expect(long.score).toBeGreaterThan(short.score);
    });

    it('should reward complexity', () => {
      const simple = calculatePasswordStrength('passwordpassword');
      const complex = calculatePasswordStrength('P@ssw0rd!Complex');
      expect(complex.score).toBeGreaterThan(simple.score);
    });

    it('should penalize common patterns', () => {
      const result = calculatePasswordStrength('password123');
      expect(result.feedback.some(f => f.toLowerCase().includes('pattern'))).toBe(true);
    });
  });

  describe('generateSalt', () => {
    it('should generate 32-byte salt', () => {
      const salt = generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(32);
    });

    it('should generate unique salts', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it('should be cryptographically random', () => {
      const salts = Array.from({ length: 10 }, () => generateSalt());
      const unique = new Set(salts.map(s => s.join(',')));
      expect(unique.size).toBe(10);
    });
  });
});
