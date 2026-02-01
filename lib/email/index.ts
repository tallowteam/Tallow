/**
 * Email Module - Central Export
 */

// Core service
export {
  sendEmailTransfer,
  sendBatchEmailTransfers,
  getDeliveryStatus,
} from './email-service';

// Storage and tracking
export {
  storeEmailTransfer,
  getEmailTransfer,
  getAllEmailTransfers,
  updateEmailTransferStatus,
  incrementDownloadCount,
  isTransferExpired,
  cleanupExpiredTransfers,
  recordAnalyticsEvent,
  getEmailAnalytics,
  resetEmailAnalytics,
} from './email-storage';

// File compression
export {
  compressFiles,
  calculateChecksum,
  shouldCompress,
  formatFileSize,
  estimateCompressionRatio,
} from './file-compression';

// Password protection
export {
  encryptWithPassword,
  decryptWithPassword,
  validatePasswordStrength,
  generateSecurePassword,
  hashPasswordForStorage,
  verifyPassword,
} from './password-protection';

// Retry management
export {
  EmailRetryManager,
  getRetryManager,
  calculateRetryDelay,
  isRetryableError,
} from './retry-manager';

// Types
export type {
  EmailFileAttachment,
  EmailTransferOptions,
  EmailBranding,
  EmailDeliveryStatus,
  EmailWebhookEvent,
  EmailAnalytics,
  EmailBatchRequest,
  EmailBatchStatus,
  StoredEmailTransfer,
  PasswordProtectedDownload,
  VirusScanResult,
  EmailRetryPolicy,
} from './types';

export {
  DEFAULT_RETRY_POLICY,
  DEFAULT_EXPIRATION_MS,
  MAX_FILE_SIZE,
  MAX_ATTACHMENT_SIZE,
  MAX_BATCH_SIZE,
  MAX_FILES_PER_EMAIL,
} from './types';
