'use client';

import { useEffect, useState } from 'react';
import type { Transfer } from '@/lib/types';

interface TransferCompleteProps {
  transfer: Transfer;
  onTransferAnother?: () => void;
  onViewHistory?: () => void;
  onShare?: () => void;
  className?: string;
}

export function TransferComplete({
  transfer,
  onTransferAnother,
  onViewHistory,
  onShare,
  className = ''
}: TransferCompleteProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDuration = (startTime: number | null, endTime: number | null): string => {
    if (!startTime || !endTime) return '--:--';

    const durationSeconds = Math.floor((endTime - startTime) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const fileName = transfer.files[0]?.name || 'Unknown file';
  const fileCount = transfer.files.length;
  const totalSize = transfer.totalSize;
  const duration = formatDuration(transfer.startTime, transfer.endTime);
  const isSuccess = transfer.status === 'completed';

  return (
    <div className={`
      p-8 rounded-lg border border-white/20 bg-gradient-to-br from-white/5 to-white/10
      backdrop-blur-sm transition-all duration-500
      ${showAnimation ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      ${className}
    `}>
      {/* Success animation */}
      <div className="text-center mb-6">
        <div className="relative inline-flex items-center justify-center">
          {/* Animated circle background */}
          <div className={`
            absolute inset-0 rounded-full bg-green-500/20
            transition-all duration-1000 ease-out
            ${showAnimation ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
          `} />

          {/* Checkmark icon */}
          <div className={`
            relative w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center
            transition-all duration-500 delay-200
            ${showAnimation ? 'scale-100 rotate-0' : 'scale-0 rotate-180'}
          `}>
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-400"
            >
              <polyline
                points="20 6 9 17 4 12"
                className={`
                  transition-all duration-500 delay-500
                  ${showAnimation ? 'opacity-100' : 'opacity-0'}
                `}
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: showAnimation ? 0 : 30,
                  transition: 'stroke-dashoffset 0.5s ease-out 0.5s'
                }}
              />
            </svg>
          </div>

          {/* Pulse rings */}
          {showAnimation && (
            <>
              <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
            </>
          )}
        </div>
      </div>

      {/* Success message */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-semibold text-white mb-2">
          {isSuccess ? 'Transfer complete!' : 'Transfer finished'}
        </h3>
        <p className="text-white/60">
          {transfer.direction === 'send' ? 'File sent successfully' : 'File received successfully'}
        </p>
      </div>

      {/* File details */}
      <div className="space-y-3 mb-6">
        {/* File name */}
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
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
              <p className="text-sm font-medium text-white truncate">{fileName}</p>
              {fileCount > 1 && (
                <p className="text-xs text-white/50">+{fileCount - 1} more {fileCount === 2 ? 'file' : 'files'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Size */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 mb-1">Total size</p>
            <p className="text-sm font-medium text-white">{formatFileSize(totalSize)}</p>
          </div>

          {/* Duration */}
          <div className="p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 mb-1">Duration</p>
            <p className="text-sm font-medium text-white">{duration}</p>
          </div>

          {/* Encryption status */}
          {transfer.encryptionMetadata && (
            <div className="col-span-2 p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-2">
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
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <p className="text-sm text-white/70">
                  End-to-end encrypted
                  {transfer.encryptionMetadata.algorithm && (
                    <span className="text-white/50"> • {transfer.encryptionMetadata.algorithm}</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {/* Primary action */}
        {onTransferAnother && (
          <button
            onClick={onTransferAnother}
            className="
              w-full px-6 py-3 rounded-md font-medium
              bg-white text-black
              hover:bg-white/90
              transition-all duration-200
              flex items-center justify-center gap-2
            "
            type="button"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="17 1 21 5 17 9" />
              <path d="M3 11V9a4 4 0 0 1 4-4h14" />
              <polyline points="7 23 3 19 7 15" />
              <path d="M21 13v2a4 4 0 0 1-4 4H3" />
            </svg>
            Transfer another file
          </button>
        )}

        {/* Secondary actions */}
        <div className="grid grid-cols-2 gap-2">
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="
                px-4 py-2 rounded-md text-sm font-medium
                bg-white/10 hover:bg-white/20
                border border-white/20 hover:border-white/40
                text-white
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
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              History
            </button>
          )}

          {onShare && (
            <button
              onClick={onShare}
              className="
                px-4 py-2 rounded-md text-sm font-medium
                bg-white/10 hover:bg-white/20
                border border-white/20 hover:border-white/40
                text-white
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
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
