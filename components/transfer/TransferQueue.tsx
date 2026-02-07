'use client';

import { useMemo, useState, useEffect } from 'react';
import { FilePreview } from './FilePreview';
import { isCompressible } from '@/lib/utils/compression-detector';
import styles from './TransferQueue.module.css';

interface FileWithPath extends File {
  path?: string;
}

interface TransferQueueProps {
  files: FileWithPath[];
  onClear: () => void;
  onRemoveFile: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
}

type CompressionStatus = 'compressed' | 'compressible' | 'checking' | null;

export function TransferQueue({ files, onClear, onRemoveFile, onReorder }: TransferQueueProps) {
  const [compressionStatuses, setCompressionStatuses] = useState<Map<number, CompressionStatus>>(new Map());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const totalSize = useMemo(() => {
    return files.reduce((acc, file) => acc + file.size, 0);
  }, [files]);

  const fileCount = useMemo(() => {
    return files.length;
  }, [files.length]);

  // Check compression status for each file
  useEffect(() => {
    const checkCompression = async () => {
      const newStatuses = new Map<number, CompressionStatus>();

      // Mark all as checking first
      files.forEach((_, index) => {
        newStatuses.set(index, 'checking');
      });
      setCompressionStatuses(new Map(newStatuses));

      // Check each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) {continue;}

        try {
          const compressible = await isCompressible(file);
          newStatuses.set(i, compressible ? 'compressible' : 'compressed');
          setCompressionStatuses(new Map(newStatuses));
        } catch {
          newStatuses.set(i, null);
        }
      }
    };

    if (files.length > 0) {
      checkCompression();
    }
  }, [files]);

  // Handle drag and drop reordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex && onReorder) {
      onReorder(draggedIndex, dragOverIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleClearClick = () => {
    if (files.length > 0) {
      setShowClearConfirm(true);
    }
  };

  const handleConfirmClear = () => {
    onClear();
    setShowClearConfirm(false);
  };

  const handleCancelClear = () => {
    setShowClearConfirm(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <span className={styles.count}>
            {fileCount} file{fileCount !== 1 ? 's' : ''}
          </span>
          <span className={styles.totalSize}>{formatSize(totalSize)}</span>
        </div>
        <div className={styles.headerActions}>
          {showClearConfirm ? (
            <div className={styles.confirmButtons}>
              <button onClick={handleConfirmClear} className={styles.confirmButton}>
                Confirm
              </button>
              <button onClick={handleCancelClear} className={styles.cancelButton}>
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={handleClearClick} className={styles.clearButton}>
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {files.map((file, index) => {
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;
          const compressionStatus = compressionStatuses.get(index) ?? null;

          return (
            <div
              key={`${file.name}-${index}-${file.size}`}
              className={`${styles.item} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
              role="listitem"
              draggable={onReorder !== undefined}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {onReorder && (
                <div className={styles.dragHandle} aria-label="Drag to reorder">
                  <DragIcon />
                </div>
              )}

              <div className={styles.preview}>
                <FilePreview
                  file={file}
                  showSize={false}
                  showBadge
                  compressionStatus={compressionStatus}
                />
              </div>

              <div className={styles.fileInfo}>
                <span className={styles.fileName} title={file.name}>
                  {file.name}
                </span>
                <div className={styles.fileDetails}>
                  <span className={styles.fileSize}>{formatSize(file.size)}</span>
                  {file.path && (
                    <>
                      <span className={styles.separator}>•</span>
                      <span className={styles.filePath} title={file.path}>
                        {file.path}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(index);
                }}
                className={styles.removeButton}
                aria-label={`Remove ${file.name}`}
              >
                <CloseIcon />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Icons
function DragIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="16" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="18" x2="16" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
