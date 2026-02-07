/**
 * Compression Detection Utility
 *
 * Detects if files are already compressed to avoid redundant compression.
 * Uses file magic bytes (file signatures) and MIME types for detection.
 */

/**
 * File magic bytes signatures for common compressed formats
 * First 4 bytes of file content
 */
const COMPRESSED_SIGNATURES = {
    // Images (compressed)
    JPEG: [0xFF, 0xD8, 0xFF],
    PNG: [0x89, 0x50, 0x4E, 0x47],
    WEBP: [0x52, 0x49, 0x46, 0x46], // RIFF header, need to check for WEBP later
    GIF: [0x47, 0x49, 0x46],

    // Archives
    ZIP: [0x50, 0x4B, 0x03, 0x04],
    ZIP_EMPTY: [0x50, 0x4B, 0x05, 0x06],
    ZIP_SPANNED: [0x50, 0x4B, 0x07, 0x08],
    RAR: [0x52, 0x61, 0x72, 0x21],
    SEVENZ: [0x37, 0x7A, 0xBC, 0xAF],
    GZIP: [0x1F, 0x8B],
    BZIP2: [0x42, 0x5A, 0x68],
    XZ: [0xFD, 0x37, 0x7A, 0x58],

    // Video (compressed)
    MP4: [0x66, 0x74, 0x79, 0x70], // ftyp (at offset 4)
    AVI: [0x52, 0x49, 0x46, 0x46], // RIFF header

    // Audio (compressed)
    MP3: [0xFF, 0xFB],
    MP3_ID3: [0x49, 0x44, 0x33], // ID3
    FLAC: [0x66, 0x4C, 0x61, 0x43],
    OGG: [0x4F, 0x67, 0x67, 0x53],
};

/**
 * MIME types of already-compressed formats
 */
const COMPRESSED_MIME_TYPES = new Set([
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/heic',
    'image/heif',

    // Video
    'video/mp4',
    'video/mpeg',
    'video/webm',
    'video/x-msvideo',
    'video/quicktime',
    'video/x-matroska',

    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/opus',
    'audio/flac',
    'audio/webm',

    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    'application/x-gzip',
    'application/x-bzip2',
    'application/x-xz',
    'application/x-tar',
]);

/**
 * File extensions of already-compressed formats
 */
const COMPRESSED_EXTENSIONS = new Set([
    // Images
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'heic', 'heif',

    // Video
    'mp4', 'mpeg', 'mpg', 'avi', 'mov', 'mkv', 'webm', 'm4v',

    // Audio
    'mp3', 'aac', 'm4a', 'ogg', 'opus', 'flac', 'wma',

    // Archives
    'zip', 'rar', '7z', 'gz', 'bz2', 'xz', 'tar',

    // Documents (already optimized)
    'pdf', // PDFs are already compressed internally
]);

/**
 * Check if byte sequence matches signature
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
    if (bytes.length < signature.length) {
        return false;
    }

    return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Read first N bytes from file
 */
async function readFileHeader(file: File, numBytes: number = 12): Promise<Uint8Array> {
    const slice = file.slice(0, numBytes);
    const buffer = await slice.arrayBuffer();
    return new Uint8Array(buffer);
}

/**
 * Detect if file is compressed by checking magic bytes
 */
async function isCompressedByMagicBytes(file: File): Promise<boolean> {
    try {
        const header = await readFileHeader(file);

        // Check all known compressed format signatures
        for (const signature of Object.values(COMPRESSED_SIGNATURES)) {
            if (matchesSignature(header, signature)) {
                return true;
            }
        }

        // Special case for MP4: check ftyp at offset 4
        if (header.length >= 12) {
            const offset4 = header.slice(4, 8);
            if (matchesSignature(offset4, COMPRESSED_SIGNATURES.MP4)) {
                return true;
            }
        }

        return false;
    } catch {
        // If we can't read the file, fall back to MIME type check
        return false;
    }
}

/**
 * Get file extension from filename
 */
function getExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length > 1) {
        return parts[parts.length - 1]?.toLowerCase() ?? '';
    }
    return '';
}

/**
 * Check if file is already compressed (primary function)
 *
 * Uses multiple detection methods:
 * 1. MIME type checking (fastest)
 * 2. File extension checking
 * 3. Magic bytes checking (most accurate)
 *
 * @param file - File to check
 * @returns Promise<boolean> - true if file is already compressed
 */
export async function isCompressed(file: File): Promise<boolean> {
    // Fast path: check MIME type
    if (COMPRESSED_MIME_TYPES.has(file.type)) {
        return true;
    }

    // Check file extension
    const ext = getExtension(file.name);
    if (COMPRESSED_EXTENSIONS.has(ext)) {
        return true;
    }

    // Slow path: check magic bytes for accuracy
    return await isCompressedByMagicBytes(file);
}

/**
 * Inverse of isCompressed - check if file is compressible
 *
 * @param file - File to check
 * @returns Promise<boolean> - true if file would benefit from compression
 */
export async function isCompressible(file: File): Promise<boolean> {
    const compressed = await isCompressed(file);
    return !compressed;
}

/**
 * Get compression recommendation for a file
 *
 * @param file - File to analyze
 * @returns Promise<string> - Human-readable recommendation
 */
export async function getCompressionRecommendation(file: File): Promise<string> {
    const compressed = await isCompressed(file);

    if (compressed) {
        return 'Already optimized';
    }

    // Check file size to determine if compression is worth it
    if (file.size < 1024) { // Less than 1KB
        return 'Too small to compress';
    }

    return 'Will be compressed';
}
