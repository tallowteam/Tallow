'use client';

/**
 * FriendsList Component
 *
 * Displays and manages friends/contacts for simplified device pairing.
 * Features:
 * - List of paired friends with online status
 * - Add friend via pairing code
 * - Enter friend's code to pair
 * - Remove friends with confirmation
 * - Empty state for new users
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useFriendsStore, type Friend } from '@/lib/stores/friends-store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ContactShareDialog } from './ContactShareDialog';
import {
  downloadContactsJSON,
  importContactsFromFile,
  type ImportResult,
} from '@/lib/contacts/contact-export';
import styles from './FriendsList.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface FriendsListProps {
  /** Callback when a friend is selected for transfer */
  onSelectFriend?: (friend: Friend) => void;
  /** Selected files for transfer */
  selectedFiles?: File[];
  /** Show compact view */
  compact?: boolean;
  /** Maximum number of friends to display */
  limit?: number;
  /** Custom CSS class */
  className?: string;
}

// ============================================================================
// PLATFORM ICONS (Text-based)
// ============================================================================

const PLATFORM_ICONS: Record<string, string> = {
  windows: '🪟',
  macos: '🍎',
  linux: '🐧',
  android: '🤖',
  ios: '📱',
  web: '🌐',
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FriendsList({
  onSelectFriend,
  selectedFiles = [],
  compact = false,
  limit,
  className,
}: FriendsListProps) {
  const {
    friends,
    addFriendByCode,
    removeFriend,
    toggleFavorite,
    generatePairingCode,
    cancelPairingSession,
    currentPairingSession,
    getOnlineFriends,
  } = useFriendsStore();

  // Local state
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'my-code' | 'enter-code'>('my-code');
  const [enteredCode, setEnteredCode] = useState('');
  const [enteredName, setEnteredName] = useState('');
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareDialogFriend, setShareDialogFriend] = useState<Friend | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportResult, setShowImportResult] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Display friends (apply limit if provided)
  const displayFriends = limit ? friends.slice(0, limit) : friends;
  const onlineFriends = getOnlineFriends();
  const hasFiles = selectedFiles.length > 0;

  // Generate pairing code when modal opens
  useEffect(() => {
    if (showAddModal && !currentPairingSession) {
      generatePairingCode();
    }
  }, [showAddModal, currentPairingSession, generatePairingCode]);

  // Auto-refresh pairing code every 30 seconds
  useEffect(() => {
    if (!currentPairingSession) {return;}

    const interval = setInterval(() => {
      const now = Date.now();
      if (now > currentPairingSession.expiresAt) {
        generatePairingCode();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPairingSession, generatePairingCode]);

  // Handle friend selection
  const handleSelectFriend = useCallback(
    (friend: Friend) => {
      if (onSelectFriend) {
        onSelectFriend(friend);
      }
    },
    [onSelectFriend]
  );

  // Handle add friend via code
  const handleAddFriendByCode = useCallback(() => {
    setError(null);

    if (!enteredCode || enteredCode.length !== 8) {
      setError('Please enter a valid 8-character code');
      return;
    }

    if (!enteredName.trim()) {
      setError('Please enter a name for your friend');
      return;
    }

    // In production, this would make an API call to validate and pair
    addFriendByCode(enteredCode, enteredName, 'web');
    setShowAddModal(false);
    setActiveTab('my-code');
    setEnteredCode('');
    setEnteredName('');
  }, [enteredCode, enteredName, addFriendByCode]);

  // Handle remove friend
  const handleRemoveFriend = useCallback(() => {
    if (friendToRemove) {
      removeFriend(friendToRemove.id);
      setFriendToRemove(null);
    }
  }, [friendToRemove, removeFriend]);

  // Handle close add modal
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setActiveTab('my-code');
    setEnteredCode('');
    setEnteredName('');
    setError(null);
    setCopySuccess(false);
    cancelPairingSession();
  }, [cancelPairingSession]);

  // Handle copy code to clipboard
  const handleCopyCode = useCallback(() => {
    if (!currentPairingSession) {return;}

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(currentPairingSession.code).then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      });
    }
  }, [currentPairingSession]);

  // Handle export contacts
  const handleExportContacts = useCallback(() => {
    downloadContactsJSON();
  }, []);


  // Handle import contacts
  const handleImportContacts = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    try {
      const result = await importContactsFromFile(file);
      setImportResult(result);
      setShowImportResult(true);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        imported: 0,
        skipped: 0,
        errors: ['Failed to import contacts'],
        duplicates: [],
      });
      setShowImportResult(true);
    }
  }, []);

  // Handle share contact
  const handleShareContact = useCallback((friend: Friend) => {
    setShareDialogFriend(friend);
  }, []);

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) {return 'just now';}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ago`;}
    if (seconds < 86400) {return `${Math.floor(seconds / 3600)}h ago`;}
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Format remaining time
  const formatRemainingTime = (expiresAt: number): string => {
    const seconds = Math.floor((expiresAt - Date.now()) / 1000);
    if (seconds <= 0) {return '0:00';}
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Empty state
  if (friends.length === 0) {
    return (
      <div className={`${styles.container} ${className || ''}`}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3 className={styles.emptyTitle}>No friends yet</h3>
          <p className={styles.emptyDescription}>
            Add friends to quickly send files without entering codes every time.
          </p>
          <div className={styles.emptyActions}>
            <Button onClick={() => setShowAddModal(true)} variant="primary">
              Generate Pairing Code
            </Button>
            <Button onClick={() => { setActiveTab('enter-code'); setShowAddModal(true); }} variant="secondary">
              Enter Friend's Code
            </Button>
          </div>
        </div>

        {/* Add Friend Modal */}
        {showAddModal && (
          <Modal
            open={showAddModal}
            onClose={handleCloseAddModal}
            title="Add Friend"
            size="md"
          >
            <div className={styles.modalContent}>
              {/* Tabs */}
              <div className={styles.modalTabs}>
                <button
                  className={`${styles.modalTab} ${activeTab === 'my-code' ? styles.modalTabActive : ''}`}
                  onClick={() => {
                    setActiveTab('my-code');
                    setError(null);
                    if (!currentPairingSession) {
                      generatePairingCode();
                    }
                  }}
                >
                  My Code
                </button>
                <button
                  className={`${styles.modalTab} ${activeTab === 'enter-code' ? styles.modalTabActive : ''}`}
                  onClick={() => {
                    setActiveTab('enter-code');
                    setError(null);
                  }}
                >
                  Enter Code
                </button>
              </div>

              {/* My Code Tab */}
              {activeTab === 'my-code' && currentPairingSession && (
                <div className={styles.pairingContent}>
                  <p className={styles.pairingInstructions}>
                    Share this code with your friend. They'll enter it on their device to pair.
                  </p>
                  <div className={styles.pairingCodeDisplay}>
                    <div className={styles.pairingCode}>{currentPairingSession.code}</div>
                    <div className={styles.pairingExpiry}>
                      Expires in {formatRemainingTime(currentPairingSession.expiresAt)}
                    </div>
                  </div>

                  {/* QR Code Placeholder */}
                  <div className={styles.qrCodeSection}>
                    <div className={styles.qrCodePlaceholder}>
                      <QRCodePlaceholder code={currentPairingSession.code} />
                    </div>
                    <p className={styles.qrCodeLabel}>Scan to pair</p>
                  </div>

                  <div className={styles.pairingFooter}>
                    <Button
                      onClick={handleCopyCode}
                      variant="secondary"
                      disabled={copySuccess}
                    >
                      {copySuccess ? '✓ Copied!' : 'Copy Code'}
                    </Button>
                    <Button onClick={() => generatePairingCode()} variant="secondary">
                      Generate New
                    </Button>
                  </div>
                </div>
              )}

              {/* Enter Code Tab */}
              {activeTab === 'enter-code' && (
                <div className={styles.enterCodeContent}>
                  <p className={styles.enterCodeInstructions}>
                    Enter the 8-character code your friend shared with you.
                  </p>
                  <Input
                    type="text"
                    placeholder="XXXXXXXX"
                    value={enteredCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                      setEnteredCode(value);
                      setError(null);
                    }}
                    maxLength={8}
                    className={styles.codeInput}
                    autoFocus
                  />
                  <Input
                    type="text"
                    placeholder="Friend's name"
                    value={enteredName}
                    onChange={(e) => {
                      setEnteredName(e.target.value);
                      setError(null);
                    }}
                    className={styles.nameInput}
                  />
                  {error && <div className={styles.error}>{error}</div>}
                  <div className={styles.enterCodeFooter}>
                    <Button onClick={handleCloseAddModal} variant="secondary">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddFriendByCode}
                      variant="primary"
                      disabled={enteredCode.length !== 8 || !enteredName.trim()}
                    >
                      Add Friend
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // Friends list view
  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className || ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h3 className={styles.title}>Friends</h3>
          <span className={styles.count}>
            {onlineFriends.length} of {friends.length} online
          </span>
        </div>
        <div className={styles.headerActions}>
          <Button
            onClick={handleExportContacts}
            variant="secondary"
            size="sm"
            title="Export contacts as JSON"
          >
            Export
          </Button>
          <Button
            onClick={handleImportContacts}
            variant="secondary"
            size="sm"
            title="Import contacts from JSON"
          >
            Import
          </Button>
          <Button
            onClick={() => setShowAddModal(true)}
            variant="secondary"
            size="sm"
          >
            Add Friend
          </Button>
        </div>
      </div>

      {/* Friends List */}
      <div className={styles.friendsList}>
        {displayFriends.map((friend) => (
          <div
            key={friend.id}
            className={`${styles.friendCard} ${friend.isOnline ? styles.online : styles.offline} ${
              !friend.isOnline || !hasFiles ? styles.disabled : ''
            }`}
          >
            <div className={styles.friendAvatar}>
              {friend.avatar ? (
                <img src={friend.avatar} alt={friend.name} width={40} height={40} loading="lazy" />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {friend.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className={`${styles.onlineIndicator} ${friend.isOnline ? styles.online : ''}`} />
            </div>

            <div className={styles.friendInfo}>
              <div className={styles.friendHeader}>
                <span className={styles.friendName}>{friend.name}</span>
                <span className={styles.friendPlatform}>
                  {PLATFORM_ICONS[friend.platform] || '💻'}
                </span>
              </div>
              <div className={styles.friendMeta}>
                <span className={styles.friendStatus}>
                  {friend.isOnline ? (
                    <>
                      <span className={styles.onlineDot} />
                      Online
                    </>
                  ) : (
                    `Last seen ${formatTimeAgo(friend.lastSeen)}`
                  )}
                </span>
                {friend.isTrusted && (
                  <span className={styles.trustedBadge} title="Favorite - Auto-accept enabled">
                    ⭐ Favorite
                  </span>
                )}
              </div>
              {friend.transferCount > 0 && (
                <div className={styles.friendStats}>
                  {friend.transferCount} transfer{friend.transferCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>

            <div className={styles.friendActions}>
              {friend.isOnline && hasFiles && (
                <button
                  className={`${styles.actionButton} ${styles.quickSendButton}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectFriend(friend);
                  }}
                  title="Quick send"
                >
                  <SendIcon />
                </button>
              )}
              <button
                className={`${styles.actionButton} ${styles.shareButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareContact(friend);
                }}
                title="Share contact"
              >
                <ShareIcon />
              </button>
              <button
                className={`${styles.actionButton} ${friend.isTrusted ? styles.favorited : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(friend.id);
                }}
                title={friend.isTrusted ? 'Remove from favorites' : 'Add to favorites'}
              >
                {friend.isTrusted ? '⭐' : '☆'}
              </button>
              <button
                className={`${styles.actionButton} ${styles.removeButton}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setFriendToRemove(friend);
                }}
                title="Remove friend"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Show "View All" if limit is applied */}
      {limit && friends.length > limit && (
        <div className={styles.viewAllContainer}>
          <Button variant="ghost" size="sm">
            View all {friends.length} friends
          </Button>
        </div>
      )}

      {/* Add Friend Modal (duplicate for when friends list is shown) */}
      {showAddModal && (
        <Modal
          open={showAddModal}
          onClose={handleCloseAddModal}
          title="Add Friend"
          size="md"
        >
          <div className={styles.modalContent}>
            {/* Tabs */}
            <div className={styles.modalTabs}>
              <button
                className={`${styles.modalTab} ${activeTab === 'my-code' ? styles.modalTabActive : ''}`}
                onClick={() => {
                  setActiveTab('my-code');
                  setError(null);
                  if (!currentPairingSession) {
                    generatePairingCode();
                  }
                }}
              >
                My Code
              </button>
              <button
                className={`${styles.modalTab} ${activeTab === 'enter-code' ? styles.modalTabActive : ''}`}
                onClick={() => {
                  setActiveTab('enter-code');
                  setError(null);
                }}
              >
                Enter Code
              </button>
            </div>

            {/* My Code Tab */}
            {activeTab === 'my-code' && currentPairingSession && (
              <div className={styles.pairingContent}>
                <p className={styles.pairingInstructions}>
                  Share this code with your friend. They'll enter it on their device to pair.
                </p>
                <div className={styles.pairingCodeDisplay}>
                  <div className={styles.pairingCode}>{currentPairingSession.code}</div>
                  <div className={styles.pairingExpiry}>
                    Expires in {formatRemainingTime(currentPairingSession.expiresAt)}
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className={styles.qrCodeSection}>
                  <div className={styles.qrCodePlaceholder}>
                    <QRCodePlaceholder code={currentPairingSession.code} />
                  </div>
                  <p className={styles.qrCodeLabel}>Scan to pair</p>
                </div>

                <div className={styles.pairingFooter}>
                  <Button
                    onClick={handleCopyCode}
                    variant="secondary"
                    disabled={copySuccess}
                  >
                    {copySuccess ? '✓ Copied!' : 'Copy Code'}
                  </Button>
                  <Button onClick={() => generatePairingCode()} variant="secondary">
                    Generate New
                  </Button>
                </div>
              </div>
            )}

            {/* Enter Code Tab */}
            {activeTab === 'enter-code' && (
              <div className={styles.enterCodeContent}>
                <p className={styles.enterCodeInstructions}>
                  Enter the 8-character code your friend shared with you.
                </p>
                <Input
                  type="text"
                  placeholder="XXXXXXXX"
                  value={enteredCode}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
                    setEnteredCode(value);
                    setError(null);
                  }}
                  maxLength={8}
                  className={styles.codeInput}
                  autoFocus
                />
                <Input
                  type="text"
                  placeholder="Friend's name"
                  value={enteredName}
                  onChange={(e) => {
                    setEnteredName(e.target.value);
                    setError(null);
                  }}
                  className={styles.nameInput}
                />
                {error && <div className={styles.error}>{error}</div>}
                <div className={styles.enterCodeFooter}>
                  <Button onClick={handleCloseAddModal} variant="secondary">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddFriendByCode}
                    variant="primary"
                    disabled={enteredCode.length !== 8 || !enteredName.trim()}
                  >
                    Add Friend
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Remove Friend Confirmation */}
      {friendToRemove && (
        <ConfirmDialog
          open={!!friendToRemove}
          onClose={() => setFriendToRemove(null)}
          onConfirm={handleRemoveFriend}
          title="Remove Friend"
          description={`Are you sure you want to remove ${friendToRemove.name}? This action cannot be undone.`}
          confirmText="Remove"
          cancelText="Cancel"
          destructive
        />
      )}

      {/* Contact Share Dialog */}
      {shareDialogFriend && (
        <ContactShareDialog
          friend={shareDialogFriend}
          open={!!shareDialogFriend}
          onClose={() => setShareDialogFriend(null)}
        />
      )}

      {/* Import Result Dialog */}
      {showImportResult && importResult && (
        <Modal
          open={showImportResult}
          onClose={() => {
            setShowImportResult(false);
            setImportResult(null);
          }}
          title={importResult.success ? 'Import Successful' : 'Import Failed'}
          size="md"
        >
          <div className={styles.importResultContent}>
            {importResult.success ? (
              <div className={styles.importSuccess}>
                <div className={styles.importSuccessIcon}>✓</div>
                <p className={styles.importMessage}>
                  Successfully imported {importResult.imported} contact{importResult.imported !== 1 ? 's' : ''}
                </p>
                {importResult.skipped > 0 && (
                  <p className={styles.importWarning}>
                    Skipped {importResult.skipped} duplicate{importResult.skipped !== 1 ? 's' : ''}
                  </p>
                )}
                {importResult.duplicates.length > 0 && (
                  <div className={styles.importDuplicates}>
                    <p className={styles.importDuplicatesTitle}>Duplicates:</p>
                    <ul className={styles.importDuplicatesList}>
                      {importResult.duplicates.map((name, i) => (
                        <li key={i}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.importError}>
                <div className={styles.importErrorIcon}>✕</div>
                <p className={styles.importMessage}>Failed to import contacts</p>
                {importResult.errors.length > 0 && (
                  <div className={styles.importErrors}>
                    <p className={styles.importErrorsTitle}>Errors:</p>
                    <ul className={styles.importErrorsList}>
                      {importResult.errors.map((error, i) => (
                        <li key={i}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className={styles.importResultFooter}>
              <Button
                onClick={() => {
                  setShowImportResult(false);
                  setImportResult(null);
                }}
                variant="primary"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Simple QR Code Placeholder
 * In production, use a proper QR code library like 'qrcode.react'
 */
function QRCodePlaceholder({ code }: { code: string }) {
  return (
    <svg viewBox="0 0 200 200" className={styles.qrCode}>
      <rect x="0" y="0" width="200" height="200" fill="white" />
      {/* QR code pattern simulation */}
      <rect x="10" y="10" width="50" height="50" fill="black" />
      <rect x="20" y="20" width="30" height="30" fill="white" />
      <rect x="140" y="10" width="50" height="50" fill="black" />
      <rect x="150" y="20" width="30" height="30" fill="white" />
      <rect x="10" y="140" width="50" height="50" fill="black" />
      <rect x="20" y="150" width="30" height="30" fill="white" />
      {/* Data pattern */}
      <g opacity="0.8">
        <rect x="70" y="20" width="10" height="10" fill="black" />
        <rect x="90" y="20" width="10" height="10" fill="black" />
        <rect x="110" y="20" width="10" height="10" fill="black" />
        <rect x="70" y="40" width="10" height="10" fill="black" />
        <rect x="90" y="60" width="10" height="10" fill="black" />
        <rect x="110" y="80" width="10" height="10" fill="black" />
      </g>
      <text x="100" y="105" textAnchor="middle" fontSize="10" fill="#666">
        {code}
      </text>
    </svg>
  );
}

/**
 * Send Icon
 */
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/**
 * Share Icon
 */
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
