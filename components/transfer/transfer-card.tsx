'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Pause,
    Play,
    X,
    Check,
    AlertCircle,
    ArrowUp,
    ArrowDown,
    Monitor,
    Smartphone,
    Laptop,
    Clock,
    Trash2,
    RotateCcw,
    Zap
} from 'lucide-react';
import { Transfer } from '@/lib/types';
import { useSwipeActions } from '@/lib/hooks/use-advanced-gestures';
import { cn } from '@/lib/utils';

interface TransferCardProps {
    transfer: Transfer;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
    onDelete?: (id: string) => void;
    enableGestures?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

function formatTime(seconds: number): string {
    if (seconds < 60) {return `${seconds}s`;}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;}
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getPlatformIcon(platform: string) {
    switch (platform) {
        case 'android':
        case 'ios':
            return Smartphone;
        case 'windows':
        case 'macos':
        case 'linux':
            return Laptop;
        default:
            return Monitor;
    }
}

function getStatusConfig(status: Transfer['status']) {
    switch (status) {
        case 'transferring':
            return {
                bg: 'bg-[#0066FF]/10 dark:bg-[#0066FF]/20',
                text: 'text-[#0066FF]',
                border: 'border-[#0066FF]/30',
                label: 'Transferring'
            };
        case 'completed':
            return {
                bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
                text: 'text-emerald-600 dark:text-emerald-400',
                border: 'border-emerald-500/30',
                label: 'Completed'
            };
        case 'failed':
            return {
                bg: 'bg-red-500/10 dark:bg-red-500/20',
                text: 'text-red-600 dark:text-red-400',
                border: 'border-red-500/30',
                label: 'Failed'
            };
        case 'paused':
            return {
                bg: 'bg-amber-500/10 dark:bg-amber-500/20',
                text: 'text-amber-600 dark:text-amber-400',
                border: 'border-amber-500/30',
                label: 'Paused'
            };
        case 'cancelled':
            return {
                bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
                text: 'text-zinc-600 dark:text-zinc-400',
                border: 'border-zinc-500/30',
                label: 'Cancelled'
            };
        default:
            return {
                bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
                text: 'text-zinc-600 dark:text-zinc-400',
                border: 'border-zinc-500/30',
                label: status
            };
    }
}

/**
 * TransferCard Component - Memoized for React 18 performance optimization
 * Prevents unnecessary re-renders when parent list updates but this item hasn't changed
 */
export const TransferCard = memo(function TransferCard({
    transfer,
    onPause,
    onResume,
    onCancel,
    onRetry,
    onDelete,
    enableGestures = true
}: TransferCardProps) {
    const isActive = ['transferring', 'connecting', 'pending'].includes(transfer.status);
    const isPaused = transfer.status === 'paused';
    const isComplete = transfer.status === 'completed';
    const isFailed = transfer.status === 'failed';
    const isTransferring = transfer.status === 'transferring';

    const PeerIcon = getPlatformIcon(transfer.direction === 'send' ? transfer.to.platform : transfer.from.platform);
    const peer = transfer.direction === 'send' ? transfer.to : transfer.from;
    const statusConfig = getStatusConfig(transfer.status);

    // Swipe gestures
    const { bind, offset, isDragging, swipeDirection, style } = useSwipeActions({
        onSwipeLeft: () => {
            if (enableGestures && onDelete) {
                onDelete(transfer.id);
            }
        },
        onSwipeRight: () => {
            if (enableGestures && isFailed && onRetry) {
                onRetry(transfer.id);
            }
        },
        threshold: 100,
        enabled: enableGestures && (isFailed || isComplete),
    });

    // Show action hint based on swipe direction
    const showLeftHint = isDragging && swipeDirection === 'left' && Math.abs(offset.x) > 50;
    const showRightHint = isDragging && swipeDirection === 'right' && Math.abs(offset.x) > 50;

    const fileName = transfer.files.length === 1 && transfer.files[0]
        ? transfer.files[0].name
        : `${transfer.files.length} files`;

    return (
        <div className="relative overflow-hidden rounded-2xl">
            {/* Background action hints */}
            {enableGestures && (
                <>
                    <div
                        className={cn(
                            'absolute inset-y-0 right-0 flex items-center justify-end px-6 bg-red-500 dark:bg-red-600 rounded-2xl transition-all duration-300',
                            showLeftHint ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        )}
                    >
                        <Trash2 className="w-6 h-6 text-white" aria-hidden="true" />
                    </div>
                    {isFailed && (
                        <div
                            className={cn(
                                'absolute inset-y-0 left-0 flex items-center justify-start px-6 bg-[#0066FF] rounded-2xl transition-all duration-300',
                                showRightHint ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            )}
                        >
                            <RotateCcw className="w-6 h-6 text-white" aria-hidden="true" />
                        </div>
                    )}
                </>
            )}

            <Card
                {...(enableGestures ? bind() : {})}
                style={enableGestures ? style : undefined}
                className={cn(
                    'relative p-4 sm:p-5 3xl:p-6 rounded-xl sm:rounded-2xl 3xl:rounded-3xl border bg-card/80 backdrop-blur-sm touch-none',
                    'transition-all duration-300 ease-out',
                    'hover:shadow-lg hover:shadow-[#0066FF]/5 dark:hover:shadow-[#0066FF]/10',
                    'hover:border-[#0066FF]/30 hover:-translate-y-0.5',
                    'dark:bg-zinc-900/80',
                    isTransferring && 'border-[#0066FF]/40 shadow-md shadow-[#0066FF]/10'
                )}
            >
                {/* Bento-style gradient overlay for active transfers */}
                {isTransferring && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#0066FF]/5 via-transparent to-transparent pointer-events-none" />
                )}

                <div className="relative flex items-start gap-3 sm:gap-4 3xl:gap-5">
                    {/* Direction Icon with animated gradient */}
                    <div className={cn(
                        'relative w-12 h-12 sm:w-14 sm:h-14 3xl:w-16 3xl:h-16 rounded-lg sm:rounded-xl 3xl:rounded-2xl flex items-center justify-center shrink-0 overflow-hidden',
                        'transition-all duration-300',
                        transfer.direction === 'send'
                            ? 'bg-gradient-to-br from-[#0066FF]/20 to-[#0066FF]/5'
                            : 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/5'
                    )}>
                        {/* Pulse animation for active transfers */}
                        {isTransferring && (
                            <div className="absolute inset-0 animate-pulse bg-[#0066FF]/10 rounded-xl" />
                        )}
                        {transfer.direction === 'send' ? (
                            <ArrowUp className={cn(
                                'w-5 h-5 sm:w-6 sm:h-6 3xl:w-7 3xl:h-7 text-[#0066FF] transition-transform duration-300',
                                isTransferring && 'animate-bounce'
                            )} aria-hidden="true" />
                        ) : (
                            <ArrowDown className={cn(
                                'w-5 h-5 sm:w-6 sm:h-6 3xl:w-7 3xl:h-7 text-emerald-500 transition-transform duration-300',
                                isTransferring && 'animate-bounce'
                            )} aria-hidden="true" />
                        )}
                    </div>

                    {/* Transfer Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 sm:gap-2.5 mb-1.5 sm:mb-2">
                            <h4 className="text-sm sm:text-base 3xl:text-lg font-semibold text-foreground truncate">
                                {fileName}
                            </h4>
                            <Badge
                                className={cn(
                                    'px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs 3xl:text-sm font-medium rounded-full border transition-all duration-300',
                                    statusConfig.bg,
                                    statusConfig.text,
                                    statusConfig.border
                                )}
                            >
                                {statusConfig.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm 3xl:text-base text-muted-foreground mb-2 sm:mb-3">
                            <PeerIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5" aria-hidden="true" />
                            <span className="font-medium truncate max-w-[100px] sm:max-w-none">{peer.name}</span>
                            <span className="text-muted-foreground/50">|</span>
                            <span>{formatFileSize(transfer.totalSize)}</span>
                        </div>

                        {/* Progress Bar with blue accent */}
                        {(isActive || isPaused) && (
                            <div className="space-y-1.5 sm:space-y-2">
                                <div className="relative h-2 sm:h-2.5 3xl:h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out',
                                            isPaused
                                                ? 'bg-amber-500'
                                                : 'bg-gradient-to-r from-[#0066FF] to-[#0088FF]'
                                        )}
                                        style={{ width: `${transfer.progress}%` }}
                                    />
                                    {/* Shimmer effect for active transfers */}
                                    {isTransferring && (
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                                            style={{ width: `${transfer.progress}%` }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] sm:text-xs 3xl:text-sm text-muted-foreground">
                                    <span className="font-medium">
                                        {formatFileSize(transfer.transferredSize)} / {formatFileSize(transfer.totalSize)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {isTransferring && (
                                            <>
                                                <div className="flex items-center gap-1 text-[#0066FF] font-medium">
                                                    <Zap className="w-3 h-3" aria-hidden="true" />
                                                    <span>{formatSpeed(transfer.speed)}</span>
                                                </div>
                                                {transfer.eta && (
                                                    <>
                                                        <span className="text-muted-foreground/50">|</span>
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" aria-hidden="true" />
                                                            <span>{formatTime(transfer.eta)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Status Messages */}
                        {isComplete && (
                            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Check className="w-3 h-3" aria-hidden="true" />
                                </div>
                                <span>Transfer complete</span>
                            </div>
                        )}

                        {isFailed && (
                            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="w-3 h-3" aria-hidden="true" />
                                </div>
                                <span>{transfer.error?.message || String(transfer.error) || 'Transfer failed'}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions - 44px touch targets for WCAG compliance, 56px on TV */}
                    <div className="flex items-center gap-1 sm:gap-1.5 3xl:gap-2 shrink-0">
                        {isActive && !isPaused && onPause && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onPause(transfer.id)}
                                className={cn(
                                    'h-10 w-10 sm:h-11 sm:w-11 3xl:h-14 3xl:w-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl',
                                    'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
                                    'transition-all duration-200 hover:scale-105 active:scale-95'
                                )}
                                aria-label={`Pause transfer of ${fileName}`}
                            >
                                <Pause className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6" aria-hidden="true" />
                            </Button>
                        )}
                        {isPaused && onResume && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onResume(transfer.id)}
                                className={cn(
                                    'h-10 w-10 sm:h-11 sm:w-11 3xl:h-14 3xl:w-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl',
                                    'bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF]',
                                    'transition-all duration-200 hover:scale-105 active:scale-95'
                                )}
                                aria-label={`Resume transfer of ${fileName}`}
                            >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6" aria-hidden="true" />
                            </Button>
                        )}
                        {(isActive || isPaused) && onCancel && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onCancel(transfer.id)}
                                className={cn(
                                    'h-10 w-10 sm:h-11 sm:w-11 3xl:h-14 3xl:w-14 rounded-lg sm:rounded-xl 3xl:rounded-2xl',
                                    'hover:bg-red-500/10 text-muted-foreground hover:text-red-500',
                                    'transition-all duration-200 hover:scale-105 active:scale-95'
                                )}
                                aria-label={`Cancel transfer of ${fileName}`}
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5 3xl:w-6 3xl:h-6" aria-hidden="true" />
                            </Button>
                        )}
                        {isFailed && onRetry && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onRetry(transfer.id)}
                                className={cn(
                                    'h-10 px-3 sm:h-11 sm:px-4 3xl:h-14 3xl:px-6 rounded-lg sm:rounded-xl 3xl:rounded-2xl text-xs sm:text-sm 3xl:text-base',
                                    'bg-[#0066FF]/10 hover:bg-[#0066FF]/20 text-[#0066FF] font-medium',
                                    'transition-all duration-200 hover:scale-105 active:scale-95'
                                )}
                                aria-label={`Retry transfer of ${fileName}`}
                            >
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 3xl:w-5 3xl:h-5 mr-1 sm:mr-1.5" aria-hidden="true" />
                                Retry
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Add shimmer keyframes via style tag */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
});

// Custom comparison function for more granular control
TransferCard.displayName = 'TransferCard';

export default TransferCard;
