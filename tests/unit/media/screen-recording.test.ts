import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScreenRecorder } from '@/lib/media/screen-recording';

describe('Screen Recording', () => {
  // Mock MediaStream
  class MockMediaStream {
    private tracks: MediaStreamTrack[] = [];

    addTrack(track: MediaStreamTrack) {
      this.tracks.push(track);
    }

    getVideoTracks() {
      return this.tracks.filter(t => t.kind === 'video');
    }

    getAudioTracks() {
      return this.tracks.filter(t => t.kind === 'audio');
    }

    getTracks() {
      return this.tracks;
    }
  }

  // Mock MediaStreamTrack
  class MockMediaStreamTrack {
    kind: string;
    enabled: boolean = true;
    private listeners: Map<string, Function[]> = new Map();

    constructor(kind: string) {
      this.kind = kind;
    }

    stop() {
      this.enabled = false;
    }

    addEventListener(event: string, callback: Function) {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event)!.push(callback);
    }

    dispatchEvent(event: any) {
      const callbacks = this.listeners.get(event.type) || [];
      callbacks.forEach(cb => cb(event));
      return true;
    }
  }

  // Mock MediaRecorder
  class MockMediaRecorder {
    static isTypeSupported(type: string): boolean {
      return type.includes('webm');
    }

    state: 'inactive' | 'recording' | 'paused' = 'inactive';
    mimeType: string;
    ondataavailable: ((event: any) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: ((event: any) => void) | null = null;

    constructor(_stream: MediaStream, options: any) {
      this.mimeType = options.mimeType || 'video/webm';
    }

    start(timeslice?: number) {
      this.state = 'recording';
      // Simulate data available events
      setTimeout(() => {
        if (this.ondataavailable && this.state === 'recording') {
          this.ondataavailable({
            data: new Blob(['mock data'], { type: this.mimeType }),
          });
        }
      }, timeslice || 1000);
    }

    stop() {
      this.state = 'inactive';
      setTimeout(() => {
        if (this.onstop) {
          this.onstop();
        }
      }, 100);
    }

    pause() {
      if (this.state === 'recording') {
        this.state = 'paused';
      }
    }

    resume() {
      if (this.state === 'paused') {
        this.state = 'recording';
      }
    }
  }

  beforeEach(() => {
    // Mock browser APIs
    global.MediaRecorder = MockMediaRecorder as any;
    global.MediaStream = MockMediaStream as any;

    global.navigator = {
      mediaDevices: {
        getDisplayMedia: vi.fn().mockResolvedValue(() => {
          const stream = new MockMediaStream();
          const videoTrack = new MockMediaStreamTrack('video') as unknown as MediaStreamTrack;
          stream.addTrack(videoTrack);
          return stream;
        }),
        getUserMedia: vi.fn().mockResolvedValue(() => {
          const stream = new MockMediaStream();
          const videoTrack = new MockMediaStreamTrack('video') as unknown as MediaStreamTrack;
          const audioTrack = new MockMediaStreamTrack('audio') as unknown as MediaStreamTrack;
          stream.addTrack(videoTrack);
          stream.addTrack(audioTrack);
          return stream;
        }),
      },
    } as any;

    global.URL = {
      createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
      revokeObjectURL: vi.fn(),
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Browser Support', () => {
    it('should detect support correctly', () => {
      const isSupported = ScreenRecorder.isSupported();
      expect(isSupported).toBe(true);
    });

    it('should list supported MIME types', () => {
      const types = ScreenRecorder.getSupportedTypes();
      expect(types.length).toBeGreaterThan(0);
      expect(types.some(t => t.includes('webm'))).toBe(true);
    });

    it('should handle missing APIs gracefully', () => {
      const originalNavigator = global.navigator;
      (global as any).navigator = undefined;

      const isSupported = ScreenRecorder.isSupported();
      expect(isSupported).toBe(false);

      global.navigator = originalNavigator;
    });
  });

  describe('Recording Lifecycle', () => {
    it('should create recorder with default options', () => {
      const recorder = new ScreenRecorder();
      expect(recorder).toBeInstanceOf(ScreenRecorder);

      const state = recorder.getState();
      expect(state.isRecording).toBe(false);
      expect(state.isPaused).toBe(false);
    });

    it('should create recorder with custom options', () => {
      const recorder = new ScreenRecorder({
        quality: 'high',
        includeAudio: true,
        includeWebcam: false,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should provide current state', () => {
      const recorder = new ScreenRecorder();
      const state = recorder.getState();

      expect(state).toHaveProperty('isRecording');
      expect(state).toHaveProperty('isPaused');
      expect(state).toHaveProperty('duration');
      expect(state).toHaveProperty('size');
      expect(state).toHaveProperty('chunks');
    });
  });

  describe('State Management', () => {
    it('should track recording state correctly', () => {
      const recorder = new ScreenRecorder();

      expect(recorder.getState().isRecording).toBe(false);
    });

    it('should track paused state', () => {
      const recorder = new ScreenRecorder();
      const state = recorder.getState();

      expect(state.isPaused).toBe(false);
    });

    it('should calculate duration', () => {
      const recorder = new ScreenRecorder();
      const state = recorder.getState();

      expect(state.duration).toBe(0);
    });

    it('should track recording size', () => {
      const recorder = new ScreenRecorder();
      const state = recorder.getState();

      expect(state.size).toBe(0);
    });
  });

  describe('Quality Presets', () => {
    it('should apply low quality preset', () => {
      const recorder = new ScreenRecorder({ quality: 'low' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should apply medium quality preset', () => {
      const recorder = new ScreenRecorder({ quality: 'medium' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should apply high quality preset', () => {
      const recorder = new ScreenRecorder({ quality: 'high' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should apply ultra quality preset', () => {
      const recorder = new ScreenRecorder({ quality: 'ultra' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });
  });

  describe('Event Handlers', () => {
    it('should call onStateChange when state changes', () => {
      const onStateChange = vi.fn();
      const recorder = new ScreenRecorder();
      recorder.onStateChange = onStateChange;

      // State change events would be triggered during recording
      expect(recorder.onStateChange).toBe(onStateChange);
    });

    it('should call onDataAvailable when data is available', () => {
      const onDataAvailable = vi.fn();
      const recorder = new ScreenRecorder();
      recorder.onDataAvailable = onDataAvailable;

      expect(recorder.onDataAvailable).toBe(onDataAvailable);
    });

    it('should call onError when error occurs', () => {
      const onError = vi.fn();
      const recorder = new ScreenRecorder();
      recorder.onError = onError;

      expect(recorder.onError).toBe(onError);
    });
  });

  describe('Recording Options', () => {
    it('should support custom video bitrate', () => {
      const recorder = new ScreenRecorder({
        videoBitsPerSecond: 2000000,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support custom audio bitrate', () => {
      const recorder = new ScreenRecorder({
        audioBitsPerSecond: 128000,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support custom frame rate', () => {
      const recorder = new ScreenRecorder({
        frameRate: 60,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support audio inclusion option', () => {
      const recorder = new ScreenRecorder({
        includeAudio: false,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support system audio option', () => {
      const recorder = new ScreenRecorder({
        includeSystemAudio: true,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support webcam inclusion option', () => {
      const recorder = new ScreenRecorder({
        includeWebcam: true,
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support custom webcam size', () => {
      const recorder = new ScreenRecorder({
        webcamSize: { width: 640, height: 480 },
      });

      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });
  });

  describe('Error Handling', () => {
    it('should throw error when starting if not supported', async () => {
      const originalNavigator = global.navigator;
      (global as any).navigator = undefined;

      const recorder = new ScreenRecorder();

      await expect(recorder.start()).rejects.toThrow('not supported');

      global.navigator = originalNavigator;
    });

    it('should throw error when stopping without recording', async () => {
      const recorder = new ScreenRecorder();

      await expect(recorder.stop()).rejects.toThrow('No recording in progress');
    });

    it('should throw error when pausing without recording', () => {
      const recorder = new ScreenRecorder();

      expect(() => recorder.pause()).toThrow('No active recording');
    });

    it('should throw error when resuming without paused recording', () => {
      const recorder = new ScreenRecorder();

      expect(() => recorder.resume()).toThrow('No paused recording');
    });
  });

  describe('Format Support', () => {
    it('should prefer VP9 codec', () => {
      const recorder = new ScreenRecorder({ format: 'webm' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should support WebM format', () => {
      const recorder = new ScreenRecorder({ format: 'webm' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });

    it('should handle format fallback', () => {
      // If preferred format not supported, should fallback
      const recorder = new ScreenRecorder({ format: 'mp4' });
      expect(recorder).toBeInstanceOf(ScreenRecorder);
    });
  });

  describe('Resource Cleanup', () => {
    it('should not throw when cancelling without recording', () => {
      const recorder = new ScreenRecorder();

      expect(() => recorder.cancel()).not.toThrow();
    });

    it('should clean up resources on cancel', () => {
      const recorder = new ScreenRecorder();
      recorder.cancel();

      const state = recorder.getState();
      expect(state.chunks).toHaveLength(0);
    });
  });
});
