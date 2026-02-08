'use client';

import React, { useState, useRef, useCallback, Component, ReactNode } from 'react';
import styles from './dropzone.module.css';

interface DropZoneProps {
  onFilesSelected?: (files: File[]) => void;
  selectedDevice?: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class DropZoneErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DropZone Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.card}>
          <div className={styles.errorState}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ color: 'var(--danger, #ef4444)' }}
            >
              <path
                d="M20 10v12M20 26v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="2" />
            </svg>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
              Drop zone encountered an error.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function DropZoneComponent({ onFilesSelected, selectedDevice }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      onFilesSelected?.(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      onFilesSelected?.(selectedFiles);
    }
  }, [onFilesSelected]);

  const handleRemoveFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSend = useCallback(() => {
    if (files.length > 0 && selectedDevice) {
      // TODO: Integrate with transfer system
      console.log('Sending files:', files, 'to device:', selectedDevice);
      // After sending, clear the file list
      setFiles([]);
    }
  }, [files, selectedDevice]);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes < 1024) {return bytes + ' B';}
    if (bytes < 1024 * 1024) {return (bytes / 1024).toFixed(1) + ' KB';}
    if (bytes < 1024 * 1024 * 1024) {return (bytes / (1024 * 1024)).toFixed(1) + ' MB';}
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }, []);

  const getFileIcon = useCallback((file: File): string => {
    const type = file.type;
    if (type.startsWith('image/')) {return '🖼️';}
    if (type.startsWith('video/')) {return '🎥';}
    if (type.startsWith('audio/')) {return '🎵';}
    if (type.includes('pdf')) {return '📄';}
    if (type.includes('zip') || type.includes('rar') || type.includes('compressed')) {return '📦';}
    return '📎';
  }, []);

  return (
    <DropZoneErrorBoundary>
      <div className={styles.card}>
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Drop zone — drag files here or press Enter to browse"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleBrowseClick();
            }
          }}
        >
          <svg
            className={styles.uploadIcon}
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 28V12M20 12L13 19M20 12L27 19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M33 24V32C33 33.1046 32.1046 34 31 34H9C7.89543 34 7 33.1046 7 32V24"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>

          <p className={styles.dropText}>
            {isDragOver ? 'Release to add files' : 'Drop files here to send'}
          </p>

          {!isDragOver && (
            <>
              <p className={styles.orText}>or</p>
              <div className={styles.buttonGroup}>
                <button className={styles.browseButton} onClick={handleBrowseClick}>
                  Browse Files
                </button>
                <button className={styles.cameraButton} onClick={() => console.log('Camera clicked')}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 5C2 4.44772 2.44772 4 3 4H4.5L5.5 2H10.5L11.5 4H13C13.5523 4 14 4.44772 14 5V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V5Z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="8"
                      cy="8.5"
                      r="2"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                  </svg>
                  Camera
                </button>
              </div>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className={styles.fileInput}
            onChange={handleFileInputChange}
            aria-label="Select files to transfer"
          />
        </div>

        {files.length > 0 && (
          <div className={styles.fileQueue}>
            <div className={styles.queueHeader}>
              <h3 className={styles.queueTitle}>
                {files.length} {files.length === 1 ? 'file' : 'files'} ready
              </h3>
            </div>
            <div className={styles.fileList}>
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className={styles.fileItem}>
                  <span className={styles.fileIcon}>{getFileIcon(file)}</span>
                  <div className={styles.fileInfo}>
                    <span className={styles.fileName} title={file.name}>
                      {file.name}
                    </span>
                    <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                  </div>
                  <button
                    className={styles.removeButton}
                    onClick={() => handleRemoveFile(index)}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            {selectedDevice && (
              <button className={styles.sendButton} onClick={handleSend}>
                Send to device
              </button>
            )}
          </div>
        )}
      </div>
    </DropZoneErrorBoundary>
  );
}

export const DropZone = React.memo(DropZoneComponent);
