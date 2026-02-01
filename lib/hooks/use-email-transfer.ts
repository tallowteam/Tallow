/**
 * Email Transfer Hook
 * React hook for sending files via email
 */

import { useState, useCallback } from 'react';
import { withCSRF } from '@/lib/security/csrf';
import { secureLog } from '@/lib/utils/secure-logger';
import type {
  EmailTransferOptions,
  EmailDeliveryStatus,
  EmailBatchRequest,
  EmailBatchStatus,
} from '@/lib/email/types';

interface UseEmailTransferResult {
  sendEmail: (options: Partial<EmailTransferOptions> & {
    recipientEmail: string;
    senderName: string;
    files: EmailTransferOptions['files'];
  }) => Promise<EmailDeliveryStatus>;
  sendBatch: (request: EmailBatchRequest) => Promise<EmailBatchStatus>;
  checkStatus: (transferId: string) => Promise<EmailDeliveryStatus | null>;
  isSending: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Hook for email file transfers
 */
export function useEmailTransfer(): UseEmailTransferResult {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const sendEmail = useCallback(async (
    options: Partial<EmailTransferOptions> & {
      recipientEmail: string;
      senderName: string;
      files: EmailTransferOptions['files'];
    }
  ): Promise<EmailDeliveryStatus> => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        ...withCSRF(),
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      secureLog.log(`[useEmailTransfer] Email sent: ${data.transfer.id}`);

      return data.transfer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      secureLog.error('[useEmailTransfer] Failed to send email:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const sendBatch = useCallback(async (
    request: EmailBatchRequest
  ): Promise<EmailBatchStatus> => {
    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/email/batch', {
        method: 'POST',
        ...withCSRF(),
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send batch emails');
      }

      secureLog.log(
        `[useEmailTransfer] Batch sent: ${data.batch.batchId}, ` +
        `${data.batch.sent} succeeded, ${data.batch.failed} failed`
      );

      return data.batch;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      secureLog.error('[useEmailTransfer] Failed to send batch:', err);
      throw err;
    } finally {
      setIsSending(false);
    }
  }, []);

  const checkStatus = useCallback(async (
    transferId: string
  ): Promise<EmailDeliveryStatus | null> => {
    try {
      const response = await fetch(`/api/email/status/${transferId}`);

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(data.error || 'Failed to check status');
      }

      return data.status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      secureLog.error('[useEmailTransfer] Failed to check status:', err);
      return null;
    }
  }, []);

  return {
    sendEmail,
    sendBatch,
    checkStatus,
    isSending,
    error,
    clearError,
  };
}

/**
 * Helper: Convert File objects to EmailFileAttachment format
 */
export async function fileToAttachment(
  file: File
): Promise<EmailTransferOptions['files'][0]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const base64Content = (reader.result as string).split(',')[1];

      if (!base64Content) {
        reject(new Error(`Failed to extract base64 content from file: ${file.name}`));
        return;
      }

      resolve({
        filename: file.name,
        content: base64Content,
        size: file.size,
        contentType: file.type,
      });
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Helper: Convert multiple files to attachments
 */
export async function filesToAttachments(
  files: File[]
): Promise<EmailTransferOptions['files']> {
  return Promise.all(files.map(file => fileToAttachment(file)));
}

export default useEmailTransfer;
