'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    File,
    Folder,
    X,
    CheckCircle,
    Loader2,
    AlertCircle,
    Clock,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatSpeed(bytesPerSecond: number): string {
    return formatBytes(bytesPerSecond) + '/s';
}

function formatTime(seconds: number): string {
    if (seconds < 60) return `${Math.ceil(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.ceil(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function TransferProgress({
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
        if (fileSize === 0) return 0;
        return Math.min(100, Math.round((bytesTransferred / fileSize) * 100));
    }, [bytesTransferred, fileSize]);

    const remainingTime = useMemo(() => {
        if (speed === 0 || status !== 'transferring') return null;
        const remaining = fileSize - bytesTransferred;
        return remaining / speed;
    }, [fileSize, bytesTransferred, speed, status]);

    const statusConfig: Record<string, { icon: any; color: string; label: string; animate?: boolean }> = {
        waiting: { icon: Clock, color: 'text-muted-foreground', label: 'Waiting...' },
        connecting: { icon: Loader2, color: 'text-blue-500', label: 'Connecting...', animate: true },
        transferring: { icon: direction === 'send' ? ArrowUp : ArrowDown, color: 'text-primary', label: direction === 'send' ? 'Sending...' : 'Receiving...' },
        completed: { icon: CheckCircle, color: 'text-green-500', label: 'Completed' },
        failed: { icon: AlertCircle, color: 'text-red-500', label: 'Failed' },
        paused: { icon: Clock, color: 'text-yellow-500', label: 'Paused' },
    };

    const config = statusConfig[status];
    const StatusIcon = config.icon;

    return (
        <Card className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-start gap-3">
                {/* File icon */}
                <div className="p-2 rounded-lg bg-primary/10">
                    <File className="w-5 h-5 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* File name and status */}
                    <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate text-sm">{fileName}</p>
                        <div className={`flex items-center gap-1 text-xs ${config.color}`}>
                            <StatusIcon className={`w-3.5 h-3.5 ${config.animate ? 'animate-spin' : ''}`} />
                            <span>{config.label}</span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <Progress value={percentage} className="h-2 mb-2" />

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            {formatBytes(bytesTransferred)} / {formatBytes(fileSize)}
                            {speed > 0 && status === 'transferring' && (
                                <span className="ml-2 text-primary">• {formatSpeed(speed)}</span>
                            )}
                        </span>
                        <span>
                            {percentage}%
                            {remainingTime && remainingTime > 0 && (
                                <span className="ml-2">• {formatTime(remainingTime)} left</span>
                            )}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                    {status === 'failed' && onRetry && (
                        <Button variant="ghost" size="sm" onClick={onRetry}>
                            Retry
                        </Button>
                    )}
                    {(status === 'transferring' || status === 'waiting' || status === 'connecting') && onCancel && (
                        <Button variant="ghost" size="icon" onClick={onCancel}>
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

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

export function TransferQueueProgress({
    items,
    direction,
    onCancel,
    onCancelAll,
}: TransferQueueProgressProps) {
    const totalBytes = items.reduce((sum, item) => sum + item.fileSize, 0);
    const transferredBytes = items.reduce((sum, item) => sum + item.bytesTransferred, 0);
    const completedCount = items.filter(i => i.status === 'completed').length;
    const totalSpeed = items.reduce((sum, item) => sum + (item.speed || 0), 0);

    const overallPercentage = totalBytes > 0 ? Math.round((transferredBytes / totalBytes) * 100) : 0;

    return (
        <Card className="p-4 rounded-xl border border-border bg-card">
            {/* Overall progress header */}
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-semibold">
                        {direction === 'send' ? 'Sending' : 'Receiving'} {items.length} file{items.length !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {completedCount} of {items.length} completed • {formatBytes(transferredBytes)} / {formatBytes(totalBytes)}
                    </p>
                </div>
                {onCancelAll && completedCount < items.length && (
                    <Button variant="outline" size="sm" onClick={onCancelAll}>
                        Cancel All
                    </Button>
                )}
            </div>

            {/* Overall progress bar */}
            <Progress value={overallPercentage} className="h-3 mb-2" />

            <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                <span>{overallPercentage}% complete</span>
                {totalSpeed > 0 && <span>{formatSpeed(totalSpeed)}</span>}
            </div>

            {/* Individual files */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
                {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30">
                        <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 truncate text-sm">{item.fileName}</span>
                        <span className="text-xs text-muted-foreground">
                            {item.status === 'completed' ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : item.status === 'transferring' ? (
                                `${Math.round((item.bytesTransferred / item.fileSize) * 100)}%`
                            ) : item.status === 'failed' ? (
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            ) : (
                                <Clock className="w-4 h-4" />
                            )}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

export default TransferProgress;
