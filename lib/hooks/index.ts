'use client';

/**
 * Hooks Module - Central Export Hub
 * @module hooks
 */

// Screen capture, secure storage, PQC manager
export { useScreenCapture, type UseScreenCaptureOptions } from './use-screen-capture';
export { useSecureStorage, type UseSecureStorageOptions } from './use-secure-storage';
export { usePQCManager, type UsePQCManagerOptions } from './use-pqc-manager';

// Transfer state and toast
export { useTransferState, type UseTransferStateOptions } from './use-transfer-state';
export { useToast } from './use-toast';

// Device discovery (named exports)
export { useDeviceDiscovery, useDiscoveryStatus } from './use-device-discovery';

// P2P connection (has both named + default)
export { useP2PConnection } from './use-p2p-connection';

// File transfer (named export)
export { useFileTransfer } from './use-file-transfer';

// Adaptive transfer (has both named + default)
export { useAdaptiveTransfer } from './use-adaptive-transfer';

// Advanced transfer (has both named + default)
export { useAdvancedTransfer } from './use-advanced-transfer';

// Chat (named export)
export { useChat } from './use-chat';

// Device connection (has both named + default)
export { useDeviceConnection } from './use-device-connection';

// Email transfer (has both named + default)
export { useEmailTransfer } from './use-email-transfer';

// Feature flags (named exports)
export { useFeatureFlag } from './use-feature-flag';
export { useFeatureFlagsQuery, type FeatureFlagsResponse, type FeatureFlags } from './use-feature-flags-query';

// NAT detection (has both named + default)
export { useNATDetection } from './use-nat-detection';

// Optimistic transfer (has both named + default)
export { useOptimisticTransfer } from './use-optimistic-transfer';

// P2P session (has both named + default)
export { useP2PSession } from './use-p2p-session';

// Service worker (named export)
export { useServiceWorker } from './use-service-worker';

// Unified discovery (named export)
export { useUnifiedDiscovery } from './use-unified-discovery';

// Verification (has both named + default)
export { useVerification } from './use-verification';

// Web share (named export)
export { useWebShare } from './use-web-share';

// Group discovery & transfer (named exports)
export { useGroupDiscovery } from './use-group-discovery';
export { useGroupTransfer } from './use-group-transfer';

// Metadata stripper (named export)
export { useMetadataStripper } from './use-metadata-stripper';

// PQC transfer (named export)
export { usePQCTransfer } from './use-pqc-transfer';

// Transfer room (named export)
export { useTransferRoom } from './use-transfer-room';

// Performance (has both named + default)
export { usePerformance } from './use-performance';

// NAT optimized connection (has both named + default)
export { useNATOptimizedConnection } from './use-nat-optimized-connection';

// Intersection observer and motion hooks (named exports)
export { useIntersectionObserver, useReducedMotion, useMotionDuration, useEssentialMotionDuration } from './use-intersection-observer';

// Scroll reveal fallback (named export)
export { useScrollReveal } from './use-scroll-reveal';

// Keyboard shortcut (named export)
export { useKeyboardShortcut } from './use-keyboard-shortcut';

// Onion routing (named export)
export { useOnionRouting } from './use-onion-routing';

// Resumable transfer (has both named + default)
export { useResumableTransfer } from './use-resumable-transfer';

// Chat integration (named export)
export { useChatIntegration } from './use-chat-integration';

// Notifications (const export)
export { useNotifications } from './use-notifications';

// Privacy pipeline (named export)
export { usePrivacyPipeline } from './use-privacy-pipeline';

// Room connection (named export)
export { useRoomConnection } from './use-room-connection';

// Transfer orchestrator (has both named + default)
export { useTransferOrchestrator } from './use-transfer-orchestrator';

// Duplicate file handler (named export)
export { useDuplicateFileHandler } from './use-duplicate-file-handler';

// Temporary visibility (named export)
export { useTemporaryVisibility } from './use-temporary-visibility';

// Guest mode (named export)
export { useGuestMode } from './use-guest-mode';

// File request (has both named + default)
export { useFileRequest } from './use-file-request';

// Voice commands (named export)
export { useVoiceCommands } from './use-voice-commands';
