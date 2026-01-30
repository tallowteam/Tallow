'use client';

/**
 * ScreenSharePreview Component
 *
 * Local preview of the shared screen.
 * Shows what the user is currently sharing with controls.
 */

import { useEffect, useRef, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Monitor,
    Maximize2,
    Minimize2,
    Volume2,
    Eye,
    EyeOff,
} from 'lucide-react';

// ============================================================================
// Component Props
// ============================================================================

export interface ScreenSharePreviewProps {
    stream: MediaStream | null;
    isSharing: boolean;
    isPaused: boolean;
    showControls?: boolean;
    showStats?: boolean;
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const ScreenSharePreview = memo(function ScreenSharePreview({
    stream,
    isSharing,
    isPaused,
    showControls = true,
    showStats = true,
    className = '',
}: ScreenSharePreviewProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAudioEnabled, setIsAudioEnabled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [videoStats, setVideoStats] = useState({
        width: 0,
        height: 0,
    });

    // ==========================================================================
    // Effects
    // ==========================================================================

    // Attach stream to video element
    useEffect(() => {
        if (!videoRef.current || !stream) {return;}

        videoRef.current.srcObject = stream;

        // Get video track dimensions
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            setVideoStats({
                width: settings.width || 0,
                height: settings.height || 0,
            });
        }

        // Check for audio tracks
        const hasAudio = stream.getAudioTracks().length > 0;
        setIsAudioEnabled(hasAudio);

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream]);

    // ==========================================================================
    // Event Handlers
    // ==========================================================================

    const toggleFullscreen = async () => {
        if (!videoRef.current) {return;}

        try {
            if (!isFullscreen) {
                if (videoRef.current.requestFullscreen) {
                    await videoRef.current.requestFullscreen();
                } else if ((videoRef.current as any).webkitRequestFullscreen) {
                    await (videoRef.current as any).webkitRequestFullscreen();
                }
                setIsFullscreen(true);
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
        }
    };

    const toggleVisibility = () => {
        setIsVisible(!isVisible);
    };

    // ==========================================================================
    // Render
    // ==========================================================================

    if (!isSharing) {
        return null;
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        Your Screen (Preview)
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isPaused && <Badge variant="secondary">Paused</Badge>}
                        <Badge variant="default" className="bg-red-500 animate-pulse">
                            Live
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                {/* Video Preview */}
                {isVisible && (
                    <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                        <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-contain"
                        />

                        {/* Overlay when paused */}
                        {isPaused && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                <div className="text-center text-white">
                                    <Monitor className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Screen sharing paused</p>
                                </div>
                            </div>
                        )}

                        {/* Stats Overlay */}
                        {showStats && videoStats.width > 0 && (
                            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                                {videoStats.width}x{videoStats.height}
                            </div>
                        )}

                        {/* Audio Indicator */}
                        {isAudioEnabled && (
                            <div className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded">
                                <Volume2 className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                )}

                {/* Controls */}
                {showControls && (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={toggleVisibility}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                        >
                            {isVisible ? (
                                <>
                                    <EyeOff className="h-4 w-4" />
                                    Hide Preview
                                </>
                            ) : (
                                <>
                                    <Eye className="h-4 w-4" />
                                    Show Preview
                                </>
                            )}
                        </Button>

                        {isVisible && (
                            <Button
                                onClick={toggleFullscreen}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                {isFullscreen ? (
                                    <>
                                        <Minimize2 className="h-4 w-4" />
                                        Exit Fullscreen
                                    </>
                                ) : (
                                    <>
                                        <Maximize2 className="h-4 w-4" />
                                        Fullscreen
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                )}

                {/* Hidden state message */}
                {!isVisible && (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        <Monitor className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Preview hidden</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

ScreenSharePreview.displayName = 'ScreenSharePreview';

export default ScreenSharePreview;
