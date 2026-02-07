'use client';

/**
 * Notification Manager
 * Central notification system that coordinates toasts, browser notifications, and sounds
 */

import { browserNotifications } from './browser-notifications';
import { notificationSounds } from '@/lib/audio/notification-sounds';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type NotificationGroup = 'transfer' | 'connection' | 'chat' | 'system';

export interface NotificationPreview {
  type: 'image' | 'file' | 'transfer';
  src?: string;
  fileName?: string;
  fileSize?: string;
  progress?: number;
}

export interface NotificationOptions {
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  actions?: Array<{
    label: string;
    onClick: () => void;
  }>;
  preview?: NotificationPreview;
  sound?: boolean;
  browserNotification?: boolean;
  priority?: NotificationPriority;
  group?: NotificationGroup;
}

export interface NotificationSettings {
  notificationSound: boolean;
  browserNotifications: boolean;
  notifyOnTransferComplete: boolean;
  notifyOnIncomingTransfer: boolean;
  notifyOnConnectionChange: boolean;
  notifyOnDeviceDiscovered: boolean;
  silentHoursEnabled?: boolean;
  silentHoursStart?: string; // Format: "HH:MM"
  silentHoursEnd?: string;   // Format: "HH:MM"
}

interface GroupedNotification {
  group: NotificationGroup;
  count: number;
  lastMessage: string;
  lastTimestamp: number;
}

class NotificationManager {
  private settings: NotificationSettings = {
    notificationSound: true,
    browserNotifications: true,
    notifyOnTransferComplete: true,
    notifyOnIncomingTransfer: true,
    notifyOnConnectionChange: true,
    notifyOnDeviceDiscovered: false,
    silentHoursEnabled: false,
    silentHoursStart: '22:00',
    silentHoursEnd: '08:00',
  };

  private soundEnabled = true;
  private audioContext: AudioContext | null = null;
  private groupedNotifications = new Map<NotificationGroup, GroupedNotification>();
  private notificationCallback: ((options: NotificationOptions & { id?: string }) => string) | null = null;

  /**
   * Register notification callback for toast display
   */
  registerNotificationCallback(callback: (options: NotificationOptions & { id?: string }) => string): void {
    this.notificationCallback = callback;
  }

  /**
   * Update notification settings
   */
  updateSettings(settings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Check if currently in silent hours
   */
  private isInSilentHours(): boolean {
    if (!this.settings.silentHoursEnabled) {
      return false;
    }

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const start = this.settings.silentHoursStart || '22:00';
    const end = this.settings.silentHoursEnd || '08:00';

    // Handle overnight periods (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime < end;
    }

    // Handle same-day periods (e.g., 08:00 to 22:00)
    return currentTime >= start && currentTime < end;
  }

  /**
   * Check if notification should be shown based on priority and silent hours
   */
  private shouldShowNotification(priority: NotificationPriority = 'normal'): boolean {
    // Urgent notifications bypass silent hours
    if (priority === 'urgent') {
      return true;
    }

    // Check silent hours for non-urgent notifications
    if (this.isInSilentHours()) {
      return false;
    }

    return true;
  }

  /**
   * Get or create grouped notification
   */
  private getGroupedNotification(group: NotificationGroup): GroupedNotification {
    if (!this.groupedNotifications.has(group)) {
      this.groupedNotifications.set(group, {
        group,
        count: 0,
        lastMessage: '',
        lastTimestamp: 0,
      });
    }
    return this.groupedNotifications.get(group)!;
  }

  /**
   * Update grouped notification count
   */
  private updateGroupedNotification(group: NotificationGroup, message: string): void {
    const grouped = this.getGroupedNotification(group);
    const now = Date.now();

    // Reset count if more than 30 seconds since last notification
    if (now - grouped.lastTimestamp > 30000) {
      grouped.count = 1;
    } else {
      grouped.count++;
    }

    grouped.lastMessage = message;
    grouped.lastTimestamp = now;
  }

  /**
   * Get grouped notification message
   */
  private getGroupedMessage(group: NotificationGroup, baseMessage: string): string {
    const grouped = this.getGroupedNotification(group);

    // Don't group if only one notification or too old
    if (grouped.count <= 1 || Date.now() - grouped.lastTimestamp > 30000) {
      return baseMessage;
    }

    // Generate grouped message based on type
    switch (group) {
      case 'transfer':
        return `${grouped.count} files received`;
      case 'connection':
        return `${grouped.count} connection changes`;
      case 'chat':
        return `${grouped.count} new messages`;
      case 'system':
        return `${grouped.count} system notifications`;
      default:
        return baseMessage;
    }
  }

  /**
   * Determine priority based on context
   */
  private determinePriority(options: {
    isError?: boolean;
    fileSize?: number;
    isSecurityAlert?: boolean;
  }): NotificationPriority {
    if (options.isSecurityAlert) {
      return 'urgent';
    }
    if (options.isError) {
      return 'high';
    }
    if (options.fileSize && options.fileSize > 100 * 1024 * 1024) { // > 100MB
      return 'high';
    }
    return 'normal';
  }

  /**
   * Play notification sound by type
   */
  private async playSound(type: 'transferComplete' | 'incomingTransfer' | 'connectionEstablished' | 'error' | 'messageReceived' = 'transferComplete'): Promise<void> {
    if (!this.soundEnabled || !this.settings.notificationSound) {
      return;
    }

    try {
      await notificationSounds.play(type);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  /**
   * Set notification volume
   */
  setVolume(volume: number): void {
    notificationSounds.setVolume(volume);
  }

  /**
   * Set muted state
   */
  setMuted(muted: boolean): void {
    notificationSounds.setMuted(muted);
  }

  /**
   * Show a browser notification if in background and enabled
   */
  private async showBrowserNotification(
    title: string,
    message: string,
    tag?: string
  ): Promise<void> {
    if (!this.settings.browserNotifications) {
      return;
    }

    if (browserNotifications.isInBackground()) {
      await browserNotifications.show({
        title,
        body: message,
        ...(tag !== undefined ? { tag } : {}),
        onClick: () => {
          browserNotifications.focusApp();
        },
      });
    }
  }

  /**
   * Transfer started notification
   */
  async transferStarted(fileName: string, deviceName: string): Promise<void> {
    await this.playSound('incomingTransfer');
    await this.showBrowserNotification(
      'Transfer Started',
      `Sending ${fileName} to ${deviceName}`,
      'transfer-started'
    );
  }

  /**
   * Transfer complete notification
   */
  async transferComplete(fileName: string, direction: 'sent' | 'received', fileSize?: number): Promise<void> {
    if (!this.settings.notifyOnTransferComplete) {
      return;
    }

    const priority = this.determinePriority({ fileSize });

    if (!this.shouldShowNotification(priority)) {
      return;
    }

    // Update grouped notification
    this.updateGroupedNotification('transfer', fileName);

    // Check if we should show grouped message
    const grouped = this.getGroupedNotification('transfer');
    const useGrouped = grouped.count > 1 && Date.now() - grouped.lastTimestamp < 30000;

    await this.playSound('transferComplete');

    const title = direction === 'sent' ? 'Transfer Complete' : 'File Received';
    const message = useGrouped
      ? this.getGroupedMessage('transfer', fileName)
      : direction === 'sent'
        ? `Successfully sent: ${fileName}`
        : `Successfully received: ${fileName}`;

    await this.showBrowserNotification(title, message, 'transfer-complete');
  }

  /**
   * Transfer failed notification
   */
  async transferFailed(fileName: string, error?: string): Promise<void> {
    // Failed transfers are high priority and bypass silent hours
    const priority: NotificationPriority = 'high';

    if (!this.shouldShowNotification(priority)) {
      return;
    }

    await this.playSound('error');

    const message = error
      ? `Failed to transfer ${fileName}: ${error}`
      : `Failed to transfer ${fileName}`;

    await this.showBrowserNotification(
      'Transfer Failed',
      message,
      'transfer-failed'
    );
  }

  /**
   * Connection established notification
   */
  async connectionEstablished(deviceName: string, connectionType: 'p2p' | 'relay'): Promise<void> {
    if (!this.settings.notifyOnConnectionChange) {
      return;
    }

    if (!this.shouldShowNotification('normal')) {
      return;
    }

    this.updateGroupedNotification('connection', deviceName);

    await this.playSound('connectionEstablished');

    const message = connectionType === 'p2p'
      ? `Direct P2P connection established with ${deviceName}`
      : `Connected to ${deviceName} via relay`;

    await this.showBrowserNotification(
      'Connected',
      message,
      'connection-established'
    );
  }

  /**
   * Connection lost notification
   */
  async connectionLost(deviceName: string): Promise<void> {
    if (!this.settings.notifyOnConnectionChange) {
      return;
    }

    if (!this.shouldShowNotification('normal')) {
      return;
    }

    this.updateGroupedNotification('connection', deviceName);

    await this.playSound('error');
    await this.showBrowserNotification(
      'Connection Lost',
      `Disconnected from ${deviceName}`,
      'connection-lost'
    );
  }

  /**
   * New device discovered notification
   */
  async deviceDiscovered(deviceName: string): Promise<void> {
    if (!this.settings.notifyOnDeviceDiscovered) {
      return;
    }

    if (!this.shouldShowNotification('low')) {
      return;
    }

    await this.playSound('messageReceived');
    await this.showBrowserNotification(
      'New Device Found',
      `${deviceName} is available for transfer`,
      'device-discovered'
    );
  }

  /**
   * Incoming transfer request notification
   */
  async incomingTransferRequest(deviceName: string, fileName: string): Promise<void> {
    if (!this.settings.notifyOnIncomingTransfer) {
      return;
    }

    // Incoming transfer requests are high priority
    if (!this.shouldShowNotification('high')) {
      return;
    }

    await this.playSound('incomingTransfer');
    await this.showBrowserNotification(
      'Incoming Transfer Request',
      `${deviceName} wants to send: ${fileName}`,
      'incoming-transfer'
    );
  }

  /**
   * Connection request notification with accept/reject actions
   */
  async connectionRequest(
    deviceName: string,
    deviceId: string,
    onAccept: () => void,
    onReject: () => void
  ): Promise<string | null> {
    // Connection requests are high priority
    if (!this.shouldShowNotification('high')) {
      return null;
    }

    await this.playSound('incomingTransfer');
    await this.showBrowserNotification(
      'Connection Request',
      `${deviceName} wants to connect`,
      'connection-request'
    );

    // Return toast ID if callback is registered
    if (this.notificationCallback) {
      const toastId = this.notificationCallback({
        title: `Connection Request from ${deviceName}`,
        message: 'Do you want to allow this connection?',
        variant: 'info',
        duration: 30000, // 30 seconds
        priority: 'high',
        group: 'connection',
        action: {
          label: 'Accept',
          onClick: onAccept,
        },
      });

      // Auto-reject after timeout
      setTimeout(() => {
        onReject();
      }, 30000);

      return toastId;
    }

    return null;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<void> {
    if (this.settings.browserNotifications) {
      await browserNotifications.requestPermission();
    }
  }

  /**
   * Enable/disable sound
   */
  setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
  }

  /**
   * Check if browser notifications are supported and granted
   */
  isBrowserNotificationsAvailable(): boolean {
    return browserNotifications.isSupported() && browserNotifications.isGranted();
  }

  /**
   * Check if permission is denied
   */
  isBrowserNotificationsDenied(): boolean {
    return browserNotifications.isDenied();
  }

  /**
   * Show file notification with preview
   */
  async showFileNotification(
    fileName: string,
    fileSize: string,
    thumbnail?: string
  ): Promise<string | null> {
    if (!this.shouldShowNotification('normal')) {
      return null;
    }

    await this.playSound('messageReceived');
    await this.showBrowserNotification(
      'File Ready',
      `${fileName} (${fileSize})`,
      'file-notification'
    );

    if (this.notificationCallback) {
      return this.notificationCallback({
        title: 'File Ready',
        message: `${fileName} is ready to transfer`,
        variant: 'info',
        duration: 7000,
        preview: thumbnail
          ? {
              type: 'image',
              src: thumbnail,
              fileName,
              fileSize,
            }
          : {
              type: 'file',
              fileName,
              fileSize,
            },
      });
    }

    return null;
  }

  /**
   * Show transfer notification with progress
   */
  async showTransferNotification(
    transferId: string,
    progress: number,
    fileName: string
  ): Promise<string | null> {
    if (!this.shouldShowNotification('normal')) {
      return null;
    }

    // Don't play sound for every progress update
    if (progress === 100) {
      await this.playSound('transferComplete');
    }

    if (this.notificationCallback) {
      const status = progress === 100 ? 'Transfer Complete' : 'Transferring';
      return this.notificationCallback({
        title: status,
        message: progress === 100
          ? `${fileName} has been transferred successfully`
          : `Transferring ${fileName}...`,
        variant: progress === 100 ? 'success' : 'info',
        duration: progress === 100 ? 5000 : Infinity,
        preview: {
          type: 'transfer',
          fileName,
          progress,
        },
      });
    }

    return null;
  }

  /**
   * Show image notification with preview thumbnail
   */
  async showImageNotification(
    imageSrc: string,
    fileName: string
  ): Promise<string | null> {
    if (!this.shouldShowNotification('normal')) {
      return null;
    }

    await this.playSound('transferComplete');
    await this.showBrowserNotification(
      'Image Received',
      fileName,
      'image-notification'
    );

    if (this.notificationCallback) {
      return this.notificationCallback({
        title: 'Image Received',
        message: fileName,
        variant: 'success',
        duration: 7000,
        preview: {
          type: 'image',
          src: imageSrc,
          fileName,
        },
        actions: [
          {
            label: 'View',
            onClick: () => {
              // Open image in new tab
              window.open(imageSrc, '_blank');
            },
          },
        ],
      });
    }

    return null;
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();
