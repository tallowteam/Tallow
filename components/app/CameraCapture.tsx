'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Camera,
  Video,
  X,
  RotateCcw,
  Check,
  Circle,
  Square,
  SwitchCamera,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useMediaCapture, CapturedMedia, CaptureMode, FacingMode } from '@/lib/hooks/use-media-capture';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (media: CapturedMedia) => void;
  mode?: CaptureMode;
  title?: string;
  description?: string;
}

export function CameraCapture({
  open,
  onOpenChange,
  onCapture,
  mode = 'photo',
  title = 'Capture Media',
  description = 'Take a photo or record a video to send',
}: CameraCaptureProps) {
  const [captureMode, setCaptureMode] = useState<CaptureMode>(mode);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    stream,
    capturedMedia,
    isCapturing: _isCapturing,
    isRecording,
    error,
    permissionDenied,
    deviceInfo,
    startCamera,
    stopCamera,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    clearCapture,
    videoRef,
  } = useMediaCapture({
    compressionOptions: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85,
    },
  });

  // Start camera when dialog opens
  useEffect(() => {
    if (open && !stream && !capturedMedia) {
      handleStartCamera();
    }

    // Cleanup when dialog closes
    return () => {
      if (!open && stream) {
        stopCamera();
        clearCapture();
      }
    };
  }, [open]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  const handleStartCamera = async () => {
    try {
      await startCamera(captureMode, { facingMode });
    } catch (err) {
      toast.error('Failed to start camera', {
        description: err instanceof Error ? err.message : 'Please check camera permissions',
      });
    }
  };

  const handleCapturePhoto = async () => {
    const media = await capturePhoto();
    if (media) {
      toast.success('Photo captured!', {
        description: `${media.width}x${media.height} - ${(media.blob.size / 1024).toFixed(0)}KB`,
      });
    } else {
      toast.error('Failed to capture photo');
    }
  };

  const handleStartRecording = () => {
    startVideoRecording();
    toast.info('Recording started');
  };

  const handleStopRecording = async () => {
    const media = await stopVideoRecording();
    if (media) {
      toast.success(`Video recorded (${Math.floor(media.duration || 0)}s)`);
    }
  };

  const handleRetake = () => {
    clearCapture();
    handleStartCamera();
  };

  const handleSend = () => {
    if (capturedMedia) {
      onCapture(capturedMedia);
      clearCapture();
      stopCamera();
      onOpenChange(false);
      toast.success('Media ready to send');
    }
  };

  const handleCancel = () => {
    clearCapture();
    stopCamera();
    onOpenChange(false);
  };

  const toggleFacingMode = async () => {
    setIsSwitchingCamera(true);
    const newMode: FacingMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    // Stop current camera
    stopCamera();

    // Small delay to ensure camera is fully released
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // Restart camera with new facing mode
      await startCamera(captureMode, { facingMode: newMode });
    } catch (err) {
      toast.error('Failed to switch camera', {
        description: err instanceof Error ? err.message : 'Try again',
      });
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] p-0 overflow-hidden"
        aria-describedby="camera-capture-description"
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription id="camera-capture-description">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="relative bg-black aspect-video">
          {!capturedMedia ? (
            // Camera view
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                aria-label="Camera preview - live camera feed for capturing photos or videos"
              >
                <track kind="captions" src="" label="No captions available for live camera feed" />
              </video>

              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  <span className="font-mono font-semibold">{formatTime(recordingTime)}</span>
                </div>
              )}

              {/* Camera controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between gap-4">
                  {/* Mode toggle */}
                  <div className="flex gap-2">
                    <Button
                      variant={captureMode === 'photo' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCaptureMode('photo')}
                      disabled={isRecording || isSwitchingCamera}
                      className="text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                    <Button
                      variant={captureMode === 'video' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCaptureMode('video')}
                      disabled={isRecording || isSwitchingCamera}
                      className="text-white"
                    >
                      <Video className="w-4 h-4 mr-2" />
                      Video
                    </Button>
                  </div>

                  {/* Capture button */}
                  <div className="flex items-center justify-center">
                    {captureMode === 'photo' ? (
                      <Button
                        size="lg"
                        onClick={handleCapturePhoto}
                        disabled={!stream || isSwitchingCamera}
                        className="w-16 h-16 rounded-full p-0"
                        aria-label="Capture photo"
                      >
                        <Circle className="w-8 h-8" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={!stream || isSwitchingCamera}
                        variant={isRecording ? 'destructive' : 'default'}
                        className={cn(
                          'w-16 h-16 rounded-full p-0',
                          isRecording && 'animate-pulse'
                        )}
                        aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                      >
                        {isRecording ? (
                          <Square className="w-6 h-6" />
                        ) : (
                          <Circle className="w-8 h-8 fill-current" />
                        )}
                      </Button>
                    )}
                  </div>

                  {/* Camera switch */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleFacingMode}
                    disabled={!stream || isRecording || isSwitchingCamera || !deviceInfo.hasCamera}
                    className="text-white"
                    aria-label="Switch camera"
                  >
                    {isSwitchingCamera ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <SwitchCamera className="w-5 h-5" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Error state */}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4">
                  <Card className="p-6 max-w-md text-center space-y-4">
                    <div className="flex justify-center">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                    <p className="text-destructive font-medium">{error.message}</p>

                    {permissionDenied && (
                      <div className="text-sm text-muted-foreground space-y-2">
                        <p>To enable camera access:</p>
                        <ol className="text-left list-decimal list-inside space-y-1">
                          <li>Click the camera icon in your browser's address bar</li>
                          <li>Select "Allow" for camera permissions</li>
                          <li>Reload the page if needed</li>
                        </ol>
                      </div>
                    )}

                    {!permissionDenied && (
                      <Button onClick={handleStartCamera} variant="outline">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    )}
                  </Card>
                </div>
              )}

              {/* Loading state */}
              {!stream && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-white text-sm">Starting camera...</p>
                </div>
              )}

              {/* Camera switching state */}
              {isSwitchingCamera && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-white text-sm">Switching camera...</p>
                </div>
              )}
            </>
          ) : (
            // Preview captured media
            <>
              {capturedMedia.type === 'photo' ? (
                <img
                  src={capturedMedia.dataUrl}
                  alt="Camera capture preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={capturedMedia.dataUrl}
                  controls
                  className="w-full h-full object-contain"
                  aria-label="Recorded video preview - playback of your captured video"
                >
                  <track kind="captions" src="" label="No captions available for recorded video" />
                </video>
              )}

              {/* Preview controls */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={handleRetake}
                    className="text-white"
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Retake
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSend}
                    className="min-w-32"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Use This
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 flex justify-between items-center">
          <Button variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <div className="text-sm text-muted-foreground">
            {capturedMedia ? (
              <span>
                {capturedMedia.type === 'photo'
                  ? `${capturedMedia.width}x${capturedMedia.height}`
                  : `${Math.floor(capturedMedia.duration || 0)}s`
                }
                {' - '}
                {(capturedMedia.blob.size / 1024).toFixed(0)}KB
              </span>
            ) : captureMode === 'photo' ? (
              'Tap to capture'
            ) : isRecording ? (
              'Recording...'
            ) : (
              'Tap to start recording'
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CameraCapture;
