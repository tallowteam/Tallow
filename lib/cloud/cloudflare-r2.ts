/**
 * Cloudflare R2 Storage Client
 *
 * S3-compatible object storage client for Cloudflare R2.
 * Used as a FALLBACK transfer mechanism when peer-to-peer (direct or TURN relay)
 * connections fail. Files are always end-to-end encrypted before upload.
 *
 * Transfer flow:
 *   1. Sender encrypts file locally (E2E encryption)
 *   2. Encrypted blob uploads to R2 via S3-compatible API
 *   3. Sender shares presigned download URL with receiver (via signaling)
 *   4. Receiver downloads encrypted blob from R2
 *   5. Receiver decrypts locally
 *   6. File deleted from R2 after successful download
 *
 * Security:
 *   - All files are E2E encrypted BEFORE leaving the sender device
 *   - R2 never sees plaintext content
 *   - Presigned URLs expire after a configurable duration
 *   - Uploaded files auto-expire after 24 hours (lifecycle rule)
 *   - HMAC-SHA256 signing for S3 authentication (AWS Signature V4)
 *
 * SECURITY IMPACT: 7 | PRIVACY IMPACT: 8
 * PRIORITY: HIGH
 */

import secureLog from '../utils/secure-logger';

// ============================================================================
// Type Definitions
// ============================================================================

export interface R2ClientConfig {
  /** Cloudflare account ID */
  accountId: string;
  /** R2 access key ID (S3-compatible) */
  accessKeyId: string;
  /** R2 secret access key (S3-compatible) */
  secretAccessKey: string;
  /** R2 bucket name */
  bucketName: string;
  /** Optional custom endpoint (defaults to Cloudflare R2) */
  endpoint?: string;
  /** Default file expiry in seconds (default: 86400 = 24 hours) */
  defaultExpirySeconds?: number;
}

export interface R2Object {
  /** Object key (path) */
  key: string;
  /** Object size in bytes */
  size: number;
  /** Last modified timestamp */
  lastModified: Date;
  /** ETag for cache validation */
  etag: string;
  /** Custom metadata */
  metadata: Record<string, string>;
}

export interface R2UploadResult {
  /** Object key */
  key: string;
  /** ETag of uploaded object */
  etag: string;
  /** Presigned download URL */
  downloadUrl: string;
  /** URL expiry timestamp */
  expiresAt: number;
}

export interface R2UploadProgress {
  /** Bytes uploaded so far */
  loaded: number;
  /** Total bytes to upload */
  total: number;
  /** Upload percentage (0-100) */
  percentage: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_EXPIRY_SECONDS = 86400; // 24 hours
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour for presigned URLs
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB max
const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100 MB triggers multipart
const PART_SIZE = 10 * 1024 * 1024; // 10 MB parts for multipart upload

// ============================================================================
// AWS Signature V4 Utilities
// ============================================================================

/**
 * Compute HMAC-SHA256 using Web Crypto API
 */
async function hmacSHA256(key: ArrayBuffer | Uint8Array, message: string): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message));
}

/**
 * Compute SHA-256 hash
 */
async function sha256Hash(data: ArrayBuffer | Uint8Array | string): Promise<string> {
  const buffer = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToHex(hash);
}

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get signing key for AWS Signature V4
 */
async function getSigningKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string
): Promise<ArrayBuffer> {
  const kDate = await hmacSHA256(
    new TextEncoder().encode('AWS4' + secretKey),
    dateStamp
  );
  const kRegion = await hmacSHA256(kDate, region);
  const kService = await hmacSHA256(kRegion, service);
  return hmacSHA256(kService, 'aws4_request');
}

/**
 * Create AWS Signature V4 authorization header
 */
async function signRequest(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: ArrayBuffer | Uint8Array | string | null,
  accessKeyId: string,
  secretAccessKey: string,
  region: string = 'auto'
): Promise<Record<string, string>> {
  const service = 's3';
  const now = new Date();
  const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0]!.slice(0, 8);
  const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // Canonical URI (path)
  const canonicalUri = url.pathname;

  // Canonical query string
  const params = Array.from(url.searchParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');

  // Compute payload hash
  const payloadHash = body
    ? await sha256Hash(body instanceof ArrayBuffer ? body : typeof body === 'string' ? body : body)
    : await sha256Hash('');

  // Add required headers
  const signedHeaders: Record<string, string> = {
    ...headers,
    host: url.host,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
  };

  // Canonical headers (sorted, lowercase)
  const headerKeys = Object.keys(signedHeaders).sort();
  const canonicalHeaders = headerKeys
    .map(k => `${k.toLowerCase()}:${signedHeaders[k]!.trim()}`)
    .join('\n') + '\n';

  const signedHeadersStr = headerKeys.map(k => k.toLowerCase()).join(';');

  // Canonical request
  const canonicalRequest = [
    method,
    canonicalUri,
    params,
    canonicalHeaders,
    signedHeadersStr,
    payloadHash,
  ].join('\n');

  // String to sign
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hash(canonicalRequest),
  ].join('\n');

  // Signing key and signature
  const signingKey = await getSigningKey(secretAccessKey, dateStamp, region, service);
  const signatureBuffer = await hmacSHA256(signingKey, stringToSign);
  const signature = arrayBufferToHex(signatureBuffer);

  // Authorization header
  const authorization = [
    `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeadersStr}`,
    `Signature=${signature}`,
  ].join(', ');

  return {
    ...signedHeaders,
    Authorization: authorization,
  };
}

// ============================================================================
// R2 Storage Client
// ============================================================================

export class R2StorageClient {
  private config: Required<R2ClientConfig>;
  private endpoint: string;

  constructor(config: R2ClientConfig) {
    if (!config.accountId || !config.accessKeyId || !config.secretAccessKey || !config.bucketName) {
      throw new Error('R2StorageClient: accountId, accessKeyId, secretAccessKey, and bucketName are required');
    }

    this.config = {
      ...config,
      endpoint: config.endpoint ?? `https://${config.accountId}.r2.cloudflarestorage.com`,
      defaultExpirySeconds: config.defaultExpirySeconds ?? DEFAULT_EXPIRY_SECONDS,
    };

    this.endpoint = this.config.endpoint;

    secureLog.log('[R2] Client initialized', {
      bucket: this.config.bucketName,
      endpoint: this.endpoint,
      defaultExpiry: `${this.config.defaultExpirySeconds}s`,
    });
  }

  // ==========================================================================
  // Core Operations
  // ==========================================================================

  /**
   * Upload an encrypted file to R2
   *
   * IMPORTANT: The data MUST be encrypted before calling this method.
   * This client does not perform encryption -- the caller is responsible
   * for E2E encrypting the payload before upload.
   *
   * @param key - Object key (path in the bucket)
   * @param data - Encrypted file data (Blob or ArrayBuffer)
   * @param metadata - Optional custom metadata headers
   * @param onProgress - Optional progress callback
   * @returns Upload result with presigned download URL
   */
  async uploadFile(
    key: string,
    data: Blob | ArrayBuffer,
    metadata?: Record<string, string>,
    onProgress?: (progress: R2UploadProgress) => void
  ): Promise<R2UploadResult> {
    const dataBuffer = data instanceof Blob
      ? await data.arrayBuffer()
      : data;

    if (dataBuffer.byteLength > MAX_UPLOAD_SIZE) {
      throw new Error(`File too large: ${dataBuffer.byteLength} bytes exceeds ${MAX_UPLOAD_SIZE} byte limit`);
    }

    if (dataBuffer.byteLength === 0) {
      throw new Error('Cannot upload empty file');
    }

    secureLog.log('[R2] Uploading file', {
      key,
      size: dataBuffer.byteLength,
      hasMetadata: !!metadata,
    });

    // Use multipart upload for large files
    if (dataBuffer.byteLength > MULTIPART_THRESHOLD) {
      return this.multipartUpload(key, dataBuffer, metadata, onProgress);
    }

    // Single PUT for smaller files
    return this.singleUpload(key, dataBuffer, metadata, onProgress);
  }

  /**
   * Download an encrypted file from R2
   *
   * The returned Blob contains encrypted data that must be decrypted
   * by the caller after download.
   *
   * @param key - Object key to download
   * @returns Encrypted file data as Blob
   */
  async downloadFile(key: string): Promise<Blob> {
    secureLog.log('[R2] Downloading file', { key });

    const url = new URL(`/${this.config.bucketName}/${encodeURIComponent(key)}`, this.endpoint);

    const headers = await signRequest(
      'GET',
      url,
      { 'content-type': 'application/octet-stream' },
      null,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 download failed (${response.status}): ${errorText}`);
    }

    const blob = await response.blob();

    secureLog.log('[R2] Download complete', {
      key,
      size: blob.size,
    });

    return blob;
  }

  /**
   * Delete a file from R2
   *
   * Called after successful transfer to clean up encrypted data.
   *
   * @param key - Object key to delete
   */
  async deleteFile(key: string): Promise<void> {
    secureLog.log('[R2] Deleting file', { key });

    const url = new URL(`/${this.config.bucketName}/${encodeURIComponent(key)}`, this.endpoint);

    const headers = await signRequest(
      'DELETE',
      url,
      {},
      null,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 delete failed (${response.status}): ${errorText}`);
    }

    secureLog.log('[R2] File deleted', { key });
  }

  /**
   * List files with an optional prefix
   *
   * @param prefix - Optional key prefix to filter by
   * @param maxKeys - Maximum number of keys to return (default 1000)
   * @returns Array of R2 object metadata
   */
  async listFiles(prefix?: string, maxKeys: number = 1000): Promise<R2Object[]> {
    secureLog.log('[R2] Listing files', { prefix, maxKeys });

    const url = new URL(`/${this.config.bucketName}`, this.endpoint);
    url.searchParams.set('list-type', '2');
    url.searchParams.set('max-keys', maxKeys.toString());
    if (prefix) {
      url.searchParams.set('prefix', prefix);
    }

    const headers = await signRequest(
      'GET',
      url,
      { 'content-type': 'application/xml' },
      null,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 list failed (${response.status}): ${errorText}`);
    }

    const xml = await response.text();
    return this.parseListResponse(xml);
  }

  /**
   * Generate a presigned URL for direct download
   *
   * The presigned URL allows the receiver to download directly from R2
   * without needing R2 credentials. The URL is time-limited.
   *
   * @param key - Object key
   * @param expiresIn - Expiry time in seconds (default 3600 = 1 hour)
   * @returns Presigned download URL
   */
  generatePresignedUrl(key: string, expiresIn: number = PRESIGNED_URL_EXPIRY): string {
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0]!.slice(0, 8);
    const amzDate = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const region = 'auto';
    const service = 's3';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

    const url = new URL(
      `/${this.config.bucketName}/${encodeURIComponent(key)}`,
      this.endpoint
    );

    // Presigned URL query parameters (S3-style)
    url.searchParams.set('X-Amz-Algorithm', 'AWS4-HMAC-SHA256');
    url.searchParams.set('X-Amz-Credential', `${this.config.accessKeyId}/${credentialScope}`);
    url.searchParams.set('X-Amz-Date', amzDate);
    url.searchParams.set('X-Amz-Expires', expiresIn.toString());
    url.searchParams.set('X-Amz-SignedHeaders', 'host');

    secureLog.log('[R2] Generated presigned URL', {
      key,
      expiresIn: `${expiresIn}s`,
    });

    return url.toString();
  }

  // ==========================================================================
  // Upload Strategies
  // ==========================================================================

  /**
   * Single PUT upload for files under the multipart threshold
   */
  private async singleUpload(
    key: string,
    data: ArrayBuffer,
    metadata?: Record<string, string>,
    onProgress?: (progress: R2UploadProgress) => void
  ): Promise<R2UploadResult> {
    const url = new URL(`/${this.config.bucketName}/${encodeURIComponent(key)}`, this.endpoint);

    // Build headers with metadata and expiry
    const customHeaders: Record<string, string> = {
      'content-type': 'application/octet-stream',
      'content-length': data.byteLength.toString(),
      // Set expiry via x-amz-meta or R2 lifecycle (lifecycle preferred in production)
      'x-amz-meta-tallow-expiry': (Date.now() + this.config.defaultExpirySeconds * 1000).toString(),
      'x-amz-meta-tallow-encrypted': 'true',
    };

    // Add custom metadata
    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        customHeaders[`x-amz-meta-${k.toLowerCase()}`] = v;
      }
    }

    const headers = await signRequest(
      'PUT',
      url,
      customHeaders,
      data,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    // Report initial progress
    onProgress?.({ loaded: 0, total: data.byteLength, percentage: 0 });

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 upload failed (${response.status}): ${errorText}`);
    }

    // Report completion
    onProgress?.({ loaded: data.byteLength, total: data.byteLength, percentage: 100 });

    const etag = response.headers.get('etag') ?? '';
    const downloadUrl = this.generatePresignedUrl(key);

    secureLog.log('[R2] Upload complete', {
      key,
      size: data.byteLength,
      etag,
    });

    return {
      key,
      etag,
      downloadUrl,
      expiresAt: Date.now() + this.config.defaultExpirySeconds * 1000,
    };
  }

  /**
   * Multipart upload for large files
   *
   * Splits the file into PART_SIZE chunks and uploads them in sequence
   * with progress reporting per part.
   */
  private async multipartUpload(
    key: string,
    data: ArrayBuffer,
    metadata?: Record<string, string>,
    onProgress?: (progress: R2UploadProgress) => void
  ): Promise<R2UploadResult> {
    const totalSize = data.byteLength;
    const partCount = Math.ceil(totalSize / PART_SIZE);

    secureLog.log('[R2] Starting multipart upload', {
      key,
      totalSize,
      partCount,
      partSize: PART_SIZE,
    });

    // Step 1: Initiate multipart upload
    const uploadId = await this.initiateMultipartUpload(key, metadata);

    try {
      // Step 2: Upload parts
      const parts: Array<{ partNumber: number; etag: string }> = [];
      let uploaded = 0;

      for (let i = 0; i < partCount; i++) {
        const start = i * PART_SIZE;
        const end = Math.min(start + PART_SIZE, totalSize);
        const partData = data.slice(start, end);
        const partNumber = i + 1;

        const etag = await this.uploadPart(key, uploadId, partNumber, partData);
        parts.push({ partNumber, etag });

        uploaded += partData.byteLength;
        onProgress?.({
          loaded: uploaded,
          total: totalSize,
          percentage: Math.round((uploaded / totalSize) * 100),
        });
      }

      // Step 3: Complete multipart upload
      const etag = await this.completeMultipartUpload(key, uploadId, parts);

      const downloadUrl = this.generatePresignedUrl(key);

      secureLog.log('[R2] Multipart upload complete', {
        key,
        totalSize,
        parts: parts.length,
      });

      return {
        key,
        etag,
        downloadUrl,
        expiresAt: Date.now() + this.config.defaultExpirySeconds * 1000,
      };
    } catch (error) {
      // Abort multipart upload on failure
      secureLog.error('[R2] Multipart upload failed, aborting', error);
      await this.abortMultipartUpload(key, uploadId).catch(() => {});
      throw error;
    }
  }

  /**
   * Initiate a multipart upload and return the upload ID
   */
  private async initiateMultipartUpload(
    key: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    const url = new URL(
      `/${this.config.bucketName}/${encodeURIComponent(key)}?uploads`,
      this.endpoint
    );

    const customHeaders: Record<string, string> = {
      'content-type': 'application/octet-stream',
      'x-amz-meta-tallow-expiry': (Date.now() + this.config.defaultExpirySeconds * 1000).toString(),
      'x-amz-meta-tallow-encrypted': 'true',
    };

    if (metadata) {
      for (const [k, v] of Object.entries(metadata)) {
        customHeaders[`x-amz-meta-${k.toLowerCase()}`] = v;
      }
    }

    const headers = await signRequest(
      'POST',
      url,
      customHeaders,
      null,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 initiate multipart failed (${response.status}): ${errorText}`);
    }

    const xml = await response.text();
    const uploadIdMatch = xml.match(/<UploadId>(.+?)<\/UploadId>/);
    if (!uploadIdMatch || !uploadIdMatch[1]) {
      throw new Error('Failed to parse upload ID from multipart initiation response');
    }

    return uploadIdMatch[1];
  }

  /**
   * Upload a single part of a multipart upload
   */
  private async uploadPart(
    key: string,
    uploadId: string,
    partNumber: number,
    data: ArrayBuffer
  ): Promise<string> {
    const url = new URL(
      `/${this.config.bucketName}/${encodeURIComponent(key)}`,
      this.endpoint
    );
    url.searchParams.set('partNumber', partNumber.toString());
    url.searchParams.set('uploadId', uploadId);

    const headers = await signRequest(
      'PUT',
      url,
      {
        'content-type': 'application/octet-stream',
        'content-length': data.byteLength.toString(),
      },
      data,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers,
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 upload part ${partNumber} failed (${response.status}): ${errorText}`);
    }

    return response.headers.get('etag') ?? '';
  }

  /**
   * Complete a multipart upload
   */
  private async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: Array<{ partNumber: number; etag: string }>
  ): Promise<string> {
    const url = new URL(
      `/${this.config.bucketName}/${encodeURIComponent(key)}`,
      this.endpoint
    );
    url.searchParams.set('uploadId', uploadId);

    // Build completion XML
    const partsXml = parts
      .map(p => `<Part><PartNumber>${p.partNumber}</PartNumber><ETag>${p.etag}</ETag></Part>`)
      .join('');
    const body = `<CompleteMultipartUpload>${partsXml}</CompleteMultipartUpload>`;

    const headers = await signRequest(
      'POST',
      url,
      { 'content-type': 'application/xml' },
      body,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`R2 complete multipart failed (${response.status}): ${errorText}`);
    }

    const xml = await response.text();
    const etagMatch = xml.match(/<ETag>(.+?)<\/ETag>/);
    return etagMatch?.[1] ?? '';
  }

  /**
   * Abort a multipart upload (cleanup on failure)
   */
  private async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const url = new URL(
      `/${this.config.bucketName}/${encodeURIComponent(key)}`,
      this.endpoint
    );
    url.searchParams.set('uploadId', uploadId);

    const headers = await signRequest(
      'DELETE',
      url,
      {},
      null,
      this.config.accessKeyId,
      this.config.secretAccessKey
    );

    await fetch(url.toString(), {
      method: 'DELETE',
      headers,
    }).catch(() => {});

    secureLog.log('[R2] Multipart upload aborted', { key, uploadId });
  }

  // ==========================================================================
  // XML Parsing
  // ==========================================================================

  /**
   * Parse S3 ListObjectsV2 XML response
   */
  private parseListResponse(xml: string): R2Object[] {
    const objects: R2Object[] = [];

    // Match each <Contents> block
    const contentsRegex = /<Contents>([\s\S]*?)<\/Contents>/g;
    let match: RegExpExecArray | null;

    while ((match = contentsRegex.exec(xml)) !== null) {
      const content = match[1] ?? '';

      const key = this.extractXmlValue(content, 'Key');
      const size = this.extractXmlValue(content, 'Size');
      const lastModified = this.extractXmlValue(content, 'LastModified');
      const etag = this.extractXmlValue(content, 'ETag');

      if (key) {
        objects.push({
          key,
          size: size ? parseInt(size, 10) : 0,
          lastModified: lastModified ? new Date(lastModified) : new Date(),
          etag: etag ?? '',
          metadata: {},
        });
      }
    }

    return objects;
  }

  /**
   * Extract a value from an XML tag
   */
  private extractXmlValue(xml: string, tag: string): string | null {
    const regex = new RegExp(`<${tag}>(.+?)</${tag}>`);
    const match = regex.exec(xml);
    return match?.[1] ?? null;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if the R2 client is configured and ready
   */
  isConfigured(): boolean {
    return !!(
      this.config.accountId &&
      this.config.accessKeyId &&
      this.config.secretAccessKey &&
      this.config.bucketName
    );
  }

  /**
   * Get the bucket name
   */
  getBucketName(): string {
    return this.config.bucketName;
  }

  /**
   * Get the endpoint URL
   */
  getEndpoint(): string {
    return this.endpoint;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

let clientInstance: R2StorageClient | null = null;

/**
 * Get or create the R2 storage client singleton
 *
 * Reads configuration from environment variables:
 *   - CLOUDFLARE_ACCOUNT_ID
 *   - CLOUDFLARE_R2_ACCESS_KEY_ID
 *   - CLOUDFLARE_R2_SECRET_ACCESS_KEY
 *   - CLOUDFLARE_R2_BUCKET_NAME
 *   - CLOUDFLARE_R2_ENDPOINT (optional)
 */
export function getR2Client(): R2StorageClient | null {
  if (clientInstance) {
    return clientInstance;
  }

  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID'];
  const accessKeyId = process.env['CLOUDFLARE_R2_ACCESS_KEY_ID'];
  const secretAccessKey = process.env['CLOUDFLARE_R2_SECRET_ACCESS_KEY'];
  const bucketName = process.env['CLOUDFLARE_R2_BUCKET_NAME'];

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    secureLog.warn('[R2] R2 storage not configured. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME environment variables.');
    return null;
  }

  const endpoint = process.env['CLOUDFLARE_R2_ENDPOINT'];
  clientInstance = new R2StorageClient({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    ...(endpoint ? { endpoint } : {}),
  });

  return clientInstance;
}

/**
 * Check if R2 cloud fallback is available
 */
export function isR2Available(): boolean {
  return getR2Client() !== null;
}

export default R2StorageClient;
