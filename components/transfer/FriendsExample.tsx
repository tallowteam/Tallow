'use client';

/**
 * FriendsExample Component
 *
 * Example integration showing how to use the Friends system
 * in a transfer workflow.
 */

import { useState } from 'react';
import { FriendsList } from './FriendsList';
import { useFriendsStore, type Friend } from '@/lib/stores/friends-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import styles from './FriendsExample.module.css';

export function FriendsExample() {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  const {
    friends,
    getOnlineFriends,
    getTrustedFriends,
    getFriendsCount,
  } = useFriendsStore();

  const onlineFriends = getOnlineFriends();
  const trustedFriends = getTrustedFriends();
  const totalFriends = getFriendsCount();

  const handleSelectFriend = (friend: Friend) => {
    setSelectedFriend(friend);
    setShowTransferDialog(true);
  };

  const handleStartTransfer = () => {
    if (!selectedFriend) {return;}

    console.log('Starting transfer to:', selectedFriend.name);
    // Implement actual transfer logic here
    // - Open file picker
    // - Create transfer
    // - Auto-accept if trusted
    // - Show progress

    setShowTransferDialog(false);
    setSelectedFriend(null);
  };

  return (
    <div className={styles.container}>
      {/* Header with Stats */}
      <div className={styles.header}>
        <h1 className={styles.title}>Friends System Example</h1>
        <div className={styles.stats}>
          <Card className={styles.statCard}>
            <div className={styles.statValue}>{totalFriends}</div>
            <div className={styles.statLabel}>Total Friends</div>
          </Card>
          <Card className={styles.statCard}>
            <div className={styles.statValue}>{onlineFriends.length}</div>
            <div className={styles.statLabel}>Online</div>
          </Card>
          <Card className={styles.statCard}>
            <div className={styles.statValue}>{trustedFriends.length}</div>
            <div className={styles.statLabel}>Trusted</div>
          </Card>
        </div>
      </div>

      {/* Friends List */}
      <div className={styles.content}>
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Friends</h2>
          <p className={styles.sectionDescription}>
            Add friends to quickly send files without entering codes every time.
            Mark friends as trusted to automatically accept transfers.
          </p>
          <FriendsList onSelectFriend={handleSelectFriend} />
        </div>

        {/* Selected Friend Panel */}
        {selectedFriend && showTransferDialog && (
          <div className={styles.transferDialog}>
            <Card className={styles.dialogCard}>
              <h3 className={styles.dialogTitle}>
                Send files to {selectedFriend.name}
              </h3>
              <div className={styles.dialogContent}>
                <div className={styles.friendPreview}>
                  <div className={styles.friendAvatar}>
                    {selectedFriend.avatar ? (
                      <img src={selectedFriend.avatar} alt={selectedFriend.name} width={48} height={48} loading="lazy" />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {selectedFriend.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.friendInfo}>
                    <div className={styles.friendName}>{selectedFriend.name}</div>
                    <div className={styles.friendStatus}>
                      {selectedFriend.isOnline ? (
                        <span className={styles.online}>● Online</span>
                      ) : (
                        <span className={styles.offline}>○ Offline</span>
                      )}
                    </div>
                    {selectedFriend.isTrusted && (
                      <div className={styles.trustedBadge}>
                        ✓ Trusted - Auto-accept enabled
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.transferInfo}>
                  <p className={styles.infoText}>
                    {selectedFriend.isTrusted
                      ? 'Files will be accepted automatically'
                      : `${selectedFriend.name} will need to accept the transfer`}
                  </p>
                  {selectedFriend.transferCount > 0 && (
                    <p className={styles.transferHistory}>
                      Previous transfers: {selectedFriend.transferCount}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.dialogActions}>
                <Button
                  onClick={() => {
                    setShowTransferDialog(false);
                    setSelectedFriend(null);
                  }}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleStartTransfer}
                  variant="primary"
                  disabled={!selectedFriend.isOnline}
                >
                  {selectedFriend.isOnline ? 'Select Files' : 'Friend Offline'}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className={styles.instructions}>
        <Card>
          <h3 className={styles.instructionsTitle}>How to Use</h3>
          <ol className={styles.instructionsList}>
            <li>
              <strong>Add Friends:</strong> Click "Generate Pairing Code" and share
              the 6-digit code with your friend. They'll enter it on their device.
            </li>
            <li>
              <strong>Or Enter Code:</strong> If your friend generated a code, click
              "Enter Friend's Code" and type their 6-digit code.
            </li>
            <li>
              <strong>Send Files:</strong> Click on any online friend to start
              sending files instantly.
            </li>
            <li>
              <strong>Trust Friends:</strong> Mark trusted friends to automatically
              accept transfers without confirmation.
            </li>
          </ol>
        </Card>
      </div>

      {/* Debug Info (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className={styles.debug}>
          <details>
            <summary>Debug Info (Dev Only)</summary>
            <pre className={styles.debugContent}>
              {JSON.stringify(
                {
                  totalFriends,
                  onlineCount: onlineFriends.length,
                  trustedCount: trustedFriends.length,
                  selectedFriend: selectedFriend?.name || 'none',
                  friends: friends.map(f => ({
                    id: f.id,
                    name: f.name,
                    isOnline: f.isOnline,
                    isTrusted: f.isTrusted,
                  })),
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}
