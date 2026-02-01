'use client';

/**
 * Transfer Metadata Management
 * Handles expiration, one-time transfers, and password protection metadata
 */

import secureStorage from '../storage/secure-storage';
import { secureLog } from '../utils/secure-logger';

const TRANSFER_METADATA_KEY = 'tallow_transfer_metadata';

export interface TransferMetadata {
  transferId: string;

  // Password protection
  hasPassword?: boolean;
  passwordHint?: string;

  // Expiration
  expiresAt?: number; // Unix timestamp
  expirationDuration?: number; // Duration in ms (for display)

  // One-time transfer
  oneTimeTransfer?: boolean;
  downloadCount?: number;
  maxDownloads?: number;

  // Digital signature
  isSigned?: boolean;
  signatureData?: string; // Serialized signature
  senderPublicKey?: number[]; // For verification

  // General metadata
  createdAt: number;
  fileName?: string;
  fileSize?: number;
}

/**
 * Storage for active transfers metadata
 */
class TransferMetadataManager {
  private metadata: Map<string, TransferMetadata> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {return;}

    try {
      const stored = await secureStorage.getItem(TRANSFER_METADATA_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.metadata = new Map(Object.entries(data));
      }
    } catch (error) {
      secureLog.error('Failed to load transfer metadata:', error);
    }

    this.initialized = true;

    // Clean up expired transfers
    await this.cleanupExpired();
  }

  async setMetadata(transferId: string, metadata: TransferMetadata): Promise<void> {
    await this.initialize();
    this.metadata.set(transferId, metadata);
    await this.persist();
  }

  async getMetadata(transferId: string): Promise<TransferMetadata | null> {
    await this.initialize();
    const meta = this.metadata.get(transferId);

    // Check if expired
    if (meta?.expiresAt && meta.expiresAt < Date.now()) {
      await this.removeMetadata(transferId);
      return null;
    }

    return meta || null;
  }

  async updateMetadata(transferId: string, updates: Partial<TransferMetadata>): Promise<void> {
    await this.initialize();
    const existing = this.metadata.get(transferId);
    if (existing) {
      this.metadata.set(transferId, { ...existing, ...updates });
      await this.persist();
    }
  }

  async removeMetadata(transferId: string): Promise<void> {
    await this.initialize();
    this.metadata.delete(transferId);
    await this.persist();
  }

  async incrementDownloadCount(transferId: string): Promise<boolean> {
    await this.initialize();
    const meta = await this.getMetadata(transferId);

    if (!meta) {return false;}

    const newCount = (meta.downloadCount || 0) + 1;

    // Check if it's a one-time transfer
    if (meta.oneTimeTransfer && newCount >= 1) {
      await this.removeMetadata(transferId);
      return true; // Signal that transfer should be deleted
    }

    // Check if max downloads reached
    if (meta.maxDownloads && newCount >= meta.maxDownloads) {
      await this.removeMetadata(transferId);
      return true;
    }

    await this.updateMetadata(transferId, { downloadCount: newCount });
    return false;
  }

  async cleanupExpired(): Promise<void> {
    await this.initialize();
    const now = Date.now();
    const expired: string[] = [];

    for (const [id, meta] of this.metadata.entries()) {
      if (meta.expiresAt && meta.expiresAt < now) {
        expired.push(id);
      }
    }

    for (const id of expired) {
      this.metadata.delete(id);
    }

    if (expired.length > 0) {
      await this.persist();
    }
  }

  async getAllActive(): Promise<TransferMetadata[]> {
    await this.initialize();
    await this.cleanupExpired();
    return Array.from(this.metadata.values());
  }

  private async persist(): Promise<void> {
    try {
      const data = Object.fromEntries(this.metadata.entries());
      await secureStorage.setItem(TRANSFER_METADATA_KEY, JSON.stringify(data));
    } catch (error) {
      secureLog.error('Failed to persist transfer metadata:', error);
    }
  }

  async clear(): Promise<void> {
    this.metadata.clear();
    secureStorage.removeItem(TRANSFER_METADATA_KEY);
  }
}

export const transferMetadata = new TransferMetadataManager();

/**
 * Expiration duration presets (in milliseconds)
 */
export const EXPIRATION_PRESETS = {
  '1h': 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Format time remaining
 */
export function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {return 'Expired';}

  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {return `${days}d ${hours % 24}h remaining`;}
  if (hours > 0) {return `${hours}h ${minutes % 60}m remaining`;}
  if (minutes > 0) {return `${minutes}m ${seconds % 60}s remaining`;}
  return `${seconds}s remaining`;
}

/**
 * Check if transfer has expired
 */
export function isExpired(metadata: TransferMetadata): boolean {
  if (!metadata.expiresAt) {return false;}
  return metadata.expiresAt < Date.now();
}

/**
 * Check if transfer is one-time and already downloaded
 */
export function isDownloadExhausted(metadata: TransferMetadata): boolean {
  if (metadata.oneTimeTransfer && (metadata.downloadCount || 0) >= 1) {
    return true;
  }
  if (metadata.maxDownloads && (metadata.downloadCount || 0) >= metadata.maxDownloads) {
    return true;
  }
  return false;
}

export default transferMetadata;
