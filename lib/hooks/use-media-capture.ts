'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { secureLog } from '../utils/secure-logger';

export type CaptureMode = 'photo' | 'video';
export type FacingMode = 'user' | 'environment';

export interface MediaConstraints {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export interface CapturedMedia {
  blob: Blob;
  type: 'photo' | 'video';
  dataUrl: string;
  timestamp: Date;
  duration?: number; // For videos, in seconds
  width?: number;
  height?: number;
}

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.0 to 1.0
}

interface UseMediaCaptureOptions {
  compressionOptions?: CompressionOptions;
  facingMode?: FacingMode;
}

interface UseMediaCaptureResult {
  stream: MediaStream | null;
  capturedMedia: CapturedMedia | null;
  isCapturing: boolean;
  isRecording: boolean;
  error: Error | null;
  permissionGranted: boolean;
  permissionDenied: boolean;
  deviceInfo: { hasCamera: boolean; hasMicrophone: boolean };
  startCamera: (mode: CaptureMode, options?: { facingMode?: FacingMode }) => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => Promise<CapturedMedia | null>;
  startVideoRecording: () => void;
  stopVideoRecording: () => Promise<CapturedMedia | null>;
  clearCapture: () => void;
  requestPermission: () => Promise<boolean>;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

/**
 * Hook for camera and video capture functionality
 * Handles getUserMedia, photo capture, and video recording
 */
export function useMediaCapture(options: UseMediaCaptureOptions = {}): UseMediaCaptureResult {
  const { compressionOptions = { maxWidth: 1920, maxHeight: 1080, quality: 0.85 } } = options;

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ hasCamera: false, hasMicrophone: false });

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const objectUrlsRef = useRef<string[]>([]);

  // Check available devices
  useEffect(() => {
    const checkDevices = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) {
          return;
        }

        const devices = await navigator.mediaDevices.enumerateDevices();
        setDeviceInfo({
          hasCamera: devices.some(device => device.kind === 'videoinput'),
          hasMicrophone: devices.some(device => device.kind === 'audioinput'),
        });
      } catch (err) {
        secureLog.error('Failed to enumerate devices:', err);
      }
    };

    checkDevices();
  }, []);

  // Cleanup stream and object URLs on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Revoke all created object URLs
      objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
  }, [stream]);

  const getUserFriendlyError = useCallback((err: unknown): string => {
    if (!(err instanceof Error)) {
      return 'An unknown error occurred';
    }

    const errorName = (err as DOMException).name || err.name;

    switch (errorName) {
      case 'NotAllowedError':
        return 'Camera access denied. Please allow camera permissions in your browser settings.';
      case 'NotFoundError':
        return 'No camera found. Please connect a camera and try again.';
      case 'NotReadableError':
        return 'Camera is already in use by another application. Please close other apps and try again.';
      case 'OverconstrainedError':
        return 'Camera does not support the requested settings. Trying with default settings...';
      case 'SecurityError':
        return 'Camera access requires a secure connection (HTTPS). Please use HTTPS or localhost.';
      case 'AbortError':
        return 'Camera access was aborted. Please try again.';
      case 'TypeError':
        return 'Invalid camera configuration. Please try again.';
      default:
        return err.message || 'Failed to access camera. Please check your permissions and try again.';
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setPermissionDenied(false);

      // Request permission by trying to get a stream
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      testStream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      return true;
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      setError(new Error(errorMessage));
      setPermissionGranted(false);

      if ((err as DOMException).name === 'NotAllowedError') {
        setPermissionDenied(true);
      }

      return false;
    }
  }, [getUserFriendlyError]);

  const startCamera = useCallback(async (
    mode: CaptureMode = 'photo',
    opts?: { facingMode?: FacingMode }
  ) => {
    setError(null);
    setIsCapturing(true);
    setPermissionDenied(false);

    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser. Please use a modern browser with HTTPS.');
      }

      const facingMode = opts?.facingMode || 'environment';

      const constraints: MediaConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
        },
        audio: mode === 'video', // Only request audio for video
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionGranted(true);

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;

        // Wait for video to be ready before playing
        try {
          await videoRef.current.play();
        } catch (playErr) {
          secureLog.warn('Auto-play failed, user interaction may be required:', playErr);
        }
      }
    } catch (err) {
      const errorMessage = getUserFriendlyError(err);
      const captureError = new Error(errorMessage);
      setError(captureError);
      setIsCapturing(false);
      setPermissionGranted(false);

      if ((err as DOMException).name === 'NotAllowedError') {
        setPermissionDenied(true);
      }

      throw captureError;
    }
  }, [getUserFriendlyError]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCapturing(false);
    setIsRecording(false);
  }, [stream]);

  const compressImage = useCallback((
    canvas: HTMLCanvasElement,
    options: CompressionOptions
  ): { canvas: HTMLCanvasElement; width: number; height: number } => {
    const { maxWidth = 1920, maxHeight = 1080 } = options;

    let { width, height } = canvas;

    // Calculate new dimensions maintaining aspect ratio
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;

      if (width > height) {
        width = Math.min(width, maxWidth);
        height = Math.round(width / aspectRatio);
      } else {
        height = Math.min(height, maxHeight);
        width = Math.round(height * aspectRatio);
      }

      // Create new canvas with compressed dimensions
      const compressedCanvas = document.createElement('canvas');
      compressedCanvas.width = width;
      compressedCanvas.height = height;

      const ctx = compressedCanvas.getContext('2d');
      if (ctx) {
        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, width, height);
        return { canvas: compressedCanvas, width, height };
      }
    }

    return { canvas, width, height };
  }, []);

  const capturePhoto = useCallback(async (): Promise<CapturedMedia | null> => {
    if (!stream || !videoRef.current) {
      setError(new Error('Camera not started'));
      return null;
    }

    try {
      const video = videoRef.current;

      // Ensure video is ready
      if (video.readyState < 2) {
        throw new Error('Camera is still loading. Please wait a moment and try again.');
      }

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Draw current video frame
      ctx.drawImage(video, 0, 0);

      // Apply compression
      const { canvas: finalCanvas, width, height } = compressImage(canvas, compressionOptions);

      const quality = compressionOptions.quality ?? 0.85;

      // Convert to blob with compression
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/jpeg',
          quality
        );
      });

      const dataUrl = finalCanvas.toDataURL('image/jpeg', quality);

      const captured: CapturedMedia = {
        blob,
        type: 'photo',
        dataUrl,
        timestamp: new Date(),
        width,
        height,
      };

      setCapturedMedia(captured);
      return captured;
    } catch (err) {
      const photoError = err instanceof Error ? err : new Error('Failed to capture photo');
      setError(photoError);
      return null;
    }
  }, [stream, compressionOptions, compressImage]);

  const startVideoRecording = useCallback(() => {
    if (!stream) {
      setError(new Error('Camera not started'));
      return;
    }

    try {
      chunksRef.current = [];

      // Check supported MIME types
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];

      const supportedType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

      if (!supportedType) {
        throw new Error('No supported video format found in this browser');
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      recordingStartTimeRef.current = Date.now();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (err) {
      const recordError = err instanceof Error ? err : new Error('Failed to start recording');
      setError(recordError);
    }
  }, [stream]);

  const stopVideoRecording = useCallback(async (): Promise<CapturedMedia | null> => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      return null;
    }

    return new Promise((resolve) => {
      mediaRecorder.onstop = async () => {
        const duration = (Date.now() - recordingStartTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });

        // Create object URL for preview
        const dataUrl = URL.createObjectURL(blob);
        objectUrlsRef.current.push(dataUrl);

        const captured: CapturedMedia = {
          blob,
          type: 'video',
          dataUrl,
          timestamp: new Date(),
          duration,
        };

        setCapturedMedia(captured);
        setIsRecording(false);
        resolve(captured);
      };

      mediaRecorder.stop();
    });
  }, []);

  const clearCapture = useCallback(() => {
    // Revoke any object URLs from previous captures
    if (capturedMedia?.type === 'video' && capturedMedia.dataUrl.startsWith('blob:')) {
      URL.revokeObjectURL(capturedMedia.dataUrl);
      objectUrlsRef.current = objectUrlsRef.current.filter(url => url !== capturedMedia.dataUrl);
    }

    setCapturedMedia(null);
    setError(null);
  }, [capturedMedia]);

  return {
    stream,
    capturedMedia,
    isCapturing,
    isRecording,
    error,
    permissionGranted,
    permissionDenied,
    deviceInfo,
    startCamera,
    stopCamera,
    capturePhoto,
    startVideoRecording,
    stopVideoRecording,
    clearCapture,
    requestPermission,
    videoRef,
  };
}

/**
 * Component ref helper for video element (for backward compatibility)
 */
export function useVideoRef(stream: MediaStream | null) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => secureLog.error('Video play error:', err));
    }
  }, [stream]);

  return videoRef;
}
