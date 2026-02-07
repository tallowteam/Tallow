'use client';

/**
 * Notification Integration
 * Connects notification system with store events
 */

import { useEffect, useRef } from 'react';
import { useDeviceStore, useTransferStore, useSettingsStore } from '@/lib/stores';
import { useNotifications } from '@/lib/hooks/use-notifications';

/**
 * Hook to automatically show notifications for store events
 */
export const useNotificationIntegration = () => {
  const notifications = useNotifications();
  const deviceStore = useDeviceStore();
  const transferStore = useTransferStore();
  const settings = useSettingsStore();

  // Track previous values to detect changes
  const prevConnectionStatus = useRef(deviceStore.connection.status);
  const prevDeviceCount = useRef(deviceStore.devices.length);
  const prevTransfers = useRef<string[]>([]);

  useEffect(() => {
    // Connection status changed
    if (
      prevConnectionStatus.current !== deviceStore.connection.status &&
      settings.notifyOnConnectionChange
    ) {
      if (deviceStore.connection.status === 'connected') {
        const deviceName = deviceStore.connection.peerName || 'Unknown Device';
        const connectionType = deviceStore.connection.connectionType || 'p2p';
        notifications.notifyConnectionEstablished(deviceName, connectionType);
      } else if (
        prevConnectionStatus.current === 'connected' &&
        deviceStore.connection.status === 'disconnecting'
      ) {
        const deviceName = deviceStore.connection.peerName || 'Unknown Device';
        notifications.notifyConnectionLost(deviceName);
      }
      prevConnectionStatus.current = deviceStore.connection.status;
    }

    // New device discovered
    if (
      deviceStore.devices.length > prevDeviceCount.current &&
      settings.notifyOnDeviceDiscovered
    ) {
      const newDevice = deviceStore.devices[deviceStore.devices.length - 1];
      if (newDevice && newDevice.name) {
        notifications.notifyDeviceDiscovered(newDevice.name);
      }
      prevDeviceCount.current = deviceStore.devices.length;
    }
  }, [
    deviceStore.connection.status,
    deviceStore.connection.peerName,
    deviceStore.connection.connectionType,
    deviceStore.devices,
    deviceStore.devices.length,
    settings.notifyOnConnectionChange,
    settings.notifyOnDeviceDiscovered,
    notifications,
  ]);

  useEffect(() => {
    // Track transfer status changes
    const currentTransferIds = transferStore.transfers.map((t) => t.id);
    const newTransfers = transferStore.transfers.filter(
      (t) => !prevTransfers.current.includes(t.id)
    );

    // Transfer completed
    newTransfers.forEach((transfer) => {
      if (transfer.status === 'completed' && settings.notifyOnTransferComplete) {
        const name = transfer.files?.[0]?.name || 'File';
        notifications.notifyTransferComplete(name, 'received');
      } else if (transfer.status === 'failed') {
        const name = transfer.files?.[0]?.name || 'File';
        const errMsg = transfer.error ? transfer.error.message : undefined;
        notifications.notifyTransferFailed(name, errMsg);
      }
    });

    prevTransfers.current = currentTransferIds;
  }, [
    transferStore.transfers,
    settings.notifyOnTransferComplete,
    notifications,
  ]);

  // Request browser notification permission on mount if enabled
  useEffect(() => {
    if (
      settings.browserNotifications &&
      !notifications.isBrowserNotificationsAvailable &&
      !notifications.isBrowserNotificationsDenied
    ) {
      notifications.requestPermission();
    }
  }, [
    settings.browserNotifications,
    notifications.isBrowserNotificationsAvailable,
    notifications.isBrowserNotificationsDenied,
    notifications,
  ]);

  return notifications;
};
