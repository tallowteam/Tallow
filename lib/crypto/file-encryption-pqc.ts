'use client';

/**
 * Post-Quantum File Encryption Service
 * Replaces lib/transfer/file-encryption.ts with PQC-enhanced version
 */

import { pqCrypto } from './pqc-crypto';
import { captureException, addBreadcrumb } from '../monitoring/sentry';

const CHUNK_SIZE = 64 * 1024; // 64KB chunks for progressive encryption

export interface EncryptedFile {
  metadata: EncryptedFileMetadata;
  chunks: EncryptedChunk[];
}

export interface EncryptedFileMetadata {
  // Encrypted name (base64 of encrypted bytes) - only original sender/receiver can decrypt
  encryptedName: string;
  // Nonce for name encryption
  nameNonce: Uint8Array;
  // Original size (not sensitive - needed for progress)
  originalSize: number;
  // Generic mime type category (not full type to reduce fingerprinting)
  mimeCategory: string;
  totalChunks: number;
  fileHash: Uint8Array;
  encryptedAt: number;
  // For backward compatibility - set to empty string in transmission
  originalName: string;
  // Optional salt for password-based encryption
  salt?: Uint8Array;
}

export interface EncryptedChunk {
  index: number;
  data: Uint8Array;
  nonce: Uint8Array;
  hash: Uint8Array;
}

/**
 * Categorize MIME type to reduce fingerprinting
 * Returns generic category instead of specific type
 */
function categorizeMimeType(mimeType: string): string {
  if (!mimeType) {return 'unknown';}
  const [type] = mimeType.split('/');
  switch (type) {
    case 'image': return 'image';
    case 'video': return 'video';
    case 'audio': return 'audio';
    case 'text': return 'text';
    case 'application': return 'document';
    default: return 'unknown';
  }
}

/**
 * Encrypt file with post-quantum enhanced encryption
 */
export async function encryptFile(
  file: File,
  encryptionKey: Uint8Array
): Promise<EncryptedFile> {
  if (file.size === 0) {
    throw new Error('Cannot encrypt empty file');
  }

  addBreadcrumb('Starting PQC file encryption', 'crypto', {
    fileSize: file.size,
    mimeType: file.type,
  });

  // Read file
  const fileBuffer = await file.arrayBuffer();
  const fileData = new Uint8Array(fileBuffer);

  // Compute file hash
  const fileHash = pqCrypto.hash(fileData);

  // Encrypt the filename for privacy
  const nameBytes = new TextEncoder().encode(file.name);
  const encryptedNameData = await pqCrypto.encrypt(nameBytes, encryptionKey);
  const encryptedName = btoa(String.fromCharCode(...encryptedNameData.ciphertext));

  // Calculate chunks
  const totalChunks = Math.ceil(fileData.length / CHUNK_SIZE);
  const chunks: EncryptedChunk[] = [];

  // Encrypt each chunk
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, fileData.length);
    const chunkData = fileData.slice(start, end);

    // Hash chunk before encryption
    const chunkHash = pqCrypto.hash(chunkData);

    // Associated data includes chunk index and file hash
    const associatedData = new Uint8Array([
      ...new TextEncoder().encode(`chunk:${i}`),
      ...fileHash,
    ]);

    // Encrypt chunk
    const encrypted = await pqCrypto.encrypt(chunkData, encryptionKey, associatedData);

    chunks.push({
      index: i,
      data: encrypted.ciphertext,
      nonce: encrypted.nonce,
      hash: chunkHash,
    });
  }

  return {
    metadata: {
      encryptedName,
      nameNonce: encryptedNameData.nonce,
      originalName: '', // Empty for transmission - prevents leaking filename
      originalSize: file.size,
      mimeCategory: categorizeMimeType(file.type),
      totalChunks,
      fileHash,
      encryptedAt: Date.now(),
    },
    chunks,
  };
}

/**
 * Decrypt the filename from encrypted metadata
 */
export async function decryptFileName(
  encryptedFile: EncryptedFile,
  encryptionKey: Uint8Array
): Promise<string> {
  // If no encrypted name, return generic name based on category
  if (!encryptedFile.metadata.encryptedName || !encryptedFile.metadata.nameNonce) {
    const ext = getExtensionForCategory(encryptedFile.metadata.mimeCategory || 'unknown');
    return `file${ext}`;
  }

  try {
    const ciphertext = new Uint8Array(
      atob(encryptedFile.metadata.encryptedName).split('').map(c => c.charCodeAt(0))
    );

    const decrypted = await pqCrypto.decrypt(
      {
        ciphertext,
        nonce: encryptedFile.metadata.nameNonce,
      },
      encryptionKey
    );

    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails, return generic name
    const ext = getExtensionForCategory(encryptedFile.metadata.mimeCategory || 'unknown');
    return `file${ext}`;
  }
}

/**
 * Get a generic extension for a mime category
 */
function getExtensionForCategory(category: string): string {
  switch (category) {
    case 'image': return '.jpg';
    case 'video': return '.mp4';
    case 'audio': return '.mp3';
    case 'text': return '.txt';
    case 'document': return '.bin';
    default: return '.bin';
  }
}

/**
 * Decrypt file
 */
export async function decryptFile(
  encryptedFile: EncryptedFile,
  encryptionKey: Uint8Array
): Promise<Blob> {
  // Validate metadata
  if (!encryptedFile.metadata || encryptedFile.metadata.totalChunks <= 0) {
    throw new Error('Invalid encrypted file: missing or invalid metadata');
  }
  if (encryptedFile.chunks.length !== encryptedFile.metadata.totalChunks) {
    throw new Error(`Chunk count mismatch: expected ${encryptedFile.metadata.totalChunks}, got ${encryptedFile.chunks.length}`);
  }

  const chunks: Uint8Array[] = [];

  // Decrypt each chunk
  for (const encChunk of encryptedFile.chunks) {
    // Associated data must match encryption
    const associatedData = new Uint8Array([
      ...new TextEncoder().encode(`chunk:${encChunk.index}`),
      ...encryptedFile.metadata.fileHash,
    ]);

    // Decrypt
    const decrypted = await pqCrypto.decrypt(
      {
        ciphertext: encChunk.data,
        nonce: encChunk.nonce,
      },
      encryptionKey,
      associatedData
    );

    // Verify chunk hash
    const computedHash = pqCrypto.hash(decrypted);
    if (!pqCrypto.constantTimeEqual(computedHash, encChunk.hash)) {
      const hashError = new Error(`Chunk ${encChunk.index} hash mismatch - file corrupted`);
      captureException(hashError, {
        tags: { module: 'file-encryption-pqc', operation: 'decryptFile' },
        extra: {
          chunkIndex: encChunk.index,
          totalChunks: encryptedFile.metadata.totalChunks,
          originalSize: encryptedFile.metadata.originalSize,
        }
      });
      throw hashError;
    }

    chunks.push(decrypted);
  }

  // Combine chunks and validate total size
  const totalSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  if (totalSize !== encryptedFile.metadata.originalSize) {
    throw new Error(`Decrypted size mismatch: expected ${encryptedFile.metadata.originalSize}, got ${totalSize}`);
  }
  const fileData = new Uint8Array(totalSize);

  let offset = 0;
  for (const chunk of chunks) {
    fileData.set(chunk, offset);
    offset += chunk.length;
  }

  // Verify complete file hash
  const computedFileHash = pqCrypto.hash(fileData);
  if (!pqCrypto.constantTimeEqual(computedFileHash, encryptedFile.metadata.fileHash)) {
    const fileHashError = new Error('File hash mismatch - file corrupted');
    captureException(fileHashError, {
      tags: { module: 'file-encryption-pqc', operation: 'decryptFile' },
      extra: {
        originalSize: encryptedFile.metadata.originalSize,
        decryptedSize: totalSize,
        totalChunks: encryptedFile.metadata.totalChunks,
      }
    });
    throw fileHashError;
  }

  // Use mimeCategory for blob type (not revealing exact mime)
  const mimeType = encryptedFile.metadata.mimeCategory || 'application/octet-stream';
  return new Blob([fileData], { type: mimeType });
}

/**
 * Encrypt file with password
 */
export async function encryptFileWithPassword(
  file: File,
  password: string
): Promise<EncryptedFile> {
  if (!password || password.length === 0) {
    throw new Error('Password must not be empty');
  }

  // Generate random salt
  const salt = pqCrypto.randomBytes(32);

  // Derive key from password using Argon2id (memory-hard KDF)
  const encryptionKey = await pqCrypto.deriveKeyFromPassword(password, salt);

  // Encrypt file
  const encrypted = await encryptFile(file, encryptionKey);

  // Store salt in metadata (type-safe)
  encrypted.metadata.salt = salt;

  return encrypted;
}

/**
 * Decrypt file with password
 */
export async function decryptFileWithPassword(
  encryptedFile: EncryptedFile,
  password: string
): Promise<Blob> {
  if (!password || password.length === 0) {
    throw new Error('Password must not be empty');
  }

  // Extract salt (type-safe)
  const salt = encryptedFile.metadata.salt;
  if (!salt || !(salt instanceof Uint8Array) || salt.length !== 32) {
    throw new Error('Invalid or missing salt in encrypted file metadata');
  }

  // Derive key using Argon2id (memory-hard KDF)
  const encryptionKey = await pqCrypto.deriveKeyFromPassword(password, salt);

  // Decrypt - hash mismatch after password derivation indicates wrong password
  try {
    return await decryptFile(encryptedFile, encryptionKey);
  } catch (error) {
    if (error instanceof Error && error.message.includes('hash mismatch')) {
      // Report password decryption failure (likely wrong password)
      captureException(error, {
        tags: { module: 'file-encryption-pqc', operation: 'decryptFileWithPassword' },
        extra: {
          reason: 'hash_mismatch_likely_wrong_password',
          originalSize: encryptedFile.metadata.originalSize,
        }
      });
      throw new Error('Decryption failed - incorrect password or corrupted file');
    }
    throw error;
  }
}

/**
 * Stream-encrypt large file (for files > 100MB)
 */
export async function* encryptFileStream(
  file: File,
  encryptionKey: Uint8Array
): AsyncGenerator<EncryptedChunk, EncryptedFileMetadata> {
  if (file.size === 0) {
    throw new Error('Cannot encrypt empty file');
  }

  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);

  // First pass: compute file hash (streaming)
  const hasher = new ReadableStream({
    async start(controller) {
      const reader = file.stream().getReader();
      const chunks: Uint8Array[] = [];

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {break;}
          chunks.push(value);
        }
      } finally {
        reader.releaseLock();
      }

      // Combine and hash
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const allData = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        allData.set(chunk, offset);
        offset += chunk.length;
      }

      controller.enqueue(allData);
      controller.close();
    },
  });

  const reader = hasher.getReader();
  const { value: fileData } = await reader.read();
  const fileHash = pqCrypto.hash(fileData!);

  // Second pass: encrypt chunks
  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);

    // Read chunk
    const chunkBlob = file.slice(start, end);
    const chunkBuffer = await chunkBlob.arrayBuffer();
    const chunkData = new Uint8Array(chunkBuffer);

    // Hash and encrypt
    const chunkHash = pqCrypto.hash(chunkData);
    const associatedData = new Uint8Array([
      ...new TextEncoder().encode(`chunk:${i}`),
      ...fileHash,
    ]);

    const encrypted = await pqCrypto.encrypt(chunkData, encryptionKey, associatedData);

    yield {
      index: i,
      data: encrypted.ciphertext,
      nonce: encrypted.nonce,
      hash: chunkHash,
    };
  }

  // Return metadata
  return {
    encryptedName: '',
    nameNonce: new Uint8Array(0),
    originalName: '',
    originalSize: file.size,
    mimeCategory: categorizeMimeType(file.type),
    totalChunks,
    fileHash,
    encryptedAt: Date.now(),
  };
}

/**
 * Export for use in transfer manager
 */
export const fileEncryption = {
  encrypt: encryptFile,
  decrypt: decryptFile,
  encryptWithPassword: encryptFileWithPassword,
  decryptWithPassword: decryptFileWithPassword,
  streamEncrypt: encryptFileStream,
};
