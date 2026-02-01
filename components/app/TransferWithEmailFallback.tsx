'use client';

/**
 * Example Component: Transfer with Email Fallback
 * Demonstrates how to integrate email fallback with P2P transfers
 */

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { EmailFallbackButton } from './EmailFallbackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Send, AlertCircle, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export function TransferWithEmailFallback() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [userName, _setUserName] = useState('Anonymous User');
  const [transferStatus, setTransferStatus] = useState<'idle' | 'connecting' | 'transferring' | 'success' | 'failed'>('idle');
  const [showEmailFallback, setShowEmailFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setTransferStatus('idle');
      setShowEmailFallback(false);
    }
  };

  const simulateP2PTransfer = async () => {
    if (!selectedFile) {return;}

    setTransferStatus('connecting');
    toast.loading('Connecting to peer...', { id: 'p2p-transfer' });

    // Simulate connection attempt
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate random success/failure (70% success rate)
    const success = Math.random() > 0.3;

    if (success) {
      setTransferStatus('transferring');
      toast.loading('Transferring file...', { id: 'p2p-transfer' });

      await new Promise(resolve => setTimeout(resolve, 3000));

      setTransferStatus('success');
      toast.success('File transferred successfully!', { id: 'p2p-transfer' });

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setTransferStatus('idle');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } else {
      setTransferStatus('failed');
      setShowEmailFallback(true);
      toast.error('P2P transfer failed', {
        id: 'p2p-transfer',
        description: 'Connection could not be established. Try email fallback.',
        duration: 5000,
      });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          File Transfer with Email Fallback
        </CardTitle>
        <CardDescription>
          Try P2P transfer first, fall back to email if it fails
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* File Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Select File</span>
            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setTransferStatus('idle');
                  setShowEmailFallback(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={transferStatus === 'connecting' || transferStatus === 'transferring'}
            >
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Select file to transfer"
            />

            {selectedFile && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transfer Status */}
        {transferStatus !== 'idle' && (
          <div className="rounded-lg border p-4">
            {transferStatus === 'connecting' && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Connecting to peer...</p>
                  <p className="text-xs text-muted-foreground">Establishing WebRTC connection</p>
                </div>
              </div>
            )}

            {transferStatus === 'transferring' && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Transferring file...</p>
                  <p className="text-xs text-muted-foreground">Sending encrypted data</p>
                </div>
              </div>
            )}

            {transferStatus === 'success' && (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Transfer successful!
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    File sent via P2P connection
                  </p>
                </div>
              </div>
            )}

            {transferStatus === 'failed' && (
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    P2P transfer failed
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Could not establish connection with peer
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email Fallback Section */}
        {showEmailFallback && (
          <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">P2P Failed - Try Email</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Send the file via email as a secure fallback option
                </p>
                <EmailFallbackButton
                  file={selectedFile}
                  senderName={userName}
                  variant="default"
                  onSuccess={() => {
                    setShowEmailFallback(false);
                    setSelectedFile(null);
                    setTransferStatus('idle');
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={simulateP2PTransfer}
              disabled={
                !selectedFile ||
                transferStatus === 'connecting' ||
                transferStatus === 'transferring' ||
                transferStatus === 'success'
              }
            >
              {transferStatus === 'connecting' || transferStatus === 'transferring' ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send via P2P
                </>
              )}
            </Button>

            {/* Always show email option for testing */}
            {selectedFile && transferStatus === 'idle' && (
              <EmailFallbackButton
                file={selectedFile}
                senderName={userName}
                variant="outline"
                onSuccess={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              />
            )}
          </div>

          {selectedFile && transferStatus === 'idle' && (
            <p className="text-xs text-muted-foreground">
              {selectedFile.size > 25 * 1024 * 1024
                ? 'Email: Secure link mode'
                : 'Email: Attachment mode'}
            </p>
          )}
        </div>

        {/* Info */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>How it works:</strong> First attempts P2P transfer for maximum speed and privacy.
            If P2P fails (network issues, NAT, etc.), seamlessly falls back to encrypted email delivery.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
