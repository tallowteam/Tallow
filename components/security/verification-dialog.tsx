'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Shield, ShieldCheck, ShieldX, Copy, Check } from 'lucide-react';
import { SASResult, VerificationSession, formatSASWithEmoji } from '@/lib/crypto/peer-authentication';
import { secureLog } from '@/lib/utils/secure-logger';

interface VerificationDialogProps {
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

    const handleCopy = async () => {
        if (!session?.sas) return;

        try {
            await navigator.clipboard.writeText(session.sas.phrase);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            secureLog.error('Failed to copy:', error);
        }
    };

    if (!session) return null;

    return (
        <Dialog open={open} onOpenChange={isPreviouslyVerified ? onOpenChange : () => {}}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                        Verify Connection
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base">
                        Confirm you&apos;re connected to <strong>{peerName}</strong> by verifying the code matches on both devices.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-6 py-4">
                    {/* Verification Code Display */}
                    <div className="text-center">
                        <p className="text-sm sm:text-base text-muted-foreground mb-3">
                            Your verification code:
                        </p>
                        <div
                            className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl bg-secondary border border-border cursor-pointer hover:bg-secondary/80 active:bg-secondary/90 transition-colors min-h-[56px]"
                            onClick={handleCopy}
                        >
                            <code className="text-xl sm:text-2xl font-bold tracking-wider text-foreground break-all">
                                {session.sas.phrase}
                            </code>
                            {copied ? (
                                <Check className="w-5 h-5 sm:w-6 sm:h-6 text-accent shrink-0" />
                            ) : (
                                <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground shrink-0" />
                            )}
                        </div>
                    </div>

                    {/* Emoji version for easier visual comparison */}
                    <div className="text-center">
                        <p className="text-base sm:text-lg leading-relaxed">
                            {formatSASWithEmoji(session.sas)}
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground space-y-2">
                        <p className="flex items-start gap-2">
                            <span className="text-foreground font-medium">1.</span>
                            Ask <strong className="text-foreground">{peerName}</strong> to read their code
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-foreground font-medium">2.</span>
                            If both codes match, tap <strong className="text-foreground">Verified</strong>
                        </p>
                        <p className="flex items-start gap-2">
                            <span className="text-foreground font-medium">3.</span>
                            If codes don&apos;t match, tap <strong className="text-foreground">Codes Don&apos;t Match</strong>
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
                    {isPreviouslyVerified && (
                        <Button
                            variant="ghost"
                            onClick={onSkipped}
                            className="text-muted-foreground w-full sm:w-auto min-h-[48px]"
                        >
                            Skip for now
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={onFailed}
                        className="border-destructive text-destructive hover:bg-destructive/10 w-full sm:w-auto min-h-[48px]"
                    >
                        <ShieldX className="w-4 h-4 mr-2" />
                        Codes Don&apos;t Match
                    </Button>
                    <Button
                        onClick={onVerified}
                        className="bg-accent hover:bg-accent/90 w-full sm:w-auto min-h-[48px]"
                    >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Verified
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
        },
        unverified: {
            icon: Shield,
            text: 'Unverified',
            className: 'bg-muted text-muted-foreground border-border',
        },
        failed: {
            icon: ShieldX,
            text: 'Failed',
            className: 'bg-destructive/10 text-destructive border-destructive/30',
        },
    };

    const { icon: Icon, text, className } = config[status];

    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${className}`}
        >
            <Icon className="w-3 h-3" />
            {text}
        </button>
    );
}

export default VerificationDialog;
