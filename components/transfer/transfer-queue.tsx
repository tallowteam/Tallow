'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { NoTransfersEmpty } from '@/components/ui/empty-state-presets';
import { Pause, Play, Trash2 } from 'lucide-react';
import { Transfer } from '@/lib/types';
import { TransferCard } from './transfer-card';

export interface TransferQueueProps {
    transfers: Transfer[];
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
    onPauseAll?: () => void;
    onResumeAll?: () => void;
    onClearCompleted?: () => void;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export const TransferQueue = memo(function TransferQueue({
    transfers,
    onPause,
    onResume,
    onCancel,
    onRetry,
    onPauseAll,
    onResumeAll,
    onClearCompleted
}: TransferQueueProps) {
    const activeTransfers = transfers.filter(
        (t) => ['transferring', 'connecting', 'pending', 'paused'].includes(t.status)
    );
    const completedTransfers = transfers.filter(
        (t) => ['completed', 'failed', 'cancelled'].includes(t.status)
    );

    const totalActiveSize = activeTransfers.reduce((acc, t) => acc + t.totalSize, 0);
    const totalSpeed = activeTransfers.reduce((acc, t) => acc + (t.speed || 0), 0);
    const hasActiveTransfers = activeTransfers.length > 0;
    const hasCompletedTransfers = completedTransfers.length > 0;

    if (transfers.length === 0) {
        return (
            <Card className="rounded-xl sm:rounded-2xl border border-border bg-card overflow-hidden">
                <NoTransfersEmpty />
            </Card>
        );
    }

    return (
        <section className="space-y-4" aria-labelledby="transfer-queue-heading">
            <h2 id="transfer-queue-heading" className="sr-only">Transfer Queue</h2>
            {/* Stats Bar - Responsive layout for mobile */}
            {hasActiveTransfers && (
                <Card className="p-4 rounded-xl border border-border bg-card">
                    {/* Mobile: Stack vertically, Desktop: Row layout */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        {/* Stats - Grid on mobile, flex on desktop */}
                        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
                            <div className="text-center sm:text-left">
                                <p className="text-xs sm:text-sm text-muted-foreground">Active</p>
                                <p className="font-semibold text-sm sm:text-base">{activeTransfers.length} transfer{activeTransfers.length !== 1 ? 's' : ''}</p>
                            </div>
                            <Separator orientation="vertical" className="hidden sm:block h-8" />
                            <div className="text-center sm:text-left">
                                <p className="text-xs sm:text-sm text-muted-foreground">Total Size</p>
                                <p className="font-semibold text-sm sm:text-base">{formatFileSize(totalActiveSize)}</p>
                            </div>
                            <Separator orientation="vertical" className="hidden sm:block h-8" />
                            <div className="text-center sm:text-left">
                                <p className="text-xs sm:text-sm text-muted-foreground">Speed</p>
                                <p className="font-semibold text-sm sm:text-base">{formatFileSize(totalSpeed)}/s</p>
                            </div>
                        </div>
                        {/* Action buttons - 44px height for touch compliance */}
                        <div className="flex items-center gap-2">
                            {onPauseAll && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onPauseAll}
                                    className="flex-1 sm:flex-none h-11 sm:h-9"
                                    aria-label="Pause all active transfers"
                                >
                                    <Pause className="w-4 h-4 mr-2" aria-hidden="true" />
                                    Pause All
                                </Button>
                            )}
                            {onResumeAll && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onResumeAll}
                                    className="flex-1 sm:flex-none h-11 sm:h-9"
                                    aria-label="Resume all paused transfers"
                                >
                                    <Play className="w-4 h-4 mr-2" aria-hidden="true" />
                                    Resume All
                                </Button>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Active Transfers */}
            {hasActiveTransfers && (
                <div>
                    <h3 className="font-semibold mb-3">Active Transfers</h3>
                    <ScrollArea className="max-h-[400px]">
                        <div className="space-y-2">
                            {activeTransfers.map((transfer) => (
                                <TransferCard
                                    key={transfer.id}
                                    transfer={transfer}
                                    {...(onPause ? { onPause } : {})}
                                    {...(onResume ? { onResume } : {})}
                                    {...(onCancel ? { onCancel } : {})}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}

            {/* Completed Transfers */}
            {hasCompletedTransfers && (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold">Completed</h3>
                        {onClearCompleted && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearCompleted}
                                className="h-11 sm:h-9"
                                aria-label="Clear completed transfers from history"
                            >
                                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                Clear
                            </Button>
                        )}
                    </div>
                    <ScrollArea className="max-h-[300px]">
                        <div className="space-y-2">
                            {completedTransfers.map((transfer) => (
                                <TransferCard
                                    key={transfer.id}
                                    transfer={transfer}
                                    {...(onRetry ? { onRetry } : {})}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </section>
    );
});

TransferQueue.displayName = 'TransferQueue';

export default TransferQueue;
