/**
 * File Web Worker
 * Offloads heavy file processing operations to a background thread
 * to keep the main UI responsive during file hashing, chunking,
 * and type detection operations.
 */

// Message types for communication
interface FileWorkerMessage {
    type: 'hash-file' | 'chunk-file' | 'merge-chunks' | 'detect-type' | 'read-metadata';
    id: string;
    payload: unknown;
}

interface HashFilePayload {
    file: ArrayBuffer;
    algorithm?: 'SHA-256' | 'SHA-512'; // Hash algorithm
}

interface ChunkFilePayload {
    file: ArrayBuffer;
    chunkSize: number; // Size of each chunk in bytes
    fileName: string;
}

interface MergeChunksPayload {
    chunks: ArrayBuffer[];
}

interface DetectTypePayload {
    file: ArrayBuffer;
    fileName?: string;
}

interface ReadMetadataPayload {
    file: ArrayBuffer;
    fileName: string;
}

// Worker context
const ctx: Worker = self as unknown as Worker;

/**
 * File type signatures (magic bytes)
 */
const FILE_SIGNATURES: Record<string, { signature: number[]; offset: number; mimeType: string }> = {
    'png': { signature: [0x89, 0x50, 0x4E, 0x47], offset: 0, mimeType: 'image/png' },
    'jpg': { signature: [0xFF, 0xD8, 0xFF], offset: 0, mimeType: 'image/jpeg' },
    'gif': { signature: [0x47, 0x49, 0x46, 0x38], offset: 0, mimeType: 'image/gif' },
    'webp': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'image/webp' },
    'pdf': { signature: [0x25, 0x50, 0x44, 0x46], offset: 0, mimeType: 'application/pdf' },
    'zip': { signature: [0x50, 0x4B, 0x03, 0x04], offset: 0, mimeType: 'application/zip' },
    'mp4': { signature: [0x66, 0x74, 0x79, 0x70], offset: 4, mimeType: 'video/mp4' },
    'mp3': { signature: [0x49, 0x44, 0x33], offset: 0, mimeType: 'audio/mpeg' },
    'wav': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'audio/wav' },
    'avi': { signature: [0x52, 0x49, 0x46, 0x46], offset: 0, mimeType: 'video/x-msvideo' },
};

/**
 * Compute hash of a file using crypto.subtle
 * Supports SHA-256 and SHA-512 algorithms
 */
async function hashFile(file: ArrayBuffer, algorithm: 'SHA-256' | 'SHA-512' = 'SHA-256'): Promise<{ hash: string; algorithm: string }> {
    const hashBuffer = await crypto.subtle.digest(algorithm, file);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return {
        hash: hashHex,
        algorithm
    };
}

/**
 * Split a file into chunks of specified size
 * Returns chunk metadata and sends progress updates
 */
async function chunkFile(file: ArrayBuffer, chunkSize: number, fileName: string): Promise<{ chunks: ArrayBuffer[]; metadata: ChunkMetadata }> {
    const totalSize = file.byteLength;
    const totalChunks = Math.ceil(totalSize / chunkSize);
    const chunks: ArrayBuffer[] = [];

    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalSize);
        const chunk = file.slice(start, end);
        chunks.push(chunk);

        // Send progress update
        ctx.postMessage({
            type: 'progress',
            progress: ((i + 1) / totalChunks) * 100,
            chunksProcessed: i + 1,
            totalChunks
        });
    }

    const metadata: ChunkMetadata = {
        fileName,
        totalSize,
        chunkSize,
        totalChunks,
        chunks: chunks.map((chunk, index) => ({
            index,
            size: chunk.byteLength,
            offset: index * chunkSize
        }))
    };

    return { chunks, metadata };
}

/**
 * Reassemble chunks into a single Blob
 */
async function mergeChunks(chunks: ArrayBuffer[]): Promise<ArrayBuffer> {
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
    const merged = new Uint8Array(totalSize);

    let offset = 0;
    for (let i = 0; i < chunks.length; i++) {
        const chunk = new Uint8Array(chunks[i]);
        merged.set(chunk, offset);
        offset += chunk.byteLength;

        // Send progress update
        ctx.postMessage({
            type: 'progress',
            progress: ((i + 1) / chunks.length) * 100,
            chunksProcessed: i + 1,
            totalChunks: chunks.length
        });
    }

    return merged.buffer;
}

/**
 * Detect file type by reading magic bytes
 * Falls back to file extension if magic bytes don't match
 */
async function detectType(file: ArrayBuffer, fileName?: string): Promise<{ type: string; mimeType: string; confidence: 'high' | 'low' }> {
    const bytes = new Uint8Array(file);

    // Check magic bytes
    for (const [type, { signature, offset, mimeType }] of Object.entries(FILE_SIGNATURES)) {
        let matches = true;

        for (let i = 0; i < signature.length; i++) {
            if (bytes[offset + i] !== signature[i]) {
                matches = false;
                break;
            }
        }

        if (matches) {
            return {
                type,
                mimeType,
                confidence: 'high'
            };
        }
    }

    // Fallback to file extension
    if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();

        if (extension) {
            const mimeTypes: Record<string, string> = {
                'txt': 'text/plain',
                'html': 'text/html',
                'css': 'text/css',
                'js': 'application/javascript',
                'json': 'application/json',
                'xml': 'application/xml',
                'svg': 'image/svg+xml',
            };

            if (mimeTypes[extension]) {
                return {
                    type: extension,
                    mimeType: mimeTypes[extension],
                    confidence: 'low'
                };
            }
        }
    }

    // Unknown type
    return {
        type: 'unknown',
        mimeType: 'application/octet-stream',
        confidence: 'low'
    };
}

/**
 * Read basic metadata from file
 * Extracts file size, type, and hash
 */
async function readMetadata(file: ArrayBuffer, fileName: string): Promise<FileMetadata> {
    const typeInfo = await detectType(file, fileName);
    const hashInfo = await hashFile(file, 'SHA-256');

    const metadata: FileMetadata = {
        name: fileName,
        size: file.byteLength,
        type: typeInfo.type,
        mimeType: typeInfo.mimeType,
        hash: hashInfo.hash,
        lastModified: Date.now()
    };

    return metadata;
}

// Type definitions
interface ChunkMetadata {
    fileName: string;
    totalSize: number;
    chunkSize: number;
    totalChunks: number;
    chunks: {
        index: number;
        size: number;
        offset: number;
    }[];
}

interface FileMetadata {
    name: string;
    size: number;
    type: string;
    mimeType: string;
    hash: string;
    lastModified: number;
}

/**
 * Handle incoming messages
 */
ctx.onmessage = async (event: MessageEvent<FileWorkerMessage>) => {
    const { type, id, payload } = event.data;

    try {
        let result: unknown;

        switch (type) {
            case 'hash-file': {
                const { file, algorithm } = payload as HashFilePayload;
                result = await hashFile(file, algorithm);
                break;
            }
            case 'chunk-file': {
                const { file, chunkSize, fileName } = payload as ChunkFilePayload;
                result = await chunkFile(file, chunkSize, fileName);
                break;
            }
            case 'merge-chunks': {
                const { chunks } = payload as MergeChunksPayload;
                result = await mergeChunks(chunks);
                break;
            }
            case 'detect-type': {
                const { file, fileName } = payload as DetectTypePayload;
                result = await detectType(file, fileName);
                break;
            }
            case 'read-metadata': {
                const { file, fileName } = payload as ReadMetadataPayload;
                result = await readMetadata(file, fileName);
                break;
            }
            default:
                throw new Error(`Unknown message type: ${type}`);
        }

        ctx.postMessage({ id, success: true, result });
    } catch (error) {
        ctx.postMessage({
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Signal that worker is ready
ctx.postMessage({ type: 'ready' });
