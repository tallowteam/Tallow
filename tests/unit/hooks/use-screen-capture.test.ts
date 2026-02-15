/**
 * Unit tests for useScreenCapture hook
 * Tests screen sharing and capture functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScreenCapture } from '@/lib/hooks/use-screen-capture';
import type {
  ScreenShareState,
  ScreenShareStats,
} from '@/lib/webrtc/screen-sharing';

// Mock screen sharing manager
let mockStateCallback: ((state: ScreenShareState) => void) | null = null;
let mockStatsCallback: ((stats: ScreenShareStats) => void) | null = null;

const mockScreenSharingManager = {
  startSharing: vi.fn().mockResolvedValue(new MediaStream()),
  stopSharing: vi.fn(),
  pauseSharing: vi.fn(),
  resumeSharing: vi.fn(),
  switchSource: vi.fn().mockResolvedValue(undefined),
  updateQuality: vi.fn().mockResolvedValue(undefined),
  updateFrameRate: vi.fn().mockResolvedValue(undefined),
  toggleAudio: vi.fn().mockResolvedValue(undefined),
  markAsPQCProtected: vi.fn(),
  getPQCStatus: vi.fn(() => ({
    protected: false,
    algorithm: null,
    warning: null,
  })),
  setStateCallback: vi.fn((callback) => {
    mockStateCallback = callback;
  }),
  setStatsCallback: vi.fn((callback) => {
    mockStatsCallback = callback;
  }),
  dispose: vi.fn(),
};

vi.mock('@/lib/webrtc/screen-sharing', () => ({
  ScreenSharingManager: vi.fn().mockImplementation(function MockScreenSharingManager() {
    return mockScreenSharingManager;
  }),
  isScreenShareSupported: vi.fn(() => true),
}));

// Mock getDisplayMedia
const mockGetDisplayMedia = vi.fn().mockResolvedValue(new MediaStream());
global.navigator = {
  mediaDevices: {
    getDisplayMedia: mockGetDisplayMedia,
  },
} as any;

describe('useScreenCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStateCallback = null;
    mockStatsCallback = null;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useScreenCapture());

      expect(result.current.isCapturing).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.stream).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.stats).toBeNull();
    });

    it('should initialize with custom quality', () => {
      const { result } = renderHook(() =>
        useScreenCapture({ quality: '720p', frameRate: 60 })
      );

      expect(result.current.quality).toBe('720p');
      expect(result.current.frameRate).toBe(60);
    });

    it('should set up state callback', () => {
      renderHook(() => useScreenCapture());

      expect(mockScreenSharingManager.setStateCallback).toHaveBeenCalled();
    });

    it('should set up stats callback', () => {
      renderHook(() => useScreenCapture());

      expect(mockScreenSharingManager.setStatsCallback).toHaveBeenCalled();
    });

    it('should check screen share support', () => {
      const { result } = renderHook(() => useScreenCapture());

      expect(result.current.isSupported).toBe(true);
    });
  });

  describe('Start Capture', () => {
    it('should start screen capture', async () => {
      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.startCapture();
      });

      expect(mockScreenSharingManager.startSharing).toHaveBeenCalled();
      expect(stream).toBeInstanceOf(MediaStream);
    });

    it('should start capture with peer connection', async () => {
      const { result } = renderHook(() => useScreenCapture());
      const mockPeerConnection = {} as RTCPeerConnection;

      await act(async () => {
        await result.current.startCapture(mockPeerConnection);
      });

      expect(mockScreenSharingManager.startSharing).toHaveBeenCalledWith(mockPeerConnection);
    });

    it('should update stream state on capture start', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.stream).toBeInstanceOf(MediaStream);
    });

    it('should handle capture start error', async () => {
      mockScreenSharingManager.startSharing.mockRejectedValueOnce(
        new Error('Permission denied')
      );

      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.startCapture();
      });

      expect(stream).toBeNull();
      expect(result.current.error).toBe('Permission denied');
    });

    it('should return null if manager not initialized', async () => {
      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.startCapture();
      });

      expect(stream).toBeInstanceOf(MediaStream);
    });
  });

  describe('Stop Capture', () => {
    it('should stop screen capture', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.startCapture();
      });

      act(() => {
        result.current.stopCapture();
      });

      expect(mockScreenSharingManager.stopSharing).toHaveBeenCalled();
      expect(result.current.stream).toBeNull();
      expect(result.current.stats).toBeNull();
    });
  });

  describe('Pause and Resume', () => {
    it('should pause capture', () => {
      const { result } = renderHook(() => useScreenCapture());

      act(() => {
        result.current.pauseCapture();
      });

      expect(mockScreenSharingManager.pauseSharing).toHaveBeenCalled();
    });

    it('should resume capture', () => {
      const { result } = renderHook(() => useScreenCapture());

      act(() => {
        result.current.resumeCapture();
      });

      expect(mockScreenSharingManager.resumeSharing).toHaveBeenCalled();
    });

    it('should compute isActive correctly', () => {
      const { result } = renderHook(() => useScreenCapture());

      // Trigger state update
      act(() => {
        mockStateCallback?.({
          isSharing: true,
          isPaused: false,
          quality: '1080p',
          frameRate: 30,
          shareAudio: false,
          streamId: 'stream-123',
          error: null,
        });
      });

      expect(result.current.isActive).toBe(true);

      // Pause
      act(() => {
        mockStateCallback?.({
          isSharing: true,
          isPaused: true,
          quality: '1080p',
          frameRate: 30,
          shareAudio: false,
          streamId: 'stream-123',
          error: null,
        });
      });

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('Source Switching', () => {
    it('should switch capture source', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.switchSource();
      });

      expect(mockScreenSharingManager.switchSource).toHaveBeenCalled();
    });

    it('should handle switch source error', async () => {
      mockScreenSharingManager.switchSource.mockRejectedValueOnce(
        new Error('Switch failed')
      );

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.switchSource();
      });

      expect(result.current.error).toBe('Switch failed');
    });
  });

  describe('Quality Control', () => {
    it('should update quality', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.updateQuality('720p');
      });

      expect(mockScreenSharingManager.updateQuality).toHaveBeenCalledWith('720p');
    });

    it('should handle quality update error', async () => {
      mockScreenSharingManager.updateQuality.mockRejectedValueOnce(
        new Error('Quality update failed')
      );

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.updateQuality('4k');
      });

      expect(result.current.error).toBe('Quality update failed');
    });

    it('should update frame rate', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.updateFrameRate(60);
      });

      expect(mockScreenSharingManager.updateFrameRate).toHaveBeenCalledWith(60);
    });

    it('should handle frame rate update error', async () => {
      mockScreenSharingManager.updateFrameRate.mockRejectedValueOnce(
        new Error('Frame rate update failed')
      );

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.updateFrameRate(120);
      });

      expect(result.current.error).toBe('Frame rate update failed');
    });
  });

  describe('Audio Control', () => {
    it('should toggle audio on', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.toggleAudio(true);
      });

      expect(mockScreenSharingManager.toggleAudio).toHaveBeenCalledWith(true);
    });

    it('should toggle audio off', async () => {
      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.toggleAudio(false);
      });

      expect(mockScreenSharingManager.toggleAudio).toHaveBeenCalledWith(false);
    });

    it('should handle audio toggle error', async () => {
      mockScreenSharingManager.toggleAudio.mockRejectedValueOnce(
        new Error('Audio toggle failed')
      );

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.toggleAudio(true);
      });

      expect(result.current.error).toBe('Audio toggle failed');
    });
  });

  describe('PQC Protection', () => {
    it('should mark as PQC protected', () => {
      const { result } = renderHook(() => useScreenCapture());

      act(() => {
        result.current.markAsPQCProtected();
      });

      expect(mockScreenSharingManager.markAsPQCProtected).toHaveBeenCalled();
    });

    it('should get PQC status', () => {
      mockScreenSharingManager.getPQCStatus.mockReturnValueOnce({
        protected: true,
        algorithm: 'Kyber-1024',
        warning: null,
      });

      const { result } = renderHook(() => useScreenCapture());

      const status = result.current.getPQCStatus();

      expect(status.protected).toBe(true);
      expect(status.algorithm).toBe('Kyber-1024');
    });

    it('should return default status if manager not initialized', () => {
      const { result } = renderHook(() => useScreenCapture());

      const status = result.current.getPQCStatus();

      expect(status.protected).toBe(false);
      expect(status.warning).toBeNull();
    });
  });

  describe('Direct Display Media', () => {
    it('should get display media directly', async () => {
      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.getDisplayMedia();
      });

      expect(mockGetDisplayMedia).toHaveBeenCalledWith({
        video: true,
        audio: false,
      });
      expect(stream).toBeInstanceOf(MediaStream);
    });

    it('should request audio if shareAudio is true', async () => {
      const { result } = renderHook(() => useScreenCapture({ shareAudio: true }));

      await act(async () => {
        await result.current.getDisplayMedia();
      });

      expect(mockGetDisplayMedia).toHaveBeenCalledWith({
        video: true,
        audio: true,
      });
    });

    it('should handle getDisplayMedia error', async () => {
      mockGetDisplayMedia.mockRejectedValueOnce(new Error('User cancelled'));

      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.getDisplayMedia();
      });

      expect(stream).toBeNull();
      expect(result.current.error).toBe('User cancelled');
    });

    it('should return null if screen share not supported', async () => {
      const screenSharingModule = await import('@/lib/webrtc/screen-sharing');
      vi.mocked(screenSharingModule.isScreenShareSupported).mockReturnValueOnce(false);
      const { result } = renderHook(() => useScreenCapture());

      let stream: MediaStream | null = null;

      await act(async () => {
        stream = await result.current.getDisplayMedia();
      });

      expect(stream).toBeNull();
      expect(result.current.error).toBe('Screen sharing not supported');
    });
  });

  describe('State Callbacks', () => {
    it('should update state via callback', () => {
      const { result } = renderHook(() => useScreenCapture());

      const newState: ScreenShareState = {
        isSharing: true,
        isPaused: false,
        quality: '1080p',
        frameRate: 30,
        shareAudio: true,
        streamId: 'stream-123',
        error: null,
      };

      act(() => {
        mockStateCallback?.(newState);
      });

      expect(result.current.isCapturing).toBe(true);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.quality).toBe('1080p');
      expect(result.current.shareAudio).toBe(true);
      expect(result.current.streamId).toBe('stream-123');
    });

    it('should call onStateChange callback', () => {
      const onStateChange = vi.fn();

      renderHook(() => useScreenCapture({ onStateChange }));

      const newState: ScreenShareState = {
        isSharing: true,
        isPaused: false,
        quality: '1080p',
        frameRate: 30,
        shareAudio: false,
        streamId: 'stream-123',
        error: null,
      };

      act(() => {
        mockStateCallback?.(newState);
      });

      expect(onStateChange).toHaveBeenCalledWith(newState);
    });

    it('should update stats via callback', () => {
      const { result } = renderHook(() => useScreenCapture());

      const newStats: ScreenShareStats = {
        bitrate: 2500000,
        framerate: 30,
        resolution: { width: 1920, height: 1080 },
        codec: 'VP9',
        packetsLost: 5,
        jitter: 10,
      };

      act(() => {
        mockStatsCallback?.(newStats);
      });

      expect(result.current.stats).toEqual(newStats);
    });

    it('should call onStatsUpdate callback', () => {
      const onStatsUpdate = vi.fn();

      renderHook(() => useScreenCapture({ onStatsUpdate }));

      const newStats: ScreenShareStats = {
        bitrate: 2500000,
        framerate: 30,
        resolution: { width: 1920, height: 1080 },
        codec: 'VP9',
        packetsLost: 0,
        jitter: 5,
      };

      act(() => {
        mockStatsCallback?.(newStats);
      });

      expect(onStatsUpdate).toHaveBeenCalledWith(newStats);
    });
  });

  describe('Cleanup', () => {
    it('should dispose manager on unmount', () => {
      const { unmount } = renderHook(() => useScreenCapture());

      unmount();

      expect(mockScreenSharingManager.dispose).toHaveBeenCalled();
    });

    it('should only initialize manager once', () => {
      const { rerender } = renderHook(() => useScreenCapture());

      const callCount = mockScreenSharingManager.setStateCallback.mock.calls.length;

      rerender();
      rerender();

      // Should still be the same count (initialized only once)
      expect(mockScreenSharingManager.setStateCallback).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('Full State Access', () => {
    it('should provide access to full state', () => {
      const { result } = renderHook(() => useScreenCapture());

      const newState: ScreenShareState = {
        isSharing: true,
        isPaused: false,
        quality: '1080p',
        frameRate: 60,
        shareAudio: true,
        streamId: 'stream-123',
        error: 'Test error',
      };

      act(() => {
        mockStateCallback?.(newState);
      });

      expect(result.current.fullState).toEqual(newState);
    });
  });

  describe('Edge Cases', () => {
    it('should handle manager operations when manager is null', async () => {
      const { result } = renderHook(() => useScreenCapture());

      // Force manager to be null
      (result.current as any).managerRef = { current: null };

      // All operations should not throw
      expect(() => {
        act(() => {
          result.current.stopCapture();
          result.current.pauseCapture();
          result.current.resumeCapture();
          result.current.markAsPQCProtected();
        });
      }).not.toThrow();

      await act(async () => {
        await result.current.switchSource();
      });

      await act(async () => {
        await result.current.updateQuality('720p');
      });

      await act(async () => {
        await result.current.updateFrameRate(30);
      });

      await act(async () => {
        await result.current.toggleAudio(false);
      });
    });

    it('should handle error state with null message', async () => {
      mockScreenSharingManager.startSharing.mockRejectedValueOnce(null);

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.error).toBe('Failed to start capture');
    });

    it('should handle non-Error exceptions', async () => {
      mockScreenSharingManager.startSharing.mockRejectedValueOnce('String error');

      const { result } = renderHook(() => useScreenCapture());

      await act(async () => {
        await result.current.startCapture();
      });

      expect(result.current.error).toBe('Failed to start capture');
    });
  });
});
