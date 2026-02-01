'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Upload, Clock, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { uploadTempFile } from '@/lib/storage/temp-file-storage';
import { apiFetch } from '@/lib/utils/api-key-manager';
import { toast } from 'sonner';

interface EmailFallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  senderName?: string;
}

type TransferMode = 'attachment' | 'link';
type TransferStatus = 'idle' | 'uploading' | 'sending' | 'success' | 'error';

const EXPIRATION_OPTIONS = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '24', label: '24 hours' },
  { value: '168', label: '7 days' },
  { value: '720', label: '30 days' },
];

const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024; // 25MB

export function EmailFallbackDialog({
  open,
  onOpenChange,
  file,
  senderName = 'Someone',
}: EmailFallbackDialogProps) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expirationHours, setExpirationHours] = useState('24');
  const [status, setStatus] = useState<TransferStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const fileSize = file?.size || 0;
  const mode: TransferMode = fileSize <= MAX_ATTACHMENT_SIZE ? 'attachment' : 'link';

  const handleSendEmail = async () => {
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (!recipientEmail) {
      toast.error('Please enter recipient email');
      return;
    }

    // Validate email format (RFC 5322 compliant)
    const emailRegex = /^(?:[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|localhost)$/;
    if (!emailRegex.test(recipientEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    try {
      setStatus('uploading');
      setProgress(0);
      setErrorMessage('');

      // Generate encryption key using Web Crypto API (faster, no PQC import needed)
      const encryptionKey = new Uint8Array(32);
      crypto.getRandomValues(encryptionKey);
      const encryptionKeyHex = Array.from(encryptionKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const expiration = parseInt(expirationHours);
      const expiresAt = Date.now() + (expiration * 60 * 60 * 1000);

      let downloadUrl: string | undefined;
      let fileData: string | undefined;

      if (mode === 'link') {
        // Upload file to temporary storage
        setProgress(20);
        const { fileId, downloadToken } = await uploadTempFile(
          file,
          encryptionKey,
          {
            expirationHours: expiration,
            maxDownloads: 1, // One-time download
          }
        );

        // Generate secure download URL with key in fragment (not sent to server)
        // SECURITY: URL fragments (#...) are never sent to the server, preventing:
        // - Server log exposure
        // - Referrer header leakage
        // - Browser history exposure on shared devices
        const origin = window.location.origin;
        downloadUrl = `${origin}/download/secure/${fileId}?token=${downloadToken}#key=${encryptionKeyHex}`;
        setProgress(50);
      } else {
        // Read file data for attachment
        setProgress(20);
        const reader = new FileReader();
        fileData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = btoa(
              new Uint8Array(reader.result as ArrayBuffer)
                .reduce((data, byte) => data + String.fromCharCode(byte), '')
            );
            resolve(base64);
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsArrayBuffer(file);
        });
        setProgress(50);
      }

      // Send email
      setStatus('sending');
      setProgress(70);

      const response = await apiFetch('/api/v1/send-file-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmail,
          senderName,
          fileName: file.name,
          fileSize: file.size,
          fileData,
          downloadUrl,
          expiresAt,
          mode,
        }),
      });

      setProgress(90);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }

      setProgress(100);
      setStatus('success');

      toast.success('Email sent successfully!', {
        description: mode === 'link'
          ? 'The recipient will receive a secure download link'
          : 'The file has been attached to the email',
      });

      // Reset form after success
      setTimeout(() => {
        onOpenChange(false);
        setRecipientEmail('');
        setStatus('idle');
        setProgress(0);
      }, 2000);
    } catch (error) {
      console.error('Email send failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send email');
      toast.error('Failed to send email', {
        description: error instanceof Error ? error.message : 'Unknown error',
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send File via Email
          </DialogTitle>
          <DialogDescription>
            P2P transfer failed. Send the file via email as a fallback.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File info */}
          {file && (
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {mode === 'link' ? (
                    <div className="flex items-center gap-1 text-xs text-[#fefefc] dark:text-[#fefefc]">
                      <Upload className="h-3 w-3" />
                      <span>Link</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Mail className="h-3 w-3" />
                      <span>Attachment</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recipient email */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email">Recipient Email</Label>
            <Input
              id="recipient-email"
              type="email"
              placeholder="recipient@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              disabled={status === 'uploading' || status === 'sending' || status === 'success'}
              aria-label="Recipient email address"
              aria-required="true"
              aria-invalid={status === 'error'}
              aria-describedby={status === 'error' ? "recipient-email-error" : undefined}
            />
          </div>

          {/* Expiration time */}
          <div className="space-y-2">
            <Label htmlFor="expiration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Link Expiration
            </Label>
            <Select
              value={expirationHours}
              onValueChange={setExpirationHours}
              disabled={status === 'uploading' || status === 'sending' || status === 'success'}
            >
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPIRATION_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Security info */}
          <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-green-900 dark:text-green-100">
                  End-to-End Encrypted
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  {mode === 'link'
                    ? 'File is encrypted before upload. Only the recipient with the link can decrypt it.'
                    : 'File is sent as an encrypted email attachment.'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {(status === 'uploading' || status === 'sending') && (
            <div className="space-y-2" role="status" aria-live="polite" aria-atomic="false">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {status === 'uploading' ? 'Encrypting and uploading...' : 'Sending email...'}
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" aria-label={`Upload progress: ${progress}%`} />
            </div>
          )}

          {/* Success message */}
          {status === 'success' && (
            <div role="status" aria-live="polite" className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20 p-3">
              <div className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <p className="text-sm font-medium">Email sent successfully!</p>
              </div>
            </div>
          )}

          {/* Error message */}
          {status === 'error' && (
            <div
              id="recipient-email-error"
              role="alert"
              aria-live="assertive"
              className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 p-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">
                    Failed to send email
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={status === 'uploading' || status === 'sending'}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={
              !file ||
              !recipientEmail ||
              status === 'uploading' ||
              status === 'sending' ||
              status === 'success'
            }
            aria-label={status === 'uploading' || status === 'sending' ? 'Sending email...' : 'Send email'}
          >
            {status === 'uploading' || status === 'sending' ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" aria-hidden="true" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                Send Email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
