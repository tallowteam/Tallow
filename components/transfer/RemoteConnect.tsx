'use client';

import { useState } from 'react';
import styles from './RemoteConnect.module.css';

interface RemoteConnectProps {
  roomCode: string | null;
  isConnected: boolean;
  members: Array<{ id: string; name: string; platform: string; isOnline: boolean }>;
  onJoinRoom: (code: string) => void;
  onCreateRoom: () => void;
  onLeaveRoom: () => void;
  onCopyCode: () => void;
  onShareLink: () => void;
  error: string | null;
}

export function RemoteConnect(props: RemoteConnectProps) {
  const {
    roomCode,
    isConnected,
    members,
    onJoinRoom,
    onCreateRoom,
    onLeaveRoom,
    onCopyCode,
    onShareLink,
    error,
  } = props;

  const [joinCode, setJoinCode] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleJoinCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length <= 6) {
      setJoinCode(value);
    }
  };

  const handleJoinClick = () => {
    if (joinCode.length === 6) {
      onJoinRoom(joinCode);
    }
  };

  const handleCopyCode = () => {
    onCopyCode();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Not connected state
  if (!isConnected || !roomCode) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>Remote Connection</h2>
          <p className={styles.subtitle}>
            Connect with devices over the internet using room codes
          </p>

          {error && (
            <div className={styles.errorBanner} role="alert">
              <svg
                className={styles.errorIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M10 6V10M10 14H10.01"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              {error}
            </div>
          )}

          <div className={styles.options}>
            {/* Create Room */}
            <div className={styles.option}>
              <div className={styles.optionIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 10V22M10 16H22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className={styles.optionTitle}>Create a Room</h3>
              <p className={styles.optionDescription}>
                Generate a room code and share it with others
              </p>
              <button
                className={styles.createButton}
                onClick={onCreateRoom}
                type="button"
              >
                Create Room
              </button>
            </div>

            {/* Divider */}
            <div className={styles.divider}>
              <span className={styles.dividerText}>or</span>
            </div>

            {/* Join Room */}
            <div className={styles.option}>
              <div className={styles.optionIcon}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 28C22.6274 28 28 22.6274 28 16C28 9.37258 22.6274 4 16 4C9.37258 4 4 9.37258 4 16C4 22.6274 9.37258 28 16 28Z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 16L16 20L22 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h3 className={styles.optionTitle}>Join a Room</h3>
              <p className={styles.optionDescription}>
                Enter a room code to connect
              </p>
              <div className={styles.joinInputWrapper}>
                <input
                  type="text"
                  className={styles.codeInput}
                  value={joinCode}
                  onChange={handleJoinCodeChange}
                  placeholder="ABC123"
                  maxLength={6}
                  aria-label="Room code"
                />
              </div>
              <button
                className={styles.joinButton}
                onClick={handleJoinClick}
                disabled={joinCode.length !== 6}
                type="button"
              >
                Join Room
              </button>
            </div>
          </div>

          {/* QR Code Section */}
          <div className={styles.qrSection}>
            <button
              className={styles.qrButton}
              onClick={() => setShowQRScanner(!showQRScanner)}
              type="button"
            >
              <svg
                className={styles.qrIcon}
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
              >
                <path
                  d="M2 5C2 3.34315 3.34315 2 5 2H7V7H2V5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M13 2H15C16.6569 2 18 3.34315 18 5V7H13V2Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M18 13V15C18 16.6569 16.6569 18 15 18H13V13H18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 18H5C3.34315 18 2 16.6569 2 15V13H7V18Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              Scan QR Code
            </button>

            {showQRScanner && (
              <div className={styles.qrPlaceholder}>
                <svg
                  className={styles.qrPlaceholderIcon}
                  width="64"
                  height="64"
                  viewBox="0 0 64 64"
                  fill="none"
                >
                  <path
                    d="M8 16C8 11.5817 11.5817 8 16 8H20V20H8V16Z"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M44 8H48C52.4183 8 56 11.5817 56 16V20H44V8Z"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M56 44V48C56 52.4183 52.4183 56 48 56H44V44H56Z"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    d="M20 56H16C11.5817 56 8 52.4183 8 48V44H20V56Z"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                </svg>
                <p className={styles.qrPlaceholderText}>
                  QR code scanning coming soon
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Connected</h2>
        <p className={styles.subtitle}>Share this room code with others to join</p>

        {error && (
          <div className={styles.errorBanner} role="alert">
            <svg
              className={styles.errorIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 6V10M10 14H10.01"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Room Code Display */}
        <div className={styles.connectedSection}>
          <div className={styles.codeDisplay}>
            <label className={styles.codeLabel}>Room Code</label>
            <div className={styles.codeWrapper}>
              <span className={styles.codeText}>{roomCode}</span>
              <button
                className={styles.copyButton}
                onClick={handleCopyCode}
                type="button"
                aria-label="Copy room code"
              >
                {copied ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M16 6L8 14L4 10"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect
                      x="7"
                      y="7"
                      width="10"
                      height="10"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3 13V5C3 3.89543 3.89543 3 5 3H13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            className={styles.shareButton}
            onClick={onShareLink}
            type="button"
          >
            <svg
              className={styles.shareIcon}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
            >
              <path
                d="M10 12V3M10 3L7 6M10 3L13 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 12V15C16 16.1046 15.1046 17 14 17H6C4.89543 17 4 16.1046 4 15V12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            Share Link
          </button>
        </div>

        {/* Connected Members */}
        {members.length > 0 && (
          <div className={styles.membersSection}>
            <h3 className={styles.membersTitle}>
              Connected Members ({members.length})
            </h3>
            <ul className={styles.membersList}>
              {members.map((member) => (
                <li key={member.id} className={styles.memberItem}>
                  <div className={styles.memberAvatar}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{member.name}</div>
                    <div className={styles.memberPlatform}>
                      {member.platform}
                    </div>
                  </div>
                  <div
                    className={`${styles.memberStatus} ${
                      member.isOnline ? styles.memberStatusOnline : ''
                    }`}
                  >
                    {member.isOnline ? 'Online' : 'Offline'}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Leave Room */}
        <button
          className={styles.leaveButton}
          onClick={onLeaveRoom}
          type="button"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
