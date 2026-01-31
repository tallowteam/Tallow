'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, SwitchCamera, ImagePlus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import jsQR from 'jsqr';

interface QRScannerProps {
    onScan: (data: string) => void;
    active?: boolean;
}

/**
 * EUVEKA Form Styling Applied:
 * - Button height: 56px (h-14)
 * - Button border-radius: 60px (pill shape)
 * - Border colors: #e5dac7 (light) / #544a36 (dark)
 * - Focus ring: #b2987d accent
 * - Error states with EUVEKA colors
 */
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
        if (!mountedRef.current) {return;}

        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            animFrameRef.current = requestAnimationFrame(scanFrame);
            return;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {return;}

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
                    if (!mountedRef.current) {return;}
                }
                setScanning(true);
                scanFrame();
            }
        } catch (err: any) {
            if (!mountedRef.current) {return;}

            if (err.name === 'NotAllowedError') {
                setError('Camera access blocked. Check your browser settings to allow camera use.');
            } else if (err.name === 'NotFoundError') {
                setError('We couldn\'t find a camera. Try the file upload option instead.');
            } else if (err.name === 'NotReadableError') {
                setError('Camera is busy. Close other apps using the camera and try again.');
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
                setError('No QR code found. Make sure the code is clear and well-lit.');
                setTimeout(() => {
                    if (mountedRef.current) {setError(null);}
                }, 3000);
            }

            URL.revokeObjectURL(url);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            setError('Couldn\'t open that image. Try a different photo.');
            setTimeout(() => {
                if (mountedRef.current) {setError(null);}
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
        return undefined;
    }, [facingMode, active, scanning, startCamera]);

    // File input fallback UI (for non-secure contexts / HTTP over LAN)
    // EUVEKA styled
    if (useFileFallback) {
        return (
            <div className="flex flex-col items-center space-y-4">
                {/* Live region for file upload status (WCAG 4.1.3) */}
                <div
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                    className="sr-only"
                >
                    {error ? error : 'QR scanner ready. Use the button to take a photo or choose an image.'}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* EUVEKA styled drop zone */}
                <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-[#fefefc] dark:bg-[#191610] border-2 border-dashed border-[#e5dac7] dark:border-[#544a36] flex flex-col items-center justify-center space-y-4 p-6 transition-all duration-300 hover:border-[#b2987d]">
                    <div className="w-16 h-16 rounded-full bg-[#b2987d]/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-[#b2987d]" />
                    </div>

                    <p className="text-sm text-[#b2987d] text-center">
                        Camera needs a secure connection. Take a photo of the QR code instead.
                    </p>

                    {/* EUVEKA: 56px button height with pill shape */}
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="primary"
                        size="default"
                        leftIcon={<ImagePlus className="w-5 h-5" />}
                    >
                        Take Photo / Choose Image
                    </Button>
                </div>

                {/* EUVEKA styled error message */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                            role="alert"
                            className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                        >
                            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" aria-hidden="true" />
                            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                {error}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Hidden canvas for image processing */}
                <canvas ref={canvasRef} className="hidden" />

                <p className="text-sm text-[#b2987d] text-center">
                    Take a photo of a Tallow QR code
                </p>
            </div>
        );
    }

    // Error state with EUVEKA styling
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <CameraOff className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-sm text-[#b2987d]">{error}</p>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setError(null); startCamera(); }}
                >
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center space-y-3">
            {/* Live region for screen reader announcements (WCAG 4.1.3) */}
            <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
            >
                {scanning ? 'Scanning for QR code...' : 'QR scanner ready'}
            </div>

            {/* EUVEKA styled scanner frame */}
            <div className="relative w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden bg-[#191610] border-2 border-[#e5dac7] dark:border-[#544a36]">
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                    aria-label="QR code scanner - point your camera at a QR code to scan"
                >
                    <track kind="captions" src="" label="No captions available for live camera feed" />
                </video>
                {/* Scan overlay with EUVEKA accent colors */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-[15%] border-2 border-[#b2987d]/60 rounded-xl" />
                    <div className="absolute top-[15%] left-[15%] w-6 h-6 border-t-3 border-l-3 border-[#b2987d] rounded-tl-lg" />
                    <div className="absolute top-[15%] right-[15%] w-6 h-6 border-t-3 border-r-3 border-[#b2987d] rounded-tr-lg" />
                    <div className="absolute bottom-[15%] left-[15%] w-6 h-6 border-b-3 border-l-3 border-[#b2987d] rounded-bl-lg" />
                    <div className="absolute bottom-[15%] right-[15%] w-6 h-6 border-b-3 border-r-3 border-[#b2987d] rounded-br-lg" />
                </div>

                {/* Camera switch button - EUVEKA styled with 44px touch target for WCAG compliance */}
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute top-2 right-2 bg-[#191610]/60 hover:bg-[#191610]/80 active:bg-[#191610]/90 text-[#fefefc] rounded-full w-11 h-11 transition-colors"
                    onClick={toggleCamera}
                    aria-label={`Switch to ${facingMode === 'environment' ? 'front' : 'back'} camera`}
                >
                    <SwitchCamera className="w-5 h-5" aria-hidden="true" />
                </Button>
            </div>

            {/* Hidden canvas for frame processing */}
            <canvas ref={canvasRef} className="hidden" />

            <p className="text-sm text-[#b2987d] text-center">
                Point camera at a Tallow QR code
            </p>
        </div>
    );
}

export default QRScanner;
