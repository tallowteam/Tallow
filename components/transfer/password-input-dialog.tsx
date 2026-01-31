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
import { Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, KeyRound } from 'lucide-react';

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
            setError(`Too many attempts. Please wait ${remainingLockout} seconds.`);
            return;
        }

        if (!password.trim()) {
            setError('Please enter a password');
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
                    setError(`Incorrect password. Locked out for ${lockoutSeconds} seconds.`);
                } else {
                    setError(`Incorrect password. ${3 - newFailedAttempts} attempts remaining.`);
                }
            }
        } catch (_err) {
            const newFailedAttempts = failedAttempts + 1;
            setFailedAttempts(newFailedAttempts);

            if (newFailedAttempts >= 3) {
                const lockoutSeconds = Math.pow(2, newFailedAttempts - 3);
                const lockoutTime = Date.now() + (lockoutSeconds * 1000);
                setLockoutUntil(lockoutTime);
                setError(`Failed to decrypt. Locked out for ${lockoutSeconds} seconds.`);
            } else {
                setError('Failed to decrypt. Please check your password.');
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
                className="sm:max-w-md overflow-hidden
                    bg-white/80 dark:bg-[#0a0a0a]/90
                    backdrop-blur-xl
                    border border-gray-200/50 dark:border-white/10
                    rounded-2xl
                    shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
                    transition-all duration-300"
            >
                {/* Decorative gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 rounded-t-2xl" />

                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                        <div className="p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 relative">
                            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Password Protected</span>
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
                        {fileName
                            ? (
                                <span className="flex flex-col gap-1">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[280px]">
                                        &quot;{fileName}&quot;
                                    </span>
                                    <span>is password protected. Enter the password to decrypt.</span>
                                </span>
                            )
                            : 'This file is password protected. Enter the password to decrypt.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-5">
                    {/* Security indicator */}
                    <div className="flex items-center gap-3 p-3 rounded-xl
                        bg-gradient-to-r from-amber-500/5 to-orange-500/5
                        dark:from-amber-500/10 dark:to-orange-500/10
                        border border-amber-500/20 dark:border-amber-500/30"
                    >
                        <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                            End-to-end encrypted transfer
                        </span>
                    </div>

                    <div className="space-y-3">
                        <Label
                            htmlFor="file-password"
                            className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"
                        >
                            <KeyRound className="w-4 h-4 text-gray-400" />
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
                                className="pr-12 h-12
                                    bg-white dark:bg-white/5
                                    border-gray-200 dark:border-white/10
                                    focus:border-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20
                                    rounded-xl transition-all duration-200
                                    text-base
                                    disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                                    hover:bg-gray-100 dark:hover:bg-white/10
                                    transition-all duration-200
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
                        <div className="relative h-1 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="absolute inset-y-0 left-0 bg-amber-500 transition-all duration-1000 ease-linear"
                                style={{
                                    width: `${Math.max(0, (remainingLockout / Math.pow(2, failedAttempts - 3)) * 100)}%`
                                }}
                            />
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-3 sm:gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!password.trim() || isVerifying || isLocked}
                        className="flex-1 sm:flex-none gap-2
                            bg-[#0066FF] hover:bg-[#0052CC]
                            shadow-[0_4px_12px_rgba(0,102,255,0.25)]
                            hover:shadow-[0_6px_20px_rgba(0,102,255,0.35)]
                            disabled:shadow-none
                            transition-all duration-200"
                    >
                        {isVerifying ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Decrypting...</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4" />
                                <span>Unlock</span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PasswordInputDialog;
