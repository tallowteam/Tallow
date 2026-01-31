'use client';

import { useState, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
    Clock
} from 'lucide-react';
import { Transfer } from '@/lib/types';
import { fadeUpVariants } from '@/lib/animations/motion-config';

export interface TransferCardAnimatedProps {
    transfer: Transfer;
    onPause?: (id: string) => void;
    onResume?: (id: string) => void;
    onCancel?: (id: string) => void;
    onRetry?: (id: string) => void;
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

/**
 * Custom comparison function for TransferCardAnimated
 * Only re-render when transfer data or callbacks change
 */
function arePropsEqual(
    prevProps: TransferCardAnimatedProps,
    nextProps: TransferCardAnimatedProps
): boolean {
    const prevTransfer = prevProps.transfer;
    const nextTransfer = nextProps.transfer;

    // Compare transfer properties that affect rendering
    return (
        prevTransfer.id === nextTransfer.id &&
        prevTransfer.status === nextTransfer.status &&
        prevTransfer.progress === nextTransfer.progress &&
        prevTransfer.speed === nextTransfer.speed &&
        prevTransfer.transferredSize === nextTransfer.transferredSize &&
        prevTransfer.totalSize === nextTransfer.totalSize &&
        prevTransfer.eta === nextTransfer.eta &&
        prevTransfer.error === nextTransfer.error &&
        prevProps.onPause === nextProps.onPause &&
        prevProps.onResume === nextProps.onResume &&
        prevProps.onCancel === nextProps.onCancel &&
        prevProps.onRetry === nextProps.onRetry
    );
}

/**
 * TransferCardAnimated Component - Memoized for React 18/19 performance optimization
 * Prevents unnecessary re-renders when parent list updates but this item hasn't changed
 * Uses custom comparison function for granular control over re-renders
 */
export const TransferCardAnimated = memo(function TransferCardAnimated({
    transfer,
    onPause,
    onResume,
    onCancel,
    onRetry
}: TransferCardAnimatedProps) {
    const [isHovered, setIsHovered] = useState(false);

    const isActive = ['transferring', 'connecting', 'pending'].includes(transfer.status);
    const isPaused = transfer.status === 'paused';
    const isComplete = transfer.status === 'completed';
    const isFailed = transfer.status === 'failed';

    const PeerIcon = getPlatformIcon(transfer.direction === 'send' ? transfer.to.platform : transfer.from.platform);
    const peer = transfer.direction === 'send' ? transfer.to : transfer.from;

    // Memoize callbacks to prevent unnecessary re-renders of child buttons
    const handlePause = useCallback(() => onPause?.(transfer.id), [onPause, transfer.id]);
    const handleResume = useCallback(() => onResume?.(transfer.id), [onResume, transfer.id]);
    const handleCancel = useCallback(() => onCancel?.(transfer.id), [onCancel, transfer.id]);
    const handleRetry = useCallback(() => onRetry?.(transfer.id), [onRetry, transfer.id]);
    const handleHoverStart = useCallback(() => setIsHovered(true), []);
    const handleHoverEnd = useCallback(() => setIsHovered(false), []);

    return (
        <motion.div
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
            onHoverStart={handleHoverStart}
            onHoverEnd={handleHoverEnd}
        >
            <Card className="p-4 rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
                <div className="flex items-start gap-4">
                    {/* Direction Icon with Animation */}
                    <motion.div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            transfer.direction === 'send' ? 'bg-primary/20' : 'bg-accent/20'
                        }`}
                        animate={isActive ? {
                            scale: [1, 1.05, 1],
                        } : {}}
                        transition={{
                            duration: 2,
                            repeat: isActive ? Infinity : 0,
                            ease: 'easeInOut',
                        }}
                    >
                        {transfer.direction === 'send' ? (
                            <motion.div
                                animate={isActive ? { y: [-2, 2, -2] } : {}}
                                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                            >
                                <ArrowUp className="w-6 h-6 text-primary" />
                            </motion.div>
                        ) : (
                            <motion.div
                                animate={isActive ? { y: [2, -2, 2] } : {}}
                                transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                            >
                                <ArrowDown className="w-6 h-6 text-accent" />
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Transfer Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold truncate">
                                {transfer.files.length === 1 && transfer.files[0]
                                    ? transfer.files[0].name
                                    : `${transfer.files.length} files`}
                            </h4>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={transfer.status}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                >
                                    <Badge className={getStatusColor(transfer.status)}>
                                        {transfer.status}
                                    </Badge>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <PeerIcon className="w-4 h-4" />
                            <span>{peer.name}</span>
                            <span>•</span>
                            <span>{formatFileSize(transfer.totalSize)}</span>
                        </div>

                        {/* Progress Bar with Animation */}
                        {(isActive || isPaused) && (
                            <motion.div
                                className="space-y-1"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="relative">
                                    <Progress value={transfer.progress} className="h-2" />
                                    {isActive && (
                                        <motion.div
                                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                            animate={{
                                                x: ['-100%', '100%'],
                                            }}
                                            transition={{
                                                duration: 1.5,
                                                repeat: Infinity,
                                                ease: 'linear',
                                            }}
                                            style={{ borderRadius: 'inherit' }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>
                                        {formatFileSize(transfer.transferredSize)} / {formatFileSize(transfer.totalSize)}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <AnimatePresence mode="wait">
                                            {transfer.status === 'transferring' && (
                                                <motion.div
                                                    key="speed"
                                                    className="flex items-center gap-2"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                >
                                                    <span>{formatSpeed(transfer.speed)}</span>
                                                    {transfer.eta && (
                                                        <>
                                                            <span>•</span>
                                                            <Clock className="w-3 h-3" />
                                                            <span>{formatTime(transfer.eta)}</span>
                                                        </>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Status Messages with Animation */}
                        <AnimatePresence mode="wait">
                            {isComplete && (
                                <motion.div
                                    key="complete"
                                    className="flex items-center gap-2 text-sm text-green-500"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Transfer complete</span>
                                </motion.div>
                            )}

                            {isFailed && (
                                <motion.div
                                    key="failed"
                                    className="flex items-center gap-2 text-sm text-destructive"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{transfer.error?.message || String(transfer.error) || 'Transfer failed'}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Actions with Hover Animation */}
                    <motion.div
                        className="flex items-center gap-1 shrink-0"
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: isHovered ? 1 : 0.7 }}
                    >
                        <AnimatePresence mode="wait">
                            {isActive && !isPaused && onPause && (
                                <motion.div
                                    key="pause"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button variant="ghost" size="icon" onClick={handlePause}>
                                        <Pause className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}
                            {isPaused && onResume && (
                                <motion.div
                                    key="resume"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button variant="ghost" size="icon" onClick={handleResume}>
                                        <Play className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}
                            {(isActive || isPaused) && onCancel && (
                                <motion.div
                                    key="cancel"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <Button variant="ghost" size="icon" onClick={handleCancel}>
                                        <X className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            )}
                            {isFailed && onRetry && (
                                <motion.div
                                    key="retry"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Button variant="ghost" size="sm" onClick={handleRetry}>
                                        Retry
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </Card>
        </motion.div>
    );
}, arePropsEqual);

TransferCardAnimated.displayName = 'TransferCardAnimated';

export default TransferCardAnimated;
