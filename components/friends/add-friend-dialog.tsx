'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { UserPlus, Copy, Check, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    getMyFriendCode,
    formatFriendCode,
    parseFriendCode,
    findFriendByCode,
    addFriend,
    isValidFriendCode,
    Friend,
} from '@/lib/storage/friends';

interface AddFriendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFriendAdded?: (friend: Friend) => void;
}

export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
    const [friendCode, setFriendCode] = useState('');
    const [friendName, setFriendName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);

    const myCode = getMyFriendCode();
    const formattedCode = formatFriendCode(myCode);

    const handleCopyCode = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(formattedCode);
            setCopied(true);
            toast.success('Friend code copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback for insecure contexts or permission denied
            toast.error('Failed to copy - try selecting the code manually');
        }
    }, [formattedCode]);

    const handleAddFriend = useCallback(async () => {
        if (!friendCode.trim()) {
            toast.error('Please enter a friend code');
            return;
        }

        // Validate code format before attempting to parse
        const rawCode = friendCode.replace(/-/g, '').toUpperCase().trim();
        if (!isValidFriendCode(rawCode)) {
            toast.error('Invalid friend code format (must be 8 alphanumeric characters)');
            return;
        }

        if (rawCode === myCode) {
            toast.error("You can't add yourself as a friend!");
            return;
        }

        // Check if already a friend
        const existing = findFriendByCode(rawCode);
        if (existing) {
            toast.error('This person is already in your friends list');
            return;
        }

        setIsAdding(true);

        try {
            // Add friend with the provided name
            const friend = addFriend({
                name: friendName.trim() || `Friend ${rawCode.slice(0, 4)}`,
                friendCode: rawCode,
                requirePasscode: false,
                trustLevel: 'trusted',
            });

            toast.success(`Added ${friend.name} as a friend!`);
            onFriendAdded?.(friend);
            setFriendCode('');
            setFriendName('');
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to add friend';
            toast.error(msg);
        } finally {
            setIsAdding(false);
        }
    }, [friendCode, friendName, myCode, onFriendAdded, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Add a Friend
                    </DialogTitle>
                    <DialogDescription>
                        Share your friend code or enter someone else's code to connect
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Your Friend Code */}
                    <div className="space-y-3">
                        <Label className="text-muted-foreground text-sm">Your Friend Code</Label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 rounded-lg bg-primary/10 border border-primary/20">
                                <code className="text-xl font-mono font-bold text-primary tracking-widest">
                                    {formattedCode}
                                </code>
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleCopyCode}
                                className="h-12 w-12"
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Copy className="w-5 h-5" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Share this code with friends so they can add you
                        </p>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">or add someone</span>
                        </div>
                    </div>

                    {/* Add Friend Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="friend-code">Friend's Code</Label>
                            <Input
                                id="friend-code"
                                placeholder="XXXX-XXXX"
                                value={friendCode}
                                onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                                maxLength={9}
                                className="font-mono text-lg tracking-widest"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="friend-name">Nickname (optional)</Label>
                            <Input
                                id="friend-name"
                                placeholder="Enter a name for this friend"
                                value={friendName}
                                onChange={(e) => setFriendName(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddFriend}
                        disabled={!friendCode.trim() || isAdding}
                    >
                        {isAdding ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Add Friend
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddFriendDialog;
