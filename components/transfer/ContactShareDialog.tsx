'use client';

/**
 * ContactShareDialog Component
 *
 * Modal dialog for sharing a specific contact.
 * Shows contact info, shareable link, and copy/share actions.
 */

import { useState, useCallback, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Friend } from '@/lib/stores/friends-store';
import {
  generateShareableLink,
  copyShareableLink,
  shareContactNative,
  generateQRCodeData,
} from '@/lib/contacts/contact-export';
import styles from './ContactShareDialog.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface ContactShareDialogProps {
  /** Friend to share */
  friend: Friend;
  /** Whether dialog is open */
  open: boolean;
  /** Callback when dialog closes */
  onClose: () => void;
}

// ============================================================================
// PLATFORM ICONS
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

export function ContactShareDialog({ friend, open, onClose }: ContactShareDialogProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'qr'>('link');
  const [canShare, setCanShare] = useState(false);

  // Generate share link on mount
  useEffect(() => {
    if (open && friend) {
      const link = generateShareableLink(friend.id);
      const qr = generateQRCodeData(friend.id);
      setShareLink(link);
      setQrData(qr);

      // Check if Web Share API is available
      if (typeof navigator.share === 'function') {
        setCanShare(true);
      }
    }
  }, [open, friend]);

  // Handle copy link
  const handleCopyLink = useCallback(async () => {
    if (!friend) {return;}

    const success = await copyShareableLink(friend.id);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  }, [friend]);

  // Handle native share
  const handleNativeShare = useCallback(async () => {
    if (!friend) {return;}

    await shareContactNative(friend.id);
  }, [friend]);

  if (!friend || !shareLink) {
    return null;
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Contact" size="md">
      <div className={styles.content}>
        {/* Contact Info */}
        <div className={styles.contactInfo}>
          <div className={styles.contactAvatar}>
            {friend.avatar ? (
              <img src={friend.avatar} alt={friend.name} width={48} height={48} loading="lazy" />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {friend.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className={styles.contactDetails}>
            <h3 className={styles.contactName}>{friend.name}</h3>
            <div className={styles.contactMeta}>
              <span className={styles.contactPlatform}>
                {PLATFORM_ICONS[friend.platform] || '💻'} {friend.platform}
              </span>
              {friend.isTrusted && (
                <span className={styles.trustedBadge}>⭐ Favorite</span>
              )}
            </div>
            {friend.transferCount > 0 && (
              <div className={styles.contactStats}>
                {friend.transferCount} transfer{friend.transferCount !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Share Method Tabs */}
        <div className={styles.shareTabs}>
          <button
            className={`${styles.shareTab} ${shareMethod === 'link' ? styles.shareTabActive : ''}`}
            onClick={() => setShareMethod('link')}
          >
            Share Link
          </button>
          <button
            className={`${styles.shareTab} ${shareMethod === 'qr' ? styles.shareTabActive : ''}`}
            onClick={() => setShareMethod('qr')}
          >
            QR Code
          </button>
        </div>

        {/* Share Link View */}
        {shareMethod === 'link' && (
          <div className={styles.shareLinkContent}>
            <p className={styles.instructions}>
              Share this link with others to let them add {friend.name} to their contacts.
            </p>

            <div className={styles.linkDisplay}>
              <input
                type="text"
                value={shareLink}
                readOnly
                className={styles.linkInput}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className={styles.shareActions}>
              <Button
                onClick={handleCopyLink}
                variant="primary"
                disabled={copySuccess}
              >
                {copySuccess ? '✓ Copied!' : 'Copy Link'}
              </Button>
              {canShare && (
                <Button onClick={handleNativeShare} variant="secondary">
                  Share via...
                </Button>
              )}
            </div>
          </div>
        )}

        {/* QR Code View */}
        {shareMethod === 'qr' && qrData && (
          <div className={styles.qrCodeContent}>
            <p className={styles.instructions}>
              Scan this QR code to add {friend.name} to contacts.
            </p>

            <div className={styles.qrCodeDisplay}>
              <QRCodePlaceholder data={qrData} />
            </div>

            <p className={styles.qrHint}>
              In production, use a QR code library like 'qrcode.react' or 'qr-code-styling'
            </p>
          </div>
        )}

        {/* Footer */}
        <div className={styles.footer}>
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * QR Code Placeholder
 * In production, replace with a proper QR code library
 */
function QRCodePlaceholder({ data: _data }: { data: string }) {
  return (
    <div className={styles.qrPlaceholder}>
      <svg viewBox="0 0 200 200" className={styles.qrSvg}>
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
          <rect x="70" y="100" width="10" height="10" fill="black" />
          <rect x="90" y="120" width="10" height="10" fill="black" />
          <rect x="110" y="140" width="10" height="10" fill="black" />
        </g>
        <text x="100" y="105" textAnchor="middle" fontSize="8" fill="#666">
          SCAN ME
        </text>
      </svg>
    </div>
  );
}
