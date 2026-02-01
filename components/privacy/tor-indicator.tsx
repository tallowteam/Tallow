'use client';

import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { TorDetectionResult } from '@/lib/privacy/tor-support';

interface TorIndicatorProps {
    result: TorDetectionResult | null;
    className?: string;
}

export function TorIndicator({ result, className = '' }: TorIndicatorProps) {
    if (!result || (!result.isTorBrowser && !result.isTorNetwork)) {
        return null;
    }

    const getConfidenceColor = () => {
        switch (result.confidence) {
            case 'confirmed':
                return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/50';
            case 'high':
                return 'bg-white/20/20 text-white border-white/30';
            case 'medium':
                return 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/50';
            default:
                return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/50';
        }
    };

    const getIcon = () => {
        if (result.confidence === 'confirmed') {
            return <CheckCircle2 className="w-3 h-3" />;
        }
        if (result.confidence === 'high' || result.confidence === 'medium') {
            return <Shield className="w-3 h-3" />;
        }
        return <AlertCircle className="w-3 h-3" />;
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Badge
                        className={`${getConfidenceColor()} border gap-1.5 ${className}`}
                    >
                        {getIcon()}
                        <span className="text-xs font-medium">
                            Tor {result.isTorNetwork ? 'Network' : 'Browser'}
                        </span>
                    </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-2">
                        <p className="font-semibold text-sm">
                            Tor Detected ({result.confidence} confidence)
                        </p>

                        {result.detectionMethods.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground">Detection methods:</p>
                                <ul className="text-xs space-y-0.5">
                                    {result.detectionMethods.map((method, idx) => (
                                        <li key={idx} className="text-muted-foreground">
                                            • {method}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="pt-2 border-t border-border">
                            <p className="text-xs text-muted-foreground">
                                Relay-only mode is automatically enabled for optimal privacy.
                            </p>
                        </div>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

export default TorIndicator;
