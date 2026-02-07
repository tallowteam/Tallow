'use client';

/**
 * Hooks Module - Central Export Hub
 * React hooks for state management, device discovery, transfers, and network operations
 *
 * This module provides:
 * - Device discovery and connection hooks
 * - File transfer orchestration hooks
 * - Chat and messaging hooks
 * - Network detection and optimization hooks
 * - Privacy and metadata management hooks
 * - P2P session management
 * - Transfer room and group management
 * - Performance monitoring and optimization
 * - NAT detection and connection strategy
 * - Screen capture and media hooks
 * - Service worker integration
 * - Verification and authentication
 * - Guest mode and temporary visibility
 *
 * @module hooks
 */

// New hooks - library wrappers
export { useScreenCapture, type UseScreenCaptureOptions } from './use-screen-capture';
export { useSecureStorage, type UseSecureStorageOptions } from './use-secure-storage';
export { usePQCManager, type UsePQCManagerOptions } from './use-pqc-manager';

// Existing hooks
export { useTransferState, type UseTransferStateOptions } from './use-transfer-state';
export { useToast } from './use-toast';
export { default as useDeviceDiscovery } from './use-device-discovery';
export { default as useP2PConnection } from './use-p2p-connection';
export { default as useFileTransfer } from './use-file-transfer';
export { default as useAdaptiveTransfer } from './use-adaptive-transfer';
export { default as useAdvancedTransfer } from './use-advanced-transfer';
export { default as useChat } from './use-chat';
export { default as useDeviceConnection } from './use-device-connection';
export { default as useEmailTransfer } from './use-email-transfer';
export { default as useFeatureFlag } from './use-feature-flag';
export { default as useNATDetection } from './use-nat-detection';
export { default as useOptimisticTransfer } from './use-optimistic-transfer';
export { default as useP2PSession } from './use-p2p-session';
export { default as useServiceWorker } from './use-service-worker';
export { default as useUnifiedDiscovery } from './use-unified-discovery';
export { default as useVerification } from './use-verification';
export { default as useWebShare } from './use-web-share';
export { default as useGroupDiscovery } from './use-group-discovery';
export { default as useGroupTransfer } from './use-group-transfer';
export { default as useMetadataStripper } from './use-metadata-stripper';
export { default as usePQCTransfer } from './use-pqc-transfer';
export { default as useTransferRoom } from './use-transfer-room';
export { default as usePerformance } from './use-performance';
export { default as useNATOptimizedConnection } from './use-nat-optimized-connection';
export { default as useIntersectionObserver } from './use-intersection-observer';
export { default as useKeyboardShortcut } from './use-keyboard-shortcut';
export { default as useOnionRouting } from './use-onion-routing';
export { default as useResumableTransfer } from './use-resumable-transfer';
export { default as useChatIntegration } from './use-chat-integration';
export { default as useNotifications } from './use-notifications';
export { default as usePrivacyPipeline } from './use-privacy-pipeline';
export { default as useRoomConnection } from './use-room-connection';
export { default as useTransferOrchestrator } from './use-transfer-orchestrator';
export { default as useDuplicateFileHandler } from './use-duplicate-file-handler';
export { default as useTemporaryVisibility } from './use-temporary-visibility';
export { default as useGuestMode } from './use-guest-mode';
export { default as useFileRequest } from './use-file-request';
