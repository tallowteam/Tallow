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
import { Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

interface PasswordInputDialogProps {
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

    const handleSubmit = useCallback(async () => {
        if (!password.trim()) {
            setError('Please enter a password');
            return;
        }

        setIsVerifying(true);
        setError('');

        try {
            const success = await onSubmit(password);
            if (success) {
                setPassword('');
                onOpenChange(false);
            } else {
                setError('Incorrect password. Please try again.');
            }
        } catch (err) {
            setError('Failed to decrypt. Please check your password.');
        } finally {
            setIsVerifying(false);
        }
    }, [password, onSubmit, onOpenChange]);

    const handleCancel = useCallback(() => {
        setPassword('');
        setError('');
        onCancel?.();
        onOpenChange(false);
    }, [onCancel, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="w-5 h-5" />
                        Password Protected
                    </DialogTitle>
                    <DialogDescription>
                        {fileName
                            ? `"${fileName}" is password protected. Enter the password to decrypt.`
                            : 'This file is password protected. Enter the password to decrypt.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file-password">Password</Label>
                        <div className="relative">
                            <Input
                                id="file-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isVerifying) {
                                        handleSubmit();
                                    }
                                }}
                                className="pr-10"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!password.trim() || isVerifying}>
                        {isVerifying ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Decrypting...
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 mr-2" />
                                Unlock
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PasswordInputDialog;
