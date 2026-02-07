'use client';

import { useState, useEffect } from 'react';
import styles from './PastePreview.module.css';

export interface PastePreviewProps {
  /** Preview type */
  type: 'image' | 'file' | 'text';
  /** Image source URL (for image type) */
  src?: string;
  /** File name */
  fileName?: string;
  /** File size in bytes */
  fileSize?: number;
  /** Text content preview (for text type) */
  text?: string;
  /** File type/MIME type */
  fileType?: string;
  /** Callback when send is clicked */
  onSend: () => void;
  /** Callback when cancel is clicked */
  onCancel: () => void;
  /** Target device name */
  targetDeviceName?: string;
  /** Loading state */
  loading?: boolean;
}

export function PastePreview({
  type,
  src,
  fileName,
  fileSize,
  text,
  fileType,
  onSend,
  onCancel,
  targetDeviceName,
  loading = false,
}: PastePreviewProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const renderPreview = () => {
    switch (type) {
      case 'image':
        return (
          <div className={styles.imagePreview}>
            {src && !imageError ? (
              <img
                src={src}
                alt={fileName || 'Pasted image'}
                className={styles.previewImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles.imagePlaceholder}>
                <ImageIcon />
                <span>Image preview unavailable</span>
              </div>
            )}
          </div>
        );

      case 'file':
        return (
          <div className={styles.filePreview}>
            <div className={styles.fileIcon}>
              {getFileIcon(fileType)}
            </div>
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{fileName || 'Unknown file'}</div>
              {fileSize !== undefined && (
                <div className={styles.fileSize}>{formatBytes(fileSize)}</div>
              )}
              {fileType && (
                <div className={styles.fileType}>{getFileTypeLabel(fileType)}</div>
              )}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={styles.textPreview}>
            <div className={styles.textIcon}>
              <TextIcon />
            </div>
            <div className={styles.textContent}>
              {text && text.length > 200 ? `${text.substring(0, 200)}...` : text}
            </div>
            {text && (
              <div className={styles.textStats}>
                {text.length} characters
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Ready to send</h3>
        {targetDeviceName && (
          <span className={styles.target}>
            to <strong>{targetDeviceName}</strong>
          </span>
        )}
      </div>

      <div className={styles.previewContainer}>
        {renderPreview()}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          className={styles.sendButton}
          onClick={onSend}
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner />
              Sending...
            </>
          ) : (
            <>
              <SendIcon />
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Icons
function ImageIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function TextIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className={styles.spinner} width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.25"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

// File type icons
function getFileIcon(fileType?: string) {
  if (!fileType) {
    return <FileIcon />;
  }

  if (fileType.startsWith('image/')) {
    return <ImageFileIcon />;
  }

  if (fileType === 'application/pdf') {
    return <PdfIcon />;
  }

  if (fileType.startsWith('text/') || fileType.includes('document')) {
    return <DocumentIcon />;
  }

  return <FileIcon />;
}

function FileIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function ImageFileIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function PdfIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="18" x2="15" y2="18" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

// Utilities
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getFileTypeLabel(fileType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'image/png': 'PNG Image',
    'image/jpeg': 'JPEG Image',
    'image/jpg': 'JPG Image',
    'image/gif': 'GIF Image',
    'image/webp': 'WebP Image',
    'text/plain': 'Text File',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  };

  return typeMap[fileType] || fileType;
}
