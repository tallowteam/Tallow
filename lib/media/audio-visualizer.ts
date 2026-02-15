'use client';

/**
 * Audio Visualizer
 * Extract waveform data from audio blobs for visualization
 *
 * Features:
 * - Decode audio using OfflineAudioContext
 * - Extract amplitude peaks for waveform visualization
 * - Normalize amplitude values to 0-1 range
 * - Configurable sample count for different resolutions
 */

import secureLog from '../utils/secure-logger';

export interface WaveformOptions {
  /** Number of samples to extract (default: 100) */
  sampleCount?: number;
  /** Channel to extract (0 = left, 1 = right, -1 = average, default: -1) */
  channel?: number;
  /** Apply smoothing to waveform (default: true) */
  smooth?: boolean;
  /** Smoothing window size (default: 3) */
  smoothingWindow?: number;
}

export interface WaveformData {
  /** Normalized amplitude values (0-1) */
  peaks: number[];
  /** Duration in seconds */
  duration: number;
  /** Sample rate */
  sampleRate: number;
  /** Number of channels */
  channels: number;
}

const DEFAULT_SAMPLE_COUNT = 100;
const DEFAULT_SMOOTHING_WINDOW = 3;

/**
 * Create waveform data from audio blob
 * Uses OfflineAudioContext to decode audio and extract amplitude peaks
 */
export async function createWaveformData(
  audioBlob: Blob,
  options: WaveformOptions = {}
): Promise<number[]> {
  const {
    sampleCount = DEFAULT_SAMPLE_COUNT,
    channel = -1, // Average all channels
    smooth = true,
    smoothingWindow = DEFAULT_SMOOTHING_WINDOW,
  } = options;

  try {
    // Convert blob to array buffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Create offline audio context for decoding
    const audioContext = new OfflineAudioContext(
      1, // mono output
      44100, // sample rate (doesn't matter much for visualization)
      44100
    );

    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Extract amplitude data
    const peaks = extractPeaks(audioBuffer, sampleCount, channel);

    // Apply smoothing if requested
    const smoothedPeaks = smooth ? smoothWaveform(peaks, smoothingWindow) : peaks;

    // Normalize to 0-1 range
    const normalizedPeaks = normalizePeaks(smoothedPeaks);

    secureLog.log(
      `[AudioVisualizer] Extracted ${normalizedPeaks.length} peaks from ${audioBuffer.duration.toFixed(2)}s audio`
    );

    return normalizedPeaks;
  } catch (error) {
    secureLog.error('[AudioVisualizer] Failed to create waveform:', error);
    throw new Error('Failed to extract waveform data from audio');
  }
}

/**
 * Get detailed waveform data with metadata
 */
export async function getWaveformData(
  audioBlob: Blob,
  options: WaveformOptions = {}
): Promise<WaveformData> {
  try {
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioContext = new OfflineAudioContext(1, 44100, 44100);
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const peaks = await createWaveformData(audioBlob, options);

    return {
      peaks,
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
    };
  } catch (error) {
    secureLog.error('[AudioVisualizer] Failed to get waveform data:', error);
    throw error;
  }
}

/**
 * Extract amplitude peaks from audio buffer
 */
function extractPeaks(
  audioBuffer: AudioBuffer,
  sampleCount: number,
  channel: number
): number[] {
  const peaks: number[] = [];
  const samplesPerPeak = Math.floor(audioBuffer.length / sampleCount);

  // Get channel data
  const channelData = getChannelData(audioBuffer, channel);

  // Extract peaks by sampling
  for (let i = 0; i < sampleCount; i++) {
    const start = i * samplesPerPeak;
    const end = Math.min(start + samplesPerPeak, channelData.length);

    // Find max absolute amplitude in this segment
    let peak = 0;
    for (let j = start; j < end; j++) {
      const amplitude = Math.abs(channelData[j] ?? 0);
      if (amplitude > peak) {
        peak = amplitude;
      }
    }

    peaks.push(peak);
  }

  return peaks;
}

/**
 * Get channel data from audio buffer
 * If channel is -1, returns average of all channels
 */
function getChannelData(audioBuffer: AudioBuffer, channel: number): Float32Array {
  if (channel >= 0 && channel < audioBuffer.numberOfChannels) {
    return audioBuffer.getChannelData(channel);
  }

  // Average all channels
  const length = audioBuffer.length;
  const averaged = new Float32Array(length);
  const channelCount = audioBuffer.numberOfChannels;

  for (let ch = 0; ch < channelCount; ch++) {
    const channelData = audioBuffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      averaged[i] = (averaged[i] ?? 0) + (channelData[i] ?? 0) / channelCount;
    }
  }

  return averaged;
}

/**
 * Smooth waveform using moving average
 */
function smoothWaveform(peaks: number[], windowSize: number): number[] {
  if (windowSize <= 1) {return peaks;}

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < peaks.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = -halfWindow; j <= halfWindow; j++) {
      const index = i + j;
      if (index >= 0 && index < peaks.length) {
        sum += peaks[index] ?? 0;
        count++;
      }
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

/**
 * Normalize peaks to 0-1 range
 */
function normalizePeaks(peaks: number[]): number[] {
  const max = Math.max(...peaks, 0.001); // Avoid division by zero

  return peaks.map(peak => peak / max);
}

/**
 * Create waveform SVG path data
 * Useful for rendering waveforms as SVG paths
 */
export function createWaveformPath(
  peaks: number[],
  width: number,
  height: number,
  mirror = true
): string {
  if (peaks.length === 0) {return '';}

  const step = width / peaks.length;
  const midHeight = height / 2;

  let path = `M 0 ${midHeight} `;

  // Top half
  for (let i = 0; i < peaks.length; i++) {
    const x = i * step;
    const y = midHeight - (peaks[i] ?? 0) * midHeight;
    path += `L ${x} ${y} `;
  }

  // Bottom half (mirrored)
  if (mirror) {
    for (let i = peaks.length - 1; i >= 0; i--) {
      const x = i * step;
      const y = midHeight + (peaks[i] ?? 0) * midHeight;
      path += `L ${x} ${y} `;
    }
  } else {
    path += `L ${width} ${midHeight} `;
  }

  path += 'Z';

  return path;
}

/**
 * Create waveform bars data for bar chart visualization
 */
export function createWaveformBars(
  peaks: number[],
  width: number,
  height: number,
  barGap = 2
): Array<{ x: number; y: number; width: number; height: number }> {
  const barCount = peaks.length;
  const barWidth = (width - barGap * (barCount - 1)) / barCount;

  return peaks.map((peak, i) => {
    const barHeight = peak * height;
    return {
      x: i * (barWidth + barGap),
      y: height - barHeight,
      width: barWidth,
      height: barHeight,
    };
  });
}

/**
 * Create real-time audio level visualization
 * Returns normalized levels for visualization (0-1)
 */
export function processAudioLevel(
  level: number,
  sensitivity = 1.0,
  _smoothing = 0.8
): number {
  // Apply sensitivity multiplier
  const adjusted = level * sensitivity;

  // Clamp to 0-1 range
  return Math.max(0, Math.min(1, adjusted));
}

/**
 * Audio visualizer utilities
 */
export const audioVisualizer = {
  createWaveformData,
  getWaveformData,
  createWaveformPath,
  createWaveformBars,
  processAudioLevel,
};

export default audioVisualizer;
