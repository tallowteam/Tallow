'use client';

import { useState, useMemo } from 'react';
import {
  getProjectFiles,
  removeFileFromProject,
  moveFileBetweenProjects,
  getAllProjects,
  type ProjectFolder,
  type ProjectFile,
} from '@/lib/storage/project-organizer';
import { useToast } from '@/components/ui/ToastProvider';
import { formatDataSize } from '@/lib/storage/transfer-history';
import styles from './ProjectFileList.module.css';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type SortField = 'name' | 'date' | 'size' | 'sender';
type SortDirection = 'asc' | 'desc';

interface ProjectFileListProps {
  project: ProjectFolder;
  onBack: () => void;
  onProjectUpdate: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ProjectFileList({
  project,
  onBack,
  onProjectUpdate,
}: ProjectFileListProps) {
  const [files, setFiles] = useState<ProjectFile[]>(getProjectFiles(project.id));
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const toast = useToast();

  // Refresh files list
  const refreshFiles = () => {
    const updated = getProjectFiles(project.id);
    setFiles(updated);
    setSelectedFiles(new Set());
    onProjectUpdate();
  };

  // Sort files
  const sortedFiles = useMemo(() => {
    const sorted = [...files].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = a.addedAt.getTime() - b.addedAt.getTime();
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'sender':
          comparison = a.senderName.localeCompare(b.senderName);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [files, sortField, sortDirection]);

  // Handle sort change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Handle file selection
  const handleSelectFile = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.id)));
    }
  };

  // Handle delete selected files
  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) {return;}

    if (confirm(`Delete ${selectedFiles.size} file(s)?`)) {
      selectedFiles.forEach(fileId => {
        removeFileFromProject(project.id, fileId);
      });
      toast?.success(`${selectedFiles.size} file(s) deleted`);
      refreshFiles();
    }
  };

  // Handle move selected files
  const handleMoveSelected = (targetProjectId: string) => {
    if (selectedFiles.size === 0) {return;}

    const targetProject = getAllProjects().find(p => p.id === targetProjectId);
    if (!targetProject) {return;}

    selectedFiles.forEach(fileId => {
      moveFileBetweenProjects(fileId, project.id, targetProjectId);
    });

    toast?.success(`${selectedFiles.size} file(s) moved to ${targetProject.name}`);
    setShowMoveMenu(false);
    refreshFiles();
  };

  // Get all other projects for move menu
  const otherProjects = getAllProjects().filter(p => p.id !== project.id);

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <div className={styles.breadcrumb}>
        <button className={styles.breadcrumbLink} onClick={onBack}>
          <BackIcon />
          Projects
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{project.name}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div
            className={styles.projectIcon}
            style={{ backgroundColor: project.color }}
          >
            {project.icon}
          </div>
          <div className={styles.headerInfo}>
            <h2 className={styles.title}>{project.name}</h2>
            {project.description && (
              <p className={styles.description}>{project.description}</p>
            )}
          </div>
        </div>

        {selectedFiles.size > 0 && (
          <div className={styles.headerActions}>
            <span className={styles.selectionCount}>
              {selectedFiles.size} selected
            </span>
            <div className={styles.bulkActions}>
              <button
                className={styles.bulkActionButton}
                onClick={() => setShowMoveMenu(!showMoveMenu)}
              >
                <MoveIcon />
                Move
              </button>
              <button
                className={`${styles.bulkActionButton} ${styles.bulkActionButtonDanger}`}
                onClick={handleDeleteSelected}
              >
                <DeleteIcon />
                Delete
              </button>
            </div>

            {/* Move Menu Dropdown */}
            {showMoveMenu && (
              <div className={styles.moveMenu}>
                <div className={styles.moveMenuHeader}>Move to:</div>
                {otherProjects.map(p => (
                  <button
                    key={p.id}
                    className={styles.moveMenuItem}
                    onClick={() => handleMoveSelected(p.id)}
                  >
                    <span style={{ color: p.color }}>{p.icon}</span>
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className={styles.controls}>
        <div className={styles.sortButtons}>
          <span className={styles.sortLabel}>Sort by:</span>
          <button
            className={`${styles.sortButton} ${
              sortField === 'name' ? styles.sortButtonActive : ''
            }`}
            onClick={() => handleSort('name')}
          >
            Name
            {sortField === 'name' && (
              <SortIcon direction={sortDirection} />
            )}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortField === 'date' ? styles.sortButtonActive : ''
            }`}
            onClick={() => handleSort('date')}
          >
            Date
            {sortField === 'date' && (
              <SortIcon direction={sortDirection} />
            )}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortField === 'size' ? styles.sortButtonActive : ''
            }`}
            onClick={() => handleSort('size')}
          >
            Size
            {sortField === 'size' && (
              <SortIcon direction={sortDirection} />
            )}
          </button>
          <button
            className={`${styles.sortButton} ${
              sortField === 'sender' ? styles.sortButtonActive : ''
            }`}
            onClick={() => handleSort('sender')}
          >
            Sender
            {sortField === 'sender' && (
              <SortIcon direction={sortDirection} />
            )}
          </button>
        </div>

        {files.length > 0 && (
          <button className={styles.selectAllButton} onClick={handleSelectAll}>
            {selectedFiles.size === files.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* File List */}
      {sortedFiles.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <EmptyFolderIcon />
          </div>
          <p>No files in this project</p>
          <span>Drag files here or add them from transfer history</span>
        </div>
      ) : (
        <div className={styles.fileList}>
          {sortedFiles.map(file => (
            <FileRow
              key={file.id}
              file={file}
              isSelected={selectedFiles.has(file.id)}
              onSelect={() => handleSelectFile(file.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FILE ROW COMPONENT
// ============================================================================

interface FileRowProps {
  file: ProjectFile;
  isSelected: boolean;
  onSelect: () => void;
}

function FileRow({ file, isSelected, onSelect }: FileRowProps) {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();

  const formatDate = (date: Date): string => {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className={`${styles.fileRow} ${isSelected ? styles.fileRowSelected : ''}`}
      onClick={onSelect}
    >
      <div className={styles.fileCheckbox}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      <div className={styles.fileIcon}>
        <FileIconByType {...(fileExtension ? { extension: fileExtension } : {})} />
      </div>

      <div className={styles.fileInfo}>
        <div className={styles.fileName}>{file.name}</div>
        <div className={styles.fileMeta}>
          <span className={styles.fileSize}>{formatDataSize(file.size)}</span>
          <span className={styles.metaSeparator}>·</span>
          <span className={styles.fileSender}>{file.senderName}</span>
          <span className={styles.metaSeparator}>·</span>
          <span className={styles.fileDate}>{formatDate(file.addedAt)}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FILE ICON BY TYPE
// ============================================================================

function FileIconByType({ extension }: { extension?: string }) {
  const ext = extension?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon />;
  }

  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) {
    return <VideoIcon />;
  }

  if (['pdf', 'doc', 'docx', 'txt', 'md'].includes(ext)) {
    return <DocumentIcon />;
  }

  if (['mp3', 'wav', 'aac', 'flac', 'ogg'].includes(ext)) {
    return <AudioIcon />;
  }

  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return <ArchiveIcon />;
  }

  if (['js', 'ts', 'jsx', 'tsx', 'py', 'rs', 'go', 'java'].includes(ext)) {
    return <CodeIcon />;
  }

  return <FileIcon />;
}

// ============================================================================
// ICONS
// ============================================================================

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function MoveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="5 9 2 12 5 15" />
      <polyline points="9 5 12 2 15 5" />
      <polyline points="15 19 12 22 9 19" />
      <polyline points="19 9 22 12 19 15" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="12" y1="2" x2="12" y2="22" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function SortIcon({ direction }: { direction: 'asc' | 'desc' }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {direction === 'asc' ? (
        <polyline points="18 15 12 9 6 15" />
      ) : (
        <polyline points="6 9 12 15 18 9" />
      )}
    </svg>
  );
}

function EmptyFolderIcon() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function AudioIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function ArchiveIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="21 8 21 21 3 21 3 8" />
      <rect x="1" y="3" width="22" height="5" />
      <line x1="10" y1="12" x2="14" y2="12" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
