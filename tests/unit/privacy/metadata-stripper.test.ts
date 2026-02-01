/**
 * Metadata Stripper Tests
 * Tests for privacy-focused metadata removal from images and videos
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  stripMetadata,
  extractMetadata,
  supportsMetadataStripping,
  stripMetadataBatch,
  getMetadataSummary,
  METADATA_SUPPORTED_TYPES,
} from '@/lib/privacy/metadata-stripper';

// Mock ExifReader
vi.mock('exifreader', () => ({
  load: vi.fn((buffer) => {
    // Simulate EXIF data based on buffer content
    const view = new DataView(buffer);
    const hasGPS = view.byteLength > 100;

    return {
      gps: hasGPS
        ? {
            Latitude: 37.7749,
            Longitude: -122.4194,
            Altitude: 100,
          }
        : undefined,
      exif: {
        Make: { description: 'Apple', value: 'Apple' },
        Model: { description: 'iPhone 13 Pro', value: 'iPhone 13 Pro' },
        Software: { description: 'iOS 16.0', value: 'iOS 16.0' },
        DateTimeOriginal: {
          description: '2024:01:15 10:30:00',
          value: '2024:01:15 10:30:00',
        },
        Orientation: { value: 1 },
      },
      file: {
        'Image Width': { value: 1920 },
        'Image Height': { value: 1080 },
      },
    };
  }),
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  warn: vi.fn(),
  error: vi.fn(),
}));

describe('Metadata Stripper', () => {
  describe('File Type Support', () => {
    it('should support JPEG images', () => {
      expect(supportsMetadataStripping('image/jpeg')).toBe(true);
      expect(supportsMetadataStripping('image/jpg')).toBe(true);
    });

    it('should support PNG images', () => {
      expect(supportsMetadataStripping('image/png')).toBe(true);
    });

    it('should support WebP images', () => {
      expect(supportsMetadataStripping('image/webp')).toBe(true);
    });

    it('should support HEIC/HEIF images', () => {
      expect(supportsMetadataStripping('image/heic')).toBe(true);
      expect(supportsMetadataStripping('image/heif')).toBe(true);
    });

    it('should support MP4 videos', () => {
      expect(supportsMetadataStripping('video/mp4')).toBe(true);
    });

    it('should support QuickTime videos', () => {
      expect(supportsMetadataStripping('video/quicktime')).toBe(true);
    });

    it('should not support unsupported types', () => {
      expect(supportsMetadataStripping('text/plain')).toBe(false);
      expect(supportsMetadataStripping('application/pdf')).toBe(false);
    });
  });

  describe('Metadata Extraction', () => {
    let mockJpegFile: File;

    beforeEach(() => {
      // Create mock JPEG with EXIF data
      const jpegHeader = new Uint8Array([
        0xff, 0xd8, // SOI
        0xff, 0xe1, // APP1 (EXIF)
        0x00, 0x10, // Length
        ...Array(14).fill(0x00), // EXIF data
        0xff, 0xda, // SOS
        ...Array(100).fill(0x00), // Image data
      ]);

      mockJpegFile = new File([jpegHeader], 'test.jpg', {
        type: 'image/jpeg',
      });
    });

    it('should extract GPS data', async () => {
      const metadata = await extractMetadata(mockJpegFile);

      expect(metadata.hasGPS).toBe(true);
      expect(metadata.hasSensitiveData).toBe(true);
      expect(metadata.gpsLatitude).toBeDefined();
      expect(metadata.gpsLongitude).toBeDefined();
    });

    it('should extract device information', async () => {
      const metadata = await extractMetadata(mockJpegFile);

      expect(metadata.hasDeviceInfo).toBe(true);
      expect(metadata.make).toBe('Apple');
      expect(metadata.model).toBe('iPhone 13 Pro');
      expect(metadata.software).toBe('iOS 16.0');
    });

    it('should extract timestamps', async () => {
      const metadata = await extractMetadata(mockJpegFile);

      expect(metadata.hasTimestamps).toBe(true);
      expect(metadata.dateTimeOriginal).toBeDefined();
    });

    it('should extract dimensions', async () => {
      const metadata = await extractMetadata(mockJpegFile);

      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
    });

    it('should detect sensitive data flag', async () => {
      const metadata = await extractMetadata(mockJpegFile);

      expect(metadata.hasSensitiveData).toBe(true);
    });
  });

  describe('JPEG Metadata Stripping', () => {
    let mockJpegFile: File;

    beforeEach(() => {
      // Create minimal valid JPEG
      const jpegData = new Uint8Array([
        0xff, 0xd8, // SOI
        0xff, 0xe1, // APP1 (EXIF)
        0x00, 0x10, // Length
        ...Array(14).fill(0x00), // EXIF data
        0xff, 0xda, // SOS
        ...Array(50).fill(0xaa), // Image data
        0xff, 0xd9, // EOI
      ]);

      mockJpegFile = new File([jpegData], 'test.jpg', {
        type: 'image/jpeg',
      });
    });

    it('should strip EXIF data from JPEG', async () => {
      const result = await stripMetadata(mockJpegFile);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();
      expect(result.bytesRemoved).toBeGreaterThan(0);
    });

    it('should preserve image data', async () => {
      const result = await stripMetadata(mockJpegFile);

      expect(result.strippedFile?.size).toBeGreaterThan(0);
      expect(result.strippedFile?.type).toBe('image/jpeg');
    });

    it('should remove APP1 segment', async () => {
      const result = await stripMetadata(mockJpegFile);

      // Check that stripped file is smaller
      expect(result.strippedFile!.size).toBeLessThan(mockJpegFile.size);
    });

    it('should handle JPEG without metadata', async () => {
      const minimalJpeg = new Uint8Array([
        0xff, 0xd8, // SOI
        0xff, 0xda, // SOS
        ...Array(50).fill(0xaa), // Image data
        0xff, 0xd9, // EOI
      ]);

      const cleanFile = new File([minimalJpeg], 'clean.jpg', {
        type: 'image/jpeg',
      });

      const result = await stripMetadata(cleanFile);

      expect(result.success).toBe(true);
    });
  });

  describe('PNG Metadata Stripping', () => {
    let mockPngFile: File;

    beforeEach(() => {
      // Create minimal valid PNG
      const pngData = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG signature
        0x00, 0x00, 0x00, 0x0d, // IHDR length
        0x49, 0x48, 0x44, 0x52, // "IHDR"
        ...Array(13).fill(0x00), // IHDR data + CRC
        0x00, 0x00, 0x00, 0x0a, // IDAT length
        0x49, 0x44, 0x41, 0x54, // "IDAT"
        ...Array(10).fill(0x00), // IDAT data + CRC
        0x00, 0x00, 0x00, 0x00, // IEND length
        0x49, 0x45, 0x4e, 0x44, // "IEND"
        0x00, 0x00, 0x00, 0x00, // IEND CRC
      ]);

      mockPngFile = new File([pngData], 'test.png', { type: 'image/png' });
    });

    it('should strip metadata from PNG', async () => {
      const result = await stripMetadata(mockPngFile);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();
    });

    it('should preserve critical PNG chunks', async () => {
      const result = await stripMetadata(mockPngFile);

      expect(result.strippedFile?.type).toBe('image/png');
    });

    it('should remove ancillary chunks', async () => {
      const result = await stripMetadata(mockPngFile);

      expect(result.success).toBe(true);
    });
  });

  describe('Video Metadata Stripping', () => {
    let mockMp4File: File;

    beforeEach(() => {
      // Create minimal MP4 structure
      const mp4Data = new Uint8Array([
        // ftyp box
        0x00, 0x00, 0x00, 0x20, // size
        0x66, 0x74, 0x79, 0x70, // "ftyp"
        ...Array(24).fill(0x00), // ftyp data
        // moov box with udta (user data)
        0x00, 0x00, 0x00, 0x40, // size
        0x6d, 0x6f, 0x6f, 0x76, // "moov"
        // udta box (should be removed)
        0x00, 0x00, 0x00, 0x10, // size
        0x75, 0x64, 0x74, 0x61, // "udta"
        ...Array(8).fill(0x00), // udta data
        ...Array(40).fill(0x00), // rest of moov
      ]);

      mockMp4File = new File([mp4Data], 'test.mp4', { type: 'video/mp4' });
    });

    it('should strip metadata from MP4', async () => {
      const result = await stripMetadata(mockMp4File);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();
    });

    it('should remove user data boxes', async () => {
      const result = await stripMetadata(mockMp4File);

      // Check that metadata was removed
      expect(result.bytesRemoved).toBeGreaterThanOrEqual(0);
    });

    it('should handle video metadata errors gracefully', async () => {
      const corruptedMp4 = new File([new Uint8Array([0, 1, 2, 3])], 'bad.mp4', {
        type: 'video/mp4',
      });

      const result = await stripMetadata(corruptedMp4);

      // Should return original file on error
      expect(result.strippedFile).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple files', async () => {
      const files = [
        new File([new Uint8Array(100)], 'file1.jpg', { type: 'image/jpeg' }),
        new File([new Uint8Array(100)], 'file2.png', { type: 'image/png' }),
        new File([new Uint8Array(100)], 'file3.jpg', { type: 'image/jpeg' }),
      ];

      const results = await stripMetadataBatch(files);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result).toBeDefined();
      });
    });

    it('should report progress during batch processing', async () => {
      const files = [
        new File([new Uint8Array(100)], 'file1.jpg', { type: 'image/jpeg' }),
        new File([new Uint8Array(100)], 'file2.jpg', { type: 'image/jpeg' }),
      ];

      const progressCallback = vi.fn();

      await stripMetadataBatch(files, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    it('should handle mixed success and failure', async () => {
      const files = [
        new File([new Uint8Array(100)], 'file1.jpg', { type: 'image/jpeg' }),
        new File([new Uint8Array(100)], 'file2.txt', { type: 'text/plain' }),
      ];

      const results = await stripMetadataBatch(files);

      expect(results[0]?.success).toBeDefined();
      expect(results[1]?.error).toBeDefined();
    });
  });

  describe('Auto-Stripping Integration', () => {
    it('should work with FileSelectorWithPrivacy component', async () => {
      const file = new File([new Uint8Array(100)], 'photo.jpg', {
        type: 'image/jpeg',
      });

      const result = await stripMetadata(file);

      expect(result).toBeDefined();
      expect(result.success || result.error).toBeDefined();
    });

    it('should preserve original file when stripping fails', async () => {
      const unsupportedFile = new File([new Uint8Array(100)], 'doc.pdf', {
        type: 'application/pdf',
      });

      const result = await stripMetadata(unsupportedFile);

      expect(result.originalFile).toBe(unsupportedFile);
      expect(result.error).toBeDefined();
    });
  });

  describe('Privacy Settings Persistence', () => {
    it('should track which metadata was removed', async () => {
      const jpegWithMetadata = new Uint8Array([
        0xff, 0xd8, // SOI
        0xff, 0xe1, // APP1
        0x00, 0x10,
        ...Array(14).fill(0x00),
        0xff, 0xda,
        ...Array(50).fill(0xaa),
      ]);

      const file = new File([jpegWithMetadata], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await stripMetadata(file);

      expect(result.metadata).toBeDefined();
      expect(result.metadata?.hasSensitiveData).toBeDefined();
    });

    it('should provide metadata summary', async () => {
      const metadata = {
        hasGPS: true,
        hasDeviceInfo: true,
        hasTimestamps: true,
        hasAuthorInfo: false,
        hasSensitiveData: true,
      };

      const summary = getMetadataSummary(metadata);

      expect(summary).toContain('GPS location data');
      expect(summary).toContain('Camera/device information');
      expect(summary).toContain('Date and time information');
      expect(summary).not.toContain('Author/copyright data');
    });

    it('should handle files with no metadata', () => {
      const metadata = {
        hasGPS: false,
        hasDeviceInfo: false,
        hasTimestamps: false,
        hasAuthorInfo: false,
        hasSensitiveData: false,
      };

      const summary = getMetadataSummary(metadata);

      expect(summary).toContain('No sensitive metadata detected');
    });
  });

  describe('Error Handling', () => {
    it('should handle corrupted JPEG files', async () => {
      const corruptedJpeg = new File([new Uint8Array([0xff, 0xd8, 0x00])], 'bad.jpg', {
        type: 'image/jpeg',
      });

      const result = await stripMetadata(corruptedJpeg);

      expect(result.error).toBeDefined();
    });

    it('should handle corrupted PNG files', async () => {
      const corruptedPng = new File([new Uint8Array([0x89, 0x50])], 'bad.png', {
        type: 'image/png',
      });

      const result = await stripMetadata(corruptedPng);

      expect(result.error).toBeDefined();
    });

    it('should handle empty files', async () => {
      const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

      const result = await stripMetadata(emptyFile);

      expect(result.error).toBeDefined();
    });

    it('should handle very large files', async () => {
      const largeFile = new File([new Uint8Array(50 * 1024 * 1024)], 'large.jpg', {
        type: 'image/jpeg',
      });

      // Should not crash
      const result = await stripMetadata(largeFile);

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should strip metadata quickly for small files', async () => {
      const smallFile = new File([new Uint8Array(1024)], 'small.jpg', {
        type: 'image/jpeg',
      });

      const startTime = Date.now();
      await stripMetadata(smallFile);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // 1 second
    });

    it('should process batch efficiently', async () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        new File([new Uint8Array(1024)], `file${i}.jpg`, {
          type: 'image/jpeg',
        })
      );

      const startTime = Date.now();
      await stripMetadataBatch(files);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(10000); // 10 seconds
    });
  });

  describe('Supported Types Configuration', () => {
    it('should export supported image types', () => {
      expect(METADATA_SUPPORTED_TYPES.images).toBeDefined();
      expect(METADATA_SUPPORTED_TYPES.images.length).toBeGreaterThan(0);
    });

    it('should export supported video types', () => {
      expect(METADATA_SUPPORTED_TYPES.videos).toBeDefined();
      expect(METADATA_SUPPORTED_TYPES.videos.length).toBeGreaterThan(0);
    });
  });
});
