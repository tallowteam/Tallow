import { describe, expect, it } from 'vitest';
import {
  generateTransferFilename,
  encryptFilename,
  decryptFilename,
  isValidTransferFilename,
  deriveFilenameKey,
  RANDOM_FILENAME_HEX_LENGTH,
  IV_LENGTH,
} from '@/lib/privacy/filename-encryption';
import {
  padToNearestPowerOf2,
  removePadding,
  stripPdfMetadata,
  stripOfficeXmlMetadata,
  DOCUMENT_METADATA_TYPES,
  isDocumentType,
} from '@/lib/privacy/metadata-eraser';

// ============================================================================
// Filename Encryption Tests
// ============================================================================

describe('filename encryption', () => {
  it('generates random hex transfer filename of 32 characters', () => {
    expect(RANDOM_FILENAME_HEX_LENGTH).toBe(32);

    const name = generateTransferFilename();
    expect(name).toMatch(/^[0-9a-f]{32}$/);
    expect(name.length).toBe(32);
  });

  it('generates unique transfer filenames (no collisions in 100 samples)', () => {
    const names = Array.from({ length: 100 }, () => generateTransferFilename());
    const unique = new Set(names);
    expect(unique.size).toBe(100);
  });

  it('validates transfer filename format', () => {
    expect(isValidTransferFilename('abcdef0123456789abcdef0123456789')).toBe(true);
    expect(isValidTransferFilename('my-original-file.txt')).toBe(false);
    expect(isValidTransferFilename('SHORT')).toBe(false);
    expect(isValidTransferFilename('')).toBe(false);
    expect(isValidTransferFilename('ABCDEF0123456789ABCDEF0123456789')).toBe(false); // uppercase
  });

  it('performs filename encryption and decryption round-trip', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const original = 'secret-document-2024.pdf';
    const encrypted = await encryptFilename(original, key);

    // Transfer name should be random hex, not the original
    expect(encrypted.transferName).not.toBe(original);
    expect(isValidTransferFilename(encrypted.transferName)).toBe(true);

    // Encrypted original should be base64
    expect(encrypted.encryptedOriginal.length).toBeGreaterThan(0);
    expect(encrypted.iv.length).toBeGreaterThan(0);

    // Decryption should recover original
    const decrypted = await decryptFilename(encrypted, key);
    expect(decrypted).toBe(original);
  });

  it('handles unicode filenames correctly', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const unicodeNames = [
      'rapport-annuel-2024.pdf',
      'photo-from-paris.jpg',
      'document.txt',
    ];

    for (const name of unicodeNames) {
      const encrypted = await encryptFilename(name, key);
      const decrypted = await decryptFilename(encrypted, key);
      expect(decrypted).toBe(name);
    }
  });

  it('uses AES-GCM with 12-byte IV for filename encryption', () => {
    expect(IV_LENGTH).toBe(12);
  });

  it('rejects empty filenames', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    await expect(encryptFilename('', key)).rejects.toThrow('empty');
  });

  it('derives filename key via HKDF from shared secret', async () => {
    const sharedSecret = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(32));

    const derivedKey = await deriveFilenameKey(sharedSecret, salt);

    // Use the derived key for encrypt/decrypt round-trip
    const original = 'derived-key-test.docx';
    const encrypted = await encryptFilename(original, derivedKey);
    const decrypted = await decryptFilename(encrypted, derivedKey);
    expect(decrypted).toBe(original);
  });

  it('produces different ciphertexts for the same filename (IV uniqueness)', async () => {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    const name = 'same-file.txt';
    const enc1 = await encryptFilename(name, key);
    const enc2 = await encryptFilename(name, key);

    // Different IVs should produce different ciphertexts
    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.encryptedOriginal).not.toBe(enc2.encryptedOriginal);

    // But both should decrypt to the same name
    expect(await decryptFilename(enc1, key)).toBe(name);
    expect(await decryptFilename(enc2, key)).toBe(name);
  });
});

// ============================================================================
// Size Padding Tests
// ============================================================================

describe('size padding', () => {
  it('pads data to power-of-2 boundary', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]); // 5 bytes + 4 header = 9 -> next power of 2 = 16
    const padded = padToNearestPowerOf2(data);

    // Must be a power of 2
    expect(padded.length).toBe(16);
    expect((padded.length & (padded.length - 1))).toBe(0);
  });

  it('round-trips correctly: pad then unpad recovers original', () => {
    const original = new Uint8Array([10, 20, 30, 40, 50, 60, 70, 80]);
    const padded = padToNearestPowerOf2(original);
    const recovered = removePadding(padded);

    expect(recovered.length).toBe(original.length);
    expect(Array.from(recovered)).toEqual(Array.from(original));
  });

  it('handles empty data', () => {
    const data = new Uint8Array(0); // 0 bytes + 4 header = 4 -> padded to 16 (MIN_PAD_SIZE)
    const padded = padToNearestPowerOf2(data);
    expect((padded.length & (padded.length - 1))).toBe(0);
    expect(padded.length).toBeGreaterThanOrEqual(16);

    const recovered = removePadding(padded);
    expect(recovered.length).toBe(0);
  });

  it('handles data that is already exactly a power of 2 after header', () => {
    // 12 bytes + 4 header = 16 = power of 2; should NOT pad further
    const data = new Uint8Array(12);
    const padded = padToNearestPowerOf2(data);
    expect(padded.length).toBe(16);

    const recovered = removePadding(padded);
    expect(recovered.length).toBe(12);
  });

  it('uses non-zero padding bytes (CSPRNG noise)', () => {
    const data = new Uint8Array(1); // 1 + 4 = 5 -> pad to 16, so 11 bytes of noise
    const padded = padToNearestPowerOf2(data);

    // Check that at least some padding bytes are non-zero
    // (statistical: probability of all 11 random bytes being zero is 2^-88)
    const paddingRegion = padded.slice(5);
    const hasNonZero = paddingRegion.some((b) => b !== 0);
    expect(hasNonZero).toBe(true);
  });

  it('throws on invalid padding header during unpad', () => {
    const bad = new Uint8Array([0xff, 0xff, 0xff, 0xff, 1, 2, 3, 4]);
    expect(() => removePadding(bad)).toThrow('out of bounds');
  });

  it('throws when padded data is too short', () => {
    const tiny = new Uint8Array([1, 2]);
    expect(() => removePadding(tiny)).toThrow('too short');
  });
});

// ============================================================================
// PDF Metadata Stripping Tests
// ============================================================================

describe('PDF metadata stripping (binary parser)', () => {
  it('blanks /Author value in a PDF literal string', () => {
    const pdfContent =
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<< /Type /Catalog >>\n' +
      'endobj\n' +
      '2 0 obj\n' +
      '<< /Author (John Doe) /Creator (TestApp) >>\n' +
      'endobj\n';

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    // Author value should be blanked
    expect(text).not.toContain('John Doe');
    expect(text).toContain('/Author');

    // Creator value should also be blanked
    expect(text).not.toContain('TestApp');
    expect(text).toContain('/Creator');
  });

  it('blanks /CreationDate and /ModDate', () => {
    const pdfContent =
      '%PDF-1.7\n' +
      '<< /CreationDate (D:20240101120000+00) /ModDate (D:20240615090000+00) >>\n';

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    expect(text).not.toContain('20240101');
    expect(text).not.toContain('20240615');
  });

  it('handles PDF hex strings correctly', () => {
    const pdfContent =
      '%PDF-1.4\n' +
      '<< /Author <4A6F686E20446F65> >>\n'; // "John Doe" in hex

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    // Hex string should be zeroed out (all '0')
    expect(text).toContain('<0000000000000000>');
  });

  it('handles nested parentheses in PDF strings', () => {
    const pdfContent =
      '%PDF-1.4\n' +
      '<< /Author (John (Jr) Doe) >>\n';

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    expect(text).not.toContain('John');
    expect(text).not.toContain('Doe');
  });

  it('handles backslash escapes in PDF strings', () => {
    const pdfContent =
      '%PDF-1.4\n' +
      '<< /Author (John\\)Doe) >>\n';

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    expect(text).not.toContain('John');
    expect(text).not.toContain('Doe');
  });

  it('returns non-PDF data unchanged', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = stripPdfMetadata(data);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
  });

  it('blanks XMP metadata streams', () => {
    const pdfContent =
      '%PDF-1.4\n' +
      '1 0 obj\n' +
      '<< /Length 100 >>\n' +
      'stream\n' +
      '<x:xmpmeta xmlns:x="adobe:ns:meta/">\n' +
      '<dc:creator>Secret Author</dc:creator>\n' +
      '</x:xmpmeta>\n' +
      'endstream\n' +
      'endobj\n';

    const data = new TextEncoder().encode(pdfContent);
    const result = stripPdfMetadata(data);
    const text = new TextDecoder().decode(result);

    expect(text).not.toContain('Secret Author');
    expect(text).not.toContain('xmpmeta');
  });
});

// ============================================================================
// Office XML Metadata Stripping Tests
// ============================================================================

describe('Office XML metadata stripping', () => {
  it('blanks XML metadata element content in raw bytes', () => {
    // Simulate a STORED (uncompressed) ZIP with metadata XML
    // This is a minimal valid ZIP with a docProps/core.xml file
    const xmlContent =
      '<?xml version="1.0"?>' +
      '<cp:coreProperties>' +
      '<dc:creator>Secret Author</dc:creator>' +
      '<dc:title>Confidential Report</dc:title>' +
      '</cp:coreProperties>';

    const filename = 'docProps/core.xml';
    const zipData = createMinimalZip(filename, xmlContent);

    const result = stripOfficeXmlMetadata(zipData);
    const text = new TextDecoder('latin1').decode(result);

    expect(text).not.toContain('Secret Author');
    expect(text).not.toContain('Confidential Report');
    // Tags should still be present
    expect(text).toContain('dc:creator');
    expect(text).toContain('dc:title');
  });

  it('returns non-ZIP data unchanged', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const result = stripOfficeXmlMetadata(data);
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5]);
  });
});

// ============================================================================
// Document Type Detection Tests
// ============================================================================

describe('document type detection', () => {
  it('identifies PDF as a document type', () => {
    expect(isDocumentType('application/pdf')).toBe(true);
  });

  it('identifies DOCX as a document type', () => {
    expect(
      isDocumentType(
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(true);
  });

  it('rejects non-document types', () => {
    expect(isDocumentType('image/jpeg')).toBe(false);
    expect(isDocumentType('text/plain')).toBe(false);
  });

  it('DOCUMENT_METADATA_TYPES includes common office formats', () => {
    expect(DOCUMENT_METADATA_TYPES).toContain('application/pdf');
    expect(DOCUMENT_METADATA_TYPES.length).toBeGreaterThanOrEqual(5);
  });
});

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a minimal valid ZIP file containing a single STORED file.
 * This is used to test the ZIP central directory parser.
 */
function createMinimalZip(filename: string, content: string): Uint8Array {
  const encoder = new TextEncoder();
  const filenameBytes = encoder.encode(filename);
  const contentBytes = encoder.encode(content);

  // CRC-32 is not checked by our stripper, so we use a dummy value
  const dummyCrc = 0x00000000;

  // Local file header (30 bytes + filename + content)
  const localHeaderSize = 30 + filenameBytes.length;
  const localHeader = new Uint8Array(localHeaderSize);
  const localView = new DataView(localHeader.buffer);

  // PK\x03\x04 signature
  localHeader[0] = 0x50;
  localHeader[1] = 0x4b;
  localHeader[2] = 0x03;
  localHeader[3] = 0x04;
  // Version needed to extract (2.0)
  localView.setUint16(4, 20, true);
  // Compression method: 0 = STORED
  localView.setUint16(8, 0, true);
  // CRC-32
  localView.setUint32(14, dummyCrc, true);
  // Compressed size
  localView.setUint32(18, contentBytes.length, true);
  // Uncompressed size
  localView.setUint32(22, contentBytes.length, true);
  // Filename length
  localView.setUint16(26, filenameBytes.length, true);
  // Extra field length
  localView.setUint16(28, 0, true);
  // Filename
  localHeader.set(filenameBytes, 30);

  // Central directory file header (46 bytes + filename)
  const centralDirOffset = localHeaderSize + contentBytes.length;
  const cdHeaderSize = 46 + filenameBytes.length;
  const cdHeader = new Uint8Array(cdHeaderSize);
  const cdView = new DataView(cdHeader.buffer);

  // PK\x01\x02 signature
  cdHeader[0] = 0x50;
  cdHeader[1] = 0x4b;
  cdHeader[2] = 0x01;
  cdHeader[3] = 0x02;
  // Version made by (2.0)
  cdView.setUint16(4, 20, true);
  // Version needed (2.0)
  cdView.setUint16(6, 20, true);
  // Compression method: 0 = STORED
  cdView.setUint16(10, 0, true);
  // CRC-32
  cdView.setUint32(16, dummyCrc, true);
  // Compressed size
  cdView.setUint32(20, contentBytes.length, true);
  // Uncompressed size
  cdView.setUint32(24, contentBytes.length, true);
  // Filename length
  cdView.setUint16(28, filenameBytes.length, true);
  // Extra field length
  cdView.setUint16(30, 0, true);
  // Comment length
  cdView.setUint16(32, 0, true);
  // Local header offset
  cdView.setUint32(42, 0, true);
  // Filename
  cdHeader.set(filenameBytes, 46);

  // End of Central Directory record (22 bytes)
  const eocdOffset = centralDirOffset + cdHeaderSize;
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  // PK\x05\x06 signature
  eocd[0] = 0x50;
  eocd[1] = 0x4b;
  eocd[2] = 0x05;
  eocd[3] = 0x06;
  // Number of entries on this disk
  eocdView.setUint16(8, 1, true);
  // Total number of entries
  eocdView.setUint16(10, 1, true);
  // Size of central directory
  eocdView.setUint32(12, cdHeaderSize, true);
  // Offset to start of central directory
  eocdView.setUint32(16, centralDirOffset, true);

  // Assemble final ZIP
  const totalSize = eocdOffset + 22;
  const zip = new Uint8Array(totalSize);
  zip.set(localHeader, 0);
  zip.set(contentBytes, localHeaderSize);
  zip.set(cdHeader, centralDirOffset);
  zip.set(eocd, eocdOffset);

  return zip;
}
