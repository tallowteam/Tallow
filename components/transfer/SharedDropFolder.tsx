'use client';

import { useCallback, useState, type DragEvent } from 'react';
import { useTeamStore, type SharedFile } from '@/lib/stores/team-store';
import { addSharedFileAction, removeSharedFileAction, formatFileSize, formatTimestamp } from '@/lib/teams/team-actions';
import styles from './SharedDropFolder.module.css';

interface SharedDropFolderProps {
  /** Optional callback when file is uploaded */
  onFileUpload?: (file: SharedFile) => void;
  /** Optional callback when file is downloaded */
  onFileDownload?: (file: SharedFile) => void;
}

export function SharedDropFolder({ onFileUpload, onFileDownload }: SharedDropFolderProps) {
  const { activeTeam, sharedFiles, members } = useTeamStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set dragging to false if leaving the drop zone itself
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (!activeTeam) {
        return;
      }

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file) {continue;}
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));

          // Read file as data URL for storage/preview
          const dataUrl = await readFileAsDataURL(file);

          const sharedFile: SharedFile = {
            id: `file-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(7))).map(b => b.toString(36)).join('').substring(0, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            contributorId: 'current-user',
            contributorName: 'You',
            timestamp: Date.now(),
            dataUrl,
          };

          addSharedFileAction(sharedFile);
          onFileUpload?.(sharedFile);
        }
      } catch (error) {
        console.error('[SharedDropFolder] Failed to upload files:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [activeTeam, onFileUpload]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!activeTeam || !e.target.files) {
        return;
      }

      const files = Array.from(e.target.files);
      if (files.length === 0) {
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (!file) {continue;}
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));

          const dataUrl = await readFileAsDataURL(file);

          const sharedFile: SharedFile = {
            id: `file-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(7))).map(b => b.toString(36)).join('').substring(0, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            contributorId: 'current-user',
            contributorName: 'You',
            timestamp: Date.now(),
            dataUrl,
          };

          addSharedFileAction(sharedFile);
          onFileUpload?.(sharedFile);
        }
      } catch (error) {
        console.error('[SharedDropFolder] Failed to upload files:', error);
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        // Reset input
        e.target.value = '';
      }
    },
    [activeTeam, onFileUpload]
  );

  const handleDownload = useCallback(
    (file: SharedFile) => {
      if (!file.dataUrl) {
        console.error('[SharedDropFolder] No data URL for file:', file.name);
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = file.dataUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onFileDownload?.(file);
    },
    [onFileDownload]
  );

  const handleDelete = useCallback((file: SharedFile) => {
    if (file.contributorId !== 'current-user') {
      return; // Can only delete own files
    }

    if (confirm(`Delete "${file.name}" from shared folder?`)) {
      removeSharedFileAction(file.id);
    }
  }, []);

  const getContributorName = useCallback(
    (contributorId: string) => {
      const member = members.find((m) => m.id === contributorId);
      return member?.name || 'Unknown';
    },
    [members]
  );

  if (!activeTeam) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <FolderIcon />
          <p className={styles.emptyTitle}>No Active Team</p>
          <p className={styles.emptySubtitle}>
            Join or create a team to access the shared folder
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Drop Zone */}
      <div
        className={`${styles.dropZone} ${isDragging ? styles.dragging : ''} ${
          isUploading ? styles.uploading : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {isUploading ? (
          <>
            <UploadIcon />
            <p className={styles.dropZoneText}>Uploading files...</p>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className={styles.progressText}>{uploadProgress}%</p>
          </>
        ) : (
          <>
            <UploadIcon />
            <p className={styles.dropZoneText}>
              Drop files here to share with team
            </p>
            <p className={styles.dropZoneSubtext}>or</p>
            <label htmlFor="file-input" className={styles.browseButton}>
              <input
                id="file-input"
                type="file"
                multiple
                onChange={handleFileInput}
                className={styles.fileInput}
              />
              Browse Files
            </label>
          </>
        )}
      </div>

      {/* Files List */}
      <div className={styles.filesList}>
        <div className={styles.filesHeader}>
          <h3 className={styles.filesTitle}>
            Shared Files
            <span className={styles.fileCount}>{sharedFiles.length}</span>
          </h3>
        </div>

        {sharedFiles.length === 0 ? (
          <div className={styles.emptyFiles}>
            <EmptyFolderIcon />
            <p className={styles.emptyFilesText}>No files shared yet</p>
            <p className={styles.emptyFilesSubtext}>
              Drag and drop files above to get started
            </p>
          </div>
        ) : (
          <div className={styles.filesGrid}>
            {sharedFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                contributorName={getContributorName(file.contributorId)}
                isOwnFile={file.contributorId === 'current-user'}
                onDownload={() => handleDownload(file)}
                onDelete={() => handleDelete(file)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// FILE CARD COMPONENT
// ============================================================================

interface FileCardProps {
  file: SharedFile;
  contributorName: string;
  isOwnFile: boolean;
  onDownload: () => void;
  onDelete: () => void;
}

function FileCard({ file, contributorName, isOwnFile, onDownload, onDelete }: FileCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getFileIcon = () => {
    const { type } = file;

    if (type.startsWith('image/')) {return <ImageIcon />;}
    if (type.startsWith('video/')) {return <VideoIcon />;}
    if (type.startsWith('audio/')) {return <AudioIcon />;}
    if (type.includes('pdf')) {return <PDFIcon />;}
    if (type.includes('zip') || type.includes('rar') || type.includes('7z'))
      {return <ArchiveIcon />;}
    if (
      type.includes('word') ||
      type.includes('document') ||
      type.includes('text')
    )
      {return <DocumentIcon />;}

    return <FileIcon />;
  };

  return (
    <div className={styles.fileCard}>
      {/* File Preview/Icon */}
      <div className={styles.filePreview}>
        {file.type.startsWith('image/') && file.dataUrl ? (
          <img src={file.dataUrl} alt={file.name} className={styles.previewImage} width={120} height={80} loading="lazy" />
        ) : (
          <div className={styles.fileIconWrapper}>{getFileIcon()}</div>
        )}
      </div>

      {/* File Info */}
      <div className={styles.fileInfo}>
        <div className={styles.fileName} title={file.name}>
          {file.name}
        </div>
        <div className={styles.fileMeta}>
          <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
          <span className={styles.fileSeparator}>•</span>
          <span className={styles.fileTime}>{formatTimestamp(file.timestamp)}</span>
        </div>
        <div className={styles.fileContributor}>
          <UserIcon />
          <span>{contributorName}</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.fileActions}>
        <button
          onClick={onDownload}
          className={styles.iconButton}
          aria-label="Download file"
          title="Download"
        >
          <DownloadIcon />
        </button>
        {isOwnFile && (
          <button
            onClick={onDelete}
            className={`${styles.iconButton} ${styles.deleteButton}`}
            aria-label="Delete file"
            title="Delete"
          >
            <DeleteIcon />
          </button>
        )}
        <button
          onClick={() => setShowActions(!showActions)}
          className={styles.iconButton}
          aria-label="More actions"
        >
          <MoreIcon />
        </button>

        {showActions && (
          <div className={styles.actionsMenu}>
            <button onClick={onDownload}>
              <DownloadIcon />
              Download
            </button>
            {isOwnFile && (
              <button onClick={onDelete} className={styles.dangerAction}>
                <DeleteIcon />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITIES
// ============================================================================

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// ICONS
// ============================================================================

function FolderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function EmptyFolderIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function PDFIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="12" cy="5" r="1" fill="currentColor" />
      <circle cx="12" cy="19" r="1" fill="currentColor" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
