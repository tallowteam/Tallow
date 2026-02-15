import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const inc = vi.fn();
  return {
    load: vi.fn(),
    inc,
    labels: vi.fn(() => ({ inc })),
  };
});

vi.mock('exifreader', () => ({
  load: mocks.load,
}));

vi.mock('@/lib/monitoring/metrics', () => ({
  metadataStripped: {
    labels: mocks.labels,
  },
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  warn: vi.fn(),
  error: vi.fn(),
}));

import {
  extractMetadata,
  getMetadataSummary,
  stripMetadata,
  supportsMetadataStripping,
} from '@/lib/privacy/metadata-stripper';

describe('metadata-stripper privacy checks', () => {
  beforeEach(() => {
    mocks.load.mockReset();
    mocks.inc.mockReset();
    mocks.labels.mockClear();
  });

  it('detects supported and unsupported file types', () => {
    expect(supportsMetadataStripping('image/jpeg')).toBe(true);
    expect(supportsMetadataStripping('image/png')).toBe(true);
    expect(supportsMetadataStripping('video/mp4')).toBe(true);
    expect(supportsMetadataStripping('text/plain')).toBe(false);
  });

  it('extracts sensitive metadata flags from EXIF payloads', async () => {
    mocks.load.mockReturnValue({
      gps: {
        Latitude: '37.7749',
        Longitude: '-122.4194',
      },
      exif: {
        Make: { value: 'Canon' },
        Model: { value: 'EOS R5' },
        DateTimeOriginal: { value: '2026:02:10 10:00:00' },
      },
      ifd0: {
        Artist: { value: 'Photographer' },
      },
    });

    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const metadata = await extractMetadata(file);
    const summary = getMetadataSummary(metadata);

    expect(metadata.hasSensitiveData).toBe(true);
    expect(metadata.hasGPS).toBe(true);
    expect(metadata.hasDeviceInfo).toBe(true);
    expect(metadata.hasTimestamps).toBe(true);
    expect(metadata.hasAuthorInfo).toBe(true);
    expect(summary).toContain('GPS location data');
    expect(summary).toContain('Camera/device information');
  });

  it('returns a clear result for unsupported file types', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'notes.txt', {
      type: 'text/plain',
    });

    const result = await stripMetadata(file);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not supported');
    expect(mocks.inc).not.toHaveBeenCalled();
  });

  it('strips JPEG metadata and records the metric', async () => {
    mocks.load.mockReturnValue({});

    // Valid JPEG with an APP1 metadata segment and SOS image data section.
    const jpegWithMetadata = new Uint8Array([
      0xff, 0xd8, // SOI
      0xff, 0xe1, 0x00, 0x0a, // APP1 marker + length
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, // metadata payload
      0xff, 0xda, 0x00, 0x08, // SOS marker + length
      0x01, 0x02, 0x03, 0x04, 0x05, 0x06, // image payload
      0xff, 0xd9, // EOI
    ]);

    const file = new File([jpegWithMetadata], 'photo.jpg', {
      type: 'image/jpeg',
    });

    const result = await stripMetadata(file);

    expect(result.success).toBe(true);
    expect(result.strippedFile).toBeDefined();
    expect(result.bytesRemoved).toBeDefined();
    expect((result.strippedFile?.size ?? 0)).toBeGreaterThan(0);
    expect(mocks.inc).toHaveBeenCalledTimes(1);
  });
});
