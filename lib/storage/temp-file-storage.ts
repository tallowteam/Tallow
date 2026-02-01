/**
 * Temporary File Storage Service
 * Handles encrypted file uploads for email fallback transfers
 * Files are stored encrypted in S3 (with localStorage fallback) and automatically expire
 */

import { S3Client, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { pqCrypto } from '../crypto/pqc-crypto';
import { encryptFile, type EncryptedFile } from '../crypto/file-encryption-pqc';
import secureLog from '../utils/secure-logger';
import { secureDeleteLocalStorage, type DeletionMode } from '../privacy/secure-deletion';

// AWS S3 Configuration
const AWS_REGION = process.env['AWS_REGION'] || 'us-east-1';
const AWS_S3_BUCKET = process.env['AWS_S3_BUCKET'] || '';
const AWS_ACCESS_KEY_ID = process.env['AWS_ACCESS_KEY_ID'] || '';
const AWS_SECRET_ACCESS_KEY = process.env['AWS_SECRET_ACCESS_KEY'] || '';

// Check if S3 is properly configured
const isS3Configured = !!(AWS_S3_BUCKET && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY);

// Initialize S3 Client (only if configured)
let s3Client: S3Client | null = null;
if (isS3Configured && typeof window === 'undefined') {
  try {
    s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
    });
    secureLog.log('[TempStorage] S3 client initialized successfully');
  } catch (error) {
    secureLog.error('[TempStorage] Failed to initialize S3 client:', error);
  }
}

export interface StoredFile {
  fileId: string;
  encryptedData: string; // Base64 encoded encrypted file
  metadata: {
    encryptedName: string;
    nameNonce: string;
    originalSize: number;
    mimeCategory: string;
    uploadedAt: number;
    expiresAt: number;
  };
  downloadToken: string;
  downloadCount: number;
  maxDownloads: number;
}

export interface UploadOptions {
  expirationHours?: number; // Default: 24 hours
  maxDownloads?: number; // Default: 1 (one-time download)
}

const STORAGE_KEY_PREFIX = 'tallow_temp_file_';
const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER; // No size limit - unlimited
const DEFAULT_EXPIRATION_HOURS = 24;
const DEFAULT_MAX_DOWNLOADS = 1;

/**
 * Generate cryptographically secure random token
 */
function generateSecureToken(length: number = 32): string {
  const bytes = pqCrypto.randomBytes(length);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate unique file ID
 */
function generateFileId(): string {
  return `${Date.now()}-${generateSecureToken(16)}`;
}

/**
 * Upload file to S3
 */
async function uploadToS3(
  key: string,
  data: Buffer,
  metadata: Record<string, string>
): Promise<void> {
  if (!s3Client || !AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: AWS_S3_BUCKET,
        Key: key,
        Body: data,
        ContentType: 'application/octet-stream',
        Metadata: metadata,
        ServerSideEncryption: 'AES256',
      },
    });

    await upload.done();
    secureLog.log(`[TempStorage] Uploaded to S3: ${key}`);
  } catch (error) {
    secureLog.error('[TempStorage] S3 upload failed:', error);
    throw new Error('Failed to upload to S3');
  }
}

/**
 * Download file from S3
 */
async function downloadFromS3(key: string): Promise<{ data: Buffer; metadata: Record<string, string> }> {
  if (!s3Client || !AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new GetObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error('Empty response from S3');
    }

    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const stream = response.Body as any;

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const data = Buffer.concat(chunks);
    const metadata = response.Metadata || {};

    secureLog.log(`[TempStorage] Downloaded from S3: ${key}`);
    return { data, metadata };
  } catch (error) {
    secureLog.error('[TempStorage] S3 download failed:', error);
    throw new Error('Failed to download from S3');
  }
}

/**
 * Delete file from S3
 */
async function deleteFromS3(key: string): Promise<void> {
  if (!s3Client || !AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: key,
    });

    await s3Client.send(command);
    secureLog.log(`[TempStorage] Deleted from S3: ${key}`);
  } catch (error) {
    secureLog.error('[TempStorage] S3 delete failed:', error);
    throw new Error('Failed to delete from S3');
  }
}

/**
 * List files in S3 with prefix
 */
async function listS3Files(prefix: string): Promise<Array<{ key: string; lastModified?: Date }>> {
  if (!s3Client || !AWS_S3_BUCKET) {
    throw new Error('S3 not configured');
  }

  try {
    const command = new ListObjectsV2Command({
      Bucket: AWS_S3_BUCKET,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    const files = (response.Contents || []).map(obj => {
      const lastModified = obj.LastModified;
      return {
        key: obj.Key || '',
        ...(lastModified ? { lastModified } : {}),
      };
    });

    return files.filter(f => f.key);
  } catch (error) {
    secureLog.error('[TempStorage] S3 list failed:', error);
    throw new Error('Failed to list S3 files');
  }
}

/**
 * Upload encrypted file to temporary storage (S3 or localStorage fallback)
 */
export async function uploadTempFile(
  file: File,
  encryptionKey: Uint8Array,
  options: UploadOptions = {}
): Promise<{ fileId: string; downloadToken: string; expiresAt: number }> {
  // Validate file size
  if (file.size === 0) {
    throw new Error('Cannot upload empty file');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  const expirationHours = options.expirationHours || DEFAULT_EXPIRATION_HOURS;
  const maxDownloads = options.maxDownloads || DEFAULT_MAX_DOWNLOADS;

  // Validate expiration
  if (expirationHours < 1 || expirationHours > 720) { // Max 30 days
    throw new Error('Expiration must be between 1 and 720 hours');
  }

  try {
    // Encrypt file
    secureLog.log('[TempStorage] Encrypting file:', file.name);
    const encrypted = await encryptFile(file, encryptionKey);

    // Serialize encrypted file to JSON
    const serialized = {
      metadata: {
        ...encrypted.metadata,
        nameNonce: Array.from(encrypted.metadata.nameNonce),
        fileHash: Array.from(encrypted.metadata.fileHash),
      },
      chunks: encrypted.chunks.map(chunk => ({
        index: chunk.index,
        data: Array.from(chunk.data),
        nonce: Array.from(chunk.nonce),
        hash: Array.from(chunk.hash),
      })),
    };

    // Convert to base64 for storage
    const encryptedData = btoa(JSON.stringify(serialized));

    // Generate IDs and tokens
    const fileId = generateFileId();
    const downloadToken = generateSecureToken(32);
    const uploadedAt = Date.now();
    const expiresAt = uploadedAt + (expirationHours * 60 * 60 * 1000);

    // Store file metadata
    const storedFile: StoredFile = {
      fileId,
      encryptedData,
      metadata: {
        encryptedName: encrypted.metadata.encryptedName,
        nameNonce: btoa(String.fromCharCode(...encrypted.metadata.nameNonce)),
        originalSize: encrypted.metadata.originalSize,
        mimeCategory: encrypted.metadata.mimeCategory,
        uploadedAt,
        expiresAt,
      },
      downloadToken,
      downloadCount: 0,
      maxDownloads,
    };

    // Try S3 first (server-side only), fallback to localStorage
    if (typeof window === 'undefined' && s3Client) {
      try {
        // Upload encrypted data to S3
        const s3Key = `temp-files/${fileId}`;
        const dataBuffer = Buffer.from(encryptedData, 'base64');

        await uploadToS3(s3Key, dataBuffer, {
          'file-id': fileId,
          'download-token': downloadToken,
          'expires-at': expiresAt.toString(),
          'encrypted-name': encrypted.metadata.encryptedName,
          'original-size': encrypted.metadata.originalSize.toString(),
          'mime-category': encrypted.metadata.mimeCategory,
          'max-downloads': maxDownloads.toString(),
        });

        secureLog.log('[TempStorage] File stored in S3:', fileId);
      } catch (s3Error) {
        secureLog.warn('[TempStorage] S3 upload failed, using localStorage fallback:', s3Error);

        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
          localStorage.setItem(storageKey, JSON.stringify(storedFile));
          secureLog.log('[TempStorage] File stored in localStorage:', fileId);
        }
      }
    } else {
      // Client-side or S3 not configured: use localStorage
      if (typeof window !== 'undefined') {
        const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
        localStorage.setItem(storageKey, JSON.stringify(storedFile));
        secureLog.log('[TempStorage] File stored in localStorage:', fileId);
      }
    }

    return {
      fileId,
      downloadToken,
      expiresAt,
    };
  } catch (error) {
    secureLog.error('[TempStorage] Upload failed:', error);
    throw new Error('Failed to upload file');
  }
}

/**
 * Retrieve file with download token (from S3 or localStorage fallback)
 */
export async function downloadTempFile(
  fileId: string,
  downloadToken: string
): Promise<{ encryptedFile: EncryptedFile; metadata: StoredFile['metadata'] }> {
  let storedFile: StoredFile | null = null;
  let isFromS3 = false;

  // Try S3 first (server-side only)
  if (typeof window === 'undefined' && s3Client) {
    try {
      const s3Key = `temp-files/${fileId}`;
      const { data, metadata: s3Metadata } = await downloadFromS3(s3Key);

      // Reconstruct StoredFile from S3 data
      storedFile = {
        fileId,
        encryptedData: data.toString('base64'),
        metadata: {
          encryptedName: s3Metadata['encrypted-name'] || '',
          nameNonce: s3Metadata['name-nonce'] || '',
          originalSize: parseInt(s3Metadata['original-size'] || '0'),
          mimeCategory: s3Metadata['mime-category'] || 'application/octet-stream',
          uploadedAt: parseInt(s3Metadata['uploaded-at'] || '0'),
          expiresAt: parseInt(s3Metadata['expires-at'] || '0'),
        },
        downloadToken: s3Metadata['download-token'] || '',
        downloadCount: parseInt(s3Metadata['download-count'] || '0'),
        maxDownloads: parseInt(s3Metadata['max-downloads'] || '1'),
      };

      isFromS3 = true;
      secureLog.log('[TempStorage] Retrieved file from S3:', fileId);
    } catch (s3Error) {
      secureLog.warn('[TempStorage] S3 download failed, trying localStorage:', s3Error);
    }
  }

  // Fallback to localStorage
  if (!storedFile) {
    if (typeof window === 'undefined') {
      throw new Error('File not found');
    }

    const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
    const storedData = localStorage.getItem(storageKey);

    if (!storedData) {
      throw new Error('File not found or expired');
    }

    storedFile = JSON.parse(storedData);
    secureLog.log('[TempStorage] Retrieved file from localStorage:', fileId);
  }

  // Verify storedFile exists
  if (!storedFile) {
    throw new Error('File not found');
  }

  // Verify token (constant-time comparison)
  if (storedFile.downloadToken.length !== downloadToken.length) {
    throw new Error('Invalid download token');
  }

  let isValid = true;
  for (let i = 0; i < storedFile.downloadToken.length; i++) {
    if (storedFile.downloadToken[i] !== downloadToken[i]) {
      isValid = false;
    }
  }

  if (!isValid) {
    throw new Error('Invalid download token');
  }

  // Check expiration
  if (Date.now() > storedFile.metadata.expiresAt) {
    if (isFromS3) {
      await deleteFromS3(`temp-files/${fileId}`);
    } else if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
      secureDeleteLocalStorage(storageKey, { mode: 'standard' });
    }
    throw new Error('File has expired');
  }

  // Check download limit
  if (storedFile.downloadCount >= storedFile.maxDownloads) {
    if (isFromS3) {
      await deleteFromS3(`temp-files/${fileId}`);
    } else if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
      secureDeleteLocalStorage(storageKey, { mode: 'standard' });
    }
    throw new Error('Download limit reached');
  }

  // Increment download count
  storedFile.downloadCount++;

  // Update or remove based on download count
  if (storedFile.downloadCount >= storedFile.maxDownloads) {
    if (isFromS3) {
      await deleteFromS3(`temp-files/${fileId}`);
      secureLog.log('[TempStorage] File deleted from S3 after final download:', fileId);
    } else if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
      secureDeleteLocalStorage(storageKey, { mode: 'standard' });
      secureLog.log('[TempStorage] File securely deleted after final download:', fileId);
    }
  } else {
    // Update download count in storage
    if (isFromS3) {
      // Re-upload with updated metadata
      const s3Key = `temp-files/${fileId}`;
      const dataBuffer = Buffer.from(storedFile.encryptedData, 'base64');
      await uploadToS3(s3Key, dataBuffer, {
        'file-id': fileId,
        'download-token': storedFile.downloadToken,
        'expires-at': storedFile.metadata.expiresAt.toString(),
        'encrypted-name': storedFile.metadata.encryptedName,
        'original-size': storedFile.metadata.originalSize.toString(),
        'mime-category': storedFile.metadata.mimeCategory,
        'max-downloads': storedFile.maxDownloads.toString(),
        'download-count': storedFile.downloadCount.toString(),
      });
    } else if (typeof window !== 'undefined') {
      const storageKey = `${STORAGE_KEY_PREFIX}${fileId}`;
      localStorage.setItem(storageKey, JSON.stringify(storedFile));
    }
  }

  // Deserialize encrypted file
  const encryptedData = JSON.parse(atob(storedFile.encryptedData));

  const encryptedFile: EncryptedFile = {
    metadata: {
      ...encryptedData.metadata,
      nameNonce: new Uint8Array(encryptedData.metadata.nameNonce),
      fileHash: new Uint8Array(encryptedData.metadata.fileHash),
    },
    chunks: encryptedData.chunks.map((chunk: any) => ({
      index: chunk.index,
      data: new Uint8Array(chunk.data),
      nonce: new Uint8Array(chunk.nonce),
      hash: new Uint8Array(chunk.hash),
    })),
  };

  return {
    encryptedFile,
    metadata: storedFile.metadata,
  };
}

/**
 * Clean up expired files from S3 (run periodically - server-side only)
 */
export async function cleanupExpiredFilesS3(): Promise<number> {
  if (typeof window !== 'undefined' || !s3Client) {
    return 0;
  }

  try {
    const now = Date.now();
    const files = await listS3Files('temp-files/');
    let deletedCount = 0;

    for (const file of files) {
      try {
        // Download to check expiration
        const { metadata } = await downloadFromS3(file.key);
        const expiresAt = parseInt(metadata['expires-at'] || '0');

        if (now > expiresAt) {
          await deleteFromS3(file.key);
          deletedCount++;
        }
      } catch (error) {
        secureLog.warn(`[TempStorage] Failed to check/delete ${file.key}:`, error);
      }
    }

    if (deletedCount > 0) {
      secureLog.log(`[TempStorage] Cleaned up ${deletedCount} expired files from S3`);
    }

    return deletedCount;
  } catch (error) {
    secureLog.error('[TempStorage] S3 cleanup failed:', error);
    return 0;
  }
}

/**
 * Clean up expired files from localStorage (run periodically - client-side)
 */
export function cleanupExpiredFiles(deletionMode: DeletionMode = 'quick'): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  const now = Date.now();
  const keysToDelete: string[] = [];

  // First pass: collect all keys to delete (don't modify localStorage during iteration)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const storedFile: StoredFile = JSON.parse(storedData);
          if (now > storedFile.metadata.expiresAt) {
            keysToDelete.push(key);
          }
        }
      } catch (_error) {
        // Invalid data, mark for deletion
        keysToDelete.push(key);
      }
    }
  }

  // Second pass: delete all collected keys
  for (const key of keysToDelete) {
    secureDeleteLocalStorage(key, { mode: deletionMode });
  }

  if (keysToDelete.length > 0) {
    secureLog.log(`[TempStorage] Securely cleaned up ${keysToDelete.length} expired files (${deletionMode} mode)`);
  }

  return keysToDelete.length;
}

/**
 * Get storage statistics
 */
export function getStorageStats(): {
  totalFiles: number;
  totalSize: number;
  expiredFiles: number;
} {
  if (typeof window === 'undefined') {
    return { totalFiles: 0, totalSize: 0, expiredFiles: 0 };
  }

  const now = Date.now();
  let totalFiles = 0;
  let totalSize = 0;
  let expiredFiles = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
      try {
        const storedData = localStorage.getItem(key);
        if (storedData) {
          const storedFile: StoredFile = JSON.parse(storedData);
          totalFiles++;
          totalSize += storedFile.metadata.originalSize;

          if (now > storedFile.metadata.expiresAt) {
            expiredFiles++;
          }
        }
      } catch {
        // Ignore invalid entries
      }
    }
  }

  return { totalFiles, totalSize, expiredFiles };
}

// Auto-cleanup on initialization (client-side only)
if (typeof window !== 'undefined') {
  // Run cleanup on page load
  cleanupExpiredFiles();

  // Run cleanup every hour
  setInterval(() => {
    cleanupExpiredFiles();
  }, 60 * 60 * 1000);
}
