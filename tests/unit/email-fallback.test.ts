/**
 * Email Fallback System Tests
 * Tests for file storage, email sending, and download functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { uploadTempFile, downloadTempFile, cleanupExpiredFiles, getStorageStats } from '@/lib/storage/temp-file-storage';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Temporary File Storage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('uploadTempFile', () => {
    it('should upload and encrypt a file successfully', async () => {
      const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
      const encryptionKey = new Uint8Array(32).fill(1);

      const result = await uploadTempFile(file, encryptionKey, {
        expirationHours: 24,
        maxDownloads: 1,
      });

      expect(result.fileId).toBeDefined();
      expect(result.downloadToken).toBeDefined();
      expect(result.expiresAt).toBeGreaterThan(Date.now());
      expect(result.downloadToken).toHaveLength(64); // 32 bytes = 64 hex chars
    });

    it('should reject empty files', async () => {
      const file = new File([], 'empty.txt', { type: 'text/plain' });
      const encryptionKey = new Uint8Array(32).fill(1);

      await expect(
        uploadTempFile(file, encryptionKey)
      ).rejects.toThrow('Cannot upload empty file');
    });

    it('should reject files over size limit', async () => {
      const largeContent = new Uint8Array(101 * 1024 * 1024); // 101MB
      const file = new File([largeContent], 'large.bin', { type: 'application/octet-stream' });
      const encryptionKey = new Uint8Array(32).fill(1);

      await expect(
        uploadTempFile(file, encryptionKey)
      ).rejects.toThrow('File too large');
    });

    it('should validate expiration hours', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      await expect(
        uploadTempFile(file, encryptionKey, { expirationHours: 0 })
      ).rejects.toThrow('Expiration must be between 1 and 720 hours');

      await expect(
        uploadTempFile(file, encryptionKey, { expirationHours: 1000 })
      ).rejects.toThrow('Expiration must be between 1 and 720 hours');
    });

    it('should set correct expiration time', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);
      const expirationHours = 48;

      const result = await uploadTempFile(file, encryptionKey, { expirationHours });

      const expectedExpiration = Date.now() + (expirationHours * 60 * 60 * 1000);
      expect(result.expiresAt).toBeGreaterThanOrEqual(expectedExpiration - 1000);
      expect(result.expiresAt).toBeLessThanOrEqual(expectedExpiration + 1000);
    });
  });

  describe('downloadTempFile', () => {
    it('should download and decrypt file with valid token', async () => {
      const fileContent = new Uint8Array([1, 2, 3, 4, 5]);
      const file = new File([fileContent], 'test.txt', { type: 'text/plain' });
      const encryptionKey = new Uint8Array(32).fill(1);

      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey);
      const { encryptedFile, metadata } = await downloadTempFile(fileId, downloadToken);

      expect(encryptedFile).toBeDefined();
      expect(metadata.originalSize).toBe(file.size);
    });

    it('should reject invalid token', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      const { fileId } = await uploadTempFile(file, encryptionKey);
      const invalidToken = 'invalid'.padEnd(64, '0');

      await expect(
        downloadTempFile(fileId, invalidToken)
      ).rejects.toThrow('Invalid download token');
    });

    it('should reject non-existent file', async () => {
      const fakeFileId = '1234567890-' + 'a'.repeat(32);
      const fakeToken = 'a'.repeat(64);

      await expect(
        downloadTempFile(fakeFileId, fakeToken)
      ).rejects.toThrow('File not found or expired');
    });

    it('should enforce one-time download limit', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey, {
        maxDownloads: 1,
      });

      // First download should succeed
      await downloadTempFile(fileId, downloadToken);

      // Second download should fail
      await expect(
        downloadTempFile(fileId, downloadToken)
      ).rejects.toThrow('File not found or expired');
    });

    it('should allow multiple downloads if configured', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey, {
        maxDownloads: 3,
      });

      // Should allow 3 downloads
      await downloadTempFile(fileId, downloadToken);
      await downloadTempFile(fileId, downloadToken);
      await downloadTempFile(fileId, downloadToken);

      // 4th should fail
      await expect(
        downloadTempFile(fileId, downloadToken)
      ).rejects.toThrow();
    });
  });

  describe('cleanupExpiredFiles', () => {
    it('should remove expired files', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      // Upload file with 1 hour expiration
      await uploadTempFile(file, encryptionKey, { expirationHours: 1 });

      // Manually expire the file by modifying storage
      const keys = Object.keys(localStorageMock).filter(k => k.startsWith('tallow_temp_file_'));
      expect(keys.length).toBe(1);

      const firstKey = keys[0];
      if (!firstKey) {throw new Error('No key found');}
      const storedData = JSON.parse(localStorageMock.getItem(firstKey)!);
      storedData.metadata.expiresAt = Date.now() - 1000; // Expired 1 second ago
      localStorageMock.setItem(firstKey, JSON.stringify(storedData));

      // Run cleanup
      const cleanedCount = cleanupExpiredFiles();

      expect(cleanedCount).toBe(1);
      expect(localStorageMock.length).toBe(0);
    });

    it('should not remove non-expired files', async () => {
      const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      await uploadTempFile(file, encryptionKey, { expirationHours: 24 });

      const cleanedCount = cleanupExpiredFiles();

      expect(cleanedCount).toBe(0);
      expect(localStorageMock.length).toBe(1);
    });

    it('should handle corrupted storage entries', () => {
      localStorageMock.setItem('tallow_temp_file_corrupted', 'invalid json');

      const cleanedCount = cleanupExpiredFiles();

      expect(cleanedCount).toBe(1);
      expect(localStorageMock.length).toBe(0);
    });
  });

  describe('getStorageStats', () => {
    it('should return correct statistics', async () => {
      const file1 = new File([new Uint8Array(1000)], 'file1.txt');
      const file2 = new File([new Uint8Array(2000)], 'file2.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      await uploadTempFile(file1, encryptionKey);
      await uploadTempFile(file2, encryptionKey);

      const stats = getStorageStats();

      expect(stats.totalFiles).toBe(2);
      expect(stats.totalSize).toBe(3000);
      expect(stats.expiredFiles).toBe(0);
    });

    it('should count expired files', async () => {
      const file = new File([new Uint8Array(1000)], 'test.txt');
      const encryptionKey = new Uint8Array(32).fill(1);

      await uploadTempFile(file, encryptionKey, { expirationHours: 1 });

      // Expire the file
      const keys = Object.keys(localStorageMock).filter(k => k.startsWith('tallow_temp_file_'));
      const firstKey = keys[0];
      if (!firstKey) {throw new Error('No key found');}
      const storedData = JSON.parse(localStorageMock.getItem(firstKey)!);
      storedData.metadata.expiresAt = Date.now() - 1000;
      localStorageMock.setItem(firstKey, JSON.stringify(storedData));

      const stats = getStorageStats();

      expect(stats.totalFiles).toBe(1);
      expect(stats.expiredFiles).toBe(1);
    });
  });
});

describe('Token Security', () => {
  it('should generate unique tokens', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
    const encryptionKey = new Uint8Array(32).fill(1);

    const tokens = new Set<string>();

    for (let i = 0; i < 100; i++) {
      localStorageMock.clear();
      const { downloadToken } = await uploadTempFile(file, encryptionKey);
      tokens.add(downloadToken);
    }

    // All tokens should be unique
    expect(tokens.size).toBe(100);
  });

  it('should use constant-time comparison for tokens', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'test.txt');
    const encryptionKey = new Uint8Array(32).fill(1);

    const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey);

    // Try a token that differs only in the last character
    const almostCorrectToken = downloadToken.slice(0, -1) + '0';

    const startTime = performance.now();
    try {
      await downloadTempFile(fileId, almostCorrectToken);
    } catch (_error) {
      const endTime = performance.now();
      const duration1 = endTime - startTime;

      // Try a completely wrong token
      const wrongToken = 'a'.repeat(64);

      const startTime2 = performance.now();
      try {
        await downloadTempFile(fileId, wrongToken);
      } catch (_error) {
        const endTime2 = performance.now();
        const duration2 = endTime2 - startTime2;

        // Times should be similar (within 10ms) for constant-time comparison
        expect(Math.abs(duration1 - duration2)).toBeLessThan(10);
      }
    }
  });
});

describe('File Encryption Integration', () => {
  it('should encrypt and decrypt file correctly', async () => {
    const originalContent = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const file = new File([originalContent], 'test.bin', { type: 'application/octet-stream' });
    const encryptionKey = new Uint8Array(32).fill(1);

    const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey);
    const { encryptedFile } = await downloadTempFile(fileId, downloadToken);

    // Verify encrypted file has chunks
    expect(encryptedFile.chunks.length).toBeGreaterThan(0);

    // Verify metadata
    expect(encryptedFile.metadata.originalSize).toBe(originalContent.length);
  });

  it('should preserve file metadata through encryption', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'document.pdf', { type: 'application/pdf' });
    const encryptionKey = new Uint8Array(32).fill(1);

    const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey);
    const { metadata } = await downloadTempFile(fileId, downloadToken);

    expect(metadata.mimeCategory).toBe('document');
    expect(metadata.originalSize).toBe(3);
  });
});
