'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Monitor,
    Smartphone,
    Laptop,
    Globe,
    Star,
    StarOff,
    Send,
    Zap,
    Shield
} from 'lucide-react';
import { Device } from '@/lib/types';
import { cn } from '@/lib/utils';

interface DeviceCardProps {
    device: Device;
    onSelect?: (device: Device) => void;
    onToggleFavorite?: (device: Device) => void;
    isSelected?: boolean;
    showSecurityBadge?: boolean;
}

/**
 * Custom comparison function for DeviceCard
 * Only re-render when device data or selection state changes
 * This prevents expensive re-renders in large device lists
 */
function areDevicePropsEqual(
    prevProps: DeviceCardProps,
    nextProps: DeviceCardProps
): boolean {
    const prev = prevProps.device;
    const next = nextProps.device;

    // Compare device properties that affect rendering
    return (
        prev.id === next.id &&
        prev.name === next.name &&
        prev.isOnline === next.isOnline &&
        prev.isFavorite === next.isFavorite &&
        prev.platform === next.platform &&
        prev.ip === next.ip &&
        prev.avatar === next.avatar &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.showSecurityBadge === nextProps.showSecurityBadge &&
        // Callback reference equality
        prevProps.onSelect === nextProps.onSelect &&
        prevProps.onToggleFavorite === nextProps.onToggleFavorite
    );
}

function getPlatformIcon(platform: Device['platform']) {
    switch (platform) {
        case 'android':
        case 'ios':
            return Smartphone;
        case 'windows':
        case 'macos':
        case 'linux':
            return Laptop;
        case 'web':
            return Globe;
        default:
            return Monitor;
    }
}

function getPlatformLabel(platform: Device['platform']): string {
    const labels: Record<Device['platform'], string> = {
        windows: 'Windows',
        macos: 'macOS',
        linux: 'Linux',
        android: 'Android',
        ios: 'iOS',
        web: 'Web'
    };
    return labels[platform] || 'Unknown';
}

function getPlatformGradient(platform: Device['platform']): string {
    switch (platform) {
        case 'macos':
        case 'ios':
            return 'from-gray-600 to-gray-800 dark:from-gray-400 dark:to-gray-600';
        case 'android':
            return 'from-green-500 to-emerald-600';
        case 'windows':
            return 'from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-600';
        case 'linux':
            return 'from-orange-500 to-amber-600';
        case 'web':
            return 'from-purple-500 to-violet-600';
        default:
            return 'from-gray-500 to-gray-700 dark:from-gray-400 dark:to-gray-600';
    }
}

/**
 * DeviceCard Component - Memoized for React 18 performance optimization
 * Prevents unnecessary re-renders when parent list updates but this device hasn't changed
 */
export const DeviceCard = memo(function DeviceCard({
    device,
    onSelect,
    onToggleFavorite,
    isSelected,
    showSecurityBadge = true
}: DeviceCardProps) {
    const PlatformIcon = getPlatformIcon(device.platform);
    const isOnline = device.isOnline;

    return (
        <Card
            role="button"
            tabIndex={0}
            aria-pressed={isSelected}
            aria-label={`${device.name}, ${getPlatformLabel(device.platform)}, ${device.isOnline ? 'online' : 'offline'}${isSelected ? ', selected' : ''}`}
            onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
                    e.preventDefault();
                    onSelect(device);
                }
            }}
            variant={isSelected ? 'elevated' : 'default'}
            hoverGlow={isOnline}
            hoverLift={isOnline}
            interactive
            className={cn(
                'p-4 sm:p-5 group relative overflow-hidden',
                !isOnline && 'opacity-60',
                isSelected && 'ring-2 ring-[#fefefc]/50'
            )}
            onClick={() => onSelect?.(device)}
        >
            {/* Subtle gradient overlay on hover */}
            <div
                className={cn(
                    'absolute inset-0 opacity-0 transition-opacity duration-300',
                    'bg-gradient-to-br from-[#fefefc]/5 to-transparent',
                    'group-hover:opacity-100',
                    isSelected && 'opacity-100'
                )}
                aria-hidden="true"
            />

            <div className="relative flex items-center gap-4">
                {/* Avatar with Platform Gradient */}
                <div className="relative shrink-0">
                    <Avatar className="w-14 h-14 ring-2 ring-white/10 dark:ring-white/5">
                        {device.avatar ? (
                            <AvatarImage src={device.avatar} alt={device.name} />
                        ) : null}
                        <AvatarFallback
                            className={cn(
                                'bg-gradient-to-br text-white font-semibold text-lg',
                                getPlatformGradient(device.platform)
                            )}
                        >
                            {device.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>

                    {/* Online Status Indicator - Pulsing for online */}
                    <div
                        className={cn(
                            'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full',
                            'border-[2.5px] border-white dark:border-[#111111]',
                            'transition-all duration-300',
                            isOnline
                                ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                                : 'bg-gray-400 dark:bg-gray-600'
                        )}
                        role="status"
                        aria-label={isOnline ? 'Online' : 'Offline'}
                    >
                        {isOnline && (
                            <span
                                className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"
                                aria-hidden="true"
                            />
                        )}
                    </div>
                </div>

                {/* Device Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                            {device.name}
                        </h4>
                        {device.isFavorite && (
                            <Star
                                className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0"
                                aria-label="Favorite device"
                            />
                        )}
                        {showSecurityBadge && isOnline && (
                            <div
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#fefefc]/10 dark:bg-[#fefefc]/20"
                                title="End-to-end encrypted - only you and this device can read transfers"
                            >
                                <Shield className="w-3 h-3 text-[#fefefc]" aria-hidden="true" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <div className={cn(
                            'flex items-center justify-center w-6 h-6 rounded-md',
                            'bg-gray-100 dark:bg-white/5'
                        )}>
                            <PlatformIcon className="w-3.5 h-3.5" aria-hidden="true" />
                        </div>
                        <span className="font-medium">{getPlatformLabel(device.platform)}</span>
                        {isOnline && device.ip && (
                            <>
                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                                    {device.ip}
                                </span>
                            </>
                        )}
                    </div>

                    {/* Device ID */}
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 dark:text-gray-500">ID:</span>
                        <code className="font-mono text-xs tracking-wider text-[#fefefc] dark:text-[#fefefc] bg-[#fefefc]/5 dark:bg-[#fefefc]/10 px-1.5 py-0.5 rounded">
                            {device.id.slice(0, 12).toUpperCase()}
                        </code>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {onToggleFavorite && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleFavorite(device);
                            }}
                            className={cn(
                                'h-10 w-10 rounded-lg transition-all duration-200',
                                'hover:bg-amber-500/10 hover:text-amber-500',
                                'dark:hover:bg-amber-500/20',
                                device.isFavorite && 'text-amber-500'
                            )}
                            aria-label={device.isFavorite ? `Remove ${device.name} from favorites` : `Add ${device.name} to favorites`}
                        >
                            {device.isFavorite ? (
                                <Star className="w-5 h-5 fill-current" aria-hidden="true" />
                            ) : (
                                <StarOff className="w-5 h-5" aria-hidden="true" />
                            )}
                        </Button>
                    )}

                    {onSelect && isOnline && (
                        <Button
                            size="sm"
                            className={cn(
                                'h-10 px-4 rounded-lg font-medium',
                                'bg-[#fefefc] hover:bg-[#e5e5e3] text-gray-900',
                                'shadow-[0_2px_8px_-2px_rgba(254,254,252,0.4)]',
                                'hover:shadow-[0_4px_12px_-2px_rgba(254,254,252,0.5)]',
                                'transition-all duration-200',
                                'group/btn'
                            )}
                            aria-label={`Send files to ${device.name}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(device);
                            }}
                        >
                            <Zap className="w-4 h-4 mr-1.5 group-hover/btn:animate-pulse" aria-hidden="true" />
                            <span>Send</span>
                        </Button>
                    )}

                    {onSelect && !isOnline && (
                        <Button
                            size="sm"
                            variant="outline"
                            disabled
                            className="h-10 px-4 rounded-lg font-medium opacity-50"
                            aria-label={`${device.name} is offline`}
                        >
                            <Send className="w-4 h-4 mr-1.5" aria-hidden="true" />
                            <span>Offline</span>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}, areDevicePropsEqual);

DeviceCard.displayName = 'DeviceCard';

export default DeviceCard;
