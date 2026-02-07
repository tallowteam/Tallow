'use client';

import { useEffect, useState, type KeyboardEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { useDeviceStore } from '@/lib/stores/device-store';
import { Device } from '@/lib/types';
import { DeviceDiscoveryLoading } from './LoadingStates';
import { createBroadcastTransfer } from '@/lib/transfer/broadcast-transfer';
import styles from './DeviceDiscovery.module.css';

interface DeviceDiscoveryProps {
  selectedFiles: File[];
  onDeviceSelect: (device: Device) => void;
  onBroadcastStart?: () => void;
}

// IP address validation helper
function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$/;
  const hostnameRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip) || hostnameRegex.test(ip);
}

function isValidPort(port: number): boolean {
  return port > 0 && port <= 65535;
}

export function DeviceDiscovery({ selectedFiles, onDeviceSelect, onBroadcastStart }: DeviceDiscoveryProps) {
  const { devices, discovery } = useDeviceStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showManualConnect, setShowManualConnect] = useState(false);
  const [manualIP, setManualIP] = useState('');
  const [manualPort, setManualPort] = useState('8384');
  const [manualError, setManualError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  useEffect(() => {
    // Discovery is handled by useDeviceDiscovery hook in parent
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const onlineDevices = devices.filter((d) => d.isOnline);
  const offlineDevices = devices.filter((d) => !d.isOnline);

  // Filter out "this-device" for broadcast count
  const broadcastableDevices = onlineDevices.filter((d) => d.id !== 'this-device');
  const canBroadcast = broadcastableDevices.length >= 2 && selectedFiles.length > 0;

  const handleBroadcast = async () => {
    if (!canBroadcast || selectedFiles.length === 0) {
      return;
    }

    setIsBroadcasting(true);

    try {
      // Notify parent that broadcast is starting
      onBroadcastStart?.();

      // Create broadcast transfer
      const broadcast = createBroadcastTransfer({
        includeSelf: false, // Don't send to self
        onRecipientProgress: (recipientId, progress, speed) => {
          console.log(`[Broadcast] ${recipientId} progress: ${progress}% at ${speed} bytes/sec`);
        },
        onRecipientComplete: (recipientId) => {
          console.log(`[Broadcast] ${recipientId} completed`);
        },
        onRecipientError: (recipientId, error) => {
          console.error(`[Broadcast] ${recipientId} failed:`, error);
        },
        onOverallProgress: (progress) => {
          console.log(`[Broadcast] Overall progress: ${progress}%`);
        },
        onComplete: (result) => {
          console.log('[Broadcast] Complete:', result);
          setIsBroadcasting(false);
        },
      });

      // Start broadcast with first selected file
      const firstFile = selectedFiles[0];
      if (firstFile) await broadcast.start(firstFile);
    } catch (error) {
      console.error('[Broadcast] Failed:', error);
      setIsBroadcasting(false);
    }
  };

  const handleManualConnect = async (e: FormEvent) => {
    e.preventDefault();
    setManualError('');

    // Validate IP address
    if (!manualIP.trim()) {
      setManualError('IP address is required');
      return;
    }

    if (!isValidIPAddress(manualIP.trim())) {
      setManualError('Invalid IP address or hostname');
      return;
    }

    // Validate port
    const portNumber = parseInt(manualPort, 10);
    if (isNaN(portNumber) || !isValidPort(portNumber)) {
      setManualError('Port must be between 1 and 65535');
      return;
    }

    setIsConnecting(true);

    try {
      // Create a device object for the manual connection
      const manualDevice: Device = {
        id: `manual-${manualIP}-${portNumber}-${Date.now()}`,
        name: `Device at ${manualIP}`,
        platform: 'web',
        ip: manualIP.trim(),
        port: portNumber,
        isOnline: true,
        isFavorite: false,
        lastSeen: Date.now(),
        avatar: null,
      };

      // Add device to store using getState() to avoid Turbopack hook issues
      const store = useDeviceStore.getState();
      store.addDevice(manualDevice);

      // Trigger connection attempt
      onDeviceSelect(manualDevice);

      // Reset form
      setManualIP('');
      setManualPort('8384');
      setShowManualConnect(false);
    } catch (error) {
      setManualError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  if (isInitialLoading && discovery.isScanning && devices.length === 0) {
    return <DeviceDiscoveryLoading count={4} />;
  }

  return (
    <div className={styles.container}>
      {/* Scan Status */}
      <div className={styles.scanStatus}>
        {discovery.isScanning ? (
          <div className={styles.scanning}>
            <ScanningIcon />
            <span>Scanning network...</span>
          </div>
        ) : (
          <div className={styles.scanned}>
            <CheckIcon />
            <span>{onlineDevices.length} devices found</span>
          </div>
        )}

        <div className={styles.statusActions}>
          {/* Manual Connect Button */}
          <button
            type="button"
            onClick={() => setShowManualConnect(!showManualConnect)}
            className={styles.manualConnectButton}
            aria-label="Manual IP connection"
            aria-expanded={showManualConnect}
          >
            <NetworkIcon />
            <span>Enter IP</span>
          </button>
        </div>
      </div>

      {/* Broadcast Button - appears when 2+ devices available */}
      {canBroadcast && (
        <div className={styles.broadcastContainer}>
          <button
            type="button"
            onClick={handleBroadcast}
            className={styles.broadcastButton}
            disabled={isBroadcasting}
            aria-label={`Send to all ${broadcastableDevices.length} devices`}
          >
            {isBroadcasting ? (
              <>
                <ScanningIcon />
                <span>Broadcasting...</span>
              </>
            ) : (
              <>
                <BroadcastIcon />
                <span>Send to All ({broadcastableDevices.length} devices)</span>
                <SendAllIcon />
              </>
            )}
          </button>
          <p className={styles.broadcastHint}>
            Send {selectedFiles[0]?.name || 'file'} to all discovered devices at once
          </p>
        </div>
      )}

      {/* Manual Connect Form */}
      {showManualConnect && (
        <div className={styles.manualConnectForm}>
          <form onSubmit={handleManualConnect}>
            <div className={styles.formHeader}>
              <h3 className={styles.formTitle}>Connect by IP Address</h3>
              <button
                type="button"
                onClick={() => {
                  setShowManualConnect(false);
                  setManualError('');
                }}
                className={styles.closeButton}
                aria-label="Close manual connect"
              >
                <CloseIcon />
              </button>
            </div>

            <div className={styles.formFields}>
              <div className={styles.formField}>
                <label htmlFor="manual-ip" className={styles.formLabel}>
                  IP Address or Hostname
                </label>
                <input
                  id="manual-ip"
                  type="text"
                  value={manualIP}
                  onChange={(e) => setManualIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className={styles.formInput}
                  disabled={isConnecting}
                  autoFocus
                  autoComplete="off"
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="manual-port" className={styles.formLabel}>
                  Port
                </label>
                <input
                  id="manual-port"
                  type="number"
                  value={manualPort}
                  onChange={(e) => setManualPort(e.target.value)}
                  placeholder="8384"
                  className={styles.formInput}
                  disabled={isConnecting}
                  min="1"
                  max="65535"
                  autoComplete="off"
                />
              </div>
            </div>

            {manualError && (
              <div className={styles.formError} role="alert">
                <ErrorIcon />
                <span>{manualError}</span>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={() => {
                  setShowManualConnect(false);
                  setManualError('');
                  setManualIP('');
                  setManualPort('8384');
                }}
                className={styles.cancelButton}
                disabled={isConnecting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.connectButton}
                disabled={isConnecting || !manualIP.trim()}
              >
                {isConnecting ? (
                  <>
                    <ScanningIcon />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <ConnectIcon />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Device Grid */}
      <div className={styles.deviceGrid}>
        {onlineDevices.length === 0 && offlineDevices.length === 0 ? (
          <EmptyState scanning={discovery.isScanning} />
        ) : (
          <>
            {onlineDevices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onSelect={() => onDeviceSelect(device)}
                fileCount={selectedFiles.length}
                isThisDevice={device.id === 'this-device'}
              />
            ))}
          </>
        )}
      </div>

      {/* Error State */}
      {discovery.error && (
        <div className={styles.error} role="alert">
          <ErrorIcon />
          <span>{discovery.error}</span>
        </div>
      )}
    </div>
  );
}

// Device Card Component
interface DeviceCardProps {
  device: Device;
  onSelect: () => void;
  fileCount: number;
  isThisDevice?: boolean;
}

function DeviceCard({ device, onSelect, fileCount, isThisDevice = false }: DeviceCardProps) {
  const { toggleFavorite } = useDeviceStore();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isThisDevice) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect();
    }
  };

  const handleClick = () => {
    if (!isThisDevice && fileCount > 0) {
      onSelect();
    }
  };

  return (
    <div
      className={`${styles.deviceCard} ${isThisDevice ? styles.thisDevice : ''} ${
        fileCount === 0 && !isThisDevice ? styles.deviceCardDisabled : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isThisDevice ? -1 : 0}
      aria-label={isThisDevice ? 'This device' : `Transfer to ${device.name}`}
      aria-disabled={isThisDevice || fileCount === 0}
    >
      {/* Device Icon */}
      <div className={styles.deviceIcon}>
        {device.avatar ? (
          <Image src={device.avatar} alt="" width={48} height={48} />
        ) : (
          <DeviceIcon platform={device.platform} />
        )}
        {device.isOnline && <div className={styles.onlineIndicator} />}
      </div>

      {/* Device Info */}
      <div className={styles.deviceInfo}>
        <div className={styles.deviceHeader}>
          <h4 className={styles.deviceName}>{device.name}</h4>
          {!isThisDevice && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(device.id);
              }}
              className={styles.favoriteButton}
              aria-label={device.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {device.isFavorite ? <StarFilledIcon /> : <StarIcon />}
            </button>
          )}
        </div>

        <PlatformBadge platform={device.platform} />
      </div>

      {/* Send Indicator */}
      {!isThisDevice && fileCount > 0 && (
        <div className={styles.sendIndicator}>
          <SendIcon />
        </div>
      )}

      {/* This Device Badge */}
      {isThisDevice && (
        <div className={styles.thisDeviceBadge}>
          <span>You</span>
        </div>
      )}
    </div>
  );
}

// Empty State
function EmptyState({ scanning }: { scanning: boolean }) {
  return (
    <div className={styles.emptyState}>
      {scanning ? (
        <>
          <ScanningIcon />
          <p className={styles.emptyTitle}>Searching for devices...</p>
          <p className={styles.emptySubtitle}>Make sure devices are on the same network</p>
        </>
      ) : (
        <>
          <NoDevicesIcon />
          <p className={styles.emptyTitle}>No devices found</p>
          <p className={styles.emptySubtitle}>
            Try using Internet mode with a room code
          </p>
        </>
      )}
    </div>
  );
}

// Platform Badge
function PlatformBadge({ platform }: { platform: Device['platform'] }) {
  const config = {
    windows: { label: 'Windows', emoji: '🪟' },
    macos: { label: 'macOS', emoji: '🍎' },
    linux: { label: 'Linux', emoji: '🐧' },
    android: { label: 'Android', emoji: '🤖' },
    ios: { label: 'iOS', emoji: '📱' },
    web: { label: 'Web', emoji: '🌐' },
  };

  const { label, emoji } = config[platform] || { label: platform, emoji: '💻' };

  return (
    <span className={styles.platformBadge}>
      <span className={styles.platformEmoji}>{emoji}</span>
      {label}
    </span>
  );
}

// Icons
function DeviceIcon({ platform }: { platform: Device['platform'] }) {
  const isMobile = platform === 'ios' || platform === 'android';

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.deviceSvg}>
      {isMobile ? (
        <>
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <line x1="12" y1="18" x2="12" y2="18" />
        </>
      ) : (
        <>
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </>
      )}
    </svg>
  );
}

function ScanningIcon() {
  return (
    <svg className={styles.iconSpin} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="12" x2="18" y2="12" />
      <line x1="6" y1="12" x2="2" y2="12" />
      <line x1="12" y1="6" x2="12" y2="2" />
      <line x1="12" y1="22" x2="12" y2="18" />
      <line x1="19.07" y1="19.07" x2="16.24" y2="16.24" />
      <line x1="7.76" y1="7.76" x2="4.93" y2="4.93" />
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function StarFilledIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function NoDevicesIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
    </svg>
  );
}

function NetworkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="2" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ConnectIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 11l-5-5-5 5M12 18V6" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function BroadcastIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

function SendAllIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" fill="currentColor" />
      <circle cx="6" cy="12" r="3" fill="currentColor" />
      <circle cx="18" cy="19" r="3" fill="currentColor" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
