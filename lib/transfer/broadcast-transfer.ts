'use client';

/**
 * Broadcast Transfer Module
 * Wraps GroupTransferManager for broadcasting files to all discovered devices
 *
 * CRITICAL: This is a plain TypeScript module (NOT a hook).
 * It uses useDeviceStore.getState() to avoid Turbopack compiler infinite loops.
 */

import { GroupTransferManager, RecipientInfo, GroupTransferResult, GroupTransferOptions } from './group-transfer-manager';
import { useDeviceStore } from '@/lib/stores/device-store';
import { generateUUID } from '@/lib/utils/uuid';
import secureLog from '@/lib/utils/secure-logger';
import { Device } from '@/lib/types';

// ============================================================================
// TYPES
// ============================================================================

export interface BroadcastTransferOptions extends Omit<GroupTransferOptions, 'onComplete'> {
  onComplete?: (result: BroadcastTransferResult) => void;
  excludeDeviceIds?: string[]; // Device IDs to exclude from broadcast
  includeSelf?: boolean; // Whether to include this device (default: false)
}

export interface BroadcastTransferResult extends GroupTransferResult {
  broadcastId: string;
  totalDevicesDiscovered: number;
  devicesIncluded: number;
  devicesExcluded: number;
}

export interface BroadcastTransferStatus {
  broadcastId: string;
  fileName: string;
  fileSize: number;
  totalDevices: number;
  successCount: number;
  failureCount: number;
  pendingCount: number;
  totalProgress: number;
  status: 'preparing' | 'transferring' | 'completed' | 'partial' | 'failed' | 'cancelled';
}

// ============================================================================
// BROADCAST TRANSFER CLASS
// ============================================================================

/**
 * BroadcastTransfer
 * Manages broadcasting files to all discovered devices
 */
export class BroadcastTransfer {
  private broadcastId: string;
  private groupManager: GroupTransferManager | null = null;
  private options: BroadcastTransferOptions;
  private status: BroadcastTransferStatus | null = null;

  constructor(options: BroadcastTransferOptions = {}) {
    this.broadcastId = generateUUID();
    this.options = options;
  }

  /**
   * Get all connected devices from device store (non-reactive)
   * Uses .getState() to avoid Turbopack hook subscription issues
   */
  private getConnectedDevices(): Device[] {
    // CRITICAL: Use getState() instead of useDeviceStore() subscription
    const state = useDeviceStore.getState();
    return state.devices.filter((d) => d.isOnline);
  }

  /**
   * Filter devices for broadcast based on options
   */
  private filterDevicesForBroadcast(devices: Device[]): Device[] {
    const { excludeDeviceIds = [], includeSelf = false } = this.options;

    return devices.filter((device) => {
      // Exclude specific devices
      if (excludeDeviceIds.includes(device.id)) {
        return false;
      }

      // Exclude self device unless explicitly included
      if (!includeSelf && device.id === 'this-device') {
        return false;
      }

      return true;
    });
  }

  /**
   * Convert Device to RecipientInfo
   */
  private deviceToRecipient(device: Device): RecipientInfo {
    return {
      id: device.id,
      name: device.name,
      deviceId: device.id,
      socketId: `socket-${device.id}`, // In real implementation, get from signaling
    };
  }

  /**
   * Start broadcast transfer to all discovered devices
   */
  async start(file: File): Promise<BroadcastTransferResult> {
    if (!file || file.size === 0) {
      throw new Error('Invalid file for broadcast');
    }

    secureLog.log(`[BroadcastTransfer] Starting broadcast: ${file.name}`);

    // Get all connected devices
    const allDevices = this.getConnectedDevices();
    const filteredDevices = this.filterDevicesForBroadcast(allDevices);

    if (filteredDevices.length === 0) {
      throw new Error('No devices available for broadcast');
    }

    secureLog.log(`[BroadcastTransfer] Broadcasting to ${filteredDevices.length} devices`);

    // Convert devices to recipients
    const recipients = filteredDevices.map(this.deviceToRecipient);

    // Initialize status
    this.status = {
      broadcastId: this.broadcastId,
      fileName: file.name,
      fileSize: file.size,
      totalDevices: recipients.length,
      successCount: 0,
      failureCount: 0,
      pendingCount: recipients.length,
      totalProgress: 0,
      status: 'preparing',
    };

    // Create group transfer manager
    this.groupManager = new GroupTransferManager({
      ...this.options,
      onRecipientProgress: (recipientId, progress, speed) => {
        this.updateStatus();
        this.options.onRecipientProgress?.(recipientId, progress, speed);
      },
      onRecipientComplete: (recipientId) => {
        this.updateStatus();
        this.options.onRecipientComplete?.(recipientId);
      },
      onRecipientError: (recipientId, error) => {
        this.updateStatus();
        this.options.onRecipientError?.(recipientId, error);
      },
      onOverallProgress: (progress) => {
        if (this.status) {
          this.status.totalProgress = progress;
        }
        this.options.onOverallProgress?.(progress);
      },
      onComplete: (result) => {
        const broadcastResult: BroadcastTransferResult = {
          ...result,
          broadcastId: this.broadcastId,
          totalDevicesDiscovered: allDevices.length,
          devicesIncluded: filteredDevices.length,
          devicesExcluded: allDevices.length - filteredDevices.length,
        };
        this.options.onComplete?.(broadcastResult);
      },
    });

    // Initialize group transfer
    await this.groupManager.initializeGroupTransfer(
      this.broadcastId,
      file.name,
      file.size,
      recipients
    );

    // Start key exchange
    await this.groupManager.startKeyExchange();

    // Update status
    if (this.status) {
      this.status.status = 'transferring';
    }

    // Send file to all recipients
    const result = await this.groupManager.sendToAll(file);

    // Update final status
    this.updateStatus();

    // Return broadcast result
    const broadcastResult: BroadcastTransferResult = {
      ...result,
      broadcastId: this.broadcastId,
      totalDevicesDiscovered: allDevices.length,
      devicesIncluded: filteredDevices.length,
      devicesExcluded: allDevices.length - filteredDevices.length,
    };

    return broadcastResult;
  }

  /**
   * Update status from group manager state
   */
  private updateStatus(): void {
    if (!this.groupManager || !this.status) {return;}

    const groupState = this.groupManager.getState();
    if (!groupState) {return;}

    this.status.successCount = groupState.successCount;
    this.status.failureCount = groupState.failureCount;
    this.status.pendingCount = groupState.pendingCount;
    this.status.totalProgress = groupState.totalProgress;
    this.status.status = groupState.status;
  }

  /**
   * Stop broadcast transfer
   */
  stop(): void {
    if (this.groupManager) {
      this.groupManager.cancel();
      this.groupManager = null;
    }

    if (this.status) {
      this.status.status = 'cancelled';
    }

    secureLog.log(`[BroadcastTransfer] Stopped broadcast: ${this.broadcastId}`);
  }

  /**
   * Get current broadcast status
   */
  getStatus(): BroadcastTransferStatus | null {
    return this.status;
  }

  /**
   * Get broadcast ID
   */
  getBroadcastId(): string {
    return this.broadcastId;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stop();
    if (this.groupManager) {
      this.groupManager.destroy();
      this.groupManager = null;
    }
    this.status = null;
  }
}

// ============================================================================
// BROADCAST TRANSFER FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new broadcast transfer instance
 */
export function createBroadcastTransfer(
  options?: BroadcastTransferOptions
): BroadcastTransfer {
  return new BroadcastTransfer(options);
}

/**
 * Start a broadcast transfer to all devices
 * Convenience function for one-off broadcasts
 */
export async function broadcastFile(
  file: File,
  options?: BroadcastTransferOptions
): Promise<BroadcastTransferResult> {
  const broadcast = new BroadcastTransfer(options);
  try {
    return await broadcast.start(file);
  } finally {
    broadcast.destroy();
  }
}

/**
 * Get count of devices that would receive broadcast
 * Uses .getState() to avoid hook issues
 */
export function getBroadcastDeviceCount(
  options: Pick<BroadcastTransferOptions, 'excludeDeviceIds' | 'includeSelf'> = {}
): number {
  // CRITICAL: Use getState() instead of useDeviceStore() subscription
  const state = useDeviceStore.getState();
  const allDevices = state.devices.filter((d) => d.isOnline);

  const { excludeDeviceIds = [], includeSelf = false } = options;

  return allDevices.filter((device) => {
    if (excludeDeviceIds.includes(device.id)) {
      return false;
    }
    if (!includeSelf && device.id === 'this-device') {
      return false;
    }
    return true;
  }).length;
}

/**
 * Check if broadcast is available (2+ devices)
 */
export function isBroadcastAvailable(
  options: Pick<BroadcastTransferOptions, 'excludeDeviceIds' | 'includeSelf'> = {}
): boolean {
  return getBroadcastDeviceCount(options) >= 2;
}
