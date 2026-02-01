'use client';

/**
 * Resumable Transfer Example
 * Demonstrates complete integration of resumable transfer functionality
 */

import React, { useState } from 'react';
import { useResumableTransfer } from '@/lib/hooks/use-resumable-transfer';
import { ResumableTransferDialog } from './ResumableTransferDialog';
import { ConnectionLostBanner } from './ConnectionLostBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export function ResumableTransferExample() {
  const [showResumableDialog, setShowResumableDialog] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const {
    // State
    isNegotiating: _isNegotiating,
    isTransferring,
    isResuming,
    progress,
    error,
    sessionReady,
    connectionLost,
    currentTransferId,
    resumableTransfers,
    autoResumeEnabled,
    autoResumeCountdown,

    // Actions
    initializeSender,
    initializeReceiver: _initializeReceiver,
    setPeerPublicKey: _setPeerPublicKey,
    setDataChannel: _setDataChannel,
    sendFile,
    resumeTransfer,
    deleteResumableTransfer,
    loadResumableTransfers,
    cancelAutoResume,
    toggleAutoResume,
  } = useResumableTransfer({
    autoResume: true,
    resumeTimeout: 30000,
    maxResumeAttempts: 3,
    onTransferComplete: (blob, filename, _relativePath) => {
      toast.success('Transfer complete!', {
        description: `${filename} (${formatBytes(blob.size)})`,
      });
      // Handle downloaded file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (error) => {
      toast.error('Transfer error', {
        description: error.message,
      });
    },
    onConnectionLost: () => {
      setShowBanner(true);
    },
    onResumeAvailable: (_transferId, progress) => {
      toast.info('Resume available', {
        description: `Transfer ${progress.toFixed(1)}% complete`,
      });
    },
  });

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}

    try {
      if (!sessionReady) {
        await initializeSender();
        // In real app, exchange keys with peer here
      }

      await sendFile(file);
    } catch (err) {
      console.error('Failed to send file:', err);
    }
  };

  const handleResumeFromBanner = async () => {
    if (currentTransferId) {
      try {
        await resumeTransfer(currentTransferId);
        setShowBanner(false);
      } catch (err) {
        console.error('Failed to resume:', err);
      }
    }
  };

  const handleCancelAutoResume = () => {
    cancelAutoResume();
    setShowBanner(false);
  };

  return (
    <div className="space-y-6">
      {/* Connection Lost Banner */}
      {connectionLost && showBanner && (
        <ConnectionLostBanner
          visible
          transferId={currentTransferId}
          progress={progress}
          autoResumeEnabled={autoResumeEnabled}
          autoResumeCountdown={autoResumeCountdown}
          onResume={handleResumeFromBanner}
          onCancel={handleCancelAutoResume}
          onDismiss={() => setShowBanner(false)}
        />
      )}

      {/* Main Transfer Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Resumable File Transfer</CardTitle>
              <CardDescription>
                Send files with automatic resume on connection loss
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={sessionReady ? 'default' : 'secondary'}>
                {sessionReady ? 'Ready' : 'Not Ready'}
              </Badge>
              {connectionLost && (
                <Badge variant="destructive">
                  Connection Lost
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Transfer Progress */}
          {(isTransferring || isResuming) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {isResuming ? 'Resuming...' : 'Transferring...'}
                </span>
                <span className="font-medium">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={!sessionReady || isTransferring}
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Send File
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => setShowResumableDialog(true)}
              disabled={resumableTransfers.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Resume ({resumableTransfers.length})
            </Button>

            <Button
              variant="outline"
              onClick={loadResumableTransfers}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Settings */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-resume">Auto-Resume</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically resume interrupted transfers
                </p>
              </div>
              <Switch
                id="auto-resume"
                checked={autoResumeEnabled}
                onCheckedChange={toggleAutoResume}
              />
            </div>
          </div>

          {/* Statistics */}
          {resumableTransfers.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2">Resumable Transfers</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <span className="ml-2 font-medium">
                    {resumableTransfers.length}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Can Resume:</span>
                  <span className="ml-2 font-medium">
                    {resumableTransfers.filter((t) => t.canResume).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Resumable Transfers Dialog */}
      <ResumableTransferDialog
        open={showResumableDialog}
        onOpenChange={setShowResumableDialog}
        transfers={resumableTransfers}
        onResume={(transferId) => {
          resumeTransfer(transferId);
          setShowResumableDialog(false);
        }}
        onDelete={deleteResumableTransfer}
        onRefresh={loadResumableTransfers}
        isResuming={isResuming}
      />
    </div>
  );
}

export default ResumableTransferExample;
