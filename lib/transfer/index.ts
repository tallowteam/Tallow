/**
 * Transfer Module - Central Export Hub
 * Advanced file transfer and synchronization capabilities
 *
 * This module provides:
 * - Post-quantum cryptography transfer support
 * - Folder and batch file transfers
 * - Batch operations with configurable rules (NEW)
 * - Delta synchronization (reduces bandwidth by 70-90%)
 * - Broadcast transfers to multiple devices
 * - Scheduled transfers and transfer templates
 * - Resumable transfers with automatic retry
 * - Adaptive bitrate streaming
 * - File chunking and compression
 * - Transfer metadata management
 * - Group and broadcast transfers
 * - Word/phrase codes for transfer identification
 *
 * @module transfer
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

// Delta Synchronization
export {
  computeBlockSignatures,
  computeDelta,
  createPatch,
  applyPatch,
  estimateSavings,
  calculateOptimalBlockSize,
  serializeSignatures,
  deserializeSignatures,
  serializePatch,
  deserializePatch,
  validateSignatures,
  validatePatch,
  DEFAULT_BLOCK_SIZE,
  MAX_BLOCK_SIZE,
  MIN_BLOCK_SIZE,
} from './delta-sync';

export type {
  BlockSignature,
  FileSignatures,
  DeltaResult,
  PatchBlock,
  FilePatch,
  SavingsEstimate,
} from './delta-sync';

// Delta Sync Manager
export {
  DeltaSyncManager,
  getDefaultManager,
  resetDefaultManager,
} from './delta-sync-manager';

export type {
  DeltaSyncSession,
  CacheEntry,
  DeltaSyncOptions,
  SyncResult,
  SyncProgress,
} from './delta-sync-manager';

// Broadcast Transfer
export {
  BroadcastTransfer,
  createBroadcastTransfer,
  broadcastFile,
  getBroadcastDeviceCount,
  isBroadcastAvailable,
} from './broadcast-transfer';

export type {
  BroadcastTransferOptions,
  BroadcastTransferResult,
  BroadcastTransferStatus,
} from './broadcast-transfer';

// Core Transfer Manager
export {
  TransferManager,
  type TransferProgress,
  type TransferError,
} from './transfer-manager';

// File Chunking
export {
  fileChunker,
  type ChunkConfig,
  type ChunkProgress,
} from './file-chunking';

// File Encryption Integration
export {
  encryptTransferFile,
  decryptTransferFile,
  type FileEncryptionConfig,
} from './file-encryption';

// Encryption (ChaCha20)
export {
  encryptWithChaCha,
  decryptWithChaCha,
  type ChaChaEncryptionOptions,
} from './encryption';

// Adaptive Bitrate Control
export {
  AdaptiveBitrate,
  calculateAdaptiveRate,
  type BitrateInfo,
  type AdaptiveRateConfig,
} from './adaptive-bitrate';

// Transfer Metadata
export {
  TransferMetadata,
  createTransferMetadata,
  parseTransferMetadata,
  type TransferMetadataOptions,
} from './transfer-metadata';

// Word Phrase Codes
export {
  generateWordPhraseCode,
  validateWordPhraseCode,
  decodeWordPhrase,
  type WordPhraseCodeOptions,
} from './word-phrase-codes';

// P2P Internet Transfer
export {
  P2PInternetTransfer,
  type P2PInternetConfig,
  type P2PInternetSession,
} from './p2p-internet';

// Resumable Transfers
export {
  ResumableTransfer,
  createResumableTransfer,
  type ResumableTransferSession,
  type ResumableTransferConfig,
} from './resumable-transfer';

// Group Transfer Manager
export {
  GroupTransferManager,
  type GroupTransferSession,
  type GroupTransferOptions,
} from './group-transfer-manager';

// Scheduled Transfers
export {
  ScheduledTransfer,
  createScheduledTransfer,
  listScheduledTransfers,
  type ScheduledTransferOptions,
  type ScheduleConfig,
} from './scheduled-transfer';

// Transfer Templates
export {
  TransferTemplate,
  createTransferTemplate,
  listTransferTemplates,
  applyTransferTemplate,
  type TransferTemplateOptions,
} from './transfer-templates';

// Store Actions
export {
  createTransferActions,
  type TransferActions,
} from './store-actions';

// Benchmarks
export {
  runTransferBenchmark,
  compareTransferPerformance,
  type BenchmarkResult,
  type BenchmarkConfig,
} from './benchmarks';

// Batch Operations
export {
  getAllRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  toggleRule,
  reorderRules,
  evaluateCondition,
  evaluateRules,
  applyRuleAction,
  applyRuleActions,
  getRuleDescription,
  type BatchRule,
  type RuleCondition,
  type RuleAction,
  type RuleConditionField,
  type RuleConditionOperator,
  type RuleActionType,
  type TransferFile,
  type RuleApplicationResult,
} from './batch-operations';

// Batch Processor
export {
  BatchProcessor,
  type BatchItem,
  type BatchResult,
  type BatchItemStatus,
  type ProgressCallback,
  type BatchProcessorOptions,
} from './batch-processor';
