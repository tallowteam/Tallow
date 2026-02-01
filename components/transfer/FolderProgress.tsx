'use client';

/**
 * Folder Progress Component
 * Displays progress for folder transfers with file-by-file breakdown
 */

import { useMemo } from 'react';
import { Folder, FileCheck, Clock, Zap, Archive, Pause, Play, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatFileSize } from '@/lib/transfer/folder-transfer';
import { cn } from '@/lib/utils';

export interface FolderProgressProps {
  folderName: string;
  totalFiles: number;
  transferredFiles: number;
  currentFile?: string;
  totalSize: number;
  transferredSize: number;
  speed?: number;
  eta?: number;
  status: 'pending' | 'transferring' | 'paused' | 'completed' | 'failed';
  isCompressed?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function FolderProgress({
  folderName,
  totalFiles,
  transferredFiles,
  currentFile,
  totalSize,
  transferredSize,
  speed,
  eta,
  status,
  isCompressed = false,
  onPause,
  onResume,
  onCancel,
  className,
}: FolderProgressProps) {
  const fileProgress = useMemo(() => {
    return totalFiles > 0 ? (transferredFiles / totalFiles) * 100 : 0;
  }, [transferredFiles, totalFiles]);

  const sizeProgress = useMemo(() => {
    return totalSize > 0 ? (transferredSize / totalSize) * 100 : 0;
  }, [transferredSize, totalSize]);

  const formattedSpeed = useMemo(() => {
    if (!speed) {return null;}
    return `${formatFileSize(speed)}/s`;
  }, [speed]);

  const formattedEta = useMemo(() => {
    if (!eta) {return null;}
    const hours = Math.floor(eta / 3600);
    const minutes = Math.floor((eta % 3600) / 60);
    const seconds = Math.floor(eta % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [eta]);

  // EUVEKA styled status configurations
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-[#b2987d]',
          bgColor: 'bg-[#b2987d]/10',
          label: 'Pending',
        };
      case 'transferring':
        return {
          color: 'text-[#fefefc]',
          bgColor: 'bg-[#fefefc]/10',
          label: 'Transferring',
        };
      case 'paused':
        return {
          color: 'text-amber-500',
          bgColor: 'bg-amber-500/10',
          label: 'Paused',
        };
      case 'completed':
        return {
          color: 'text-emerald-500',
          bgColor: 'bg-emerald-500/10',
          label: 'Completed',
        };
      case 'failed':
        return {
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          label: 'Failed',
        };
      default:
        return {
          color: 'text-muted-foreground',
          bgColor: 'bg-secondary',
          label: 'Unknown',
        };
    }
  }, [status]);

  return (
    <Card className={cn('overflow-hidden rounded-2xl', className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', statusConfig.bgColor)}>
              {isCompressed ? (
                <Archive className={cn('w-5 h-5', statusConfig.color)} />
              ) : (
                <Folder className={cn('w-5 h-5', statusConfig.color)} />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium truncate">{folderName}</h3>
                <Badge variant="outline" className={cn('text-xs', statusConfig.color)}>
                  {statusConfig.label}
                </Badge>
                {isCompressed && (
                  <Badge variant="secondary" className="text-xs">
                    Compressed
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {transferredFiles} / {totalFiles} files
                </span>
                <span>{formatFileSize(transferredSize)} / {formatFileSize(totalSize)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {status === 'transferring' && onPause && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onPause}
                className="rounded-full"
                aria-label="Pause transfer"
              >
                <Pause className="w-4 h-4" />
              </Button>
            )}
            {status === 'paused' && onResume && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onResume}
                className="rounded-full"
                aria-label="Resume transfer"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
            {onCancel && status !== 'completed' && status !== 'failed' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onCancel}
                className="rounded-full"
                aria-label="Cancel transfer"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div className="p-4 space-y-4">
        {/* File count progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileCheck className="w-3 h-3" />
              <span>Files transferred</span>
            </div>
            <span>{fileProgress.toFixed(1)}%</span>
          </div>
          <Progress value={fileProgress} className="h-2" />
        </div>

        {/* Data size progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Archive className="w-3 h-3" />
              <span>Data transferred</span>
            </div>
            <span>{sizeProgress.toFixed(1)}%</span>
          </div>
          <Progress value={sizeProgress} className="h-2" />
        </div>

        {/* Current file */}
        {currentFile && status === 'transferring' && (
          <div className="p-3 rounded-xl bg-secondary/50">
            <p className="text-xs text-muted-foreground mb-1">Current file</p>
            <p className="text-sm font-medium truncate">{currentFile}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          {formattedSpeed && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Speed</p>
                <p className="text-sm font-medium">{formattedSpeed}</p>
              </div>
            </div>
          )}

          {formattedEta && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">ETA</p>
                <p className="text-sm font-medium">{formattedEta}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default FolderProgress;
