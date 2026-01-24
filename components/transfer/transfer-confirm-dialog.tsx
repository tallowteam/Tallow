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
} from 'lucide-react';

interface FileInfo {
    name: string;
    size: number;
    type: string;
}

interface TransferConfirmDialogProps {
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
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type: string) {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.startsWith('audio/')) return Music;
    if (type.includes('zip') || type.includes('rar') || type.includes('tar')) return Archive;
    if (type.includes('text') || type.includes('document')) return FileText;
    if (type.includes('javascript') || type.includes('json') || type.includes('html') || type.includes('css')) return Code;
    return File;
}

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

    const handleConfirm = () => {
        if (passwordProtect) {
            if (!password.trim()) {
                setPasswordError('Please enter a password');
                return;
            }
            if (password.length < 4) {
                setPasswordError('Password must be at least 4 characters');
                return;
            }
            if (password !== confirmPassword) {
                setPasswordError('Passwords do not match');
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
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Ready to Send
                    </DialogTitle>
                    <DialogDescription>
                        {fileCount === 1
                            ? 'Confirm you want to send this file'
                            : `Confirm you want to send these ${fileCount} files`}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Summary box */}
                    <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-lg">{fileCount} file{fileCount !== 1 ? 's' : ''}</p>
                                <p className="text-sm text-muted-foreground">Total: {formatBytes(totalSize)}</p>
                            </div>
                            {transferCode && !isFriend && (
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">Transfer Code</p>
                                    <code className="font-mono font-bold text-primary">{transferCode}</code>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Friend indicator */}
                    {isFriend && (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">
                                Sending to friend
                                {skipPasscode && ' (no passcode required)'}
                            </span>
                        </div>
                    )}

                    {/* File list */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                        {files.slice(0, maxFilesToShow).map((file, index) => {
                            const FileIcon = getFileIcon(file.type);
                            return (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50"
                                >
                                    <div className="p-1.5 rounded bg-secondary">
                                        <FileIcon className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{file.name}</p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {fileCount > maxFilesToShow && (
                            <p className="text-sm text-muted-foreground text-center py-2">
                                +{fileCount - maxFilesToShow} more file{fileCount - maxFilesToShow !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Password Protection */}
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-secondary">
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <div>
                                    <Label htmlFor="password-protect" className="text-sm font-medium cursor-pointer">
                                        Password Protect
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Recipient needs password to open
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
                            />
                        </div>

                        {passwordProtect && (
                            <div className="space-y-3 p-4 rounded-lg border border-primary/20 bg-primary/5">
                                <div className="space-y-2">
                                    <Label htmlFor="transfer-password" className="text-sm">Password</Label>
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
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password" className="text-sm">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="Confirm password"
                                        value={confirmPassword}
                                        onChange={(e) => {
                                            setConfirmPassword(e.target.value);
                                            setPasswordError('');
                                        }}
                                    />
                                </div>

                                {passwordError && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <Shield className="w-3 h-3" />
                                        {passwordError}
                                    </p>
                                )}

                                <p className="text-xs text-muted-foreground">
                                    Share this password with the recipient separately
                                </p>
                            </div>
                        )}
                    </div>

                    {recipientName && (
                        <p className="text-sm text-muted-foreground">
                            Sending to: <span className="font-medium text-foreground">{recipientName}</span>
                        </p>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} className="gap-2">
                        {passwordProtect && <Lock className="w-4 h-4" />}
                        <Send className="w-4 h-4" />
                        Send {fileCount === 1 ? 'File' : 'Files'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default TransferConfirmDialog;
