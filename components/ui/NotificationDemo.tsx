'use client';

/**
 * Notification Demo Component
 * Demonstrates all notification features
 */

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { useSettingsStore } from '@/lib/stores';
import { Button } from './Button';
import { Card } from './Card';
import { IncomingTransferDialog } from '@/components/transfer/IncomingTransferDialog';
import styles from './NotificationDemo.module.css';

export function NotificationDemo() {
  const notifications = useNotifications();
  const settings = useSettingsStore();
  const [showIncomingDialog, setShowIncomingDialog] = useState(false);

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h2 className={styles.title}>Notification System Demo</h2>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Settings</h3>
          <div className={styles.settings}>
            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.notificationSound}
                onChange={(e) => settings.setNotificationSound(e.target.checked)}
              />
              <span>Enable Sound</span>
            </label>

            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.browserNotifications}
                onChange={(e) => settings.setBrowserNotifications(e.target.checked)}
              />
              <span>Enable Browser Notifications</span>
            </label>

            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.notifyOnTransferComplete}
                onChange={(e) => settings.setNotifyOnTransferComplete(e.target.checked)}
              />
              <span>Notify on Transfer Complete</span>
            </label>

            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.notifyOnIncomingTransfer}
                onChange={(e) => settings.setNotifyOnIncomingTransfer(e.target.checked)}
              />
              <span>Notify on Incoming Transfer</span>
            </label>

            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.notifyOnConnectionChange}
                onChange={(e) => settings.setNotifyOnConnectionChange(e.target.checked)}
              />
              <span>Notify on Connection Change</span>
            </label>

            <label className={styles.setting}>
              <input
                type="checkbox"
                checked={settings.notifyOnDeviceDiscovered}
                onChange={(e) => settings.setNotifyOnDeviceDiscovered(e.target.checked)}
              />
              <span>Notify on Device Discovered</span>
            </label>
          </div>

          {settings.browserNotifications && !notifications.isBrowserNotificationsAvailable && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => notifications.requestPermission()}
              className={styles.permissionButton}
            >
              Grant Browser Notification Permission
            </Button>
          )}
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Basic Toasts</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.success('Operation completed successfully!')
              }
            >
              Success Toast
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                notifications.error('Something went wrong. Please try again.')
              }
            >
              Error Toast
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notifications.warning('This action cannot be undone.')
              }
            >
              Warning Toast
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notifications.info('New feature available!')}
            >
              Info Toast
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Transfer Notifications</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.notifyTransferStarted('document.pdf', 'MacBook Pro')
              }
            >
              Transfer Started
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.notifyTransferComplete('document.pdf', 'received')
              }
            >
              Transfer Complete
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                notifications.notifyTransferFailed(
                  'document.pdf',
                  'Connection lost',
                  () => console.log('Retrying...')
                )
              }
            >
              Transfer Failed
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Connection Notifications</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.notifyConnectionEstablished('MacBook Pro', 'p2p')
              }
            >
              Connected (P2P)
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.notifyConnectionEstablished('iPhone', 'relay')
              }
            >
              Connected (Relay)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                notifications.notifyConnectionLost('MacBook Pro')
              }
            >
              Connection Lost
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Device Notifications</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() =>
                notifications.notifyDeviceDiscovered('New iPhone')
              }
            >
              Device Discovered
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Incoming Transfer Dialog</h3>
          <div className={styles.actions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowIncomingDialog(true)}
            >
              Show Incoming Transfer
            </Button>
          </div>
        </div>

        <div className={styles.section}>
          <h3 className={styles.subtitle}>Actions</h3>
          <div className={styles.actions}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => notifications.dismissAll()}
            >
              Dismiss All Toasts
            </Button>
          </div>
        </div>
      </Card>

      <IncomingTransferDialog
        open={showIncomingDialog}
        deviceName="MacBook Pro"
        fileName="presentation.pdf"
        fileSize={2048576}
        fileType="application/pdf"
        onAccept={() => {
          setShowIncomingDialog(false);
          notifications.success('Transfer accepted!');
        }}
        onReject={() => {
          setShowIncomingDialog(false);
          notifications.warning('Transfer rejected.');
        }}
      />
    </div>
  );
}
