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
  serializePatch,
  deserializePatch,
  validateSignatures,
  validatePatch,
} from '../../../lib/transfer/delta-sync';

describe('Delta Sync', () => {
  function createTestFile(content: string, name = 'test.txt'): File {
    return new File([content], name, { type: 'text/plain' });
  }

  describe('computeBlockSignatures', () => {
    it('should compute signatures for file', async () => {
      const file = createTestFile('Hello World '.repeat(100));
      const signatures = await computeBlockSignatures(file, 1024);

      expect(signatures.blockSize).toBe(1024);
      expect(signatures.totalSize).toBe(file.size);
      expect(signatures.blocks.length).toBeGreaterThan(0);
    });

    it('should compute correct number of blocks', async () => {
      const content = 'A'.repeat(10000); // 10KB
      const file = createTestFile(content);
      const signatures = await computeBlockSignatures(file, 1024); // 1KB blocks

      expect(signatures.blocks.length).toBe(Math.ceil(10000 / 1024));
    });

    it('should have valid SHA-256 hashes', async () => {
      const file = createTestFile('Test data');
      const signatures = await computeBlockSignatures(file, 1024);

      signatures.blocks.forEach(block => {
        expect(block.hash).toMatch(/^[a-f0-9]{64}$/); // SHA-256 = 64 hex chars
        expect(block.index).toBeGreaterThanOrEqual(0);
        expect(block.size).toBeGreaterThan(0);
      });
    });

    it('should handle empty file', async () => {
      const file = createTestFile('');
      const signatures = await computeBlockSignatures(file, 1024);

      expect(signatures.blocks.length).toBe(0);
      expect(signatures.totalSize).toBe(0);
    });

    it('should reject invalid block size', async () => {
      const file = createTestFile('Test');

      await expect(computeBlockSignatures(file, 100)).rejects.toThrow();
      await expect(computeBlockSignatures(file, 2 * 1024 * 1024)).rejects.toThrow();
    });
  });

  describe('computeDelta', () => {
    it('should detect unchanged blocks', async () => {
      const content = 'Same content for both files';
      const file1 = createTestFile(content);
      const file2 = createTestFile(content);

      const sig1 = await computeBlockSignatures(file1, 1024);
      const sig2 = await computeBlockSignatures(file2, 1024);

      const delta = computeDelta(sig1, sig2);

      expect(delta.unchanged.length).toBe(sig1.blocks.length);
      expect(delta.changed.length).toBe(0);
      expect(delta.added.length).toBe(0);
      expect(delta.removed.length).toBe(0);
    });

    it('should detect changed blocks', async () => {
      const file1 = createTestFile('Original content '.repeat(100));
      const file2 = createTestFile('Modified content '.repeat(100));

      const sig1 = await computeBlockSignatures(file1, 1024);
      const sig2 = await computeBlockSignatures(file2, 1024);

      const delta = computeDelta(sig1, sig2);

      expect(delta.changed.length).toBeGreaterThan(0);
    });

    it('should detect added blocks', async () => {
      const file1 = createTestFile('Short content');
      const file2 = createTestFile('Short content' + 'X'.repeat(5000));

      const sig1 = await computeBlockSignatures(file1, 1024); // older
      const sig2 = await computeBlockSignatures(file2, 1024); // newer

      const delta = computeDelta(sig2, sig1);

      expect(delta.added.length).toBeGreaterThan(0);
    });

    it('should detect removed blocks', async () => {
      const file1 = createTestFile('Long content '.repeat(1000));
      const file2 = createTestFile('Long content '.repeat(100));

      const sig1 = await computeBlockSignatures(file1, 1024); // older
      const sig2 = await computeBlockSignatures(file2, 1024); // newer

      const delta = computeDelta(sig2, sig1);

      expect(delta.removed.length).toBeGreaterThan(0);
    });
  });

  describe('Patch Creation and Application', () => {
    it('should create patch from delta', async () => {
      const original = 'Original '.repeat(100);
      const modified = 'Modified '.repeat(100);

      const file1 = createTestFile(original);
      const file2 = createTestFile(modified);

      const sig1 = await computeBlockSignatures(file1, 1024);
      const sig2 = await computeBlockSignatures(file2, 1024);
      const delta = computeDelta(sig1, sig2);
      const patch = await createPatch(file1, delta, 1024);

      expect(patch.blockSize).toBe(1024);
      expect(patch.blocks.length).toBeGreaterThan(0);
      expect(patch.delta).toEqual(delta);
    });

    it('should apply patch to reconstruct file', async () => {
      const original = 'Original content here. ';
      const modified = original + 'Added new content!';

      const file1 = createTestFile(original);
      const file2 = createTestFile(modified);

      const sig1 = await computeBlockSignatures(file1, 1024);
      const sig2 = await computeBlockSignatures(file2, 1024);
      const delta = computeDelta(sig1, sig2);
      const patch = await createPatch(file1, delta, 1024);

      const reconstructed = await applyPatch(file2, patch, delta, 1024);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe(original);
    });

    it('should handle complete file replacement', async () => {
      const file1 = createTestFile('AAA'.repeat(1000));
      const file2 = createTestFile('BBB'.repeat(1000));

      const sig1 = await computeBlockSignatures(file1, 1024);
      const sig2 = await computeBlockSignatures(file2, 1024);
      const delta = computeDelta(sig1, sig2);
      const patch = await createPatch(file1, delta, 1024);

      const reconstructed = await applyPatch(file2, patch, delta, 1024);
      const reconstructedText = await reconstructed.text();

      expect(reconstructedText).toBe('AAA'.repeat(1000));
    });
  });

  describe('estimateSavings', () => {
    it('should calculate excellent savings', () => {
      const delta = {
        unchanged: [0, 1, 2, 3, 4, 5, 6, 7], // 8 unchanged
        changed: [8], // 1 changed
        added: [9], // 1 added
        removed: [],
      };

      const savings = estimateSavings(delta, 10, 1024);

      expect(savings.savingsPercent).toBeGreaterThan(75);
      expect(savings.efficiency).toBe('excellent');
    });

    it('should calculate good savings', () => {
      const delta = {
        unchanged: [0, 1, 2, 3, 4], // 5 unchanged
        changed: [5, 6], // 2 changed
        added: [7, 8], // 2 added
        removed: [],
      };

      const savings = estimateSavings(delta, 9, 1024);

      expect(savings.efficiency).toMatch(/good|moderate/);
    });

    it('should calculate poor savings', () => {
      const delta = {
        unchanged: [0], // 1 unchanged
        changed: [1, 2, 3, 4, 5, 6, 7, 8, 9], // 9 changed
        added: [],
        removed: [],
      };

      const savings = estimateSavings(delta, 10, 1024);

      expect(savings.savingsPercent).toBeLessThan(25);
      expect(savings.efficiency).toBe('poor');
    });

    it('should not have negative savings', () => {
      const delta = {
        unchanged: [],
        changed: [0, 1, 2, 3, 4],
        added: [],
        removed: [],
      };

      const savings = estimateSavings(delta, 5, 1024);

      expect(savings.savedBytes).toBeGreaterThanOrEqual(0);
      expect(savings.savingsPercent).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateOptimalBlockSize', () => {
    it('should use 1KB for small files', () => {
      expect(calculateOptimalBlockSize(50 * 1024)).toBe(1024);
    });

    it('should use 4KB for medium files', () => {
      expect(calculateOptimalBlockSize(500 * 1024)).toBe(4 * 1024);
    });

    it('should use 16KB for larger files', () => {
      expect(calculateOptimalBlockSize(5 * 1024 * 1024)).toBe(16 * 1024);
    });

    it('should use 64KB for even larger files', () => {
      expect(calculateOptimalBlockSize(50 * 1024 * 1024)).toBe(64 * 1024);
    });

    it('should use 256KB for huge files', () => {
      expect(calculateOptimalBlockSize(200 * 1024 * 1024)).toBe(256 * 1024);
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize signatures', async () => {
      const file = createTestFile('Test content');
      const signatures = await computeBlockSignatures(file, 1024);

      const serialized = serializeSignatures(signatures);
      const deserialized = deserializeSignatures(serialized);

      expect(deserialized.blockSize).toBe(signatures.blockSize);
      expect(deserialized.totalSize).toBe(signatures.totalSize);
      expect(deserialized.blocks.length).toBe(signatures.blocks.length);
    });

    it('should serialize and deserialize patch', async () => {
      const file = createTestFile('Test');
      await computeBlockSignatures(file, 1024);
      const delta = { unchanged: [], changed: [0], added: [], removed: [] };
      const patch = await createPatch(file, delta, 1024);

      const { metadata, blocks } = serializePatch(patch);
      const deserialized = deserializePatch(metadata, blocks);

      expect(deserialized.blockSize).toBe(patch.blockSize);
      expect(deserialized.totalBlocks).toBe(patch.totalBlocks);
      expect(deserialized.blocks.length).toBe(patch.blocks.length);
    });

    it('should throw on invalid signature format', () => {
      expect(() => deserializeSignatures('{}')).toThrow();
      expect(() => deserializeSignatures('invalid json')).toThrow();
    });

    it('should throw on invalid patch format', () => {
      expect(() => deserializePatch('{}', [])).toThrow();
    });
  });

  describe('Validation', () => {
    it('should validate correct signatures', async () => {
      const file = createTestFile('Test');
      const signatures = await computeBlockSignatures(file, 1024);

      expect(validateSignatures(signatures)).toBe(true);
    });

    it('should reject invalid signatures', () => {
      expect(validateSignatures({ blockSize: 0, totalSize: 0, blocks: [] })).toBe(false);
      expect(validateSignatures({ blockSize: 1024, totalSize: 0, blocks: [{ index: 0, offset: 0, size: 0, hash: 'invalid' }] })).toBe(false);
    });

    it('should validate correct patch', async () => {
      const file = createTestFile('Test');
      await computeBlockSignatures(file, 1024);
      const delta = { unchanged: [], changed: [0], added: [], removed: [] };
      const patch = await createPatch(file, delta, 1024);

      expect(validatePatch(patch)).toBe(true);
    });

    it('should reject invalid patch', () => {
      expect(validatePatch({ blockSize: 0, totalBlocks: 0, blocks: [], delta: {} as any })).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single-block file', async () => {
      const file = createTestFile('Small');
      const signatures = await computeBlockSignatures(file, 1024);

      expect(signatures.blocks.length).toBe(1);
    });

    it('should handle exact block boundary', async () => {
      const content = 'A'.repeat(1024);
      const file = createTestFile(content);
      const signatures = await computeBlockSignatures(file, 1024);

      expect(signatures.blocks.length).toBe(1);
      expect(signatures.blocks[0].size).toBe(1024);
    });

    it('should handle partial last block', async () => {
      const content = 'A'.repeat(1500);
      const file = createTestFile(content);
      const signatures = await computeBlockSignatures(file, 1024);

      expect(signatures.blocks.length).toBe(2);
      expect(signatures.blocks[1].size).toBe(476);
    });
  });
});
