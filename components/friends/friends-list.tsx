'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { UserPlus, Send, Settings, Shield, ShieldOff, Clock, Bell, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { NoFriendsEmpty } from '@/components/ui/empty-state-presets';
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

export interface FriendsListProps {
    onSendToFriend?: (friend: Friend) => void;
    onRefresh?: () => void;
}

// Helper function moved outside component to be reusable
function getTimeAgo(date: Date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {return 'Just now';}
    if (diffMins < 60) {return `${diffMins}m ago`;}
    if (diffHours < 24) {return `${diffHours}h ago`;}
    if (diffDays < 7) {return `${diffDays}d ago`;}
    return date.toLocaleDateString();
}

/**
 * EUVEKA Form Styling Applied:
 * - Button height: 56px (h-14)
 * - Button border-radius: 60px (pill shape)
 * - Border colors: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d accent
 * - Card styling with EUVEKA colors
 */

/**
 * FriendItem Component - Memoized for React 18/19 performance optimization
 * Prevents unnecessary re-renders when parent list updates but this friend hasn't changed
 */
interface FriendItemProps {
    friend: Friend;
    onSendToFriend?: (friend: Friend) => void;
    onOpenSettings: (friend: Friend) => void;
}

/**
 * Custom comparison function for FriendItem
 * Only re-render when friend data actually changes
 */
function areFriendPropsEqual(
    prevProps: FriendItemProps,
    nextProps: FriendItemProps
): boolean {
    const prev = prevProps.friend;
    const next = nextProps.friend;

    return (
        prev.id === next.id &&
        prev.name === next.name &&
        prev.friendCode === next.friendCode &&
        prev.trustLevel === next.trustLevel &&
        prev.requirePasscode === next.requirePasscode &&
        prev.avatar === next.avatar &&
        prev.lastConnected?.getTime() === next.lastConnected?.getTime() &&
        prevProps.onSendToFriend === nextProps.onSendToFriend &&
        prevProps.onOpenSettings === nextProps.onOpenSettings
    );
}

const FriendItem = memo(function FriendItem({
    friend,
    onSendToFriend,
    onOpenSettings,
}: FriendItemProps) {
    return (
        <div
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#e5dac7]/20 dark:hover:bg-[#544a36]/20 group transition-all duration-300"
            data-testid="friend-item"
        >
            {/* Avatar */}
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#b2987d]/30 to-[#e5dac7]/30 dark:from-[#544a36]/50 dark:to-[#b2987d]/30 flex items-center justify-center">
                    {friend.avatar && (friend.avatar.startsWith('https://') || friend.avatar.startsWith('data:image/')) ? (
                        <img src={friend.avatar} alt={`${friend.name} avatar`}
                            className="w-10 h-10 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <span className="text-sm font-medium text-[#191610] dark:text-[#fefefc]">
                            {friend.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                </div>
                {/* Trust indicator */}
                {friend.trustLevel === 'trusted' && !friend.requirePasscode && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-[#fefefc] dark:border-[#191610] flex items-center justify-center">
                        <ShieldOff className="w-2.5 h-2.5 text-white" aria-hidden="true" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-medium truncate text-[#191610] dark:text-[#fefefc]">{friend.name}</p>
                    {friend.requirePasscode && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Shield className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                            </TooltipTrigger>
                            <TooltipContent>Passcode required</TooltipContent>
                        </Tooltip>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#b2987d]">
                    <code className="font-mono">
                        {formatFriendCode(friend.friendCode)}
                    </code>
                    {friend.lastConnected && (
                        <>
                            <span>-</span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" aria-hidden="true" />
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
                                size="icon-sm"
                                className="rounded-full h-8 w-8"
                                onClick={() => onSendToFriend(friend)}
                                aria-label={`Send files to ${friend.name}`}
                            >
                                <Send className="w-4 h-4" aria-hidden="true" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send files</TooltipContent>
                    </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            className="rounded-full h-8 w-8"
                            onClick={() => onOpenSettings(friend)}
                            aria-label={`Settings for ${friend.name}`}
                        >
                            <Settings className="w-4 h-4" aria-hidden="true" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Friend settings</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
}, areFriendPropsEqual);

FriendItem.displayName = 'FriendItem';

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

    // Empty state with EUVEKA styling
    if (friends.length === 0 && pendingRequests.length === 0) {
        return (
            <>
                <Card className="rounded-2xl border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610] overflow-hidden shadow-[0_4px_20px_-4px_rgba(25,22,16,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
                    <NoFriendsEmpty onAddFriend={() => setIsAddOpen(true)} />
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
            {/* EUVEKA styled Card */}
            <Card className="rounded-2xl overflow-hidden border border-[#e5dac7] dark:border-[#544a36] bg-[#fefefc] dark:bg-[#191610] shadow-[0_4px_20px_-4px_rgba(25,22,16,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.3)]">
                {/* Header */}
                <div className="p-4 border-b border-[#e5dac7] dark:border-[#544a36] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#b2987d]" aria-hidden="true" />
                        <h3 className="font-medium text-[#191610] dark:text-[#fefefc]">{t('app.friends')}</h3>
                        {friends.length > 0 && (
                            <Badge
                                variant="secondary"
                                className="text-xs bg-[#e5dac7]/50 dark:bg-[#544a36]/50 text-[#191610] dark:text-[#fefefc]"
                            >
                                {friends.length}
                            </Badge>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        className="rounded-full"
                        onClick={() => setIsAddOpen(true)}
                        aria-label="Add new friend"
                    >
                        <UserPlus className="w-4 h-4" aria-hidden="true" />
                    </Button>
                </div>

                {/* Pending Requests with EUVEKA styling */}
                {pendingRequests.length > 0 && (
                    <div className="p-3 bg-[#b2987d]/5 border-b border-[#e5dac7] dark:border-[#544a36]">
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="w-4 h-4 text-[#b2987d]" aria-hidden="true" />
                            <span className="text-sm font-medium text-[#b2987d]">
                                Friend Requests ({pendingRequests.length})
                            </span>
                        </div>
                        <div className="space-y-2">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-2 rounded-xl bg-[#fefefc]/50 dark:bg-[#191610]/50 border border-[#e5dac7]/50 dark:border-[#544a36]/50"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-[#b2987d]/20 flex items-center justify-center">
                                            <span className="text-xs font-medium text-[#191610] dark:text-[#fefefc]">
                                                {request.fromName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#191610] dark:text-[#fefefc]">{request.fromName}</p>
                                            <code className="text-xs text-[#b2987d] font-mono">
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
                                            variant="primary"
                                            className="h-7 text-xs px-4"
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

                {/* Friends List - Uses memoized FriendItem for React 18 optimization */}
                <ScrollArea className="h-[280px]">
                    <div className="p-2 space-y-1" data-testid="friends-list">
                        {friends.map((friend) => (
                            <FriendItem
                                key={friend.id}
                                friend={friend}
                                onSendToFriend={onSendToFriend ?? (() => {})}
                                onOpenSettings={openSettings}
                            />
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
