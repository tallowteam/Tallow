'use client';

/**
 * ScreenShare Component
 *
 * Main screen sharing control panel with quality settings and controls.
 * Provides UI for starting, stopping, and configuring screen sharing.
 */

import { useState } from 'react';
import { secureLog } from '@/lib/utils/secure-logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Monitor,
    MonitorOff,
    Pause,
    Play,
    Settings,
    Volume2,
    VolumeX,
    RefreshCw,
    Info,
} from 'lucide-react';
import { useScreenShare } from '@/lib/hooks/use-screen-share';
import { ScreenShareQuality, FrameRate } from '@/lib/webrtc/screen-sharing';
import { formatBitrate, formatResolution } from '@/lib/webrtc/screen-sharing';
import { toast } from 'sonner';
import { PQCStatusBadge } from '@/components/ui/pqc-status-badge';
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';

// ============================================================================
// Component Props
// ============================================================================

export interface ScreenShareProps {
    peerConnection?: RTCPeerConnection;
    pqcManager?: PQCTransferManager | null;
    onStreamReady?: (stream: MediaStream) => void;
    onStopped?: () => void;
    showStats?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export function ScreenShare({
    peerConnection,
    pqcManager,
    onStreamReady,
    onStopped,
    showStats = true,
}: ScreenShareProps) {
    const {
        state,
        stats,
        stream,
        startSharing,
        stopSharing,
        pauseSharing,
        resumeSharing,
        switchSource,
        updateQuality,
        updateFrameRate,
        toggleAudio,
    } = useScreenShare();

    const [showSettings, setShowSettings] = useState(false);
    const isPQCProtected = pqcManager?.isReady() ?? false;

    // ==========================================================================
    // Event Handlers
    // ==========================================================================

    const handleStart = async () => {
        try {
            // Check if PQC connection is available
            if (peerConnection && !isPQCProtected) {
                secureLog.warn('[ScreenShare] Starting without PQC protection. Consider establishing PQC connection first.');
            }

            await startSharing(peerConnection);

            if (isPQCProtected) {
                toast.success('Screen sharing started with quantum-resistant encryption');
            } else {
                toast.success('Screen sharing started');
            }

            if (stream && onStreamReady) {
                onStreamReady(stream);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to start screen sharing';
            toast.error(message);
        }
    };

    const handleStop = () => {
        stopSharing();
        toast.info('Screen sharing stopped');
        onStopped?.();
    };

    const handlePause = () => {
        if (state.isPaused) {
            resumeSharing();
            toast.info('Screen sharing resumed');
        } else {
            pauseSharing();
            toast.info('Screen sharing paused');
        }
    };

    const handleSwitch = async () => {
        try {
            await switchSource();
            toast.success('Screen source switched');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to switch source';
            toast.error(message);
        }
    };

    const handleQualityChange = async (quality: ScreenShareQuality) => {
        try {
            await updateQuality(quality);
            toast.success(`Quality changed to ${quality}`);
        } catch (_error) {
            toast.error('Failed to change quality');
        }
    };

    const handleFrameRateChange = async (fps: string) => {
        try {
            await updateFrameRate(parseInt(fps) as FrameRate);
            toast.success(`Frame rate changed to ${fps} FPS`);
        } catch (_error) {
            toast.error('Failed to change frame rate');
        }
    };

    const handleAudioToggle = async (enabled: boolean) => {
        try {
            await toggleAudio(enabled);
            toast.success(enabled ? 'Audio sharing enabled' : 'Audio sharing disabled');
        } catch (_error) {
            toast.error('Failed to toggle audio');
        }
    };

    // ==========================================================================
    // Render
    // ==========================================================================

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Monitor className="h-5 w-5" />
                            Screen Share
                        </CardTitle>
                        <CardDescription>
                            Share your screen with end-to-end encryption
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {state.isSharing && (
                            <Badge variant="default" className="bg-green-500">
                                Sharing
                            </Badge>
                        )}
                        {state.isSharing && (
                            <PQCStatusBadge
                                isProtected={isPQCProtected}
                                compact
                                showWarning={!isPQCProtected}
                            />
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Error Alert */}
                {state.error && (
                    <Alert variant="destructive">
                        <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                )}

                {/* Control Buttons */}
                <div className="flex flex-wrap gap-2">
                    {!state.isSharing ? (
                        <Button onClick={handleStart} className="flex items-center gap-2">
                            <Monitor className="h-4 w-4" />
                            Start Sharing
                        </Button>
                    ) : (
                        <>
                            <Button onClick={handleStop} variant="destructive" className="flex items-center gap-2">
                                <MonitorOff className="h-4 w-4" />
                                Stop Sharing
                            </Button>

                            <Button onClick={handlePause} variant="outline" className="flex items-center gap-2">
                                {state.isPaused ? (
                                    <>
                                        <Play className="h-4 w-4" />
                                        Resume
                                    </>
                                ) : (
                                    <>
                                        <Pause className="h-4 w-4" />
                                        Pause
                                    </>
                                )}
                            </Button>

                            <Button onClick={handleSwitch} variant="outline" className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4" />
                                Switch Source
                            </Button>
                        </>
                    )}

                    <Button
                        onClick={() => setShowSettings(!showSettings)}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="space-y-4 rounded-lg border p-4">
                        <h3 className="font-semibold">Screen Share Settings</h3>

                        {/* Quality Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="quality">Quality</Label>
                            <Select
                                value={state.quality}
                                onValueChange={(value) => handleQualityChange(value as ScreenShareQuality)}
                                disabled={state.isSharing}
                            >
                                <SelectTrigger id="quality">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="720p">720p (1280x720)</SelectItem>
                                    <SelectItem value="1080p">1080p (1920x1080)</SelectItem>
                                    <SelectItem value="4k">4K (3840x2160)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Frame Rate Selector */}
                        <div className="space-y-2">
                            <Label htmlFor="framerate">Frame Rate</Label>
                            <Select
                                value={state.frameRate.toString()}
                                onValueChange={handleFrameRateChange}
                                disabled={state.isSharing}
                            >
                                <SelectTrigger id="framerate">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 FPS</SelectItem>
                                    <SelectItem value="30">30 FPS</SelectItem>
                                    <SelectItem value="60">60 FPS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Audio Toggle */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {state.shareAudio ? (
                                    <Volume2 className="h-4 w-4" />
                                ) : (
                                    <VolumeX className="h-4 w-4" />
                                )}
                                <Label htmlFor="audio">Share System Audio</Label>
                            </div>
                            <Switch
                                id="audio"
                                checked={state.shareAudio}
                                onCheckedChange={handleAudioToggle}
                                disabled={state.isSharing}
                            />
                        </div>

                        {/* Info about audio */}
                        {state.shareAudio && (
                            <div className="flex items-start gap-2 rounded-md bg-[#fefefc]/10 p-2 text-sm dark:bg-[#fefefc]/20">
                                <Info className="h-4 w-4 mt-0.5 text-[#fefefc]" />
                                <p className="text-[#fefefc] dark:text-[#fefefc]">
                                    System audio sharing is supported in Chrome and Edge browsers.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Statistics */}
                {showStats && state.isSharing && stats && (
                    <div className="space-y-2 rounded-lg border p-4">
                        <h3 className="font-semibold">Statistics</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Resolution</p>
                                <p className="font-mono">
                                    {formatResolution(stats.resolution.width, stats.resolution.height)}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Frame Rate</p>
                                <p className="font-mono">{stats.fps.toFixed(1)} FPS</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Bitrate</p>
                                <p className="font-mono">{formatBitrate(stats.bitrate)}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Latency</p>
                                <p className="font-mono">{(stats.latency * 1000).toFixed(0)} ms</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Privacy Notice */}
                {state.isSharing && (
                    <div className={`flex items-start gap-2 rounded-md p-2 text-sm ${
                        isPQCProtected
                            ? 'bg-green-50 dark:bg-green-950'
                            : 'bg-yellow-50 dark:bg-yellow-950'
                    }`}>
                        <Info className={`h-4 w-4 mt-0.5 ${
                            isPQCProtected ? 'text-green-500' : 'text-yellow-500'
                        }`} />
                        <div className={isPQCProtected ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                            <p className="font-medium mb-1">
                                {isPQCProtected
                                    ? 'Quantum-Resistant Screen Sharing Active'
                                    : 'Standard Encrypted Screen Sharing'}
                            </p>
                            <p className="text-xs">
                                {isPQCProtected
                                    ? 'Your screen is protected with ML-KEM-768 + X25519 hybrid encryption. Secure against quantum computers.'
                                    : 'Your screen is being shared with end-to-end encryption. Only the connected peer can view your screen.'}
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default ScreenShare;
