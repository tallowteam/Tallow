'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getQuickAccessFolders,
  addRecentFolder,
  removeFolder,
  clearRecent,
  isFileSystemAccessSupported,
  type FolderShortcut,
  type FolderType,
} from '@/lib/storage/folder-shortcuts';
import styles from './QuickAccessPanel.module.css';

interface QuickAccessPanelProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

interface FileWithPath extends File {
  path?: string;
}

export function QuickAccessPanel({
  onFilesSelected,
  disabled = false,
}: QuickAccessPanelProps) {
  const [folders, setFolders] = useState<FolderShortcut[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load folders and check API support
  useEffect(() => {
    setFolders(getQuickAccessFolders());
    setIsSupported(isFileSystemAccessSupported());
  }, []);

  // Reload folders when localStorage changes
  const reloadFolders = useCallback(() => {
    setFolders(getQuickAccessFolders());
  }, []);

  // Handle folder selection
  const handleFolderClick = useCallback(
    async (folder: FolderShortcut) => {
      if (disabled || !isSupported) {
        return;
      }

      setIsLoading(folder.id);
      setError(null);

      try {
        // Use File System Access API to open directory picker
        const startIn = getFolderStartIn(folder.type);
        const dirHandle = await window.showDirectoryPicker({
          mode: 'read',
          ...(startIn ? { startIn } : {}),
        });

        // Add to recent folders
        addRecentFolder(dirHandle.name);
        reloadFolders();

        // Collect all files from the directory
        const files = await collectFilesFromDirectory(dirHandle);

        if (files.length === 0) {
          setError('No files found in selected folder');
          setTimeout(() => setError(null), 3000);
          return;
        }

        // Pass files to parent
        onFilesSelected(files);
      } catch (err) {
        // User cancelled or error occurred
        if (err instanceof Error) {
          if (err.name === 'AbortError') {
            // User cancelled - not an error
            console.log('[QuickAccess] Folder selection cancelled');
          } else {
            console.error('[QuickAccess] Failed to open folder:', err);
            setError('Failed to open folder. Please try again.');
            setTimeout(() => setError(null), 3000);
          }
        }
      } finally {
        setIsLoading(null);
      }
    },
    [disabled, isSupported, onFilesSelected, reloadFolders]
  );

  // Handle remove recent folder
  const handleRemoveFolder = useCallback(
    (e: React.MouseEvent, folderId: string) => {
      e.stopPropagation();
      removeFolder(folderId);
      reloadFolders();
    },
    [reloadFolders]
  );

  // Handle clear all recent folders
  const handleClearRecent = useCallback(() => {
    clearRecent();
    reloadFolders();
  }, [reloadFolders]);

  // Separate recent and predefined folders
  const recentFolders = folders.filter(f => f.isRecent);
  const predefinedFolders = folders.filter(f => !f.isRecent);

  if (!isSupported) {
    return (
      <div className={styles.container}>
        <div className={styles.unsupportedMessage}>
          <InfoIcon />
          <div className={styles.messageContent}>
            <p className={styles.messageTitle}>Quick Access Not Available</p>
            <p className={styles.messageText}>
              Your browser doesn't support folder selection. Use the file picker
              to select individual files.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Recent Folders Section */}
      {recentFolders.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Recent Folders</h3>
            <button
              onClick={handleClearRecent}
              className={styles.clearButton}
              aria-label="Clear recent folders"
              disabled={disabled}
            >
              <span>Clear</span>
            </button>
          </div>

          <div className={styles.grid}>
            {recentFolders.map(folder => (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder)}
                className={`${styles.folderCard} ${
                  isLoading === folder.id ? styles.loading : ''
                } ${disabled ? styles.disabled : ''}`}
                disabled={disabled || isLoading === folder.id}
                aria-label={`Open ${folder.name} folder`}
              >
                <div className={styles.folderIcon}>
                  {isLoading === folder.id ? (
                    <LoadingIcon />
                  ) : (
                    getFolderIcon(folder.type)
                  )}
                </div>
                <span className={styles.folderName}>{folder.name}</span>
                <button
                  onClick={e => handleRemoveFolder(e, folder.id)}
                  className={styles.removeButton}
                  aria-label={`Remove ${folder.name} from recent`}
                  disabled={disabled}
                >
                  <CloseIcon />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common Folders Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Common Folders</h3>

        <div className={styles.grid}>
          {predefinedFolders.map(folder => (
            <button
              key={folder.id}
              onClick={() => handleFolderClick(folder)}
              className={`${styles.folderCard} ${
                isLoading === folder.id ? styles.loading : ''
              } ${disabled ? styles.disabled : ''}`}
              disabled={disabled || isLoading === folder.id}
              aria-label={`Open ${folder.name} folder`}
            >
              <div className={styles.folderIcon}>
                {isLoading === folder.id ? (
                  <LoadingIcon />
                ) : (
                  getFolderIcon(folder.type)
                )}
              </div>
              <span className={styles.folderName}>{folder.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={styles.error} role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

// Helper Functions

/**
 * Get File System Access API start location hint
 */
function getFolderStartIn(type: FolderType): FilePickerOptions['startIn'] {
  switch (type) {
    case 'documents':
      return 'documents';
    case 'downloads':
      return 'downloads';
    case 'pictures':
      return 'pictures';
    case 'videos':
      return 'videos';
    case 'desktop':
      return 'desktop';
    default:
      return 'documents';
  }
}

/**
 * Recursively collect all files from a directory
 */
async function collectFilesFromDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path = ''
): Promise<FileWithPath[]> {
  const files: FileWithPath[] = [];

  try {
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;

      if (entry.kind === 'file') {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();

        // Add path property
        Object.defineProperty(file, 'path', {
          value: entryPath,
          writable: false,
          enumerable: true,
        });

        files.push(file as FileWithPath);
      } else if (entry.kind === 'directory') {
        // Recursively collect files from subdirectories
        const subDirHandle = entry as FileSystemDirectoryHandle;
        const subFiles = await collectFilesFromDirectory(
          subDirHandle,
          entryPath
        );
        files.push(...subFiles);
      }
    }
  } catch (err) {
    console.error('[QuickAccess] Error reading directory:', err);
  }

  return files;
}

/**
 * Get icon for folder type
 */
function getFolderIcon(type: FolderType) {
  switch (type) {
    case 'documents':
      return <DocumentsIcon />;
    case 'downloads':
      return <DownloadsIcon />;
    case 'pictures':
      return <PicturesIcon />;
    case 'videos':
      return <VideosIcon />;
    case 'desktop':
      return <DesktopIcon />;
    case 'recent':
      return <RecentIcon />;
    default:
      return <FolderIcon />;
  }
}

// Icons

function DocumentsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DownloadsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function PicturesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideosIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function DesktopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function RecentIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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

function InfoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
