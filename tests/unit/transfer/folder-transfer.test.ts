/**
 * Folder Transfer Unit Tests
 */

import { describe, it, expect } from 'vitest';
import {
  buildFolderStructure,
  buildFolderTree,
  extractFolderName,
  formatFileSize,
  getFolderStats,
  filterFilesByExtension,
  estimateCompressionRatio,
  compressFolder,
  decompressFolder,
} from '@/lib/transfer/folder-transfer';

// Mock File objects
function createMockFile(
  name: string,
  size: number,
  relativePath?: string,
  type: string = 'application/octet-stream'
): File {
  const blob = new Blob(['x'.repeat(size)], { type });
  const file = new File([blob], name, { type, lastModified: Date.now() });

  if (relativePath) {
    Object.defineProperty(file, 'webkitRelativePath', {
      value: relativePath,
      writable: false,
    });
  }

  return file;
}

describe('Folder Transfer Utilities', () => {
  describe('extractFolderName', () => {
    it('should extract folder name from webkitRelativePath', () => {
      const file = createMockFile('file.txt', 100, 'MyFolder/subfolder/file.txt');
      const name = extractFolderName([file]);
      expect(name).toBe('MyFolder');
    });

    it('should return default name for empty array', () => {
      const name = extractFolderName([]);
      expect(name).toBe('folder');
    });

    it('should return default name for files without webkitRelativePath', () => {
      const file = createMockFile('file.txt', 100);
      const name = extractFolderName([file]);
      expect(name).toBe('folder');
    });
  });

  describe('buildFolderStructure', () => {
    it('should build folder structure from files', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('file2.txt', 200, 'MyFolder/subfolder/file2.txt'),
        createMockFile('file3.jpg', 300, 'MyFolder/subfolder/file3.jpg'),
      ];

      const structure = buildFolderStructure(files);

      expect(structure.name).toBe('MyFolder');
      expect(structure.fileCount).toBe(3);
      expect(structure.totalSize).toBe(600);
      expect(structure.files).toHaveLength(3);
    });

    it('should exclude system files when enabled', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('.DS_Store', 50, 'MyFolder/.DS_Store'),
        createMockFile('Thumbs.db', 50, 'MyFolder/Thumbs.db'),
      ];

      const structure = buildFolderStructure(files, { excludeSystemFiles: true });

      expect(structure.fileCount).toBe(1);
      expect(structure.files[0]?.name).toBe('file1.txt');
    });

    it('should include system files when disabled', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('.DS_Store', 50, 'MyFolder/.DS_Store'),
      ];

      const structure = buildFolderStructure(files, { excludeSystemFiles: false });

      expect(structure.fileCount).toBe(2);
    });

    it('should apply custom file filter', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('file2.jpg', 200, 'MyFolder/file2.jpg'),
        createMockFile('file3.pdf', 300, 'MyFolder/file3.pdf'),
      ];

      const structure = buildFolderStructure(files, {
        fileFilter: (file) => file.name.endsWith('.txt') || file.name.endsWith('.pdf'),
      });

      expect(structure.fileCount).toBe(2);
      expect(structure.files.map((f) => f.name)).toEqual(['file1.txt', 'file3.pdf']);
    });

    it('should enforce max size limit', () => {
      const files = [
        createMockFile('file1.txt', 1000, 'MyFolder/file1.txt'),
        createMockFile('file2.txt', 1000, 'MyFolder/file2.txt'),
      ];

      expect(() => {
        buildFolderStructure(files, { maxSize: 1500 });
      }).toThrow('Folder exceeds maximum size');
    });
  });

  describe('buildFolderTree', () => {
    it('should build tree structure', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('file2.txt', 200, 'MyFolder/subfolder/file2.txt'),
        createMockFile('file3.txt', 300, 'MyFolder/subfolder/nested/file3.txt'),
      ];

      const structure = buildFolderStructure(files);
      const tree = buildFolderTree(structure);

      expect(tree.type).toBe('folder');
      expect(tree.name).toBe('MyFolder');
      expect(tree.size).toBe(600);
      expect(tree.children).toBeDefined();
      expect(tree.children!.length).toBe(2); // file1.txt and subfolder

      // Check subfolder
      const subfolder = tree.children!.find((c) => c.type === 'folder');
      expect(subfolder).toBeDefined();
      expect(subfolder!.name).toBe('subfolder');
      expect(subfolder!.size).toBe(500); // file2.txt + file3.txt
    });

    it('should calculate folder sizes correctly', () => {
      const files = [
        createMockFile('a.txt', 100, 'Root/a.txt'),
        createMockFile('b.txt', 200, 'Root/sub1/b.txt'),
        createMockFile('c.txt', 300, 'Root/sub1/c.txt'),
        createMockFile('d.txt', 400, 'Root/sub2/d.txt'),
      ];

      const structure = buildFolderStructure(files);
      const tree = buildFolderTree(structure);

      expect(tree.size).toBe(1000);

      const sub1 = tree.children!.find((c) => c.name === 'sub1');
      expect(sub1?.size).toBe(500);

      const sub2 = tree.children!.find((c) => c.name === 'sub2');
      expect(sub2?.size).toBe(400);
    });
  });

  describe('getFolderStats', () => {
    it('should calculate folder statistics', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt', 'text/plain'),
        createMockFile('file2.txt', 200, 'MyFolder/sub/file2.txt', 'text/plain'),
        createMockFile('file3.jpg', 300, 'MyFolder/sub/file3.jpg', 'image/jpeg'),
        createMockFile('file4.jpg', 400, 'MyFolder/sub/nested/file4.jpg', 'image/jpeg'),
      ];

      const structure = buildFolderStructure(files);
      const stats = getFolderStats(structure);

      expect(stats.totalFiles).toBe(4);
      expect(stats.totalFolders).toBe(2); // sub, sub/nested
      expect(stats.totalSize).toBe(1000);
      expect(stats.depth).toBe(3); // MyFolder/sub/nested/file
      expect(stats.fileTypes).toEqual({ txt: 2, jpg: 2 });
      expect(stats.largestFile?.name).toBe('file4.jpg');
      expect(stats.largestFile?.size).toBe(400);
    });
  });

  describe('filterFilesByExtension', () => {
    it('should filter files by extension', () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('file2.jpg', 200, 'MyFolder/file2.jpg'),
        createMockFile('file3.png', 300, 'MyFolder/file3.png'),
        createMockFile('file4.pdf', 400, 'MyFolder/file4.pdf'),
      ];

      const structure = buildFolderStructure(files);

      const imagesOnly = filterFilesByExtension(structure, ['jpg', 'png']);
      expect(imagesOnly.fileCount).toBe(2);
      expect(imagesOnly.totalSize).toBe(500);

      const textOnly = filterFilesByExtension(structure, ['txt']);
      expect(textOnly.fileCount).toBe(1);
      expect(textOnly.totalSize).toBe(100);
    });

    it('should handle extensions with dots', () => {
      const files = [createMockFile('file1.txt', 100, 'MyFolder/file1.txt')];
      const structure = buildFolderStructure(files);

      const filtered = filterFilesByExtension(structure, ['.txt']);
      expect(filtered.fileCount).toBe(1);
    });

    it('should be case insensitive', () => {
      const files = [
        createMockFile('file1.TXT', 100, 'MyFolder/file1.TXT'),
        createMockFile('file2.Txt', 200, 'MyFolder/file2.Txt'),
      ];
      const structure = buildFolderStructure(files);

      const filtered = filterFilesByExtension(structure, ['txt']);
      expect(filtered.fileCount).toBe(2);
    });
  });

  describe('estimateCompressionRatio', () => {
    it('should estimate compression for text files', () => {
      const files = [
        createMockFile('file1.txt', 1000, 'MyFolder/file1.txt', 'text/plain'),
        createMockFile('file2.js', 1000, 'MyFolder/file2.js', 'text/javascript'),
      ];
      const structure = buildFolderStructure(files);

      const { estimatedSize, estimatedRatio } = estimateCompressionRatio(structure);

      expect(estimatedRatio).toBeLessThan(0.5); // Should compress well
      expect(estimatedSize).toBeLessThan(structure.totalSize);
    });

    it('should estimate minimal compression for already compressed files', () => {
      const files = [
        createMockFile('file1.jpg', 1000, 'MyFolder/file1.jpg', 'image/jpeg'),
        createMockFile('file2.mp4', 1000, 'MyFolder/file2.mp4', 'video/mp4'),
      ];
      const structure = buildFolderStructure(files);

      const { estimatedRatio } = estimateCompressionRatio(structure);

      expect(estimatedRatio).toBeGreaterThan(0.9); // Minimal compression
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('Compression/Decompression', () => {
    it('should compress and decompress folder', async () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt', 'text/plain'),
        createMockFile('file2.txt', 200, 'MyFolder/sub/file2.txt', 'text/plain'),
      ];

      const structure = buildFolderStructure(files);

      // Compress
      const compressed = await compressFolder(structure);
      expect(compressed).toBeInstanceOf(Blob);
      expect(compressed.type).toBe('application/zip');

      // Decompress
      const decompressed = await decompressFolder(compressed);
      expect(decompressed.fileCount).toBe(2);
      expect(decompressed.files[0]?.name).toBe('file1.txt');
      expect(decompressed.files[1]?.name).toBe('file2.txt');
    });

    it('should call progress callback during compression', async () => {
      const files = [
        createMockFile('file1.txt', 100, 'MyFolder/file1.txt'),
        createMockFile('file2.txt', 200, 'MyFolder/file2.txt'),
      ];

      const structure = buildFolderStructure(files);
      const progressUpdates: number[] = [];

      await compressFolder(structure, (progress) => {
        progressUpdates.push(progress);
      });

      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(Math.max(...progressUpdates)).toBe(100);
    });
  });
});
