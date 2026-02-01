'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock, Unlock, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { getRelayRoutingManager, ConnectionPrivacyInfo } from '@/lib/privacy/relay-routing';

interface ConnectionPrivacyStatusProps {
    className?: string;
}

export function ConnectionPrivacyStatus({ className = '' }: ConnectionPrivacyStatusProps) {
    const [privacyInfo, setPrivacyInfo] = useState<ConnectionPrivacyInfo | null>(null);

    useEffect(() => {
        const manager = getRelayRoutingManager();
        const info = manager.getConnectionPrivacyInfo();
        setPrivacyInfo(info);

        // Update periodically
        const interval = setInterval(() => {
            const updatedInfo = manager.getConnectionPrivacyInfo();
            setPrivacyInfo(updatedInfo);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (!privacyInfo) {
        return null;
    }

    const getStatusColor = () => {
        if (!privacyInfo.ipMasked) {
            return 'text-amber-500';
        }
        if (privacyInfo.activeHops >= 2) {
            return 'text-green-500';
        }
        return 'text-white';
    };

    const getStatusIcon = () => {
        if (!privacyInfo.ipMasked) {
            return <Unlock className="w-4 h-4" />;
        }
        if (privacyInfo.activeHops >= 2) {
            return <Lock className="w-4 h-4" />;
        }
        return <Shield className="w-4 h-4" />;
    };

    const getStatusText = () => {
        if (!privacyInfo.ipMasked) {
            return 'Direct Connection';
        }
        if (privacyInfo.activeHops >= 2) {
            return 'Multi-Hop Relay';
        }
        return 'Relay Protected';
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        className={`gap-1.5 border bg-card hover:bg-card/80 cursor-help ${className}`}
                    >
                        <span className={getStatusColor()}>
                            {getStatusIcon()}
                        </span>
                        <span className="text-xs font-medium">
                            {getStatusText()}
                        </span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-sm">
                    <div className="space-y-3">
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Connection Privacy Status</h4>
                            <p className="text-xs text-muted-foreground">
                                {privacyInfo.ipMasked
                                    ? 'Your IP address is hidden from the peer.'
                                    : 'Your IP address is visible to the peer.'}
                            </p>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Privacy Level:</span>
                                <Badge variant="outline" className="text-xs">
                                    {privacyInfo.privacyLevel}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Active Hops:</span>
                                <span className="text-xs font-medium">
                                    {privacyInfo.activeHops} {privacyInfo.activeHops === 1 ? 'hop' : 'hops'}
                                </span>
                            </div>

                            {privacyInfo.relaysUsed.length > 0 && (
                                <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs text-muted-foreground">Relays:</span>
                                    <div className="text-right">
                                        {privacyInfo.relaysUsed.map((relay, idx) => (
                                            <div key={idx} className="text-xs font-medium">
                                                {relay}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Est. Latency:
                                </span>
                                <span className="text-xs font-medium">
                                    {privacyInfo.estimatedLatency}ms
                                </span>
                            </div>
                        </div>

                        {!privacyInfo.ipMasked && (
                            <div className="pt-2 border-t border-border">
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                    Consider enabling relay mode in settings for better privacy.
                                </p>
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default ConnectionPrivacyStatus;
