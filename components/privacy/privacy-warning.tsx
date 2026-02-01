'use client';

import { useState } from 'react';
import { AlertTriangle, Shield, X, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VPNDetectionResult } from '@/lib/privacy/vpn-leak-detection';
import { setPrivacyLevel } from '@/lib/privacy/relay-routing';
import { toast } from 'sonner';

interface PrivacyWarningProps {
    result: VPNDetectionResult;
    onDismiss?: () => void;
    onConfigureSettings?: () => void;
}

export function PrivacyWarning({ result, onDismiss, onConfigureSettings }: PrivacyWarningProps) {
    const [dismissed, setDismissed] = useState(false);

    // Don't show if dismissed or no issues
    if (dismissed || result.riskLevel === 'low') {
        return null;
    }

    const handleEnableRelayMode = async () => {
        try {
            await setPrivacyLevel('relay');
            toast.success('Relay-only mode enabled for maximum privacy');
            setDismissed(true);
        } catch (_error) {
            toast.error('Failed to enable relay mode');
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        onDismiss?.();
    };

    // Color scheme based on risk level
    const colors = {
        low: 'border-white/30 bg-white/20/10',
        medium: 'border-amber-500/50 bg-amber-500/10',
        high: 'border-orange-500/50 bg-orange-500/10',
        critical: 'border-red-500/50 bg-red-500/10',
    };

    const iconColors = {
        low: 'text-white',
        medium: 'text-amber-500',
        high: 'text-orange-500',
        critical: 'text-red-500',
    };

    const badgeColors = {
        low: 'bg-white/20/20 text-white',
        medium: 'bg-amber-500/20 text-amber-700 dark:text-amber-400',
        high: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
        critical: 'bg-red-500/20 text-red-700 dark:text-red-400',
    };

    return (
        <Card className={`p-4 rounded-xl border ${colors[result.riskLevel]} relative`}>
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleDismiss}
                aria-label="Dismiss privacy warning"
            >
                <X className="w-4 h-4" aria-hidden="true" />
            </Button>

            <div className="flex items-start gap-3 pr-8">
                <AlertTriangle className={`w-6 h-6 shrink-0 mt-0.5 ${iconColors[result.riskLevel]}`} />

                <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Privacy Warning</h3>
                        <Badge className={`${badgeColors[result.riskLevel]} border-0 text-xs`}>
                            {result.riskLevel.toUpperCase()} RISK
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        {result.hasWebRTCLeak && (
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    <strong>WebRTC IP Leak Detected:</strong> Your real IP address may be exposed even when using a VPN or proxy.
                                </p>
                            </div>
                        )}

                        {result.isVPNLikely && (
                            <div className="flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                <p className="text-sm text-muted-foreground">
                                    <strong>VPN/Proxy Detected:</strong> Enable relay-only mode to prevent IP leaks.
                                </p>
                            </div>
                        )}

                        {result.leakedIPs.length > 0 && (
                            <div className="flex items-start gap-2">
                                <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">
                                    {result.leakedIPs.length} IP address{result.leakedIPs.length > 1 ? 'es' : ''} detected in WebRTC candidates
                                </p>
                            </div>
                        )}
                    </div>

                    {result.recommendations.length > 0 && (
                        <div className="space-y-1.5 pl-4 border-l-2 border-current/20">
                            {result.recommendations.slice(0, 2).map((rec, idx) => (
                                <p key={idx} className="text-xs text-muted-foreground">
                                    {rec}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            size="sm"
                            onClick={handleEnableRelayMode}
                            className="gap-2"
                        >
                            <Shield className="w-4 h-4" />
                            Enable Relay Mode
                        </Button>

                        {onConfigureSettings && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onConfigureSettings}
                                className="gap-2"
                            >
                                <Settings className="w-4 h-4" />
                                Configure
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default PrivacyWarning;
