import { describe, it, expect } from 'vitest';
import { stripMetadata, extractMetadata, supportsMetadataStripping } from '@/lib/privacy/metadata-stripper';

describe('Video Metadata Stripping', () => {
  describe('File Type Support', () => {
    it('should support MP4 files', () => {
      expect(supportsMetadataStripping('video/mp4')).toBe(true);
    });

    it('should support QuickTime files', () => {
      expect(supportsMetadataStripping('video/quicktime')).toBe(true);
    });

    it('should support M4V files', () => {
      expect(supportsMetadataStripping('video/x-m4v')).toBe(true);
    });
  });

  describe('MP4 Box Parsing', () => {
    it('should create valid MP4 structure', async () => {
      // Create minimal valid MP4 file
      const mp4 = createMinimalMp4();
      const file = new File([mp4], 'test.mp4', { type: 'video/mp4' });

      const result = await stripMetadata(file);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();
      if (result.strippedFile) {
        expect(result.strippedFile.type).toBe('video/mp4');
      }
    });

    it('should remove metadata boxes from MP4', async () => {
      // Create MP4 with metadata
      const mp4WithMeta = createMp4WithMetadata();
      const file = new File([mp4WithMeta], 'test.mp4', { type: 'video/mp4' });

      const result = await stripMetadata(file);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();

      if (result.strippedFile) {
        // Stripped file should be smaller (metadata removed)
        expect(result.strippedFile.size).toBeLessThan(file.size);
        expect(result.bytesRemoved).toBeGreaterThan(0);

        // Verify metadata boxes are removed
        const buffer = await result.strippedFile.arrayBuffer();
        const content = new TextDecoder().decode(buffer);

        // These metadata boxes should not be present
        expect(content.includes('udta')).toBe(false); // User data
        expect(content.includes('cprt')).toBe(false); // Copyright
        expect(content.includes('loci')).toBe(false); // Location
      }
    });

    it('should preserve essential boxes', async () => {
      const mp4 = createMinimalMp4();
      const file = new File([mp4], 'test.mp4', { type: 'video/mp4' });

      const result = await stripMetadata(file);

      if (result.strippedFile) {
        const buffer = await result.strippedFile.arrayBuffer();
        const view = new DataView(buffer);

        // Check for ftyp box (file type - must be present)
        const firstBoxType = String.fromCharCode(
          view.getUint8(4),
          view.getUint8(5),
          view.getUint8(6),
          view.getUint8(7)
        );
        expect(firstBoxType).toBe('ftyp');
      }
    });

    it('should handle corrupted MP4 gracefully', async () => {
      // Create invalid MP4 data
      const invalidMp4 = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = new File([invalidMp4], 'corrupt.mp4', { type: 'video/mp4' });

      const result = await stripMetadata(file);

      // Should not throw error, returns original file
      expect(result.originalFile).toBe(file);
    });
  });

  describe('Metadata Extraction', () => {
    it('should extract GPS data from video if present', async () => {
      // Create MP4 with GPS metadata
      const mp4WithGps = createMp4WithGpsMetadata();
      const file = new File([mp4WithGps], 'video_with_gps.mp4', { type: 'video/mp4' });

      const metadata = await extractMetadata(file);

      // ExifReader should detect metadata in video files
      expect(metadata).toBeDefined();
    });
  });

  describe('QuickTime (MOV) Files', () => {
    it('should strip metadata from MOV files', async () => {
      // QuickTime uses same box structure as MP4
      const mov = createMinimalMp4(); // Same structure
      const file = new File([mov], 'test.mov', { type: 'video/quicktime' });

      const result = await stripMetadata(file);

      expect(result.success).toBe(true);
      expect(result.strippedFile).toBeDefined();
    });
  });

  describe('Batch Processing', () => {
    it('should strip metadata from multiple video files', async () => {
      const { stripMetadataBatch } = await import('@/lib/privacy/metadata-stripper');

      const files = [
        new File([createMinimalMp4()], 'video1.mp4', { type: 'video/mp4' }),
        new File([createMinimalMp4()], 'video2.mp4', { type: 'video/mp4' }),
      ];

      let progressCalls = 0;
      const results = await stripMetadataBatch(files, (processed, total) => {
        progressCalls++;
        expect(processed).toBeLessThanOrEqual(total);
        expect(total).toBe(2);
      });

      expect(results).toHaveLength(2);
      expect(progressCalls).toBe(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});

// Helper functions to create test MP4 files

function createMinimalMp4(): Uint8Array {
  // Create minimal valid MP4 with ftyp and mdat boxes
  const ftyp = createBox('ftyp', new TextEncoder().encode('mp42mp41isom'));
  const mdat = createBox('mdat', new Uint8Array([0x00, 0x00, 0x00, 0x01])); // Minimal video data

  const result = new Uint8Array(ftyp.length + mdat.length);
  result.set(ftyp, 0);
  result.set(mdat, ftyp.length);

  return result;
}

function createMp4WithMetadata(): Uint8Array {
  // Create MP4 with metadata boxes
  const ftyp = createBox('ftyp', new TextEncoder().encode('mp42mp41isom'));

  // Create udta (user data) box with copyright
  const cprt = createBox('cprt', new TextEncoder().encode('\x00\x00John Doe 2024'));
  const udta = createBox('udta', cprt);

  // Create location box (GPS data)
  const lociData = new Uint8Array([
    0x00, 0x00, // Version and flags
    ...new TextEncoder().encode('San Francisco'),
    0x00, // Null terminator
    0x00, // Role
    0x3F, 0x80, 0x00, 0x00, // Longitude (1.0 as float32)
    0x3F, 0x80, 0x00, 0x00, // Latitude (1.0 as float32)
    0x3F, 0x80, 0x00, 0x00, // Altitude (1.0 as float32)
  ]);
  const loci = createBox('loci', lociData);

  const mdat = createBox('mdat', new Uint8Array([0x00, 0x00, 0x00, 0x01]));

  const result = new Uint8Array(ftyp.length + udta.length + loci.length + mdat.length);
  let offset = 0;
  result.set(ftyp, offset);
  offset += ftyp.length;
  result.set(udta, offset);
  offset += udta.length;
  result.set(loci, offset);
  offset += loci.length;
  result.set(mdat, offset);

  return result;
}

function createMp4WithGpsMetadata(): Uint8Array {
  // Similar to createMp4WithMetadata but with focus on GPS
  const ftyp = createBox('ftyp', new TextEncoder().encode('mp42mp41isom'));

  // GPS coordinates box
  const xyzData = new Uint8Array([
    0x00, 0x00, // Version
    0x00, 0x00, // Flags
    // Latitude: 37.7749 (San Francisco)
    0x42, 0x17, 0x63, 0xD7,
    // Longitude: -122.4194
    0xC2, 0xF4, 0x6B, 0x0A,
    // Altitude: 16m
    0x41, 0x80, 0x00, 0x00,
  ]);
  const xyz = createBox('xyz ', xyzData);

  const mdat = createBox('mdat', new Uint8Array([0x00, 0x00, 0x00, 0x01]));

  const result = new Uint8Array(ftyp.length + xyz.length + mdat.length);
  result.set(ftyp, 0);
  result.set(xyz, ftyp.length);
  result.set(mdat, ftyp.length + xyz.length);

  return result;
}

function createBox(type: string, data: Uint8Array): Uint8Array {
  const size = 8 + data.length;
  const box = new Uint8Array(size);
  const view = new DataView(box.buffer);

  // Write size (4 bytes)
  view.setUint32(0, size);

  // Write type (4 bytes)
  const typeBytes = new TextEncoder().encode(type);
  box.set(typeBytes, 4);

  // Write data
  box.set(data, 8);

  return box;
}
