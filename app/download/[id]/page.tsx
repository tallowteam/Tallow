/**
 * File Download Page
 * User-friendly download experience for email fallback transfers
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { secureLog } from '@/lib/utils/secure-logger';
import { Download, Lock, AlertCircle, CheckCircle, Clock, FileIcon } from 'lucide-react';
import { decryptFile } from '@/lib/crypto/file-encryption-pqc';
import type { EncryptedFile } from '@/lib/crypto/file-encryption-pqc';

interface TransferInfo {
  id: string;
  files: Array<{
    filename: string;
    size: number;
    contentType?: string;
  }>;
  senderName: string;
  expiresAt: number;
  downloadsCount: number;
  maxDownloads?: number;
}

interface DownloadResponse {
  success: boolean;
  transfer: TransferInfo;
  encryptedFile: any;
  storageMetadata: any;
  error?: string;
  passwordProtected?: boolean;
}

export default function DownloadPage() {
  const params = useParams();
  const router = useRouter();
  const transferId = params?.['id'] as string ?? '';

  const [transfer, setTransfer] = useState<TransferInfo | null>(null);
  const [encryptedFileData, setEncryptedFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState('');
  const [downloadComplete, setDownloadComplete] = useState(false);

  // Fetch transfer information
  useEffect(() => {
    async function fetchTransfer() {
      try {
        const response = await fetch(`/api/email/download/${transferId}`);
        const data: DownloadResponse = await response.json();

        if (!response.ok) {
          if (data.passwordProtected) {
            setPasswordRequired(true);
            setLoading(false);
            return;
          }

          throw new Error(data.error || 'Failed to fetch transfer');
        }

        if (data.success) {
          setTransfer(data.transfer);
          setEncryptedFileData(data.encryptedFile);
        } else {
          throw new Error(data.error || 'Transfer not found');
        }

        setLoading(false);
      } catch (err) {
        secureLog.error('[Download] Failed to fetch transfer:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transfer');
        setLoading(false);
      }
    }

    if (transferId) {
      fetchTransfer();
    }
  }, [transferId]);

  // Handle password-protected download
  async function handlePasswordSubmit() {
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/email/download/${transferId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data: DownloadResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid password');
      }

      if (data.success) {
        setTransfer(data.transfer);
        setEncryptedFileData(data.encryptedFile);
        setPasswordRequired(false);
      } else {
        throw new Error(data.error || 'Failed to download');
      }

      setLoading(false);
    } catch (err) {
      secureLog.error('[Download] Password verification failed:', err);
      setError(err instanceof Error ? err.message : 'Invalid password');
      setLoading(false);
    }
  }

  // Handle file download
  async function handleDownload() {
    if (!transfer || !encryptedFileData) {
      setError('Transfer data not available');
      return;
    }

    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      // Reconstruct EncryptedFile from serialized data
      const encryptedFile: EncryptedFile = {
        metadata: {
          encryptedName: encryptedFileData.metadata.encryptedName,
          nameNonce: new Uint8Array(encryptedFileData.metadata.nameNonce),
          fileHash: new Uint8Array(encryptedFileData.metadata.fileHash),
          originalSize: encryptedFileData.metadata.originalSize,
          mimeCategory: encryptedFileData.metadata.mimeCategory,
          totalChunks: encryptedFileData.metadata.totalChunks,
          encryptedAt: encryptedFileData.metadata.encryptedAt,
          originalName: encryptedFileData.metadata.originalName,
        },
        chunks: encryptedFileData.chunks.map((chunk: any) => ({
          index: chunk.index,
          data: new Uint8Array(chunk.data),
          nonce: new Uint8Array(chunk.nonce),
          hash: new Uint8Array(chunk.hash),
        })),
      };

      // Note: In a real implementation, the decryption key would be derived from
      // the password or shared via a secure channel (e.g., in the email link)
      // For now, we'll use a placeholder key
      const decryptionKey = new Uint8Array(32); // This should come from the email link

      setDownloadProgress(30);
      secureLog.log('[Download] Decrypting file...');

      // Decrypt file
      const decryptedFile = await decryptFile(encryptedFile, decryptionKey);

      setDownloadProgress(70);

      // Create blob and trigger download
      const blob = new Blob([decryptedFile], { type: transfer.files[0]?.contentType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = transfer.files[0]?.filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloadProgress(100);
      setDownloadComplete(true);
      secureLog.log('[Download] File downloaded successfully:', transfer.files[0]?.filename);

      setTimeout(() => {
        setDownloading(false);
      }, 1000);
    } catch (err) {
      secureLog.error('[Download] Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
      setDownloading(false);
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  // Format expiry date
  function formatExpiryDate(timestamp: number): string {
    const now = new Date();
    const diff = timestamp - now.getTime();

    if (diff < 0) {return 'Expired';}
    if (diff < 60 * 60 * 1000) {return `${Math.floor(diff / (60 * 1000))} minutes`;}
    if (diff < 24 * 60 * 60 * 1000) {return `${Math.floor(diff / (60 * 60 * 1000))} hours`;}
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))} days`;
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading transfer...</p>
        </div>
      </div>
    );
  }

  // Password required state
  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Password Required</h1>
            <p className="text-muted-foreground">
              This transfer is password protected. Please enter the password provided by the sender.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                className="w-full px-3 py-2 border rounded-md bg-background"
                placeholder="Enter password"
                disabled={loading}
              />
            </div>

            <Button
              onClick={handlePasswordSubmit}
              disabled={loading || !password.trim()}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !transfer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Transfer Not Found</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Download complete state
  if (downloadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Download Complete</h1>
          <p className="text-muted-foreground mb-6">
            Your file has been downloaded successfully.
          </p>
          <Button onClick={() => router.push('/')}>Go to Home</Button>
        </div>
      </div>
    );
  }

  // Main download interface
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-2xl w-full bg-card rounded-lg shadow-lg border overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Download className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">
                {transfer?.senderName} sent you files
              </h1>
              <p className="text-muted-foreground">
                {transfer?.files.length} file{transfer?.files.length !== 1 ? 's' : ''} ready for download
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* File list */}
          <div className="mb-6">
            <h2 className="font-semibold mb-3">Files included:</h2>
            <div className="space-y-2">
              {transfer?.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-md"
                >
                  <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.filename}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer info */}
          <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-muted/50 rounded-md">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Expires in</p>
                <p className="font-medium">
                  {transfer ? formatExpiryDate(transfer.expiresAt) : 'N/A'}
                </p>
              </div>
            </div>
            {transfer?.maxDownloads && (
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                  <p className="font-medium">
                    {transfer.downloadsCount} / {transfer.maxDownloads}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Download button */}
          {downloading ? (
            <div className="space-y-2">
              <Progress value={downloadProgress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {downloadProgress < 30 && 'Preparing download...'}
                {downloadProgress >= 30 && downloadProgress < 70 && 'Decrypting file...'}
                {downloadProgress >= 70 && downloadProgress < 100 && 'Downloading...'}
                {downloadProgress === 100 && 'Complete!'}
              </p>
            </div>
          ) : (
            <Button
              onClick={handleDownload}
              disabled={downloading || !transfer || !encryptedFileData}
              className="w-full"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download Files
            </Button>
          )}

          {/* Security notice */}
          <div className="mt-6 p-4 bg-primary/5 rounded-md border border-primary/10">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-primary mb-1">Secure Transfer</p>
                <p className="text-muted-foreground">
                  This file is encrypted end-to-end and will be automatically deleted after download or expiration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
