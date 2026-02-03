'use client';

import { useEffect, useState } from 'react';
import type { Transfer } from '@/lib/types';

interface TransferProgressProps {
  transfer: Transfer;
  onCancel?: (transferId: string) => void;
  onPause?: (transferId: string) => void;
  onResume?: (transferId: string) => void;
  className?: string;
}

export function TransferProgress({
  transfer,
  onCancel,
  onPause,
  onResume,
  className = ''
}: TransferProgressProps) {
  const [displaySpeed, setDisplaySpeed] = useState(transfer.speed);

  useEffect(() => {
    setDisplaySpeed(transfer.speed);
  }, [transfer.speed]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null || seconds === 0 || !isFinite(seconds)) {
      return '--:--';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isPaused = transfer.status === 'paused';
  const isTransferring = transfer.status === 'transferring';
  const fileName = transfer.files[0]?.name || 'Unknown file';
  const fileSize = transfer.totalSize;
  const transferredSize = transfer.transferredSize;

  return (
    <div className={`
      p-6 rounded-lg border border-white/20 bg-gradient-to-br from-white/5 to-white/10
      backdrop-blur-sm transition-all duration-300
      ${className}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          {/* File icon and name */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-shrink-0 w-10 h-10 rounded bg-white/10 flex items-center justify-center">
              <svg
                width="20"
                height="20"
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

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-white truncate">
                {fileName}
              </h4>
              <p className="text-xs text-white/50">
                {formatFileSize(transferredSize)} of {formatFileSize(fileSize)}
              </p>
            </div>
          </div>
        </div>

        {/* Encryption indicator */}
        {transfer.encryptionMetadata && (
          <div className="flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/10">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-white/60"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="text-xs text-white/60">Encrypted</span>
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-white">
            {Math.round(transfer.progress)}%
          </span>
          <span className="text-xs text-white/50">
            {formatSpeed(displaySpeed)}
          </span>
        </div>

        <div className="relative h-2 rounded-full bg-white/10 overflow-hidden">
          {/* Progress fill */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/80 to-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, transfer.progress))}%` }}
          />

          {/* Animated shimmer */}
          {isTransferring && (
            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                style={{
                  animation: 'shimmer 2s infinite',
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4 text-xs text-white/50">
          {/* Speed */}
          <div className="flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span>{formatSpeed(displaySpeed)}</span>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>{formatTime(transfer.eta)}</span>
          </div>

          {/* Connection quality */}
          {transfer.quality && (
            <div className="flex items-center gap-1">
              <div className={`
                w-2 h-2 rounded-full
                ${transfer.quality === 'excellent' ? 'bg-green-400' :
                  transfer.quality === 'good' ? 'bg-yellow-400' :
                  transfer.quality === 'poor' ? 'bg-orange-400' :
                  'bg-red-400'
                }
              `} />
              <span className="capitalize">{transfer.quality}</span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Pause/Resume button */}
        {(isTransferring || isPaused) && onPause && onResume && (
          <button
            onClick={() => isPaused ? onResume(transfer.id) : onPause(transfer.id)}
            className="
              flex-1 px-4 py-2 rounded-md text-sm font-medium
              bg-white/10 hover:bg-white/20
              border border-white/20 hover:border-white/40
              text-white
              transition-all duration-200
              flex items-center justify-center gap-2
            "
            type="button"
          >
            {isPaused ? (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
                Pause
              </>
            )}
          </button>
        )}

        {/* Cancel button */}
        {onCancel && (
          <button
            onClick={() => onCancel(transfer.id)}
            className="
              px-4 py-2 rounded-md text-sm font-medium
              bg-red-500/20 hover:bg-red-500/30
              border border-red-500/40 hover:border-red-500/60
              text-red-400 hover:text-red-300
              transition-all duration-200
              flex items-center justify-center gap-2
            "
            type="button"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
