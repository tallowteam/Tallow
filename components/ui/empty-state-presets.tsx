'use client';

/**
 * Empty State Presets - EUVEKA Design System
 *
 * Pre-configured empty state components for common scenarios:
 * - No Transfers
 * - No Devices
 * - No Search Results
 * - No Friends
 * - No Files
 * - No History
 * - Connection Lost
 * - Error State
 * - Send Files
 * - Empty Folder
 * - No Messages
 * - Offline Mode
 *
 * All using EUVEKA styling:
 * - Icon color: #b2987d
 * - EUVEKA neutral backgrounds
 * - Pill-shaped CTAs (60px radius)
 */

import {
    ArrowUpDown,
    Wifi,
    Loader2,
    Search,
    Users,
    FileUp,
    History,
    WifiOff,
    AlertCircle,
    Send,
    FolderOpen,
    MessageSquare,
    CloudOff,
    RefreshCw,
    Inbox,
} from 'lucide-react';
import { EmptyState, type EmptyStateProps } from './empty-state';
import { cn } from '@/lib/utils';

// Helper to build props object without undefined values
// Using explicit undefined types to satisfy exactOptionalPropertyTypes
function buildEmptyStateProps(
    base: Pick<EmptyStateProps, 'icon' | 'title' | 'description' | 'variant'> & Partial<EmptyStateProps>,
    options: {
        actionLabel?: string | undefined;
        onAction?: (() => void) | undefined;
        secondaryActionLabel?: string | undefined;
        onSecondaryAction?: (() => void) | undefined;
        size?: EmptyStateProps['size'] | undefined;
        animated?: boolean | undefined;
        className?: string | undefined;
    }
): EmptyStateProps {
    const props: EmptyStateProps = { ...base };

    if (options.actionLabel && options.onAction) {
        props.actionLabel = options.actionLabel;
        props.onAction = options.onAction;
    }
    if (options.secondaryActionLabel && options.onSecondaryAction) {
        props.secondaryActionLabel = options.secondaryActionLabel;
        props.onSecondaryAction = options.onSecondaryAction;
    }
    if (options.size) {
        props.size = options.size;
    }
    if (options.animated !== undefined) {
        props.animated = options.animated;
    }
    if (options.className) {
        props.className = options.className;
    }

    return props;
}

// =============================================================================
// NO TRANSFERS EMPTY STATE
// =============================================================================

export interface NoTransfersEmptyProps {
    onStartTransfer?: () => void;
    onViewHistory?: () => void;
    className?: string;
}

export function NoTransfersEmpty({
    onStartTransfer,
    onViewHistory,
    className,
}: NoTransfersEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: ArrowUpDown,
            title: "Ready to share",
            description: "Select files and choose a device to start transferring. It's fast, secure, and works without internet.",
            variant: "primary",
        },
        {
            actionLabel: onStartTransfer ? "Select Files" : undefined,
            onAction: onStartTransfer,
            secondaryActionLabel: onViewHistory ? "See History" : undefined,
            onSecondaryAction: onViewHistory,
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoTransfersEmpty.displayName = 'NoTransfersEmpty';

// =============================================================================
// NO DEVICES EMPTY STATE
// =============================================================================

export interface NoDevicesEmptyProps {
    onRefresh?: () => void;
    onScanQR?: () => void;
    onManualConnect?: () => void;
    isSearching?: boolean;
    className?: string;
}

export function NoDevicesEmpty({
    onRefresh,
    onScanQR,
    onManualConnect,
    isSearching = false,
    className,
}: NoDevicesEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: isSearching ? Loader2 : Wifi,
            title: isSearching ? "Looking for devices..." : "No devices nearby",
            description: isSearching
                ? "Scanning your network for devices with Tallow. This usually takes a few seconds."
                : "Open Tallow on another device and make sure both are on the same Wi-Fi network.",
            variant: isSearching ? "primary" : "default",
        },
        {
            actionLabel: !isSearching && onRefresh ? "Search Again" : undefined,
            onAction: !isSearching ? onRefresh : undefined,
            secondaryActionLabel: onScanQR ? "Scan QR Code" : onManualConnect ? "Connect Manually" : undefined,
            onSecondaryAction: onScanQR || onManualConnect,
            animated: !isSearching,
            className: cn(isSearching && "[&_svg]:animate-spin", className),
        }
    );
    return <EmptyState {...props} />;
}

NoDevicesEmpty.displayName = 'NoDevicesEmpty';

// =============================================================================
// NO SEARCH RESULTS EMPTY STATE
// =============================================================================

export interface NoSearchResultsEmptyProps {
    query: string;
    onClearSearch?: () => void;
    onBrowseAll?: () => void;
    className?: string;
}

export function NoSearchResultsEmpty({
    query,
    onClearSearch,
    onBrowseAll,
    className,
}: NoSearchResultsEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: Search,
            title: "No matches",
            description: `Nothing matches "${query}". Try a shorter search or check the spelling.`,
            variant: "muted",
        },
        {
            actionLabel: onClearSearch ? "Clear" : undefined,
            onAction: onClearSearch,
            secondaryActionLabel: onBrowseAll ? "Show All" : undefined,
            onSecondaryAction: onBrowseAll,
            size: "sm",
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoSearchResultsEmpty.displayName = 'NoSearchResultsEmpty';

// =============================================================================
// NO FRIENDS EMPTY STATE
// =============================================================================

export interface NoFriendsEmptyProps {
    onAddFriend?: () => void;
    onImportContacts?: () => void;
    className?: string;
}

export function NoFriendsEmpty({
    onAddFriend,
    onImportContacts,
    className,
}: NoFriendsEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: Users,
            title: "Your contacts will appear here",
            description: "Add friends for instant transfers. No need to search for them every time.",
            variant: "primary",
        },
        {
            actionLabel: onAddFriend ? "Add a Friend" : undefined,
            onAction: onAddFriend,
            secondaryActionLabel: onImportContacts ? "Import" : undefined,
            onSecondaryAction: onImportContacts,
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoFriendsEmpty.displayName = 'NoFriendsEmpty';

// =============================================================================
// NO FILES EMPTY STATE
// =============================================================================

export interface NoFilesEmptyProps {
    onSelectFiles?: () => void;
    onOpenFolder?: () => void;
    className?: string;
}

export function NoFilesEmpty({
    onSelectFiles,
    onOpenFolder,
    className,
}: NoFilesEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: FileUp,
            title: "Choose what to send",
            description: "Drag files here or browse to select. You can share photos, documents, videos, or entire folders.",
            variant: "primary",
        },
        {
            actionLabel: onSelectFiles ? "Browse Files" : undefined,
            onAction: onSelectFiles,
            secondaryActionLabel: onOpenFolder ? "Pick Folder" : undefined,
            onSecondaryAction: onOpenFolder,
            size: "sm",
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoFilesEmpty.displayName = 'NoFilesEmpty';

// =============================================================================
// NO HISTORY EMPTY STATE
// =============================================================================

export interface NoHistoryEmptyProps {
    onStartTransfer?: () => void;
    className?: string;
}

export function NoHistoryEmpty({
    onStartTransfer,
    className,
}: NoHistoryEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: History,
            title: "Nothing here yet",
            description: "Once you send or receive files, they'll show up here so you can find them later.",
            variant: "muted",
        },
        {
            actionLabel: onStartTransfer ? "Send Something" : undefined,
            onAction: onStartTransfer,
            size: "sm",
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoHistoryEmpty.displayName = 'NoHistoryEmpty';

// =============================================================================
// CONNECTION LOST EMPTY STATE
// =============================================================================

export interface ConnectionLostEmptyProps {
    deviceName?: string;
    onReconnect?: () => void;
    onFindNewDevice?: () => void;
    className?: string;
}

export function ConnectionLostEmpty({
    deviceName,
    onReconnect,
    onFindNewDevice,
    className,
}: ConnectionLostEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: WifiOff,
            title: "Connection dropped",
            description: deviceName
                ? `We lost the connection to ${deviceName}. Make sure both devices are still on the same network.`
                : "Something interrupted the connection. You can try again - any progress will be saved.",
            variant: "warning",
        },
        {
            actionLabel: onReconnect ? "Try Again" : undefined,
            onAction: onReconnect,
            secondaryActionLabel: onFindNewDevice ? "Find Other Device" : undefined,
            onSecondaryAction: onFindNewDevice,
            className,
        }
    );
    return <EmptyState {...props} />;
}

ConnectionLostEmpty.displayName = 'ConnectionLostEmpty';

// =============================================================================
// ERROR EMPTY STATE
// =============================================================================

export interface ErrorEmptyProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    onGoBack?: () => void;
    className?: string;
}

export function ErrorEmpty({
    title = "That didn't work",
    message = "Something unexpected happened. Give it another try, or go back and start fresh.",
    onRetry,
    onGoBack,
    className,
}: ErrorEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: AlertCircle,
            title,
            description: message,
            variant: "warning",
        },
        {
            actionLabel: onRetry ? "Retry" : undefined,
            onAction: onRetry,
            secondaryActionLabel: onGoBack ? "Back" : undefined,
            onSecondaryAction: onGoBack,
            className,
        }
    );
    return <EmptyState {...props} />;
}

ErrorEmpty.displayName = 'ErrorEmpty';

// =============================================================================
// SEND FILES EMPTY STATE (For file selector)
// =============================================================================

export interface SendFilesEmptyProps {
    onSelectFiles?: () => void;
    onOpenCamera?: () => void;
    className?: string;
}

export function SendFilesEmpty({
    onSelectFiles,
    onOpenCamera,
    className,
}: SendFilesEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: Send,
            title: "What would you like to send?",
            description: "Pick files from your device, or drag and drop them here. Photos, docs, videos - anything goes.",
            variant: "primary",
        },
        {
            actionLabel: onSelectFiles ? "Browse" : undefined,
            onAction: onSelectFiles,
            secondaryActionLabel: onOpenCamera ? "Use Camera" : undefined,
            onSecondaryAction: onOpenCamera,
            className,
        }
    );
    return <EmptyState {...props} />;
}

SendFilesEmpty.displayName = 'SendFilesEmpty';

// =============================================================================
// EMPTY FOLDER STATE
// =============================================================================

export interface EmptyFolderProps {
    folderName?: string;
    onGoBack?: () => void;
    className?: string;
}

export function EmptyFolderEmpty({
    folderName,
    onGoBack,
    className,
}: EmptyFolderProps) {
    const props = buildEmptyStateProps(
        {
            icon: FolderOpen,
            title: "Empty folder",
            description: folderName
                ? `There's nothing in "${folderName}" yet.`
                : "There are no files in here.",
            variant: "muted",
        },
        {
            actionLabel: onGoBack ? "Back" : undefined,
            onAction: onGoBack,
            size: "sm",
            className,
        }
    );
    return <EmptyState {...props} />;
}

EmptyFolderEmpty.displayName = 'EmptyFolderEmpty';

// =============================================================================
// NO MESSAGES EMPTY STATE
// =============================================================================

export interface NoMessagesEmptyProps {
    recipientName?: string;
    onSendMessage?: () => void;
    className?: string;
}

export function NoMessagesEmpty({
    recipientName,
    onSendMessage,
    className,
}: NoMessagesEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: MessageSquare,
            title: "Start chatting",
            description: recipientName
                ? `Say hello to ${recipientName}. Messages are end-to-end encrypted.`
                : "Your messages are fully encrypted. Only you and the recipient can read them.",
            variant: "primary",
        },
        {
            actionLabel: onSendMessage ? "Write a Message" : undefined,
            onAction: onSendMessage,
            className,
        }
    );
    return <EmptyState {...props} />;
}

NoMessagesEmpty.displayName = 'NoMessagesEmpty';

// =============================================================================
// OFFLINE MODE EMPTY STATE
// =============================================================================

export interface OfflineModeEmptyProps {
    onRetryConnection?: () => void;
    onViewOfflineContent?: () => void;
    className?: string;
}

export function OfflineModeEmpty({
    onRetryConnection,
    onViewOfflineContent,
    className,
}: OfflineModeEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: CloudOff,
            title: "No network connection",
            description: "You'll need Wi-Fi or a network connection to find nearby devices. Local transfers still work on LAN.",
            variant: "warning",
        },
        {
            actionLabel: onRetryConnection ? "Check Again" : undefined,
            onAction: onRetryConnection,
            secondaryActionLabel: onViewOfflineContent ? "Offline Files" : undefined,
            onSecondaryAction: onViewOfflineContent,
            className,
        }
    );
    return <EmptyState {...props} />;
}

OfflineModeEmpty.displayName = 'OfflineModeEmpty';

// =============================================================================
// INBOX EMPTY STATE
// =============================================================================

export interface InboxEmptyProps {
    onCheckSettings?: () => void;
    className?: string;
}

export function InboxEmpty({
    onCheckSettings,
    className,
}: InboxEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: Inbox,
            title: "Nothing received yet",
            description: "When someone sends you files, they'll show up here. Make sure you're visible to nearby devices.",
            variant: "muted",
        },
        {
            actionLabel: onCheckSettings ? "Settings" : undefined,
            onAction: onCheckSettings,
            className,
        }
    );
    return <EmptyState {...props} />;
}

InboxEmpty.displayName = 'InboxEmpty';

// =============================================================================
// LOADING STATE (for async operations)
// =============================================================================

export interface LoadingEmptyProps {
    title?: string;
    description?: string;
    className?: string;
}

export function LoadingEmpty({
    title = "Just a moment...",
    description = "Getting things ready for you.",
    className,
}: LoadingEmptyProps) {
    const props = buildEmptyStateProps(
        {
            icon: RefreshCw,
            title,
            description,
            variant: "primary",
        },
        {
            animated: false,
            className: cn("[&_svg]:animate-spin", className),
        }
    );
    return <EmptyState {...props} />;
}

LoadingEmpty.displayName = 'LoadingEmpty';
