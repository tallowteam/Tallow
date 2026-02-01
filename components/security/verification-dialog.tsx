'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldX, Copy, Check } from 'lucide-react';
import { VerificationSession, formatSASWithEmoji } from '@/lib/crypto/peer-authentication';
import { secureLog } from '@/lib/utils/secure-logger';

export interface VerificationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    session: VerificationSession | null;
    peerName: string;
    onVerified: () => void;
    onFailed: () => void;
    onSkipped: () => void;
    isPreviouslyVerified?: boolean;
}

export function VerificationDialog({
    open,
    onOpenChange,
    session,
    peerName,
    onVerified,
    onFailed,
    onSkipped,
    isPreviouslyVerified = false,
}: VerificationDialogProps) {
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

    const handleCopy = async () => {
        if (!session?.sas) {return;}

        try {
            await navigator.clipboard.writeText(session.sas.phrase);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            secureLog.error('Failed to copy:', error);
        }
    };

    if (!session) {return null;}

    return (
        <Dialog open={open} onOpenChange={isPreviouslyVerified ? onOpenChange : () => {}}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-lg sm:text-xl text-[#191610] dark:text-[#fefefc]">
                        <div className="p-2 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#b2987d]" aria-hidden="true" />
                        </div>
                        <span>Verify Connection</span>
                    </DialogTitle>
                    <DialogDescription>
                        Confirm you&apos;re connected to <strong className="text-[#191610] dark:text-[#fefefc]">{peerName}</strong> by verifying the code matches on both devices.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6 py-4">
                    {/* Verification Code Display */}
                    <div className="text-center">
                        <p className="text-sm sm:text-base text-[#b2987d] mb-3">
                            Your verification code:
                        </p>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl
                                bg-gradient-to-br from-[#b2987d]/5 to-[#b2987d]/10
                                dark:from-[#b2987d]/10 dark:to-[#b2987d]/15
                                border border-[#e5dac7] dark:border-[#544a36]
                                cursor-pointer hover:border-[#b2987d]/40
                                transition-all duration-300 min-h-[56px]
                                focus-visible:ring-2 focus-visible:ring-[#b2987d]/50 focus-visible:ring-offset-2 focus-visible:outline-none"
                            onClick={handleCopy}
                            aria-label={copied ? 'Verification code copied' : 'Copy verification code'}
                        >
                            <code className="text-xl sm:text-2xl font-bold tracking-wider text-[#191610] dark:text-[#fefefc] break-all">
                                {session.sas.phrase}
                            </code>
                            {copied ? (
                                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" aria-hidden="true" />
                            ) : (
                                <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-[#b2987d] shrink-0" aria-hidden="true" />
                            )}
                        </button>
                    </div>

                    {/* Emoji version for easier visual comparison */}
                    <div className="text-center">
                        <p className="text-base sm:text-lg leading-relaxed">
                            {formatSASWithEmoji(session.sas)}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="rounded-xl p-4 text-sm text-[#b2987d] space-y-2
                        bg-gradient-to-br from-[#b2987d]/5 to-transparent
                        border border-[#e5dac7] dark:border-[#544a36]">
                        <p className="flex items-start gap-2">
                            <span className="text-[#191610] dark:text-[#fefefc] font-medium">1.</span>
                            Ask <strong className="text-[#191610] dark:text-[#fefefc]">{peerName}</strong> to read their code
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-[#191610] dark:text-[#fefefc] font-medium">2.</span>
                            If both codes match, tap <strong className="text-[#191610] dark:text-[#fefefc]">Verified</strong>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-[#191610] dark:text-[#fefefc] font-medium">3.</span>
                            If codes don&apos;t match, tap <strong className="text-[#191610] dark:text-[#fefefc]">Codes Don&apos;t Match</strong>
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
                    {isPreviouslyVerified && (
                        <Button
                            variant="ghost"
                            onClick={() => startTransition(() => onSkipped())}
                            disabled={isPending}
                            className="text-muted-foreground w-full sm:w-auto min-h-[48px]"
                            aria-label="Skip verification for now"
                        >
                            Skip for now
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={() => startTransition(() => onFailed())}
                        disabled={isPending}
                        className="border-destructive text-destructive hover:bg-destructive/10 w-full sm:w-auto min-h-[48px]"
                        aria-label="Report that verification codes do not match"
                    >
                        <ShieldX className="w-4 h-4 mr-2" aria-hidden="true" />
                        {isPending ? 'Processing...' : "Codes Don't Match"}
                    </Button>
                    <Button
                        onClick={() => startTransition(() => onVerified())}
                        disabled={isPending}
                        className="bg-accent hover:bg-accent/90 w-full sm:w-auto min-h-[48px]"
                        aria-label="Confirm verification codes match"
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" aria-hidden="true" />
                        {isPending ? 'Processing...' : 'Verified'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Compact badge to show verification status
interface VerificationBadgeProps {
    status: 'verified' | 'unverified' | 'failed';
    onClick?: () => void;
}

export function VerificationBadge({ status, onClick }: VerificationBadgeProps) {
    const config = {
        verified: {
            icon: ShieldCheck,
            text: 'Verified',
            className: 'bg-accent/10 text-accent border-accent/30',
            ariaLabel: 'Connection verified. Click to verify again.',
        },
        unverified: {
            icon: Shield,
            text: 'Unverified',
            className: 'bg-muted text-muted-foreground border-border',
            ariaLabel: 'Connection not verified. Click to verify.',
        },
        failed: {
            icon: ShieldX,
            text: 'Failed',
            className: 'bg-destructive/10 text-destructive border-destructive/30',
            ariaLabel: 'Verification failed. Click to try again.',
        },
    };

    const { icon: Icon, text, className, ariaLabel } = config[status];

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80 min-h-[32px] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${className}`}
        >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {text}
        </button>
    );
}

export default VerificationDialog;
