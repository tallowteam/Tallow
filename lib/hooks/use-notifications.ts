'use client';

/**
 * Notifications Hook
 * Unified hook for showing toasts and browser notifications
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useToast } from './use-toast';
import { useSettingsStore } from '@/lib/stores';
import { notificationManager } from '@/lib/utils/notification-manager';

export interface NotifyOptions {
  title?: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useNotifications = () => {
  const toast = useToast();
  const settings = useSettingsStore();
  const incomingTransferTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearIncomingTransferTimeout = useCallback((timeoutId: ReturnType<typeof setTimeout>) => {
    clearTimeout(timeoutId);
    incomingTransferTimeoutsRef.current = incomingTransferTimeoutsRef.current.filter(
      (id) => id !== timeoutId
    );
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of incomingTransferTimeoutsRef.current) {
        clearTimeout(timeoutId);
      }
      incomingTransferTimeoutsRef.current = [];
    };
  }, []);

  // Register notification callback with manager
  useEffect(() => {
    notificationManager.registerNotificationCallback((options) => {
      return toast.addToast(options);
    });

    return () => {
      notificationManager.registerNotificationCallback(() => '');
    };
  }, [toast]);

  // Update notification manager settings when they change
  useEffect(() => {
    notificationManager.updateSettings({
      notificationSound: settings.notificationSound,
      browserNotifications: settings.browserNotifications,
      notifyOnTransferComplete: settings.notifyOnTransferComplete,
      notifyOnIncomingTransfer: settings.notifyOnIncomingTransfer,
      notifyOnConnectionChange: settings.notifyOnConnectionChange,
      notifyOnDeviceDiscovered: settings.notifyOnDeviceDiscovered,
      silentHoursEnabled: settings.silentHoursEnabled,
      silentHoursStart: settings.silentHoursStart,
      silentHoursEnd: settings.silentHoursEnd,
    });

    // Update sound volume and muted state
    notificationManager.setVolume(settings.notificationVolume ?? 0.3);
    notificationManager.setMuted(!settings.notificationSound);
  }, [
    settings.notificationSound,
    settings.notificationVolume,
    settings.browserNotifications,
    settings.notifyOnTransferComplete,
    settings.notifyOnIncomingTransfer,
    settings.notifyOnConnectionChange,
    settings.notifyOnDeviceDiscovered,
    settings.silentHoursEnabled,
    settings.silentHoursStart,
    settings.silentHoursEnd,
  ]);

  /**
   * Show a general notification
   */
  const notify = useCallback(
    (options: NotifyOptions) => {
      return toast.addToast({
        ...(options.title !== undefined ? { title: options.title } : {}),
        message: options.message,
        variant: options.variant || 'info',
        ...(options.duration !== undefined ? { duration: options.duration } : {}),
        ...(options.action !== undefined ? { action: options.action } : {}),
      });
    },
    [toast]
  );

  /**
   * Transfer started notification
   */
  const notifyTransferStarted = useCallback(
    (fileName: string, deviceName: string) => {
      notificationManager.transferStarted(fileName, deviceName);
      return toast.info(`Starting transfer: ${fileName}`, {
        title: 'Transfer Started',
      });
    },
    [toast]
  );

  /**
   * Transfer complete notification
   */
  const notifyTransferComplete = useCallback(
    (fileName: string, direction: 'sent' | 'received' = 'received') => {
      notificationManager.transferComplete(fileName, direction);
      const message = direction === 'sent'
        ? `Successfully sent: ${fileName}`
        : `Successfully received: ${fileName}`;
      return toast.success(message, {
        title: direction === 'sent' ? 'Transfer Complete' : 'File Received',
      });
    },
    [toast]
  );

  /**
   * Transfer failed notification
   */
  const notifyTransferFailed = useCallback(
    (fileName: string, error?: string, onRetry?: () => void) => {
      notificationManager.transferFailed(fileName, error);
      const message = error
        ? `Failed to transfer ${fileName}: ${error}`
        : `Failed to transfer ${fileName}`;
      return toast.error(message, onRetry
        ? { title: 'Transfer Failed', action: { label: 'Retry', onClick: onRetry } }
        : { title: 'Transfer Failed' }
      );
    },
    [toast]
  );

  /**
   * Connection established notification
   */
  const notifyConnectionEstablished = useCallback(
    (deviceName: string, connectionType: 'p2p' | 'relay' = 'p2p') => {
      notificationManager.connectionEstablished(deviceName, connectionType);
      const message = connectionType === 'p2p'
        ? `Direct P2P connection established`
        : `Connected via relay`;
      return toast.success(message, {
        title: `Connected to ${deviceName}`,
      });
    },
    [toast]
  );

  /**
   * Connection lost notification
   */
  const notifyConnectionLost = useCallback(
    (deviceName: string) => {
      notificationManager.connectionLost(deviceName);
      return toast.warning(`Disconnected from ${deviceName}`, {
        title: 'Connection Lost',
      });
    },
    [toast]
  );

  /**
   * New device discovered notification
   */
  const notifyDeviceDiscovered = useCallback(
    (deviceName: string) => {
      notificationManager.deviceDiscovered(deviceName);
      return toast.info(`${deviceName} is available for transfer`, {
        title: 'New Device Found',
      });
    },
    [toast]
  );

  /**
   * Incoming transfer request notification
   */
  const notifyIncomingTransferRequest = useCallback(
    (
      deviceName: string,
      fileName: string,
      onAccept: () => void,
      onReject: () => void
    ) => {
      notificationManager.incomingTransferRequest(deviceName, fileName);

      // Create a toast with accept/reject actions
      const toastId = toast.addToast({
        title: `${deviceName} wants to send a file`,
        message: fileName,
        variant: 'info',
        duration: 30000, // 30 seconds
        action: {
          label: 'Accept',
          onClick: () => {
            clearIncomingTransferTimeout(timeoutId);
            onAccept();
            toast.removeToast(toastId);
          },
        },
      });

      // Auto-reject after 30 seconds
      const timeoutId = setTimeout(() => {
        incomingTransferTimeoutsRef.current = incomingTransferTimeoutsRef.current.filter(
          (id) => id !== timeoutId
        );
        toast.removeToast(toastId);
        onReject();
      }, 30000);
      incomingTransferTimeoutsRef.current.push(timeoutId);

      return toastId;
    },
    [clearIncomingTransferTimeout, toast]
  );

  /**
   * Connection request notification
   */
  const notifyConnectionRequest = useCallback(
    (
      deviceName: string,
      deviceId: string,
      onAccept: () => void,
      onReject: () => void
    ) => {
      return notificationManager.connectionRequest(deviceName, deviceId, onAccept, onReject);
    },
    []
  );

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    await notificationManager.requestPermission();
  }, []);

  /**
   * Check if browser notifications are available
   */
  const isBrowserNotificationsAvailable = useMemo(
    () => notificationManager.isBrowserNotificationsAvailable(),
    []
  );

  /**
   * Check if browser notifications are denied
   */
  const isBrowserNotificationsDenied = useMemo(
    () => notificationManager.isBrowserNotificationsDenied(),
    []
  );

  return {
    // General
    notify,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    dismiss: toast.removeToast,
    dismissAll: toast.clearAll,

    // Transfer notifications
    notifyTransferStarted,
    notifyTransferComplete,
    notifyTransferFailed,

    // Connection notifications
    notifyConnectionEstablished,
    notifyConnectionLost,
    notifyConnectionRequest,

    // Device notifications
    notifyDeviceDiscovered,

    // Special notifications
    notifyIncomingTransferRequest,

    // Browser notifications
    requestPermission,
    isBrowserNotificationsAvailable,
    isBrowserNotificationsDenied,
  };
};
