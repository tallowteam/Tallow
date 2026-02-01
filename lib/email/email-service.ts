/**
 * Email Service
 * Main service for sending file transfers via email using Resend
 */

import { Resend } from 'resend';
import { randomBytes } from 'crypto';
import { secureLog } from '../utils/secure-logger';
import { compressFiles, shouldCompress } from './file-compression';
import { encryptWithPassword } from './password-protection';
import {
  storeEmailTransfer,
  recordAnalyticsEvent,
} from './email-storage';
import { getRetryManager } from './retry-manager';
import type {
  EmailTransferOptions,
  EmailDeliveryStatus,
  EmailFileAttachment,
  EmailBatchRequest,
  EmailBatchStatus,
  StoredEmailTransfer,
} from './types';
import {
  DEFAULT_EXPIRATION_MS,
  MAX_FILE_SIZE,
  MAX_ATTACHMENT_SIZE,
  MAX_BATCH_SIZE,
  MAX_FILES_PER_EMAIL,
} from './types';

// Initialize Resend (API key from env)
// Use a placeholder during build time if the API key is not set
const resend = new Resend(process.env['RESEND_API_KEY'] || 'placeholder_key');

/**
 * Generate unique transfer ID
 */
function generateTransferId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate download URL for transfer
 */
function generateDownloadUrl(transferId: string, baseUrl?: string): string {
  const base = baseUrl || process.env['NEXT_PUBLIC_APP_URL'] || 'http://localhost:3000';
  return `${base}/download/${transferId}`;
}

/**
 * Validate file attachments
 */
function validateFiles(files: EmailFileAttachment[]): void {
  if (files.length === 0) {
    throw new Error('At least one file is required');
  }

  if (files.length > MAX_FILES_PER_EMAIL) {
    throw new Error(`Maximum ${MAX_FILES_PER_EMAIL} files per email`);
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  if (totalSize > MAX_FILE_SIZE) {
    throw new Error(`Total file size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`);
  }

  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_SIZE) {
      throw new Error(
        `File ${file.filename} exceeds ${MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB limit`
      );
    }

    if (!file.filename || file.filename.trim() === '') {
      throw new Error('All files must have valid filenames');
    }
  }
}

/**
 * Prepare email HTML content
 */
function generateEmailHtml(
  options: EmailTransferOptions,
  downloadUrl: string,
  expiresAt: number
): string {
  const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const filesList = options.files
    .map(f => `<li>${f.filename} (${(f.size / 1024).toFixed(1)} KB)</li>`)
    .join('');

  const branding = options.branding || {};
  const companyName = branding.companyName || 'Tallow';
  const primaryColor = branding.primaryColor || '#3b82f6';
  const logoUrl = branding.logoUrl || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>File Transfer from ${options.senderName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          ${logoUrl ? `
          <tr>
            <td align="center" style="padding: 32px 32px 0;">
              <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 32px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #111827;">
                📁 ${options.senderName} sent you files
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.5; color: #6b7280;">
                You have received ${options.files.length} file${options.files.length > 1 ? 's' : ''} via secure transfer.
              </p>

              ${options.password ? `
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 24px; border-radius: 4px;">
                <p style="margin: 0; font-size: 14px; color: #92400e;">
                  <strong>🔒 Password Protected:</strong> This transfer is password protected. You'll need to enter the password provided by the sender to download the files.
                </p>
              </div>
              ` : ''}

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
                <h2 style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">
                  Files Included
                </h2>
                <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #6b7280; line-height: 1.8;">
                  ${filesList}
                </ul>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 24px;">
                    <a href="${downloadUrl}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      Download Files
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                <strong>Expires:</strong> ${expiryDate}
              </p>

              ${options.maxDownloads ? `
              <p style="margin: 0 0 12px; font-size: 14px; color: #6b7280;">
                <strong>Download limit:</strong> ${options.maxDownloads} time${options.maxDownloads > 1 ? 's' : ''}
              </p>
              ` : ''}

              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">
                  If the button doesn't work, copy and paste this link:
                </p>
                <p style="margin: 0; font-size: 12px; color: #3b82f6; word-break: break-all;">
                  ${downloadUrl}
                </p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                Secure file transfer powered by ${companyName}
                ${branding.supportEmail ? ` • <a href="mailto:${branding.supportEmail}" style="color: #3b82f6; text-decoration: none;">Support</a>` : ''}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Send email transfer
 */
export async function sendEmailTransfer(
  options: EmailTransferOptions
): Promise<EmailDeliveryStatus> {
  try {
    // Validate
    validateFiles(options.files);

    const transferId = generateTransferId();
    const now = Date.now();

    // Calculate expiration
    const expiresAt = options.expiresAt ||
                     (options.expiresIn ? now + options.expiresIn : now + DEFAULT_EXPIRATION_MS);

    // Prepare files
    const attachmentFile = options.files[0];
    if (!attachmentFile) {
      throw new Error('No files to send');
    }
    let attachmentFilename = attachmentFile.filename;
    let attachmentContent = attachmentFile.content;

    // Compress if beneficial
    if (options.compress !== false && shouldCompress(options.files, options.files.reduce((s, f) => s + f.size, 0))) {
      const compressed = await compressFiles(options.files);
      attachmentFilename = compressed.filename;
      attachmentContent = compressed.buffer;

      secureLog.log(
        `[EmailService] Compressed ${options.files.length} files: ` +
        `${compressed.originalSize} → ${compressed.compressedSize} bytes ` +
        `(${compressed.compressionRatio.toFixed(1)}% reduction)`
      );
    }

    // Encrypt if password protected
    if (options.password) {
      const fileBuffer = typeof attachmentContent === 'string'
        ? Buffer.from(attachmentContent, 'base64')
        : attachmentContent;

      const encrypted = encryptWithPassword(fileBuffer, options.password);

      // Store encrypted data separately (not in email)
      // In production, this would go to S3/cloud storage
      attachmentContent = Buffer.from(JSON.stringify(encrypted));
      attachmentFilename = `${attachmentFilename}.encrypted`;

      secureLog.log(`[EmailService] Password-protected transfer ${transferId}`);
    }

    const downloadUrl = generateDownloadUrl(transferId);

    // Generate email HTML
    const emailHtml = generateEmailHtml(options, downloadUrl, expiresAt);

    // Send via Resend
    const emailOptions: {
      from: string;
      to: string;
      subject: string;
      html: string;
      attachments?: Array<{ filename: string; content: string | Buffer }>;
      tags: Array<{ name: string; value: string }>;
      headers?: Record<string, string>;
    } = {
      from: options.senderEmail || process.env['RESEND_FROM_EMAIL'] || 'transfers@tallow.app',
      to: options.recipientEmail,
      subject: `📁 ${options.senderName} shared files with you`,
      html: emailHtml,
      tags: [
        { name: 'transfer_id', value: transferId },
        { name: 'sender', value: options.senderName },
      ],
    };

    // Add attachments only if not password protected
    if (!options.password) {
      emailOptions.attachments = [
        {
          filename: attachmentFilename,
          content: attachmentContent,
        },
      ];
    }

    // Add metadata as headers if provided
    if (options.metadata) {
      emailOptions.headers = options.metadata;
    }

    const { error } = await resend.emails.send(emailOptions);

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    // Store transfer record
    const storedTransfer: StoredEmailTransfer = {
      id: transferId,
      recipientEmail: options.recipientEmail,
      senderName: options.senderName,
      senderEmail: options.senderEmail,
      files: options.files.map(f => {
        const fileInfo: {
          filename: string;
          size: number;
          contentType?: string | undefined;
          checksum?: string | undefined;
        } = {
          filename: f.filename,
          size: f.size,
        };
        if (f.contentType !== undefined) {
          fileInfo.contentType = f.contentType;
        }
        if (f.checksum !== undefined) {
          fileInfo.checksum = f.checksum;
        }
        return fileInfo;
      }),
      passwordProtected: !!options.password,
      expiresAt,
      maxDownloads: options.maxDownloads,
      downloadsCount: 0,
      status: 'sent',
      createdAt: now,
      sentAt: now,
      metadata: options.metadata,
      webhookUrl: options.webhookUrl,
      branding: options.branding,
    };

    await storeEmailTransfer(storedTransfer);

    // Record analytics
    const analyticsEvent: {
      event: 'sent';
      emailId: string;
      recipientEmail: string;
      timestamp: number;
      metadata?: Record<string, string> | undefined;
    } = {
      event: 'sent',
      emailId: transferId,
      recipientEmail: options.recipientEmail,
      timestamp: now,
    };

    if (options.metadata !== undefined) {
      analyticsEvent.metadata = options.metadata;
    }

    await recordAnalyticsEvent(analyticsEvent);

    const deliveryStatus: EmailDeliveryStatus = {
      id: transferId,
      status: 'sent',
      recipientEmail: options.recipientEmail,
      sentAt: now,
      expiresAt,
      downloadsCount: 0,
    };

    secureLog.log(
      `[EmailService] Sent transfer ${transferId} to ${options.recipientEmail} ` +
      `(${options.files.length} files, expires ${new Date(expiresAt).toISOString()})`
    );

    return deliveryStatus;
  } catch (error) {
    secureLog.error('[EmailService] Failed to send email transfer:', error);

    // Attempt retry if configured
    if (options.retryOnFailure) {
      const retryManager = getRetryManager();
      const transferId = generateTransferId();

      retryManager.recordFailure(transferId, error as Error);
      retryManager.scheduleRetry(transferId, async () => {
        await sendEmailTransfer(options);
      });
    }

    throw error;
  }
}

/**
 * Send batch email transfers
 */
export async function sendBatchEmailTransfers(
  request: EmailBatchRequest
): Promise<EmailBatchStatus> {
  const batchId = request.batchId || randomBytes(16).toString('hex');
  const startedAt = Date.now();

  if (request.recipients.length > MAX_BATCH_SIZE) {
    throw new Error(`Maximum ${MAX_BATCH_SIZE} recipients per batch`);
  }

  const status: EmailBatchStatus = {
    batchId,
    total: request.recipients.length,
    sent: 0,
    delivered: 0,
    failed: 0,
    pending: request.recipients.length,
    startedAt,
    failures: [],
  };

  secureLog.log(
    `[EmailService] Starting batch ${batchId} with ${request.recipients.length} recipients`
  );

  // Send emails in parallel with concurrency limit
  const CONCURRENCY = 5;
  const chunks: string[][] = [];

  for (let i = 0; i < request.recipients.length; i += CONCURRENCY) {
    chunks.push(request.recipients.slice(i, i + CONCURRENCY));
  }

  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (recipient) => {
        try {
          await sendEmailTransfer({
            ...request.options,
            recipientEmail: recipient,
            senderName: request.senderName,
            files: request.files,
          });

          status.sent++;
          status.pending--;
        } catch (error) {
          status.failed++;
          status.pending--;
          status.failures.push({
            email: recipient,
            error: error instanceof Error ? error.message : String(error),
          });

          secureLog.error(`[EmailService] Batch ${batchId} failed for ${recipient}:`, error);
        }
      })
    );
  }

  status.completedAt = Date.now();

  secureLog.log(
    `[EmailService] Batch ${batchId} completed: ` +
    `${status.sent} sent, ${status.failed} failed in ` +
    `${status.completedAt - status.startedAt}ms`
  );

  return status;
}

/**
 * Check delivery status
 */
export async function getDeliveryStatus(
  transferId: string
): Promise<EmailDeliveryStatus | null> {
  try {
    const { getEmailTransfer } = await import('./email-storage');
    const transfer = await getEmailTransfer(transferId);

    if (!transfer) {
      return null;
    }

    const status: EmailDeliveryStatus = {
      id: transfer.id,
      status: transfer.status,
      recipientEmail: transfer.recipientEmail,
      downloadsCount: transfer.downloadsCount,
      expiresAt: transfer.expiresAt,
    };

    if (transfer.sentAt !== undefined) {
      status.sentAt = transfer.sentAt;
    }
    if (transfer.deliveredAt !== undefined) {
      status.deliveredAt = transfer.deliveredAt;
    }
    if (transfer.downloadedAt !== undefined) {
      status.openedAt = transfer.downloadedAt;
      status.downloadedAt = transfer.downloadedAt;
    }

    return status;
  } catch (error) {
    secureLog.error('[EmailService] Failed to get delivery status:', error);
    return null;
  }
}

export default {
  sendEmailTransfer,
  sendBatchEmailTransfers,
  getDeliveryStatus,
};
