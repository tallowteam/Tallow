'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRoomConnection } from '@/lib/hooks/use-room-connection';
import { useWebShare, copyToClipboard } from '@/lib/hooks/use-web-share';
import { useToast } from '@/components/ui/ToastProvider';
import { generateEnhancedVisualCodeDataURL, downloadVisualCode } from '@/lib/utils/qr-code-generator';
import styles from './RoomCodeConnect.module.css';

interface RoomCodeConnectProps {
  selectedFiles: File[];
  onConnect?: (roomCode: string) => void;
  initialRoomCode?: string;
}

export function RoomCodeConnect({ selectedFiles, onConnect, initialRoomCode }: RoomCodeConnectProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [mode, setMode] = useState<'join' | 'create'>('join');
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const hasAutoJoinedRef = useRef(false);

  const { share, canShare } = useWebShare();
  const toast = useToast();

  const {
    isConnected,
    isInRoom,
    connectionStatus,
    connectionError,
    currentRoom: _currentRoom,
    roomCode: activeRoomCode,
    isHost,
    members,
    memberCount,
    connect,
    createRoom,
    joinRoom,
    leaveRoom,
  } = useRoomConnection({
    autoConnect: false,
    onMemberJoined: (member) => {
      console.log('Member joined:', member.deviceName);
    },
    onMemberLeft: (memberId) => {
      console.log('Member left:', memberId);
    },
    onRoomClosed: () => {
      console.log('Room closed');
      handleCancel();
    },
    onError: (err) => {
      console.error('Room error:', err);
      setError(err.message);
    },
  });

  // Auto-join room from URL parameter
  useEffect(() => {
    if (initialRoomCode && !hasAutoJoinedRef.current && !isInRoom) {
      hasAutoJoinedRef.current = true;
      console.log('[RoomCodeConnect] Auto-joining room from URL:', initialRoomCode);

      // Auto-join after a brief delay to ensure component is mounted
      const autoJoin = async () => {
        try {
          setIsJoining(true);
          setError(null);

          // Ensure connected to signaling server
          if (!isConnected) {
            await connect();
          }

          // Join room
          await joinRoom(initialRoomCode.toUpperCase());

          // Notify parent
          onConnect?.(initialRoomCode.toUpperCase());
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to join room';
          setError(errorMsg);
          console.error('[RoomCodeConnect] Auto-join failed:', err);
          toast.error(`Failed to join room: ${errorMsg}`);
        } finally {
          setIsJoining(false);
        }
      };

      // Execute auto-join after a short delay
      const timeoutId = setTimeout(autoJoin, 100);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [initialRoomCode, isInRoom, isConnected, connect, joinRoom, onConnect, toast]);

  // Reset error when user types
  useEffect(() => {
    if (error && roomCode) {
      setError(null);
    }
  }, [roomCode, error]);

  const handleJoin = useCallback(async () => {
    if (roomCode.trim().length < 4) {
      setError('Room code must be at least 4 characters');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Ensure connected to signaling server
      if (!isConnected) {
        await connect();
      }

      // Join room
      await joinRoom(roomCode.trim().toUpperCase());

      // Notify parent
      onConnect?.(roomCode.trim().toUpperCase());
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to join room';
      setError(errorMsg);
      console.error('Join room error:', err);
    } finally {
      setIsJoining(false);
    }
  }, [roomCode, isConnected, connect, joinRoom, onConnect]);

  const handleCreateRoom = useCallback(async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Ensure connected to signaling server
      if (!isConnected) {
        await connect();
      }

      // Create room
      const code = await createRoom();
      setMode('create');

      // Notify parent
      onConnect?.(code);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create room';
      setError(errorMsg);
      console.error('Create room error:', err);
    } finally {
      setIsCreating(false);
    }
  }, [isConnected, connect, createRoom, onConnect]);

  const handleCopyCode = useCallback(async () => {
    if (activeRoomCode) {
      try {
        const success = await copyToClipboard(activeRoomCode);
        if (success) {
          setCopied(true);
          toast.success('Room code copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Failed to copy room code');
        }
      } catch (err) {
        console.error('Failed to copy code:', err);
        toast.error('Failed to copy room code');
      }
    }
  }, [activeRoomCode, toast]);

  const handleShareLink = useCallback(async () => {
    if (!activeRoomCode) return;

    // Generate shareable link
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareableLink = `${baseUrl}/transfer?room=${activeRoomCode}`;

    // Try Web Share API first
    if (canShare) {
      const shared = await share({
        title: 'Join my Tallow room',
        text: `Join my secure file transfer room using code: ${activeRoomCode}`,
        url: shareableLink,
      });

      if (shared) {
        // User completed the share
        return;
      }
      // If not shared, fall through to clipboard
    }

    // Fallback to clipboard
    try {
      const success = await copyToClipboard(shareableLink);
      if (success) {
        setCopiedLink(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        toast.error('Failed to copy link');
      }
    } catch (err) {
      console.error('Failed to share link:', err);
      toast.error('Failed to copy link');
    }
  }, [activeRoomCode, canShare, share, toast]);

  const handleCancel = useCallback(() => {
    leaveRoom();
    setMode('join');
    setRoomCode('');
    setError(null);
    setIsCreating(false);
    setIsJoining(false);
    setShowQRCode(false);
    hasAutoJoinedRef.current = false;
  }, [leaveRoom]);

  const handleToggleQRCode = useCallback(() => {
    setShowQRCode(prev => !prev);
  }, []);

  const handleDownloadQRCode = useCallback(() => {
    if (!activeRoomCode) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const shareableLink = `${baseUrl}/transfer?room=${activeRoomCode}`;

    downloadVisualCode(shareableLink, `tallow-room-${activeRoomCode}.svg`, {
      size: 512,
      gridSize: 12,
      colorScheme: 'monochrome',
    });

    toast.success('QR code downloaded!');
  }, [activeRoomCode, toast]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleJoin();
      }
    },
    [handleJoin]
  );

  // Show room view if in room
  if (isInRoom && activeRoomCode) {
    return (
      <div className={styles.container}>
        <div className={styles.codeDisplay}>
          <p className={styles.codeLabel}>
            {isHost ? 'Share this code' : 'Connected to room'}
          </p>
          <div className={styles.codeContainer}>
            <span className={styles.code}>{activeRoomCode}</span>
          </div>

          {/* Share Buttons (only for host) */}
          {isHost && (
            <>
              <div className={styles.shareButtons}>
                <button
                  onClick={handleShareLink}
                  className={styles.shareButton}
                  aria-label={copiedLink ? 'Link copied!' : 'Share link'}
                >
                  {copiedLink ? <CheckIcon /> : <ShareIcon />}
                  <span>{copiedLink ? 'Link copied!' : 'Share Link'}</span>
                </button>
                <button
                  onClick={handleCopyCode}
                  className={styles.copyCodeButton}
                  aria-label={copied ? 'Code copied!' : 'Copy code'}
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  <span>{copied ? 'Code copied!' : 'Copy Code'}</span>
                </button>
              </div>

              {/* QR Code Button */}
              <button
                onClick={handleToggleQRCode}
                className={styles.qrButton}
                aria-label={showQRCode ? 'Hide visual code' : 'Show visual code'}
                aria-expanded={showQRCode}
              >
                <QRCodeIcon />
                <span>{showQRCode ? 'Hide Visual Code' : 'Show Visual Code'}</span>
              </button>

              {/* QR Code Display */}
              {showQRCode && (
                <div className={styles.qrCodeContainer}>
                  <div className={styles.qrCodeWrapper}>
                    <img
                      src={generateEnhancedVisualCodeDataURL(
                        `${typeof window !== 'undefined' ? window.location.origin : ''}/transfer?room=${activeRoomCode}`,
                        { size: 256, gridSize: 12, colorScheme: 'monochrome' }
                      )}
                      alt={`Visual code for room ${activeRoomCode}`}
                      className={styles.qrCodeImage}
                    />
                  </div>
                  <p className={styles.qrCodeHint}>
                    Scan or share this visual code to join the room
                  </p>
                  <button
                    onClick={handleDownloadQRCode}
                    className={styles.downloadButton}
                    aria-label="Download visual code"
                  >
                    <DownloadIcon />
                    <span>Download</span>
                  </button>
                </div>
              )}
            </>
          )}

          <p className={styles.codeHint}>
            {memberCount > 1
              ? `${memberCount} member${memberCount !== 1 ? 's' : ''} connected`
              : 'Waiting for other devices to connect...'}
          </p>
        </div>

        {/* Members List */}
        {members.length > 0 && (
          <div className={styles.membersList}>
            <h3 className={styles.membersTitle}>Room Members</h3>
            <div className={styles.members}>
              {members.map((member) => (
                <div key={member.id} className={styles.member}>
                  <div className={styles.memberAvatar}>
                    {member.deviceName.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>
                      {member.deviceName}
                      {member.isOwner && (
                        <span className={styles.hostBadge}>Host</span>
                      )}
                    </div>
                    <div className={styles.memberStatus}>
                      <span className={`${styles.statusDot} ${member.isOnline ? styles.online : styles.offline}`} />
                      {member.isOnline ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Quality */}
        {connectionStatus === 'in-room' && (
          <div className={styles.connectionStatus}>
            <ConnectionQualityIcon />
            <span>Connected via signaling server</span>
          </div>
        )}

        <button onClick={handleCancel} className={styles.backButton}>
          {isHost ? 'Close Room' : 'Leave Room'}
        </button>

        {selectedFiles.length > 0 && (
          <p className={styles.fileCount}>
            {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to send
          </p>
        )}
      </div>
    );
  }

  // Show join/create view
  return (
    <div className={styles.container}>
      {mode === 'join' ? (
        <>
          <div className={styles.inputSection}>
            <label htmlFor="roomCode" className={styles.label}>
              Enter Room Code
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="roomCode"
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                placeholder="ABC123"
                maxLength={16}
                className={styles.input}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="characters"
                disabled={isJoining}
              />
              <button
                onClick={handleJoin}
                disabled={roomCode.trim().length < 4 || isJoining}
                className={styles.joinButton}
              >
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
            {!error && (
              <p className={styles.hint}>
                Enter the code shared by another device
              </p>
            )}
          </div>

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <button
            onClick={handleCreateRoom}
            className={styles.createButton}
            disabled={isCreating}
          >
            <CreateIcon />
            <span>{isCreating ? 'Creating...' : 'Create a Room'}</span>
          </button>

          {selectedFiles.length > 0 && (
            <p className={styles.fileCount}>
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} ready to send
            </p>
          )}
        </>
      ) : (
        <>
          <div className={styles.codeDisplay}>
            <p className={styles.codeLabel}>Share this code</p>
            <div className={styles.codeContainer}>
              <span className={styles.code}>{activeRoomCode || 'LOADING'}</span>
              <button
                onClick={handleCopyCode}
                className={styles.copyButton}
                aria-label={copied ? 'Copied!' : 'Copy code'}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
            </div>
            <p className={styles.codeHint}>
              Waiting for another device to connect...
            </p>
          </div>

          <div className={styles.waiting}>
            <div className={styles.spinner} />
            <span>Listening for connections</span>
          </div>

          <button onClick={handleCancel} className={styles.backButton}>
            Cancel
          </button>
        </>
      )}

      {/* Connection error from store */}
      {connectionError && (
        <div className={styles.errorBanner}>
          <WarningIcon />
          <span>{connectionError}</span>
        </div>
      )}
    </div>
  );
}

// Icons
function CreateIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function ConnectionQualityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9z" />
      <path d="M5 13l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
      <path d="M9 17l3 3 3-3a4.24 4.24 0 0 0-6 0z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function QRCodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <path d="M14 14h1" />
      <path d="M15 14v1" />
      <path d="M14 15h1" />
      <path d="M19 14h2" />
      <path d="M14 19h2" />
      <path d="M21 14v2" />
      <path d="M21 19h-2" />
      <path d="M19 21v-2" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
