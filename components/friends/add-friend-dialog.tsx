'use client';

import { useState, useCallback, useTransition, useMemo } from 'react';
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
import { UserPlus, Copy, Check, Users, Sparkles, Heart, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
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

/**
 * EUVEKA Form Styling Applied:
 * - Input height: 48px (h-12)
 * - Input border-radius: 12px (rounded-xl)
 * - Button height: 56px (h-14)
 * - Button border-radius: 60px (pill shape)
 * - Border colors: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d accent
 */
export function AddFriendDialog({ open, onOpenChange, onFriendAdded }: AddFriendDialogProps) {
    const [friendCode, setFriendCode] = useState('');
    const [friendName, setFriendName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const myCode = getMyFriendCode();
    const formattedCode = formatFriendCode(myCode);

    const isCodeValid = useMemo(() => {
        return friendCode.length > 0 && isValidFriendCode(friendCode.replace(/-/g, '').toUpperCase());
    }, [friendCode]);

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
        setError(null);

        if (!friendCode.trim()) {
            setError('Please enter a friend code');
            return;
        }

        // Validate code format before attempting to parse
        const rawCode = friendCode.replace(/-/g, '').toUpperCase().trim();
        if (!isValidFriendCode(rawCode)) {
            setError('Invalid friend code format (must be 8 alphanumeric characters)');
            return;
        }

        if (rawCode === myCode) {
            setError("You can't add yourself as a friend!");
            return;
        }

        // Check if already a friend
        const existing = findFriendByCode(rawCode);
        if (existing) {
            setError('This person is already in your friends list');
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
                setError(null);
                onOpenChange(false);
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to add friend';
            setError(msg);
        } finally {
            setIsAdding(false);
        }
    }, [friendCode, friendName, myCode, onFriendAdded, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md overflow-hidden"
            >
                {/* EUVEKA decorative gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b2987d] via-[#d4c4b0] to-[#b2987d] rounded-t-[24px]" />

                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-3 text-[#191610] dark:text-[#fefefc]">
                        <div className="p-2.5 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20 relative">
                            <UserPlus className="w-5 h-5 text-[#b2987d]" />
                            <Heart className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-pink-500 fill-pink-500" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Add a Friend</span>
                    </DialogTitle>
                    <DialogDescription className="text-[#b2987d] mt-1">
                        Share your friend code or enter someone else's code to connect
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Your Friend Code Section with EUVEKA styling */}
                    <div className="space-y-3">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-[#b2987d] flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Your Friend Code
                        </Label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 px-5 py-4 rounded-xl
                                bg-gradient-to-br from-[#b2987d]/5 to-[#b2987d]/10
                                dark:from-[#b2987d]/10 dark:to-[#b2987d]/15
                                border border-[#e5dac7] dark:border-[#544a36]
                                transition-all duration-200 hover:border-[#b2987d]/40
                                relative overflow-hidden group"
                            >
                                {/* Shimmer effect on hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent
                                    -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                <code className="relative text-2xl font-mono font-bold text-[#b2987d] tracking-[0.2em]">
                                    {formattedCode}
                                </code>
                            </div>
                            {/* EUVEKA: 56px button height with pill shape */}
                            <Button
                                variant="secondary"
                                size="icon"
                                onClick={handleCopyCode}
                                className="h-14 w-14 rounded-xl
                                    bg-[#e5dac7]/50 hover:bg-[#e5dac7]
                                    dark:bg-[#544a36]/50 dark:hover:bg-[#544a36]
                                    border border-[#e5dac7] hover:border-[#b2987d]/40
                                    dark:border-[#544a36] dark:hover:border-[#b2987d]/40
                                    transition-all duration-200
                                    group"
                                aria-label={copied ? "Code copied" : "Copy friend code"}
                            >
                                {copied ? (
                                    <Check className="w-5 h-5 text-emerald-500 animate-in zoom-in duration-200" aria-hidden="true" />
                                ) : (
                                    <Copy className="w-5 h-5 text-[#b2987d]
                                        group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-[#b2987d] flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3" />
                            Share this code with friends so they can add you
                        </p>
                    </div>

                    {/* Divider with EUVEKA styling */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#e5dac7] dark:border-[#544a36]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 text-xs uppercase tracking-wider font-semibold
                                bg-[#fefefc]/95 dark:bg-[#191610]/95 text-[#b2987d]">
                                or add someone
                            </span>
                        </div>
                    </div>

                    {/* Add Friend Form with EUVEKA styling */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label
                                htmlFor="friend-code"
                                className="text-sm font-semibold text-[#191610] dark:text-[#fefefc]"
                            >
                                Friend's Code
                            </Label>
                            <div className="relative">
                                <Input
                                    id="friend-code"
                                    placeholder="XXXX-XXXX"
                                    value={friendCode}
                                    onChange={(e) => {
                                        setFriendCode(e.target.value.toUpperCase());
                                        setError(null);
                                    }}
                                    maxLength={9}
                                    inputSize="default"
                                    state={error ? 'error' : isCodeValid ? 'success' : 'default'}
                                    className="font-mono text-lg tracking-[0.15em] text-center
                                        placeholder:tracking-[0.2em] placeholder:text-[#b2987d]/40"
                                    aria-required="true"
                                    aria-invalid={!!error}
                                />
                                {/* Validation indicator */}
                                {friendCode.length > 0 && (
                                    <div className={`absolute right-3 top-1/2 -translate-y-1/2
                                        w-2 h-2 rounded-full transition-colors duration-200
                                        ${isCodeValid ? 'bg-emerald-500' : 'bg-[#e5dac7] dark:bg-[#544a36]'}`}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="friend-name"
                                className="text-sm font-semibold text-[#191610] dark:text-[#fefefc] flex items-center gap-2"
                            >
                                Nickname
                                <span className="text-xs font-normal text-[#b2987d]">(optional)</span>
                            </Label>
                            <Input
                                id="friend-name"
                                placeholder="Enter a name for this friend"
                                value={friendName}
                                onChange={(e) => setFriendName(e.target.value)}
                                inputSize="default"
                            />
                        </div>

                        {/* EUVEKA styled error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.2 }}
                                    role="alert"
                                    aria-live="assertive"
                                    className="flex items-center gap-2 p-3 rounded-xl
                                        bg-red-500/10 border border-red-500/20"
                                >
                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                                    <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                        {error}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <DialogFooter className="gap-3 sm:gap-3 pt-2 border-t border-[#e5dac7] dark:border-[#544a36]">
                    {/* EUVEKA: 56px button height with pill shape */}
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleAddFriend}
                        disabled={!friendCode.trim() || isAdding || isPending}
                        loading={isAdding || isPending}
                        className="flex-1 sm:flex-none"
                        leftIcon={!(isAdding || isPending) ? <UserPlus className="w-4 h-4" aria-hidden="true" /> : undefined}
                        aria-label={(isAdding || isPending) ? "Adding friend..." : "Add friend"}
                    >
                        {(isAdding || isPending) ? (isPending ? 'Processing...' : 'Adding...') : 'Add Friend'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default AddFriendDialog;
