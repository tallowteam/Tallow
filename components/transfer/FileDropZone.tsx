'use client';

import { useRef, ChangeEvent } from 'react';
import styles from './FileDropZone.module.css';

interface FileDropZoneProps {
  files: File[];
  onFilesAdded: (files: File[]) => void;
  onFileRemoved: (index: number) => void;
  onClearAll: () => void;
  isDragActive: boolean;
}

export function FileDropZone({
  files,
  onFilesAdded,
  onFileRemoved,
  onClearAll,
  isDragActive,
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      onFilesAdded(Array.from(selectedFiles));
    }
    // Reset input value to allow selecting the same file again
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
  };

  const getTotalSize = (): string => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return formatFileSize(total);
  };

  const hasFiles = files.length > 0;

  return (
    <div className={styles.container}>
      {/* Compact bar */}
      <div
        className={`${styles.dropBar} ${isDragActive ? styles.dragging : ''}`}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
      >
        <div className={styles.leftSection}>
          <svg
            className={styles.fileIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <span className={styles.placeholderText}>
            {hasFiles
              ? `${files.length} file${files.length > 1 ? 's' : ''} • ${getTotalSize()}`
              : 'Drop files here or click to browse'}
          </span>
        </div>

        <button
          type="button"
          className={styles.browseButton}
          onClick={(e) => {
            e.stopPropagation();
            handleBrowseClick();
          }}
        >
          Browse
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className={styles.hiddenInput}
          aria-label="Select files to transfer"
        />
      </div>

      {/* Drag overlay */}
      {isDragActive && (
        <div className={styles.dragOverlay}>
          <svg
            className={styles.uploadIcon}
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
          </svg>
          <p className={styles.dragText}>Drop files to send</p>
        </div>
      )}

      {/* File chips section */}
      {hasFiles && (
        <div className={styles.fileChipsContainer}>
          <div className={styles.fileChips}>
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className={styles.fileChip}>
                <svg
                  className={styles.chipIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                  <polyline points="13 2 13 9 20 9" />
                </svg>
                <span className={styles.chipName}>{file.name}</span>
                <span className={styles.chipSize}>{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  className={styles.chipRemove}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemoved(index);
                  }}
                  aria-label={`Remove ${file.name}`}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}

            {files.length >= 2 && (
              <button
                type="button"
                className={styles.clearAllButton}
                onClick={(e) => {
                  e.stopPropagation();
                  onClearAll();
                }}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
