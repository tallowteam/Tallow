/**
 * Certificate Pinning Unit Tests
 *
 * Tests the certificate pinning implementation including:
 * - Certificate fingerprint generation
 * - SPKI hash computation
 * - Pin verification (valid and invalid)
 * - Backup pin matching
 * - Pin expiration checking
 * - Pin rotation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAllPins,
  getPinForHost,
  pinCertificate,
  removePinForHost,
  resetPinsToDefaults,
  computeSPKIHash,
  verifyCertificatePin,
  addBackupPin,
  rotatePinToPrimary,
  type CertificatePin,
} from '@/lib/security/certificates';

describe('Certificate Pinning', () => {
  beforeEach(() => {
    resetPinsToDefaults();
  });

  describe('pin management', () => {
    it('gets all configured pins', () => {
      const pins = getAllPins();
      expect(pins).toBeInstanceOf(Array);
      expect(pins.length).toBeGreaterThan(0);
    });

    it('gets pin for specific host', () => {
      const pin = getPinForHost('relay.tallow.app');
      expect(pin).not.toBeNull();
      expect(pin?.host).toBe('relay.tallow.app');
      expect(pin?.algorithm).toBe('SHA-256');
    });

    it('returns null for unknown host', () => {
      const pin = getPinForHost('unknown.host.com');
      expect(pin).toBeNull();
    });

    it('adds new certificate pin', () => {
      const newPin: CertificatePin = {
        host: 'test.example.com',
        algorithm: 'SHA-256',
        digest: 'dGVzdC1kaWdlc3Q=',
        createdAt: Date.now(),
      };

      pinCertificate(newPin);
      const retrieved = getPinForHost('test.example.com');
      expect(retrieved).toEqual(newPin);
    });

    it('updates existing pin', () => {
      const updated: CertificatePin = {
        host: 'relay.tallow.app',
        algorithm: 'SHA-256',
        digest: 'new-digest-value',
        createdAt: Date.now(),
      };

      pinCertificate(updated);
      const retrieved = getPinForHost('relay.tallow.app');
      expect(retrieved?.digest).toBe('new-digest-value');
    });

    it('removes pin for host', () => {
      const removed = removePinForHost('relay.tallow.app');
      expect(removed).toBe(true);

      const pin = getPinForHost('relay.tallow.app');
      expect(pin).toBeNull();
    });

    it('returns false when removing non-existent pin', () => {
      const removed = removePinForHost('non-existent.host');
      expect(removed).toBe(false);
    });

    it('resets to default pins', () => {
      pinCertificate({
        host: 'custom.host',
        algorithm: 'SHA-256',
        digest: 'custom',
        createdAt: Date.now(),
      });

      resetPinsToDefaults();

      const custom = getPinForHost('custom.host');
      expect(custom).toBeNull();

      const relay = getPinForHost('relay.tallow.app');
      expect(relay).not.toBeNull();
    });
  });

  describe('SPKI hash computation', () => {
    const mockSubtle = {
      digest: vi.fn(async (_algo: string, data: BufferSource) => {
        const bytes = new Uint8Array(data as ArrayBuffer);
        return new Uint8Array(32).fill(bytes[0] ?? 0).buffer;
      }),
    };

    beforeEach(() => {
      vi.stubGlobal('crypto', { subtle: mockSubtle });
    });

    it('computes SPKI hash', async () => {
      const spkiBytes = new Uint8Array([1, 2, 3, 4, 5]);
      const hash = await computeSPKIHash(spkiBytes);

      expect(hash).toBeTruthy();
      expect(typeof hash).toBe('string');
      expect(mockSubtle.digest).toHaveBeenCalledWith('SHA-256', spkiBytes);
    });

    it('uses SHA-256 by default', async () => {
      const spkiBytes = new Uint8Array(32);
      await computeSPKIHash(spkiBytes);

      expect(mockSubtle.digest).toHaveBeenCalledWith('SHA-256', expect.any(Uint8Array));
    });

    it('supports SHA-384', async () => {
      const spkiBytes = new Uint8Array(32);
      await computeSPKIHash(spkiBytes, 'SHA-384');

      expect(mockSubtle.digest).toHaveBeenCalledWith('SHA-384', expect.any(Uint8Array));
    });

    it('supports SHA-512', async () => {
      const spkiBytes = new Uint8Array(32);
      await computeSPKIHash(spkiBytes, 'SHA-512');

      expect(mockSubtle.digest).toHaveBeenCalledWith('SHA-512', expect.any(Uint8Array));
    });

    it('returns base64-encoded hash', async () => {
      const spkiBytes = new Uint8Array([0xAB, 0xCD, 0xEF]);
      const hash = await computeSPKIHash(spkiBytes);

      // Should be valid base64
      expect(() => atob(hash)).not.toThrow();
    });
  });

  describe('pin verification', () => {
    it('verifies valid pin', () => {
      const pin = getPinForHost('relay.tallow.app');
      expect(pin).not.toBeNull();

      const result = verifyCertificatePin('relay.tallow.app', pin!.digest);
      expect(result.valid).toBe(true);
      expect(result.host).toBe('relay.tallow.app');
      expect(result.matchedPin).toBe('primary');
    });

    it('rejects invalid pin', () => {
      const result = verifyCertificatePin('relay.tallow.app', 'invalid-digest');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('rejects pin for unknown host', () => {
      const result = verifyCertificatePin('unknown.host', 'any-digest');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No certificate pin configured');
    });

    it('accepts backup pin', () => {
      const pin = getPinForHost('relay.tallow.app');
      expect(pin).not.toBeNull();

      const backupDigest = pin!.backupDigests?.[0];
      expect(backupDigest).toBeDefined();

      const result = verifyCertificatePin('relay.tallow.app', backupDigest!);
      expect(result.valid).toBe(true);
      expect(result.matchedPin).toBe(0);
    });

    it('rejects expired pin', () => {
      const expiredPin: CertificatePin = {
        host: 'expired.test',
        algorithm: 'SHA-256',
        digest: 'test-digest',
        createdAt: Date.now() - 10000,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      pinCertificate(expiredPin);
      const result = verifyCertificatePin('expired.test', 'test-digest');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('accepts non-expired pin', () => {
      const validPin: CertificatePin = {
        host: 'valid.test',
        algorithm: 'SHA-256',
        digest: 'test-digest',
        createdAt: Date.now(),
        expiresAt: Date.now() + 10000, // Expires in 10 seconds
      };

      pinCertificate(validPin);
      const result = verifyCertificatePin('valid.test', 'test-digest');

      expect(result.valid).toBe(true);
    });
  });

  describe('backup pins', () => {
    it('adds backup pin', () => {
      const host = 'relay.tallow.app';
      const backupDigest = 'new-backup-digest';

      const added = addBackupPin(host, backupDigest);
      expect(added).toBe(true);

      const pin = getPinForHost(host);
      expect(pin?.backupDigests).toContain(backupDigest);
    });

    it('does not add duplicate backup pin', () => {
      const host = 'relay.tallow.app';
      const pin = getPinForHost(host);
      const existingBackup = pin?.backupDigests?.[0];

      if (existingBackup) {
        addBackupPin(host, existingBackup);
        const updated = getPinForHost(host);
        const count = updated?.backupDigests?.filter(d => d === existingBackup).length;
        expect(count).toBe(1);
      }
    });

    it('returns false for unknown host', () => {
      const added = addBackupPin('unknown.host', 'backup');
      expect(added).toBe(false);
    });
  });

  describe('pin rotation', () => {
    it('rotates pin to primary', () => {
      const host = 'relay.tallow.app';
      const pin = getPinForHost(host);
      const oldPrimary = pin?.digest;
      const newPrimary = 'new-primary-digest';

      const rotated = rotatePinToPrimary(host, newPrimary);
      expect(rotated).toBe(true);

      const updated = getPinForHost(host);
      expect(updated?.digest).toBe(newPrimary);
      expect(updated?.backupDigests?.[0]).toBe(oldPrimary);
    });

    it('limits backup pins to 3', () => {
      const host = 'test.rotation';
      pinCertificate({
        host,
        algorithm: 'SHA-256',
        digest: 'digest-1',
        backupDigests: ['backup-1', 'backup-2', 'backup-3'],
        createdAt: Date.now(),
      });

      rotatePinToPrimary(host, 'digest-2');

      const pin = getPinForHost(host);
      expect(pin?.digest).toBe('digest-2');
      expect(pin?.backupDigests?.length).toBeLessThanOrEqual(3);
    });

    it('returns false for unknown host', () => {
      const rotated = rotatePinToPrimary('unknown.host', 'new-digest');
      expect(rotated).toBe(false);
    });
  });

  describe('pin metadata', () => {
    it('stores creation timestamp', () => {
      const before = Date.now();
      const pin: CertificatePin = {
        host: 'timestamp.test',
        algorithm: 'SHA-256',
        digest: 'test',
        createdAt: Date.now(),
      };
      const after = Date.now();

      pinCertificate(pin);
      const retrieved = getPinForHost('timestamp.test');

      expect(retrieved?.createdAt).toBeGreaterThanOrEqual(before);
      expect(retrieved?.createdAt).toBeLessThanOrEqual(after);
    });

    it('stores expiration timestamp', () => {
      const expiresAt = Date.now() + 86400000; // 24 hours
      const pin: CertificatePin = {
        host: 'expiry.test',
        algorithm: 'SHA-256',
        digest: 'test',
        createdAt: Date.now(),
        expiresAt,
      };

      pinCertificate(pin);
      const retrieved = getPinForHost('expiry.test');

      expect(retrieved?.expiresAt).toBe(expiresAt);
    });

    it('supports multiple algorithms', () => {
      const algorithms: Array<'SHA-256' | 'SHA-384' | 'SHA-512'> = [
        'SHA-256',
        'SHA-384',
        'SHA-512',
      ];

      algorithms.forEach(algorithm => {
        const pin: CertificatePin = {
          host: `${algorithm}.test`,
          algorithm,
          digest: 'test-digest',
          createdAt: Date.now(),
        };

        pinCertificate(pin);
        const retrieved = getPinForHost(`${algorithm}.test`);
        expect(retrieved?.algorithm).toBe(algorithm);
      });
    });
  });

  describe('default pins', () => {
    it('includes relay server pin', () => {
      const pin = getPinForHost('relay.tallow.app');
      expect(pin).not.toBeNull();
      expect(pin?.digest).toBeTruthy();
    });

    it('includes STUN server pin', () => {
      const pin = getPinForHost('stun.tallow.app');
      expect(pin).not.toBeNull();
      expect(pin?.digest).toBeTruthy();
    });

    it('includes TURN server pin', () => {
      const pin = getPinForHost('turn.tallow.app');
      expect(pin).not.toBeNull();
      expect(pin?.digest).toBeTruthy();
    });

    it('all default pins have backup digests', () => {
      const pins = getAllPins();
      pins.forEach(pin => {
        expect(pin.backupDigests).toBeDefined();
        expect(pin.backupDigests!.length).toBeGreaterThan(0);
      });
    });

    it('all default pins have expiration', () => {
      const pins = getAllPins();
      pins.forEach(pin => {
        expect(pin.expiresAt).toBeDefined();
        expect(pin.expiresAt!).toBeGreaterThan(Date.now());
      });
    });
  });
});
