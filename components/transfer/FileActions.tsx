'use client';

import { useState } from 'react';
import { Transfer } from '@/lib/types';
import { useWebShare } from '@/lib/hooks/use-web-share';
import { Download, Share, Trash } from '@/components/icons';
import { ConfirmDialog, DeleteIcon } from '@/components/ui/ConfirmDialog';
import styles from './FileActions.module.css';

export interface FileActionsProps {
  /** Transfer item to show actions for */
  transfer: Transfer;
  /** Callback when Open/Download is clicked */
  onOpen?: (transfer: Transfer) => void;
  /** Callback when Share is clicked (optional - uses Web Share API by default) */
  onShare?: (transfer: Transfer) => void;
  /** Callback when Delete is clicked */
  onDelete?: (transfer: Transfer) => void;
  /** Show as mobile menu (collapsed) */
  mobileMenu?: boolean;
}

export function FileActions({
  transfer,
  onOpen,
  onShare,
  onDelete,
  mobileMenu = false,
}: FileActionsProps) {
  const { share, canShare } = useWebShare();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleOpen = () => {
    onOpen?.(transfer);
    setShowMobileMenu(false);
  };

  const handleShare = async () => {
    if (onShare) {
      onShare(transfer);
    } else if (canShare) {
      // Use Web Share API
      const fileNames = transfer.files.map((f) => f.name).join(', ');
      await share({
        title: 'Shared File',
        text: `Check out ${fileNames}`,
      });
    }
    setShowMobileMenu(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    setShowMobileMenu(false);
  };

  const confirmDelete = () => {
    onDelete?.(transfer);
    setShowDeleteDialog(false);
  };

  // Only show actions for completed received transfers
  if (transfer.status !== 'completed' || transfer.direction !== 'receive') {
    return null;
  }

  // Mobile menu (three-dot menu)
  if (mobileMenu) {
    return (
      <>
        <div className={styles.mobileMenuContainer}>
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className={styles.mobileMenuButton}
            aria-label="File actions"
            aria-expanded={showMobileMenu}
          >
            <MoreIcon />
          </button>

          {showMobileMenu && (
            <>
              <div
                className={styles.backdrop}
                onClick={() => setShowMobileMenu(false)}
              />
              <div className={styles.mobileMenu}>
                <button onClick={handleOpen} className={styles.menuItem}>
                  <Download className={styles.menuIcon} />
                  <span>Open</span>
                </button>
                {(canShare || onShare) && (
                  <button onClick={handleShare} className={styles.menuItem}>
                    <Share className={styles.menuIcon} />
                    <span>Share</span>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className={`${styles.menuItem} ${styles.menuItemDanger}`}
                >
                  <Trash className={styles.menuIcon} />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>

        <ConfirmDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete from history?"
          description={
            <span>
              This will remove <strong>{transfer.files[0]?.name}</strong> from your transfer
              history. This action cannot be undone.
            </span>
          }
          confirmText="Delete"
          cancelText="Cancel"
          destructive
          icon={<DeleteIcon />}
        />
      </>
    );
  }

  // Desktop actions (inline buttons)
  return (
    <>
      <div className={styles.actions}>
        <button
          onClick={handleOpen}
          className={styles.actionButton}
          aria-label="Open file"
          title="Open file"
        >
          <Download />
        </button>
        {(canShare || onShare) && (
          <button
            onClick={handleShare}
            className={styles.actionButton}
            aria-label="Share file"
            title="Share file"
          >
            <Share />
          </button>
        )}
        <button
          onClick={handleDelete}
          className={`${styles.actionButton} ${styles.actionButtonDanger}`}
          aria-label="Delete from history"
          title="Delete from history"
        >
          <Trash />
        </button>
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete from history?"
        description={
          <span>
            This will remove <strong>{transfer.files[0]?.name}</strong> from your transfer
            history. This action cannot be undone.
          </span>
        }
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        icon={<DeleteIcon />}
      />
    </>
  );
}

// More icon (three dots)
function MoreIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );
}
