'use client';

/**
 * PQC Status Badge Component
 *
 * Reusable badge to display Post-Quantum Cryptography (PQC) protection status
 * across all transfer features in Tallow.
 */

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface PQCStatusBadgeProps {
  /** Whether PQC encryption is active */
  isProtected: boolean;
  /** Optional custom label text */
  label?: string;
  /** Show compact version (icon only) */
  compact?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Algorithm details (default: ML-KEM-768 + X25519) */
  algorithm?: string;
  /** Show warning style for non-PQC connections */
  showWarning?: boolean;
}

export function PQCStatusBadge({
  isProtected,
  label,
  compact = false,
  className,
  algorithm = 'ML-KEM-768 + X25519',
  showWarning = false,
}: PQCStatusBadgeProps) {
  const displayLabel = label || (isProtected ? 'Quantum-Resistant' : 'Not Protected');

  if (!isProtected && showWarning) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="destructive"
              className={cn('gap-1', className)}
            >
              <AlertTriangle className="w-3 h-3" />
              {!compact && 'No PQC Protection'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">Connection not quantum-resistant</p>
              <p className="text-xs text-muted-foreground">
                Establish PQC connection for quantum-safe encryption
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (!isProtected) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="secondary"
              className={cn('gap-1', className)}
            >
              <Shield className="w-3 h-3" />
              {!compact && 'Standard Encryption'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Using standard encryption (not quantum-resistant)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="default"
            className={cn(
              'gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800',
              className
            )}
          >
            <ShieldCheck className="w-3 h-3" />
            {!compact && displayLabel}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Post-Quantum Cryptography Protected</p>
            <p className="text-xs text-muted-foreground">
              Algorithm: {algorithm}
            </p>
            <p className="text-xs text-muted-foreground">
              Secure against quantum computer attacks
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * PQC Algorithm Badge - Shows the specific algorithm being used
 */
export interface PQCAlgorithmBadgeProps {
  algorithm?: 'ML-KEM-768' | 'ML-DSA-65' | 'SLH-DSA' | 'Hybrid';
  compact?: boolean;
  className?: string;
}

export function PQCAlgorithmBadge({
  algorithm = 'ML-KEM-768',
  compact = false,
  className,
}: PQCAlgorithmBadgeProps) {
  const algorithmInfo: Record<string, { label: string; description: string }> = {
    'ML-KEM-768': {
      label: 'ML-KEM-768',
      description: 'NIST-standardized post-quantum key encapsulation (formerly Kyber-768)',
    },
    'ML-DSA-65': {
      label: 'ML-DSA-65',
      description: 'NIST-standardized post-quantum digital signature (formerly Dilithium3)',
    },
    'SLH-DSA': {
      label: 'SLH-DSA',
      description: 'NIST-standardized hash-based signature scheme (formerly SPHINCS+)',
    },
    'Hybrid': {
      label: 'Hybrid KEM',
      description: 'ML-KEM-768 + X25519 hybrid key exchange for maximum security',
    },
  };

  const info = algorithmInfo[algorithm] ?? algorithmInfo['ML-KEM-768'] ?? {
    label: 'PQC',
    description: 'Post-quantum cryptography enabled',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              'gap-1 bg-[#fefefc]/10 text-[#fefefc] dark:bg-[#fefefc]/10 dark:text-[#fefefc] font-mono text-[10px]',
              className
            )}
          >
            <Shield className="w-3 h-3" />
            {!compact && info.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1 max-w-xs">
            <p className="font-medium">{info.label}</p>
            <p className="text-xs text-muted-foreground">{info.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * PQC Feature Badge Group - Shows multiple PQC features at once
 */
export interface PQCFeatureBadgeGroupProps {
  features: {
    keyExchange?: boolean;
    signatures?: boolean;
    encryption?: boolean;
    forwardSecrecy?: boolean;
  };
  compact?: boolean;
  className?: string;
}

export function PQCFeatureBadgeGroup({
  features,
  compact = false,
  className,
}: PQCFeatureBadgeGroupProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {features.keyExchange && (
        <PQCAlgorithmBadge algorithm="Hybrid" compact={compact} />
      )}
      {features.signatures && (
        <PQCAlgorithmBadge algorithm="ML-DSA-65" compact={compact} />
      )}
      {features.encryption && (
        <Badge variant="secondary" className="gap-1 text-[10px]">
          <Shield className="w-3 h-3" />
          {!compact && 'AES-256-GCM'}
        </Badge>
      )}
      {features.forwardSecrecy && (
        <Badge variant="secondary" className="gap-1 text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
          <ShieldCheck className="w-3 h-3" />
          {!compact && 'Forward Secrecy'}
        </Badge>
      )}
    </div>
  );
}
