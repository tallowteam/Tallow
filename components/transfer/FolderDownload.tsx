'use client';

/**
 * Folder Download Component
 * Handles downloading received folders with structure preservation
 */

import React, { useState, useCallback } from 'react';
import { Download, FolderDown, FileArchive, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  FolderStructure,
  downloadFolderAsZip,
  formatFileSize,
} from '@/lib/transfer/folder-transfer';
import { toast } from '@/lib/utils/toast';
import { cn } from '@/lib/utils';

export interface FolderDownloadProps {
  folderStructure: FolderStructure;
  autoDownload?: boolean;
  onDownloadComplete?: () => void;
  className?: string;
}

export function FolderDownload({
  folderStructure,
  autoDownload = false,
  onDownloadComplete,
  className,
}: FolderDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setCurrentFile('');
    setIsComplete(false);

    try {
      await downloadFolderAsZip(
        folderStructure,
        undefined,
        (progress, file) => {
          setDownloadProgress(progress);
          setCurrentFile(file);
        }
      );

      setIsComplete(true);
      toast.success('Folder downloaded', {
        description: `${folderStructure.name}.zip has been saved`,
      });
      onDownloadComplete?.();
    } catch (error) {
      console.error('Failed to download folder:', error);
      toast.error('Download failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsDownloading(false);
      setTimeout(() => {
        setDownloadProgress(0);
        setCurrentFile('');
      }, 2000);
    }
  }, [folderStructure, onDownloadComplete]);

  // Auto-download on mount if enabled
  React.useEffect(() => {
    if (autoDownload && !isDownloading && !isComplete) {
      handleDownload();
    }
  }, [autoDownload, isDownloading, isComplete, handleDownload]);

  return (
    <Card className={cn('p-4 rounded-2xl', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <FolderDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium mb-1">{folderStructure.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{folderStructure.fileCount} files</span>
              <span>•</span>
              <span>{formatFileSize(folderStructure.totalSize)}</span>
            </div>
          </div>

          {folderStructure.isCompressed && (
            <Badge variant="secondary" className="shrink-0">
              <FileArchive className="w-3 h-3 mr-1" />
              Compressed
            </Badge>
          )}
        </div>

        {/* Progress */}
        {isDownloading && (
          <div className="space-y-2">
            <Progress value={downloadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground truncate">
              {downloadProgress < 50 ? 'Reading files...' : 'Creating zip...'} {currentFile}
            </p>
          </div>
        )}

        {/* Download button */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 rounded-full"
          >
            {isDownloading ? (
              <>
                <FileArchive className="w-4 h-4 mr-2 animate-pulse" />
                Creating zip...
              </>
            ) : isComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Download complete
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download as ZIP
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="p-3 rounded-xl bg-secondary/50">
          <p className="text-xs text-muted-foreground">
            The folder will be downloaded as a ZIP file with its original structure preserved.
            Extract it to restore all files and folders.
          </p>
        </div>
      </div>
    </Card>
  );
}

export default FolderDownload;
