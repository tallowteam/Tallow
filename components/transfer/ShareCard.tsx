'use client';

import { useState } from 'react';
import styles from './sharecard.module.css';

export default function ShareCard() {
  const [copied, setCopied] = useState(false);
  const connectionCode = '847-293';
  const shareLink = `https://tallow.app/connect/${connectionCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(connectionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const handleQRCode = () => {
    // QR code modal would open here
  };

  const handleEmail = () => {
    // Email share would open here
    const subject = encodeURIComponent('Join my Tallow transfer');
    const body = encodeURIComponent(`Connect to my Tallow transfer using code: ${connectionCode}\n\nOr click: ${shareLink}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.label}>Share your connection</h3>

      <div className={styles.codeSection}>
        <div className={styles.codeDisplay}>
          <span className={styles.code}>{connectionCode}</span>
          <button
            className={styles.copyButton}
            onClick={handleCopyCode}
            aria-label="Copy connection code"
          >
            {copied ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
        <p className={styles.codeHint}>Share this code with your peer</p>
      </div>

      <div className={styles.qrSection}>
        <div className={styles.qrPlaceholder}>
          <div className={styles.qrPattern}>
            <div className={styles.qrCorner} style={{ top: '8px', left: '8px' }} />
            <div className={styles.qrCorner} style={{ top: '8px', right: '8px' }} />
            <div className={styles.qrCorner} style={{ bottom: '8px', left: '8px' }} />
            <div className={styles.qrDots}>
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={styles.qrDot} />
              ))}
            </div>
          </div>
          <span className={styles.qrLabel}>QR Code</span>
        </div>
      </div>

      <div className={styles.shareOptions}>
        <button className={styles.shareButton} onClick={handleCopyLink} aria-label="Copy share link">
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
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy Link
        </button>
        <button className={styles.shareButton} onClick={handleQRCode} aria-label="Show QR code">
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
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          QR Code
        </button>
        <button className={styles.shareButton} onClick={handleEmail} aria-label="Share via email">
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
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          Email
        </button>
      </div>

      <div className={styles.status}>
        <div className={styles.statusDot} />
        <span className={styles.statusText}>Waiting for peer to connect...</span>
      </div>
    </div>
  );
}
