'use client';

import { useMemo } from 'react';
import { DeviceBubble } from './DeviceBubble';
import styles from './DeviceGrid.module.css';

interface DeviceTransferState {
  status: 'connecting' | 'transferring' | 'completed' | 'failed';
  progress: number;
}

interface DeviceGridProps {
  devices: Array<{
    id: string;
    name: string;
    platform: string;
    status: 'online' | 'connecting' | 'offline';
    isFriend: boolean;
    avatar?: string;
  }>;
  selectedDeviceId: string | null;
  onSelectDevice: (id: string) => void;
  onDropFiles: (deviceId: string, files: File[]) => void;
  transferStates: Map<string, DeviceTransferState>;
  isScanning: boolean;
  onRefresh: () => void;
}

export function DeviceGrid(props: DeviceGridProps) {
  const {
    devices,
    selectedDeviceId,
    onSelectDevice,
    onDropFiles,
    transferStates,
    isScanning,
    onRefresh,
  } = props;

  const { friends, others } = useMemo(() => {
    const friendDevices: typeof devices = [];
    const otherDevices: typeof devices = [];

    devices.forEach((device) => {
      if (device.isFriend) {
        friendDevices.push(device);
      } else {
        otherDevices.push(device);
      }
    });

    return { friends: friendDevices, others: otherDevices };
  }, [devices]);

  const renderEmpty = () => (
    <div className={styles.empty}>
      <div className={styles.emptyIcon}>
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" aria-hidden="true">
          {/* Radar circles */}
          <circle
            cx="40"
            cy="40"
            r="30"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.3"
            className={styles.radarCircle1}
          />
          <circle
            cx="40"
            cy="40"
            r="20"
            stroke="currentColor"
            strokeWidth="2"
            opacity="0.5"
            className={styles.radarCircle2}
          />
          <circle cx="40" cy="40" r="10" stroke="currentColor" strokeWidth="2" opacity="0.7" />
          {/* Scanning beam */}
          <line
            x1="40"
            y1="40"
            x2="40"
            y2="10"
            stroke="currentColor"
            strokeWidth="2"
            className={styles.radarBeam}
          />
        </svg>
      </div>
      <div className={styles.emptyText}>Looking for nearby devices...</div>
      <button type="button" className={styles.scanButton} onClick={onRefresh}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M21 3v5h-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Scan again
      </button>
    </div>
  );

  const renderSection = (
    sectionDevices: typeof devices,
    title: string,
    showCount = false
  ) => {
    if (sectionDevices.length === 0) return null;

    return (
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {title}
            {showCount && <span className={styles.count}>{sectionDevices.length}</span>}
          </h2>
        </div>

        <div className={styles.grid}>
          {sectionDevices.map((device) => {
            const transferState = transferStates.get(device.id);
            return (
              <DeviceBubble
                key={device.id}
                id={device.id}
                name={device.name}
                platform={device.platform}
                status={device.status}
                isFriend={device.isFriend}
                isSelected={selectedDeviceId === device.id}
                avatar={device.avatar}
                transferProgress={transferState?.progress}
                transferStatus={transferState?.status === 'connecting' || transferState?.status === 'transferring' ? transferState.status : undefined}
                onSelect={() => onSelectDevice(device.id)}
                onDrop={(files) => onDropFiles(device.id, files)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header with refresh button */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Nearby Devices
          {devices.length > 0 && <span className={styles.count}>{devices.length}</span>}
        </h1>
        <button
          type="button"
          className={`${styles.refreshButton} ${isScanning ? styles.scanning : ''}`}
          onClick={onRefresh}
          aria-label="Refresh devices"
          disabled={isScanning}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 3v5h-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scanning indicator */}
      {isScanning && (
        <div className={styles.scanningIndicator}>
          <div className={styles.scanningIcon}>
            <svg width="20" height="20" viewBox="0 0 40 40" fill="none" aria-hidden="true">
              <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" opacity="0.3" />
              <circle cx="20" cy="20" r="10" stroke="currentColor" strokeWidth="2" opacity="0.5" />
              <line x1="20" y1="20" x2="20" y2="5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <span>Scanning...</span>
        </div>
      )}

      {/* Empty state */}
      {devices.length === 0 && !isScanning && renderEmpty()}

      {/* Friends section */}
      {renderSection(friends, 'Friends')}

      {/* Other devices section */}
      {renderSection(others, friends.length > 0 ? 'Other Devices' : 'Nearby Devices', true)}
    </div>
  );
}
