'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pause, Play, Trash2, ArrowUpDown } from 'lucide-react';
import { Transfer } from '@/lib/types';
import { TransferCard } from './transfer-card';

interface TransferQueueProps {
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TransferQueue({
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
    const totalTransferredSize = activeTransfers.reduce((acc, t) => acc + t.transferredSize, 0);
    const totalSpeed = activeTransfers.reduce((acc, t) => acc + (t.speed || 0), 0);
    const hasActiveTransfers = activeTransfers.length > 0;
    const hasCompletedTransfers = completedTransfers.length > 0;

    if (transfers.length === 0) {
        return (
            <Card className="p-8 rounded-xl border border-border bg-card text-center">
                <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No transfers yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                    Select files and a recipient to start transferring
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Stats Bar */}
            {hasActiveTransfers && (
                <Card className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-sm text-muted-foreground">Active</p>
                                <p className="font-semibold">{activeTransfers.length} transfer{activeTransfers.length !== 1 ? 's' : ''}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">Total Size</p>
                                <p className="font-semibold">{formatFileSize(totalActiveSize)}</p>
                            </div>
                            <Separator orientation="vertical" className="h-8" />
                            <div>
                                <p className="text-sm text-muted-foreground">Speed</p>
                                <p className="font-semibold">{formatFileSize(totalSpeed)}/s</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {onPauseAll && (
                                <Button variant="outline" size="sm" onClick={onPauseAll}>
                                    <Pause className="w-4 h-4 mr-2" />
                                    Pause All
                                </Button>
                            )}
                            {onResumeAll && (
                                <Button variant="outline" size="sm" onClick={onResumeAll}>
                                    <Play className="w-4 h-4 mr-2" />
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
                                    onPause={onPause}
                                    onResume={onResume}
                                    onCancel={onCancel}
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
                            <Button variant="ghost" size="sm" onClick={onClearCompleted}>
                                <Trash2 className="w-4 h-4 mr-2" />
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
                                    onRetry={onRetry}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
}

export default TransferQueue;
