'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    File,
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
    Clock
} from 'lucide-react';
import { Transfer } from '@/lib/types';

interface TransferCardProps {
    transfer: Transfer;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
    return formatFileSize(bytesPerSecond) + '/s';
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
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

function getStatusColor(status: Transfer['status']): string {
    switch (status) {
        case 'transferring':
            return 'bg-primary text-primary-foreground';
        case 'completed':
            return 'bg-green-500 dark:bg-green-600 text-primary-foreground';
        case 'failed':
            return 'bg-destructive text-destructive-foreground';
        case 'paused':
            return 'bg-yellow-500 dark:bg-yellow-600 text-primary-foreground';
        case 'cancelled':
            return 'bg-muted text-muted-foreground';
        default:
            return 'bg-secondary text-secondary-foreground';
    }
}

export function TransferCard({ transfer, onPause, onResume, onCancel, onRetry }: TransferCardProps) {
    const isActive = ['transferring', 'connecting', 'pending'].includes(transfer.status);
    const isPaused = transfer.status === 'paused';
    const isComplete = transfer.status === 'completed';
    const isFailed = transfer.status === 'failed';

    const PeerIcon = getPlatformIcon(transfer.direction === 'send' ? transfer.to.platform : transfer.from.platform);
    const peer = transfer.direction === 'send' ? transfer.to : transfer.from;

    return (
        <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
            <div className="flex items-start gap-4">
                {/* Direction Icon */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${transfer.direction === 'send' ? 'bg-primary/20' : 'bg-accent/20'
                    }`}>
                    {transfer.direction === 'send' ? (
                        <ArrowUp className="w-6 h-6 text-primary" />
                    ) : (
                        <ArrowDown className="w-6 h-6 text-accent" />
                    )}
                </div>

                {/* Transfer Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold truncate">
                            {transfer.files.length === 1
                                ? transfer.files[0].name
                                : `${transfer.files.length} files`}
                        </h4>
                        <Badge className={getStatusColor(transfer.status)}>
                            {transfer.status}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <PeerIcon className="w-4 h-4" />
                        <span>{peer.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(transfer.totalSize)}</span>
                    </div>

                    {/* Progress Bar */}
                    {(isActive || isPaused) && (
                        <div className="space-y-1">
                            <Progress value={transfer.progress} className="h-2" />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    {formatFileSize(transfer.transferredSize)} / {formatFileSize(transfer.totalSize)}
                                </span>
                                <div className="flex items-center gap-2">
                                    {transfer.status === 'transferring' && (
                                        <>
                                            <span>{formatSpeed(transfer.speed)}</span>
                                            {transfer.eta && (
                                                <>
                                                    <span>•</span>
                                                    <Clock className="w-3 h-3" />
                                                    <span>{formatTime(transfer.eta)}</span>
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
                        <div className="flex items-center gap-2 text-sm text-green-500">
                            <Check className="w-4 h-4" />
                            <span>Transfer complete</span>
                        </div>
                    )}

                    {isFailed && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            <span>{transfer.error || 'Transfer failed'}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                    {isActive && !isPaused && onPause && (
                        <Button variant="ghost" size="icon" onClick={() => onPause(transfer.id)}>
                            <Pause className="w-4 h-4" />
                        </Button>
                    )}
                    {isPaused && onResume && (
                        <Button variant="ghost" size="icon" onClick={() => onResume(transfer.id)}>
                            <Play className="w-4 h-4" />
                        </Button>
                    )}
                    {(isActive || isPaused) && onCancel && (
                        <Button variant="ghost" size="icon" onClick={() => onCancel(transfer.id)}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                    {isFailed && onRetry && (
                        <Button variant="ghost" size="sm" onClick={() => onRetry(transfer.id)}>
                            Retry
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

export default TransferCard;
