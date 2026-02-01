/**
 * Transfer Module Exports
 * Central export point for all transfer functionality
 */

// Core PQC Transfer
export { PQCTransferManager } from './pqc-transfer-manager';
export type {
  TransferMode,
  TransferStatus,
  PQCTransferSession,
  TransferMessage,
} from './pqc-transfer-manager';

// Folder Transfer Utilities
export {
  buildFolderStructure,
  buildFolderTree,
  extractFolderName,
  formatFileSize,
  getFolderStats,
  filterFilesByExtension,
  estimateCompressionRatio,
  compressFolder,
  decompressFolder,
  downloadFolderAsZip,
} from './folder-transfer';

export type {
  FolderStructure,
  FolderFile,
  FolderTreeNode,
} from './folder-transfer';

// Folder Transfer Integration
export {
  sendFolder,
  FolderReceiver,
  BatchFileTransfer,
} from './folder-transfer-integration';

export type {
  FolderTransferOptions,
  FolderTransferState,
} from './folder-transfer-integration';
