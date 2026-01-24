'use client';

/**
 * Lazy-loaded Components
 * These components are code-split and only loaded when needed
 * to improve initial page load performance.
 */

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading fallback component
const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
);

// Friends List - loaded when user opens friends section
export const LazyFriendsList = dynamic(
    () => import('@/components/friends/friends-list').then(mod => ({ default: mod.FriendsList })),
    { loading: LoadingSpinner, ssr: false }
);

// Add Friend Dialog - loaded when user clicks add friend
export const LazyAddFriendDialog = dynamic(
    () => import('@/components/friends/add-friend-dialog').then(mod => ({ default: mod.AddFriendDialog })),
    { loading: LoadingSpinner, ssr: false }
);

// Friend Settings Dialog - loaded when user opens friend settings
export const LazyFriendSettingsDialog = dynamic(
    () => import('@/components/friends/friend-settings-dialog').then(mod => ({ default: mod.FriendSettingsDialog })),
    { loading: LoadingSpinner, ssr: false }
);

// Transfer Queue - loaded when user has active transfers
export const LazyTransferQueue = dynamic(
    () => import('@/components/transfer/transfer-queue').then(mod => ({ default: mod.TransferQueue })),
    { loading: LoadingSpinner, ssr: false }
);

// PQC Transfer Demo - heavy component with crypto
export const LazyPQCTransferDemo = dynamic(
    () => import('@/components/transfer/pqc-transfer-demo').then(mod => ({ default: mod.PQCTransferDemo })),
    { loading: LoadingSpinner, ssr: false }
);

// QR Code Generator - only needed for sharing
export const LazyQRCodeGenerator = dynamic(
    () => import('@/components/transfer/qr-code-generator').then(mod => ({ default: mod.QRCodeGenerator })),
    { loading: LoadingSpinner, ssr: false }
);

// Verification Dialog - only needed during P2P connection
export const LazyVerificationDialog = dynamic(
    () => import('@/components/security/verification-dialog').then(mod => ({ default: mod.VerificationDialog })),
    { loading: LoadingSpinner, ssr: false }
);

// Device List - loaded when scanning for devices
export const LazyDeviceList = dynamic(
    () => import('@/components/devices/device-list').then(mod => ({ default: mod.DeviceList })),
    { loading: LoadingSpinner, ssr: false }
);

// Manual Connect - loaded for internet P2P
export const LazyManualConnect = dynamic(
    () => import('@/components/devices/manual-connect').then(mod => ({ default: mod.ManualConnect })),
    { loading: LoadingSpinner, ssr: false }
);
