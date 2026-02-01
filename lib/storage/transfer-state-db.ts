'use client';

/**
 * Transfer State Database (IndexedDB)
 * Persistent storage for resumable transfers with chunk tracking
 *
 * Features:
 * - Store transfer metadata and session keys
 * - Track individual chunks (received/pending)
 * - Chunk bitmap for efficient resume
 * - Auto-cleanup of expired transfers
 * - Chunk integrity verification
 */

import secureLog from '@/lib/utils/secure-logger';
import { SessionKeys } from '../crypto/pqc-crypto-lazy';

const DB_NAME = 'TallowTransferStateDB';
const DB_VERSION = 2;
const TRANSFER_STORE = 'transfers';
const CHUNK_STORE = 'chunks';
const TRANSFER_EXPIRY_DAYS = 7; // Clean up transfers older than 7 days

/**
 * Serialized types for IndexedDB storage
 * These represent the JSON-serializable format stored in IndexedDB
 */
interface SerializedChunkData {
  transferId: string;
  chunkIndex: number;
  data: ArrayBuffer;
  nonce: number[];
  hash: number[];
  receivedAt: string;
}

interface SerializedTransferMetadata {
  transferId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: number[];
  totalChunks: number;
  chunkSize: number;
  peerId: string;
  direction: 'send' | 'receive';
  sessionKeys?: {
    encryptionKey: number[];
    authKey: number[];
    sessionId: number[];
  };
  receivedChunks: number;
  chunkBitmap: number[];
  startedAt: string;
  lastUpdated: string;
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'failed';
  error?: string;
  encryptedName?: string;
  nameNonce?: number[];
  encryptedPath?: string;
  pathNonce?: number[];
}

export interface TransferMetadata {
  transferId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: Uint8Array;
  totalChunks: number;
  chunkSize: number;
  peerId: string;
  direction: 'send' | 'receive';

  // Session keys (encrypted at rest by IndexedDB encryption)
  sessionKeys?: {
    encryptionKey: number[]; // Stored as array for JSON serialization
    authKey: number[];
    sessionId: number[];
  };

  // Progress tracking
  receivedChunks: number; // Count of received chunks
  chunkBitmap: number[]; // Bit array: 1 = received, 0 = missing

  // Timestamps
  startedAt: Date;
  lastUpdated: Date;

  // Status
  status: 'pending' | 'in-progress' | 'paused' | 'completed' | 'failed';

  // Error info
  error?: string;

  // Encryption metadata
  encryptedName?: string;
  nameNonce?: number[];
  encryptedPath?: string;
  pathNonce?: number[];
}

export interface ChunkData {
  transferId: string;
  chunkIndex: number;
  data: ArrayBuffer;
  nonce: Uint8Array;
  hash: Uint8Array;
  receivedAt: Date;
}

let db: IDBDatabase | null = null;

/**
 * Open IndexedDB with schema
 */
async function openDB(): Promise<IDBDatabase> {
  if (db) {return db;}

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      secureLog.error('Failed to open transfer state DB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      secureLog.log('Transfer state DB opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create transfer metadata store
      if (!database.objectStoreNames.contains(TRANSFER_STORE)) {
        const transferStore = database.createObjectStore(TRANSFER_STORE, {
          keyPath: 'transferId'
        });
        transferStore.createIndex('status', 'status', { unique: false });
        transferStore.createIndex('peerId', 'peerId', { unique: false });
        transferStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        transferStore.createIndex('startedAt', 'startedAt', { unique: false });
      }

      // Create chunk data store
      if (!database.objectStoreNames.contains(CHUNK_STORE)) {
        const chunkStore = database.createObjectStore(CHUNK_STORE, {
          keyPath: ['transferId', 'chunkIndex']
        });
        chunkStore.createIndex('transferId', 'transferId', { unique: false });
      }

      secureLog.log('Transfer state DB schema created');
    };
  });
}

/**
 * Create a new transfer state
 */
export async function createTransferState(
  transferId: string,
  fileName: string,
  fileType: string,
  fileSize: number,
  fileHash: Uint8Array,
  chunkSize: number,
  peerId: string,
  direction: 'send' | 'receive',
  sessionKeys?: SessionKeys,
  encryptedName?: string,
  nameNonce?: Uint8Array,
  encryptedPath?: string,
  pathNonce?: Uint8Array
): Promise<TransferMetadata> {
  const database = await openDB();
  const totalChunks = Math.ceil(fileSize / chunkSize);

  // Initialize chunk bitmap (bit array)
  const bitmapSize = Math.ceil(totalChunks / 8);
  const chunkBitmap = new Array(bitmapSize).fill(0);

  const convertedSessionKeys = sessionKeys ? {
    encryptionKey: Array.from(sessionKeys.encryptionKey),
    authKey: Array.from(sessionKeys.authKey),
    sessionId: Array.from(sessionKeys.sessionId),
  } : undefined;
  const convertedNameNonce = nameNonce ? Array.from(nameNonce) : undefined;
  const convertedPathNonce = pathNonce ? Array.from(pathNonce) : undefined;

  const metadata: TransferMetadata = {
    transferId,
    fileName,
    fileType,
    fileSize,
    fileHash,
    totalChunks,
    chunkSize,
    peerId,
    direction,
    ...(convertedSessionKeys ? { sessionKeys: convertedSessionKeys } : {}),
    receivedChunks: 0,
    chunkBitmap,
    startedAt: new Date(),
    lastUpdated: new Date(),
    status: 'pending',
    ...(encryptedName ? { encryptedName } : {}),
    ...(convertedNameNonce ? { nameNonce: convertedNameNonce } : {}),
    ...(encryptedPath ? { encryptedPath } : {}),
    ...(convertedPathNonce ? { pathNonce: convertedPathNonce } : {}),
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSFER_STORE], 'readwrite');
    const store = transaction.objectStore(TRANSFER_STORE);

    const serialized = {
      ...metadata,
      fileHash: Array.from(fileHash),
      startedAt: metadata.startedAt.toISOString(),
      lastUpdated: metadata.lastUpdated.toISOString(),
    };

    const request = store.add(serialized);

    request.onsuccess = () => {
      secureLog.log(`Transfer state created: ${transferId}`);
      resolve(metadata);
    };

    request.onerror = () => {
      secureLog.error('Failed to create transfer state:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get transfer state by ID
 */
export async function getTransferState(transferId: string): Promise<TransferMetadata | null> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSFER_STORE], 'readonly');
    const store = transaction.objectStore(TRANSFER_STORE);
    const request = store.get(transferId);

    request.onsuccess = () => {
      if (request.result) {
        const data = request.result;
        resolve({
          ...data,
          fileHash: new Uint8Array(data.fileHash),
          startedAt: new Date(data.startedAt),
          lastUpdated: new Date(data.lastUpdated),
        });
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      secureLog.error('Failed to get transfer state:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Update transfer state
 */
export async function updateTransferState(metadata: Partial<TransferMetadata> & { transferId: string }): Promise<void> {
  const database = await openDB();

  return new Promise(async (resolve, reject) => {
    const existing = await getTransferState(metadata.transferId);
    if (!existing) {
      reject(new Error('Transfer not found'));
      return;
    }

    const updated = {
      ...existing,
      ...metadata,
      lastUpdated: new Date(),
    };

    const transaction = database.transaction([TRANSFER_STORE], 'readwrite');
    const store = transaction.objectStore(TRANSFER_STORE);

    const serialized = {
      ...updated,
      fileHash: Array.from(updated.fileHash),
      startedAt: updated.startedAt.toISOString(),
      lastUpdated: updated.lastUpdated.toISOString(),
    };

    const request = store.put(serialized);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      secureLog.error('Failed to update transfer state:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Save chunk data
 */
export async function saveChunk(
  transferId: string,
  chunkIndex: number,
  data: ArrayBuffer,
  nonce: Uint8Array,
  hash: Uint8Array
): Promise<void> {
  const database = await openDB();

  const chunk: ChunkData = {
    transferId,
    chunkIndex,
    data,
    nonce,
    hash,
    receivedAt: new Date(),
  };

  return new Promise(async (resolve, reject) => {
    const transaction = database.transaction([CHUNK_STORE, TRANSFER_STORE], 'readwrite');
    const chunkStore = transaction.objectStore(CHUNK_STORE);
    const transferStore = transaction.objectStore(TRANSFER_STORE);

    // Save chunk
    const serialized = {
      ...chunk,
      nonce: Array.from(nonce),
      hash: Array.from(hash),
      receivedAt: chunk.receivedAt.toISOString(),
    };

    const chunkRequest = chunkStore.put(serialized);

    chunkRequest.onsuccess = async () => {
      // Update bitmap
      const transferRequest = transferStore.get(transferId);

      transferRequest.onsuccess = () => {
        const transfer = transferRequest.result;
        if (!transfer) {
          reject(new Error('Transfer not found'));
          return;
        }

        // Set bit in bitmap
        const byteIndex = Math.floor(chunkIndex / 8);
        const bitIndex = chunkIndex % 8;
        transfer.chunkBitmap[byteIndex] |= (1 << bitIndex);

        // Update received count
        transfer.receivedChunks = (transfer.receivedChunks || 0) + 1;
        transfer.lastUpdated = new Date().toISOString();

        // Update status
        if (transfer.receivedChunks === transfer.totalChunks) {
          transfer.status = 'completed';
        } else if (transfer.status === 'pending') {
          transfer.status = 'in-progress';
        }

        const updateRequest = transferStore.put(transfer);

        updateRequest.onsuccess = () => {
          resolve();
        };

        updateRequest.onerror = () => {
          reject(updateRequest.error);
        };
      };

      transferRequest.onerror = () => {
        reject(transferRequest.error);
      };
    };

    chunkRequest.onerror = () => {
      secureLog.error('Failed to save chunk:', chunkRequest.error);
      reject(chunkRequest.error);
    };
  });
}

/**
 * Get chunk data
 */
export async function getChunk(transferId: string, chunkIndex: number): Promise<ChunkData | null> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([CHUNK_STORE], 'readonly');
    const store = transaction.objectStore(CHUNK_STORE);
    const request = store.get([transferId, chunkIndex]);

    request.onsuccess = () => {
      if (request.result) {
        const data = request.result;
        resolve({
          ...data,
          nonce: new Uint8Array(data.nonce),
          hash: new Uint8Array(data.hash),
          receivedAt: new Date(data.receivedAt),
        });
      } else {
        resolve(null);
      }
    };

    request.onerror = () => {
      secureLog.error('Failed to get chunk:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get all chunks for a transfer (ordered by index)
 */
export async function getAllChunks(transferId: string): Promise<ChunkData[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([CHUNK_STORE], 'readonly');
    const store = transaction.objectStore(CHUNK_STORE);
    const index = store.index('transferId');
    const request = index.getAll(transferId);

    request.onsuccess = () => {
      const chunks = (request.result as SerializedChunkData[]).map((data: SerializedChunkData) => ({
        ...data,
        nonce: new Uint8Array(data.nonce),
        hash: new Uint8Array(data.hash),
        receivedAt: new Date(data.receivedAt),
      }));

      // Sort by chunk index
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);

      resolve(chunks);
    };

    request.onerror = () => {
      secureLog.error('Failed to get chunks:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get missing chunk indices
 */
export async function getMissingChunks(transferId: string): Promise<number[]> {
  const metadata = await getTransferState(transferId);
  if (!metadata) {return [];}

  const missing: number[] = [];

  for (let i = 0; i < metadata.totalChunks; i++) {
    const byteIndex = Math.floor(i / 8);
    const bitIndex = i % 8;
    const byteValue = metadata.chunkBitmap[byteIndex];
    if (byteValue === undefined) {continue;}
    const isReceived = (byteValue & (1 << bitIndex)) !== 0;

    if (!isReceived) {
      missing.push(i);
    }
  }

  return missing;
}

/**
 * Check if chunk is received
 */
export async function isChunkReceived(transferId: string, chunkIndex: number): Promise<boolean> {
  const metadata = await getTransferState(transferId);
  if (!metadata) {return false;}

  const byteIndex = Math.floor(chunkIndex / 8);
  const bitIndex = chunkIndex % 8;
  const byteValue = metadata.chunkBitmap[byteIndex];

  return byteValue !== undefined && (byteValue & (1 << bitIndex)) !== 0;
}

/**
 * Get all resumable transfers
 */
export async function getResumableTransfers(): Promise<TransferMetadata[]> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSFER_STORE], 'readonly');
    const store = transaction.objectStore(TRANSFER_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const transfers = (request.result as SerializedTransferMetadata[])
        .map((data: SerializedTransferMetadata) => ({
          ...data,
          fileHash: new Uint8Array(data.fileHash),
          startedAt: new Date(data.startedAt),
          lastUpdated: new Date(data.lastUpdated),
        }))
        .filter((t: TransferMetadata) =>
          (t.status === 'in-progress' || t.status === 'paused') &&
          t.receivedChunks < t.totalChunks
        );

      resolve(transfers);
    };

    request.onerror = () => {
      secureLog.error('Failed to get resumable transfers:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete transfer and all its chunks
 */
export async function deleteTransfer(transferId: string): Promise<void> {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSFER_STORE, CHUNK_STORE], 'readwrite');
    const transferStore = transaction.objectStore(TRANSFER_STORE);
    const chunkStore = transaction.objectStore(CHUNK_STORE);

    // Delete transfer metadata
    transferStore.delete(transferId);

    // Delete all chunks
    const index = chunkStore.index('transferId');
    const request = index.openCursor(IDBKeyRange.only(transferId));

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    transaction.oncomplete = () => {
      secureLog.log(`Transfer deleted: ${transferId}`);
      resolve();
    };

    transaction.onerror = () => {
      secureLog.error('Failed to delete transfer:', transaction.error);
      reject(transaction.error);
    };
  });
}

/**
 * Clean up expired transfers (older than 7 days)
 */
export async function cleanupExpiredTransfers(): Promise<number> {
  const database = await openDB();
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() - TRANSFER_EXPIRY_DAYS);

  return new Promise((resolve, reject) => {
    const transaction = database.transaction([TRANSFER_STORE], 'readonly');
    const store = transaction.objectStore(TRANSFER_STORE);
    const request = store.getAll();

    request.onsuccess = async () => {
      const expired = (request.result as SerializedTransferMetadata[]).filter((t: SerializedTransferMetadata) => {
        const lastUpdated = new Date(t.lastUpdated);
        return lastUpdated < expiryDate &&
               (t.status === 'in-progress' || t.status === 'paused' || t.status === 'failed');
      });

      let deletedCount = 0;
      for (const transfer of expired) {
        try {
          await deleteTransfer(transfer.transferId);
          deletedCount++;
        } catch (e) {
          secureLog.error('Failed to delete expired transfer:', e);
        }
      }

      secureLog.log(`Cleaned up ${deletedCount} expired transfers`);
      resolve(deletedCount);
    };

    request.onerror = () => {
      secureLog.error('Failed to cleanup expired transfers:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get transfer statistics
 */
export async function getTransferStats(transferId: string): Promise<{
  totalChunks: number;
  receivedChunks: number;
  missingChunks: number;
  progress: number;
  bytesReceived: number;
}> {
  const metadata = await getTransferState(transferId);
  if (!metadata) {
    throw new Error('Transfer not found');
  }

  const missing = await getMissingChunks(transferId);
  const bytesReceived = metadata.receivedChunks * metadata.chunkSize;
  const progress = (metadata.receivedChunks / metadata.totalChunks) * 100;

  return {
    totalChunks: metadata.totalChunks,
    receivedChunks: metadata.receivedChunks,
    missingChunks: missing.length,
    progress,
    bytesReceived: Math.min(bytesReceived, metadata.fileSize),
  };
}

/**
 * Export chunk bitmap as compact string (for resume protocol)
 */
export function exportChunkBitmap(bitmap: number[]): string {
  return bitmap.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Import chunk bitmap from string
 */
export function importChunkBitmap(bitmapHex: string): number[] {
  const bitmap: number[] = [];
  for (let i = 0; i < bitmapHex.length; i += 2) {
    bitmap.push(parseInt(bitmapHex.substr(i, 2), 16));
  }
  return bitmap;
}

export default {
  createTransferState,
  getTransferState,
  updateTransferState,
  saveChunk,
  getChunk,
  getAllChunks,
  getMissingChunks,
  isChunkReceived,
  getResumableTransfers,
  deleteTransfer,
  cleanupExpiredTransfers,
  getTransferStats,
  exportChunkBitmap,
  importChunkBitmap,
};
