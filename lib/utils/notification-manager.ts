'use client';

/**
 * Notification Manager
 * Central notification system that coordinates toasts, browser notifications, and sounds.
 *
 * Key features:
 * - De-duplication: identical notifications within 5 seconds are suppressed
 * - Priority ordering: error > warning > info > success
 * - Persistence: important notifications survive page refresh via sessionStorage
 * - Badge count: tracks unread notification count
 * - Silent hours: respects user-configured Do Not Disturb windows
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
  /** When true, the notification is persisted to sessionStorage for recovery. */
  persist?: boolean;
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

/** Record stored for de-duplication. */
interface DeduplicationEntry {
  message: string;
  variant: string;
  timestamp: number;
}

/** Record stored in sessionStorage for persistent notifications. */
interface PersistedNotification {
  title?: string;
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  timestamp: number;
}

/** De-duplication window in milliseconds. */
const DEDUP_WINDOW_MS = 5000;

/** sessionStorage key for persisted notifications. */
const PERSIST_KEY = 'tallow_persisted_notifications';

/** Maximum persisted notifications to keep. */
const MAX_PERSISTED = 20;

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
  private groupedNotifications = new Map<NotificationGroup, GroupedNotification>();
  private notificationCallback: ((options: NotificationOptions & { id?: string }) => string) | null = null;

  /** Recent notifications for de-duplication. */
  private recentNotifications: DeduplicationEntry[] = [];

  /** Badge count of unread notifications. */
  private _unreadCount = 0;

  /** Whether browser notification permission has been explicitly requested by user action. */
  private permissionRequested = false;

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
   * Get the current unread badge count.
   */
  get unreadCount(): number {
    return this._unreadCount;
  }

  /**
   * Reset the unread badge count (e.g., when user views notifications).
   */
  resetUnreadCount(): void {
    this._unreadCount = 0;
  }

  // ──────────────────────────────────────────────
  // De-duplication
  // ──────────────────────────────────────────────

  /**
   * Check if a notification is a duplicate (same message+variant within DEDUP_WINDOW_MS).
   */
  private isDuplicate(message: string, variant: string): boolean {
    const now = Date.now();
    // Prune expired entries
    this.recentNotifications = this.recentNotifications.filter(
      (entry) => now - entry.timestamp < DEDUP_WINDOW_MS
    );

    return this.recentNotifications.some(
      (entry) => entry.message === message && entry.variant === variant
    );
  }

  /**
   * Record a notification for de-duplication tracking.
   */
  private recordNotification(message: string, variant: string): void {
    this.recentNotifications.push({
      message,
      variant,
      timestamp: Date.now(),
    });
  }

  // ──────────────────────────────────────────────
  // Persistence (sessionStorage)
  // ──────────────────────────────────────────────

  /**
   * Persist an important notification so it can be recovered after page refresh.
   */
  private persistNotification(
    title: string | undefined,
    message: string,
    variant: 'success' | 'error' | 'warning' | 'info'
  ): void {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return;
    }

    try {
      const stored = sessionStorage.getItem(PERSIST_KEY);
      const list: PersistedNotification[] = stored ? JSON.parse(stored) : [];
      list.push({ ...(title !== undefined ? { title } : {}), message, variant, timestamp: Date.now() });

      // Cap to prevent unbounded growth
      const capped = list.slice(-MAX_PERSISTED);
      sessionStorage.setItem(PERSIST_KEY, JSON.stringify(capped));
    } catch {
      // Storage may be full or disabled
    }
  }

  /**
   * Retrieve and clear persisted notifications (called on mount).
   */
  getPersistedNotifications(): PersistedNotification[] {
    if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
      return [];
    }

    try {
      const stored = sessionStorage.getItem(PERSIST_KEY);
      sessionStorage.removeItem(PERSIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // ──────────────────────────────────────────────
  // Silent hours
  // ──────────────────────────────────────────────

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
    // High-severity notifications bypass silent hours
    if (priority === 'urgent' || priority === 'high') {
      return true;
    }

    // Check silent hours for non-urgent notifications
    if (this.isInSilentHours()) {
      return false;
    }

    return true;
  }

  // ──────────────────────────────────────────────
  // Grouping
  // ──────────────────────────────────────────────

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

  // ──────────────────────────────────────────────
  // Priority
  // ──────────────────────────────────────────────

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

  // ──────────────────────────────────────────────
  // Sound
  // ──────────────────────────────────────────────

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

  // ──────────────────────────────────────────────
  // Browser notifications
  // ──────────────────────────────────────────────

  /**
   * Show a browser notification if in background and enabled.
   * IMPORTANT: This will NOT auto-request permission. Permission must be
   * explicitly requested via requestPermission() from a user gesture.
   */
  private async showBrowserNotification(
    title: string,
    message: string,
    tag?: string
  ): Promise<void> {
    if (!this.settings.browserNotifications) {
      return;
    }

    // Only show if permission was already granted -- never auto-request
    if (!browserNotifications.isGranted()) {
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

  // ──────────────────────────────────────────────
  // Central dispatch
  // ──────────────────────────────────────────────

  /**
   * Central dispatch method for all notifications.
   * Handles de-duplication, persistence, badge count, and routing to toast/browser/sound.
   */
  dispatch(options: NotificationOptions): string | null {
    const variant = options.variant || 'info';
    const message = options.message;

    // De-duplicate
    if (this.isDuplicate(message, variant)) {
      return null;
    }

    // Check silent hours
    const priority = options.priority || 'normal';
    if (!this.shouldShowNotification(priority)) {
      return null;
    }

    // Record for de-duplication
    this.recordNotification(message, variant);

    // Increment badge
    this._unreadCount++;

    // Persist if requested
    if (options.persist) {
      this.persistNotification(options.title, message, variant);
    }

    // Show toast
    let toastId: string | null = null;
    if (this.notificationCallback) {
      toastId = this.notificationCallback(options);
    }

    return toastId;
  }

  // ──────────────────────────────────────────────
  // Domain-specific notification methods
  // ──────────────────────────────────────────────

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

    const priority = this.determinePriority({
      ...(fileSize !== undefined ? { fileSize } : {}),
    });

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

    // Persist transfer-complete notifications
    this.persistNotification(title, message, 'success');
    this._unreadCount++;

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

    this._unreadCount++;

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
    this._unreadCount++;

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
    _deviceId: string,
    onAccept: () => void,
    onReject: () => void
  ): Promise<string | null> {
    // Connection requests are high priority
    if (!this.shouldShowNotification('high')) {
      return null;
    }

    await this.playSound('incomingTransfer');
    this._unreadCount++;

    await this.showBrowserNotification(
      'Connection Request',
      `${deviceName} wants to connect`,
      'connection-request'
    );

    let responded = false;
    const handleAccept = () => {
      responded = true;
      onAccept();
    };
    const handleReject = () => {
      responded = true;
      onReject();
    };

    // Auto-reject after timeout even when no toast callback is registered.
    setTimeout(() => {
      if (!responded) {
        handleReject();
      }
    }, 30000);

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
          onClick: handleAccept,
        },
      });

      return toastId;
    }

    return null;
  }

  /**
   * Request notification permission.
   * This MUST only be called from a user-initiated action (e.g., button click).
   * Never call this automatically on page load.
   */
  async requestPermission(): Promise<NotificationPermission> {
    this.permissionRequested = true;
    if (this.settings.browserNotifications) {
      return await browserNotifications.requestPermission();
    }
    return 'denied';
  }

  /**
   * Whether the user has explicitly triggered a permission request.
   */
  hasRequestedPermission(): boolean {
    return this.permissionRequested;
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
    _transferId: string,
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
        duration: progress === 100 ? 3000 : Infinity,
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
