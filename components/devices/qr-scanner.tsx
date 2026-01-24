'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, SwitchCamera, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsQR from 'jsqr';

interface QRScannerProps {
    onScan: (data: string) => void;
    active?: boolean;
}

export function QRScanner({ onScan, active = true }: QRScannerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animFrameRef = useRef<number>(0);
    const mountedRef = useRef(true);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const [scanning, setScanning] = useState(false);
    const [useFileFallback, setUseFileFallback] = useState(false);
    const lastScanRef = useRef<string>('');
    const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Check if camera API is available (requires secure context)
    const isCameraAvailable = typeof navigator !== 'undefined' &&
        typeof navigator.mediaDevices !== 'undefined' &&
        typeof navigator.mediaDevices.getUserMedia === 'function';

    const stopCamera = useCallback(() => {
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = 0;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setScanning(false);
    }, []);

    const scanFrame = useCallback(() => {
        if (!mountedRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data !== lastScanRef.current) {
            lastScanRef.current = code.data;
            onScan(code.data);

            // Clear previous timeout if exists
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
            scanTimeoutRef.current = setTimeout(() => {
                if (mountedRef.current) {
                    lastScanRef.current = '';
                }
                scanTimeoutRef.current = null;
            }, 3000);
        }

        if (mountedRef.current) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
        }
    }, [onScan]);

    const startCamera = useCallback(async () => {
        if (!isCameraAvailable) {
            setUseFileFallback(true);
            return;
        }

        try {
            setError(null);

            // Stop existing stream before requesting new one
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }

            // Small delay to ensure previous stream is fully released
            await new Promise(resolve => setTimeout(resolve, 100));

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                }
            });

            if (!mountedRef.current) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                try {
                    await videoRef.current.play();
                } catch {
                    // play() may fail if component unmounted
                    if (!mountedRef.current) return;
                }
                setScanning(true);
                scanFrame();
            }
        } catch (err: any) {
            if (!mountedRef.current) return;

            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is in use by another application.');
            } else if (err.name === 'OverconstrainedError') {
                // Try without facing mode constraint
                try {
                    const fallbackStream = await navigator.mediaDevices.getUserMedia({
                        video: { width: { ideal: 640 }, height: { ideal: 480 } }
                    });
                    if (!mountedRef.current) {
                        fallbackStream.getTracks().forEach(t => t.stop());
                        return;
                    }
                    streamRef.current = fallbackStream;
                    if (videoRef.current) {
                        videoRef.current.srcObject = fallbackStream;
                        await videoRef.current.play();
                        setScanning(true);
                        scanFrame();
                    }
                } catch {
                    setUseFileFallback(true);
                }
            } else {
                // Likely insecure context - fall back to file input
                setUseFileFallback(true);
            }
        }
    }, [facingMode, isCameraAvailable, scanFrame]);

    // Process an image file (from camera capture or gallery)
    const processImage = useCallback((file: File) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) {
                URL.revokeObjectURL(url);
                return;
            }

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) {
                URL.revokeObjectURL(url);
                return;
            }

            // Scale down large images for faster processing
            const maxDim = 1024;
            let w = img.width;
            let h = img.height;
            if (w > maxDim || h > maxDim) {
                const scale = maxDim / Math.max(w, h);
                w = Math.floor(w * scale);
                h = Math.floor(h * scale);
            }

            canvas.width = w;
            canvas.height = h;
            ctx.drawImage(img, 0, 0, w, h);

            const imageData = ctx.getImageData(0, 0, w, h);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'attemptBoth',
            });

            if (code && code.data) {
                onScan(code.data);
            } else {
                setError('No QR code found in image. Try again.');
                setTimeout(() => {
                    if (mountedRef.current) setError(null);
                }, 3000);
            }

            URL.revokeObjectURL(url);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            setError('Failed to load image. Try a different file.');
            setTimeout(() => {
                if (mountedRef.current) setError(null);
            }, 3000);
        };

        img.src = url;
    }, [onScan]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processImage(file);
        }
        // Reset input so same file can be selected again
        e.target.value = '';
    }, [processImage]);

    const toggleCamera = useCallback(() => {
        stopCamera();
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    }, [stopCamera]);

    // Track mount state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
                scanTimeoutRef.current = null;
            }
        };
    }, []);

    // Start/stop camera based on active prop
    useEffect(() => {
        if (active) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [active, startCamera, stopCamera]);

    // Restart camera when facing mode changes (after stopCamera in toggleCamera)
    useEffect(() => {
        if (active && !scanning && mountedRef.current) {
            // Delay to let the previous stream fully release
            const timer = setTimeout(() => {
                if (mountedRef.current && active) {
                    startCamera();
                }
            }, 200);
            return () => clearTimeout(timer);
        }
    }, [facingMode, active, scanning, startCamera]);

    // File input fallback UI (for non-secure contexts / HTTP over LAN)
    if (useFileFallback) {
        return (
            <div className="flex flex-col items-center space-y-4">
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />

                <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-muted/30 border border-border flex flex-col items-center justify-center space-y-4 p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                        Camera requires HTTPS. Use the button below to take a photo of the QR code.
                    </p>

                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-2"
                    >
                        <ImagePlus className="w-4 h-4" />
                        Take Photo / Choose Image
                    </Button>
                </div>

                {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                )}

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />

                <p className="text-sm text-muted-foreground text-center">
                    Take a photo of a Tallow QR code
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <CameraOff className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={() => { setError(null); startCamera(); }}>
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-3">
            <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-black border border-border">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                />
                {/* Scan overlay */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-[15%] border-2 border-primary/60 rounded-xl" />
                    <div className="absolute top-[15%] left-[15%] w-6 h-6 border-t-3 border-l-3 border-primary rounded-tl-lg" />
                    <div className="absolute top-[15%] right-[15%] w-6 h-6 border-t-3 border-r-3 border-primary rounded-tr-lg" />
                    <div className="absolute bottom-[15%] left-[15%] w-6 h-6 border-b-3 border-l-3 border-primary rounded-bl-lg" />
                    <div className="absolute bottom-[15%] right-[15%] w-6 h-6 border-b-3 border-r-3 border-primary rounded-br-lg" />
                </div>

                {/* Camera switch button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8"
                    onClick={toggleCamera}
                >
                    <SwitchCamera className="w-4 h-4" />
                </Button>
            </div>

            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />

            <p className="text-sm text-muted-foreground text-center">
                Point camera at a Tallow QR code
            </p>
        </div>
    );
}

export default QRScanner;
