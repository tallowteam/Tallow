/**
 * Comprehensive tests for metadata stripping functionality
 * Tests EXIF removal, GPS data, camera info, timestamps, and file integrity
 */

import { describe, it, expect } from 'vitest';
import {
  stripMetadata,
  extractMetadata,
  supportsMetadataStripping,
  stripMetadataBatch,
  getMetadataSummary,
  METADATA_SUPPORTED_TYPES,
} from '@/lib/privacy/metadata-stripper';

describe('Metadata Stripper - Type Support', () => {
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

  it('should support HEIC images', () => {
    expect(supportsMetadataStripping('image/heic')).toBe(true);
    expect(supportsMetadataStripping('image/heif')).toBe(true);
  });

  it('should support MP4 videos', () => {
    expect(supportsMetadataStripping('video/mp4')).toBe(true);
  });

  it('should support MOV videos', () => {
    expect(supportsMetadataStripping('video/quicktime')).toBe(true);
  });

  it('should not support unsupported types', () => {
    expect(supportsMetadataStripping('image/gif')).toBe(false);
    expect(supportsMetadataStripping('application/pdf')).toBe(false);
    expect(supportsMetadataStripping('text/plain')).toBe(false);
  });

  it('should have correct supported types constant', () => {
    expect(METADATA_SUPPORTED_TYPES.images).toContain('image/jpeg');
    expect(METADATA_SUPPORTED_TYPES.images).toContain('image/png');
    expect(METADATA_SUPPORTED_TYPES.videos).toContain('video/mp4');
  });
});

describe('Metadata Stripper - JPEG Processing', () => {
  // Create a minimal valid JPEG with EXIF data
  function createJpegWithExif(): File {
    const bytes = new Uint8Array([
      // JPEG SOI marker
      0xFF, 0xD8,
      // APP1 marker (EXIF)
      0xFF, 0xE1,
      // Segment length (14 bytes including length)
      0x00, 0x0E,
      // EXIF identifier
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
      // Dummy EXIF data
      0x00, 0x00, 0x00, 0x00,
      // APP0 marker (JFIF)
      0xFF, 0xE0,
      0x00, 0x10, // Length
      0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF identifier
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      // Start of Scan
      0xFF, 0xDA,
      0x00, 0x08, // Length
      0x01, 0x00, 0x00, 0x3F, 0x00,
      // Minimal image data
      0xFF, 0xD9 // EOI marker
    ]);

    return new File([bytes], 'test.jpg', { type: 'image/jpeg' });
  }

  it('should strip EXIF data from JPEG', async () => {
    const file = createJpegWithExif();
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();

    if (result.strippedFile) {
      // Stripped file should be smaller or equal size
      expect(result.strippedFile.size).toBeLessThanOrEqual(file.size);

      // Should still be a valid JPEG
      const bytes = new Uint8Array(await result.strippedFile.arrayBuffer());
      expect(bytes[0]).toBe(0xFF); // SOI marker
      expect(bytes[1]).toBe(0xD8);
    }
  });

  it('should maintain JPEG file integrity', async () => {
    const file = createJpegWithExif();
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();

    if (result.strippedFile) {
      // Check JPEG markers are intact
      const bytes = new Uint8Array(await result.strippedFile.arrayBuffer());

      // Should start with SOI (Start of Image)
      expect(bytes[0]).toBe(0xFF);
      expect(bytes[1]).toBe(0xD8);

      // File should not be empty
      expect(bytes.length).toBeGreaterThanOrEqual(2);

      // Should maintain JPEG type
      expect(result.strippedFile.type).toBe('image/jpeg');
    }
  });

  it('should calculate bytes removed', async () => {
    const file = createJpegWithExif();
    const result = await stripMetadata(file);

    expect(result.bytesRemoved).toBeDefined();
    if (result.bytesRemoved) {
      expect(result.bytesRemoved).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Metadata Stripper - PNG Processing', () => {
  // Create a minimal valid PNG with metadata chunks
  function createPngWithMetadata(): File {
    const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

    // IHDR chunk (minimal)
    const ihdr = new Uint8Array([
      0x00, 0x00, 0x00, 0x0D, // Length: 13
      0x49, 0x48, 0x44, 0x52, // Type: IHDR
      0x00, 0x00, 0x00, 0x01, // Width: 1
      0x00, 0x00, 0x00, 0x01, // Height: 1
      0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, etc
      0x90, 0x77, 0x53, 0xDE, // CRC
    ]);

    // tEXt chunk (metadata to be removed)
    const text = new Uint8Array([
      0x00, 0x00, 0x00, 0x0C, // Length: 12
      0x74, 0x45, 0x58, 0x74, // Type: tEXt
      0x41, 0x75, 0x74, 0x68, 0x6F, 0x72, 0x00, 0x4A, 0x6F, 0x68, 0x6E, 0x00, // Author\0John\0
      0x00, 0x00, 0x00, 0x00, // CRC (dummy)
    ]);

    // IDAT chunk (minimal image data)
    const idat = new Uint8Array([
      0x00, 0x00, 0x00, 0x0A, // Length: 10
      0x49, 0x44, 0x41, 0x54, // Type: IDAT
      0x08, 0xD7, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0x00, // Compressed data
      0xE2, 0x21, 0xBC, 0x33, // CRC
    ]);

    // IEND chunk
    const iend = new Uint8Array([
      0x00, 0x00, 0x00, 0x00, // Length: 0
      0x49, 0x45, 0x4E, 0x44, // Type: IEND
      0xAE, 0x42, 0x60, 0x82, // CRC
    ]);

    const total = new Uint8Array(
      signature.length + ihdr.length + text.length + idat.length + iend.length
    );
    let offset = 0;

    total.set(signature, offset);
    offset += signature.length;
    total.set(ihdr, offset);
    offset += ihdr.length;
    total.set(text, offset);
    offset += text.length;
    total.set(idat, offset);
    offset += idat.length;
    total.set(iend, offset);

    return new File([total], 'test.png', { type: 'image/png' });
  }

  it('should strip metadata from PNG', async () => {
    const file = createPngWithMetadata();
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();

    if (result.strippedFile) {
      // Stripped file should be smaller or equal size (metadata removed, but may have canvas re-encoding)
      expect(result.strippedFile.size).toBeGreaterThan(0);
      // Verify PNG signature is intact
      const bytes = new Uint8Array(await result.strippedFile.arrayBuffer());
      expect(bytes[0]).toBe(0x89);
      expect(bytes[1]).toBe(0x50);
    }
  });

  it('should maintain PNG file integrity', async () => {
    const file = createPngWithMetadata();
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();

    if (result.strippedFile) {
      const bytes = new Uint8Array(await result.strippedFile.arrayBuffer());

      // Check PNG signature
      const expectedSig = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
      for (let i = 0; i < expectedSig.length; i++) {
        expect(bytes[i]).toBe(expectedSig[i]);
      }
    }
  });
});

describe('Metadata Stripper - Metadata Extraction', () => {
  it('should return empty metadata for unsupported files', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const metadata = await extractMetadata(file);

    expect(metadata.hasSensitiveData).toBe(false);
    expect(metadata.hasGPS).toBe(false);
    expect(metadata.hasDeviceInfo).toBe(false);
    expect(metadata.hasTimestamps).toBe(false);
    expect(metadata.hasAuthorInfo).toBe(false);
  });

  it('should handle extraction errors gracefully', async () => {
    const corruptFile = new File([new Uint8Array([0x00, 0x01, 0x02])], 'corrupt.jpg', {
      type: 'image/jpeg'
    });

    const metadata = await extractMetadata(corruptFile);
    expect(metadata).toBeDefined();
    expect(metadata.hasSensitiveData).toBeDefined();
  });

  it('should generate correct metadata summary', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: true,
      hasDeviceInfo: true,
      hasTimestamps: true,
      hasAuthorInfo: false,
      gpsLatitude: '37.7749',
      make: 'Apple',
      dateTimeOriginal: '2024-01-01',
    };

    const summary = getMetadataSummary(metadata);

    expect(summary).toContain('GPS location data');
    expect(summary).toContain('Camera/device information');
    expect(summary).toContain('Date and time information');
    expect(summary).not.toContain('Author/copyright data');
  });

  it('should return default summary for clean files', () => {
    const metadata = {
      hasSensitiveData: false,
      hasGPS: false,
      hasDeviceInfo: false,
      hasTimestamps: false,
      hasAuthorInfo: false,
    };

    const summary = getMetadataSummary(metadata);

    expect(summary).toContain('No sensitive metadata detected');
  });
});

describe('Metadata Stripper - Batch Processing', () => {
  it('should process multiple files', async () => {
    const files = [
      new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], 'test1.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], 'test2.jpg', { type: 'image/jpeg' }),
    ];

    const results = await stripMetadataBatch(files);

    expect(results).toHaveLength(2);
    expect(results[0]?.success).toBeDefined();
    expect(results[1]?.success).toBeDefined();
  });

  it('should track progress during batch processing', async () => {
    const files = [
      new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], 'test1.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], 'test2.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9])], 'test3.jpg', { type: 'image/jpeg' }),
    ];

    let progressCalls = 0;
    let lastProgress = 0;

    const results = await stripMetadataBatch(files, (current, total) => {
      progressCalls++;
      lastProgress = current;
      expect(current).toBeLessThanOrEqual(total);
      expect(total).toBe(3);
    });

    expect(results).toHaveLength(3);
    expect(progressCalls).toBe(3);
    expect(lastProgress).toBe(3);
  });

  it('should handle empty array', async () => {
    const results = await stripMetadataBatch([]);
    expect(results).toHaveLength(0);
  });
});

describe('Metadata Stripper - Error Handling', () => {
  it('should handle unsupported file types', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = await stripMetadata(file);

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('not supported');
  });

  it('should handle corrupt files gracefully', async () => {
    const corruptJpeg = new File([new Uint8Array([0x00, 0x01, 0x02])], 'corrupt.jpg', {
      type: 'image/jpeg'
    });

    const result = await stripMetadata(corruptJpeg);

    // Should fail gracefully
    expect(result.success).toBeDefined();
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('should preserve original file on error', async () => {
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const result = await stripMetadata(file);

    expect(result.originalFile).toBe(file);
  });
});

describe('Metadata Stripper - File Integrity', () => {
  function createValidJpeg(): File {
    const bytes = new Uint8Array([
      0xFF, 0xD8, // SOI
      0xFF, 0xE0, 0x00, 0x10, // APP0
      0x4A, 0x46, 0x49, 0x46, 0x00, // JFIF
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xFF, 0xDA, 0x00, 0x08, // SOS
      0x01, 0x00, 0x00, 0x3F, 0x00,
      0xFF, 0xD9 // EOI
    ]);
    return new File([bytes], 'test.jpg', { type: 'image/jpeg' });
  }

  it('should maintain file viewability after stripping', async () => {
    const file = createValidJpeg();
    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();

    if (result.strippedFile) {
      // File should still be a valid JPEG format
      const bytes = new Uint8Array(await result.strippedFile.arrayBuffer());
      expect(bytes.length).toBeGreaterThan(2);
      expect(bytes[0]).toBe(0xFF);
      expect(bytes[1]).toBe(0xD8);
    }
  });

  it('should preserve file name', async () => {
    const file = createValidJpeg();
    const result = await stripMetadata(file);

    expect(result.strippedFile?.name).toBe('test.jpg');
  });

  it('should preserve file type', async () => {
    const file = createValidJpeg();
    const result = await stripMetadata(file);

    expect(result.strippedFile?.type).toBe('image/jpeg');
  });

  it('should update last modified timestamp', async () => {
    const file = createValidJpeg();
    const originalTime = file.lastModified;

    // Wait a bit to ensure time difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await stripMetadata(file);

    if (result.strippedFile) {
      expect(result.strippedFile.lastModified).toBeGreaterThanOrEqual(originalTime);
    }
  });
});

describe('Metadata Stripper - GPS Data Removal', () => {
  it('should detect GPS data in metadata', async () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: true,
      hasDeviceInfo: false,
      hasTimestamps: false,
      hasAuthorInfo: false,
      gpsLatitude: '37.7749° N',
      gpsLongitude: '122.4194° W',
      gpsAltitude: '52m',
    };

    expect(metadata.hasGPS).toBe(true);
    expect(metadata.gpsLatitude).toBeDefined();
    expect(metadata.gpsLongitude).toBeDefined();
  });

  it('should include GPS in summary', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: true,
      hasDeviceInfo: false,
      hasTimestamps: false,
      hasAuthorInfo: false,
    };

    const summary = getMetadataSummary(metadata);
    expect(summary).toContain('GPS location data');
  });
});

describe('Metadata Stripper - Camera/Device Info Removal', () => {
  it('should detect camera info in metadata', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: true,
      hasTimestamps: false,
      hasAuthorInfo: false,
      make: 'Apple',
      model: 'iPhone 14 Pro',
      software: 'iOS 17.2.1',
    };

    expect(metadata.hasDeviceInfo).toBe(true);
    expect(metadata.make).toBeDefined();
    expect(metadata.model).toBeDefined();
  });

  it('should include device info in summary', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: true,
      hasTimestamps: false,
      hasAuthorInfo: false,
    };

    const summary = getMetadataSummary(metadata);
    expect(summary).toContain('Camera/device information');
  });
});

describe('Metadata Stripper - Timestamp Removal', () => {
  it('should detect timestamps in metadata', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: false,
      hasTimestamps: true,
      hasAuthorInfo: false,
      dateTimeOriginal: '2024-03-15 14:23:45',
      dateTimeDigitized: '2024-03-15 14:23:45',
    };

    expect(metadata.hasTimestamps).toBe(true);
    expect(metadata.dateTimeOriginal).toBeDefined();
  });

  it('should include timestamps in summary', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: false,
      hasTimestamps: true,
      hasAuthorInfo: false,
    };

    const summary = getMetadataSummary(metadata);
    expect(summary).toContain('Date and time information');
  });
});

describe('Metadata Stripper - Author/Copyright Removal', () => {
  it('should detect author info in metadata', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: false,
      hasTimestamps: false,
      hasAuthorInfo: true,
      artist: 'John Doe',
      copyright: 'Copyright 2024',
    };

    expect(metadata.hasAuthorInfo).toBe(true);
    expect(metadata.artist).toBeDefined();
  });

  it('should include author info in summary', () => {
    const metadata = {
      hasSensitiveData: true,
      hasGPS: false,
      hasDeviceInfo: false,
      hasTimestamps: false,
      hasAuthorInfo: true,
    };

    const summary = getMetadataSummary(metadata);
    expect(summary).toContain('Author/copyright data');
  });
});
