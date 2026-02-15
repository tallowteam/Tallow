'use client';

import { useState } from 'react';
import styles from './ClipboardPanel.module.css';

interface ClipboardPanelProps {
  className?: string;
}

interface ClipboardItem {
  id: string;
  text: string;
  senderName: string;
  timestamp: Date;
}

export function ClipboardPanel(props: ClipboardPanelProps) {
  const [currentClipboard, setCurrentClipboard] = useState<string>('');
  const [receivedItems, _setReceivedItems] = useState<ClipboardItem[]>([
    {
      id: '1',
      text: 'https://example.com/some-long-url-that-was-shared',
      senderName: 'MacBook Pro',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago
    },
    {
      id: '2',
      text: 'Here is some sample text that was copied from another device. It can be multiple lines and will be truncated in the preview.',
      senderName: 'iPhone',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  ]);

  const handleSendClipboard = () => {
    // Demo: simulate sending
    console.log('Send clipboard:', currentClipboard);
  };

  const handleCopyItem = (item: ClipboardItem) => {
    // Demo: simulate copying
    console.log('Copy item:', item.text);
    setCurrentClipboard(item.text);
  };

  const formatTimestamp = (date: Date): string => {
    const now = Date.now();
    const diff = now - date.getTime();
    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const truncateText = (text: string, maxLines: number = 3): string => {
    const lines = text.split('\n');
    if (lines.length > maxLines) {
      return lines.slice(0, maxLines).join('\n') + '...';
    }
    return text;
  };

  return (
    <div className={`${styles.panel} ${props.className || ''}`}>
      <div className={styles.header}>
        <div className={styles.headerIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </div>
        <h2 className={styles.title}>Clipboard</h2>
      </div>

      <p className={styles.description}>
        Share clipboard content between your devices
      </p>

      <div className={styles.currentSection}>
        <label className={styles.sectionLabel}>Current Clipboard</label>
        <div className={styles.currentPreview}>
          {currentClipboard ? (
            <pre className={styles.previewText}>{truncateText(currentClipboard)}</pre>
          ) : (
            <span className={styles.emptyText}>Nothing copied yet</span>
          )}
        </div>
        <button
          className={styles.sendButton}
          onClick={handleSendClipboard}
          disabled={!currentClipboard}
        >
          Send Clipboard
        </button>
      </div>

      <div className={styles.receivedSection}>
        <label className={styles.sectionLabel}>Received Items</label>
        {receivedItems.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <p className={styles.emptyStateText}>No clipboard items shared yet</p>
          </div>
        ) : (
          <div className={styles.itemsList}>
            {receivedItems.map((item) => (
              <div key={item.id} className={styles.item}>
                <div className={styles.itemContent}>
                  <pre className={styles.itemText}>{truncateText(item.text, 2)}</pre>
                  <div className={styles.itemMeta}>
                    <span className={styles.senderName}>{item.senderName}</span>
                    <span className={styles.timestamp}>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
                <button
                  className={styles.copyButton}
                  onClick={() => handleCopyItem(item)}
                  aria-label="Copy to clipboard"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
