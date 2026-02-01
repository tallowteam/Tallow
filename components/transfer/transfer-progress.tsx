'use client';

import { useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    File,
    X,
    CheckCircle,
    Loader2,
    AlertCircle,
    Clock,
    ArrowUp,
    ArrowDown,
    Zap,
    RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * EUVEKA Design System Colors for Transfer Progress
 *
 * Primary accent: #fefefc (electric blue)
 * Secondary accent: #b2987d (warm)
 * Track light: #e5dac7
 * Track dark: #544a36
 * Background dark: #191610
 * Background light: #fefefc
 */

interface TransferProgressProps {
    fileName: string;
    fileSize: number;
    bytesTransferred: number;
    status: 'waiting' | 'connecting' | 'transferring' | 'completed' | 'failed' | 'paused';
    direction: 'send' | 'receive';
    speed?: number; // bytes per second
    onCancel?: () => void;
    onRetry?: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
    return formatBytes(bytesPerSecond) + '/s';
}

function formatTime(seconds: number): string {
    if (seconds < 60) {return `${Math.ceil(seconds)}s`;}
    if (seconds < 3600) {return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;}
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function getStatusConfig(status: string, direction: string) {
    // EUVEKA color palette status configurations
    const configs: Record<string, { icon: any; color: string; bgColor: string; label: string; animate?: boolean }> = {
        waiting: {
            icon: Clock,
            color: 'text-[#b2987d]',
            bgColor: 'bg-[#b2987d]/10',
            label: 'Waiting...'
        },
        connecting: {
            icon: Loader2,
            color: 'text-[#fefefc]',
            bgColor: 'bg-[#fefefc]/10',
            label: 'Connecting...',
            animate: true
        },
        transferring: {
            icon: direction === 'send' ? ArrowUp : ArrowDown,
            color: 'text-[#fefefc]',
            bgColor: 'bg-[#fefefc]/10',
            label: direction === 'send' ? 'Sending...' : 'Receiving...'
        },
        completed: {
            icon: CheckCircle,
            color: 'text-emerald-500',
            bgColor: 'bg-emerald-500/10',
            label: 'Completed'
        },
        failed: {
            icon: AlertCircle,
            color: 'text-red-500',
            bgColor: 'bg-red-500/10',
            label: 'Failed'
        },
        paused: {
            icon: Clock,
            color: 'text-amber-500',
            bgColor: 'bg-amber-500/10',
            label: 'Paused'
        },
    };
    return configs[status] || configs['waiting'];
}

export const TransferProgress = memo(function TransferProgress({
    fileName,
    fileSize,
    bytesTransferred,
    status,
    direction,
    speed = 0,
    onCancel,
    onRetry,
}: TransferProgressProps) {
    const percentage = useMemo(() => {
        if (fileSize === 0) {return 0;}
        return Math.min(100, Math.round((bytesTransferred / fileSize) * 100));
    }, [bytesTransferred, fileSize]);

    const remainingTime = useMemo(() => {
        if (speed === 0 || status !== 'transferring') {return null;}
        const remaining = fileSize - bytesTransferred;
        return remaining / speed;
    }, [fileSize, bytesTransferred, speed, status]);

    const config = getStatusConfig(status, direction);
    const StatusIcon = config?.icon || Loader2;
    const isTransferring = status === 'transferring';
    const isActive = ['waiting', 'connecting', 'transferring'].includes(status);

    return (
        <Card className={cn(
            'relative p-5 rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden',
            'transition-all duration-300 ease-out',
            'hover:shadow-lg hover:shadow-[#fefefc]/5 dark:hover:shadow-[#fefefc]/10',
            'dark:bg-zinc-900/80',
            isTransferring && 'border-[#fefefc]/30 shadow-md shadow-[#fefefc]/10'
        )}>
            {/* Bento-style gradient overlay for active transfers */}
            {isTransferring && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#fefefc]/5 via-transparent to-transparent pointer-events-none" />
            )}

            {/* Live region for screen reader progress announcements (WCAG 4.1.3) */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="false"
                className="sr-only"
                aria-label="Transfer progress"
            >
                {config?.label || ''} - {percentage}% complete
                {status === 'completed' && ` - ${fileName} transfer completed`}
                {status === 'failed' && ` - ${fileName} transfer failed`}
            </div>

            <div className="relative flex items-start gap-4">
                {/* File icon with gradient background */}
                <div className={cn(
                    'relative w-12 h-12 rounded-xl flex items-center justify-center shrink-0',
                    'bg-gradient-to-br from-[#fefefc]/20 to-[#fefefc]/5',
                    isTransferring && 'animate-pulse'
                )}>
                    <File className="w-6 h-6 text-[#fefefc]" aria-hidden="true" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* File name and status */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold truncate text-foreground">{fileName}</p>
                        <div className={cn(
                            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
                            config?.bgColor,
                            config?.color
                        )}>
                            <StatusIcon
                                className={cn(
                                    'w-3.5 h-3.5',
                                    config?.animate && 'animate-spin'
                                )}
                                aria-hidden="true"
                            />
                            <span>{config?.label || ''}</span>
                        </div>
                    </div>

                    {/* Progress bar - EUVEKA styled with pill shape */}
                    <div className="relative h-3 bg-[#e5dac7] dark:bg-[#544a36] rounded-full overflow-hidden mb-3">
                        <div
                            className={cn(
                                'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out',
                                status === 'completed'
                                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                    : status === 'failed'
                                        ? 'bg-gradient-to-r from-red-500 to-red-400'
                                        : status === 'paused'
                                            ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                            : 'bg-gradient-to-r from-[#fefefc] to-[#fefefc]/80'
                            )}
                            style={{ width: `${percentage}%` }}
                        />
                        {/* Shimmer effect for active transfers */}
                        {isTransferring && percentage > 0 && (
                            <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                style={{
                                    width: `${percentage}%`,
                                    animation: 'shimmer 2s infinite'
                                }}
                            />
                        )}
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="font-medium">
                                {formatBytes(bytesTransferred)} / {formatBytes(fileSize)}
                            </span>
                            {speed > 0 && isTransferring && (
                                <div className="flex items-center gap-1 text-[#fefefc] font-medium">
                                    <Zap className="w-3 h-3" aria-hidden="true" />
                                    <span>{formatSpeed(speed)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{percentage}%</span>
                            {remainingTime && remainingTime > 0 && (
                                <>
                                    <span className="text-muted-foreground/50">|</span>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" aria-hidden="true" />
                                        <span>{formatTime(remainingTime)} left</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions - 44px touch targets for WCAG compliance */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {status === 'failed' && onRetry && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onRetry}
                            aria-label={`Retry transfer of ${fileName}`}
                            className={cn(
                                'h-11 px-4 sm:h-9 sm:px-3 rounded-xl',
                                'bg-[#fefefc]/10 hover:bg-[#fefefc]/20 text-[#fefefc] font-medium',
                                'transition-all duration-200 hover:scale-105 active:scale-95'
                            )}
                        >
                            <RotateCcw className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            Retry
                        </Button>
                    )}
                    {isActive && onCancel && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onCancel}
                            aria-label={`Cancel transfer of ${fileName}`}
                            className={cn(
                                'h-11 w-11 sm:h-9 sm:w-9 rounded-xl',
                                'bg-zinc-100 dark:bg-zinc-800',
                                'hover:bg-red-500/10 text-muted-foreground hover:text-red-500',
                                'transition-all duration-200 hover:scale-105 active:scale-95'
                            )}
                        >
                            <X className="w-5 h-5 sm:w-4 sm:h-4" aria-hidden="true" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Shimmer animation styles */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </Card>
    );
});

TransferProgress.displayName = 'TransferProgress';

// Multi-file progress tracker
interface TransferQueueItem {
    id: string;
    fileName: string;
    fileSize: number;
    bytesTransferred: number;
    status: 'waiting' | 'connecting' | 'transferring' | 'completed' | 'failed' | 'paused';
    speed?: number;
}

interface TransferQueueProgressProps {
    items: TransferQueueItem[];
    direction: 'send' | 'receive';
    onCancel?: (id: string) => void;
    onCancelAll?: () => void;
}

export const TransferQueueProgress = memo(function TransferQueueProgress({
    items,
    direction,
    onCancel: _onCancel,
    onCancelAll,
}: TransferQueueProgressProps) {
    const totalBytes = items.reduce((sum, item) => sum + item.fileSize, 0);
    const transferredBytes = items.reduce((sum, item) => sum + item.bytesTransferred, 0);
    const completedCount = items.filter(i => i.status === 'completed').length;
    const totalSpeed = items.reduce((sum, item) => sum + (item.speed || 0), 0);

    const overallPercentage = totalBytes > 0 ? Math.round((transferredBytes / totalBytes) * 100) : 0;
    const isInProgress = completedCount < items.length;

    return (
        <Card className={cn(
            'relative p-5 rounded-2xl border bg-card/80 backdrop-blur-sm overflow-hidden',
            'transition-all duration-300 ease-out',
            'dark:bg-zinc-900/80',
            isInProgress && 'border-[#fefefc]/30 shadow-md shadow-[#fefefc]/10'
        )}>
            {/* Bento-style gradient overlay */}
            {isInProgress && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#fefefc]/5 via-transparent to-transparent pointer-events-none" />
            )}

            {/* Live region for queue progress announcements (WCAG 4.1.3) */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="false"
                className="sr-only"
                aria-label="Transfer queue progress"
            >
                {direction === 'send' ? 'Sending' : 'Receiving'} {items.length} files - {completedCount} of {items.length} completed - {overallPercentage}% complete
            </div>

            {/* Overall progress header */}
            <div className="relative flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        {direction === 'send' ? (
                            <ArrowUp className="w-4 h-4 text-[#fefefc]" aria-hidden="true" />
                        ) : (
                            <ArrowDown className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                        )}
                        {direction === 'send' ? 'Sending' : 'Receiving'} {items.length} file{items.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {completedCount} of {items.length} completed | {formatBytes(transferredBytes)} / {formatBytes(totalBytes)}
                    </p>
                </div>
                {onCancelAll && isInProgress && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onCancelAll}
                        aria-label="Cancel all transfers"
                        className={cn(
                            'h-11 px-4 sm:h-9 sm:px-3 rounded-xl',
                            'border-red-500/30 text-red-500 hover:bg-red-500/10',
                            'transition-all duration-200'
                        )}
                    >
                        Cancel All
                    </Button>
                )}
            </div>

            {/* Overall progress bar - EUVEKA styled */}
            <div className="relative h-4 bg-[#e5dac7] dark:bg-[#544a36] rounded-full overflow-hidden mb-3">
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#fefefc] to-[#fefefc]/80 transition-all duration-500 ease-out"
                    style={{ width: `${overallPercentage}%` }}
                />
                {isInProgress && overallPercentage > 0 && (
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        style={{
                            width: `${overallPercentage}%`,
                            animation: 'shimmer 2s infinite'
                        }}
                    />
                )}
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span className="font-semibold text-foreground">{overallPercentage}% complete</span>
                {totalSpeed > 0 && (
                    <div className="flex items-center gap-1 text-[#fefefc] font-medium">
                        <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{formatSpeed(totalSpeed)}</span>
                    </div>
                )}
            </div>

            {/* Individual files */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {items.map((item) => {
                    const itemPercentage = item.fileSize > 0
                        ? Math.round((item.bytesTransferred / item.fileSize) * 100)
                        : 0;

                    return (
                        <div
                            key={item.id}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-xl',
                                'bg-zinc-100/50 dark:bg-zinc-800/50',
                                'transition-all duration-200',
                                item.status === 'transferring' && 'bg-[#fefefc]/5 dark:bg-[#fefefc]/10'
                            )}
                        >
                            <div className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                                item.status === 'completed'
                                    ? 'bg-emerald-500/10'
                                    : item.status === 'failed'
                                        ? 'bg-red-500/10'
                                        : 'bg-zinc-200 dark:bg-zinc-700'
                            )}>
                                <File className={cn(
                                    'w-4 h-4',
                                    item.status === 'completed'
                                        ? 'text-emerald-500'
                                        : item.status === 'failed'
                                            ? 'text-red-500'
                                            : 'text-muted-foreground'
                                )} aria-hidden="true" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium truncate block text-foreground">
                                    {item.fileName}
                                </span>
                                {item.status === 'transferring' && (
                                    <div className="h-1.5 bg-[#e5dac7] dark:bg-[#544a36] rounded-full mt-1.5 overflow-hidden">
                                        <div
                                            className="h-full bg-[#fefefc] rounded-full transition-all duration-300"
                                            style={{ width: `${itemPercentage}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className="text-xs font-medium shrink-0">
                                {item.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                                ) : item.status === 'transferring' ? (
                                    <span className="text-[#fefefc]">{itemPercentage}%</span>
                                ) : item.status === 'failed' ? (
                                    <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                                ) : (
                                    <Clock className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Shimmer animation styles */}
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </Card>
    );
});

TransferQueueProgress.displayName = 'TransferQueueProgress';

export default TransferProgress;
