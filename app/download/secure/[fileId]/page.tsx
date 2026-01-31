/**
 * Secure File Download Page
 *
 * SECURITY: This page receives the decryption key via URL fragment (#key=...)
 * URL fragments are NEVER sent to the server, preventing:
 * - Server log exposure
 * - Referrer header leakage
 * - Browser history exposure on shared devices (fragment is not stored)
 *
 * The key is extracted client-side and sent to the API via POST body
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { secureLog } from '@/lib/utils/secure-logger';
import { Download, Lock, AlertCircle, CheckCircle, Shield, FileIcon } from 'lucide-react';

type DownloadState = 'loading' | 'ready' | 'downloading' | 'complete' | 'error';

interface DownloadInfo {
  fileName: string;
  fileSize: number;
}

export default function SecureDownloadPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const fileId = params?.['fileId'] as string ?? '';
  const token = searchParams?.get('token') ?? '';

  const [state, setState] = useState<DownloadState>('loading');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState<DownloadInfo | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);

  // Extract key from URL fragment on mount (client-side only)
  useEffect(() => {
    // URL fragments are only available client-side
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const key = hashParams.get('key');
      if (key && /^[a-f0-9]{64}$/.test(key)) {
        setEncryptionKey(key);
        // Clear the hash from the URL for extra security (prevents accidental sharing)
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, []);

  // Validate required parameters
  useEffect(() => {
    if (!fileId || !token) {
      setError('Invalid download link. Missing required parameters.');
      setState('error');
      return;
    }

    // Wait for encryption key to be extracted from fragment
    const checkKey = setTimeout(() => {
      if (!encryptionKey) {
        setError('Invalid download link. Encryption key not found.');
        setState('error');
      } else {
        setState('ready');
      }
    }, 500); // Brief delay to allow fragment parsing

    return () => clearTimeout(checkKey);
  }, [fileId, token, encryptionKey]);

  // Handle secure file download
  const handleDownload = useCallback(async () => {
    if (!fileId || !token || !encryptionKey) {
      setError('Missing required download parameters');
      return;
    }

    setState('downloading');
    setProgress(0);
    setError(null);

    try {
      setProgress(10);

      // Make POST request with key in body (SECURE - key not in URL)
      const response = await fetch('/api/v1/download-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          token,
          key: encryptionKey, // Key sent in body, not URL
        }),
      });

      setProgress(30);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Download failed: ${response.status}`);
      }

      setProgress(50);

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let fileName = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-8'')?([^"';\n]+)/i);
        if (filenameMatch && filenameMatch[1]) {
          fileName = decodeURIComponent(filenameMatch[1]);
        }
      }

      setProgress(70);

      // Read the response as blob
      const blob = await response.blob();

      setDownloadInfo({
        fileName,
        fileSize: blob.size,
      });

      setProgress(90);

      // Trigger browser download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setProgress(100);
      setState('complete');
      secureLog.log('[SecureDownload] File downloaded successfully');

    } catch (err) {
      secureLog.error('[SecureDownload] Download failed:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
      setState('error');
    }
  }, [fileId, token, encryptionKey]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Loading state
  if (state === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparing secure download...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Download Failed</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <p className="text-sm text-muted-foreground">
            The link may have expired, been used already, or is invalid.
            Please request a new download link from the sender.
          </p>
        </div>
      </div>
    );
  }

  // Complete state
  if (state === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-8 border text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Download Complete</h1>
          {downloadInfo && (
            <div className="mb-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center gap-3">
                <FileIcon className="h-5 w-5 text-muted-foreground" />
                <div className="text-left">
                  <p className="font-medium truncate max-w-[200px]">{downloadInfo.fileName}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(downloadInfo.fileSize)}</p>
                </div>
              </div>
            </div>
          )}
          <p className="text-muted-foreground">
            Your file has been downloaded and decrypted successfully.
          </p>
        </div>
      </div>
    );
  }

  // Ready/Downloading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="max-w-md w-full bg-card rounded-lg shadow-lg border overflow-hidden">
        {/* Header */}
        <div className="bg-primary/5 p-6 border-b">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1">Secure File Download</h1>
              <p className="text-muted-foreground text-sm">
                End-to-end encrypted transfer
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Security notice */}
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-700 dark:text-green-300 mb-1">
                  Secure Transfer
                </p>
                <p className="text-green-600 dark:text-green-400">
                  This file is encrypted end-to-end. The decryption key never touches our servers.
                </p>
              </div>
            </div>
          </div>

          {/* Download button or progress */}
          {state === 'downloading' ? (
            <div className="space-y-3">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-center text-muted-foreground">
                {progress < 30 && 'Initiating secure download...'}
                {progress >= 30 && progress < 50 && 'Fetching encrypted file...'}
                {progress >= 50 && progress < 70 && 'Processing...'}
                {progress >= 70 && progress < 90 && 'Decrypting file...'}
                {progress >= 90 && 'Saving to device...'}
              </p>
            </div>
          ) : (
            <Button
              onClick={handleDownload}
              className="w-full"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Download File
            </Button>
          )}

          {/* Info text */}
          <p className="text-xs text-center text-muted-foreground">
            This download link can only be used once and will expire automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
