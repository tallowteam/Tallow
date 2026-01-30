'use client';

import { useState, useCallback, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Settings, Bell, Trash2, Shield, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
    Friend,
    updateFriendSettings,
    removeFriend,
    formatFriendCode,
} from '@/lib/storage/friends';

export interface FriendSettingsDialogProps {
    friend: Friend | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onFriendUpdated?: (friend: Friend) => void;
    onFriendRemoved?: (friendId: string) => void;
}

export function FriendSettingsDialog({
    friend,
    open,
    onOpenChange,
    onFriendUpdated,
    onFriendRemoved,
}: FriendSettingsDialogProps) {
    const [name, setName] = useState(friend?.name || '');
    const [requirePasscode, setRequirePasscode] = useState(friend?.requirePasscode ?? false);
    const [autoAccept, setAutoAccept] = useState(friend?.connectionPreferences?.autoAccept ?? false);
    const [notifications, setNotifications] = useState(friend?.connectionPreferences?.notifications ?? true);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Sync local state when friend prop changes (e.g., opening dialog for different friend)
    useEffect(() => {
        if (friend) {
            setName(friend.name);
            setRequirePasscode(friend.requirePasscode);
            setAutoAccept(friend.connectionPreferences?.autoAccept ?? false);
            setNotifications(friend.connectionPreferences?.notifications ?? true);
            setShowRemoveConfirm(false);
        }
    }, [friend]);

    const handleSave = useCallback(() => {
        if (!friend) {return;}

        startTransition(() => {
            const updated = updateFriendSettings(friend.id, {
                name: name.trim() || friend.name,
                requirePasscode,
                connectionPreferences: {
                    autoAccept,
                    notifications,
                },
            });

            if (updated) {
                toast.success('Friend settings updated');
                onFriendUpdated?.(updated);
                onOpenChange(false);
            }
        });
    }, [friend, name, requirePasscode, autoAccept, notifications, onFriendUpdated, onOpenChange]);

    const handleRemove = useCallback(() => {
        if (!friend) {return;}

        removeFriend(friend.id);
        toast.success(`Removed ${friend.name} from friends`);
        onFriendRemoved?.(friend.id);
        onOpenChange(false);
    }, [friend, onFriendRemoved, onOpenChange]);

    if (!friend) {return null;}

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Friend Settings
                    </DialogTitle>
                    <DialogDescription>
                        Manage settings for {friend.name}
                    </DialogDescription>
                </DialogHeader>

                {!showRemoveConfirm ? (
                    <>
                        <div className="space-y-6 py-4">
                            {/* Friend Info */}
                            <div className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50">
                                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-lg font-bold">
                                        {friend.name.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{friend.name}</p>
                                    <code className="text-xs text-muted-foreground font-mono">
                                        {formatFriendCode(friend.friendCode)}
                                    </code>
                                </div>
                            </div>

                            {/* Nickname */}
                            <div className="space-y-2">
                                <Label htmlFor="nickname">Nickname</Label>
                                <Input
                                    id="nickname"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter a nickname"
                                />
                            </div>

                            <Separator />

                            {/* Security Settings */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    Security
                                </h4>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="require-passcode" className="text-sm">Require Passcode</Label>
                                        <p id="require-passcode-desc" className="text-xs text-muted-foreground">
                                            Always require a passcode when transferring with this friend
                                        </p>
                                    </div>
                                    <Switch
                                        id="require-passcode"
                                        checked={requirePasscode}
                                        onCheckedChange={setRequirePasscode}
                                        aria-label="Require passcode for transfers"
                                        aria-describedby="require-passcode-desc"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="auto-accept" className="text-sm">Auto-accept Files</Label>
                                        <p id="auto-accept-desc" className="text-xs text-muted-foreground">
                                            Automatically accept file transfers from this friend
                                        </p>
                                    </div>
                                    <Switch
                                        id="auto-accept"
                                        checked={autoAccept}
                                        onCheckedChange={setAutoAccept}
                                        aria-label="Auto-accept file transfers"
                                        aria-describedby="auto-accept-desc"
                                    />
                                </div>
                            </div>

                            <Separator />

                            {/* Notification Settings */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Bell className="w-4 h-4" />
                                    Notifications
                                </h4>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="notifications" className="text-sm">Enable Notifications</Label>
                                        <p id="notifications-desc" className="text-xs text-muted-foreground">
                                            Get notified when this friend sends files
                                        </p>
                                    </div>
                                    <Switch
                                        id="notifications"
                                        checked={notifications}
                                        onCheckedChange={setNotifications}
                                        aria-label="Enable file transfer notifications"
                                        aria-describedby="notifications-desc"
                                    />
                                </div>
                            </div>

                            {/* Connection Info */}
                            {friend.lastConnected && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3" />
                                    Last connected: {friend.lastConnected.toLocaleDateString()}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="flex-col sm:flex-row gap-2">
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowRemoveConfirm(true)}
                                className="sm:mr-auto"
                                aria-label={`Remove ${friend.name} from friends`}
                            >
                                <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                                Remove Friend
                            </Button>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSave} disabled={isPending} aria-label="Save friend settings">
                                {isPending ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <div className="py-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                            <Trash2 className="w-8 h-8 text-destructive" aria-hidden="true" />
                        </div>
                        <div>
                            <h3 className="font-medium text-lg">Remove {friend.name}?</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                You'll need to re-add them using their friend code to share files again.
                            </p>
                        </div>
                        <div className="flex gap-2 justify-center pt-4">
                            <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRemove} aria-label={`Confirm remove ${friend.name}`}>
                                Remove Friend
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default FriendSettingsDialog;
