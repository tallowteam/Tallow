'use client';

/**
 * Group Transfer Invite Dialog
 * Receiver-side dialog for accepting or rejecting group transfer invitations
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, FileDown, Clock, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/hooks/use-file-transfer';

interface GroupTransferInviteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    senderName: string;
    fileName: string;
    fileSize: number;
    recipientCount: number;
    onAccept: () => void;
    onReject: () => void;
}

export function GroupTransferInviteDialog({
    open,
    onOpenChange,
    groupId,
    senderName,
    fileName,
    fileSize,
    recipientCount,
    onAccept,
    onReject,
}: GroupTransferInviteDialogProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            await onAccept();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = () => {
        onReject();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl">Group Transfer Invitation</DialogTitle>
                            <DialogDescription>
                                {senderName} wants to send you a file
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* File Info */}
                    <div className="bg-secondary/50 rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                            <FileDown className="w-5 h-5 text-primary mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{fileName}</div>
                                <div className="text-sm text-muted-foreground">{formatFileSize(fileSize)}</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <Users className="w-4 h-4" />
                            <span>{recipientCount} recipient{recipientCount !== 1 ? 's' : ''} in this transfer</span>
                        </div>
                    </div>

                    {/* Info Message */}
                    <div className="flex items-start gap-3 p-3 bg-[#fefefc]/10 rounded-lg">
                        <Clock className="w-5 h-5 text-[#fefefc] mt-0.5 shrink-0" />
                        <div className="text-sm text-[#fefefc] dark:text-[#fefefc]">
                            <p className="font-medium mb-1">Group transfer in progress</p>
                            <p className="text-xs opacity-80">
                                The sender is simultaneously sending to multiple recipients.
                                Accept to start receiving the file.
                            </p>
                        </div>
                    </div>

                    {/* Security Note */}
                    <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <div className="text-sm text-amber-600 dark:text-amber-400">
                            <p className="font-medium mb-1">Security reminder</p>
                            <p className="text-xs opacity-80">
                                Only accept files from trusted sources. All transfers use end-to-end encryption.
                            </p>
                        </div>
                    </div>

                    {/* Group ID (for debugging) */}
                    <div className="text-xs text-muted-foreground text-center">
                        Group ID: {groupId.substring(0, 8)}...
                    </div>
                </div>

                <DialogFooter className="flex-row gap-2 sm:justify-between">
                    <Button
                        variant="outline"
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        Reject
                    </Button>
                    <Button
                        onClick={handleAccept}
                        disabled={isProcessing}
                        className="flex-1"
                    >
                        {isProcessing ? 'Accepting...' : 'Accept Transfer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
