'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ScreenRecorder,
  type RecordingOptions,
  type RecordingState,
  type RecordingResult,
} from '../media/screen-recording';

export interface UseScreenRecordingOptions extends RecordingOptions {
  onComplete?: (result: RecordingResult) => void;
  onError?: (error: Error) => void;
}

export interface UseScreenRecordingReturn {
  // State
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  size: number;
  isSupported: boolean;
  error: Error | null;

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingResult | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  cancelRecording: () => void;

  // Result
  recordingResult: RecordingResult | null;
}

/**
 * React hook for screen recording
 *
 * @example
 * ```tsx
 * function RecordingButton() {
 *   const {
 *     isRecording,
 *     startRecording,
 *     stopRecording,
 *     recordingResult
 *   } = useScreenRecording({ quality: 'high' });
 *
 *   return (
 *     <div>
 *       {!isRecording ? (
 *         <button onClick={startRecording}>Start Recording</button>
 *       ) : (
 *         <button onClick={stopRecording}>Stop Recording</button>
 *       )}
 *       {recordingResult && (
 *         <video src={recordingResult.url} controls />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useScreenRecording(
  options: UseScreenRecordingOptions = {}
): UseScreenRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [size, setSize] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);

  const recorderRef = useRef<ScreenRecorder | null>(null);
  const updateIntervalRef = useRef<number | null>(null);

  const isSupported = ScreenRecorder.isSupported();

  // Update duration and size periodically
  const startUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      window.clearInterval(updateIntervalRef.current);
    }

    updateIntervalRef.current = window.setInterval(() => {
      if (recorderRef.current) {
        const state = recorderRef.current.getState();
        setDuration(state.duration);
        setSize(state.size);
        setIsPaused(state.isPaused);
      }
    }, 100);
  }, []);

  const stopUpdateInterval = useCallback(() => {
    if (updateIntervalRef.current) {
      window.clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    if (!isSupported) {
      const error = new Error('Screen recording is not supported in this browser');
      setError(error);
      options.onError?.(error);
      return;
    }

    try {
      setError(null);
      const recorder = new ScreenRecorder(options);

      recorder.onStateChange = (state: RecordingState) => {
        setIsRecording(state.isRecording);
        setIsPaused(state.isPaused);
        setDuration(state.duration);
        setSize(state.size);
      };

      recorder.onError = (error: Error) => {
        setError(error);
        options.onError?.(error);
      };

      await recorder.start();

      recorderRef.current = recorder;
      setIsRecording(true);
      startUpdateInterval();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      options.onError?.(error);
    }
  }, [isSupported, options, startUpdateInterval]);

  // Stop recording
  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recorderRef.current) {
      return null;
    }

    try {
      const result = await recorderRef.current.stop();

      setIsRecording(false);
      setIsPaused(false);
      setRecordingResult(result);
      stopUpdateInterval();

      options.onComplete?.(result);

      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to stop recording');
      setError(error);
      options.onError?.(error);
      return null;
    } finally {
      recorderRef.current = null;
    }
  }, [options, stopUpdateInterval]);

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (!recorderRef.current) {
      return;
    }

    try {
      recorderRef.current.pause();
      setIsPaused(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to pause recording');
      setError(error);
      options.onError?.(error);
    }
  }, [options]);

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (!recorderRef.current) {
      return;
    }

    try {
      recorderRef.current.resume();
      setIsPaused(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to resume recording');
      setError(error);
      options.onError?.(error);
    }
  }, [options]);

  // Cancel recording
  const cancelRecording = useCallback(() => {
    if (!recorderRef.current) {
      return;
    }

    try {
      recorderRef.current.cancel();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setSize(0);
      stopUpdateInterval();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to cancel recording');
      setError(error);
      options.onError?.(error);
    } finally {
      recorderRef.current = null;
    }
  }, [options, stopUpdateInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopUpdateInterval();
      if (recorderRef.current) {
        recorderRef.current.cancel();
      }
    };
  }, [stopUpdateInterval]);

  return {
    // State
    isRecording,
    isPaused,
    duration,
    size,
    isSupported,
    error,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,

    // Result
    recordingResult,
  };
}

/**
 * Format duration for display (mm:ss)
 */
export function formatRecordingDuration(durationMs: number): string {
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Format file size for display
 */
export function formatRecordingSize(bytes: number): string {
  if (bytes < 1024) {return `${bytes} B`;}
  if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
  if (bytes < 1024 * 1024 * 1024) {return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;}
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
