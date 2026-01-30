'use client';

import { useState, useCallback, useTransition } from 'react';
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
import { UserPlus, Copy, Check, Loader2, Users, Sparkles, Heart } from 'lucide-react';
import { toast } from 'sonner';
import {
    getMyFriendCode,
    formatFriendCode,
    findFriendByCode,
    addFriend,
    isValidFriendCode,
    Friend,
} from '@/lib/storage/friends';

export interface AddFriendDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFriendAdded?: (friend: Friend) => void;
}

export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
    const [friendCode, setFriendCode] = useState('');
    const [friendName, setFriendName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isPending, startTransition] = useTransition();

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
            // Wrap state updates in startTransition for non-blocking UI
            startTransition(() => {
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
            });
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to add friend';
            toast.error(msg);
        } finally {
            setIsAdding(false);
        }
    }, [friendCode, friendName, myCode, onFriendAdded, onOpenChange]);

    const isCodeValid = friendCode.length > 0 && isValidFriendCode(friendCode.replace(/-/g, '').toUpperCase());

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md overflow-hidden
                    bg-white/80 dark:bg-[#0a0a0a]/90
                    backdrop-blur-xl
                    border border-gray-200/50 dark:border-white/10
                    rounded-2xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                    transition-all duration-300"
            >
                {/* Decorative gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-t-2xl" />

                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <div className="p-2.5 rounded-xl bg-violet-500/10 dark:bg-violet-500/20 relative">
                            <UserPlus className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                            <Heart className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-pink-500 fill-pink-500" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Add a Friend</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 mt-1">
                        Share your friend code or enter someone else's code to connect
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Your Friend Code Section */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-500 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Your Friend Code
                        </Label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-5 py-4 rounded-xl
                                bg-gradient-to-br from-violet-500/5 to-purple-500/10
                                dark:from-violet-500/10 dark:to-purple-500/15
                                border border-violet-500/20 dark:border-violet-500/30
                                transition-all duration-200 hover:border-violet-500/40
                                relative overflow-hidden group"
                            >
                                {/* Shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                                    -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <code className="relative text-2xl font-mono font-bold text-violet-600 dark:text-violet-400 tracking-[0.2em]">
                                    {formattedCode}
                                </code>
                            </div>
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={handleCopyCode}
                                className="h-14 w-14 rounded-xl
                                    bg-violet-500/10 hover:bg-violet-500/20
                                    dark:bg-violet-500/20 dark:hover:bg-violet-500/30
                                    border border-violet-500/20 hover:border-violet-500/40
                                    transition-all duration-200
                                    group"
                                aria-label={copied ? "Code copied" : "Copy friend code"}
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-200" aria-hidden="true" />
                                ) : (
                                    <Copy className="w-5 h-5 text-violet-600 dark:text-violet-400
                                        group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-violet-500" />
                            Share this code with friends so they can add you
                        </p>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-white/10" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs uppercase tracking-wider font-semibold
                                bg-white/80 dark:bg-[#0a0a0a]/90 text-gray-400 dark:text-gray-600">
                                or add someone
                            </span>
                        </div>
                    </div>

                    {/* Add Friend Form */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="friend-code"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Friend's Code
                            </Label>
                            <div className="relative">
                                <Input
                                    id="friend-code"
                                    placeholder="XXXX-XXXX"
                                    value={friendCode}
                                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                                    maxLength={9}
                                    className="h-12 font-mono text-lg tracking-[0.15em] text-center
                                        bg-white dark:bg-white/5
                                        border-gray-200 dark:border-white/10
                                        focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20
                                        rounded-xl transition-all duration-200
                                        placeholder:tracking-[0.2em] placeholder:text-gray-300 dark:placeholder:text-gray-600"
                                    aria-required="true"
                                    aria-invalid={friendCode.length > 0 && !isCodeValid}
                                />
                                {/* Validation indicator */}
                                {friendCode.length > 0 && (
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2
                                        w-2 h-2 rounded-full transition-colors duration-200
                                        ${isCodeValid ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="friend-name"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                            >
                                Nickname
                                <span className="text-xs font-normal text-gray-400">(optional)</span>
                            </Label>
                            <Input
                                id="friend-name"
                                placeholder="Enter a name for this friend"
                                value={friendName}
                                onChange={(e) => setFriendName(e.target.value)}
                                className="h-11
                                    bg-white dark:bg-white/5
                                    border-gray-200 dark:border-white/10
                                    focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20
                                    rounded-xl transition-all duration-200"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAddFriend}
                        disabled={!friendCode.trim() || isAdding || isPending}
                        className="flex-1 sm:flex-none gap-2
                            bg-[#0066FF] hover:bg-[#0052CC]
                            shadow-[0_4px_12px_rgba(0,102,255,0.25)]
                            hover:shadow-[0_6px_20px_rgba(0,102,255,0.35)]
                            disabled:shadow-none
                            transition-all duration-200"
                        aria-label={(isAdding || isPending) ? "Adding friend..." : "Add friend"}
                    >
                        {(isAdding || isPending) ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                <span>{isPending ? 'Processing...' : 'Adding...'}</span>
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" aria-hidden="true" />
                                <span>Add Friend</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddFriendDialog;
