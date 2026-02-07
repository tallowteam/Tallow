'use client';

import { useCallback, useState, useRef } from 'react';
import { DropZoneLoading } from './LoadingStates';
import styles from './FileDropZone.module.css';

interface FileWithPath extends File {
  path?: string;
}

interface FileDropZoneProps {
  onFilesSelected: (files: FileWithPath[]) => void;
  disabled?: boolean;
  hasFiles?: boolean;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  loading?: boolean;
}

/**
 * Recursively scan directory and collect all files
 */
async function scanDirectory(entry: FileSystemDirectoryEntry, path = ''): Promise<FileWithPath[]> {
  const files: FileWithPath[] = [];
  const reader = entry.createReader();

  // Read all entries in directory (may require multiple calls)
  const readEntries = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  let entries: FileSystemEntry[] = [];
  let batch: FileSystemEntry[];

  // Keep reading until we get an empty batch
  do {
    batch = await readEntries();
    entries = entries.concat(batch);
  } while (batch.length > 0);

  // Process each entry
  for (const entry of entries) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.isFile) {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      if (file) {
        // Add path property to file
        Object.defineProperty(file, 'path', {
          value: entryPath,
          writable: false,
          enumerable: true,
        });
        files.push(file as FileWithPath);
      }
    } else if (entry.isDirectory) {
      // Recursively scan subdirectory
      const subFiles = await scanDirectory(entry as FileSystemDirectoryEntry, entryPath);
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Get File object from FileSystemFileEntry
 */
async function getFileFromEntry(entry: FileSystemFileEntry): Promise<File | null> {
  return new Promise((resolve) => {
    entry.file(resolve, () => resolve(null));
  });
}

/**
 * Handle DataTransferItemList (supports folders)
 */
async function handleDataTransferItems(items: DataTransferItemList): Promise<FileWithPath[]> {
  const files: FileWithPath[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (!item) {continue;}

    const entry = item.webkitGetAsEntry?.();
    if (!entry) {continue;}

    if (entry.isFile) {
      const file = await getFileFromEntry(entry as FileSystemFileEntry);
      if (file) {
        Object.defineProperty(file, 'path', {
          value: entry.name,
          writable: false,
          enumerable: true,
        });
        files.push(file as FileWithPath);
      }
    } else if (entry.isDirectory) {
      const dirFiles = await scanDirectory(entry as FileSystemDirectoryEntry, entry.name);
      files.push(...dirFiles);
    }
  }

  return files;
}

export function FileDropZone({
  onFilesSelected,
  disabled = false,
  hasFiles = false,
  maxSize = 5 * 1024 * 1024 * 1024, // 5GB default
  acceptedFileTypes = [],
  loading = false,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    files.forEach((file) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(`${file.name} exceeds maximum size of ${formatBytes(maxSize)}`);
        return;
      }

      // Check file type if specified
      if (acceptedFileTypes.length > 0) {
        const isAccepted = acceptedFileTypes.some((type) => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category + '/');
          }
          return file.type === type;
        });

        if (!isAccepted) {
          errors.push(`${file.name} is not an accepted file type`);
          return;
        }
      }

      valid.push(file);
    });

    return { valid, errors };
  }, [maxSize, acceptedFileTypes]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) {return;}

    const fileArray = Array.from(files);
    const { valid, errors } = validateFiles(fileArray);

    if (errors.length > 0) {
      setError(errors[0] ?? null);
      setTimeout(() => setError(null), 5000);
    }

    if (valid.length > 0) {
      onFilesSelected(valid);
      setError(null);
    }
  }, [onFilesSelected, validateFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) {return;}

    // Check if dataTransfer has items (for folder support)
    if (e.dataTransfer.items) {
      const files = await handleDataTransferItems(e.dataTransfer.items);
      if (files.length > 0) {
        const { valid, errors } = validateFiles(files);

        if (errors.length > 0) {
          setError(errors[0] ?? null);
          setTimeout(() => setError(null), 5000);
        }

        if (valid.length > 0) {
          onFilesSelected(valid);
          setError(null);
        }
      }
    } else {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles, onFilesSelected, validateFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input to allow selecting the same file again
    e.target.value = '';
  }, [handleFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${
          disabled || loading ? styles.disabled : ''
        } ${hasFiles ? styles.hasFiles : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={loading ? undefined : handleClick}
        onKeyDown={loading ? undefined : handleKeyDown}
        role="button"
        tabIndex={disabled || loading ? -1 : 0}
        aria-label="Drop files here or click to select"
        aria-disabled={disabled || loading}
        aria-busy={loading}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInput}
          className={styles.fileInput}
          aria-hidden="true"
          tabIndex={-1}
          disabled={disabled || loading}
        />

        <div className={styles.content}>
          {loading ? (
            <DropZoneLoading />
          ) : isDragging ? (
            <>
              <DropIcon />
              <p className={styles.title}>Drop files or folders here</p>
            </>
          ) : (
            <>
              <UploadIcon />
              <p className={styles.title}>
                {hasFiles ? 'Add more files' : 'Drop files or folders here'}
              </p>
              <p className={styles.subtitle}>
                or click to browse
              </p>
              <p className={styles.hint}>
                Max file size: {formatBytes(maxSize)}
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.error} role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Icons
function UploadIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function DropIcon() {
  return (
    <svg className={styles.iconLarge} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// Utilities
function formatBytes(bytes: number): string {
  if (bytes === 0) {return '0 Bytes';}
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
