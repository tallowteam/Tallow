'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDeviceStore } from '@/lib/stores/device-store';
import { useTransferStore } from '@/lib/stores/transfer-store';
import { useFriendsStore, type Friend } from '@/lib/stores/friends-store';
import { useRoomStore } from '@/lib/stores/room-store';
import { useSettingsStore } from '@/lib/stores/settings-store';
import { discoveryController } from '@/lib/discovery/discovery-controller';
import { DeviceDiscovery } from '@/components/transfer/DeviceDiscovery';
import { RoomCodeConnect } from '@/components/transfer/RoomCodeConnect';
import { FriendsList } from '@/components/transfer/FriendsList';
import type { Device } from '@/lib/types';
import styles from './page.module.css';

// ============================================================================
// TYPES
// ============================================================================

type TransferMode = 'select' | 'local' | 'internet' | 'friends';
type ViewState = 'method-select' | 'mode-active' | 'connected';

interface ConnectionInfo {
  device: Device | null;
  friend: Friend | null;
  roomCode: string | null;
}

// ============================================================================
// ICONS
// ============================================================================

function WiFiIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function PeopleIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TransferPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read URL params
  const roomFromUrl = searchParams.get('room');

  // State machine
  const [mode, setMode] = useState<TransferMode>(roomFromUrl ? 'internet' : 'select');
  const [viewState, setViewState] = useState<ViewState>('method-select');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Files
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connection info
  const [connection, setConnection] = useState<ConnectionInfo>({
    device: null,
    friend: null,
    roomCode: null,
  });

  // Read state via selectors (safe with Turbopack)
  const connectionStatus = useDeviceStore(s => s.connection.status);
  const transfers = useTransferStore(s => s.transfers);
  const currentTransfer = useTransferStore(s => s.currentTransfer);
  const friends = useFriendsStore(s => s.friends);
  const roomCode = useRoomStore(s => s.roomCode);
  const deviceName = useSettingsStore(s => s.deviceName);
  const autoAccept = useSettingsStore(s => s.autoAcceptFromFriends);

  // Check if first time user
  const isFirstTime = transfers.length === 0 && friends.length === 0;

  // Start discovery when local mode selected
  useEffect(() => {
    if (mode === 'local') {
      discoveryController.start(deviceName);
      return () => {
        discoveryController.stop();
      };
    }
    return undefined;
  }, [mode, deviceName]);

  // Handle URL room code on mount
  useEffect(() => {
    if (roomFromUrl && mode === 'select') {
      setMode('internet');
      setViewState('mode-active');
    }
  }, [roomFromUrl, mode]);

  // Update view state based on connection
  useEffect(() => {
    if (connectionStatus === 'connected') {
      setViewState('connected');
    } else if (connectionStatus === 'error') {
      setViewState('mode-active');
    }
  }, [connectionStatus]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectMethod = useCallback((selectedMode: TransferMode) => {
    setMode(selectedMode);
    setViewState('mode-active');

    // Update URL if needed
    const params = new URLSearchParams(searchParams);
    if (selectedMode === 'internet' && !roomCode) {
      // Will be updated when room is created
    }
    router.push(`/transfer?${params.toString()}`, { scroll: false });
  }, [searchParams, router, roomCode]);

  const handleFileSelection = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFilesChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
    }
  }, []);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDeviceSelect = useCallback((device: Device) => {
    setConnection({ device, friend: null, roomCode: null });
    setViewState('connected');
  }, []);

  const handleFriendSelect = useCallback((friend: Friend) => {
    setConnection({ device: null, friend, roomCode: null });
    setViewState('connected');
  }, []);

  const handleRoomConnect = useCallback((code: string) => {
    setConnection({ device: null, friend: null, roomCode: code });
    setViewState('connected');
  }, []);

  const handleBackToModes = useCallback(() => {
    setViewState('mode-active');
    setConnection({ device: null, friend: null, roomCode: null });
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* STATE 1: Method Selection */}
        {viewState === 'method-select' && (
          <div className={styles.methodSelectView}>
            <div className={styles.methodSelectContent}>
              <h1 className={styles.methodHeading}>How do you want to transfer?</h1>
              <p className={styles.methodSubtitle}>Choose your connection method</p>

              <div className={styles.methodCards}>
                <button
                  className={styles.methodCard}
                  onClick={() => handleSelectMethod('local')}
                  aria-label="Transfer via Local Network"
                >
                  <div className={styles.methodCardIcon}>
                    <WiFiIcon />
                  </div>
                  <h2 className={styles.methodCardTitle}>Local Network</h2>
                  <p className={styles.methodCardSubtitle}>Devices on your network</p>
                  <p className={styles.methodCardDescription}>
                    Transfer to nearby devices over WiFi or LAN
                  </p>
                </button>

                <button
                  className={styles.methodCard}
                  onClick={() => handleSelectMethod('internet')}
                  aria-label="Transfer via Internet P2P"
                >
                  <div className={styles.methodCardIcon}>
                    <GlobeIcon />
                  </div>
                  <h2 className={styles.methodCardTitle}>Internet P2P</h2>
                  <p className={styles.methodCardSubtitle}>Anyone, anywhere</p>
                  <p className={styles.methodCardDescription}>
                    Connect with a room code, QR code, or shareable link
                  </p>
                </button>

                <button
                  className={styles.methodCard}
                  onClick={() => handleSelectMethod('friends')}
                  aria-label="Transfer to Friends"
                >
                  <div className={styles.methodCardIcon}>
                    <PeopleIcon />
                  </div>
                  <h2 className={styles.methodCardTitle}>Friends</h2>
                  <p className={styles.methodCardSubtitle}>Your saved contacts</p>
                  <p className={styles.methodCardDescription}>
                    Quick transfer to people you've connected with before
                  </p>
                </button>
              </div>

              {isFirstTime && (
                <p className={styles.firstTimeTip}>
                  First time? Local Network is the fastest for nearby devices.
                </p>
              )}
            </div>
          </div>
        )}

        {/* STATE 2: Mode Active */}
        {viewState === 'mode-active' && (
          <div className={styles.modeActiveView}>
            {/* Mode Tabs */}
            <div className={styles.modeTabs}>
              <button
                className={`${styles.modeTab} ${mode === 'local' ? styles.modeTabActive : ''}`}
                onClick={() => setMode('local')}
                aria-pressed={mode === 'local'}
              >
                Local Network
              </button>
              <button
                className={`${styles.modeTab} ${mode === 'internet' ? styles.modeTabActive : ''}`}
                onClick={() => setMode('internet')}
                aria-pressed={mode === 'internet'}
              >
                Internet P2P
              </button>
              <button
                className={`${styles.modeTab} ${mode === 'friends' ? styles.modeTabActive : ''}`}
                onClick={() => setMode('friends')}
                aria-pressed={mode === 'friends'}
              >
                Friends
              </button>
            </div>

            {/* Mode Content */}
            <div className={styles.modeContent}>
              {mode === 'local' && (
                <DeviceDiscovery
                  selectedFiles={selectedFiles}
                  onDeviceSelect={handleDeviceSelect}
                />
              )}

              {mode === 'internet' && (
                <RoomCodeConnect
                  selectedFiles={selectedFiles}
                  onConnect={handleRoomConnect}
                  {...(roomFromUrl ? { initialRoomCode: roomFromUrl } : {})}
                />
              )}

              {mode === 'friends' && (
                <FriendsList
                  selectedFiles={selectedFiles}
                  onSelectFriend={handleFriendSelect}
                />
              )}
            </div>
          </div>
        )}

        {/* STATE 3: Connected Transfer View */}
        {viewState === 'connected' && (
          <div className={styles.connectedView}>
            {/* Connection Header */}
            <div className={styles.connectionHeader}>
              <div className={styles.connectionInfo}>
                <div className={styles.connectionStatus}>
                  <div className={styles.statusDot} />
                  <span>Connected to {connection.device?.name || connection.friend?.name || 'Room'}</span>
                </div>
                <button className={styles.backButton} onClick={handleBackToModes}>
                  Change connection
                </button>
              </div>
              <button
                className={styles.settingsButton}
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
              >
                <SettingsIcon />
              </button>
            </div>

            {/* File Area (Top Half) */}
            <div className={styles.fileArea}>
              <div
                className={styles.fileDropStrip}
                onClick={handleFileSelection}
                onDrop={handleFileDrop}
                onDragOver={handleFileDragOver}
              >
                <UploadIcon />
                <span>Add files</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFilesChanged}
                  style={{ display: 'none' }}
                  aria-label="Select files"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className={styles.fileList}>
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}-${index}`} className={styles.fileItem}>
                      <div className={styles.fileItemIcon}>
                        <FileIcon />
                      </div>
                      <div className={styles.fileItemInfo}>
                        <div className={styles.fileItemName}>{file.name}</div>
                        <div className={styles.fileItemSize}>{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        className={styles.fileItemRemove}
                        onClick={() => handleRemoveFile(index)}
                        aria-label={`Remove ${file.name}`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Transfer Progress (Bottom Half) */}
            <div className={styles.progressArea}>
              <h2 className={styles.progressHeading}>Transfer Progress</h2>

              {/* Active transfers */}
              {currentTransfer.isTransferring && (
                <div className={styles.transferCard}>
                  <div className={styles.transferCardHeader}>
                    <div className={styles.transferCardInfo}>
                      <div className={styles.transferCardName}>{currentTransfer.fileName}</div>
                      <div className={styles.transferCardSize}>
                        {formatFileSize(currentTransfer.fileSize)}
                      </div>
                    </div>
                    <div className={styles.encryptionBadge}>ML-KEM</div>
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${currentTransfer.isTransferring ? 50 : 0}%` }}
                    />
                  </div>

                  <div className={styles.transferCardFooter}>
                    <span className={styles.transferStatus}>Transferring...</span>
                    <span className={styles.transferStats}>
                      {currentTransfer.isTransferring ? 'In progress' : 'Waiting'}...
                    </span>
                  </div>
                </div>
              )}

              {/* Completed transfers */}
              {transfers.slice(0, 3).map((transfer) => (
                <div key={transfer.id} className={styles.transferCard}>
                  <div className={styles.transferCardHeader}>
                    <div className={styles.transferCardInfo}>
                      <div className={styles.transferCardName}>{transfer.files[0]?.name ?? 'Unknown'}</div>
                      <div className={styles.transferCardSize}>
                        {formatFileSize(transfer.totalSize)}
                      </div>
                    </div>
                    {transfer.status === 'completed' && (
                      <div className={styles.completedIcon}>
                        <CheckIcon />
                      </div>
                    )}
                    {transfer.status === 'failed' && (
                      <div className={styles.errorIcon}>
                        <AlertIcon />
                      </div>
                    )}
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: transfer.status === 'completed' ? '100%' : '0%',
                        backgroundColor: transfer.status === 'failed' ? '#ef4444' : undefined,
                      }}
                    />
                  </div>

                  <div className={styles.transferCardFooter}>
                    <span className={styles.transferStatus}>
                      {transfer.status === 'completed' && 'Complete'}
                      {transfer.status === 'failed' && 'Failed'}
                      {transfer.status === 'pending' && 'Pending'}
                    </span>
                  </div>
                </div>
              ))}

              {/* Empty state */}
              {!currentTransfer.isTransferring && transfers.length === 0 && (
                <div className={styles.emptyProgress}>
                  <p>No transfers yet. Add files above to start.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {settingsOpen && (
          <>
            <div className={styles.settingsOverlay} onClick={() => setSettingsOpen(false)} />
            <div className={styles.settingsPanel}>
              <div className={styles.settingsPanelHeader}>
                <h2>Transfer Settings</h2>
                <button
                  className={styles.settingsCloseButton}
                  onClick={() => setSettingsOpen(false)}
                  aria-label="Close settings"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className={styles.settingsPanelContent}>
                <div className={styles.settingItem}>
                  <label htmlFor="device-name">Device Name</label>
                  <input
                    id="device-name"
                    type="text"
                    value={deviceName}
                    onChange={(e) => {
                      const store = useSettingsStore.getState();
                      store.setDeviceName(e.target.value);
                    }}
                    className={styles.settingInput}
                  />
                </div>

                <div className={styles.settingItem}>
                  <label htmlFor="auto-accept">
                    <span>Auto-accept transfers</span>
                    <input
                      id="auto-accept"
                      type="checkbox"
                      checked={autoAccept}
                      onChange={(e) => {
                        const store = useSettingsStore.getState();
                        store.setAutoAcceptFromFriends(e.target.checked);
                      }}
                      className={styles.settingCheckbox}
                    />
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <label>Encryption Display</label>
                  <p className={styles.settingHelp}>
                    All transfers use ML-KEM post-quantum encryption
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Background Glow */}
      <div className={styles.backgroundGlow} aria-hidden="true" />
    </main>
  );
}
