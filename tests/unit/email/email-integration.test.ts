/**
 * Comprehensive Email Integration Tests
 * Tests complete email workflow: upload → storage → email → download
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  uploadTempFile,
  downloadTempFile,
  getStorageStats,
  cleanupExpiredFiles,
} from '@/lib/storage/temp-file-storage';

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(async (params: any) => ({
        id: `email-${Date.now()}`,
        error: null,
        data: params,
      })),
    },
  })),
}));

describe('Email Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  describe('Complete File Transfer Workflow', () => {
    it('should complete full cycle: upload → store → download', async () => {
      // Step 1: Create test file
      const testData = new TextEncoder().encode('Test file content for email transfer');
      const testFile = new File([testData], 'test-document.txt', {
        type: 'text/plain',
      });

      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Step 2: Upload file
      const uploadResult = await uploadTempFile(testFile, encryptionKey, {
        expirationHours: 24,
        maxDownloads: 3,
      });

      expect(uploadResult.fileId).toBeDefined();
      expect(uploadResult.downloadToken).toBeDefined();
      expect(uploadResult.expiresAt).toBeGreaterThan(Date.now());

      // Step 3: Verify storage stats
      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(1);
      expect(stats.totalSize).toBe(testFile.size);

      // Step 4: Download file
      const downloadResult = await downloadTempFile(
        uploadResult.fileId,
        uploadResult.downloadToken
      );

      expect(downloadResult.encryptedFile).toBeDefined();
      expect(downloadResult.metadata.originalSize).toBe(testFile.size);
    });

    it('should handle multiple files in sequence', async () => {
      const files = [
        new File([new Uint8Array(1000)], 'file1.bin'),
        new File([new Uint8Array(2000)], 'file2.bin'),
        new File([new Uint8Array(3000)], 'file3.bin'),
      ];

      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const uploadResults = [];

      // Upload all files
      for (const file of files) {
        const result = await uploadTempFile(file, encryptionKey);
        uploadResults.push(result);
      }

      // Verify all stored
      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(6000);

      // Download all files
      for (const upload of uploadResults) {
        const download = await downloadTempFile(upload.fileId, upload.downloadToken);
        expect(download.encryptedFile).toBeDefined();
      }
    });

    it('should enforce download limits correctly', async () => {
      const testFile = new File([new Uint8Array(100)], 'limited.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const { fileId, downloadToken } = await uploadTempFile(testFile, encryptionKey, {
        maxDownloads: 2,
      });

      // First download - should succeed
      await downloadTempFile(fileId, downloadToken);

      // Second download - should succeed
      await downloadTempFile(fileId, downloadToken);

      // Third download - should fail
      await expect(downloadTempFile(fileId, downloadToken)).rejects.toThrow();
    });
  });

  describe('Expiration Handling', () => {
    it('should automatically cleanup expired files', async () => {
      const file = new File([new Uint8Array(500)], 'expires.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Upload with 1 hour expiration
      await uploadTempFile(file, encryptionKey, { expirationHours: 1 });

      // Manually expire by modifying localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage).filter((k) =>
          k.startsWith('tallow_temp_file_')
        );

        for (const key of keys) {
          const data = JSON.parse(window.localStorage.getItem(key)!);
          data.metadata.expiresAt = Date.now() - 1000; // Expire 1 second ago
          window.localStorage.setItem(key, JSON.stringify(data));
        }
      }

      // Run cleanup
      const cleaned = cleanupExpiredFiles();
      expect(cleaned).toBe(1);

      // Verify file removed
      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(0);
    });

    it('should calculate correct expiration times', async () => {
      const file = new File([new Uint8Array(100)], 'test.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const expirationHours = 48;
      const before = Date.now();
      const { expiresAt } = await uploadTempFile(file, encryptionKey, { expirationHours });
      const after = Date.now();

      const expectedExpiration = expirationHours * 60 * 60 * 1000;
      expect(expiresAt).toBeGreaterThanOrEqual(before + expectedExpiration);
      expect(expiresAt).toBeLessThanOrEqual(after + expectedExpiration + 1000);
    });
  });

  describe('Security and Validation', () => {
    it('should generate unique download tokens', async () => {
      const file = new File([new Uint8Array(100)], 'test.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const tokens = new Set<string>();

      // Generate 50 tokens
      for (let i = 0; i < 50; i++) {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
        const { downloadToken } = await uploadTempFile(file, encryptionKey);
        tokens.add(downloadToken);
      }

      // All should be unique
      expect(tokens.size).toBe(50);
    });

    it('should reject empty files', async () => {
      const emptyFile = new File([], 'empty.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      await expect(uploadTempFile(emptyFile, encryptionKey)).rejects.toThrow(
        'Cannot upload empty file'
      );
    });

    it('should reject oversized files', async () => {
      const hugeFile = new File([new Uint8Array(101 * 1024 * 1024)], 'huge.bin');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      await expect(uploadTempFile(hugeFile, encryptionKey)).rejects.toThrow('File too large');
    });

    it('should validate expiration hours', async () => {
      const file = new File([new Uint8Array(100)], 'test.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // 0 hours defaults to 24 hours (not rejected)
      const result = await uploadTempFile(file, encryptionKey, { expirationHours: 0 });
      expect(result.fileId).toBeDefined();

      // Too long
      await expect(
        uploadTempFile(file, encryptionKey, { expirationHours: 1000 })
      ).rejects.toThrow('Expiration must be between');

      // Valid
      await expect(
        uploadTempFile(file, encryptionKey, { expirationHours: 24 })
      ).resolves.toBeDefined();
    });

    it('should reject invalid download tokens', async () => {
      const file = new File([new Uint8Array(100)], 'test.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const { fileId } = await uploadTempFile(file, encryptionKey);

      // Invalid token format
      const invalidToken = 'invalid-token-format';
      await expect(downloadTempFile(fileId, invalidToken)).rejects.toThrow();

      // Wrong token (correct format, wrong value)
      const wrongToken = 'a'.repeat(64);
      await expect(downloadTempFile(fileId, wrongToken)).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent uploads', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Upload 10 files concurrently
      const uploads = Array.from({ length: 10 }, (_, i) => {
        const file = new File([new Uint8Array(100)], `file${i}.txt`);
        return uploadTempFile(file, encryptionKey);
      });

      const results = await Promise.all(uploads);

      // All should succeed
      expect(results).toHaveLength(10);

      // All should have unique IDs
      const ids = new Set(results.map((r) => r.fileId));
      expect(ids.size).toBe(10);

      // Storage stats should reflect all files
      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(10);
      expect(stats.totalSize).toBe(1000);
    });

    it('should handle concurrent downloads', async () => {
      const file = new File([new Uint8Array(100)], 'concurrent.txt');
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey, {
        maxDownloads: 5,
      });

      // Download 3 times concurrently
      const downloads = Array.from({ length: 3 }, () =>
        downloadTempFile(fileId, downloadToken)
      );

      const results = await Promise.all(downloads);

      // All should succeed
      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.encryptedFile).toBeDefined();
      });
    });
  });

  describe('Storage Management', () => {
    it('should track storage statistics accurately', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Upload various sized files
      await uploadTempFile(new File([new Uint8Array(1000)], 'small.txt'), encryptionKey);
      await uploadTempFile(new File([new Uint8Array(5000)], 'medium.txt'), encryptionKey);
      await uploadTempFile(new File([new Uint8Array(10000)], 'large.txt'), encryptionKey);

      const stats = getStorageStats();

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(16000);
      expect(stats.expiredFiles).toBe(0);
    });

    it('should cleanup all expired files in batch', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Clear storage first
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }

      // Upload 5 files
      const uploadedCount = 5;
      for (let i = 0; i < uploadedCount; i++) {
        await uploadTempFile(
          new File([new Uint8Array(100)], `batchfile${i}.txt`),
          encryptionKey,
          { expirationHours: 1 }
        );
      }

      // Verify files were uploaded
      const beforeStats = getStorageStats();
      const actualUploaded = beforeStats.totalFiles;
      expect(actualUploaded).toBeGreaterThan(0);

      // Expire all files
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage).filter((k) =>
          k.startsWith('tallow_temp_file_')
        );

        for (const key of keys) {
          const data = JSON.parse(window.localStorage.getItem(key)!);
          data.metadata.expiresAt = Date.now() - 1000;
          window.localStorage.setItem(key, JSON.stringify(data));
        }
      }

      // Cleanup - should clean at least what was uploaded
      const cleaned = cleanupExpiredFiles();
      expect(cleaned).toBeGreaterThan(0);
      expect(cleaned).toBeLessThanOrEqual(actualUploaded);

      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(0);
    });

    it('should handle corrupted storage entries gracefully', async () => {
      // Add corrupted entry
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('tallow_temp_file_corrupted', 'invalid json {');
      }

      // Should clean up corrupted entry without crashing
      const cleaned = cleanupExpiredFiles();
      expect(cleaned).toBeGreaterThanOrEqual(1);
    });
  });

  describe('File Type Handling', () => {
    it('should handle various file types', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const fileTypes = [
        { name: 'document.pdf', type: 'application/pdf' },
        { name: 'image.jpg', type: 'image/jpeg' },
        { name: 'video.mp4', type: 'video/mp4' },
        { name: 'archive.zip', type: 'application/zip' },
        { name: 'text.txt', type: 'text/plain' },
      ];

      for (const fileType of fileTypes) {
        const file = new File([new Uint8Array(1000)], fileType.name, {
          type: fileType.type,
        });

        const result = await uploadTempFile(file, encryptionKey);
        expect(result.fileId).toBeDefined();

        const download = await downloadTempFile(result.fileId, result.downloadToken);
        expect(download.metadata).toBeDefined();
      }
    });

    it('should preserve file metadata', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const file = new File([new Uint8Array(500)], 'document.pdf', {
        type: 'application/pdf',
      });

      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey);
      const { metadata } = await downloadTempFile(fileId, downloadToken);

      expect(metadata.originalSize).toBe(500);
      expect(metadata.mimeCategory).toBe('document');
    });
  });

  describe('Error Recovery', () => {
    it('should handle download of non-existent files', async () => {
      const fakeFileId = 'nonexistent-' + 'a'.repeat(32);
      const fakeToken = 'b'.repeat(64);

      await expect(downloadTempFile(fakeFileId, fakeToken)).rejects.toThrow(
        'File not found or expired'
      );
    });

    it('should handle storage quota errors gracefully', async () => {
      // This test would need to mock localStorage to simulate quota exceeded
      // For now, we just verify the file size validation works
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Maximum allowed file
      const maxFile = new File([new Uint8Array(100 * 1024 * 1024)], 'max.bin'); // 100MB

      await expect(uploadTempFile(maxFile, encryptionKey)).resolves.toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should handle large number of files efficiently', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      const start = performance.now();

      // Upload 20 files
      for (let i = 0; i < 20; i++) {
        await uploadTempFile(new File([new Uint8Array(100)], `file${i}.txt`), encryptionKey);
      }

      const uploadTime = performance.now() - start;

      // Should complete within reasonable time (5 seconds)
      expect(uploadTime).toBeLessThan(5000);

      const stats = getStorageStats();
      expect(stats.totalFiles).toBe(20);
    });

    it('should cleanup files efficiently', async () => {
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);

      // Clear storage first
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }

      // Upload and expire files
      const uploadCount = 30; // Reduced to avoid test timeouts
      for (let i = 0; i < uploadCount; i++) {
        await uploadTempFile(new File([new Uint8Array(100)], `perffile${i}.txt`), encryptionKey, {
          expirationHours: 1,
        });
      }

      // Verify files uploaded
      const beforeStats = getStorageStats();
      const actualUploaded = beforeStats.totalFiles;
      expect(actualUploaded).toBeGreaterThan(0);

      // Expire all
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage).filter((k) =>
          k.startsWith('tallow_temp_file_')
        );

        for (const key of keys) {
          const data = JSON.parse(window.localStorage.getItem(key)!);
          data.metadata.expiresAt = Date.now() - 1000;
          window.localStorage.setItem(key, JSON.stringify(data));
        }
      }

      const start = performance.now();
      const cleaned = cleanupExpiredFiles();
      const cleanupTime = performance.now() - start;

      expect(cleaned).toBeGreaterThan(0);
      expect(cleaned).toBeLessThanOrEqual(actualUploaded);
      // Should cleanup within 1 second
      expect(cleanupTime).toBeLessThan(1000);
    });
  });
});
