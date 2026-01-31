'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    File,
    Send,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    Code,
    Lock,
    Eye,
    EyeOff,
    Users,
    Shield,
    Sparkles,
    AlertCircle,
    Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileInfo {
    name: string;
    size: number;
    type: string;
}

export interface TransferConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: FileInfo[];
    recipientName?: string;
    transferCode?: string;
    isFriend?: boolean;
    skipPasscode?: boolean;
    onConfirm: (password?: string) => void;
    onCancel: () => void;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) {return Image;}
    if (type.startsWith('video/')) {return Video;}
    if (type.startsWith('audio/')) {return Music;}
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) {return Archive;}
    if (type.includes('text') || type.includes('document')) {return FileText;}
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css')) {return Code;}
    return File;
}

/**
 * Password Strength Indicator
 * Returns a score from 0-4 and color based on password complexity
 */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
    let score = 0;
    if (password.length >= 4) {score++;}
    if (password.length >= 8) {score++;}
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) {score++;}
    if (/[0-9]/.test(password)) {score++;}
    if (/[^A-Za-z0-9]/.test(password)) {score++;}

    if (score <= 1) {return { score, label: 'Weak', color: 'bg-red-500' };}
    if (score === 2) {return { score, label: 'Fair', color: 'bg-orange-500' };}
    if (score === 3) {return { score, label: 'Good', color: 'bg-yellow-500' };}
    if (score >= 4) {return { score, label: 'Strong', color: 'bg-green-500' };}
    return { score: 0, label: 'Weak', color: 'bg-red-500' };
}

/**
 * EUVEKA Form Styling Applied:
 * - Input height: 48px (h-12)
 * - Input border-radius: 12px (rounded-xl)
 * - Button height: 56px (h-14)
 * - Button border-radius: 60px (pill shape)
 * - Border colors: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d accent
 * - Password strength indicator with EUVEKA colors
 */
export function TransferConfirmDialog({
    open,
    onOpenChange,
    files,
    recipientName,
    transferCode,
    isFriend = false,
    skipPasscode = false,
    onConfirm,
    onCancel,
}: TransferConfirmDialogProps) {
    const [passwordProtect, setPasswordProtect] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const totalSize = useMemo(() => {
        return files.reduce((sum, file) => sum + file.size, 0);
    }, [files]);

    const fileCount = files.length;
    const maxFilesToShow = 5;

    const passwordStrength = useMemo(() => {
        return getPasswordStrength(password);
    }, [password]);

    const handleConfirm = () => {
        if (passwordProtect) {
            if (!password.trim()) {
                setPasswordError('Add a password to protect these files');
                return;
            }
            if (password.length < 4) {
                setPasswordError('Use at least 4 characters for security');
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError('Passwords don\'t match. Check and try again.');
                return;
            }
            onConfirm(password);
        } else {
            onConfirm();
        }
        // Reset state
        setPasswordProtect(false);
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
    };

    const handleCancel = () => {
        setPasswordProtect(false);
        setPassword('');
        setConfirmPassword('');
        setPasswordError('');
        onCancel();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-md overflow-hidden"
            >
                {/* EUVEKA decorative gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#b2987d] via-[#d4c4b0] to-[#b2987d] rounded-t-[24px]" />

                <DialogHeader className="pt-2">
                    <DialogTitle className="flex items-center gap-3 text-[#191610] dark:text-[#fefefc]">
                        <div className="p-2 rounded-xl bg-[#b2987d]/10 dark:bg-[#b2987d]/20" aria-hidden="true">
                            <Send className="w-5 h-5 text-[#b2987d]" aria-hidden="true" />
                        </div>
                        <span className="text-xl font-semibold tracking-tight">Ready to Send</span>
                    </DialogTitle>
                    <DialogDescription className="text-[#b2987d] mt-1">
                        {fileCount === 1
                            ? 'Review and send this file'
                            : `Review and send these ${fileCount} files`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Summary box with EUVEKA styling */}
                    <div className="p-4 rounded-xl
                        bg-gradient-to-br from-[#b2987d]/5 to-[#b2987d]/10
                        dark:from-[#b2987d]/10 dark:to-[#b2987d]/5
                        border border-[#e5dac7] dark:border-[#544a36]
                        transition-all duration-200 hover:border-[#b2987d]/40"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-lg text-[#191610] dark:text-[#fefefc]">
                                    {fileCount} file{fileCount !== 1 ? 's' : ''}
                                </p>
                                <p className="text-sm text-[#b2987d]">
                                    Total: {formatBytes(totalSize)}
                                </p>
                            </div>
                            {transferCode && !isFriend && (
                                <div className="text-right">
                                    <p className="text-xs text-[#b2987d]/70 uppercase tracking-wider font-medium">
                                        Transfer Code
                                    </p>
                                    <code className="font-mono font-bold text-[#b2987d] text-lg tracking-widest">
                                        {transferCode}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Friend indicator with EUVEKA styling */}
                    {isFriend && (
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                            bg-emerald-500/10 dark:bg-emerald-500/15
                            border border-emerald-500/20 dark:border-emerald-500/30
                            transition-all duration-200 hover:scale-[1.01] hover:border-emerald-500/40"
                        >
                            <div className="p-1.5 rounded-lg bg-emerald-500/20">
                                <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                                Sending to friend
                                {skipPasscode && ' (no passcode required)'}
                            </span>
                            <Sparkles className="w-4 h-4 text-emerald-500 ml-auto animate-pulse" />
                        </div>
                    )}

                    {/* File list with EUVEKA styling */}
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-thin">
                        {files.slice(0, maxFilesToShow).map((file, index) => {
                            const FileIcon = getFileIcon(file.type);
                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-xl
                                        bg-[#fefefc] dark:bg-[#191610]
                                        border border-[#e5dac7] dark:border-[#544a36]
                                        transition-all duration-200
                                        hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20
                                        hover:border-[#b2987d]/40
                                        group"
                                >
                                    <div className="p-2 rounded-xl bg-[#e5dac7]/50 dark:bg-[#544a36]/50
                                        group-hover:bg-[#b2987d]/10 group-hover:text-[#b2987d]
                                        transition-colors duration-200"
                                    >
                                        <FileIcon className="w-4 h-4 text-[#b2987d]
                                            group-hover:text-[#b2987d] transition-colors" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate text-[#191610] dark:text-[#fefefc]">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-[#b2987d]">
                                            {formatBytes(file.size)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                        {fileCount > maxFilesToShow && (
                            <p className="text-sm text-[#b2987d] text-center py-2 font-medium">
                                +{fileCount - maxFilesToShow} more file{fileCount - maxFilesToShow !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Password Protection with EUVEKA styling */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-4 rounded-xl
                            bg-[#fefefc] dark:bg-[#191610]
                            border border-[#e5dac7] dark:border-[#544a36]
                            transition-all duration-200 hover:border-[#b2987d]/40"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-[#e5dac7]/50 dark:bg-[#544a36]/50">
                                    <Lock className="w-4 h-4 text-[#b2987d]" />
                                </div>
                                <div>
                                    <Label htmlFor="password-protect" className="text-sm font-semibold cursor-pointer text-[#191610] dark:text-[#fefefc]">
                                        Add Password
                                    </Label>
                                    <p className="text-xs text-[#b2987d]">
                                        Only people with the password can open
                                    </p>
                                </div>
                            </div>
                            <Switch
                                id="password-protect"
                                checked={passwordProtect}
                                onCheckedChange={(checked) => {
                                    setPasswordProtect(checked);
                                    setPasswordError('');
                                }}
                                className="data-[state=checked]:bg-[#b2987d]"
                            />
                        </div>

                        <AnimatePresence>
                            {passwordProtect && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-4 p-4 rounded-xl
                                        bg-gradient-to-br from-[#b2987d]/5 to-transparent
                                        border border-[#e5dac7] dark:border-[#544a36]"
                                >
                                    <div className="space-y-2">
                                        <Label htmlFor="transfer-password" className="text-sm font-medium text-[#191610] dark:text-[#fefefc]">
                                            Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="transfer-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter password"
                                                value={password}
                                                onChange={(e) => {
                                                    setPassword(e.target.value);
                                                    setPasswordError('');
                                                }}
                                                inputSize="default"
                                                state={passwordError ? 'error' : 'default'}
                                                className="pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                                aria-pressed={showPassword}
                                                className="absolute right-3 top-1/2 -translate-y-1/2
                                                    text-[#b2987d] hover:text-[#191610] dark:hover:text-[#fefefc]
                                                    transition-colors duration-200 p-1 rounded-lg hover:bg-[#e5dac7]/50 dark:hover:bg-[#544a36]/50
                                                    focus:outline-none focus:ring-2 focus:ring-[#b2987d]/50"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                                            </button>
                                        </div>

                                        {/* Password Strength Indicator */}
                                        {password.length > 0 && (
                                            <div className="space-y-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                                level <= passwordStrength.score
                                                                    ? passwordStrength.color
                                                                    : 'bg-[#e5dac7] dark:bg-[#544a36]'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                                <p className={`text-xs font-medium ${
                                                    passwordStrength.score <= 1 ? 'text-red-500' :
                                                    passwordStrength.score === 2 ? 'text-orange-500' :
                                                    passwordStrength.score === 3 ? 'text-yellow-600 dark:text-yellow-400' :
                                                    'text-green-500'
                                                }`}>
                                                    {passwordStrength.label}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password" className="text-sm font-medium text-[#191610] dark:text-[#fefefc]">
                                            Confirm Password
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="confirm-password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Confirm password"
                                                value={confirmPassword}
                                                onChange={(e) => {
                                                    setConfirmPassword(e.target.value);
                                                    setPasswordError('');
                                                }}
                                                inputSize="default"
                                                state={passwordError ? 'error' : password && confirmPassword && password === confirmPassword ? 'success' : 'default'}
                                            />
                                            {/* Match indicator */}
                                            {confirmPassword.length > 0 && password === confirmPassword && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <Check className="w-4 h-4 text-green-500" aria-hidden="true" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* EUVEKA styled error message */}
                                    <AnimatePresence>
                                        {passwordError && (
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
                                                    {passwordError}
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <p className="text-xs text-[#b2987d] flex items-center gap-1.5">
                                        <Shield className="w-3 h-3" />
                                        Send the password separately (text, call, etc.)
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {recipientName && (
                        <p className="text-sm text-[#b2987d] flex items-center gap-2">
                            <span>Sending to:</span>
                            <span className="font-semibold text-[#191610] dark:text-[#fefefc] px-2 py-0.5 rounded-lg bg-[#e5dac7]/50 dark:bg-[#544a36]/50">
                                {recipientName}
                            </span>
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-3 sm:gap-3 pt-2 border-t border-[#e5dac7] dark:border-[#544a36]">
                    {/* EUVEKA: 56px button height with pill shape */}
                    <Button
                        variant="secondary"
                        onClick={handleCancel}
                        className="flex-1 sm:flex-none"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        className="flex-1 sm:flex-none"
                        leftIcon={passwordProtect ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                    >
                        Send {fileCount === 1 ? 'File' : 'Files'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TransferConfirmDialog;
