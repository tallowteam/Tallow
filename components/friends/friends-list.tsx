'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, Send, Settings, Shield, ShieldOff, Clock, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
    Friend,
    getFriends,
    getPendingFriendRequests,
    FriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    formatFriendCode,
} from '@/lib/storage/friends';
import { AddFriendDialog } from './add-friend-dialog';
import { FriendSettingsDialog } from './friend-settings-dialog';
import { useLanguage } from '@/lib/i18n/language-context';

interface FriendsListProps {
    onSendToFriend?: (friend: Friend) => void;
    onRefresh?: () => void;
}

export function FriendsList({ onSendToFriend, onRefresh }: FriendsListProps) {
    const { t } = useLanguage();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const loadData = useCallback(() => {
        setFriends(getFriends());
        setPendingRequests(getPendingFriendRequests());
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFriendAdded = useCallback((friend: Friend) => {
        setFriends(prev => [...prev, friend]);
        onRefresh?.();
    }, [onRefresh]);

    const handleFriendUpdated = useCallback((friend: Friend) => {
        setFriends(prev => prev.map(f => f.id === friend.id ? friend : f));
    }, []);

    const handleFriendRemoved = useCallback((friendId: string) => {
        setFriends(prev => prev.filter(f => f.id !== friendId));
    }, []);

    const handleAcceptRequest = useCallback((requestId: string) => {
        const friend = acceptFriendRequest(requestId);
        if (friend) {
            setFriends(prev => [...prev, friend]);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        }
    }, []);

    const handleRejectRequest = useCallback((requestId: string) => {
        rejectFriendRequest(requestId);
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    }, []);

    const openSettings = useCallback((friend: Friend) => {
        setSelectedFriend(friend);
        setIsSettingsOpen(true);
    }, []);

    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // Empty state
    if (friends.length === 0 && pendingRequests.length === 0) {
        return (
            <>
                <Card className="p-6 rounded-2xl text-center rounded-xl border border-border bg-card">
                    <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                    <h3 className="font-medium mb-1">{t('app.noFriends')}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        {t('app.addFriendsDesc')}
                    </p>
                    <Button className="rounded-full" onClick={() => setIsAddOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {t('app.addFriend')}
                    </Button>
                </Card>

                <AddFriendDialog
                    open={isAddOpen}
                    onOpenChange={setIsAddOpen}
                    onFriendAdded={handleFriendAdded}
                />
            </>
        );
    }

    return (
        <>
            <Card className="rounded-2xl overflow-hidden rounded-xl border border-border bg-card">
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <h3 className="font-medium">{t('app.friends')}</h3>
                        {friends.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {friends.length}
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        onClick={() => setIsAddOpen(true)}
                    >
                        <UserPlus className="w-4 h-4" />
                    </Button>
                </div>

                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                    <div className="p-3 bg-primary/5 border-b border-border">
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                                Friend Requests ({pendingRequests.length})
                            </span>
                        </div>
                        <div className="space-y-2">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-background/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                            <span className="text-xs font-medium">
                                                {request.fromName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium">{request.fromName}</p>
                                            <code className="text-xs text-muted-foreground font-mono">
                                                {formatFriendCode(request.fromCode)}
                                            </code>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 text-xs"
                                            onClick={() => handleRejectRequest(request.id)}
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="h-7 text-xs"
                                            onClick={() => handleAcceptRequest(request.id)}
                                        >
                                            Accept
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends List */}
                <ScrollArea className="h-[280px]">
                    <div className="p-2 space-y-1">
                        {friends.map((friend) => (
                            <div
                                key={friend.id}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 group transition-colors"
                            >
                                {/* Avatar */}
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
                                        {friend.avatar && (friend.avatar.startsWith('https://') || friend.avatar.startsWith('data:image/')) ? (
                                            <img
                                                src={friend.avatar}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                                referrerPolicy="no-referrer"
                                            />
                                        ) : (
                                            <span className="text-sm font-medium">
                                                {friend.name.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    {/* Trust indicator */}
                                    {friend.trustLevel === 'trusted' && !friend.requirePasscode && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                                            <ShieldOff className="w-2.5 h-2.5 text-primary-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium truncate">{friend.name}</p>
                                        {friend.requirePasscode && (
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Shield className="w-3.5 h-3.5 text-amber-500" />
                                                </TooltipTrigger>
                                                <TooltipContent>Passcode required</TooltipContent>
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <code className="font-mono">
                                            {formatFriendCode(friend.friendCode)}
                                        </code>
                                        {friend.lastConnected && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {getTimeAgo(friend.lastConnected)}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {onSendToFriend && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="rounded-full h-8 w-8"
                                                    onClick={() => onSendToFriend(friend)}
                                                >
                                                    <Send className="w-4 h-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Send files</TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-full h-8 w-8"
                                                onClick={() => openSettings(friend)}
                                            >
                                                <Settings className="w-4 h-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Friend settings</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>

            {/* Dialogs */}
            <AddFriendDialog
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
                onFriendAdded={handleFriendAdded}
            />

            <FriendSettingsDialog
                friend={selectedFriend}
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
                onFriendUpdated={handleFriendUpdated}
                onFriendRemoved={handleFriendRemoved}
            />
        </>
    );
}

export default FriendsList;
