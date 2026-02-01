/**
 * Shared Type Definitions for Tallow
 *
 * This module contains common type definitions used across the application,
 * including discriminated unions for error handling, status types, and
 * shared data structures with strict null safety.
 *
 * @module types/shared
 */

// ============================================================================
// Result Types (Discriminated Unions for Error Handling)
// ============================================================================

/**
 * Generic Result type for operations that can succeed or fail
 *
 * @template T - The success value type
 * @template E - The error type (defaults to Error)
 *
 * @example
 * ```typescript
 * function validateFile(file: File): Result<ValidatedFile> {
 *   if (file.size === 0) {
 *     return { success: false, error: new Error('Empty file') };
 *   }
 *   return { success: true, data: { file, validated: true } };
 * }
 * ```
 */
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; error: E; data?: never };

/**
 * Async Result type for async operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Option type for values that may or may not exist
 */
export type Option<T> = T | null;

// ============================================================================
// PQC (Post-Quantum Cryptography) Types
// ============================================================================

/**
 * Post-Quantum Cryptography status
 */
export type PQCStatus =
  | 'initializing'
  | 'key-generation'
  | 'key-exchange'
  | 'session-ready'
  | 'encrypting'
  | 'decrypting'
  | 'error'
  | 'destroyed';

/**
 * PQC key exchange version
 */
export type PQCVersion = 1 | 2 | 3;

/**
 * Encryption metadata for file transfers
 *
 * Contains information about the encryption applied to a file,
 * including algorithm details, key derivation, and integrity checks.
 */
export interface EncryptionMetadata {
  /** Encryption algorithm used */
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'Hybrid';
  /** Key exchange method */
  keyExchange: 'ML-KEM-768' | 'Kyber-1024' | 'X25519' | 'Hybrid';
  /** Initialization vector (Base64 encoded) */
  iv: string;
  /** Authentication tag for AEAD (Base64 encoded) */
  authTag: string;
  /** Key derivation function used */
  kdf: 'HKDF-SHA256' | 'HKDF-SHA512' | 'Argon2id';
  /** Salt for key derivation (Base64 encoded) */
  salt: string;
  /** File integrity hash (SHA-256, hex encoded) */
  fileHash: string;
  /** Metadata version for future compatibility */
  version: number;
  /** Timestamp of encryption */
  timestamp: number;
  /** Optional: Password protection indicator */
  passwordProtected?: boolean;
}

/**
 * PQC session information
 */
export interface PQCSessionInfo {
  /** Unique session identifier */
  sessionId: string;
  /** Current session status */
  status: PQCStatus;
  /** PQC protocol version */
  version: PQCVersion;
  /** Session creation timestamp */
  createdAt: number;
  /** Session expiration timestamp */
  expiresAt: number;
  /** Number of messages encrypted in this session */
  messageCount: number;
  /** Whether session keys are established */
  keysEstablished: boolean;
  /** Encryption metadata */
  encryptionMetadata?: EncryptionMetadata;
}

// ============================================================================
// Transfer Status Types
// ============================================================================

/**
 * Transfer status with detailed states
 */
export type TransferStatus =
  | 'pending'
  | 'initializing'
  | 'connecting'
  | 'key-exchange'
  | 'transferring'
  | 'paused'
  | 'resuming'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Connection quality indicator
 */
export type ConnectionQuality =
  | 'excellent'  // >10 Mbps, <50ms latency
  | 'good'       // 1-10 Mbps, 50-100ms latency
  | 'fair'       // 100Kbps-1Mbps, 100-200ms latency
  | 'poor'       // <100Kbps, >200ms latency
  | 'disconnected';

/**
 * Network transport type
 */
export type NetworkTransport =
  | 'webrtc-direct'
  | 'webrtc-relay'
  | 'websocket'
  | 'http'
  | 'onion-routing';

// ============================================================================
// Error Types (Discriminated Unions)
// ============================================================================

/**
 * Base error type for all application errors
 */
export interface BaseError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Timestamp of error occurrence */
  timestamp: number;
  /** Optional error details */
  details?: Record<string, unknown>;
  /** Optional recovery suggestions */
  recovery?: string;
}

/**
 * Network-related errors
 */
export interface NetworkError extends BaseError {
  type: 'network';
  code: 'CONNECTION_FAILED' | 'TIMEOUT' | 'SIGNALING_ERROR' | 'PEER_DISCONNECTED' | 'ICE_FAILED';
  /** Network transport that failed */
  transport?: NetworkTransport;
  /** Retry count if applicable */
  retryCount?: number;
}

/**
 * Cryptography-related errors
 */
export interface CryptoError extends BaseError {
  type: 'crypto';
  code:
    | 'KEY_GENERATION_FAILED'
    | 'ENCRYPTION_FAILED'
    | 'DECRYPTION_FAILED'
    | 'INVALID_KEY'
    | 'KEY_EXCHANGE_FAILED'
    | 'SIGNATURE_VERIFICATION_FAILED';
  /** Algorithm that failed */
  algorithm?: string;
}

/**
 * Validation-related errors
 */
export interface ValidationError extends BaseError {
  type: 'validation';
  code:
    | 'INVALID_FILE'
    | 'FILE_TOO_LARGE'
    | 'UNSUPPORTED_FILE_TYPE'
    | 'EMPTY_FILE'
    | 'INVALID_RECIPIENT'
    | 'INVALID_INPUT';
  /** Field that failed validation */
  field?: string;
  /** Actual value that failed */
  value?: unknown;
  /** Expected value or constraint */
  expected?: unknown;
}

/**
 * Transfer-related errors
 */
export interface TransferError extends BaseError {
  type: 'transfer';
  code:
    | 'TRANSFER_FAILED'
    | 'TRANSFER_CANCELLED'
    | 'TRANSFER_TIMEOUT'
    | 'INTEGRITY_CHECK_FAILED'
    | 'RECIPIENT_UNAVAILABLE';
  /** Transfer ID if applicable */
  transferId?: string;
  /** Progress at time of error (0-100) */
  progress?: number;
}

/**
 * Storage-related errors
 */
export interface StorageError extends BaseError {
  type: 'storage';
  code:
    | 'QUOTA_EXCEEDED'
    | 'READ_FAILED'
    | 'WRITE_FAILED'
    | 'NOT_FOUND'
    | 'PERMISSION_DENIED';
  /** Storage key if applicable */
  key?: string;
}

/**
 * Discriminated union of all error types
 */
export type AppError =
  | NetworkError
  | CryptoError
  | ValidationError
  | TransferError
  | StorageError;

/**
 * Type guard to check if error is a specific type
 */
export function isNetworkError(error: AppError): error is NetworkError {
  return error.type === 'network';
}

export function isCryptoError(error: AppError): error is CryptoError {
  return error.type === 'crypto';
}

export function isValidationError(error: AppError): error is ValidationError {
  return error.type === 'validation';
}

export function isTransferError(error: AppError): error is TransferError {
  return error.type === 'transfer';
}

export function isStorageError(error: AppError): error is StorageError {
  return error.type === 'storage';
}

// ============================================================================
// WebRTC Types
// ============================================================================

/**
 * WebRTC signaling data with strict typing
 */
export interface SignalingData {
  /** Signal type */
  type: 'offer' | 'answer' | 'candidate' | 'pqc-public-key' | 'pqc-ciphertext';
  /** Sender socket ID */
  from: string;
  /** Target socket ID */
  to: string;
  /** Signal payload */
  payload: RTCSessionDescriptionInit | RTCIceCandidateInit | PQCKeyData;
  /** Timestamp */
  timestamp: number;
}

/**
 * PQC key exchange data
 */
export interface PQCKeyData {
  /** Public key (hex encoded) */
  publicKey: string;
  /** PQC version */
  version: PQCVersion;
  /** Optional ciphertext for encapsulation */
  ciphertext?: Uint8Array;
}

/**
 * Data channel configuration
 */
export interface DataChannelConfig {
  /** Channel label */
  label: string;
  /** Whether channel is ordered */
  ordered: boolean;
  /** Maximum retransmits (for unordered channels) */
  maxRetransmits?: number;
  /** Maximum packet lifetime in ms (for unordered channels) */
  maxPacketLifeTime?: number;
  /** Protocol identifier */
  protocol?: string;
}

// ============================================================================
// File Transfer Types
// ============================================================================

/**
 * File metadata with complete type safety
 */
export interface FileMetadata {
  /** Unique file identifier */
  id: string;
  /** Original filename */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  type: string;
  /** Last modified timestamp */
  lastModified: number;
  /** File hash (SHA-256, hex encoded) */
  hash?: string;
  /** Optional thumbnail (data URL) */
  thumbnail?: string;
  /** Optional file path (for folders) */
  path?: string;
}

/**
 * Transfer progress information
 */
export interface TransferProgress {
  /** Transfer ID */
  transferId: string;
  /** Current status */
  status: TransferStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Bytes transferred */
  bytesTransferred: number;
  /** Total bytes */
  totalBytes: number;
  /** Transfer speed in bytes/second */
  speed: number;
  /** Estimated time remaining in seconds */
  eta: number | null;
  /** Connection quality */
  quality: ConnectionQuality;
  /** Start timestamp */
  startTime: number;
  /** End timestamp (if completed/failed) */
  endTime?: number;
}

/**
 * Recipient status for group transfers
 */
export interface RecipientStatus {
  /** Recipient ID */
  id: string;
  /** Recipient name */
  name: string;
  /** Transfer status */
  status: TransferStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Transfer speed in bytes/second */
  speed: number;
  /** Connection quality */
  quality: ConnectionQuality;
  /** Error if failed */
  error?: AppError;
  /** Start timestamp */
  startTime?: number;
  /** End timestamp */
  endTime?: number;
}

// ============================================================================
// Privacy & Security Types
// ============================================================================

/**
 * Privacy level for transfers
 */
export type PrivacyLevel =
  | 'standard'    // Basic encryption
  | 'enhanced'    // PQC encryption
  | 'maximum'     // PQC + Onion routing
  | 'paranoid';   // Maximum privacy + metadata stripping

/**
 * Metadata stripping options
 */
export interface MetadataStripOptions {
  /** Strip GPS location data */
  stripGPS: boolean;
  /** Strip camera/device information */
  stripDeviceInfo: boolean;
  /** Strip timestamps */
  stripTimestamps: boolean;
  /** Strip author/copyright information */
  stripAuthorInfo: boolean;
  /** Whether to show preview before stripping */
  showPreview: boolean;
}

/**
 * Privacy settings for transfers
 */
export interface PrivacySettings {
  /** Privacy level */
  level: PrivacyLevel;
  /** Enable post-quantum cryptography */
  enablePQC: boolean;
  /** Enable onion routing */
  enableOnionRouting: boolean;
  /** Strip metadata from files */
  stripMetadata: boolean;
  /** Metadata stripping options */
  metadataOptions?: MetadataStripOptions;
  /** Enable secure deletion after transfer */
  enableSecureDeletion: boolean;
  /** Number of onion layers (1-3) */
  onionLayers?: 1 | 2 | 3;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties required and non-nullable
 */
export type Strict<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

/**
 * Make specific properties required
 */
export type WithRequired<T, K extends keyof T> = T & {
  [P in K]-?: NonNullable<T[P]>;
};

/**
 * Make specific properties optional
 */
export type WithOptional<T, K extends keyof T> = Omit<T, K> & {
  [P in K]?: T[P];
};

/**
 * Extract non-null values from union
 */
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly type
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Type-safe event emitter event map
 */
export type EventMap = Record<string, unknown[]>;

/**
 * Extract event names from event map
 */
export type EventNames<T extends EventMap> = keyof T & string;

/**
 * Extract event args from event map
 */
export type EventArgs<T extends EventMap, K extends EventNames<T>> = T[K];

// ============================================================================
// Branded Types (for type safety)
// ============================================================================

/**
 * Brand type for creating nominal types
 */
declare const brand: unique symbol;

export type Brand<T, B> = T & { [brand]: B };

/**
 * Branded string types for type safety
 */
export type SessionId = Brand<string, 'SessionId'>;
export type TransferId = Brand<string, 'TransferId'>;
export type PeerId = Brand<string, 'PeerId'>;
export type DeviceId = Brand<string, 'DeviceId'>;
export type RoomCode = Brand<string, 'RoomCode'>;
export type FileHash = Brand<string, 'FileHash'>;

/**
 * Helper to create branded strings
 */
export function createSessionId(id: string): SessionId {
  return id as SessionId;
}

export function createTransferId(id: string): TransferId {
  return id as TransferId;
}

export function createPeerId(id: string): PeerId {
  return id as PeerId;
}

export function createDeviceId(id: string): DeviceId {
  return id as DeviceId;
}

export function createRoomCode(code: string): RoomCode {
  return code as RoomCode;
}

export function createFileHash(hash: string): FileHash {
  return hash as FileHash;
}

// ============================================================================
// Callback Types
// ============================================================================

/**
 * Standard callback type with no arguments
 */
export type Callback = () => void;

/**
 * Callback with single argument
 */
export type CallbackWithArg<T> = (arg: T) => void;

/**
 * Async callback
 */
export type AsyncCallback = () => Promise<void>;

/**
 * Async callback with argument
 */
export type AsyncCallbackWithArg<T> = (arg: T) => Promise<void>;

/**
 * Error callback
 */
export type ErrorCallback = (error: AppError) => void;

/**
 * Progress callback
 */
export type ProgressCallback = (progress: TransferProgress) => void;

/**
 * Status change callback
 */
export type StatusChangeCallback<T> = (oldStatus: T, newStatus: T) => void;
