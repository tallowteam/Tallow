import { describe, it, expect } from 'vitest';
import {
  analyzeCompressibility,
  sampleTest,
  compressFile,
  decompressFile,
  compressFiles,
  calculateAggregateStats,
  formatBytes,
  formatDuration,
} from '../../../lib/compression/compression-pipeline';

describe('Compression Pipeline', () => {
  // Helper to create test files
  function createTestFile(name: string, content: string): File {
    return new File([content], name, { type: 'text/plain' });
  }

  describe('analyzeCompressibility', () => {
    it('should detect compressible text file', async () => {
      const file = createTestFile('test.txt', 'Hello World '.repeat(100));
      const analysis = await analyzeCompressibility(file);

      expect(analysis.isCompressible).toBe(true);
      expect(analysis.reason).toContain('compressible');
    });

    it('should detect incompressible JPEG', async () => {
      // JPEG magic bytes: FF D8 FF
      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, ...new Array(100).fill(0)]);
      const file = new File([jpegData], 'image.jpg', { type: 'image/jpeg' });

      const analysis = await analyzeCompressibility(file);

      expect(analysis.isCompressible).toBe(false);
      expect(analysis.detectedType).toBe('image/jpeg');
    });

    it('should detect incompressible PNG', async () => {
      // PNG magic bytes
      const pngData = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, ...new Array(100).fill(0)]);
      const file = new File([pngData], 'image.png', { type: 'image/png' });

      const analysis = await analyzeCompressibility(file);

      expect(analysis.isCompressible).toBe(false);
      expect(analysis.detectedType).toBe('image/png');
    });

    it('should skip high-entropy files before compression', async () => {
      const randomData = new Uint8Array(64 * 1024);
      crypto.getRandomValues(randomData);
      const file = new File([randomData], 'entropy.bin', { type: 'application/octet-stream' });

      const analysis = await analyzeCompressibility(file);

      expect(analysis.isCompressible).toBe(false);
      expect(analysis.reason).toContain('High entropy sample');
      expect(analysis.reason).toContain('7.5');
    });

    it('should perform sample test on large files', async () => {
      const largeContent = 'A'.repeat(100000);
      const file = createTestFile('large.txt', largeContent);

      const analysis = await analyzeCompressibility(file);

      expect(analysis.estimatedRatio).toBeDefined();
      expect(analysis.sampleSize).toBeDefined();
    });
  });

  describe('sampleTest', () => {
    it('should test compression on file sample', async () => {
      const file = createTestFile('test.txt', 'Compressible data '.repeat(5000));
      const result = await sampleTest(file);

      expect(result.ratio).toBeGreaterThan(1);
      expect(result.sampleSize).toBeGreaterThan(0);
      expect(result.timeTaken).toBeGreaterThan(0);
    });

    it('should use 64KB sample size maximum', async () => {
      const file = createTestFile('large.txt', 'X'.repeat(200000));
      const result = await sampleTest(file);

      expect(result.sampleSize).toBeLessThanOrEqual(64 * 1024);
    });
  });

  describe('compressFile', () => {
    it('should compress text file', async () => {
      const content = 'This is compressible text. '.repeat(100);
      const file = createTestFile('test.txt', content);

      const result = await compressFile(file);

      expect(result.stats.compressedSize).toBeLessThan(result.stats.originalSize);
      expect(result.stats.ratio).toBeGreaterThan(1);
      expect(result.stats.algorithm).toBe('gzip');
      expect(result.stats.skipped).toBe(false);
    });

    it('should skip compression for JPEG', async () => {
      const jpegData = new Uint8Array([0xFF, 0xD8, 0xFF, ...new Array(100).fill(0)]);
      const file = new File([jpegData], 'image.jpg', { type: 'image/jpeg' });

      const result = await compressFile(file);

      expect(result.stats.skipped).toBe(true);
      expect(result.stats.algorithm).toBe('none');
      expect(result.stats.ratio).toBe(1.0);
    });

    it('should use deflate algorithm', async () => {
      const file = createTestFile('test.txt', 'Test data '.repeat(50));
      const result = await compressFile(file, 'deflate');

      expect(result.stats.algorithm).toBe('deflate');
    });

    it('should skip if compression ratio is too low', async () => {
      // Random data compresses poorly
      const randomData = new Uint8Array(1000);
      crypto.getRandomValues(randomData);
      const file = new File([randomData], 'random.bin');

      const result = await compressFile(file);

      expect(result.stats.skipped || result.stats.ratio < 1.2).toBe(true);
    });
  });

  describe('compressFile and decompressFile round-trip', () => {
    it('should compress and decompress to original', async () => {
      const original = 'Original content that will be compressed. '.repeat(50);
      const file = createTestFile('test.txt', original);

      const compressed = await compressFile(file, 'gzip');
      const decompressed = await decompressFile(compressed.data, 'gzip');

      const decompressedText = new TextDecoder().decode(decompressed);
      expect(decompressedText).toBe(original);
    });

    it('should work with deflate algorithm', async () => {
      const original = 'Deflate test data. '.repeat(30);
      const file = createTestFile('test.txt', original);

      const compressed = await compressFile(file, 'deflate');
      const decompressed = await decompressFile(compressed.data, 'deflate');

      const decompressedText = new TextDecoder().decode(decompressed);
      expect(decompressedText).toBe(original);
    });

    it('should work with deflate-raw algorithm', async () => {
      const original = 'Raw deflate test. '.repeat(20);
      const file = createTestFile('test.txt', original);

      const compressed = await compressFile(file, 'deflate-raw');
      const decompressed = await decompressFile(compressed.data, 'deflate-raw');

      const decompressedText = new TextDecoder().decode(decompressed);
      expect(decompressedText).toBe(original);
    });
  });

  describe('compressFiles', () => {
    it('should compress multiple files', async () => {
      const files = [
        createTestFile('file1.txt', 'Content 1 '.repeat(50)),
        createTestFile('file2.txt', 'Content 2 '.repeat(50)),
        createTestFile('file3.txt', 'Content 3 '.repeat(50)),
      ];

      const results = await compressFiles(files);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.stats).toBeDefined();
      });
    });

    it('should call progress callback', async () => {
      const files = [
        createTestFile('f1.txt', 'A'.repeat(100)),
        createTestFile('f2.txt', 'B'.repeat(100)),
      ];

      const progressCalls: Array<{ current: number; total: number; fileName: string }> = [];
      const onProgress = (current: number, total: number, fileName: string) => {
        progressCalls.push({ current, total, fileName });
      };

      await compressFiles(files, onProgress);

      expect(progressCalls).toHaveLength(2);
      expect(progressCalls[0].current).toBe(1);
      expect(progressCalls[1].current).toBe(2);
    });
  });

  describe('calculateAggregateStats', () => {
    it('should calculate total statistics', async () => {
      const files = [
        createTestFile('f1.txt', 'A'.repeat(1000)),
        createTestFile('f2.txt', 'B'.repeat(1000)),
      ];

      const results = await compressFiles(files);
      const stats = calculateAggregateStats(results);

      expect(stats.totalOriginalSize).toBeGreaterThan(0);
      expect(stats.totalCompressedSize).toBeGreaterThan(0);
      expect(stats.overallRatio).toBeGreaterThan(0);
      expect(stats.totalTimeTaken).toBeGreaterThan(0);
      expect(stats.filesCompressed + stats.filesSkipped).toBe(2);
    });

    it('should handle empty results', () => {
      const stats = calculateAggregateStats([]);

      expect(stats.totalOriginalSize).toBe(0);
      expect(stats.totalCompressedSize).toBe(0);
      expect(stats.filesCompressed).toBe(0);
      expect(stats.filesSkipped).toBe(0);
    });
  });

  describe('formatBytes', () => {
    it('should format zero bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatBytes(500)).toBe('500 B');
    });

    it('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(2.5 * 1024 * 1024)).toBe('2.5 MB');
    });

    it('should format gigabytes', () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(1500)).toBe('1.50s');
      expect(formatDuration(5000)).toBe('5.00s');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty file', async () => {
      const file = createTestFile('empty.txt', '');
      const result = await compressFile(file);

      expect(result.stats).toBeDefined();
    });

    it('should handle very small file', async () => {
      const file = createTestFile('tiny.txt', 'A');
      const result = await compressFile(file);

      expect(result.stats).toBeDefined();
    });

    it('should handle binary data', async () => {
      const binaryData = new Uint8Array(1000);
      for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = i % 256;
      }
      const file = new File([binaryData], 'binary.dat');

      const result = await compressFile(file);

      expect(result.data).toBeDefined();
    });
  });
});
