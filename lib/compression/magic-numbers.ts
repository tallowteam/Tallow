/**
 * Magic Number Detection for File Type Identification
 *
 * Detects file types by analyzing magic bytes (file signatures) in the file header.
 * Used to determine if a file is worth compressing or already compressed.
 */

/**
 * File signature mapping for common file formats.
 * Each entry maps a hex signature to its MIME type.
 */
const FILE_SIGNATURES: Array<{ signature: number[]; mimeType: string; offset?: number }> = [
  // Images (already compressed)
  { signature: [0xFF, 0xD8, 0xFF], mimeType: 'image/jpeg' },
  { signature: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], mimeType: 'image/png' },
  { signature: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], mimeType: 'image/gif' }, // GIF87a
  { signature: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], mimeType: 'image/gif' }, // GIF89a
  { signature: [0x52, 0x49, 0x46, 0x46], mimeType: 'image/webp' }, // RIFF container (WebP at offset 8)
  { signature: [0x42, 0x4D], mimeType: 'image/bmp' },
  { signature: [0x49, 0x49, 0x2A, 0x00], mimeType: 'image/tiff' }, // TIFF (little-endian)
  { signature: [0x4D, 0x4D, 0x00, 0x2A], mimeType: 'image/tiff' }, // TIFF (big-endian)

  // Video (already compressed)
  { signature: [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], mimeType: 'video/mp4' }, // ftyp
  { signature: [0x00, 0x00, 0x00, 0x1C, 0x66, 0x74, 0x79, 0x70], mimeType: 'video/mp4' },
  { signature: [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], mimeType: 'video/mp4' },
  { signature: [0x1A, 0x45, 0xDF, 0xA3], mimeType: 'video/webm' }, // WebM/MKV
  { signature: [0x46, 0x4C, 0x56], mimeType: 'video/x-flv' }, // FLV
  { signature: [0x00, 0x00, 0x01, 0xBA], mimeType: 'video/mpeg' }, // MPEG
  { signature: [0x00, 0x00, 0x01, 0xB3], mimeType: 'video/mpeg' },

  // Audio (already compressed)
  { signature: [0xFF, 0xFB], mimeType: 'audio/mpeg' }, // MP3 (MPEG-1 Layer 3)
  { signature: [0xFF, 0xF3], mimeType: 'audio/mpeg' }, // MP3 (MPEG-1 Layer 3)
  { signature: [0xFF, 0xF2], mimeType: 'audio/mpeg' }, // MP3 (MPEG-2 Layer 3)
  { signature: [0x49, 0x44, 0x33], mimeType: 'audio/mpeg' }, // MP3 with ID3v2
  { signature: [0xFF, 0xF1], mimeType: 'audio/aac' }, // AAC
  { signature: [0xFF, 0xF9], mimeType: 'audio/aac' },
  { signature: [0x4F, 0x67, 0x67, 0x53], mimeType: 'audio/ogg' }, // OGG
  { signature: [0x66, 0x4C, 0x61, 0x43], mimeType: 'audio/flac' }, // FLAC
  { signature: [0x4D, 0x34, 0x41, 0x20], mimeType: 'audio/m4a' }, // M4A

  // Archives (already compressed)
  { signature: [0x50, 0x4B, 0x03, 0x04], mimeType: 'application/zip' }, // ZIP
  { signature: [0x50, 0x4B, 0x05, 0x06], mimeType: 'application/zip' }, // Empty ZIP
  { signature: [0x50, 0x4B, 0x07, 0x08], mimeType: 'application/zip' }, // Spanned ZIP
  { signature: [0x1F, 0x8B], mimeType: 'application/gzip' }, // GZIP
  { signature: [0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C], mimeType: 'application/x-7z-compressed' }, // 7Z
  { signature: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x00], mimeType: 'application/x-rar-compressed' }, // RAR 1.5+
  { signature: [0x52, 0x61, 0x72, 0x21, 0x1A, 0x07, 0x01, 0x00], mimeType: 'application/x-rar-compressed' }, // RAR 5.0+
  { signature: [0x42, 0x5A, 0x68], mimeType: 'application/x-bzip2' }, // BZIP2
  { signature: [0xFD, 0x37, 0x7A, 0x58, 0x5A, 0x00], mimeType: 'application/x-xz' }, // XZ
  { signature: [0xCE, 0xB2, 0xCF, 0x81], mimeType: 'application/x-brotli' }, // Brotli (custom header)
  { signature: [0x5D, 0x00, 0x00], mimeType: 'application/x-lzma' }, // LZMA (common pattern)

  // Documents (may be compressed internally)
  { signature: [0x25, 0x50, 0x44, 0x46], mimeType: 'application/pdf' }, // PDF
  { signature: [0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1], mimeType: 'application/vnd.ms-office' }, // MS Office (DOC, XLS, PPT)
  { signature: [0x50, 0x4B, 0x03, 0x04], mimeType: 'application/vnd.openxmlformats-officedocument', offset: 0 }, // DOCX, XLSX, PPTX (also ZIP)

  // Executables and binaries
  { signature: [0x00, 0x61, 0x73, 0x6D], mimeType: 'application/wasm' }, // WebAssembly
  { signature: [0x4D, 0x5A], mimeType: 'application/x-msdownload' }, // EXE
  { signature: [0x7F, 0x45, 0x4C, 0x46], mimeType: 'application/x-elf' }, // ELF

  // Text and compressible formats
  { signature: [0x3C, 0x3F, 0x78, 0x6D, 0x6C], mimeType: 'application/xml' }, // <?xml
  { signature: [0x3C, 0x21, 0x44, 0x4F, 0x43, 0x54, 0x59, 0x50, 0x45], mimeType: 'text/html' }, // <!DOCTYPE
  { signature: [0x3C, 0x68, 0x74, 0x6D, 0x6C], mimeType: 'text/html' }, // <html
  { signature: [0x7B, 0x22], mimeType: 'application/json' }, // {"
  { signature: [0x7B, 0x0A], mimeType: 'application/json' }, // {\n
  { signature: [0x7B, 0x0D], mimeType: 'application/json' }, // {\r
];

/**
 * File types that are already compressed and should not be compressed again.
 * Attempting to compress these will waste CPU and may even increase file size.
 */
const INCOMPRESSIBLE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/x-flv',
  'video/mpeg',
  'audio/mpeg',
  'audio/aac',
  'audio/ogg',
  'audio/flac',
  'audio/m4a',
  'application/zip',
  'application/gzip',
  'application/x-7z-compressed',
  'application/x-rar-compressed',
  'application/x-bzip2',
  'application/x-xz',
  'application/x-brotli',
  'application/x-lzma',
  'application/pdf',
  'application/wasm',
]);

/**
 * Detect file type by analyzing magic bytes in the buffer.
 *
 * @param buffer - ArrayBuffer containing file data (minimum 16 bytes recommended)
 * @returns Detected MIME type or null if unknown
 */
export function detectFileType(buffer: ArrayBuffer): string | null {
  const bytes = new Uint8Array(buffer);

  // Need at least some bytes to detect
  if (bytes.length < 2) {
    return null;
  }

  // Check each signature
  for (const { signature, mimeType, offset = 0 } of FILE_SIGNATURES) {
    if (bytes.length < offset + signature.length) {
      continue;
    }

    let match = true;
    for (let i = 0; i < signature.length; i++) {
      if (bytes[offset + i] !== signature[i]) {
        match = false;
        break;
      }
    }

    if (match) {
      // Special case for RIFF: check if it's WebP
      if (mimeType === 'image/webp' && bytes.length >= 12) {
        const webpCheck = bytes.slice(8, 12);
        const webpSignature = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
        const isWebP = webpSignature.every((byte, idx) => webpCheck[idx] === byte);
        if (!isWebP) {
          continue; // Not WebP, might be WAV or other RIFF format
        }
      }

      return mimeType;
    }
  }

  return null;
}

/**
 * Determine if a file type is compressible.
 *
 * @param mimeType - MIME type of the file
 * @returns true if the file should be compressed, false if already compressed
 */
export function isCompressible(mimeType: string | null): boolean {
  if (!mimeType) {
    // Unknown type - assume compressible (text files, etc.)
    return true;
  }

  // Check if it's in the incompressible set
  if (INCOMPRESSIBLE_TYPES.has(mimeType)) {
    return false;
  }

  // Check for text-based types (compressible)
  if (
    mimeType.startsWith('text/') ||
    mimeType.includes('json') ||
    mimeType.includes('xml') ||
    mimeType.includes('javascript') ||
    mimeType.includes('svg')
  ) {
    return true;
  }

  // Default to compressible
  return true;
}

/**
 * Get a human-readable description of the file type.
 *
 * @param mimeType - MIME type
 * @returns Human-readable description
 */
export function getFileTypeDescription(mimeType: string | null): string {
  if (!mimeType) {return 'Unknown';}

  const descriptions: Record<string, string> = {
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'video/mp4': 'MP4 Video',
    'audio/mpeg': 'MP3 Audio',
    'application/zip': 'ZIP Archive',
    'application/gzip': 'GZIP Archive',
    'application/x-brotli': 'Brotli Compressed',
    'application/x-lzma': 'LZMA Compressed',
    'application/pdf': 'PDF Document',
    'application/json': 'JSON Data',
    'text/html': 'HTML Document',
  };

  return descriptions[mimeType] || mimeType;
}
