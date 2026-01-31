'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
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
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

export interface PasswordInputDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fileName?: string;
    onSubmit: (password: string) => Promise<boolean>;
    onCancel?: () => void;
}

export function PasswordInputDialog({
    open,
    onOpenChange,
    fileName,
    onSubmit,
    onCancel,
}: PasswordInputDialogProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [remainingLockout, setRemainingLockout] = useState(0);

    // Ref for accessible focus management - focus after dialog announces to screen readers
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // Focus management: delay focus to allow screen readers to announce dialog first
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                passwordInputRef.current?.focus();
            }, 100);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [open]);

    // Lockout timer countdown
    useEffect(() => {
        if (!lockoutUntil) {return;}

        const interval = setInterval(() => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((lockoutUntil - now) / 1000));
            setRemainingLockout(remaining);

            if (remaining === 0) {
                setLockoutUntil(null);
                setFailedAttempts(0);
                setError('');
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [lockoutUntil]);

    const handleSubmit = useCallback(async () => {
        // Check lockout
        if (lockoutUntil && Date.now() < lockoutUntil) {
            setError(`Too many tries. Wait ${remainingLockout}s.`);
            return;
        }

        if (!password.trim()) {
            setError('Enter the password to unlock this file');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const success = await onSubmit(password);
            if (success) {
                // Reset on success
                setPassword('');
                setFailedAttempts(0);
                setLockoutUntil(null);
                onOpenChange(false);
            } else {
                // Increment failed attempts
                const newFailedAttempts = failedAttempts + 1;
                setFailedAttempts(newFailedAttempts);

                // Apply exponential backoff after 3 attempts
                if (newFailedAttempts >= 3) {
                    const lockoutSeconds = Math.pow(2, newFailedAttempts - 3);
                    const lockoutTime = Date.now() + (lockoutSeconds * 1000);
                    setLockoutUntil(lockoutTime);
                    setError(`Wrong password. Wait ${lockoutSeconds}s before trying again.`);
                } else {
                    setError(`Wrong password. ${3 - newFailedAttempts} ${3 - newFailedAttempts === 1 ? 'try' : 'tries'} left.`);
                }
            }
        } catch (_err) {
            const newFailedAttempts = failedAttempts + 1;
            setFailedAttempts(newFailedAttempts);

            if (newFailedAttempts >= 3) {
                const lockoutSeconds = Math.pow(2, newFailedAttempts - 3);
                const lockoutTime = Date.now() + (lockoutSeconds * 1000);
                setLockoutUntil(lockoutTime);
                setError(`Decryption failed. Wait ${lockoutSeconds}s to try again.`);
            } else {
                setError('Couldn\'t decrypt. Double-check the password.');
            }
        } finally {
            setIsVerifying(false);
        }
    }, [password, onSubmit, onOpenChange, failedAttempts, lockoutUntil, remainingLockout]);

    const handleCancel = useCallback(() => {
        setPassword('');
        setError('');
        onCancel?.();
        onOpenChange(false);
    }, [onCancel, onOpenChange]);

    const isLocked = lockoutUntil !== null && Date.now() < lockoutUntil;

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
                            <Lock className="w-5 h-5 text-[#b2987d]" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#b2987d] rounded-full animate-pulse" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Password Protected</span>
                    </DialogTitle>
                    <DialogDescription className="text-[#b2987d] mt-2">
                        {fileName
                            ? (
                                <span className="flex flex-col gap-1">
                                    <span className="font-medium text-[#191610] dark:text-[#fefefc] truncate max-w-[280px]">
                                        &quot;{fileName}&quot;
                                    </span>
                                    <span>is locked. Enter the password to open it.</span>
                                </span>
                            )
                            : 'This file is locked. Enter the password to open it.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-5">
                    {/* Security indicator */}
                    <div className="flex items-center gap-3 p-3 rounded-xl
                        bg-gradient-to-r from-[#b2987d]/5 to-[#b2987d]/10
                        dark:from-[#b2987d]/10 dark:to-[#b2987d]/15
                        border border-[#e5dac7] dark:border-[#544a36]"
                    >
                        <ShieldCheck className="w-5 h-5 text-[#b2987d]" />
                        <span className="text-sm text-[#b2987d] font-medium">
                            End-to-end encrypted transfer
                        </span>
                    </div>

                    <div className="space-y-3">
                        <Label
                            htmlFor="file-password"
                            className="text-sm font-semibold text-[#191610] dark:text-[#fefefc] flex items-center gap-2"
                        >
                            <KeyRound className="w-4 h-4 text-[#b2987d]" />
                            Password
                        </Label>
                        <div className="relative group">
                            <Input
                                id="file-password"
                                ref={passwordInputRef}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isVerifying && !isLocked) {
                                        handleSubmit();
                                    }
                                }}
                                disabled={isLocked}
                                inputSize="default"
                                state={error ? 'error' : 'default'}
                                className="pr-12"
                                aria-required="true"
                                aria-invalid={!!error}
                                aria-describedby={error ? "file-password-error" : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isLocked}
                                className="absolute right-3 top-1/2 -translate-y-1/2
                                    p-1.5 rounded-lg
                                    text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]
                                    hover:bg-[#e5dac7]/50 dark:hover:bg-[#544a36]/50
                                    transition-all duration-300
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error message with animation */}
                    {error && (
                        <div
                            id="file-password-error"
                            role="alert"
                            aria-live="assertive"
                            className="flex items-center gap-3 p-3 rounded-xl
                                bg-red-500/10 dark:bg-red-500/15
                                border border-red-500/20 dark:border-red-500/30
                                animate-in slide-in-from-top-2 fade-in duration-300"
                        >
                            <div className="p-1 rounded-lg bg-red-500/20">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                            </div>
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {error}
                            </span>
                        </div>
                    )}

                    {/* Lockout progress indicator */}
                    {isLocked && (
                        <div className="relative h-1 bg-[#e5dac7] dark:bg-[#544a36] rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-[#b2987d] transition-all duration-1000 ease-linear"
                                style={{
                                    width: `${Math.max(0, (remainingLockout / Math.pow(2, failedAttempts - 3)) * 100)}%`
                                }}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!password.trim() || isVerifying || isLocked}
                        loading={isVerifying}
                        className="flex-1 sm:flex-none"
                        leftIcon={!isVerifying ? <Lock className="w-4 h-4" /> : undefined}
                    >
                        {isVerifying ? 'Decrypting...' : 'Unlock'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PasswordInputDialog;
