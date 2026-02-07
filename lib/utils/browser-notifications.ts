'use client';

/**
 * Browser Notifications
 * Handles native browser notifications for background events
 */

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: unknown;
  onClick?: () => void;
}

class BrowserNotificationManager {
  private permission: NotificationPermission = 'default';
  private clickHandlers: Map<string, () => void> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permission = Notification.permission;
      this.setupEventListeners();
    }
  }

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Check if permission is granted
   */
  isGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Check if permission is denied
   */
  isDenied(): boolean {
    return this.permission === 'denied';
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Browser notifications are not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      return this.permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a browser notification
   */
  async show(options: BrowserNotificationOptions): Promise<Notification | null> {
    if (!this.isSupported()) {
      return null;
    }

    // Request permission if needed
    if (this.permission === 'default') {
      await this.requestPermission();
    }

    if (!this.isGranted()) {
      return null;
    }

    try {
      const notifOpts: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icon.svg',
        badge: options.badge || '/icon.svg',
      };
      if (options.tag !== undefined) notifOpts.tag = options.tag;
      if (options.requireInteraction !== undefined) notifOpts.requireInteraction = options.requireInteraction;
      if (options.silent !== undefined) notifOpts.silent = options.silent;
      if (options.data !== undefined) notifOpts.data = options.data;
      const notification = new Notification(options.title, notifOpts);

      // Store click handler
      if (options.onClick && options.tag) {
        this.clickHandlers.set(options.tag, options.onClick);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Setup event listeners for notification clicks
   */
  private setupEventListeners(): void {
    if (!this.isSupported()) {
      return;
    }

    // Listen for notification clicks
    navigator.serviceWorker?.addEventListener('notificationclick', (event) => {
      const tag = (event as unknown as { notification?: { tag?: string } })?.notification?.tag;
      if (tag) {
        const handler = this.clickHandlers.get(tag);
        if (handler) {
          handler();
          this.clickHandlers.delete(tag);
        }
      }

      // Focus the window
      if (typeof window !== 'undefined') {
        window.focus();
      }
    });
  }

  /**
   * Focus the app window
   */
  focusApp(): void {
    if (typeof window !== 'undefined') {
      window.focus();
      if (document.hidden) {
        // Try to bring window to front
        window.parent.focus();
      }
    }
  }

  /**
   * Check if the app is in the background
   */
  isInBackground(): boolean {
    return typeof document !== 'undefined' && document.hidden;
  }

  /**
   * Clear all notifications with a specific tag
   */
  clearByTag(tag: string): void {
    if (!this.isSupported()) {
      return;
    }

    this.clickHandlers.delete(tag);
  }
}

// Singleton instance
export const browserNotifications = new BrowserNotificationManager();

/**
 * Convenience functions for common notification types
 */

export const notifyTransferComplete = async (fileName: string): Promise<void> => {
  await browserNotifications.show({
    title: 'Transfer Complete',
    body: `Successfully received: ${fileName}`,
    tag: 'transfer-complete',
    requireInteraction: false,
    onClick: () => {
      browserNotifications.focusApp();
    },
  });
};

export const notifyIncomingTransfer = async (
  deviceName: string,
  fileName: string
): Promise<void> => {
  await browserNotifications.show({
    title: 'Incoming Transfer Request',
    body: `${deviceName} wants to send: ${fileName}`,
    tag: 'incoming-transfer',
    requireInteraction: true,
    onClick: () => {
      browserNotifications.focusApp();
    },
  });
};

export const notifyConnectionEstablished = async (deviceName: string): Promise<void> => {
  await browserNotifications.show({
    title: 'Connection Established',
    body: `Connected to ${deviceName}`,
    tag: 'connection-established',
    requireInteraction: false,
    onClick: () => {
      browserNotifications.focusApp();
    },
  });
};

export const notifyConnectionLost = async (deviceName: string): Promise<void> => {
  await browserNotifications.show({
    title: 'Connection Lost',
    body: `Disconnected from ${deviceName}`,
    tag: 'connection-lost',
    requireInteraction: false,
    onClick: () => {
      browserNotifications.focusApp();
    },
  });
};

export const notifyNewDeviceDiscovered = async (deviceName: string): Promise<void> => {
  await browserNotifications.show({
    title: 'New Device Found',
    body: `${deviceName} is available for transfer`,
    tag: 'device-discovered',
    requireInteraction: false,
    onClick: () => {
      browserNotifications.focusApp();
    },
  });
};
