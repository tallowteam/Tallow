'use client';

import { useState, useEffect } from 'react';
import { formatFileSize, getFileCategory, isPreviewableImage, type FileCategory } from '@/lib/utils/file-utils';
import styles from './FilePreview.module.css';

interface FilePreviewProps {
  file: File;
  showSize?: boolean;
  showBadge?: boolean;
  compressionStatus?: 'compressed' | 'compressible' | 'checking' | null;
}

export function FilePreview({
  file,
  showSize = true,
  showBadge = true,
  compressionStatus = null,
}: FilePreviewProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const category = getFileCategory(file.type);

  // Generate thumbnail for previewable images
  useEffect(() => {
    if (isPreviewableImage(file.type)) {
      const url = URL.createObjectURL(file);
      setThumbnailUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
    return undefined;
  }, [file]);

  return (
    <div className={styles.preview}>
      {/* Thumbnail or Icon */}
      <div className={styles.thumbnailContainer}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={file.name}
            className={styles.thumbnail}
            loading="lazy"
          />
        ) : (
          <div className={styles.iconContainer}>
            <FileIcon category={category} />
          </div>
        )}
      </div>

      {/* File Info */}
      <div className={styles.info}>
        {showSize && (
          <span className={styles.size}>{formatFileSize(file.size)}</span>
        )}
        {showBadge && (
          <FileBadge category={category} compressionStatus={compressionStatus} />
        )}
      </div>
    </div>
  );
}

interface FileBadgeProps {
  category: FileCategory;
  compressionStatus?: 'compressed' | 'compressible' | 'checking' | null;
}

function FileBadge({ category, compressionStatus }: FileBadgeProps) {
  // Show compression status if available
  if (compressionStatus === 'checking') {
    return <span className={`${styles.badge} ${styles.badgeChecking}`}>...</span>;
  }

  if (compressionStatus === 'compressed') {
    return (
      <span className={`${styles.badge} ${styles.badgeCompressed}`}>
        Already optimized
      </span>
    );
  }

  if (compressionStatus === 'compressible') {
    return (
      <span className={`${styles.badge} ${styles.badgeCompressible}`}>
        Will be compressed
      </span>
    );
  }

  // Otherwise show file type badge
  const categoryLabels: Record<FileCategory, string> = {
    image: 'Image',
    video: 'Video',
    audio: 'Audio',
    document: 'Document',
    archive: 'Archive',
    code: 'Code',
    folder: 'Folder',
    other: 'File',
  };

  return (
    <span className={`${styles.badge} ${styles[`badge${category.charAt(0).toUpperCase() + category.slice(1)}`]}`}>
      {categoryLabels[category]}
    </span>
  );
}

interface FileIconProps {
  category: FileCategory;
}

function FileIcon({ category }: FileIconProps) {
  switch (category) {
    case 'image':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );

    case 'video':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );

    case 'audio':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      );

    case 'document':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );

    case 'archive':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="21 8 21 21 3 21 3 8" />
          <rect x="1" y="3" width="22" height="5" />
          <line x1="10" y1="12" x2="14" y2="12" />
        </svg>
      );

    case 'code':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );

    case 'folder':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
  }
}
