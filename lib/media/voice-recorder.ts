'use client';

/**
 * Voice Recorder
 * MediaRecorder API wrapper for voice memo recording
 *
 * Features:
 * - Microphone audio recording
 * - Real-time audio level monitoring via AnalyserNode
 * - Pause/resume support
 * - Auto-stop at max duration
 * - WebM/Opus output format (most compatible)
 * - Memory-efficient chunk-based recording
 */

import secureLog from '../utils/secure-logger';

export interface VoiceRecorderOptions {
  /** Maximum recording duration in milliseconds (default: 5 minutes) */
  maxDuration?: number;
  /** Audio bitrate in bits per second (default: 128kbps) */
  audioBitsPerSecond?: number;
  /** Enable echo cancellation (default: true) */
  echoCancellation?: boolean;
  /** Enable noise suppression (default: true) */
  noiseSuppression?: boolean;
  /** Enable auto gain control (default: true) */
  autoGainControl?: boolean;
}

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number; // 0-1 normalized
  chunks: Blob[];
}

export interface VoiceRecordingResult {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  mimeType: string;
}

const DEFAULT_MAX_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_AUDIO_BITRATE = 128000; // 128 kbps
const AUDIO_LEVEL_UPDATE_INTERVAL = 100; // Update audio level every 100ms

/**
 * Voice Recorder Manager
 * Handles microphone recording with real-time audio level monitoring
 */
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private pauseTime: number = 0;
  private totalPausedDuration: number = 0;
  private audioLevelInterval: ReturnType<typeof setInterval> | null = null;
  private maxDurationTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentAudioLevel: number = 0;

  private options: Required<VoiceRecorderOptions>;

  // Event handlers
  public onStateChange?: (state: VoiceRecorderState) => void;
  public onAudioLevel?: (level: number) => void;
  public onMaxDurationReached?: () => void;
  public onError?: (error: Error) => void;

  constructor(options: VoiceRecorderOptions = {}) {
    this.options = {
      maxDuration: options.maxDuration ?? DEFAULT_MAX_DURATION,
      audioBitsPerSecond: options.audioBitsPerSecond ?? DEFAULT_AUDIO_BITRATE,
      echoCancellation: options.echoCancellation ?? true,
      noiseSuppression: options.noiseSuppression ?? true,
      autoGainControl: options.autoGainControl ?? true,
    };
  }

  /**
   * Check if voice recording is supported
   */
  static isSupported(): boolean {
    return !!(
      typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined' &&
      typeof AudioContext !== 'undefined'
    );
  }

  /**
   * Get supported audio MIME types
   */
  static getSupportedTypes(): string[] {
    if (typeof MediaRecorder === 'undefined') {return [];}

    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];

    return types.filter(type =>
      MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(type)
    );
  }

  /**
   * Start recording
   */
  async start(): Promise<void> {
    if (!VoiceRecorder.isSupported()) {
      throw new Error('Voice recording is not supported in this browser');
    }

    if (this.mediaRecorder) {
      throw new Error('Recording already in progress');
    }

    try {
      // Request microphone access
      this.audioStream = await this.captureMicrophone();

      // Set up audio analysis
      this.setupAudioAnalysis();

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType,
        audioBitsPerSecond: this.options.audioBitsPerSecond,
      });

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.chunks.push(event.data);
          this.emitStateChange();
        }
      };

      this.mediaRecorder.onerror = () => {
        const error = new Error('MediaRecorder error');
        secureLog.error('[VoiceRecorder] Error:', error);
        this.onError?.(error);
      };

      this.mediaRecorder.onstop = () => {
        this.stopAudioLevelMonitoring();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Emit data every second
      this.startTime = Date.now();
      this.chunks = [];

      // Start audio level monitoring
      this.startAudioLevelMonitoring();

      // Set max duration timeout
      if (this.options.maxDuration > 0) {
        this.maxDurationTimeout = setTimeout(() => {
          secureLog.log('[VoiceRecorder] Max duration reached, auto-stopping');
          this.onMaxDurationReached?.();
          this.stop().catch(err => secureLog.error('Auto-stop error:', err));
        }, this.options.maxDuration);
      }

      secureLog.log('[VoiceRecorder] Recording started');
      this.emitStateChange();
    } catch (error) {
      this.cleanup();
      secureLog.error('[VoiceRecorder] Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return result
   */
  async stop(): Promise<VoiceRecordingResult> {
    if (!this.mediaRecorder) {
      throw new Error('No recording in progress');
    }

    return new Promise((resolve, reject) => {
      const recorder = this.mediaRecorder!;

      recorder.onstop = () => {
        try {
          const duration = this.getDuration();
          const blob = new Blob(this.chunks, { type: recorder.mimeType });
          const url = URL.createObjectURL(blob);

          const result: VoiceRecordingResult = {
            blob,
            url,
            duration,
            size: blob.size,
            mimeType: recorder.mimeType,
          };

          secureLog.log(
            '[VoiceRecorder] Recording stopped',
            `Duration: ${duration}ms, Size: ${blob.size} bytes`
          );

          this.cleanup();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      recorder.stop();
    });
  }

  /**
   * Pause recording
   */
  pause(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
      throw new Error('No active recording to pause');
    }

    this.mediaRecorder.pause();
    this.pauseTime = Date.now();
    this.stopAudioLevelMonitoring();

    secureLog.log('[VoiceRecorder] Recording paused');
    this.emitStateChange();
  }

  /**
   * Resume recording
   */
  resume(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state !== 'paused') {
      throw new Error('No paused recording to resume');
    }

    this.mediaRecorder.resume();
    this.totalPausedDuration += Date.now() - this.pauseTime;
    this.pauseTime = 0;
    this.startAudioLevelMonitoring();

    secureLog.log('[VoiceRecorder] Recording resumed');
    this.emitStateChange();
  }

  /**
   * Cancel recording without saving
   */
  cancel(): void {
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }

    this.cleanup();
    secureLog.log('[VoiceRecorder] Recording cancelled');
  }

  /**
   * Get current audio level (0-1)
   */
  getAudioLevel(): number {
    return this.currentAudioLevel;
  }

  /**
   * Get current recording state
   */
  getState(): VoiceRecorderState {
    return {
      isRecording: this.mediaRecorder?.state === 'recording',
      isPaused: this.mediaRecorder?.state === 'paused',
      duration: this.getDuration(),
      audioLevel: this.currentAudioLevel,
      chunks: this.chunks,
    };
  }

  /**
   * Get recording status
   */
  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  get isPaused(): boolean {
    return this.mediaRecorder?.state === 'paused';
  }

  get duration(): number {
    return this.getDuration();
  }

  /**
   * Capture microphone stream
   */
  private async captureMicrophone(): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: this.options.echoCancellation,
        noiseSuppression: this.options.noiseSuppression,
        autoGainControl: this.options.autoGainControl,
        channelCount: 1, // Mono recording
        sampleRate: 48000, // High quality
      },
      video: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone permissions.');
        } else if (error.name === 'NotFoundError') {
          throw new Error('No microphone found. Please connect a microphone.');
        }
      }
      throw error;
    }
  }

  /**
   * Set up audio analysis for level monitoring
   */
  private setupAudioAnalysis(): void {
    if (!this.audioStream) {return;}

    try {
      // Create AudioContext
      this.audioContext = new AudioContext();

      // Create analyser node
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      // Connect audio stream to analyser
      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      source.connect(this.analyser);
    } catch (error) {
      secureLog.error('[VoiceRecorder] Failed to setup audio analysis:', error);
    }
  }

  /**
   * Start monitoring audio level
   */
  private startAudioLevelMonitoring(): void {
    if (!this.analyser) {return;}

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    this.audioLevelInterval = setInterval(() => {
      if (!this.analyser) {return;}

      // Get time domain data (waveform)
      this.analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS (Root Mean Square) for audio level
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = ((dataArray[i] ?? 128) - 128) / 128; // Normalize to -1 to 1
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);

      // Normalize to 0-1 range with some amplification
      this.currentAudioLevel = Math.min(1, rms * 5);

      this.onAudioLevel?.(this.currentAudioLevel);
    }, AUDIO_LEVEL_UPDATE_INTERVAL);
  }

  /**
   * Stop monitoring audio level
   */
  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }
    this.currentAudioLevel = 0;
  }

  /**
   * Get supported MIME type
   */
  private getSupportedMimeType(): string {
    const types = VoiceRecorder.getSupportedTypes();

    if (types.length === 0) {
      throw new Error('No supported audio MIME types');
    }

    // Prefer WebM with Opus codec (best quality/compression)
    const preferred = types.find(t => t.includes('opus'));
    if (preferred) {
      return preferred;
    }

    return types[0] ?? 'audio/webm';
  }

  /**
   * Get recording duration
   */
  private getDuration(): number {
    if (!this.startTime) {return 0;}

    const now = Date.now();
    const elapsed = now - this.startTime;
    const pausedDuration = this.totalPausedDuration + (this.pauseTime ? now - this.pauseTime : 0);

    return Math.max(0, elapsed - pausedDuration);
  }

  /**
   * Emit state change event
   */
  private emitStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    // Stop audio level monitoring
    this.stopAudioLevelMonitoring();

    // Clear max duration timeout
    if (this.maxDurationTimeout) {
      clearTimeout(this.maxDurationTimeout);
      this.maxDurationTimeout = null;
    }

    // Stop audio stream
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(() => {
        // Ignore close errors
      });
      this.audioContext = null;
    }

    this.analyser = null;
    this.mediaRecorder = null;
    this.chunks = [];
    this.startTime = 0;
    this.pauseTime = 0;
    this.totalPausedDuration = 0;
    this.currentAudioLevel = 0;
  }
}

/**
 * Format duration as MM:SS
 */
export function formatVoiceDuration(durationMs: number): string {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Simple recording API
 */
export async function startVoiceRecording(
  options?: VoiceRecorderOptions
): Promise<VoiceRecorder> {
  const recorder = new VoiceRecorder(options);
  await recorder.start();
  return recorder;
}

export default VoiceRecorder;
