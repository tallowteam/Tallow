/**
 * Email Service Types
 * Enhanced types for advanced email features
 */

export interface EmailFileAttachment {
  filename: string;
  content: Buffer | string;
  size: number;
  contentType?: string;
  checksum?: string; // SHA-256 checksum for integrity
}

export interface EmailTransferOptions {
  // Basic
  recipientEmail: string;
  senderName: string;
  senderEmail?: string;

  // Files
  files: EmailFileAttachment[];
  compress?: boolean; // Auto-compress multiple files into zip

  // Security
  password?: string; // Password protection
  virusScan?: boolean; // ClamAV scan before sending

  // Expiration
  expiresAt?: number; // Custom expiration timestamp
  expiresIn?: number; // Duration in milliseconds
  maxDownloads?: number; // Limit number of downloads

  // Notifications
  notifyOnDownload?: boolean;
  notifyOnExpire?: boolean;
  webhookUrl?: string; // Webhook for delivery events

  // Delivery
  priority?: 'low' | 'normal' | 'high';
  retryOnFailure?: boolean;
  maxRetries?: number;

  // Customization
  template?: string; // Custom template ID
  templateData?: Record<string, any>;
  branding?: EmailBranding;

  // Metadata
  metadata?: Record<string, string>;
  trackOpens?: boolean;
  trackClicks?: boolean;
}

export interface EmailBranding {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  brandUrl?: string;
  supportEmail?: string;
}

export interface EmailDeliveryStatus {
  id: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'downloaded' | 'expired' | 'failed';
  recipientEmail: string;
  sentAt?: number | undefined;
  deliveredAt?: number | undefined;
  openedAt?: number | undefined;
  clickedAt?: number | undefined;
  downloadedAt?: number | undefined;
  downloadsCount?: number | undefined;
  expiresAt?: number | undefined;
  error?: string | undefined;
  retryCount?: number | undefined;
  lastRetryAt?: number | undefined;
}

export interface EmailWebhookEvent {
  event: 'sent' | 'delivered' | 'opened' | 'clicked' | 'downloaded' | 'expired' | 'failed';
  emailId: string;
  recipientEmail: string;
  timestamp: number;
  metadata?: Record<string, string> | undefined;
  error?: string | undefined;
}

export interface EmailAnalytics {
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalDownloaded: number;
  totalExpired: number;
  totalFailed: number;
  avgDeliveryTime: number;
  avgOpenTime: number;
  openRate: number;
  clickRate: number;
  downloadRate: number;
  failureRate: number;
  byDate: Record<string, EmailAnalytics>;
  byRecipient: Record<string, EmailAnalytics>;
}

export interface EmailBatchRequest {
  recipients: string[];
  senderName: string;
  files: EmailFileAttachment[];
  options?: Partial<EmailTransferOptions>;
  batchId?: string;
}

export interface EmailBatchStatus {
  batchId: string;
  total: number;
  sent: number;
  delivered: number;
  failed: number;
  pending: number;
  startedAt: number;
  completedAt?: number;
  failures: Array<{
    email: string;
    error: string;
  }>;
}

export interface StoredEmailTransfer {
  id: string;
  recipientEmail: string;
  senderName: string;
  senderEmail?: string | undefined;
  files: Array<{
    filename: string;
    size: number;
    contentType?: string | undefined;
    checksum?: string | undefined;
  }>;
  passwordProtected: boolean;
  expiresAt: number;
  maxDownloads?: number | undefined;
  downloadsCount: number;
  status: EmailDeliveryStatus['status'];
  createdAt: number;
  sentAt?: number | undefined;
  deliveredAt?: number | undefined;
  downloadedAt?: number | undefined;
  metadata?: Record<string, string> | undefined;
  webhookUrl?: string | undefined;
  branding?: EmailBranding | undefined;
}

export interface PasswordProtectedDownload {
  transferId: string;
  encryptedData: string; // AES-256-GCM encrypted file data
  salt: string;
  iv: string;
  authTag: string;
}

export interface VirusScanResult {
  clean: boolean;
  infected: boolean;
  virus?: string;
  scanTime: number;
  engine: string;
  engineVersion: string;
}

export interface EmailRetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

export const DEFAULT_RETRY_POLICY: EmailRetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 30000,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ENOTFOUND',
    'ECONNREFUSED',
    'rate_limit',
    'temporarily_unavailable',
  ],
};

export const DEFAULT_EXPIRATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const MAX_FILE_SIZE = Number.MAX_SAFE_INTEGER; // No size limit - unlimited P2P transfer
export const MAX_ATTACHMENT_SIZE = Number.MAX_SAFE_INTEGER; // No size limit - unlimited (will chunk large files)
export const MAX_BATCH_SIZE = 50; // Max recipients per batch
export const MAX_FILES_PER_EMAIL = 10;
