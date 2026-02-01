'use client';

/**
 * File Chunking Module
 * Handles splitting and reassembling files for transfer with integrity verification
 */

import { hash } from './encryption';
import { TransferChunk } from '../types';
import secureLog from '../utils/secure-logger';

// Default chunk size: 64KB (optimal for WebRTC)
export const DEFAULT_CHUNK_SIZE = 64 * 1024;

// Larger chunk size for local network (1MB)
export const LOCAL_CHUNK_SIZE = 1024 * 1024;

/**
 * Chunk metadata
 */
export interface ChunkMeta {
    transferId: string;
    fileId: string;
    fileName: string;
    fileSize: number;
    totalChunks: number;
    chunkSize: number;
}

/**
 * Split a file into chunks
 */
export async function* chunkFile(
    file: File,
    transferId: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE
): AsyncGenerator<TransferChunk, void, unknown> {
    const totalChunks = Math.ceil(file.size / chunkSize);
    let offset = 0;
    let chunkIndex = 0;

    while (offset < file.size) {
        const slice = file.slice(offset, offset + chunkSize);
        const data = await slice.arrayBuffer();
        const chunkHash = await hash(data);

        yield {
            transferId,
            chunkIndex,
            totalChunks,
            data,
            hash: chunkHash,
            encrypted: false,
        };

        offset += chunkSize;
        chunkIndex++;
    }
}

/**
 * Read all chunks of a file at once
 */
export async function readAllChunks(
    file: File,
    transferId: string,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    onProgress?: (progress: number) => void
): Promise<TransferChunk[]> {
    const chunks: TransferChunk[] = [];
    const totalChunks = Math.ceil(file.size / chunkSize);
    let processedChunks = 0;

    for await (const chunk of chunkFile(file, transferId, chunkSize)) {
        chunks.push(chunk);
        processedChunks++;
        onProgress?.((processedChunks / totalChunks) * 100);
    }

    return chunks;
}

/**
 * Chunk collector for receiving files
 */
export class ChunkCollector {
    private chunks: Map<number, ArrayBuffer> = new Map();
    private hashes: Map<number, string> = new Map();
    private meta: ChunkMeta | null = null;
    private receivedBytes: number = 0;

    constructor() { }

    /**
     * Set the metadata for the file being received
     */
    setMeta(meta: ChunkMeta): void {
        this.meta = meta;
        this.chunks.clear();
        this.hashes.clear();
        this.receivedBytes = 0;
    }

    /**
     * Add a received chunk
     */
    async addChunk(chunk: TransferChunk): Promise<boolean> {
        // Verify hash
        const calculatedHash = await hash(chunk.data);
        if (calculatedHash !== chunk.hash) {
            secureLog.error('Chunk hash mismatch at index:', chunk.chunkIndex);
            return false;
        }

        this.chunks.set(chunk.chunkIndex, chunk.data);
        this.hashes.set(chunk.chunkIndex, chunk.hash);
        this.receivedBytes += chunk.data.byteLength;

        return true;
    }

    /**
     * Check if all chunks have been received
     */
    isComplete(): boolean {
        if (!this.meta) {return false;}
        return this.chunks.size === this.meta.totalChunks;
    }

    /**
     * Get the current progress (0-100)
     */
    getProgress(): number {
        if (!this.meta) {return 0;}
        return (this.chunks.size / this.meta.totalChunks) * 100;
    }

    /**
     * Get received bytes
     */
    getReceivedBytes(): number {
        return this.receivedBytes;
    }

    /**
     * Get missing chunk indices
     */
    getMissingChunks(): number[] {
        if (!this.meta) {return [];}

        const missing: number[] = [];
        for (let i = 0; i < this.meta.totalChunks; i++) {
            if (!this.chunks.has(i)) {
                missing.push(i);
            }
        }
        return missing;
    }

    /**
     * Assemble the file from chunks
     */
    assemble(): Blob | null {
        if (!this.isComplete() || !this.meta) {return null;}

        // Sort chunks by index and combine
        const sortedChunks: ArrayBuffer[] = [];
        for (let i = 0; i < this.meta.totalChunks; i++) {
            const chunk = this.chunks.get(i);
            if (!chunk) {return null;}
            sortedChunks.push(chunk);
        }

        return new Blob(sortedChunks);
    }

    /**
     * Clear the collector
     */
    clear(): void {
        this.chunks.clear();
        this.hashes.clear();
        this.meta = null;
        this.receivedBytes = 0;
    }
}

/**
 * Calculate the optimal chunk size based on file size and connection type
 */
export function calculateOptimalChunkSize(
    fileSize: number,
    isLocalNetwork: boolean = false
): number {
    if (isLocalNetwork) {
        // Local network: use larger chunks
        if (fileSize > 100 * 1024 * 1024) {
            return 4 * 1024 * 1024; // 4MB for files > 100MB
        }
        return LOCAL_CHUNK_SIZE; // 1MB default
    }

    // Internet: use smaller chunks for better reliability
    if (fileSize > 1024 * 1024 * 1024) {
        return 256 * 1024; // 256KB for files > 1GB
    }
    if (fileSize > 100 * 1024 * 1024) {
        return 128 * 1024; // 128KB for files > 100MB
    }
    return DEFAULT_CHUNK_SIZE; // 64KB default
}

/**
 * Estimate transfer time based on file size and speed
 */
export function estimateTransferTime(
    fileSize: number,
    speedBytesPerSecond: number
): number {
    if (speedBytesPerSecond <= 0) {return Infinity;}
    return Math.ceil(fileSize / speedBytesPerSecond);
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format speed for display
 */
export function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

/**
 * Format time duration for display
 */
export function formatDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) {return '--:--';}

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export default {
    DEFAULT_CHUNK_SIZE,
    LOCAL_CHUNK_SIZE,
    chunkFile,
    readAllChunks,
    ChunkCollector,
    calculateOptimalChunkSize,
    estimateTransferTime,
    formatFileSize,
    formatSpeed,
    formatDuration,
};
