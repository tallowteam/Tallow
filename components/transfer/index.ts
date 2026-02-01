/**
 * Transfer Components Exports
 * Central export point for all transfer UI components
 *
 * UX Features:
 * - WCAG 2.1 compliant touch targets (44px+ on mobile)
 * - Responsive layouts for all screen sizes
 * - Swipe gestures for mobile interactions
 * - Accessible progress announcements via live regions
 */

// File transfer components
export { FileSelector } from './file-selector';
export type { FileWithData, TextShare } from './file-selector';
export { FileSelectorWithPrivacy } from './file-selector-with-privacy';

// Folder transfer components
export { FolderSelector } from './FolderSelector';
export { FolderTree } from './FolderTree';
export { FolderProgress } from './FolderProgress';
export { FolderDownload } from './FolderDownload';

// Transfer progress and status
export { TransferProgress, TransferQueueProgress } from './transfer-progress';
export { TransferQueue } from './transfer-queue';
export { TransferCard } from './transfer-card';

// Animated variants
export { TransferCardAnimated } from './transfer-card-animated';
export { TransferQueueAnimated } from './transfer-queue-animated';

// Dialogs
export { TransferConfirmDialog } from './transfer-confirm-dialog';
export { PasswordProtectionDialog } from './password-protection-dialog';
export { PasswordInputDialog } from './password-input-dialog';
export { TransferOptionsDialog } from './transfer-options-dialog';

// Status indicators
export { TransferStatusBadges } from './transfer-status-badges';

// QR Code
export { QRCodeGenerator } from './qr-code-generator';

// Demo component
export { PQCTransferDemo } from './pqc-transfer-demo';

// Advanced transfer
export { AdvancedFileTransfer } from './advanced-file-transfer';

// Re-export types from lib
export type {
  FolderStructure,
  FolderFile,
  FolderTreeNode,
  FolderTransferState,
} from '@/lib/transfer';
