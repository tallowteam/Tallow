'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Eye, Globe, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { PrivacyWarning } from '@/components/privacy/privacy-warning';
import { TorIndicator } from '@/components/privacy/tor-indicator';
import { PrivacyLevelSelector } from '@/components/privacy/privacy-level-selector';
import { ConnectionPrivacyStatus } from '@/components/privacy/connection-privacy-status';
import { PrivacySettingsPanel } from '@/components/privacy/privacy-settings-panel';
import {
    getVPNLeakDetector,
    VPNDetectionResult,
} from '@/lib/privacy/vpn-leak-detection';
import {
    getTorDetector,
    TorDetectionResult,
    autoConfigureForTor,
} from '@/lib/privacy/tor-support';

export default function PrivacySettingsPage() {
    const [isChecking, setIsChecking] = useState(false);
    const [vpnResult, setVpnResult] = useState<VPNDetectionResult | null>(null);
    const [torResult, setTorResult] = useState<TorDetectionResult | null>(null);
    const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);

    useEffect(() => {
        performInitialCheck();
    }, []);

    const performInitialCheck = async () => {
        setIsChecking(true);

        try {
            // Check for VPN/IP leaks
            const vpnDetector = getVPNLeakDetector();
            const vpnCheck = await vpnDetector.performPrivacyCheck();
            setVpnResult(vpnCheck);

            // Check for Tor
            const torDetector = getTorDetector();
            const torCheck = await torDetector.detectTor();
            setTorResult(torCheck);

            // Auto-configure if Tor detected
            if (torCheck.isTorBrowser || torCheck.isTorNetwork) {
                await autoConfigureForTor();
            }

            setLastCheckTime(new Date());
        } catch (_error) {
            toast.error('Privacy check failed');
        } finally {
            setIsChecking(false);
        }
    };

    const handleRefreshCheck = async () => {
        setIsChecking(true);

        try {
            const vpnDetector = getVPNLeakDetector();
            vpnDetector.clearCache();

            const vpnCheck = await vpnDetector.performPrivacyCheck(false);
            setVpnResult(vpnCheck);

            const torDetector = getTorDetector();
            torDetector.clearCache();

            const torCheck = await torDetector.detectTor(false);
            setTorResult(torCheck);

            setLastCheckTime(new Date());
            toast.success('Privacy check completed');
        } catch (_error) {
            toast.error('Privacy check failed');
        } finally {
            setIsChecking(false);
        }
    };

    const formatLastCheckTime = () => {
        if (!lastCheckTime) {return 'Never';}

        const diff = Date.now() - lastCheckTime.getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);

        if (minutes < 1) {return 'Just now';}
        if (minutes === 1) {return '1 minute ago';}
        if (minutes < 60) {return `${minutes} minutes ago`;}

        return lastCheckTime.toLocaleTimeString();
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/app/settings">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="heading-sm">Privacy & Anonymity</h1>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Protect your identity and prevent IP leaks
                                </p>
                            </div>
                        </div>

                        {torResult && (torResult.isTorBrowser || torResult.isTorNetwork) && (
                            <TorIndicator result={torResult} />
                        )}
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Privacy Check Status */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Eye className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">Privacy Check</h2>
                                    <p className="text-xs text-muted-foreground">
                                        Last checked: {formatLastCheckTime()}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleRefreshCheck}
                                disabled={isChecking}
                                size="sm"
                                className="gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                                {isChecking ? 'Checking...' : 'Refresh'}
                            </Button>
                        </div>

                        {isChecking && (
                            <div className="space-y-2">
                                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary animate-pulse" style={{ width: '60%' }} />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Checking for VPN leaks and anonymity features...
                                </p>
                            </div>
                        )}

                        {!isChecking && vpnResult && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="p-3 rounded-lg bg-secondary/50">
                                        <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                                        <p className={`text-lg font-bold ${
                                            vpnResult.riskLevel === 'low' ? 'text-green-500' :
                                            vpnResult.riskLevel === 'medium' ? 'text-amber-500' :
                                            vpnResult.riskLevel === 'high' ? 'text-orange-500' :
                                            'text-red-500'
                                        }`}>
                                            {vpnResult.riskLevel.toUpperCase()}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-secondary/50">
                                        <p className="text-xs text-muted-foreground mb-1">WebRTC</p>
                                        <p className={`text-lg font-bold ${
                                            vpnResult.hasWebRTCLeak ? 'text-red-500' : 'text-green-500'
                                        }`}>
                                            {vpnResult.hasWebRTCLeak ? 'LEAK' : 'SECURE'}
                                        </p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-secondary/50">
                                        <p className="text-xs text-muted-foreground mb-1">VPN/Proxy</p>
                                        <p className={`text-lg font-bold ${
                                            vpnResult.isVPNLikely ? 'text-amber-500' : 'text-[#fefefc]'
                                        }`}>
                                            {vpnResult.isVPNLikely ? 'DETECTED' : 'NOT DETECTED'}
                                        </p>
                                    </div>
                                </div>

                                {vpnResult.publicIP && (
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                                        <span className="text-sm text-muted-foreground">Public IP:</span>
                                        <code className="text-sm font-mono">
                                            {vpnResult.publicIP.substring(0, 10)}...
                                        </code>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Privacy Warnings */}
                    {vpnResult && (vpnResult.riskLevel !== 'low') && (
                        <PrivacyWarning
                            result={vpnResult}
                            onDismiss={() => {}}
                            onConfigureSettings={() => {}}
                        />
                    )}

                    {/* Privacy Level Selection */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Privacy Level</h2>
                                <p className="text-xs text-muted-foreground">
                                    Choose how your connections are protected
                                </p>
                            </div>
                        </div>

                        <PrivacyLevelSelector
                            onLevelChange={(level) => {
                                toast.success(`Privacy level changed to: ${level}`);
                            }}
                        />
                    </Card>

                    {/* Current Connection Status */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Globe className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">Connection Privacy</h2>
                                <p className="text-xs text-muted-foreground">
                                    Real-time connection privacy status
                                </p>
                            </div>
                        </div>

                        <ConnectionPrivacyStatus className="w-full justify-center py-2" />
                    </Card>

                    {/* Metadata Stripping Settings */}
                    <PrivacySettingsPanel />

                    {/* Privacy Tips */}
                    <Card className="p-6 rounded-xl border border-border bg-card">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Privacy Best Practices
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Use Relay Mode with VPNs</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Always enable relay-only mode when using a VPN to prevent WebRTC IP leaks.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Tor Browser Optimization</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Tor Browser users are automatically configured for optimal privacy and security.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Multi-Hop for Sensitive Files</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Use multi-hop relay routing when transferring highly sensitive or confidential files.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                                <div>
                                    <p className="font-medium text-sm">Regular Privacy Checks</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Run privacy checks regularly, especially after changing networks or VPN servers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Tor Usage Guide */}
                    {torResult && (torResult.isTorBrowser || torResult.isTorNetwork) && (
                        <Card className="p-6 rounded-xl border border-purple-500/50 bg-purple-500/5">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-purple-500" />
                                Tor Browser Detected
                            </h2>

                            <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                    Tallow has automatically optimized settings for Tor Browser usage:
                                </p>

                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span>Relay-only mode enabled</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span>WebRTC IP leaks prevented</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span>Extended connection timeouts for Tor latency</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                        <span>Increased retry attempts</span>
                                    </li>
                                </ul>

                                <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                                    <p className="text-xs text-muted-foreground">
                                        <strong>Note:</strong> Transfers over Tor may be slower due to network latency.
                                        Consider using multi-hop relay for maximum anonymity.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
            </main>
        </div>
    );
}
