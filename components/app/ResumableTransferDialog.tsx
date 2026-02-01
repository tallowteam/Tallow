'use client';

/**
 * Resumable Transfer Dialog
 * Shows list of resumable transfers with resume/delete actions
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Play, Trash2, RefreshCw, Download } from 'lucide-react';
import { ResumableTransferItem } from '@/lib/hooks/use-resumable-transfer';

interface ResumableTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfers: ResumableTransferItem[];
  onResume: (transferId: string) => void;
  onDelete: (transferId: string) => void;
  onRefresh: () => void;
  isResuming?: boolean;
}

export function ResumableTransferDialog({
  open,
  onOpenChange,
  transfers,
  onResume,
  onDelete,
  onRefresh,
  isResuming = false,
}: ResumableTransferDialogProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Resumable Transfers
          </DialogTitle>
          <DialogDescription>
            Resume interrupted transfers from previous sessions
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Refresh button */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isResuming}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Transfer list */}
          <ScrollArea className="h-[400px] pr-4">
            {transfers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                <Download className="h-12 w-12 mb-4 opacity-20" />
                <p>No resumable transfers</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transfers.map((transfer) => (
                  <div
                    key={transfer.transferId}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    {/* File info */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {transfer.fileName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(transfer.fileSize)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDistanceToNow(transfer.lastUpdated, {
                          addSuffix: true,
                        })}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {transfer.receivedChunks} / {transfer.totalChunks} chunks
                        </span>
                        <span className="font-medium">
                          {transfer.progress.toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={transfer.progress} />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => onResume(transfer.transferId)}
                        disabled={!transfer.canResume || isResuming}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(transfer.transferId)}
                        disabled={isResuming}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResumableTransferDialog;
