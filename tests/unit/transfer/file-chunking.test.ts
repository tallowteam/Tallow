/**
 * File Chunking Unit Tests
 *
 * Tests for ChunkCollector, calculateOptimalChunkSize, and related utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ChunkCollector,
  chunkFile,
  readAllChunks,
  calculateOptimalChunkSize,
  estimateTransferTime,
  formatFileSize,
  formatSpeed,
  formatDuration,
  DEFAULT_CHUNK_SIZE,
  LOCAL_CHUNK_SIZE,
  type ChunkMeta,
} from '@/lib/transfer/file-chunking';
import { hash } from '@/lib/transfer/encryption';
import type { TransferChunk } from '@/lib/types';

// Mock the secure-logger to suppress console output during tests
vi.mock('@/lib/utils/secure-logger', () => ({
  default: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

/**
 * Helper function to create a mock File object
 */
function createMockFile(
  name: string,
  size: number,
  type: string = 'application/octet-stream'
): File {
  // Create content of specified size
  const content = new Uint8Array(size);
  // Fill with semi-random data based on index for consistency
  for (let i = 0; i < size; i++) {
    content[i] = i % 256;
  }
  const blob = new Blob([content], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
}

/**
 * Helper function to create a valid TransferChunk with correct hash
 */
async function createValidChunk(
  transferId: string,
  chunkIndex: number,
  totalChunks: number,
  data: ArrayBuffer
): Promise<TransferChunk> {
  const chunkHash = await hash(data);
  return {
    transferId,
    chunkIndex,
    totalChunks,
    data,
    hash: chunkHash,
    encrypted: false,
  };
}

/**
 * Helper function to create a chunk with invalid hash
 */
function createInvalidChunk(
  transferId: string,
  chunkIndex: number,
  totalChunks: number,
  data: ArrayBuffer
): TransferChunk {
  return {
    transferId,
    chunkIndex,
    totalChunks,
    data,
    hash: 'invalid_hash_value_that_does_not_match',
    encrypted: false,
  };
}

/**
 * Helper to create chunk metadata
 */
function createChunkMeta(
  totalChunks: number,
  fileSize: number,
  chunkSize: number = DEFAULT_CHUNK_SIZE
): ChunkMeta {
  return {
    transferId: 'test-transfer-123',
    fileId: 'test-file-456',
    fileName: 'test-file.txt',
    fileSize,
    totalChunks,
    chunkSize,
  };
}

describe('File Chunking Module', () => {
  // ============================================================================
  // ChunkCollector Tests (15 tests)
  // ============================================================================
  describe('ChunkCollector', () => {
    let collector: ChunkCollector;

    beforeEach(() => {
      collector = new ChunkCollector();
    });

    afterEach(() => {
      collector.clear();
    });

    it('should add a valid chunk successfully', async () => {
      const meta = createChunkMeta(3, 192);
      collector.setMeta(meta);

      const data = new Uint8Array([1, 2, 3, 4]).buffer;
      const chunk = await createValidChunk('test-transfer', 0, 3, data);

      const result = await collector.addChunk(chunk);

      expect(result).toBe(true);
      expect(collector.getReceivedBytes()).toBe(4);
    });

    it('should verify chunk hash during addChunk', async () => {
      const meta = createChunkMeta(2, 100);
      collector.setMeta(meta);

      const data = new Uint8Array([10, 20, 30, 40, 50]).buffer;
      const chunk = await createValidChunk('test-transfer', 0, 2, data);

      // The hash should match
      const result = await collector.addChunk(chunk);
      expect(result).toBe(true);
    });

    it('should reject chunk with invalid hash', async () => {
      const meta = createChunkMeta(2, 100);
      collector.setMeta(meta);

      const data = new Uint8Array([1, 2, 3]).buffer;
      const invalidChunk = createInvalidChunk('test-transfer', 0, 2, data);

      const result = await collector.addChunk(invalidChunk);

      expect(result).toBe(false);
      expect(collector.getReceivedBytes()).toBe(0);
    });

    it('should return correct list of missing chunks', async () => {
      const meta = createChunkMeta(5, 500);
      collector.setMeta(meta);

      // Add chunks 0, 2, and 4 (missing 1 and 3)
      const data = new Uint8Array([1, 2, 3, 4]).buffer;

      const chunk0 = await createValidChunk('test', 0, 5, data);
      const chunk2 = await createValidChunk('test', 2, 5, data);
      const chunk4 = await createValidChunk('test', 4, 5, data);

      await collector.addChunk(chunk0);
      await collector.addChunk(chunk2);
      await collector.addChunk(chunk4);

      const missing = collector.getMissingChunks();

      expect(missing).toEqual([1, 3]);
    });

    it('should assemble chunks into correct blob', async () => {
      const meta = createChunkMeta(3, 12);
      collector.setMeta(meta);

      // Create 3 chunks with distinct data
      const data1 = new Uint8Array([1, 2, 3, 4]).buffer;
      const data2 = new Uint8Array([5, 6, 7, 8]).buffer;
      const data3 = new Uint8Array([9, 10, 11, 12]).buffer;

      const chunk0 = await createValidChunk('test', 0, 3, data1);
      const chunk1 = await createValidChunk('test', 1, 3, data2);
      const chunk2 = await createValidChunk('test', 2, 3, data3);

      await collector.addChunk(chunk0);
      await collector.addChunk(chunk1);
      await collector.addChunk(chunk2);

      const blob = collector.assemble();

      expect(blob).toBeInstanceOf(Blob);
      expect(blob?.size).toBe(12);

      // Verify content
      const arrayBuffer = await blob!.arrayBuffer();
      const assembled = new Uint8Array(arrayBuffer);
      expect(Array.from(assembled)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    });

    it('should handle out-of-order chunks correctly', async () => {
      const meta = createChunkMeta(4, 16);
      collector.setMeta(meta);

      const data1 = new Uint8Array([1, 1, 1, 1]).buffer;
      const data2 = new Uint8Array([2, 2, 2, 2]).buffer;
      const data3 = new Uint8Array([3, 3, 3, 3]).buffer;
      const data4 = new Uint8Array([4, 4, 4, 4]).buffer;

      // Add chunks out of order: 3, 0, 2, 1
      const chunk3 = await createValidChunk('test', 3, 4, data4);
      const chunk0 = await createValidChunk('test', 0, 4, data1);
      const chunk2 = await createValidChunk('test', 2, 4, data3);
      const chunk1 = await createValidChunk('test', 1, 4, data2);

      await collector.addChunk(chunk3);
      await collector.addChunk(chunk0);
      await collector.addChunk(chunk2);
      await collector.addChunk(chunk1);

      expect(collector.isComplete()).toBe(true);

      const blob = collector.assemble();
      const arrayBuffer = await blob!.arrayBuffer();
      const assembled = new Uint8Array(arrayBuffer);

      // Should be assembled in correct order regardless of arrival order
      expect(Array.from(assembled)).toEqual([
        1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4,
      ]);
    });

    it('should handle duplicate chunks without issues', async () => {
      const meta = createChunkMeta(2, 8);
      collector.setMeta(meta);

      const data1 = new Uint8Array([1, 2, 3, 4]).buffer;
      const data2 = new Uint8Array([5, 6, 7, 8]).buffer;

      const chunk0 = await createValidChunk('test', 0, 2, data1);
      const chunk1 = await createValidChunk('test', 1, 2, data2);

      // Add chunk0 twice
      await collector.addChunk(chunk0);
      await collector.addChunk(chunk0); // duplicate
      await collector.addChunk(chunk1);

      expect(collector.isComplete()).toBe(true);

      const blob = collector.assemble();
      expect(blob?.size).toBe(8);
    });

    it('should return true for isComplete when all chunks received', async () => {
      const meta = createChunkMeta(3, 12);
      collector.setMeta(meta);

      expect(collector.isComplete()).toBe(false);

      const data = new Uint8Array([1, 2, 3, 4]).buffer;

      const chunk0 = await createValidChunk('test', 0, 3, data);
      const chunk1 = await createValidChunk('test', 1, 3, data);
      const chunk2 = await createValidChunk('test', 2, 3, data);

      await collector.addChunk(chunk0);
      expect(collector.isComplete()).toBe(false);

      await collector.addChunk(chunk1);
      expect(collector.isComplete()).toBe(false);

      await collector.addChunk(chunk2);
      expect(collector.isComplete()).toBe(true);
    });

    it('should track progress correctly', async () => {
      const meta = createChunkMeta(4, 16);
      collector.setMeta(meta);

      expect(collector.getProgress()).toBe(0);

      const data = new Uint8Array([1, 2, 3, 4]).buffer;

      const chunk0 = await createValidChunk('test', 0, 4, data);
      await collector.addChunk(chunk0);
      expect(collector.getProgress()).toBe(25);

      const chunk1 = await createValidChunk('test', 1, 4, data);
      await collector.addChunk(chunk1);
      expect(collector.getProgress()).toBe(50);

      const chunk2 = await createValidChunk('test', 2, 4, data);
      await collector.addChunk(chunk2);
      expect(collector.getProgress()).toBe(75);

      const chunk3 = await createValidChunk('test', 3, 4, data);
      await collector.addChunk(chunk3);
      expect(collector.getProgress()).toBe(100);
    });

    it('should track received bytes accurately', async () => {
      const meta = createChunkMeta(3, 15);
      collector.setMeta(meta);

      const data1 = new Uint8Array([1, 2, 3, 4, 5]).buffer; // 5 bytes
      const data2 = new Uint8Array([6, 7, 8, 9, 10]).buffer; // 5 bytes
      const data3 = new Uint8Array([11, 12, 13, 14, 15]).buffer; // 5 bytes

      const chunk0 = await createValidChunk('test', 0, 3, data1);
      const chunk1 = await createValidChunk('test', 1, 3, data2);
      const chunk2 = await createValidChunk('test', 2, 3, data3);

      await collector.addChunk(chunk0);
      expect(collector.getReceivedBytes()).toBe(5);

      await collector.addChunk(chunk1);
      expect(collector.getReceivedBytes()).toBe(10);

      await collector.addChunk(chunk2);
      expect(collector.getReceivedBytes()).toBe(15);
    });

    it('should return null when assembling incomplete file', async () => {
      const meta = createChunkMeta(3, 12);
      collector.setMeta(meta);

      const data = new Uint8Array([1, 2, 3, 4]).buffer;
      const chunk0 = await createValidChunk('test', 0, 3, data);
      const chunk2 = await createValidChunk('test', 2, 3, data);

      await collector.addChunk(chunk0);
      await collector.addChunk(chunk2);
      // Missing chunk 1

      const blob = collector.assemble();
      expect(blob).toBeNull();
    });

    it('should return empty missing chunks when no meta is set', () => {
      const missing = collector.getMissingChunks();
      expect(missing).toEqual([]);
    });

    it('should return 0 progress when no meta is set', () => {
      expect(collector.getProgress()).toBe(0);
    });

    it('should clear all data on clear()', async () => {
      const meta = createChunkMeta(2, 8);
      collector.setMeta(meta);

      const data = new Uint8Array([1, 2, 3, 4]).buffer;
      const chunk = await createValidChunk('test', 0, 2, data);
      await collector.addChunk(chunk);

      expect(collector.getReceivedBytes()).toBe(4);
      expect(collector.getProgress()).toBe(50);

      collector.clear();

      expect(collector.getReceivedBytes()).toBe(0);
      expect(collector.getProgress()).toBe(0);
      expect(collector.isComplete()).toBe(false);
      expect(collector.getMissingChunks()).toEqual([]);
    });
  });

  // ============================================================================
  // calculateOptimalChunkSize Tests (5 tests)
  // ============================================================================
  describe('calculateOptimalChunkSize', () => {
    it('should return default chunk size for unknown network (small file)', () => {
      const fileSize = 10 * 1024 * 1024; // 10MB
      const chunkSize = calculateOptimalChunkSize(fileSize, false);

      expect(chunkSize).toBe(DEFAULT_CHUNK_SIZE); // 64KB
    });

    it('should return larger chunk size for LAN connections', () => {
      const fileSize = 50 * 1024 * 1024; // 50MB
      const chunkSize = calculateOptimalChunkSize(fileSize, true);

      expect(chunkSize).toBe(LOCAL_CHUNK_SIZE); // 1MB
    });

    it('should return even larger chunk size for LAN with very large files', () => {
      const fileSize = 200 * 1024 * 1024; // 200MB (> 100MB threshold)
      const chunkSize = calculateOptimalChunkSize(fileSize, true);

      expect(chunkSize).toBe(4 * 1024 * 1024); // 4MB
    });

    it('should return smaller chunk size for slow connections (large files)', () => {
      const fileSize = 500 * 1024 * 1024; // 500MB
      const chunkSize = calculateOptimalChunkSize(fileSize, false);

      expect(chunkSize).toBe(128 * 1024); // 128KB for files > 100MB on internet
    });

    it('should return appropriate size for very large files on internet', () => {
      const fileSize = 2 * 1024 * 1024 * 1024; // 2GB (> 1GB threshold)
      const chunkSize = calculateOptimalChunkSize(fileSize, false);

      expect(chunkSize).toBe(256 * 1024); // 256KB for files > 1GB
    });
  });

  // ============================================================================
  // Edge Cases Tests (5 tests)
  // ============================================================================
  describe('Edge Cases', () => {
    it('should handle empty file (0 bytes)', async () => {
      const file = createMockFile('empty.txt', 0);
      const chunks: TransferChunk[] = [];

      for await (const chunk of chunkFile(file, 'test-transfer')) {
        chunks.push(chunk);
      }

      // Empty file should produce no chunks
      expect(chunks).toHaveLength(0);
    });

    it('should handle single chunk file', async () => {
      // File smaller than default chunk size
      const file = createMockFile('small.txt', 100); // 100 bytes < 64KB
      const chunks: TransferChunk[] = [];

      for await (const chunk of chunkFile(file, 'test-transfer')) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0]?.chunkIndex).toBe(0);
      expect(chunks[0]?.totalChunks).toBe(1);
      expect(chunks[0]?.data.byteLength).toBe(100);
    });

    it('should handle file exactly at chunk boundary', async () => {
      // File size exactly equals 2 chunks
      const chunkSize = 1024; // 1KB for testing
      const file = createMockFile('exact.bin', chunkSize * 2); // Exactly 2KB

      const chunks: TransferChunk[] = [];
      for await (const chunk of chunkFile(file, 'test-transfer', chunkSize)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]?.data.byteLength).toBe(chunkSize);
      expect(chunks[1]?.data.byteLength).toBe(chunkSize);
    });

    it('should calculate correct chunk count for large files', async () => {
      // Simulate large file chunking calculation
      const fileSize = 10 * 1024 * 1024; // 10MB
      const chunkSize = DEFAULT_CHUNK_SIZE; // 64KB
      const expectedChunks = Math.ceil(fileSize / chunkSize);

      expect(expectedChunks).toBe(160); // 10MB / 64KB = 160 chunks

      // Verify with actual file
      const file = createMockFile('large.bin', fileSize);
      const chunks: TransferChunk[] = [];

      for await (const chunk of chunkFile(file, 'test-transfer', chunkSize)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(expectedChunks);
      expect(chunks[expectedChunks - 1]?.chunkIndex).toBe(expectedChunks - 1);
    });

    it('should handle last chunk smaller than chunk size', async () => {
      const chunkSize = 1000;
      const fileSize = 2500; // Results in chunks of 1000, 1000, 500
      const file = createMockFile('uneven.bin', fileSize);

      const chunks: TransferChunk[] = [];
      for await (const chunk of chunkFile(file, 'test-transfer', chunkSize)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0]?.data.byteLength).toBe(1000);
      expect(chunks[1]?.data.byteLength).toBe(1000);
      expect(chunks[2]?.data.byteLength).toBe(500);
    });
  });

  // ============================================================================
  // Additional Utility Function Tests
  // ============================================================================
  describe('Utility Functions', () => {
    describe('readAllChunks', () => {
      it('should read all chunks with progress callback', async () => {
        const file = createMockFile('test.bin', 3000);
        const chunkSize = 1000;
        const progressUpdates: number[] = [];

        const chunks = await readAllChunks(
          file,
          'test-transfer',
          chunkSize,
          (progress) => progressUpdates.push(progress)
        );

        expect(chunks).toHaveLength(3);
        expect(progressUpdates).toHaveLength(3);
        expect(progressUpdates[0]).toBeCloseTo(33.33, 1);
        expect(progressUpdates[1]).toBeCloseTo(66.67, 1);
        expect(progressUpdates[2]).toBe(100);
      });
    });

    describe('estimateTransferTime', () => {
      it('should estimate transfer time correctly', () => {
        const fileSize = 1024 * 1024; // 1MB
        const speed = 1024 * 1024; // 1MB/s

        const time = estimateTransferTime(fileSize, speed);
        expect(time).toBe(1); // 1 second
      });

      it('should return Infinity for zero speed', () => {
        const time = estimateTransferTime(1024, 0);
        expect(time).toBe(Infinity);
      });

      it('should return Infinity for negative speed', () => {
        const time = estimateTransferTime(1024, -100);
        expect(time).toBe(Infinity);
      });
    });

    describe('formatFileSize', () => {
      it('should format bytes correctly', () => {
        expect(formatFileSize(0)).toBe('0 B');
        expect(formatFileSize(512)).toBe('512 B');
        expect(formatFileSize(1024)).toBe('1 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
        expect(formatFileSize(1048576)).toBe('1 MB');
        expect(formatFileSize(1073741824)).toBe('1 GB');
      });
    });

    describe('formatSpeed', () => {
      it('should format speed with /s suffix', () => {
        expect(formatSpeed(1024)).toBe('1 KB/s');
        expect(formatSpeed(1048576)).toBe('1 MB/s');
      });
    });

    describe('formatDuration', () => {
      it('should format duration correctly', () => {
        expect(formatDuration(0)).toBe('0:00');
        expect(formatDuration(59)).toBe('0:59');
        expect(formatDuration(60)).toBe('1:00');
        expect(formatDuration(3661)).toBe('1:01:01');
      });

      it('should handle invalid values', () => {
        expect(formatDuration(Infinity)).toBe('--:--');
        expect(formatDuration(-1)).toBe('--:--');
        expect(formatDuration(NaN)).toBe('--:--');
      });
    });
  });
});
