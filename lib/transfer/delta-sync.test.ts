/**
 * Delta Sync Unit Tests
 * Tests core delta synchronization functionality
 */

import { describe, it, expect } from 'vitest';
import {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings,
  calculateOptimalBlockSize,
  serializeSignatures,
  deserializeSignatures,
  validateSignatures,
  validatePatch,
} from './delta-sync';

describe('Delta Sync', () => {
  describe('computeBlockSignatures', () => {
    it('should compute signatures for a file', async () => {
      const content = 'Hello World! '.repeat(1000); // ~13KB
      const file = new File([content], 'test.txt', { type: 'text/plain' });

      const signatures = await computeBlockSignatures(file, 4096);

      expect(signatures).toBeDefined();
      expect(signatures.blockSize).toBe(4096);
      expect(signatures.totalSize).toBe(file.size);
      expect(signatures.blocks.length).toBeGreaterThan(0);
      expect(signatures.blocks[0]).toHaveProperty('index');
      expect(signatures.blocks[0]).toHaveProperty('offset');
      expect(signatures.blocks[0]).toHaveProperty('size');
      expect(signatures.blocks[0]).toHaveProperty('hash');
      expect(signatures.blocks[0]!.hash).toHaveLength(64); // SHA-256 hex
    });

    it('should handle empty files', async () => {
      const file = new File([], 'empty.txt');
      const signatures = await computeBlockSignatures(file, 4096);

      expect(signatures.blocks.length).toBe(0);
      expect(signatures.totalSize).toBe(0);
    });

    it('should handle files smaller than block size', async () => {
      const content = 'Small file';
      const file = new File([content], 'small.txt');

      const signatures = await computeBlockSignatures(file, 4096);

      expect(signatures.blocks.length).toBe(1);
      expect(signatures.blocks[0]!.size).toBe(content.length);
    });

    it('should validate block size limits', async () => {
      const file = new File(['test'], 'test.txt');

      await expect(computeBlockSignatures(file, 512)).rejects.toThrow();
      await expect(computeBlockSignatures(file, 2 * 1024 * 1024)).rejects.toThrow();
    });
  });

  describe('computeDelta', () => {
    it('should detect no changes for identical files', async () => {
      const content = 'Test content';
      const file1 = new File([content], 'file1.txt');
      const file2 = new File([content], 'file2.txt');

      const sig1 = await computeBlockSignatures(file1, 4096);
      const sig2 = await computeBlockSignatures(file2, 4096);

      const delta = computeDelta(sig1, sig2);

      expect(delta.unchanged.length).toBe(1);
      expect(delta.changed.length).toBe(0);
      expect(delta.added.length).toBe(0);
      expect(delta.removed.length).toBe(0);
    });

    it('should detect changed blocks', async () => {
      const original = 'AAAA'.repeat(2000); // 8KB
      const updated = 'AAAA'.repeat(1000) + 'BBBB'.repeat(1000); // Second half changed

      const file1 = new File([original], 'file.txt');
      const file2 = new File([updated], 'file.txt');

      const sig1 = await computeBlockSignatures(file1, 4096);
      const sig2 = await computeBlockSignatures(file2, 4096);

      const delta = computeDelta(sig2, sig1);

      expect(delta.unchanged.length).toBeGreaterThan(0);
      expect(delta.changed.length).toBeGreaterThan(0);
    });

    it('should detect added blocks when file grows', async () => {
      const original = 'A'.repeat(4000);
      const updated = 'A'.repeat(8000); // Double size

      const file1 = new File([original], 'file.txt');
      const file2 = new File([updated], 'file.txt');

      const sig1 = await computeBlockSignatures(file1, 4096);
      const sig2 = await computeBlockSignatures(file2, 4096);

      const delta = computeDelta(sig2, sig1);

      expect(delta.added.length).toBeGreaterThan(0);
      expect(delta.removed.length).toBe(0);
    });

    it('should detect removed blocks when file shrinks', async () => {
      const original = 'A'.repeat(8000);
      const updated = 'A'.repeat(4000); // Half size

      const file1 = new File([original], 'file.txt');
      const file2 = new File([updated], 'file.txt');

      const sig1 = await computeBlockSignatures(file1, 4096);
      const sig2 = await computeBlockSignatures(file2, 4096);

      const delta = computeDelta(sig2, sig1);

      expect(delta.removed.length).toBeGreaterThan(0);
      expect(delta.added.length).toBe(0);
    });
  });

  describe('createPatch and applyPatch', () => {
    it('should create and apply patch correctly', async () => {
      const original = 'AAAA'.repeat(2000);
      const updated = 'AAAA'.repeat(1000) + 'BBBB'.repeat(1000);

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');

      const blockSize = 4096;
      const originalSig = await computeBlockSignatures(originalFile, blockSize);
      const updatedSig = await computeBlockSignatures(updatedFile, blockSize);

      const delta = computeDelta(updatedSig, originalSig);
      const patch = await createPatch(updatedFile, delta, blockSize);

      expect(patch.blocks.length).toBeGreaterThan(0);
      expect(patch.blocks.length).toBe(delta.changed.length + delta.added.length);

      // Apply patch
      const reconstructed = await applyPatch(originalFile, patch, delta, blockSize);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(updated);
    });

    it('should handle patches with only additions', async () => {
      const original = 'A'.repeat(4000);
      const updated = 'A'.repeat(4000) + 'B'.repeat(4000);

      const originalFile = new File([original], 'file.txt');
      const updatedFile = new File([updated], 'file.txt');

      const blockSize = 4096;
      const originalSig = await computeBlockSignatures(originalFile, blockSize);
      const updatedSig = await computeBlockSignatures(updatedFile, blockSize);

      const delta = computeDelta(updatedSig, originalSig);
      const patch = await createPatch(updatedFile, delta, blockSize);

      const reconstructed = await applyPatch(originalFile, patch, delta, blockSize);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(updated);
    });

    it('should reconstruct identical file when no changes', async () => {
      const content = 'Unchanged content';
      const file = new File([content], 'file.txt');

      const blockSize = 4096;
      const sig = await computeBlockSignatures(file, blockSize);
      const delta = computeDelta(sig, sig);
      const patch = await createPatch(file, delta, blockSize);

      expect(patch.blocks.length).toBe(0); // No changed blocks

      const reconstructed = await applyPatch(file, patch, delta, blockSize);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(content);
    });
  });

  describe('estimateSavings', () => {
    it('should calculate savings correctly', async () => {
      const original = 'AAAA'.repeat(2000); // 8KB
      const updated = 'AAAA'.repeat(1000) + 'BBBB'.repeat(1000); // Half changed

      const file1 = new File([original], 'file.txt');
      const file2 = new File([updated], 'file.txt');

      const blockSize = 4096;
      const sig1 = await computeBlockSignatures(file1, blockSize);
      const sig2 = await computeBlockSignatures(file2, blockSize);

      const delta = computeDelta(sig2, sig1);
      const savings = estimateSavings(delta, sig2.blocks.length, blockSize);

      expect(savings.originalBytes).toBeGreaterThan(0);
      expect(savings.patchBytes).toBeGreaterThan(0);
      expect(savings.patchBytes).toBeLessThan(savings.originalBytes);
      expect(savings.savedBytes).toBeGreaterThan(0);
      expect(savings.savingsPercent).toBeGreaterThan(0);
      expect(savings.savingsPercent).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'moderate', 'poor']).toContain(savings.efficiency);
    });

    it('should rate efficiency correctly', async () => {
      const blockSize = 4096;

      // Excellent savings (80%)
      const delta1 = {
        unchanged: [0, 1, 2, 3],
        changed: [4],
        added: [],
        removed: [],
      };
      const savings1 = estimateSavings(delta1, 5, blockSize);
      expect(savings1.efficiency).toBe('excellent');

      // Good savings (60%)
      const delta2 = {
        unchanged: [0, 1, 2],
        changed: [3, 4],
        added: [],
        removed: [],
      };
      const savings2 = estimateSavings(delta2, 5, blockSize);
      expect(savings2.efficiency).toBe('good');

      // Moderate savings (40%)
      const delta3 = {
        unchanged: [0, 1],
        changed: [2, 3, 4],
        added: [],
        removed: [],
      };
      const savings3 = estimateSavings(delta3, 5, blockSize);
      expect(savings3.efficiency).toBe('moderate');

      // Poor savings (20%)
      const delta4 = {
        unchanged: [0],
        changed: [1, 2, 3, 4],
        added: [],
        removed: [],
      };
      const savings4 = estimateSavings(delta4, 5, blockSize);
      expect(savings4.efficiency).toBe('poor');
    });
  });

  describe('calculateOptimalBlockSize', () => {
    it('should calculate optimal block size based on file size', () => {
      expect(calculateOptimalBlockSize(50 * 1024)).toBe(1024); // 50KB -> 1KB
      expect(calculateOptimalBlockSize(500 * 1024)).toBe(4 * 1024); // 500KB -> 4KB
      expect(calculateOptimalBlockSize(5 * 1024 * 1024)).toBe(16 * 1024); // 5MB -> 16KB
      expect(calculateOptimalBlockSize(50 * 1024 * 1024)).toBe(64 * 1024); // 50MB -> 64KB
      expect(calculateOptimalBlockSize(500 * 1024 * 1024)).toBe(256 * 1024); // 500MB -> 256KB
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize signatures', async () => {
      const file = new File(['Test content'], 'test.txt');
      const signatures = await computeBlockSignatures(file, 4096);

      const json = serializeSignatures(signatures);
      expect(typeof json).toBe('string');

      const deserialized = deserializeSignatures(json);
      expect(deserialized).toEqual(signatures);
    });

    it('should validate signatures structure', async () => {
      const file = new File(['Test'], 'test.txt');
      const signatures = await computeBlockSignatures(file, 4096);

      expect(validateSignatures(signatures)).toBe(true);

      // Invalid signatures
      expect(validateSignatures({} as any)).toBe(false);
      expect(validateSignatures({ blockSize: 0, totalSize: 0, blocks: 'invalid' } as any)).toBe(false);
    });

    it('should validate patch structure', async () => {
      const file = new File(['A'.repeat(8000)], 'test.txt');
      const sig = await computeBlockSignatures(file, 4096);
      const delta = computeDelta(sig, sig);
      const patch = await createPatch(file, delta, 4096);

      expect(validatePatch(patch)).toBe(true);

      // Invalid patch
      expect(validatePatch({} as any)).toBe(false);
      expect(validatePatch({ blockSize: 0, totalBlocks: 0, blocks: 'invalid', delta: {} } as any)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle binary data', async () => {
      const binary = new Uint8Array(8000);
      for (let i = 0; i < binary.length; i++) {
        binary[i] = i % 256;
      }

      const file = new File([binary], 'binary.dat', { type: 'application/octet-stream' });
      const signatures = await computeBlockSignatures(file, 4096);

      expect(signatures.blocks.length).toBe(2);
      expect(signatures.blocks[0]!.hash).toHaveLength(64);
    });

    it('should handle large files efficiently', async () => {
      const largeContent = 'A'.repeat(1024 * 1024); // 1MB
      const file = new File([largeContent], 'large.txt');

      const start = Date.now();
      const signatures = await computeBlockSignatures(file, 64 * 1024);
      const elapsed = Date.now() - start;

      // Should complete in reasonable time
      expect(elapsed).toBeLessThan(5000); // 5 seconds
      expect(signatures.blocks.length).toBeGreaterThan(0);
    });

    it('should handle files with exact block size', async () => {
      const content = 'A'.repeat(4096);
      const file = new File([content], 'exact.txt');

      const signatures = await computeBlockSignatures(file, 4096);
      expect(signatures.blocks.length).toBe(1);
      expect(signatures.blocks[0]!.size).toBe(4096);
    });

    it('should handle multiple block sizes', async () => {
      const content = 'Test content';
      const file = new File([content], 'test.txt');

      const sig1 = await computeBlockSignatures(file, 1024);
      const sig2 = await computeBlockSignatures(file, 4096);
      const sig3 = await computeBlockSignatures(file, 16384);

      expect(sig1.blockSize).toBe(1024);
      expect(sig2.blockSize).toBe(4096);
      expect(sig3.blockSize).toBe(16384);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle document update scenario', async () => {
      // Original document
      const original = `# Document Title

This is the first paragraph.
This is the second paragraph.
This is the third paragraph.`;

      // Updated document (added paragraph)
      const updated = `# Document Title

This is the first paragraph.
This is the second paragraph.
This is the NEW paragraph inserted here.
This is the third paragraph.`;

      const originalFile = new File([original], 'doc.txt');
      const updatedFile = new File([updated], 'doc.txt');

      const blockSize = 1024;
      const originalSig = await computeBlockSignatures(originalFile, blockSize);
      const updatedSig = await computeBlockSignatures(updatedFile, blockSize);

      const delta = computeDelta(updatedSig, originalSig);
      const savings = estimateSavings(delta, updatedSig.blocks.length, blockSize);
      expect(savings.savingsPercent).toBeGreaterThanOrEqual(0);

      // Should detect some unchanged blocks
      expect(delta.unchanged.length).toBeGreaterThan(0);

      // Create and apply patch
      const patch = await createPatch(updatedFile, delta, blockSize);
      const reconstructed = await applyPatch(originalFile, patch, delta, blockSize);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(updated);
    });

    it('should handle log file append scenario', async () => {
      const originalLog = 'Log entry 1\nLog entry 2\nLog entry 3\n';
      const updatedLog = originalLog + 'Log entry 4\nLog entry 5\n';

      const originalFile = new File([originalLog], 'app.log');
      const updatedFile = new File([updatedLog], 'app.log');

      const blockSize = 1024;
      const originalSig = await computeBlockSignatures(originalFile, blockSize);
      const updatedSig = await computeBlockSignatures(updatedFile, blockSize);

      const delta = computeDelta(updatedSig, originalSig);
      const savings = estimateSavings(delta, updatedSig.blocks.length, blockSize);

      // Should have high savings (most blocks unchanged)
      expect(savings.savingsPercent).toBeGreaterThan(0);

      // Apply patch
      const patch = await createPatch(updatedFile, delta, blockSize);
      const reconstructed = await applyPatch(originalFile, patch, delta, blockSize);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(updatedLog);
    });
  });
});
