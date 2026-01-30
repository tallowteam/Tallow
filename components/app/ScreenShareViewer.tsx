'use client';

/**
 * ScreenShareViewer Component
 *
 * Viewer component for receiving and displaying shared screen.
 * Supports fullscreen, PiP, and quality controls.
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
    VolumeX,
    PictureInPicture2,
    Download,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================================================
// Component Props
// ============================================================================

export interface ScreenShareViewerProps {
    stream: MediaStream | null;
    peerName?: string;
    showControls?: boolean;
    allowDownload?: boolean;
    allowPiP?: boolean;
    className?: string;
}

// ============================================================================
// Component
// ============================================================================

export const ScreenShareViewer = memo(function ScreenShareViewer({
    stream,
    peerName = 'Remote User',
    showControls = true,
    allowDownload = false,
    allowPiP = true,
    className = '',
}: ScreenShareViewerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPiP, setIsPiP] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [hasAudio, setHasAudio] = useState(false);
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

        // Check for audio tracks
        const audioTracks = stream.getAudioTracks();
        setHasAudio(audioTracks.length > 0);

        // Get video track dimensions
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            setVideoStats({
                width: settings.width || 0,
                height: settings.height || 0,
            });
        }

        return () => {
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [stream]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        };
    }, []);

    // Listen for PiP changes
    useEffect(() => {
        const handlePiPChange = () => {
            setIsPiP(!!document.pictureInPictureElement);
        };

        document.addEventListener('enterpictureinpicture', handlePiPChange);
        document.addEventListener('leavepictureinpicture', handlePiPChange);

        return () => {
            document.removeEventListener('enterpictureinpicture', handlePiPChange);
            document.removeEventListener('leavepictureinpicture', handlePiPChange);
        };
    }, []);

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
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                }
            }
        } catch (error) {
            console.error('Fullscreen error:', error);
            toast.error('Failed to toggle fullscreen');
        }
    };

    const togglePiP = async () => {
        if (!videoRef.current) {return;}

        try {
            if (!isPiP) {
                if (document.pictureInPictureEnabled) {
                    await videoRef.current.requestPictureInPicture();
                } else {
                    toast.error('Picture-in-Picture is not supported');
                }
            } else {
                await document.exitPictureInPicture();
            }
        } catch (error) {
            console.error('PiP error:', error);
            toast.error('Failed to toggle Picture-in-Picture');
        }
    };

    const toggleMute = () => {
        if (!videoRef.current) {return;}
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    };

    const downloadScreenshot = () => {
        if (!videoRef.current || !canvasRef.current) {return;}

        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                toast.error('Failed to create canvas context');
                return;
            }

            // Set canvas size to match video
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) {
                    toast.error('Failed to create screenshot');
                    return;
                }

                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `screen-share-${Date.now()}.png`;
                a.click();
                URL.revokeObjectURL(url);

                toast.success('Screenshot saved');
            }, 'image/png');
        } catch (error) {
            console.error('Screenshot error:', error);
            toast.error('Failed to take screenshot');
        }
    };

    // ==========================================================================
    // Render
    // ==========================================================================

    if (!stream) {
        return (
            <Card className={`w-full ${className}`}>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <Monitor className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Waiting for screen share...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`w-full ${className}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        {peerName}&apos;s Screen
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        {isPiP && <Badge variant="secondary">PiP</Badge>}
                        <Badge variant="default" className="bg-blue-500 animate-pulse">
                            Receiving
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-2">
                {/* Video Display */}
                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        className="w-full h-full object-contain"
                    />

                    {/* Hidden canvas for screenshots */}
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Stats Overlay */}
                    {videoStats.width > 0 && (
                        <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-mono">
                            {videoStats.width}x{videoStats.height}
                        </div>
                    )}

                    {/* Mute Indicator */}
                    {isMuted && hasAudio && (
                        <div className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded">
                            <VolumeX className="h-4 w-4" />
                        </div>
                    )}

                    {/* Fullscreen Indicator */}
                    {isFullscreen && (
                        <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                            Press ESC to exit fullscreen
                        </div>
                    )}
                </div>

                {/* Controls */}
                {showControls && (
                    <div className="flex flex-wrap items-center gap-2">
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

                        {allowPiP && (
                            <Button
                                onClick={togglePiP}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <PictureInPicture2 className="h-4 w-4" />
                                {isPiP ? 'Exit PiP' : 'Picture-in-Picture'}
                            </Button>
                        )}

                        {hasAudio && (
                            <Button
                                onClick={toggleMute}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                {isMuted ? (
                                    <>
                                        <VolumeX className="h-4 w-4" />
                                        Unmute
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="h-4 w-4" />
                                        Mute
                                    </>
                                )}
                            </Button>
                        )}

                        {allowDownload && (
                            <Button
                                onClick={downloadScreenshot}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Screenshot
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
});

ScreenShareViewer.displayName = 'ScreenShareViewer';

export default ScreenShareViewer;
