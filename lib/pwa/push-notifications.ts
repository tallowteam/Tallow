/**
 * Push Notifications API
 * Handles web push notifications for file transfer events
 */

import { getServiceWorkerRegistration } from './service-worker-registration';
import { warn, log, error } from '@/lib/utils/secure-logger';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Check if notifications are granted
 */
export function isNotificationGranted(): boolean {
  if (!isNotificationSupported()) {return false;}
  return Notification.permission === 'granted';
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) {
    warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    warn('Notification permission denied');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    error('Error requesting notification permission:', err);
    return false;
  }
}

/**
 * Show a local notification
 */
export async function showNotification(options: NotificationOptions): Promise<void> {
  if (!isNotificationGranted()) {
    const granted = await requestNotificationPermission();
    if (!granted) {return;}
  }

  try {
    const registration = await getServiceWorkerRegistration();

    if (registration) {
      // Use service worker to show notification
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag || 'tallow-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        ...(options.actions && options.actions.length > 0 ? { actions: options.actions } : {}),
      });
    } else {
      // Fallback to regular notification
      new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/icon-192.png',
        tag: options.tag || 'tallow-notification',
        data: options.data,
        requireInteraction: options.requireInteraction || false,
      });
    }
  } catch (err) {
    error('Error showing notification:', err);
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
  if (!isNotificationSupported()) {
    warn('Push notifications not supported');
    return null;
  }

  try {
    const granted = await requestNotificationPermission();
    if (!granted) {return null;}

    const registration = await getServiceWorkerRegistration();
    if (!registration) {return null;}

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    log('Push subscription:', subscription);
    return subscription;
  } catch (err) {
    error('Error subscribing to push:', err);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {return false;}

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {return false;}

    const result = await subscription.unsubscribe();
    log('Unsubscribed from push:', result);
    return result;
  } catch (err) {
    error('Error unsubscribing from push:', err);
    return false;
  }
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await getServiceWorkerRegistration();
    if (!registration) {return null;}

    return await registration.pushManager.getSubscription();
  } catch (err) {
    error('Error getting push subscription:', err);
    return null;
  }
}

/**
 * Helper: Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Notification presets for common events
 */
export const NotificationPresets = {
  fileReceived: (fileName: string): NotificationOptions => ({
    title: 'File Received',
    body: `${fileName} has been received successfully`,
    icon: '/icon-192.png',
    tag: 'file-received',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  }),

  transferComplete: (fileName: string): NotificationOptions => ({
    title: 'Transfer Complete',
    body: `${fileName} has been sent successfully`,
    icon: '/icon-192.png',
    tag: 'transfer-complete',
  }),

  transferFailed: (fileName: string): NotificationOptions => ({
    title: 'Transfer Failed',
    body: `Failed to send ${fileName}`,
    icon: '/icon-192.png',
    tag: 'transfer-failed',
  }),

  connectionRequest: (deviceName: string): NotificationOptions => ({
    title: 'Connection Request',
    body: `${deviceName} wants to connect`,
    icon: '/icon-192.png',
    tag: 'connection-request',
    requireInteraction: true,
    actions: [
      { action: 'accept', title: 'Accept' },
      { action: 'reject', title: 'Reject' },
    ],
  }),

  newMessage: (message: string): NotificationOptions => ({
    title: 'New Message',
    body: message,
    icon: '/icon-192.png',
    tag: 'new-message',
  }),
};
