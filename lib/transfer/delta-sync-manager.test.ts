/**
 * Delta Sync Manager Unit Tests
 * Tests session management and caching functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DeltaSyncManager, getDefaultManager, resetDefaultManager } from './delta-sync-manager';
import type { FileSignatures } from './delta-sync';

describe('DeltaSyncManager', () => {
  let manager: DeltaSyncManager;

  beforeEach(() => {
    manager = new DeltaSyncManager({
      maxCacheSize: 10,
      cacheExpiryMs: 1000,
      autoCleanup: false, // Disable for tests
    });
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('initDeltaSync', () => {
    it('should compute and cache signatures', async () => {
      const file = new File(['Test content'], 'test.txt');
      const fileId = 'test-file-1';

      const signatures = await manager.initDeltaSync(fileId, file);

      expect(signatures).toBeDefined();
      expect(signatures.blocks.length).toBeGreaterThan(0);
      expect(manager.hasSignatures(fileId)).toBe(true);
    });

    it('should return cached signatures for same file', async () => {
      const file = new File(['Test content'], 'test.txt');
      const fileId = 'test-file-1';

      const sig1 = await manager.initDeltaSync(fileId, file);
      const sig2 = await manager.initDeltaSync(fileId, file);

      expect(sig1).toEqual(sig2);
    });

    it('should recompute signatures if file modified', async () => {
      const file1 = new File(['Content v1'], 'test.txt');
      const file2 = new File(['Content v2'], 'test.txt');
      const fileId = 'test-file-1';

      // Force different lastModified
      Object.defineProperty(file2, 'lastModified', {
        value: Date.now() + 1000,
        writable: false,
      });

      await manager.initDeltaSync(fileId, file1);
      const sig2 = await manager.initDeltaSync(fileId, file2);

      expect(sig2).toBeDefined();
    });

    it('should track session progress', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      const promise = manager.initDeltaSync(fileId, file);

      let session = manager.getSession(fileId);
      expect(session?.status).toMatch(/idle|computing/);

      await promise;

      session = manager.getSession(fileId);
      expect(session?.status).toBe('idle');
      expect(session?.progress).toBe(100);
    });
  });

  describe('syncFile', () => {
    it('should perform delta sync successfully', async () => {
      const original = 'AAAA'.repeat(2000);
      const updated = 'AAAA'.repeat(1000) + 'BBBB'.repeat(1000);

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');
      const fileId = 'test-file-1';

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      expect(result.success).toBe(true);
      expect(result.delta.unchanged.length).toBeGreaterThan(0);
      expect(result.delta.changed.length).toBeGreaterThan(0);
      expect(result.savings.savingsPercent).toBeGreaterThan(0);
    });

    it('should create patch for changed files', async () => {
      const original = 'Original content';
      const updated = 'Updated content';

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');
      const fileId = 'test-file-1';

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      expect(result.success).toBe(true);
      expect(result.patch).toBeDefined();
      expect(result.patch!.blocks.length).toBeGreaterThan(0);
    });

    it('should not create patch if no changes', async () => {
      const content = 'Same content';
      const file1 = new File([content], 'file.txt');
      const file2 = new File([content], 'file.txt');
      const fileId = 'test-file-1';

      const sig = await manager.initDeltaSync(fileId, file1);
      const result = await manager.syncFile(fileId, file2, sig);

      expect(result.success).toBe(true);
      expect(result.patch).toBeNull();
      expect(result.delta.unchanged.length).toBeGreaterThan(0);
      expect(result.delta.changed.length).toBe(0);
    });

    it('should handle invalid peer signatures', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      const invalidSig = {
        blockSize: 0,
        totalSize: 0,
        blocks: 'invalid',
      } as any;

      const result = await manager.syncFile(fileId, file, invalidSig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should calculate savings estimate', async () => {
      const original = 'A'.repeat(8000);
      const updated = 'A'.repeat(4000) + 'B'.repeat(4000);

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');
      const fileId = 'test-file-1';

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      expect(result.savings.originalBytes).toBeGreaterThan(0);
      expect(result.savings.patchBytes).toBeGreaterThan(0);
      expect(result.savings.patchBytes).toBeLessThan(result.savings.originalBytes);
      expect(result.savings.savingsPercent).toBeGreaterThan(0);
      expect(['excellent', 'good', 'moderate', 'poor']).toContain(result.savings.efficiency);
    });
  });

  describe('applyReceivedPatch', () => {
    it('should apply patch and reconstruct file', async () => {
      const original = 'AAAA'.repeat(2000);
      const updated = 'AAAA'.repeat(1000) + 'BBBB'.repeat(1000);

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');
      const fileId = 'test-file-1';

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      expect(result.patch).toBeDefined();

      const reconstructed = await manager.applyReceivedPatch(
        fileId,
        originalFile,
        result.patch!
      );

      const reconstructedText = await reconstructed.text();
      expect(reconstructedText).toBe(updated);
    });

    it('should reject invalid patch', async () => {
      const file = new File(['Test'], 'test.txt');
      const invalidPatch = {
        blockSize: 0,
        totalBlocks: 0,
        blocks: 'invalid',
        delta: {},
      } as any;

      await expect(
        manager.applyReceivedPatch('test-file-1', file, invalidPatch)
      ).rejects.toThrow();
    });
  });

  describe('Cache Management', () => {
    it('should cache signatures', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      await manager.initDeltaSync(fileId, file);

      expect(manager.hasSignatures(fileId)).toBe(true);

      const cached = manager.getSignatures(fileId);
      expect(cached).toBeDefined();
    });

    it('should evict LRU when cache full', async () => {
      // Fill cache beyond max size
      for (let i = 0; i < 12; i++) {
        const file = new File([`Content ${i}`], `file${i}.txt`);
        await manager.initDeltaSync(`file-${i}`, file);
      }

      const stats = manager.getCacheStats();
      expect(stats.size).toBeLessThanOrEqual(10); // Max cache size
    });

    it('should clear expired cache entries', async () => {
      const file = new File(['Test'], 'test.txt');
      await manager.initDeltaSync('test-file-1', file);

      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1100));

      const cleared = manager.clearExpiredCache();
      expect(cleared).toBeGreaterThan(0);
      expect(manager.hasSignatures('test-file-1')).toBe(false);
    });

    it('should provide cache statistics', async () => {
      const file1 = new File(['Test 1'], 'file1.txt');
      const file2 = new File(['Test 2'], 'file2.txt');

      await manager.initDeltaSync('file-1', file1);
      await manager.initDeltaSync('file-2', file2);

      const stats = manager.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(10);
      expect(stats.entries.length).toBe(2);
      expect(stats.entries[0]).toHaveProperty('fileId');
      expect(stats.entries[0]).toHaveProperty('fileName');
      expect(stats.entries[0]).toHaveProperty('accessCount');
      expect(stats.entries[0]).toHaveProperty('age');
    });

    it('should clear all cache', async () => {
      const file1 = new File(['Test 1'], 'file1.txt');
      const file2 = new File(['Test 2'], 'file2.txt');

      await manager.initDeltaSync('file-1', file1);
      await manager.initDeltaSync('file-2', file2);

      manager.clearCache();

      expect(manager.hasSignatures('file-1')).toBe(false);
      expect(manager.hasSignatures('file-2')).toBe(false);
      expect(manager.getCacheStats().size).toBe(0);
    });
  });

  describe('Session Management', () => {
    it('should create and track sessions', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      await manager.initDeltaSync(fileId, file);

      const session = manager.getSession(fileId);
      expect(session).toBeDefined();
      expect(session?.fileId).toBe(fileId);
      expect(session?.fileName).toBe('test.txt');
    });

    it('should get all sessions', async () => {
      const file1 = new File(['Test 1'], 'file1.txt');
      const file2 = new File(['Test 2'], 'file2.txt');

      await manager.initDeltaSync('file-1', file1);
      await manager.initDeltaSync('file-2', file2);

      const sessions = manager.getAllSessions();
      expect(sessions.length).toBe(2);
    });

    it('should clear specific session', async () => {
      const file = new File(['Test'], 'test.txt');
      await manager.initDeltaSync('test-file-1', file);

      manager.clearSession('test-file-1');

      expect(manager.getSession('test-file-1')).toBeNull();
    });

    it('should clear all sessions', async () => {
      const file1 = new File(['Test 1'], 'file1.txt');
      const file2 = new File(['Test 2'], 'file2.txt');

      await manager.initDeltaSync('file-1', file1);
      await manager.initDeltaSync('file-2', file2);

      manager.clearAllSessions();

      expect(manager.getAllSessions().length).toBe(0);
    });
  });

  describe('Import/Export', () => {
    it('should export signatures as JSON', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      await manager.initDeltaSync(fileId, file);

      const json = manager.exportSignatures(fileId);
      expect(json).toBeDefined();
      expect(typeof json).toBe('string');
    });

    it('should import signatures from JSON', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      const original = await manager.initDeltaSync(fileId, file);
      const json = manager.exportSignatures(fileId)!;

      const imported = manager.importSignatures(json);
      expect(imported).toEqual(original);
    });

    it('should export and import patch', async () => {
      const original = 'Original content';
      const updated = 'Updated content';

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');
      const fileId = 'test-file-1';

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      expect(result.patch).toBeDefined();

      const { metadata, blocks } = manager.exportPatch(result.patch!);
      expect(typeof metadata).toBe('string');
      expect(Array.isArray(blocks)).toBe(true);

      const imported = manager.importPatch(metadata, blocks);
      expect(imported).toBeDefined();
      expect(imported.blockSize).toBe(result.patch!.blockSize);
    });
  });

  describe('Singleton Instance', () => {
    afterEach(() => {
      resetDefaultManager();
    });

    it('should create default manager instance', () => {
      const manager1 = getDefaultManager();
      const manager2 = getDefaultManager();

      expect(manager1).toBe(manager2);
    });

    it('should reset default manager', () => {
      const manager1 = getDefaultManager();
      resetDefaultManager();
      const manager2 = getDefaultManager();

      expect(manager1).not.toBe(manager2);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during signature computation', async () => {
      const file = new File(['Test'], 'test.txt');
      const fileId = 'test-file-1';

      // Mock error
      const badManager = new DeltaSyncManager({
        blockSize: 99999999, // Invalid block size
      });

      let error: any;
      try {
        await badManager.initDeltaSync(fileId, file);
      } catch (e) {
        error = e;
      }

      expect(error).toBeDefined();

      const session = badManager.getSession(fileId);
      expect(session?.status).toBe('error');
      expect(session?.error).toBeDefined();

      badManager.destroy();
    });

    it('should return error result on sync failure', async () => {
      const file = new File(['Test'], 'test.txt');
      const invalidSig = {} as any;

      const result = await manager.syncFile('test-file-1', file, invalidSig);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should destroy manager and cleanup resources', async () => {
      const file = new File(['Test'], 'test.txt');
      await manager.initDeltaSync('test-file-1', file);

      manager.destroy();

      // Cache should be cleared
      expect(manager.getCacheStats().size).toBe(0);
      expect(manager.getAllSessions().length).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical document update workflow', async () => {
      const fileId = 'document-123';

      // Version 1
      const v1Content = 'Document version 1\nSome content here\n';
      const v1 = new File([v1Content], 'doc.txt');

      // Sender computes signatures
      const v1Signatures = await manager.initDeltaSync(fileId, v1);
      const signaturesJson = manager.exportSignatures(fileId)!;

      // Send signatures to peer...

      // Version 2 (later)
      const v2Content = 'Document version 1\nSome content here\nNew line added\n';
      const v2 = new File([v2Content], 'doc.txt');

      // Sender computes delta
      const result = await manager.syncFile(fileId, v2, v1Signatures);

      expect(result.success).toBe(true);
      expect(result.savings.savingsPercent).toBeGreaterThan(0);

      // Export patch
      if (result.patch) {
        const { metadata, blocks } = manager.exportPatch(result.patch);

        // Receiver imports and applies patch
        const receiverManager = new DeltaSyncManager();
        const importedPatch = receiverManager.importPatch(metadata, blocks);
        const reconstructed = await receiverManager.applyReceivedPatch(
          fileId,
          v1,
          importedPatch
        );

        const reconstructedText = await reconstructed.text();
        expect(reconstructedText).toBe(v2Content);

        receiverManager.destroy();
      }
    });

    it('should handle log file append scenario', async () => {
      const fileId = 'app-log';

      const originalLog = 'Log line 1\nLog line 2\nLog line 3\n';
      const updatedLog = originalLog + 'Log line 4\nLog line 5\n';

      const originalFile = new File([originalLog], 'app.log');
      const updatedFile = new File([updatedLog], 'app.log');

      const originalSig = await manager.initDeltaSync(fileId, originalFile);
      const result = await manager.syncFile(fileId, updatedFile, originalSig);

      // Most blocks should be unchanged
      expect(result.delta.unchanged.length).toBeGreaterThan(0);
      expect(result.savings.savingsPercent).toBeGreaterThan(0);

      if (result.patch) {
        const reconstructed = await manager.applyReceivedPatch(
          fileId,
          originalFile,
          result.patch
        );

        const reconstructedText = await reconstructed.text();
        expect(reconstructedText).toBe(updatedLog);
      }
    });
  });
});
