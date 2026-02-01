'use client';

import { Badge } from '@/components/ui/badge';
import { Lock, Clock, Download, FileSignature, Shield, CheckCircle2 } from 'lucide-react';
import { TransferMetadata, formatTimeRemaining } from '@/lib/transfer/transfer-metadata';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PQCStatusBadge } from '@/components/ui/pqc-status-badge';

interface TransferStatusBadgesProps {
  metadata: TransferMetadata;
  compact?: boolean;
  isPQCProtected?: boolean;
}

export function TransferStatusBadges({ metadata, compact = false, isPQCProtected = false }: TransferStatusBadgesProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1.5">
        {/* PQC Protection Status */}
        <PQCStatusBadge isProtected={isPQCProtected} compact={compact} />

        {/* Password Protected */}
        {metadata.hasPassword && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1">
                <Lock className="w-3 h-3" />
                {!compact && 'Protected'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Password protected</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Digitally Signed */}
        {metadata.isSigned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                <FileSignature className="w-3 h-3" />
                {!compact && 'Signed'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Digitally signed for authenticity</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* One-Time Transfer */}
        {metadata.oneTimeTransfer && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                <Download className="w-3 h-3" />
                {!compact && 'One-Time'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-deletes after first download</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Expiration */}
        {metadata.expiresAt && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
                <Clock className="w-3 h-3" />
                {!compact && formatTimeRemaining(metadata.expiresAt)}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Expires {new Date(metadata.expiresAt).toLocaleString()}</p>
            </TooltipContent>
          </Tooltip>
        )}

        {/* Download Count */}
        {metadata.downloadCount !== undefined && metadata.downloadCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="gap-1">
                <Download className="w-3 h-3" />
                {metadata.downloadCount}x
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Downloaded {metadata.downloadCount} time(s)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

interface SignatureVerificationBadgeProps {
  verified: boolean;
  publicKeyFingerprint?: string;
}

export function SignatureVerificationBadge({
  verified,
  publicKeyFingerprint,
}: SignatureVerificationBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {verified ? (
            <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <Shield className="w-3 h-3" />
              Unverified
            </Badge>
          )}
        </TooltipTrigger>
        <TooltipContent>
          {verified ? (
            <div>
              <p className="font-medium">Signature Verified</p>
              {publicKeyFingerprint && (
                <p className="text-xs text-muted-foreground font-mono mt-1">
                  {publicKeyFingerprint}
                </p>
              )}
            </div>
          ) : (
            <p>Signature verification failed</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default TransferStatusBadges;
