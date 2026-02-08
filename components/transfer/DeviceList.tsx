'use client';

import React, { useState, useCallback } from 'react';
import styles from './devicelist.module.css';

interface DeviceListProps {
  mode: 'local' | 'internet' | 'friends';
  selectedDevice: string | null;
  onSelectDevice: (deviceId: string) => void;
}

interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'connecting';
  isPQC: boolean;
}

interface Friend {
  id: string;
  tallowId: string;
  status: 'online' | 'offline';
}

// TODO: Replace with real Zustand store data via useDeviceStore selector
const MOCK_DEVICES: Device[] = [
  { id: 'device-1', name: 'Silent Falcon', type: 'macOS · Same Network', status: 'online', isPQC: true },
  { id: 'device-2', name: 'Amber Wolf', type: 'Windows · Same Network', status: 'online', isPQC: true },
  { id: 'device-3', name: 'Crystal Echo', type: 'Linux · Same Network', status: 'connecting', isPQC: true },
  { id: 'device-4', name: 'Mystic Phoenix', type: 'Android · Same Network', status: 'online', isPQC: true },
];

// TODO: Replace with real Zustand store data via useFriendsStore selector
const MOCK_FRIENDS: Friend[] = [
  { id: 'friend-1', tallowId: 'tallow#a8f3', status: 'online' },
  { id: 'friend-2', tallowId: 'tallow#k9x2', status: 'online' },
  { id: 'friend-3', tallowId: 'tallow#m5p7', status: 'offline' },
  { id: 'friend-4', tallowId: 'tallow#r3q1', status: 'offline' },
];

interface DeviceItemProps {
  device: Device;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const DeviceItem = React.memo(function DeviceItem({ device, isSelected, onSelect }: DeviceItemProps) {
  return (
    <button
      className={`${styles.deviceItem} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(device.id)}
      aria-label={`${device.name} — ${device.type} — ${device.status}`}
      aria-pressed={isSelected}
    >
      <div
        className={styles.statusDot}
        data-status={device.status}
        aria-hidden="true"
      />
      <div className={styles.deviceInfo}>
        <div className={styles.deviceName}>
          {device.name}
          {device.isPQC && (
            <span className={styles.pqcBadge} title="Post-Quantum Encryption">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className={styles.pqcTooltip}>PQC</span>
            </span>
          )}
        </div>
        <div className={styles.deviceType}>{device.type}</div>
      </div>
    </button>
  );
});

interface FriendItemProps {
  friend: Friend;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const FriendItem = React.memo(function FriendItem({ friend, isSelected, onSelect }: FriendItemProps) {
  return (
    <button
      className={`${styles.deviceItem} ${styles.friendItem} ${isSelected ? styles.selected : ''} ${friend.status === 'offline' ? styles.offline : ''}`}
      onClick={() => onSelect(friend.id)}
      aria-label={`${friend.tallowId} — ${friend.status}`}
      aria-pressed={isSelected}
    >
      <div
        className={styles.statusDot}
        data-status={friend.status}
        aria-hidden="true"
      />
      <div className={styles.deviceInfo}>
        <div className={styles.deviceName}>{friend.tallowId}</div>
        <div className={styles.deviceType}>
          {friend.status === 'online' ? 'Online' : 'Offline'}
        </div>
      </div>
    </button>
  );
});

function DeviceListComponent({ mode, selectedDevice, onSelectDevice }: DeviceListProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  }, []);

  const getHeaderTitle = useCallback(() => {
    switch (mode) {
      case 'local':
        return 'Nearby Devices';
      case 'internet':
        return 'Connected Peers';
      case 'friends':
        return 'Friends';
      default:
        return 'Devices';
    }
  }, [mode]);

  if (mode === 'internet') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h3 className={styles.title}>{getHeaderTitle()}</h3>
        </div>
        <div className={styles.waitingState}>
          <div className={styles.pulseDot} />
          <span className={styles.waitingText}>Waiting for peer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{getHeaderTitle()}</h3>
        <button
          className={styles.refreshButton}
          onClick={handleRefresh}
          aria-label="Refresh devices"
        >
          <svg
            className={`${styles.refreshIcon} ${isRefreshing ? styles.spinning : ''}`}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
        </button>
      </div>

      <div className={styles.list} role="group" aria-label={mode === 'local' ? 'Nearby devices' : 'Friends list'}>
        {mode === 'local' && MOCK_DEVICES.map((device) => (
          <DeviceItem
            key={device.id}
            device={device}
            isSelected={selectedDevice === device.id}
            onSelect={onSelectDevice}
          />
        ))}

        {mode === 'friends' && MOCK_FRIENDS.map((friend) => (
          <FriendItem
            key={friend.id}
            friend={friend}
            isSelected={selectedDevice === friend.id}
            onSelect={onSelectDevice}
          />
        ))}
      </div>

      {mode === 'friends' && (
        <button className={styles.addFriendButton} aria-label="Add a new friend">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
          Add Friend
        </button>
      )}
    </div>
  );
}

const DeviceList = React.memo(DeviceListComponent);
export default DeviceList;
