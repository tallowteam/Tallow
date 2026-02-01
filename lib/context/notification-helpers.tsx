/**
 * Notification Helpers
 * Common notification patterns and utilities for use with NotificationsContext
 */

import { NotificationAction } from './notifications-context';
import { Copy, Download, Upload, Trash2, AlertCircle, CheckCircle2, Share2 } from 'lucide-react';

/**
 * File operation notification helpers
 */
export const fileNotifications = {
  /**
   * File copied notification
   */
  copied: (filename: string) => ({
    message: `Copied ${filename}`,
    icon: <Copy className="w-5 h-5" />,
  }),

  /**
   * File downloaded notification
   */
  downloaded: (filename: string, action?: NotificationAction) => ({
    message: `Downloaded ${filename}`,
    icon: <Download className="w-5 h-5" />,
    action,
  }),

  /**
   * File uploaded notification
   */
  uploaded: (filename: string, count?: number) => ({
    message: count && count > 1 ? `Uploaded ${count} files` : `Uploaded ${filename}`,
    icon: <Upload className="w-5 h-5" />,
  }),

  /**
   * File deleted notification with undo
   */
  deleted: (filename: string) => ({
    message: `Deleted ${filename}`,
    icon: <Trash2 className="w-5 h-5" />,
  }),

  /**
   * File shared notification
   */
  shared: (filename: string, recipient: string) => ({
    message: `Shared ${filename} with ${recipient}`,
    icon: <Share2 className="w-5 h-5" />,
  }),
};

/**
 * Connection notification helpers
 */
export const connectionNotifications = {
  /**
   * Connected to device
   */
  connected: (deviceName: string) => ({
    message: `Connected to ${deviceName}`,
    icon: <CheckCircle2 className="w-5 h-5" />,
  }),

  /**
   * Disconnected from device
   */
  disconnected: (deviceName?: string) => ({
    message: deviceName ? `Disconnected from ${deviceName}` : 'Disconnected',
    description: 'Connection lost',
  }),

  /**
   * Connection error with retry
   */
  connectionError: (error: string, onRetry?: () => void) => ({
    message: 'Connection failed',
    description: error,
    icon: <AlertCircle className="w-5 h-5" />,
    action: onRetry ? {
      label: 'Retry',
      onClick: onRetry,
    } : undefined,
  }),
};

/**
 * Transfer notification helpers
 */
export const transferNotifications = {
  /**
   * Transfer started
   */
  started: (filename: string) => ({
    message: `Sending ${filename}...`,
    groupId: 'transfers',
  }),

  /**
   * Transfer complete with download action
   */
  complete: (filename: string, onDownload?: () => void) => ({
    message: `Transfer complete: ${filename}`,
    icon: <CheckCircle2 className="w-5 h-5" />,
    action: onDownload ? {
      label: 'Download',
      onClick: onDownload,
      icon: <Download className="w-4 h-4" />,
    } : undefined,
  }),

  /**
   * Transfer failed
   */
  failed: (error: string) => ({
    message: 'Transfer failed',
    description: error,
    icon: <AlertCircle className="w-5 h-5" />,
  }),

  /**
   * Batch transfer progress
   */
  batchProgress: (completed: number, total: number) => ({
    message: `Transferring files (${completed}/${total})`,
    groupId: 'batch-transfer',
  }),
};

/**
 * Security notification helpers
 */
export const securityNotifications = {
  /**
   * Encryption enabled
   */
  encryptionEnabled: () => ({
    message: 'Post-quantum encryption active',
    icon: <CheckCircle2 className="w-5 h-5" />,
  }),

  /**
   * Security warning
   */
  securityWarning: (message: string) => ({
    message,
    icon: <AlertCircle className="w-5 h-5" />,
    duration: 8000,
  }),

  /**
   * Metadata detected warning
   */
  metadataDetected: (onStrip?: () => void) => ({
    message: 'File contains metadata',
    description: 'Location, camera info, and timestamps detected',
    action: onStrip ? {
      label: 'Strip Metadata',
      onClick: onStrip,
    } : undefined,
  }),
};

/**
 * Settings notification helpers
 */
export const settingsNotifications = {
  /**
   * Settings saved
   */
  saved: () => ({
    message: 'Settings saved',
  }),

  /**
   * Settings reset with undo
   */
  reset: () => ({
    message: 'Settings reset to defaults',
  }),

  /**
   * Settings export
   */
  exported: (onDownload?: () => void) => ({
    message: 'Settings exported',
    action: onDownload ? {
      label: 'Download',
      onClick: onDownload,
    } : undefined,
  }),

  /**
   * Settings import
   */
  imported: () => ({
    message: 'Settings imported successfully',
  }),
};

/**
 * Clipboard notification helpers
 */
export const clipboardNotifications = {
  /**
   * Content copied to clipboard
   */
  copied: (content?: string) => ({
    message: content
      ? `Copied: ${content.slice(0, 30)}${content.length > 30 ? '...' : ''}`
      : 'Copied to clipboard',
    icon: <Copy className="w-5 h-5" />,
  }),

  /**
   * Link copied
   */
  linkCopied: (url?: string) => ({
    message: 'Link copied to clipboard',
    description: url,
    icon: <Copy className="w-5 h-5" />,
  }),
};

/**
 * Create notification group for batch operations
 */
export function createBatchNotificationGroup(
  operationType: string,
  items: string[]
) {
  const groupId = `batch-${operationType}-${Date.now()}`;
  const baseMessage = `${operationType} ${items.length} items`;

  return {
    groupId,
    baseMessage,
    items,
  };
}

/**
 * Format file size for notifications
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format transfer speed for notifications
 */
export function formatTransferSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

/**
 * Format ETA for notifications
 */
export function formatETA(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Create progress notification message
 */
export function createProgressMessage(
  filename: string,
  progress: number,
  speed?: number,
  eta?: number
): string {
  let message = `${filename} (${Math.round(progress)}%)`;

  if (speed !== undefined) {
    message += ` - ${formatTransferSpeed(speed)}`;
  }

  if (eta !== undefined) {
    message += ` - ${formatETA(eta)} remaining`;
  }

  return message;
}

/**
 * Notification patterns for common scenarios
 */
export const notificationPatterns = {
  fileNotifications,
  connectionNotifications,
  transferNotifications,
  securityNotifications,
  settingsNotifications,
  clipboardNotifications,
};

export default notificationPatterns;
