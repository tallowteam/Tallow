'use client';

/**
 * Lazy-loaded Components
 * These components are code-split and only loaded when needed
 * to improve initial page load performance.
 *
 * Each component has a contextual skeleton loader that matches
 * its visual structure for a better loading experience.
 *
 * Performance Optimizations:
 * - webpackChunkName: Groups related code into named chunks for better caching
 * - webpackPrefetch: Prefetches likely-needed chunks during idle time
 * - webpackPreload: Preloads critical chunks (use sparingly)
 * - ssr: false: Disables server-side rendering for client-only components
 *
 * Priority levels:
 * - HIGH: webpackPrefetch + webpackPreload (core transfer/device components)
 * - MEDIUM: webpackPrefetch only (common dialogs)
 * - LOW: No prefetch (rarely used components)
 */

import dynamic from 'next/dynamic';
import {
    Skeleton,
    SkeletonText,
    SkeletonAvatar,
    SkeletonButton,
    DeviceListSkeleton,
    TransferCardSkeleton,
} from '@/components/ui/skeleton';

// ============================================================================
// SKELETON LOADERS
// ============================================================================

/**
 * Friends List Skeleton
 * Matches the friend item cards with avatar, name, and action buttons
 */
const FriendsListSkeleton = () => (
    <div className="space-y-4">
        {/* Header with title and add button */}
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
                <Skeleton width={24} height={24} variant="circular" />
                <SkeletonText className="w-24" />
            </div>
            <SkeletonButton width={100} height={36} />
        </div>
        {/* Friend items */}
        <div className="space-y-2 px-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                    <SkeletonAvatar width={40} height={40} />
                    <div className="flex-1 space-y-2">
                        <SkeletonText className="w-2/3" />
                        <SkeletonText className="w-1/3 h-3" />
                    </div>
                    <div className="flex gap-1">
                        <Skeleton width={32} height={32} variant="circular" />
                        <Skeleton width={32} height={32} variant="circular" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * Dialog Skeleton
 * Generic dialog loading state for add friend, settings, etc.
 */
const DialogSkeleton = () => (
    <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
            <Skeleton width={40} height={40} variant="circular" />
            <div className="space-y-2 flex-1">
                <SkeletonText className="w-1/2" />
                <SkeletonText className="w-3/4 h-3" />
            </div>
        </div>
        <div className="space-y-3 pt-4">
            <Skeleton height={40} className="w-full rounded-xl" />
            <Skeleton height={40} className="w-full rounded-xl" />
        </div>
        <div className="flex gap-2 pt-4">
            <SkeletonButton width={80} height={40} />
            <SkeletonButton width={100} height={40} />
        </div>
    </div>
);

/**
 * Transfer Queue Skeleton
 * Matches the transfer stats bar and transfer item cards
 */
const TransferQueueSkeleton = () => (
    <div className="space-y-4">
        {/* Stats bar */}
        <div className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="space-y-1">
                        <SkeletonText className="w-12 h-3" />
                        <SkeletonText className="w-20" />
                    </div>
                    <div className="space-y-1">
                        <SkeletonText className="w-16 h-3" />
                        <SkeletonText className="w-24" />
                    </div>
                    <div className="space-y-1">
                        <SkeletonText className="w-12 h-3" />
                        <SkeletonText className="w-20" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <SkeletonButton width={90} height={36} />
                    <SkeletonButton width={100} height={36} />
                </div>
            </div>
        </div>
        {/* Transfer items */}
        <TransferCardSkeleton count={2} />
    </div>
);

/**
 * File Selector Skeleton
 * Matches the tabs and drag-drop area
 */
const FileSelectorSkeleton = () => (
    <div className="space-y-5">
        {/* Tab bar */}
        <div className="h-12 bg-muted rounded-2xl p-1.5 flex gap-1">
            <Skeleton className="flex-1 rounded-xl" />
            <Skeleton className="flex-1 rounded-xl" />
            <Skeleton className="flex-1 rounded-xl" />
        </div>
        {/* Drop zone */}
        <div className="p-10 border-2 border-dashed border-border rounded-3xl">
            <div className="flex flex-col items-center text-center space-y-4">
                <Skeleton width={80} height={80} className="rounded-2xl" />
                <div className="space-y-2">
                    <SkeletonText className="w-40 mx-auto" />
                    <SkeletonText className="w-60 mx-auto h-3" />
                    <SkeletonText className="w-48 mx-auto h-3" />
                </div>
            </div>
        </div>
    </div>
);

/**
 * QR Code Generator Skeleton
 * Matches the QR code card with code, title, and action buttons
 */
const QRCodeSkeleton = () => (
    <div className="p-6 rounded-2xl border border-border bg-card">
        <div className="flex flex-col items-center space-y-4">
            {/* QR Code placeholder */}
            <Skeleton width={200} height={200} className="rounded-xl" />
            {/* Title and subtitle */}
            <div className="text-center space-y-2">
                <SkeletonText className="w-32 mx-auto" />
                <SkeletonText className="w-48 mx-auto h-3" />
            </div>
            {/* Action buttons */}
            <div className="flex gap-2">
                <SkeletonButton width={36} height={36} />
                <SkeletonButton width={36} height={36} />
                <SkeletonButton width={36} height={36} />
            </div>
        </div>
    </div>
);

/**
 * Verification Dialog Skeleton
 * Matches the security verification dialog with code display
 */
const VerificationDialogSkeleton = () => (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2">
            <Skeleton width={24} height={24} variant="circular" />
            <SkeletonText className="w-32" />
        </div>
        <SkeletonText className="w-full h-3" />
        {/* Verification code */}
        <div className="text-center py-4">
            <SkeletonText className="w-24 mx-auto h-3 mb-3" />
            <Skeleton height={56} className="w-64 mx-auto rounded-2xl" />
        </div>
        {/* Emoji display */}
        <div className="text-center">
            <Skeleton height={32} className="w-48 mx-auto rounded-xl" />
        </div>
        {/* Instructions */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <SkeletonText className="w-full h-3" />
            <SkeletonText className="w-5/6 h-3" />
            <SkeletonText className="w-4/5 h-3" />
        </div>
        {/* Action buttons */}
        <div className="flex gap-2">
            <SkeletonButton className="flex-1" height={44} />
            <SkeletonButton className="flex-1" height={44} />
        </div>
    </div>
);

/**
 * Manual Connect Skeleton
 * Matches the manual connection input form
 */
const ManualConnectSkeleton = () => (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
        <div className="flex items-center gap-2">
            <Skeleton width={20} height={20} variant="circular" />
            <SkeletonText className="w-32" />
        </div>
        <SkeletonText className="w-full h-3" />
        <div className="space-y-3">
            <Skeleton height={44} className="w-full rounded-xl" />
            <SkeletonButton className="w-full" height={44} />
        </div>
    </div>
);

/**
 * Received Files Dialog Skeleton
 * Matches the file list with download options
 */
const ReceivedFilesDialogSkeleton = () => (
    <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
            <Skeleton width={48} height={48} className="rounded-xl" />
            <div className="flex-1 space-y-2">
                <SkeletonText className="w-1/2" />
                <SkeletonText className="w-1/3 h-3" />
            </div>
        </div>
        {/* File list */}
        <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
                >
                    <Skeleton width={40} height={40} className="rounded-lg" />
                    <div className="flex-1 space-y-2">
                        <SkeletonText className="w-2/3" />
                        <SkeletonText className="w-1/4 h-3" />
                    </div>
                    <SkeletonButton width={80} height={32} />
                </div>
            ))}
        </div>
        {/* Footer actions */}
        <div className="flex gap-2 pt-2">
            <SkeletonButton className="flex-1" height={44} />
            <SkeletonButton width={100} height={44} />
        </div>
    </div>
);

/**
 * Transfer Confirm Dialog Skeleton
 * Matches the confirmation dialog with file summary
 */
const TransferConfirmDialogSkeleton = () => (
    <div className="p-6 space-y-4">
        {/* Header */}
        <div className="space-y-2">
            <SkeletonText className="w-40" />
            <SkeletonText className="w-full h-3" />
        </div>
        {/* File summary */}
        <div className="p-4 rounded-xl border border-border bg-muted/50 space-y-3">
            <div className="flex items-center justify-between">
                <SkeletonText className="w-20" />
                <SkeletonText className="w-24" />
            </div>
            <div className="flex items-center justify-between">
                <SkeletonText className="w-16" />
                <SkeletonText className="w-20" />
            </div>
        </div>
        {/* Recipient */}
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
            <SkeletonAvatar width={40} height={40} />
            <div className="space-y-2 flex-1">
                <SkeletonText className="w-1/2" />
                <SkeletonText className="w-1/3 h-3" />
            </div>
        </div>
        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
            <SkeletonButton width={80} height={44} />
            <SkeletonButton className="flex-1" height={44} />
        </div>
    </div>
);

/**
 * Password Input Dialog Skeleton
 * Matches the password entry dialog
 */
const PasswordInputDialogSkeleton = () => (
    <div className="p-6 space-y-4">
        <div className="flex items-center gap-2">
            <Skeleton width={24} height={24} variant="circular" />
            <SkeletonText className="w-40" />
        </div>
        <SkeletonText className="w-full h-3" />
        <div className="space-y-3 pt-2">
            <Skeleton height={44} className="w-full rounded-xl" />
        </div>
        <div className="flex gap-2 pt-2">
            <SkeletonButton width={80} height={44} />
            <SkeletonButton className="flex-1" height={44} />
        </div>
    </div>
);

/**
 * PQC Transfer Demo Skeleton
 * Matches the demo panel with status indicators
 */
const PQCTransferDemoSkeleton = () => (
    <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
            <Skeleton width={48} height={48} className="rounded-xl" />
            <div className="space-y-2 flex-1">
                <SkeletonText className="w-1/2" />
                <SkeletonText className="w-3/4 h-3" />
            </div>
        </div>
        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-3 rounded-xl border border-border space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton width={16} height={16} variant="circular" />
                        <SkeletonText className="w-20" />
                    </div>
                    <SkeletonText className="w-full h-3" />
                </div>
            ))}
        </div>
        {/* Action button */}
        <SkeletonButton className="w-full" height={44} />
    </div>
);

// ============================================================================
// LAZY-LOADED COMPONENTS
// ============================================================================

// Friends List - loaded when user opens friends section
export const LazyFriendsList = dynamic(
    () => import(
        /* webpackChunkName: "friends-list" */
        '@/components/friends/friends-list'
    ).then(mod => ({ default: mod.FriendsList })),
    { loading: FriendsListSkeleton, ssr: false }
);

// Add Friend Dialog - loaded when user clicks add friend
export const LazyAddFriendDialog = dynamic(
    () => import('@/components/friends/add-friend-dialog').then(mod => ({ default: mod.AddFriendDialog })),
    { loading: DialogSkeleton, ssr: false }
);

// Friend Settings Dialog - loaded when user opens friend settings
export const LazyFriendSettingsDialog = dynamic(
    () => import('@/components/friends/friend-settings-dialog').then(mod => ({ default: mod.FriendSettingsDialog })),
    { loading: DialogSkeleton, ssr: false }
);

// Transfer Queue - loaded when user has active transfers (prefetch - likely needed)
export const LazyTransferQueue = dynamic(
    () => import(
        /* webpackChunkName: "transfer-queue" */
        /* webpackPrefetch: true */
        '@/components/transfer/transfer-queue'
    ).then(mod => ({ default: mod.TransferQueue })),
    { loading: TransferQueueSkeleton, ssr: false }
);

// PQC Transfer Demo - heavy component with crypto
export const LazyPQCTransferDemo = dynamic(
    () => import('@/components/transfer/pqc-transfer-demo').then(mod => ({ default: mod.PQCTransferDemo })),
    { loading: PQCTransferDemoSkeleton, ssr: false }
);

// QR Code Generator - only needed for sharing (prefetch - common action)
export const LazyQRCodeGenerator = dynamic(
    () => import(
        /* webpackChunkName: "qr-generator" */
        /* webpackPrefetch: true */
        '@/components/transfer/qr-code-generator'
    ).then(mod => ({ default: mod.QRCodeGenerator })),
    { loading: QRCodeSkeleton, ssr: false }
);

// Verification Dialog - only needed during P2P connection
export const LazyVerificationDialog = dynamic(
    () => import('@/components/security/verification-dialog').then(mod => ({ default: mod.VerificationDialog })),
    { loading: VerificationDialogSkeleton, ssr: false }
);

// Device List - loaded when scanning for devices (prefetch - likely needed)
export const LazyDeviceList = dynamic(
    () => import(
        /* webpackChunkName: "device-list" */
        /* webpackPrefetch: true */
        '@/components/devices/device-list'
    ).then(mod => ({ default: mod.DeviceList })),
    {
        loading: () => <DeviceListSkeleton count={3} />,
        ssr: false
    }
);

// Manual Connect - loaded for internet P2P
export const LazyManualConnect = dynamic(
    () => import('@/components/devices/manual-connect').then(mod => ({ default: mod.ManualConnect })),
    { loading: ManualConnectSkeleton, ssr: false }
);

// Received Files Dialog - loaded when files are received
export const LazyReceivedFilesDialog = dynamic(
    () => import('@/components/app/ReceivedFilesDialog').then(mod => ({ default: mod.ReceivedFilesDialog })),
    { loading: ReceivedFilesDialogSkeleton, ssr: false }
);

// Transfer Confirm Dialog - loaded before sending files (prefetch - common action)
export const LazyTransferConfirmDialog = dynamic(
    () => import(
        /* webpackChunkName: "transfer-confirm" */
        /* webpackPrefetch: true */
        '@/components/transfer/transfer-confirm-dialog'
    ).then(mod => ({ default: mod.TransferConfirmDialog })),
    { loading: TransferConfirmDialogSkeleton, ssr: false }
);

// Password Input Dialog - loaded when password-protected files are received
export const LazyPasswordInputDialog = dynamic(
    () => import('@/components/transfer/password-input-dialog').then(mod => ({ default: mod.PasswordInputDialog })),
    { loading: PasswordInputDialogSkeleton, ssr: false }
);

// ============================================================================
// FILE SELECTOR (commonly used, special export)
// ============================================================================

// File Selector - loaded when user wants to select files
export const LazyFileSelector = dynamic(
    () => import(
        /* webpackChunkName: "file-selector" */
        /* webpackPrefetch: true */
        '@/components/transfer/file-selector'
    ).then(mod => ({ default: mod.FileSelector })),
    { loading: FileSelectorSkeleton, ssr: false }
);

// ============================================================================
// VIRTUALIZED LIST COMPONENTS (for large lists)
// ============================================================================

/**
 * Virtualized Device List Skeleton
 * Used when loading virtualized device list for 50+ devices
 */
const VirtualizedListSkeleton = () => (
    <div className="space-y-2 h-[500px] overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
            <div
                key={i}
                className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card"
            >
                <SkeletonAvatar width={56} height={56} />
                <div className="flex-1 space-y-2">
                    <SkeletonText className="w-1/2" />
                    <SkeletonText className="w-1/3 h-3" />
                    <SkeletonText className="w-1/4 h-3" />
                </div>
                <div className="flex gap-2">
                    <SkeletonButton width={40} height={40} />
                    <SkeletonButton width={80} height={40} />
                </div>
            </div>
        ))}
    </div>
);

// Virtualized Device List - for rendering 50+ devices efficiently
export const LazyVirtualizedDeviceList = dynamic(
    () => import(
        /* webpackChunkName: "virtualized-device-list" */
        '@/components/devices/virtualized-device-list'
    ).then(mod => ({ default: mod.VirtualizedDeviceList })),
    { loading: VirtualizedListSkeleton, ssr: false }
);

// Virtualized Transfer List - for rendering 50+ transfers efficiently
export const LazyVirtualizedTransferList = dynamic(
    () => import(
        /* webpackChunkName: "virtualized-transfer-list" */
        '@/components/transfer/virtualized-transfer-list'
    ).then(mod => ({ default: mod.VirtualizedTransferList })),
    { loading: VirtualizedListSkeleton, ssr: false }
);

// ============================================================================
// ANIMATED VARIANTS (heavier bundle, load on demand)
// ============================================================================

/**
 * Animated Transfer Card - loads Framer Motion animations
 * Use standard TransferCard for lists, this for featured transfers
 */
export const LazyTransferCardAnimated = dynamic(
    () => import(
        /* webpackChunkName: "transfer-animated" */
        '@/components/transfer/transfer-card-animated'
    ).then(mod => ({ default: mod.TransferCardAnimated })),
    { loading: () => <TransferCardSkeleton count={1} />, ssr: false }
);

/**
 * Animated Device List - loads Framer Motion animations
 * Use standard DeviceList for performance, this for enhanced UX
 */
export const LazyDeviceListAnimated = dynamic(
    () => import(
        /* webpackChunkName: "device-list-animated" */
        '@/components/devices/device-list-animated'
    ).then(mod => ({ default: mod.default })),
    {
        loading: () => <DeviceListSkeleton count={3} />,
        ssr: false
    }
);

// ============================================================================
// UTILITY: Prefetch helpers for route-based prefetching
// ============================================================================

/**
 * Prefetch components that are likely needed on a given route
 * Call this in useEffect or on route change for faster navigation
 */
export const prefetchTransferComponents = () => {
    // Dynamic imports trigger prefetch
    import('@/components/transfer/transfer-queue');
    import('@/components/transfer/transfer-confirm-dialog');
    import('@/components/transfer/qr-code-generator');
};

export const prefetchDeviceComponents = () => {
    import('@/components/devices/device-list');
    import('@/components/devices/manual-connect');
};

export const prefetchFriendsComponents = () => {
    import('@/components/friends/friends-list');
    import('@/components/friends/add-friend-dialog');
};
