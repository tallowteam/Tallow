'use client';

/**
 * VoiceMemo Component
 * Record and share voice memos with real-time waveform visualization
 *
 * Features:
 * - Record button (tap to toggle or hold to record)
 * - Real-time audio level visualization
 * - Recording timer display
 * - Playback with scrubber
 * - Send/delete actions
 * - Pause/resume support
 * - Auto-stop at 5-minute max duration
 * - Compact design for chat panel
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceRecorder,
  VoiceRecordingResult,
  formatVoiceDuration,
} from '@/lib/media/voice-recorder';
import { createWaveformData } from '@/lib/media/audio-visualizer';
import styles from './VoiceMemo.module.css';

type RecordingState = 'idle' | 'recording' | 'paused' | 'recorded' | 'sending';

export interface VoiceMemoProps {
  /** Callback when voice memo is ready to send */
  onSend?: (audioBlob: Blob, duration: number) => Promise<void>;
  /** Callback when recording is cancelled */
  onCancel?: () => void;
  /** Maximum recording duration in milliseconds (default: 5 minutes) */
  maxDuration?: number;
  /** Compact mode for chat sidebar (default: false) */
  compact?: boolean;
  /** Enable hold-to-record mode (default: false) */
  holdToRecord?: boolean;
}

export default function VoiceMemo({
  onSend,
  onCancel,
  maxDuration = 5 * 60 * 1000, // 5 minutes
  compact = false,
  holdToRecord = false,
}: VoiceMemoProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [recordingResult, setRecordingResult] = useState<VoiceRecordingResult | null>(null);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveformBarsRef = useRef<number[]>(Array(40).fill(0));

  // Check browser support
  useEffect(() => {
    setIsSupported(VoiceRecorder.isSupported());
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const recorder = new VoiceRecorder({
        maxDuration,
        audioBitsPerSecond: 128000,
      });

      // Set up event handlers
      recorder.onAudioLevel = (level) => {
        setAudioLevel(level);
        updateRealtimeWaveform(level);
      };

      recorder.onMaxDurationReached = () => {
        handleStopRecording();
      };

      recorder.onError = (err) => {
        setError(err.message);
        setState('idle');
      };

      await recorder.start();
      recorderRef.current = recorder;
      setState('recording');

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        if (recorderRef.current) {
          setDuration(recorderRef.current.duration);
        }
      }, 100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start recording';
      setError(errorMessage);
      setState('idle');
    }
  }, [maxDuration]);

  // Stop recording
  const handleStopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    try {
      const result = await recorderRef.current.stop();
      setRecordingResult(result);
      setState('recorded');

      // Extract waveform for visualization
      const peaks = await createWaveformData(result.blob, { sampleCount: 60 });
      setWaveform(peaks);

      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(errorMessage);
      setState('idle');
    }
  }, []);

  // Pause recording
  const handlePauseRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.pause();
      setState('paused');
    }
  }, []);

  // Resume recording
  const handleResumeRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.resume();
      setState('recording');
    }
  }, []);

  // Cancel recording
  const handleCancelRecording = useCallback(() => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    setState('idle');
    setDuration(0);
    setAudioLevel(0);
    setRecordingResult(null);
    setWaveform([]);
    waveformBarsRef.current = Array(40).fill(0);
    onCancel?.();
  }, [onCancel]);

  // Delete recorded audio
  const handleDelete = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPlaybackProgress(0);
    handleCancelRecording();
  }, [handleCancelRecording]);

  // Send recorded audio
  const handleSend = useCallback(async () => {
    if (!recordingResult || !onSend) return;

    try {
      setState('sending');
      await onSend(recordingResult.blob, recordingResult.duration);
      handleDelete();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send voice memo';
      setError(errorMessage);
      setState('recorded');
    }
  }, [recordingResult, onSend, handleDelete]);

  // Toggle playback
  const togglePlayback = useCallback(() => {
    if (!recordingResult) return;

    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(recordingResult.url);
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
          setPlaybackProgress(0);
        });
        audioRef.current.addEventListener('timeupdate', () => {
          if (audioRef.current) {
            const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setPlaybackProgress(progress);
          }
        });
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [recordingResult, isPlaying]);

  // Seek playback
  const handleSeek = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !recordingResult) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = x / rect.width;
      audioRef.current.currentTime = percentage * audioRef.current.duration;
      setPlaybackProgress(percentage * 100);
    },
    [recordingResult]
  );

  // Update real-time waveform visualization
  const updateRealtimeWaveform = useCallback((level: number) => {
    waveformBarsRef.current = [...waveformBarsRef.current.slice(1), level];
  }, []);

  // Toggle recording (for tap mode)
  const handleRecordButtonClick = useCallback(() => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'recording' || state === 'paused') {
      handleStopRecording();
    }
  }, [state, startRecording, handleStopRecording]);

  // Hold-to-record handlers
  const handleMouseDown = useCallback(() => {
    if (holdToRecord && state === 'idle') {
      startRecording();
    }
  }, [holdToRecord, state, startRecording]);

  const handleMouseUp = useCallback(() => {
    if (holdToRecord && (state === 'recording' || state === 'paused')) {
      handleStopRecording();
    }
  }, [holdToRecord, state, handleStopRecording]);

  // Render unsupported message
  if (!isSupported) {
    return (
      <div className={styles.unsupported}>
        Voice recording is not supported in this browser. Please use a modern browser.
      </div>
    );
  }

  // Render error
  if (error && state === 'idle') {
    return (
      <div className={styles.error}>
        {error}
      </div>
    );
  }

  const containerClassName = `${styles.voiceMemo} ${styles[state]} ${compact ? styles.compact : ''}`;

  return (
    <div className={containerClassName}>
      {/* Recording State */}
      {(state === 'idle' || state === 'recording' || state === 'paused') && (
        <>
          <div className={styles.controls}>
            <button
              className={`${styles.recordButton} ${state === 'recording' ? styles.recording : ''} ${state === 'paused' ? styles.paused : ''}`}
              onClick={holdToRecord ? undefined : handleRecordButtonClick}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              aria-label={state === 'idle' ? 'Start recording' : 'Stop recording'}
              disabled={false}
            >
              {state === 'idle' && (
                <div className={styles.recordIcon} />
              )}
              {(state === 'recording' || state === 'paused') && (
                <div className={styles.stopIcon} />
              )}
              {state === 'recording' && (
                <div className={styles.audioLevelIndicator}>
                  <div
                    className={styles.audioLevelRing}
                    style={{
                      transform: `scale(${1 + audioLevel * 0.3})`,
                      opacity: 0.5 + audioLevel * 0.5,
                    }}
                  />
                </div>
              )}
            </button>

            <div className={styles.recordingInfo}>
              <div className={styles.timerDisplay}>
                {formatVoiceDuration(duration)}
              </div>
              <div className={`${styles.statusText} ${state === 'recording' ? styles.recording : ''}`}>
                {state === 'idle' && (holdToRecord ? 'Hold to record' : 'Tap to record')}
                {state === 'recording' && (
                  <>
                    <span className={styles.recordingDot} />
                    Recording...
                  </>
                )}
                {state === 'paused' && 'Paused'}
              </div>
            </div>
          </div>

          {/* Real-time Waveform */}
          {state === 'recording' && (
            <div className={styles.waveformContainer}>
              <div className={styles.waveformBars}>
                {waveformBarsRef.current.map((level, i) => (
                  <div
                    key={i}
                    className={`${styles.waveformBar} ${level > 0.1 ? styles.active : ''}`}
                    style={{ height: `${Math.max(10, level * 100)}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {(state === 'recording' || state === 'paused') && (
            <div className={styles.actions}>
              {state === 'recording' && (
                <button className={styles.pauseButton} onClick={handlePauseRecording}>
                  Pause
                </button>
              )}
              {state === 'paused' && (
                <button className={styles.resumeButton} onClick={handleResumeRecording}>
                  Resume
                </button>
              )}
              <button className={styles.deleteButton} onClick={handleCancelRecording}>
                Cancel
              </button>
            </div>
          )}

          {/* Max Duration Warning */}
          {duration > maxDuration * 0.9 && state === 'recording' && (
            <div className={styles.maxDurationWarning}>
              ⚠ Recording will stop at {formatVoiceDuration(maxDuration)}
            </div>
          )}
        </>
      )}

      {/* Recorded State */}
      {state === 'recorded' && recordingResult && (
        <>
          <div className={styles.playbackControls}>
            <button
              className={styles.playButton}
              onClick={togglePlayback}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className={styles.playIcon} viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            <div className={styles.scrubber}>
              <div className={styles.scrubberTrack} onClick={handleSeek}>
                <div
                  className={styles.scrubberProgress}
                  style={{ width: `${playbackProgress}%` }}
                />
                <div
                  className={styles.scrubberThumb}
                  style={{ left: `${playbackProgress}%` }}
                />
              </div>
            </div>

            <div className={styles.durationDisplay}>
              {formatVoiceDuration(recordingResult.duration)}
            </div>
          </div>

          {/* Waveform Visualization */}
          {waveform.length > 0 && (
            <div className={styles.waveformContainer}>
              <svg className={styles.waveformSvg} viewBox="0 0 300 60" preserveAspectRatio="none">
                <path
                  className={styles.waveformPath}
                  d={createWaveformPath(waveform, 300, 60)}
                />
              </svg>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.actions}>
            <button className={styles.deleteButton} onClick={handleDelete}>
              Delete
            </button>
            <button
              className={styles.sendButton}
              onClick={handleSend}
              disabled={false}
            >
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Send
              </>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Create SVG waveform path from peaks array
 */
function createWaveformPath(peaks: number[], width: number, height: number): string {
  if (peaks.length === 0) return '';

  const step = width / peaks.length;
  const midHeight = height / 2;

  let path = `M 0 ${midHeight} `;

  // Top half
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const y = midHeight - (peaks[i] ?? 0) * midHeight * 0.8; // 0.8 for padding
    path += `L ${x} ${y} `;
  }

  // Bottom half (mirrored)
  for (let i = peaks.length - 1; i >= 0; i--) {
    const x = i * step;
    const y = midHeight + (peaks[i] ?? 0) * midHeight * 0.8;
    path += `L ${x} ${y} `;
  }

  path += 'Z';

  return path;
}
