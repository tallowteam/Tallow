/**
 * Transfer Page — Shared Type Definitions
 *
 * All types used across transfer page components.
 * This is the ONLY shared file — components import types from here.
 */

// ============================================================================
// MODE & NAVIGATION
// ============================================================================

export type TransferMode = 'nearby' | 'remote';
export type MobileTab = 'devices' | 'history' | 'clipboard' | 'settings';

// ============================================================================
// DEVICE TYPES
// ============================================================================

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  status: 'online' | 'connecting' | 'offline';
  isFriend: boolean;
  avatar?: string;
}

export interface DeviceTransferState {
  deviceId: string;
  transferId: string;
  progress: number;
  status: 'connecting' | 'transferring';
  speed: number;
  eta: number | null;
  fileName: string;
  fileSize: number;
  direction: 'send' | 'receive';
}

// ============================================================================
// TRANSFER TYPES
// ============================================================================

export interface ActiveTransfer {
  id: string;
  fileName: string;
  fileSize: number;
  progress: number;
  speed: number;
  eta: number | null;
  direction: 'send' | 'receive';
  status: 'connecting' | 'transferring' | 'completed' | 'failed' | 'paused';
  deviceName: string;
}

export interface SendConfirmationData {
  deviceId: string;
  deviceName: string;
  files: File[];
  totalSize: number;
  autoAccept: boolean;
}

// ============================================================================
// ROOM TYPES
// ============================================================================

export interface RoomMember {
  id: string;
  name: string;
  platform: string;
  isOnline: boolean;
}

// ============================================================================
// GRID ITEM (used by transfer-page-actions.ts)
// ============================================================================

export interface DeviceGridItem {
  id: string;
  name: string;
  platform: string;
  status: 'online' | 'connecting' | 'offline';
  isFriend: boolean;
  friendData?: unknown;
  deviceData?: unknown;
  isPQC: boolean;
  discoverySource: 'lan' | 'signaling';
  avatar?: string;
}
