'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Pause, Play, Trash2, ArrowUpDown } from 'lucide-react';
import { Transfer } from '@/lib/types';
import { TransferCardAnimated } from './transfer-card-animated';
import { TransferCardSkeleton } from '@/components/ui/skeleton';
import { fadeUpVariants, staggerContainerVariants } from '@/lib/animations/motion-config';

interface TransferQueueProps {
    transfers: Transfer[];
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
    onPauseAll?: () => void;
    onResumeAll?: () => void;
    onClearCompleted?: () => void;
    isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function TransferQueueAnimated({
    transfers,
    onPause,
    onResume,
    onCancel,
    onRetry,
    onPauseAll,
    onResumeAll,
    onClearCompleted,
    isLoading
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

    if (isLoading) {
        return <TransferCardSkeleton count={2} />;
    }

    if (transfers.length === 0) {
        return (
            <motion.div
                variants={fadeUpVariants}
                initial="hidden"
                animate="visible"
            >
                <Card className="p-8 rounded-xl border border-border bg-card text-center">
                    <motion.div
                        animate={{ y: [-5, 5, -5] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <ArrowUpDown className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    </motion.div>
                    <p className="text-muted-foreground">No transfers yet</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                        Select files and a recipient to start transferring
                    </p>
                </Card>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="space-y-4"
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Stats Bar with Animation */}
            <AnimatePresence>
                {hasActiveTransfers && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                        <Card className="p-4 rounded-xl border border-border bg-card">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <p className="text-sm text-muted-foreground">Active</p>
                                        <p className="font-semibold">
                                            {activeTransfers.length} transfer{activeTransfers.length !== 1 ? 's' : ''}
                                        </p>
                                    </motion.div>
                                    <Separator orientation="vertical" className="h-8" />
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <p className="text-sm text-muted-foreground">Total Size</p>
                                        <p className="font-semibold">{formatFileSize(totalActiveSize)}</p>
                                    </motion.div>
                                    <Separator orientation="vertical" className="h-8" />
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        <p className="text-sm text-muted-foreground">Speed</p>
                                        <motion.p
                                            className="font-semibold"
                                            animate={{ opacity: [0.7, 1, 0.7] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        >
                                            {formatFileSize(totalSpeed)}/s
                                        </motion.p>
                                    </motion.div>
                                </div>
                                <motion.div
                                    className="flex items-center gap-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    {onPauseAll && (
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="outline" size="sm" onClick={onPauseAll}>
                                                <Pause className="w-4 h-4 mr-2" />
                                                Pause All
                                            </Button>
                                        </motion.div>
                                    )}
                                    {onResumeAll && (
                                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                            <Button variant="outline" size="sm" onClick={onResumeAll}>
                                                <Play className="w-4 h-4 mr-2" />
                                                Resume All
                                            </Button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            </div>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Active Transfers */}
            <AnimatePresence>
                {hasActiveTransfers && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <h3 className="font-semibold mb-3">Active Transfers</h3>
                        <ScrollArea className="max-h-[400px]">
                            <motion.div
                                className="space-y-2"
                                variants={staggerContainerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <AnimatePresence mode="popLayout">
                                    {activeTransfers.map((transfer) => (
                                        <TransferCardAnimated
                                            key={transfer.id}
                                            transfer={transfer}
                                            {...(onPause ? { onPause } : {})}
                                            {...(onResume ? { onResume } : {})}
                                            {...(onCancel ? { onCancel } : {})}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Completed Transfers */}
            <AnimatePresence>
                {hasCompletedTransfers && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Completed</h3>
                            {onClearCompleted && (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="ghost" size="sm" onClick={onClearCompleted}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                        <ScrollArea className="max-h-[300px]">
                            <motion.div
                                className="space-y-2"
                                variants={staggerContainerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                <AnimatePresence mode="popLayout">
                                    {completedTransfers.map((transfer) => (
                                        <TransferCardAnimated
                                            key={transfer.id}
                                            transfer={transfer}
                                            {...(onRetry ? { onRetry } : {})}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        </ScrollArea>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

export default TransferQueueAnimated;
