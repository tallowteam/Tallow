'use client';

/**
 * Group Transfer Confirm Dialog
 * Confirmation dialog for initiating group file transfers
 */

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  FileText,
  AlertTriangle,
  Info,
  Zap,
  Shield,
  Network,
} from 'lucide-react';
import { Device } from '@/lib/types';
import { formatFileSize } from '@/lib/hooks/use-file-transfer';

interface GroupTransferConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  files: File[];
  recipients: Device[];
  onConfirm: () => void;
  onCancel?: () => void;
  bandwidthLimitPerRecipient?: number;
}

/**
 * Calculate total transfer size for all recipients
 */
function calculateTotalTransferSize(files: File[], recipientCount: number): number {
  const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
  return totalFileSize * recipientCount;
}

/**
 * Estimate transfer time (rough estimate)
 */
function estimateTransferTime(
  totalSize: number,
  recipientCount: number,
  bandwidthPerRecipient?: number
): string {
  // Default to 1 MB/s per recipient if no limit
  const effectiveSpeed = bandwidthPerRecipient || 1024 * 1024;
  const parallelSpeed = effectiveSpeed * Math.min(recipientCount, 3); // Assume max 3 parallel
  const seconds = totalSize / parallelSpeed;

  if (seconds < 60) {return `~${Math.ceil(seconds)}s`;}
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) {return `~${minutes}m`;}
  const hours = Math.ceil(minutes / 60);
  return `~${hours}h`;
}

export function GroupTransferConfirmDialog({
  open,
  onOpenChange,
  files,
  recipients,
  onConfirm,
  onCancel,
  bandwidthLimitPerRecipient,
}: GroupTransferConfirmDialogProps) {
  // Calculate statistics
  const stats = useMemo(() => {
    const totalFileSize = files.reduce((sum, file) => sum + file.size, 0);
    const totalTransferSize = calculateTotalTransferSize(files, recipients.length);
    const estimatedTime = estimateTransferTime(
      totalFileSize,
      recipients.length,
      bandwidthLimitPerRecipient
    );

    return {
      totalFileSize,
      totalTransferSize,
      estimatedTime,
    };
  }, [files, recipients, bandwidthLimitPerRecipient]);

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        aria-describedby="group-transfer-confirm-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" aria-hidden="true" />
            Confirm Group Transfer
          </DialogTitle>
          <DialogDescription id="group-transfer-confirm-description">
            Review transfer details before sending to multiple recipients
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Summary card */}
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    You are about to send {files.length} file
                    {files.length !== 1 ? 's' : ''} to {recipients.length} recipient
                    {recipients.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="text-xs text-muted-foreground">File Size</div>
                      <div className="text-sm font-medium">
                        {formatFileSize(stats.totalFileSize)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Transfer</div>
                      <div className="text-sm font-medium">
                        {formatFileSize(stats.totalTransferSize)}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Estimated Time</div>
                      <div className="text-sm font-medium">{stats.estimatedTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Files to send */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              Files to Send
            </h3>
            <Card className="p-3">
              <ScrollArea className="max-h-32">
                <ul className="space-y-2" aria-label="Files to send">
                  {files.map((file, index) => (
                    <li key={index} className="flex items-center justify-between gap-2">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {formatFileSize(file.size)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>
          </div>

          <Separator />

          {/* Recipients */}
          <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" aria-hidden="true" />
              Recipients ({recipients.length})
            </h3>
            <Card className="p-3">
              <ScrollArea className="max-h-40">
                <ul className="space-y-2" aria-label="Recipients">
                  {recipients.map((recipient) => (
                    <li
                      key={recipient.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {recipient.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {recipient.platform}
                          {recipient.isOnline ? (
                            <span className="text-green-600 ml-2">• Online</span>
                          ) : (
                            <span className="text-muted-foreground ml-2">• Offline</span>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>
          </div>

          <Separator />

          {/* Security & Performance info */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Transfer Details</h3>
            <div className="grid gap-2">
              <div className="flex items-start gap-2 text-sm">
                <Shield className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <span className="font-medium">End-to-end encryption</span>
                  <p className="text-xs text-muted-foreground">
                    Each recipient gets independent PQC encryption (ML-KEM-768 + X25519)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm">
                <Network className="w-4 h-4 text-[#fefefc] flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <span className="font-medium">Parallel transfer</span>
                  <p className="text-xs text-muted-foreground">
                    Files are sent simultaneously to all recipients
                  </p>
                </div>
              </div>

              {bandwidthLimitPerRecipient && (
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1">
                    <span className="font-medium">Bandwidth limit</span>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(bandwidthLimitPerRecipient)}/s per recipient
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Warning for large transfers */}
          {stats.totalTransferSize > 100 * 1024 * 1024 && (
            <Card className="p-3 bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1 text-sm">
                  <span className="font-medium">Large transfer</span>
                  <p className="text-xs text-muted-foreground mt-1">
                    This transfer will send {formatFileSize(stats.totalTransferSize)} of
                    data across {recipients.length} connections. Make sure you have a
                    stable internet connection.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Partial failure warning */}
          <Card className="p-3 bg-white/5 dark:bg-white/5 border-white/20 dark:border-white/10">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#fefefc] flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1 text-sm">
                <span className="font-medium">Graceful failure handling</span>
                <p className="text-xs text-muted-foreground mt-1">
                  If any recipient fails, the transfer will continue to other recipients.
                  You'll see individual status for each recipient.
                </p>
              </div>
            </div>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Start Transfer to {recipients.length} Recipient
            {recipients.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
