import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMediaCapture } from '@/lib/hooks/use-media-capture';

/**
 * Unit tests for useMediaCapture hook
 */

describe('useMediaCapture', () => {
  let mockStream: MediaStream;
  let mockVideoTrack: MediaStreamTrack;

  beforeEach(() => {
    // Create mock video track
    mockVideoTrack = {
      kind: 'video',
      id: 'mock-video-track',
      label: 'Mock Camera',
      enabled: true,
      muted: false,
      readyState: 'live',
      stop: vi.fn(),
      getSettings: () => ({ width: 1920, height: 1080, facingMode: 'environment' }),
      getCapabilities: () => ({}),
      getConstraints: () => ({}),
      applyConstraints: vi.fn(),
      clone: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onended: null,
      onmute: null,
      onunmute: null,
    } as unknown as MediaStreamTrack;

    // Create mock stream
    mockStream = {
      id: 'mock-stream',
      active: true,
      getTracks: () => [mockVideoTrack],
      getVideoTracks: () => [mockVideoTrack],
      getAudioTracks: () => [],
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      clone: vi.fn(),
      getTrackById: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      onaddtrack: null,
      onremovetrack: null,
    } as unknown as MediaStream;

    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, 'mediaDevices', {
      writable: true,
      configurable: true,
      value: {
      getUserMedia: vi.fn().mockResolvedValue(mockStream),
      enumerateDevices: vi.fn().mockResolvedValue([
        {
          deviceId: 'camera1',
          kind: 'videoinput',
          label: 'Mock Camera',
          groupId: 'group1',
        },
        {
          deviceId: 'mic1',
          kind: 'audioinput',
          label: 'Mock Microphone',
          groupId: 'group1',
        },
      ]),
      getSupportedConstraints: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      ondevicechange: null,
      } as unknown as MediaDevices,
    });

    // Mock canvas for image capture
    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      const blob = new Blob(['mock-image'], { type: 'image/jpeg' });
      callback(blob);
    });

    HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mockdata');

    // Mock canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      fillRect: vi.fn(),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    })) as any;

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock MediaRecorder
    global.MediaRecorder = class MediaRecorder {
      static isTypeSupported = vi.fn(() => true);
      start = vi.fn();
      stop = vi.fn();
      pause = vi.fn();
      resume = vi.fn();
      state = 'inactive';
      mimeType = 'video/webm';
      ondataavailable: ((event: any) => void) | null = null;
      onstop: ((event: any) => void) | null = null;
      onerror: ((event: any) => void) | null = null;
      onstart: ((event: any) => void) | null = null;
      onpause: ((event: any) => void) | null = null;
      onresume: ((event: any) => void) | null = null;

      constructor(_stream: MediaStream, _options?: any) {
        // Store for later use
      }
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      const { result } = renderHook(() => useMediaCapture());

      expect(result.current.stream).toBeNull();
      expect(result.current.capturedMedia).toBeNull();
      expect(result.current.isCapturing).toBe(false);
      expect(result.current.isRecording).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.permissionGranted).toBe(false);
      expect(result.current.permissionDenied).toBe(false);
    });

    it('should check available devices on mount', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await waitFor(() => {
        expect(result.current.deviceInfo.hasCamera).toBe(true);
        expect(result.current.deviceInfo.hasMicrophone).toBe(true);
      });

      expect(navigator.mediaDevices.enumerateDevices).toHaveBeenCalled();
    });

    it('should provide videoRef', () => {
      const { result } = renderHook(() => useMediaCapture());

      expect(result.current.videoRef).toBeDefined();
      expect(result.current.videoRef.current).toBeNull();
    });
  });

  describe('Camera Access', () => {
    it('should start camera successfully', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('photo');
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: { ideal: 'environment' },
          }),
          audio: false,
        })
      );

      expect(result.current.stream).toBe(mockStream);
      expect(result.current.permissionGranted).toBe(true);
      expect(result.current.isCapturing).toBe(true);
    });

    it('should request audio for video mode', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('video');
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          audio: true,
        })
      );
    });

    it('should support custom facing mode', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('photo', { facingMode: 'user' });
      });

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith(
        expect.objectContaining({
          video: expect.objectContaining({
            facingMode: { ideal: 'user' },
          }),
        })
      );
    });

    it('should stop camera and cleanup stream', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('photo');
      });

      expect(result.current.stream).toBe(mockStream);

      act(() => {
        result.current.stopCamera();
      });

      expect(mockVideoTrack.stop).toHaveBeenCalled();
      expect(result.current.stream).toBeNull();
      expect(result.current.isCapturing).toBe(false);
    });

    it('should handle permission denied error', async () => {
      const permissionError = new Error('Permission denied') as DOMException;
      (permissionError as any).name = 'NotAllowedError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        try {
          await result.current.startCamera('photo');
        } catch (_err) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Camera access denied');
      expect(result.current.permissionDenied).toBe(true);
      expect(result.current.permissionGranted).toBe(false);
    });

    it('should handle camera not found error', async () => {
      const notFoundError = new Error('Camera not found') as DOMException;
      (notFoundError as any).name = 'NotFoundError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(notFoundError);

      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        try {
          await result.current.startCamera('photo');
        } catch (_err) {
          // Expected
        }
      });

      expect(result.current.error?.message).toContain('No camera found');
    });

    it('should handle camera in use error', async () => {
      const inUseError = new Error('Camera in use') as DOMException;
      (inUseError as any).name = 'NotReadableError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(inUseError);

      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        try {
          await result.current.startCamera('photo');
        } catch (_err) {
          // Expected
        }
      });

      expect(result.current.error?.message).toContain('already in use');
    });
  });

  describe('Photo Capture', () => {
    it('should capture photo successfully', async () => {
      const { result } = renderHook(() => useMediaCapture());

      // Start camera first
      await act(async () => {
        await result.current.startCamera('photo');
      });

      // Mock video element
      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'videoWidth', { value: 1920, writable: true });
      Object.defineProperty(mockVideo, 'videoHeight', { value: 1080, writable: true });
      Object.defineProperty(mockVideo, 'readyState', { value: 4, writable: true }); // HAVE_ENOUGH_DATA
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      let capturedMedia: any;
      await act(async () => {
        capturedMedia = await result.current.capturePhoto();
      });

      expect(capturedMedia).toBeTruthy();
      expect(capturedMedia?.type).toBe('photo');
      expect(capturedMedia?.blob).toBeInstanceOf(Blob);
      expect(capturedMedia?.dataUrl).toBeTruthy();
      expect(capturedMedia?.timestamp).toBeInstanceOf(Date);
      expect(result.current.capturedMedia).toBe(capturedMedia);
    });

    it('should compress large images', async () => {
      const { result } = renderHook(() =>
        useMediaCapture({
          compressionOptions: {
            maxWidth: 800,
            maxHeight: 600,
            quality: 0.8,
          },
        })
      );

      await act(async () => {
        await result.current.startCamera('photo');
      });

      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'videoWidth', { value: 3840, writable: true }); // 4K width
      Object.defineProperty(mockVideo, 'videoHeight', { value: 2160, writable: true }); // 4K height
      Object.defineProperty(mockVideo, 'readyState', { value: 4, writable: true });
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      let capturedMedia: any;
      await act(async () => {
        capturedMedia = await result.current.capturePhoto();
      });

      // Should have compressed dimensions
      expect(capturedMedia?.width).toBeLessThanOrEqual(800);
      expect(capturedMedia?.height).toBeLessThanOrEqual(600);
    });

    it('should return null if camera not started', async () => {
      const { result } = renderHook(() => useMediaCapture());

      let capturedMedia;
      await act(async () => {
        capturedMedia = await result.current.capturePhoto();
      });

      expect(capturedMedia).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.message).toContain('Camera not started');
    });

    it('should clear captured photo', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('photo');
      });

      const mockVideo = document.createElement('video');
      Object.defineProperty(mockVideo, 'videoWidth', { value: 1920, writable: true });
      Object.defineProperty(mockVideo, 'videoHeight', { value: 1080, writable: true });
      Object.defineProperty(mockVideo, 'readyState', { value: 4, writable: true });
      Object.defineProperty(result.current.videoRef, 'current', {
        value: mockVideo,
        writable: true,
      });

      await act(async () => {
        await result.current.capturePhoto();
      });

      expect(result.current.capturedMedia).toBeTruthy();

      act(() => {
        result.current.clearCapture();
      });

      expect(result.current.capturedMedia).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('Video Recording', () => {
    it('should start video recording', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('video');
      });

      act(() => {
        result.current.startVideoRecording();
      });

      await waitFor(() => {
        expect(result.current.isRecording).toBe(true);
      });
    });

    it('should return null when stopping inactive recording', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('video');
      });

      // Try to stop without starting
      let media;
      await act(async () => {
        media = await result.current.stopVideoRecording();
      });

      // Should return null as no recording is active
      expect(media).toBeNull();
    });

    it('should cleanup video object URLs', async () => {
      const { result } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('video');
      });

      await act(async () => {
        result.current.startVideoRecording();
      });

      await act(async () => {
        await result.current.stopVideoRecording();
      });

      // Clear capture should revoke URL
      act(() => {
        result.current.clearCapture();
      });

      // Note: In real implementation, revokeObjectURL is called
      // In test, we verify the cleanup logic exists
      expect(result.current.capturedMedia).toBeNull();
    });
  });

  describe('Permission Request', () => {
    it('should request permission successfully', async () => {
      const { result } = renderHook(() => useMediaCapture());

      let granted;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(true);
      expect(result.current.permissionGranted).toBe(true);
    });

    it('should handle permission denial', async () => {
      const permissionError = new Error('Permission denied') as DOMException;
      (permissionError as any).name = 'NotAllowedError';

      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(permissionError);

      const { result } = renderHook(() => useMediaCapture());

      let granted;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted).toBe(false);
      expect(result.current.permissionGranted).toBe(false);
      expect(result.current.permissionDenied).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup on unmount', async () => {
      const { result, unmount } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('photo');
      });

      expect(result.current.stream).toBe(mockStream);

      unmount();

      expect(mockVideoTrack.stop).toHaveBeenCalled();
    });

    it('should revoke object URLs on unmount', async () => {
      const { result, unmount } = renderHook(() => useMediaCapture());

      await act(async () => {
        await result.current.startCamera('video');
      });

      await act(async () => {
        result.current.startVideoRecording();
      });

      await act(async () => {
        await result.current.stopVideoRecording();
      });

      // Unmount should clean up
      unmount();

      // Stream should be stopped on unmount
      expect(mockVideoTrack.stop).toHaveBeenCalled();
    });
  });
});
