'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, ArrowLeft } from 'lucide-react';
import { cn, formatBytes } from '@/lib/utils';
import {
  successIcon,
  successCheckmark,
  successRing,
  successBurst,
} from '@/lib/animations/hero';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TransferCompleteProps {
  /** Number of files transferred */
  fileCount: number;
  /** Total bytes transferred */
  totalSize: number;
  /** Callback for "Transfer More" action */
  onTransferMore?: () => void;
  /** Callback for "Download" action (for receivers) */
  onDownload?: () => void;
  /** Callback for "Share" action */
  onShare?: () => void;
  /** Whether this is the sender or receiver view */
  transferRole?: 'sender' | 'receiver';
  /** Additional className */
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFETTI PARTICLE
// ═══════════════════════════════════════════════════════════════════════════

interface ConfettiParticleProps {
  index: number;
  color: string;
}

const ConfettiParticle = ({ index, color }: ConfettiParticleProps) => {
  const angle = (index / 12) * Math.PI * 2;
  const distance = 60 + Math.random() * 40;

  return (
    <motion.div
      className="absolute h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
      initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
      animate={{
        scale: [0, 1, 0],
        opacity: [0, 1, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance - 20,
      }}
      transition={{
        duration: 0.8,
        delay: index * 0.02,
        ease: 'easeOut',
      }}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// SUCCESS ANIMATION
// ═══════════════════════════════════════════════════════════════════════════

interface SuccessAnimationProps {
  showConfetti?: boolean;
}

const SuccessAnimation = ({ showConfetti = true }: SuccessAnimationProps) => {
  const confettiColors = [
    'var(--color-primary-500)',
    'var(--color-success-500)',
    '#a78bfa', // purple-400
    '#60a5fa', // blue-400
    '#34d399', // emerald-400
  ];

  return (
    <div className="relative flex items-center justify-center">
      {/* Ring burst effect */}
      <motion.div
        className="absolute h-24 w-24 rounded-full border-2 border-[var(--color-success-500)]"
        variants={successRing}
        initial="initial"
        animate="animate"
      />

      {/* Secondary burst */}
      <motion.div
        className="absolute h-24 w-24 rounded-full bg-[var(--color-success-500)]/10"
        variants={successBurst}
        initial="initial"
        animate="animate"
      />

      {/* Main icon container */}
      <motion.div
        className={cn(
          'relative flex h-20 w-20 items-center justify-center rounded-full',
          'bg-[var(--color-success-500)]'
        )}
        variants={successIcon}
        initial="initial"
        animate="animate"
      >
        {/* Checkmark SVG */}
        <svg
          className="h-10 w-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            d="M5 12l5 5L19 7"
            variants={successCheckmark}
            initial="initial"
            animate="animate"
          />
        </svg>
      </motion.div>

      {/* Confetti particles */}
      {showConfetti && (
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: 12 }).map((_, i) => (
            <ConfettiParticle
              key={i}
              index={i}
              color={confettiColors[i % confettiColors.length]!}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const TransferComplete = React.forwardRef<HTMLDivElement, TransferCompleteProps>(
  (
    {
      fileCount,
      totalSize,
      onTransferMore,
      onDownload,
      onShare,
      transferRole = 'sender',
      className,
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'flex flex-col items-center justify-center gap-6 p-8',
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Success animation */}
        <SuccessAnimation showConfetti />

        {/* Message */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            Transfer Complete!
          </h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {transferRole === 'sender'
              ? `Successfully sent ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`
              : `Received ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`}
          </p>
          <p className="mt-1 text-xs text-[var(--text-tertiary)]">
            {formatBytes(totalSize)} transferred
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {transferRole === 'receiver' && onDownload && (
            <motion.button
              onClick={onDownload}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                'bg-[var(--color-primary-500)] text-white',
                'hover:bg-[var(--color-primary-600)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]',
                'transition-colors duration-fast'
              )}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Download Files</span>
            </motion.button>
          )}

          {onShare && (
            <motion.button
              onClick={onShare}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                'bg-[var(--bg-surface)] text-[var(--text-primary)]',
                'border border-[var(--border-default)]',
                'hover:bg-[var(--bg-hover)] hover:border-[var(--border-hover)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]',
                'transition-colors duration-fast'
              )}
              whileTap={{ scale: 0.98 }}
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Share</span>
            </motion.button>
          )}

          {onTransferMore && (
            <motion.button
              onClick={onTransferMore}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2',
                'text-[var(--text-secondary)]',
                'hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-primary)]',
                'transition-colors duration-fast'
              )}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Transfer More</span>
            </motion.button>
          )}
        </motion.div>
      </motion.div>
    );
  }
);

TransferComplete.displayName = 'TransferComplete';

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { TransferComplete, SuccessAnimation };
export type { TransferCompleteProps };
