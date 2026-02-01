'use client';

import { useState, useEffect } from 'react';
import { Shield, Zap, Lock, AlertCircle, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
    PrivacyLevel,
    getPrivacyLevel,
    setPrivacyLevel,
    PRIVACY_LEVEL_INFO,
    getRelayRoutingManager,
} from '@/lib/privacy/relay-routing';
import { toast } from 'sonner';

interface PrivacyLevelSelectorProps {
    onLevelChange?: (level: PrivacyLevel) => void;
}

export function PrivacyLevelSelector({ onLevelChange }: PrivacyLevelSelectorProps) {
    const [currentLevel, setCurrentLevel] = useState<PrivacyLevel>('direct');
    const [_isChanging, setIsChanging] = useState(false);
    const [maxHops, setMaxHops] = useState(1);

    useEffect(() => {
        setCurrentLevel(getPrivacyLevel());
        const manager = getRelayRoutingManager();
        const config = manager.getConfig();
        setMaxHops(config.maxHops);
    }, []);

    const handleLevelChange = async (level: PrivacyLevel) => {
        setIsChanging(true);

        try {
            await setPrivacyLevel(level);
            setCurrentLevel(level);
            onLevelChange?.(level);

            toast.success(`Privacy level changed to: ${PRIVACY_LEVEL_INFO[level].name}`);
        } catch (_error) {
            toast.error('Failed to change privacy level');
        } finally {
            setIsChanging(false);
        }
    };

    const handleHopsChange = (value: number[]) => {
        const hops = value[0];
        if (hops === undefined) {return;}
        setMaxHops(hops);

        const manager = getRelayRoutingManager();
        manager.updateConfig({ maxHops: hops });
    };

    const levels: PrivacyLevel[] = ['direct', 'relay', 'multi-relay'];

    return (
        <div className="space-y-6">
            {/* Privacy Level Cards */}
            <div className="grid gap-4">
                {levels.map((level) => {
                    const info = PRIVACY_LEVEL_INFO[level];
                    const isSelected = currentLevel === level;

                    return (
                        <Card
                            key={level}
                            className={`p-4 cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-2 border-primary bg-primary/5'
                                    : 'border border-border hover:border-primary/50'
                            }`}
                            onClick={() => handleLevelChange(level)}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`
                                    w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                    ${isSelected ? 'bg-primary/20' : 'bg-secondary'}
                                `}>
                                    {info.icon}
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold">{info.name}</h3>
                                        <Badge
                                            variant={
                                                info.security === 'high'
                                                    ? 'default'
                                                    : info.security === 'medium'
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                            className="text-xs"
                                        >
                                            {info.security.toUpperCase()}
                                        </Badge>
                                        {isSelected && (
                                            <Badge className="bg-primary/20 text-primary border-0 text-xs">
                                                ACTIVE
                                            </Badge>
                                        )}
                                    </div>

                                    <p className="text-sm text-muted-foreground">
                                        {info.description}
                                    </p>

                                    <div className="flex items-center gap-4 pt-1">
                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Zap className="w-3.5 h-3.5" />
                                            <span className="text-muted-foreground">
                                                Speed: {level === 'direct' ? 'Fast' : level === 'relay' ? 'Medium' : 'Slow'}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-xs">
                                            <Shield className="w-3.5 h-3.5" />
                                            <span className="text-muted-foreground">
                                                Privacy: {info.security}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {isSelected && (
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground">
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Multi-Relay Hop Configuration */}
            {currentLevel === 'multi-relay' && (
                <Card className="p-4 bg-secondary/30 border-primary/20">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-primary" />
                            <h4 className="font-medium">Multi-Hop Configuration</h4>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label htmlFor="relay-hops-slider" className="text-sm text-muted-foreground">
                                    Number of relay hops
                                </label>
                                <span className="text-sm font-medium">
                                    {maxHops} hop{maxHops > 1 ? 's' : ''}
                                </span>
                            </div>

                            <Slider
                                id="relay-hops-slider"
                                value={[maxHops]}
                                onValueChange={handleHopsChange}
                                min={1}
                                max={3}
                                step={1}
                                className="w-full"
                            />

                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Faster</span>
                                <span>More Anonymous</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                <strong>Note:</strong> More hops provide better anonymity but increase latency.
                                Each hop adds approximately 100-200ms to connection time.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Info Banner */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/20/10 border border-white/20">
                <Info className="w-4 h-4 text-white mt-0.5 shrink-0" />
                <div className="text-xs text-muted-foreground">
                    <strong>Privacy Level Guide:</strong>
                    <ul className="mt-1 space-y-1 list-disc list-inside">
                        <li><strong>Direct:</strong> Fastest speed, your IP is visible to the peer</li>
                        <li><strong>Relay:</strong> Balanced privacy and speed, IP hidden via relay server</li>
                        <li><strong>Multi-Relay:</strong> Maximum anonymity with multiple hops (recommended for sensitive transfers)</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PrivacyLevelSelector;
