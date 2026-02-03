'use client';

import { useCallback, useState, useRef } from 'react';
import { useTransferStore } from '@/lib/stores';

interface TransferZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

export function TransferZone({ onFilesSelected, disabled = false, className = '' }: TransferZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const { queue } = useTransferStore();

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (disabled) {
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setSelectedFiles(files);
      onFilesSelected(files);
    }
  }, [disabled, onFilesSelected]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const handleClearFiles = useCallback(() => {
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const totalFiles = selectedFiles.length + queue.length;
  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          relative min-h-[320px] rounded-lg border-2 border-dashed
          transition-all duration-300 ease-out
          ${isDragging
            ? 'border-white bg-white/5 scale-[1.02] shadow-[0_0_40px_rgba(255,255,255,0.2)]'
            : 'border-white/20 bg-black/40 hover:border-white/40 hover:bg-white/5'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          backdrop-blur-sm
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Animated glow effect */}
        {isDragging && (
          <div className="absolute inset-0 rounded-lg animate-pulse">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/10 via-white/20 to-white/10" />
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          aria-label="File input"
        />

        <div className="relative p-8 flex flex-col items-center justify-center min-h-[320px]">
          {/* Upload icon */}
          <div className={`
            mb-6 transition-transform duration-300
            ${isDragging ? 'scale-110' : 'scale-100'}
          `}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`
                transition-colors duration-300
                ${isDragging ? 'text-white' : 'text-white/60'}
              `}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>

          {/* Text content */}
          <h3 className={`
            text-xl font-medium mb-2 transition-colors duration-300
            ${isDragging ? 'text-white' : 'text-white/80'}
          `}>
            {isDragging ? 'Drop files here' : 'Drag & drop files'}
          </h3>

          <p className="text-white/50 text-sm mb-4">
            or click to browse
          </p>

          {/* File count and size */}
          {totalFiles > 0 && (
            <div className="mt-4 px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm">
              <p className="text-white/70 text-sm">
                {totalFiles} {totalFiles === 1 ? 'file' : 'files'} • {formatFileSize(totalSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File preview list */}
      {selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white/70">
              Selected files ({selectedFiles.length})
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearFiles();
              }}
              className="text-xs text-white/50 hover:text-white/80 transition-colors"
              type="button"
            >
              Clear all
            </button>
          </div>

          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-3 rounded-md bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* File icon */}
                  <div className="flex-shrink-0 w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-white/60"
                    >
                      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
                      <polyline points="13 2 13 9 20 9" />
                    </svg>
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{file.name}</p>
                    <p className="text-xs text-white/40">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
