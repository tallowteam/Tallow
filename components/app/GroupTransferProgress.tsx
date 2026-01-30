'use client';

/**
 * Enhanced Group Transfer Progress Component
 * Displays real-time progress for multi-recipient file transfers
 *
 * Features:
 * - Real-time speed graphs with visual indicators
 * - Animated progress bars with shimmer effects
 * - Recipient avatars with status badges
 * - Smooth scrolling for many recipients
 * - Mobile-optimized with swipe gestures
 * - Live statistics and ETA calculations
 */

import { useMemo, useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Zap,
  FileText,
  TrendingUp,
  Activity,
  Monitor,
  Smartphone,
  Laptop,
} from 'lucide-react';
import { GroupTransferState } from '@/lib/transfer/group-transfer-manager';
import { formatFileSize } from '@/lib/hooks/use-file-transfer';
import {
  staggerContainerVariants,
  listItemVariants,
  shimmerVariants,
} from '@/lib/animations/motion-config';
import { PQCStatusBadge, PQCAlgorithmBadge } from '@/components/ui/pqc-status-badge';

interface GroupTransferProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupState: GroupTransferState;
  onRecipientNameLookup?: (recipientId: string) => string;
  isPQCProtected?: boolean;
}

/**
 * Format speed in human-readable format
 */
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) {return '0 B/s';}
  if (bytesPerSecond < 1024) {return `${bytesPerSecond.toFixed(0)} B/s`;}
  if (bytesPerSecond < 1024 * 1024) {return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;}
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * Format time in human-readable format
 */
function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds < 60) {return `${seconds}s`;}
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {return `${minutes}m ${remainingSeconds}s`;}
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate ETA based on progress and speed
 */
function calculateETA(fileSize: number, progress: number, speed: number): string {
  if (speed === 0 || progress >= 100) {return 'N/A';}
  const remainingBytes = fileSize - (fileSize * progress) / 100;
  const remainingSeconds = remainingBytes / speed;
  return formatTime(remainingSeconds * 1000);
}

/**
 * Get device icon based on platform
 */
function getDeviceIcon(platform: string) {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('android') || platformLower.includes('ios')) {
    return Smartphone;
  }
  if (platformLower.includes('windows') || platformLower.includes('mac') || platformLower.includes('linux')) {
    return Laptop;
  }
  return Monitor;
}

/**
 * Get avatar color based on recipient ID
 */
function getAvatarColor(recipientId: string): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-teal-500',
  ];
  const hash = recipientId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length] || 'bg-blue-500';
}

/**
 * Speed Graph Component - Mini visualization of transfer speed
 */
function SpeedGraph({ speed, maxSpeed }: { speed: number; maxSpeed: number }) {
  const percentage = maxSpeed > 0 ? Math.min((speed / maxSpeed) * 100, 100) : 0;
  const bars = 12;
  const activeBars = Math.ceil((percentage / 100) * bars);

  return (
    <div className="flex items-end gap-0.5 h-8">
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${
            i < activeBars ? 'bg-primary' : 'bg-muted'
          }`}
          initial={{ height: 0 }}
          animate={{
            height: i < activeBars ? `${((i + 1) / bars) * 100}%` : '20%',
            opacity: i < activeBars ? 1 : 0.3,
          }}
          transition={{ delay: i * 0.02, duration: 0.3 }}
        />
      ))}
    </div>
  );
}

export const GroupTransferProgress = memo(function GroupTransferProgress({
  open,
  onOpenChange,
  groupState,
  onRecipientNameLookup,
  isPQCProtected = true,
}: GroupTransferProgressProps) {
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);

  // Track speed history for graph
  useEffect(() => {
    if (!open) {return;}

    const interval = setInterval(() => {
      const totalSpeed = groupState.recipients.reduce(
        (sum, r) => sum + (r.speed || 0),
        0
      );
      setSpeedHistory((prev) => [...prev.slice(-19), totalSpeed]); // Keep last 20 samples
    }, 500);

    return () => clearInterval(interval);
  }, [open, groupState.recipients]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalSpeed = groupState.recipients.reduce(
      (sum, r) => sum + (r.speed || 0),
      0
    );
    const avgSpeed = totalSpeed / Math.max(groupState.recipients.length, 1);
    const maxSpeed = Math.max(...speedHistory, totalSpeed);
    const elapsedTime =
      groupState.recipients[0]?.startTime
        ? Date.now() - groupState.recipients[0].startTime
        : 0;

    // Calculate overall ETA
    const avgProgress = groupState.totalProgress;
    const eta = calculateETA(groupState.fileSize, avgProgress, totalSpeed);

    return {
      totalSpeed,
      avgSpeed,
      maxSpeed,
      elapsedTime,
      eta,
    };
  }, [groupState, speedHistory]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        aria-describedby="group-transfer-progress-description"
        data-testid="group-progress-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" aria-hidden="true" />
            Group Transfer in Progress
          </DialogTitle>
          <DialogDescription id="group-transfer-progress-description" className="flex items-center gap-2 flex-wrap">
            <span>Sending {groupState.fileName} to {groupState.recipients.length} recipients</span>
            <PQCStatusBadge isProtected={isPQCProtected} compact />
          </DialogDescription>
        </DialogHeader>

        <motion.div
          className="flex-1 flex flex-col gap-4 overflow-hidden"
          variants={staggerContainerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Overall progress card */}
          <motion.div variants={listItemVariants}>
            <Card className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium truncate max-w-[300px]">{groupState.fileName}</span>
                    <Badge variant="outline">
                      {formatFileSize(groupState.fileSize)}
                    </Badge>
                    <PQCAlgorithmBadge algorithm="Hybrid" compact />
                  </div>
                  <div className="text-sm text-muted-foreground" data-testid="overall-progress">
                    {groupState.totalProgress.toFixed(0)}% complete
                  </div>
                </div>

                {/* Animated progress bar */}
                <div className="relative">
                  <Progress value={groupState.totalProgress} className="h-2" />
                  {groupState.status === 'transferring' && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                      variants={shimmerVariants}
                      initial="initial"
                      animate="animate"
                    />
                  )}
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {groupState.successCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </motion.div>
                  <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {groupState.pendingCount}
                    </div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </motion.div>
                  <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {groupState.failureCount}
                    </div>
                    <div className="text-xs text-muted-foreground">Failed</div>
                  </motion.div>
                  <motion.div className="text-center" whileHover={{ scale: 1.05 }}>
                    <div className="text-2xl font-bold flex items-center justify-center gap-1">
                      <Activity className="w-4 h-4" aria-hidden="true" />
                      <span>{formatSpeed(stats.totalSpeed)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Total Speed</div>
                  </motion.div>
                </div>

                {/* Speed Graph */}
                {stats.totalSpeed > 0 && (
                  <motion.div
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <SpeedGraph speed={stats.totalSpeed} maxSpeed={stats.maxSpeed} />
                    <div className="flex-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        <span>Peak: {formatSpeed(stats.maxSpeed)}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Recipient list */}
          <div className="flex-1 overflow-hidden">
            <h3 className="text-sm font-medium mb-2 px-1">
              Recipients ({groupState.recipients.length})
            </h3>
            <ScrollArea className="h-full">
              <motion.div
                className="space-y-2 pr-4"
                variants={staggerContainerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="popLayout">
                  {groupState.recipients.map((recipient) => {
                    const recipientName =
                      onRecipientNameLookup?.(recipient.id) || recipient.name;
                    const eta = calculateETA(
                      groupState.fileSize,
                      recipient.progress,
                      recipient.speed || 0
                    );
                    const avatarColor = getAvatarColor(recipient.id);
                    const DeviceIcon = getDeviceIcon(recipient.deviceId);

                    return (
                      <motion.div
                        key={recipient.id}
                        variants={listItemVariants}
                        layout
                        data-testid="recipient-progress-item"
                      >
                        <Card
                          className={`p-4 transition-all ${
                            recipient.status === 'completed'
                              ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20'
                              : recipient.status === 'failed'
                              ? 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
                              : 'hover:border-primary/30'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                {/* Avatar */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${avatarColor} flex items-center justify-center relative`}>
                                  <DeviceIcon className="w-5 h-5 text-white" aria-hidden="true" />
                                  {/* Status badge */}
                                  <motion.div
                                    className="absolute -top-1 -right-1"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                  >
                                    {recipient.status === 'completed' ? (
                                      <CheckCircle2 className="w-4 h-4 text-green-600 bg-background rounded-full" aria-hidden="true" />
                                    ) : recipient.status === 'failed' ? (
                                      <XCircle className="w-4 h-4 text-red-600 bg-background rounded-full" aria-hidden="true" />
                                    ) : recipient.status === 'transferring' ? (
                                      <Loader2 className="w-4 h-4 text-blue-600 bg-background rounded-full animate-spin" aria-hidden="true" />
                                    ) : null}
                                  </motion.div>
                                </div>

                                {/* Recipient name */}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">
                                    {recipientName}
                                  </h4>
                                  <div className="text-xs text-muted-foreground">
                                    {recipient.progress.toFixed(0)}%
                                  </div>
                                </div>
                              </div>

                              {/* Status badge */}
                              <Badge
                                variant={
                                  recipient.status === 'completed'
                                    ? 'default'
                                    : recipient.status === 'failed'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                                className="flex-shrink-0 min-w-[80px] justify-center"
                              >
                                {recipient.status === 'completed'
                                  ? 'Complete'
                                  : recipient.status === 'failed'
                                  ? 'Failed'
                                  : recipient.status === 'transferring'
                                  ? 'Sending'
                                  : recipient.status === 'negotiating'
                                  ? 'Connecting'
                                  : 'Pending'}
                              </Badge>
                            </div>

                            {/* Progress bar (only for active transfers) */}
                            {recipient.status !== 'completed' &&
                              recipient.status !== 'failed' && (
                                <motion.div
                                  className="space-y-1"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <div className="relative">
                                    <Progress value={recipient.progress} className="h-1.5" />
                                    {recipient.status === 'transferring' && (
                                      <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
                                        animate={{
                                          x: ['-100%', '100%'],
                                        }}
                                        transition={{
                                          duration: 1.5,
                                          repeat: Infinity,
                                          ease: 'linear',
                                        }}
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      {recipient.speed && recipient.speed > 0 ? (
                                        <>
                                          <span className="flex items-center gap-1">
                                            <Zap className="w-3 h-3" aria-hidden="true" />
                                            {formatSpeed(recipient.speed)}
                                          </span>
                                          <span>•</span>
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" aria-hidden="true" />
                                            {eta}
                                          </span>
                                        </>
                                      ) : (
                                        <span>Initializing...</span>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}

                            {/* Error message */}
                            {recipient.status === 'failed' && recipient.error && (
                              <motion.div
                                className="text-xs text-red-600 dark:text-red-400 flex items-start gap-2"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                              >
                                <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{recipient.error?.message || String(recipient.error)}</span>
                              </motion.div>
                            )}

                            {/* Completion time */}
                            {recipient.status === 'completed' &&
                              recipient.startTime &&
                              recipient.endTime && (
                                <motion.div
                                  className="text-xs text-green-600 dark:text-green-400 flex items-center gap-2"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>
                                    Completed in{' '}
                                    {formatTime(recipient.endTime - recipient.startTime)}
                                  </span>
                                </motion.div>
                              )}
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </ScrollArea>
          </div>

          {/* Overall stats footer */}
          <motion.div variants={listItemVariants}>
            <Card className="p-3">
              <div className="flex items-center justify-between text-sm flex-wrap gap-2">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    {formatTime(stats.elapsedTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" aria-hidden="true" />
                    Avg: {formatSpeed(stats.avgSpeed)}
                  </span>
                  {stats.totalSpeed > 0 && (
                    <span className="flex items-center gap-1">
                      <Activity className="w-4 h-4" aria-hidden="true" />
                      ETA: {stats.eta}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  {groupState.status === 'completed'
                    ? 'All transfers completed'
                    : groupState.status === 'partial'
                    ? 'Some transfers failed'
                    : groupState.status === 'failed'
                    ? 'All transfers failed'
                    : 'Transfer in progress...'}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
});

GroupTransferProgress.displayName = 'GroupTransferProgress';
