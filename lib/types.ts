/**
 * Core types for the Tallow application
 *
 * This module contains the primary type definitions used throughout the app.
 * All types use strict null checking and avoid 'any' types.
 *
 * @module types
 */

import type {
  TransferStatus,
  ConnectionQuality,
  EncryptionMetadata,
  AppError,
} from './types/shared';

// ============================================================================
// Device Types
// ============================================================================

/**
 * Platform identifier for device types
 */
export type Platform = 'windows' | 'macos' | 'linux' | 'android' | 'ios' | 'web';

/**
 * Device information
 *
 * Represents a connected device in the network with its current state
 * and connection details.
 */
export interface Device {
  /** Unique device identifier */
  id: string;
  /** User-friendly device name */
  name: string;
  /** Operating system platform */
  platform: Platform;
  /** IP address (if available) */
  ip: string | null;
  /** Port number (if available) */
  port: number | null;
  /** Whether device is currently online */
  isOnline: boolean;
  /** Whether device is marked as favorite */
  isFavorite: boolean;
  /** Last seen timestamp */
  lastSeen: number;
  /** Avatar URL or data URI */
  avatar: string | null;
}

// ============================================================================
// File Types
// ============================================================================

/**
 * File information
 *
 * Extended metadata about files being transferred.
 */
export interface FileInfo {
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
  hash: string;
  /** Optional preview thumbnail */
  thumbnail: string | null;
  /** Optional file path for nested structures */
  path: string | null;
}

// ============================================================================
// Transfer Types
// ============================================================================

/**
 * Transfer direction
 */
export type TransferDirection = 'send' | 'receive';

/**
 * File transfer information
 *
 * Represents an active or completed file transfer between devices.
 */
export interface Transfer {
  /** Unique transfer identifier */
  id: string;
  /** Files being transferred */
  files: FileInfo[];
  /** Source device */
  from: Device;
  /** Destination device */
  to: Device;
  /** Current transfer status */
  status: TransferStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Transfer speed in bytes per second */
  speed: number;
  /** Transfer start timestamp */
  startTime: number | null;
  /** Transfer end timestamp */
  endTime: number | null;
  /** Error details if transfer failed */
  error: AppError | null;
  /** Transfer direction */
  direction: TransferDirection;
  /** Total size in bytes */
  totalSize: number;
  /** Bytes transferred so far */
  transferredSize: number;
  /** Estimated time remaining in seconds */
  eta: number | null;
  /** Connection quality */
  quality: ConnectionQuality;
  /** Encryption metadata if encrypted */
  encryptionMetadata: EncryptionMetadata | null;
}

/**
 * Transfer configuration options
 */
export interface TransferOptions {
  /** Enable encryption */
  encryption: boolean;
  /** Enable compression */
  compression: boolean;
  /** Overwrite existing files */
  overwrite: boolean;
  /** Auto-accept transfers */
  autoAccept: boolean;
  /** Maximum chunk size in bytes */
  maxChunkSize: number;
  /** Enable post-quantum cryptography */
  enablePQC: boolean;
  /** Strip metadata from files */
  stripMetadata: boolean;
}

/**
 * Connection ticket for P2P setup
 *
 * Contains WebRTC signaling information for establishing connections.
 */
export interface ConnectionTicket {
  /** Unique ticket identifier */
  id: string;
  /** Peer device identifier */
  peerId: string;
  /** WebRTC signaling data */
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  /** Ticket expiration timestamp */
  expires: number;
  /** Optional password protection */
  password: string | null;
}

/**
 * Transfer chunk data
 *
 * Represents a single chunk of data being transferred.
 */
export interface TransferChunk {
  /** Associated transfer ID */
  transferId: string;
  /** Zero-based chunk index */
  chunkIndex: number;
  /** Total number of chunks */
  totalChunks: number;
  /** Chunk data */
  data: ArrayBuffer;
  /** Chunk integrity hash (SHA-256) */
  hash: string;
  /** Whether chunk is encrypted */
  encrypted: boolean;
}

// ============================================================================
// Settings Types
// ============================================================================

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Application settings
 */
export interface Settings {
  /** User-defined device name */
  deviceName: string;
  /** Device avatar URL or data URI */
  deviceAvatar: string | null;
  /** Default download directory */
  downloadPath: string;
  /** Port for P2P connections */
  port: number;
  /** Auto-accept transfers from known devices */
  autoAccept: boolean;
  /** Require PIN for connections */
  requirePin: boolean;
  /** PIN code (hashed) */
  pin: string | null;
  /** Enable desktop notifications */
  enableNotifications: boolean;
  /** Enable sound effects */
  enableSound: boolean;
  /** Enable encryption by default */
  encryptionEnabled: boolean;
  /** UI theme preference */
  theme: Theme;
  /** STUN/TURN relay servers */
  relayServers: string[];
  /** Enable post-quantum cryptography */
  enablePQC: boolean;
  /** Enable onion routing */
  enableOnionRouting: boolean;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Transfer event type
 */
export type TransferEventType =
  | 'started'
  | 'progress'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'resumed'
  | 'cancelled';

/**
 * Transfer event
 *
 * Emitted during transfer lifecycle for progress tracking and notifications.
 */
export interface TransferEvent {
  /** Event type */
  type: TransferEventType;
  /** Associated transfer */
  transfer: Transfer;
  /** Optional event data */
  data: Record<string, unknown> | null;
  /** Event timestamp */
  timestamp: number;
}

// ============================================================================
// Friend Transfer Types
// ============================================================================

/**
 * Friend transfer
 *
 * Transfer with friend-specific metadata and simplified workflow.
 */
export interface FriendTransfer extends Transfer {
  /** Friend identifier */
  friendId: string | null;
  /** Friend display name */
  friendName: string | null;
  /** Skip passcode verification for trusted friends */
  skipPasscode: boolean;
  /** Password protection enabled */
  isPasswordProtected: boolean;
}

// ============================================================================
// Protected File Types
// ============================================================================

/**
 * Password-protected file wrapper
 *
 * Encrypts file with user-provided password before transfer.
 */
export interface ProtectedFile {
  /** Original filename */
  originalName: string;
  /** Original MIME type */
  originalType: string;
  /** Original file size in bytes */
  originalSize: number;
  /** Encrypted file data */
  encryptedData: ArrayBuffer;
  /** Always true to indicate encryption */
  isEncrypted: true;
  /** Encryption metadata */
  encryptionMetadata: EncryptionMetadata;
  /** Password hint (never store actual password) */
  passwordHint: string | null;
}

// ============================================================================
// Group Transfer Types
// ============================================================================

/**
 * Recipient status in group transfer
 */
export interface RecipientTransferStatus {
  /** Current transfer status */
  status: TransferStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Error details if failed */
  error: AppError | null;
  /** Transfer speed in bytes/second */
  speed: number;
  /** Connection quality */
  quality: ConnectionQuality;
}

/**
 * Group transfer
 *
 * Transfer to multiple recipients simultaneously with individual tracking.
 */
export interface GroupTransfer extends Transfer {
  /** List of recipient device IDs */
  recipientIds: string[];
  /** Per-recipient transfer status */
  recipientStatuses: Record<string, RecipientTransferStatus>;
  /** Always true to indicate group transfer */
  isGroupTransfer: true;
  /** Overall progress across all recipients (0-100) */
  overallProgress: number;
  /** Number of successful transfers */
  successCount: number;
  /** Number of failed transfers */
  failureCount: number;
  /** Number of pending transfers */
  pendingCount: number;
  /** Bandwidth limit per recipient (bytes/second) */
  bandwidthLimitPerRecipient: number | null;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if transfer is a group transfer
 */
export function isGroupTransfer(transfer: Transfer): transfer is GroupTransfer {
  return 'isGroupTransfer' in transfer && transfer.isGroupTransfer === true;
}

/**
 * Type guard to check if transfer is a friend transfer
 */
export function isFriendTransfer(transfer: Transfer): transfer is FriendTransfer {
  return 'skipPasscode' in transfer || 'friendId' in transfer;
}

/**
 * Type guard to check if file is protected
 */
export function isProtectedFile(file: unknown): file is ProtectedFile {
  return (
    typeof file === 'object' &&
    file !== null &&
    'isEncrypted' in file &&
    file.isEncrypted === true
  );
}

