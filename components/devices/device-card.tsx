'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Monitor, Smartphone, Laptop, Globe, Star, StarOff, Send } from 'lucide-react';
import { Device } from '@/lib/types';

interface DeviceCardProps {
    device: Device;
    onSelect?: (device: Device) => void;
    onToggleFavorite?: (device: Device) => void;
    isSelected?: boolean;
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

export function DeviceCard({ device, onSelect, onToggleFavorite, isSelected }: DeviceCardProps) {
    const PlatformIcon = getPlatformIcon(device.platform);

    return (
        <Card
            className={`p-3 sm:p-4 transition-all cursor-pointer hover:border-primary/50 active:bg-primary/5 ${isSelected
                ? 'border-primary bg-primary/5'
                : 'rounded-xl border border-border bg-card'
                }`}
            onClick={() => onSelect?.(device)}
        >
            <div className="flex items-center gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="relative">
                    <Avatar className="w-12 h-12">
                        {device.avatar ? (
                            <AvatarImage src={device.avatar} alt={device.name} />
                        ) : null}
                        <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground">
                            {device.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    {/* Online Indicator */}
                    <div
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${device.isOnline ? 'bg-green-500' : 'bg-muted'
                            }`}
                    />
                </div>

                {/* Device Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold truncate">{device.name}</h4>
                        {device.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <PlatformIcon className="w-4 h-4" />
                            <span>{getPlatformLabel(device.platform)}</span>
                            {device.isOnline && device.ip && (
                                <>
                                    <span>•</span>
                                    <span className="font-mono text-xs">{device.ip}</span>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>ID:</span>
                            <code className="font-mono text-xs text-primary/80">
                                {device.id.slice(0, 12).toUpperCase()}
                            </code>
                        </div>
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
                            className="h-10 w-10 sm:h-9 sm:w-9"
                        >
                            {device.isFavorite ? (
                                <Star className="w-5 h-5 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                            ) : (
                                <StarOff className="w-5 h-5 sm:w-4 sm:h-4" />
                            )}
                        </Button>
                    )}
                    {onSelect && (
                        <Button
                            size="sm"
                            className="shrink-0 h-10 sm:h-9"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(device);
                            }}
                        >
                            <Send className="w-4 h-4 mr-1" />
                            <span className="hidden sm:inline">Send</span>
                            <span className="sm:hidden">Send</span>
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

export default DeviceCard;
