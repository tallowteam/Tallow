/**
 * Email Transfer Storage and Tracking
 * Manages email transfer records, downloads, and analytics
 */

import secureStorage from '../storage/secure-storage';
import { secureLog } from '../utils/secure-logger';
import type {
  StoredEmailTransfer,
  EmailDeliveryStatus,
  EmailAnalytics,
  EmailWebhookEvent,
} from './types';

const EMAIL_TRANSFERS_KEY = 'tallow_email_transfers';
const EMAIL_ANALYTICS_KEY = 'tallow_email_analytics';

/**
 * Store email transfer record
 */
export async function storeEmailTransfer(
  transfer: StoredEmailTransfer
): Promise<void> {
  try {
    const transfers = await getAllEmailTransfers();
    transfers.push(transfer);

    // Keep only last 1000 transfers
    const recentTransfers = transfers.slice(-1000);

    await secureStorage.setItem(
      EMAIL_TRANSFERS_KEY,
      JSON.stringify(recentTransfers)
    );

    secureLog.log(`[EmailStorage] Stored transfer ${transfer.id}`);
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to store transfer:', error);
    throw error;
  }
}

/**
 * Get email transfer by ID
 */
export async function getEmailTransfer(
  id: string
): Promise<StoredEmailTransfer | null> {
  try {
    const transfers = await getAllEmailTransfers();
    return transfers.find(t => t.id === id) || null;
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to get transfer:', error);
    return null;
  }
}

/**
 * Get all email transfers
 */
export async function getAllEmailTransfers(): Promise<StoredEmailTransfer[]> {
  try {
    const stored = await secureStorage.getItem(EMAIL_TRANSFERS_KEY);
    if (!stored) {return [];}

    const transfers = JSON.parse(stored);
    return Array.isArray(transfers) ? transfers : [];
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to get all transfers:', error);
    return [];
  }
}

/**
 * Update email transfer status
 */
export async function updateEmailTransferStatus(
  id: string,
  status: EmailDeliveryStatus['status'],
  metadata?: Partial<StoredEmailTransfer>
): Promise<void> {
  try {
    const transfers = await getAllEmailTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error(`Transfer ${id} not found`);
    }

    const currentTransfer = transfers[index];
    if (currentTransfer) {
      transfers[index] = {
        ...currentTransfer,
        status,
        ...metadata,
      };
    }

    await secureStorage.setItem(
      EMAIL_TRANSFERS_KEY,
      JSON.stringify(transfers)
    );

    secureLog.log(`[EmailStorage] Updated transfer ${id} status to ${status}`);
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to update status:', error);
    throw error;
  }
}

/**
 * Increment download count for a transfer
 */
export async function incrementDownloadCount(id: string): Promise<number> {
  try {
    const transfers = await getAllEmailTransfers();
    const index = transfers.findIndex(t => t.id === id);

    if (index === -1) {
      throw new Error(`Transfer ${id} not found`);
    }

    const transfer = transfers[index];
    if (!transfer) {
      throw new Error(`Transfer ${id} not found`);
    }

    transfer.downloadsCount = (transfer.downloadsCount || 0) + 1;
    transfer.downloadedAt = Date.now();

    if (!transfer.status || transfer.status === 'sent' || transfer.status === 'delivered') {
      transfer.status = 'downloaded';
    }

    await secureStorage.setItem(
      EMAIL_TRANSFERS_KEY,
      JSON.stringify(transfers)
    );

    return transfer.downloadsCount;
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to increment download count:', error);
    throw error;
  }
}

/**
 * Check if transfer has expired
 */
export function isTransferExpired(transfer: StoredEmailTransfer): boolean {
  if (Date.now() > transfer.expiresAt) {
    return true;
  }

  if (transfer.maxDownloads && transfer.downloadsCount >= transfer.maxDownloads) {
    return true;
  }

  return false;
}

/**
 * Clean up expired transfers
 */
export async function cleanupExpiredTransfers(): Promise<number> {
  try {
    const transfers = await getAllEmailTransfers();
    const now = Date.now();

    // Keep non-expired transfers
    const validTransfers = transfers.filter(t => now <= t.expiresAt);

    // Mark expired ones
    const expiredCount = transfers.length - validTransfers.length;

    if (expiredCount > 0) {
      await secureStorage.setItem(
        EMAIL_TRANSFERS_KEY,
        JSON.stringify(validTransfers)
      );

      secureLog.log(`[EmailStorage] Cleaned up ${expiredCount} expired transfers`);
    }

    return expiredCount;
  } catch (error) {
    secureLog.error('[EmailStorage] Failed to cleanup expired transfers:', error);
    return 0;
  }
}

/**
 * Record analytics event
 */
export async function recordAnalyticsEvent(
  event: EmailWebhookEvent
): Promise<void> {
  try {
    const analytics = await getEmailAnalytics();

    // Update counters
    switch (event.event) {
      case 'sent':
        analytics.totalSent++;
        break;
      case 'delivered':
        analytics.totalDelivered++;
        break;
      case 'opened':
        analytics.totalOpened++;
        break;
      case 'clicked':
        analytics.totalClicked++;
        break;
      case 'downloaded':
        analytics.totalDownloaded++;
        break;
      case 'expired':
        analytics.totalExpired++;
        break;
      case 'failed':
        analytics.totalFailed++;
        break;
    }

    // Update rates
    if (analytics.totalSent > 0) {
      analytics.openRate = (analytics.totalOpened / analytics.totalSent) * 100;
      analytics.clickRate = (analytics.totalClicked / analytics.totalSent) * 100;
      analytics.downloadRate = (analytics.totalDownloaded / analytics.totalSent) * 100;
      analytics.failureRate = (analytics.totalFailed / analytics.totalSent) * 100;
    }

    // Update by date
    const dateKey = new Date(event.timestamp).toISOString().split('T')[0];
    if (dateKey && !analytics.byDate[dateKey]) {
      analytics.byDate[dateKey] = {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDownloaded: 0,
        totalExpired: 0,
        totalFailed: 0,
        avgDeliveryTime: 0,
        avgOpenTime: 0,
        openRate: 0,
        clickRate: 0,
        downloadRate: 0,
        failureRate: 0,
        byDate: {},
        byRecipient: {},
      };
    }

    // Update by recipient
    if (!analytics.byRecipient[event.recipientEmail]) {
      analytics.byRecipient[event.recipientEmail] = {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDownloaded: 0,
        totalExpired: 0,
        totalFailed: 0,
        avgDeliveryTime: 0,
        avgOpenTime: 0,
        openRate: 0,
        clickRate: 0,
        downloadRate: 0,
        failureRate: 0,
        byDate: {},
        byRecipient: {},
      };
    }

    await secureStorage.setItem(
      EMAIL_ANALYTICS_KEY,
      JSON.stringify(analytics)
    );

    secureLog.log(`[EmailAnalytics] Recorded ${event.event} event for ${event.emailId}`);
  } catch (error) {
    secureLog.error('[EmailAnalytics] Failed to record event:', error);
  }
}

/**
 * Get email analytics
 */
export async function getEmailAnalytics(): Promise<EmailAnalytics> {
  try {
    const stored = await secureStorage.getItem(EMAIL_ANALYTICS_KEY);
    if (!stored) {
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDownloaded: 0,
        totalExpired: 0,
        totalFailed: 0,
        avgDeliveryTime: 0,
        avgOpenTime: 0,
        openRate: 0,
        clickRate: 0,
        downloadRate: 0,
        failureRate: 0,
        byDate: {},
        byRecipient: {},
      };
    }

    return JSON.parse(stored);
  } catch (error) {
    secureLog.error('[EmailAnalytics] Failed to get analytics:', error);
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalDownloaded: 0,
      totalExpired: 0,
      totalFailed: 0,
      avgDeliveryTime: 0,
      avgOpenTime: 0,
      openRate: 0,
      clickRate: 0,
      downloadRate: 0,
      failureRate: 0,
      byDate: {},
      byRecipient: {},
    };
  }
}

/**
 * Reset analytics (for testing or admin purposes)
 */
export async function resetEmailAnalytics(): Promise<void> {
  try {
    await secureStorage.setItem(
      EMAIL_ANALYTICS_KEY,
      JSON.stringify({
        totalSent: 0,
        totalDelivered: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDownloaded: 0,
        totalExpired: 0,
        totalFailed: 0,
        avgDeliveryTime: 0,
        avgOpenTime: 0,
        openRate: 0,
        clickRate: 0,
        downloadRate: 0,
        failureRate: 0,
        byDate: {},
        byRecipient: {},
      })
    );

    secureLog.log('[EmailAnalytics] Reset analytics');
  } catch (error) {
    secureLog.error('[EmailAnalytics] Failed to reset analytics:', error);
    throw error;
  }
}

export default {
  storeEmailTransfer,
  getEmailTransfer,
  getAllEmailTransfers,
  updateEmailTransferStatus,
  incrementDownloadCount,
  isTransferExpired,
  cleanupExpiredTransfers,
  recordAnalyticsEvent,
  getEmailAnalytics,
  resetEmailAnalytics,
};
