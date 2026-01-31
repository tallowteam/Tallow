/**
 * Email Fallback System - Public API
 * Centralized exports for email fallback functionality
 */

// Storage
export {
  uploadTempFile,
  downloadTempFile,
  cleanupExpiredFiles,
  getStorageStats,
  type StoredFile,
  type UploadOptions,
} from '../storage/temp-file-storage';

// Email Templates
export { FileTransferEmail } from '../emails/file-transfer-email';

// UI Components
export { EmailFallbackDialog } from '../../components/app/EmailFallbackDialog';
export { EmailFallbackButton } from '../../components/app/EmailFallbackButton';
export { TransferWithEmailFallback } from '../../components/app/TransferWithEmailFallback';

// Utilities
export {
  getApiKey,
  setApiKey,
  clearApiKey,
  hasApiKey,
  requireApiKey,
  createApiHeaders,
  apiFetch,
} from '../utils/api-key-manager';

// Constants
export const EMAIL_FALLBACK_CONFIG = {
  MAX_ATTACHMENT_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_FILE_SIZE: Number.MAX_SAFE_INTEGER, // No size limit - unlimited P2P transfer
  DEFAULT_EXPIRATION_HOURS: 24,
  DEFAULT_MAX_DOWNLOADS: 1,
  RATE_LIMIT_PER_MINUTE: 3,
} as const;

// Types
export type EmailFallbackMode = 'attachment' | 'link';
export type EmailTransferStatus = 'idle' | 'uploading' | 'sending' | 'success' | 'error';

export interface EmailFallbackOptions {
  recipientEmail: string;
  senderName: string;
  file: File;
  expirationHours?: number;
  maxDownloads?: number;
}

export interface EmailFallbackResult {
  success: boolean;
  emailId?: string;
  downloadUrl?: string;
  expiresAt?: number;
  error?: string;
}

/**
 * Programmatic API for sending files via email
 */
export async function sendFileViaEmail(
  options: EmailFallbackOptions
): Promise<EmailFallbackResult> {
  const {
    recipientEmail,
    senderName,
    file,
    expirationHours = EMAIL_FALLBACK_CONFIG.DEFAULT_EXPIRATION_HOURS,
    maxDownloads = EMAIL_FALLBACK_CONFIG.DEFAULT_MAX_DOWNLOADS,
  } = options;

  try {
    // Import required modules
    const { apiFetch } = await import('../utils/api-key-manager');
    const { uploadTempFile } = await import('../storage/temp-file-storage');
    const { pqCrypto } = await import('../crypto/pqc-crypto');

    // Generate encryption key
    const encryptionKey = pqCrypto.randomBytes(32);
    const encryptionKeyHex = Array.from(encryptionKey)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expiresAt = Date.now() + (expirationHours * 60 * 60 * 1000);
    const mode: EmailFallbackMode = file.size <= EMAIL_FALLBACK_CONFIG.MAX_ATTACHMENT_SIZE
      ? 'attachment'
      : 'link';

    let downloadUrl: string | undefined;
    let fileData: string | undefined;

    if (mode === 'link') {
      // Upload to temporary storage
      const { fileId, downloadToken } = await uploadTempFile(file, encryptionKey, {
        expirationHours,
        maxDownloads,
      });

      // Generate secure download URL with key in fragment (not sent to server)
      // SECURITY: URL fragments (#...) are never sent to the server, preventing:
      // - Server log exposure
      // - Referrer header leakage
      // - Browser history exposure on shared devices
      downloadUrl = `${window.location.origin}/download/secure/${fileId}?token=${downloadToken}#key=${encryptionKeyHex}`;
    } else {
      // Convert to base64 for attachment
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
    }

    // Send email
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

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }

    const result = await response.json();

    return {
      success: true,
      emailId: result.emailId,
      ...(downloadUrl ? { downloadUrl } : {}),
      expiresAt,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
