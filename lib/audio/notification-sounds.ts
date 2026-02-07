/**
 * Notification Sounds Module
 *
 * Generates notification sounds programmatically using Web Audio API.
 * No external audio files required - all sounds are generated on-the-fly
 * using oscillators and envelopes.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SoundType =
  | 'transferComplete'
  | 'incomingTransfer'
  | 'connectionEstablished'
  | 'error'
  | 'messageReceived';

// ============================================================================
// CONSTANTS
// ============================================================================

// Musical note frequencies (Hz)
const FREQUENCIES = {
  C4: 261.63,
  E4: 329.63,
  G4: 392.00,
  C5: 523.25,
  E5: 659.25,
} as const;

// Default volume (0-1 range)
const DEFAULT_VOLUME = 0.3;

// ============================================================================
// SOUND MANAGER CLASS
// ============================================================================

class NotificationSoundManager {
  private audioContext: AudioContext | null = null;
  private volume: number = DEFAULT_VOLUME;
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  /**
   * Initialize AudioContext lazily (only when first sound is played)
   * This avoids browser autoplay policy issues
   */
  private initAudioContext(): void {
    if (this.audioContext) {
      return;
    }

    try {
      // Try standard AudioContext first, fallback to webkit version
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();

      // Create master gain node for global volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = this.volume;
    } catch (error) {
      console.error('Failed to initialize AudioContext:', error);
    }
  }

  /**
   * Resume AudioContext if it was suspended (for autoplay policy)
   */
  private async resumeAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
  }

  /**
   * Create an oscillator with envelope (attack/decay)
   */
  private createOscillator(
    frequency: number,
    type: OscillatorType,
    startTime: number,
    duration: number,
    attack: number = 0.01,
    decay: number = 0.05
  ): OscillatorNode | null {
    if (!this.audioContext || !this.masterGain) {
      return null;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    // Connect oscillator -> gain -> master gain -> destination
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    // Envelope: attack -> sustain -> decay
    const now = startTime;
    const attackEnd = now + attack;
    const decayStart = now + duration - decay;
    const decayEnd = now + duration;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, attackEnd);
    gainNode.gain.setValueAtTime(1, decayStart);
    gainNode.gain.exponentialRampToValueAtTime(0.01, decayEnd);

    oscillator.start(now);
    oscillator.stop(decayEnd);

    return oscillator;
  }

  /**
   * Play transfer complete sound
   * Pleasant ascending two-tone chime (C5 → E5, 150ms each)
   */
  async playTransferComplete(): Promise<void> {
    if (this.muted) {
      return;
    }

    this.initAudioContext();
    await this.resumeAudioContext();

    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;

    // First tone: C5 (523.25 Hz) - 150ms
    this.createOscillator(
      FREQUENCIES.C5,
      'sine',
      now,
      0.15,
      0.01,
      0.05
    );

    // Second tone: E5 (659.25 Hz) - 150ms, starts 100ms after first
    this.createOscillator(
      FREQUENCIES.E5,
      'sine',
      now + 0.1,
      0.15,
      0.01,
      0.05
    );
  }

  /**
   * Play incoming transfer sound
   * Gentle notification ping (G4, 200ms with fade)
   */
  async playIncomingTransfer(): Promise<void> {
    if (this.muted) {
      return;
    }

    this.initAudioContext();
    await this.resumeAudioContext();

    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;

    // Single gentle tone: G4 (392 Hz) - 200ms
    this.createOscillator(
      FREQUENCIES.G4,
      'sine',
      now,
      0.2,
      0.02,
      0.08
    );
  }

  /**
   * Play connection established sound
   * Quick confirmation beep (C5, 100ms)
   */
  async playConnectionEstablished(): Promise<void> {
    if (this.muted) {
      return;
    }

    this.initAudioContext();
    await this.resumeAudioContext();

    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;

    // Quick beep: C5 (523.25 Hz) - 100ms
    this.createOscillator(
      FREQUENCIES.C5,
      'sine',
      now,
      0.1,
      0.005,
      0.03
    );
  }

  /**
   * Play error sound
   * Low descending tone (E4 → C4, 150ms each)
   */
  async playError(): Promise<void> {
    if (this.muted) {
      return;
    }

    this.initAudioContext();
    await this.resumeAudioContext();

    if (!this.audioContext) {
      return;
    }

    const now = this.audioContext.currentTime;

    // First tone: E4 (329.63 Hz) - 150ms
    this.createOscillator(
      FREQUENCIES.E4,
      'triangle',
      now,
      0.15,
      0.01,
      0.05
    );

    // Second tone: C4 (261.63 Hz) - 150ms, starts 100ms after first
    this.createOscillator(
      FREQUENCIES.C4,
      'triangle',
      now + 0.1,
      0.15,
      0.01,
      0.05
    );
  }

  /**
   * Play message received sound
   * Soft tap sound (high frequency click, 50ms)
   */
  async playMessageReceived(): Promise<void> {
    if (this.muted) {
      return;
    }

    this.initAudioContext();
    await this.resumeAudioContext();

    if (!this.audioContext || !this.masterGain) {
      return;
    }

    const now = this.audioContext.currentTime;

    // Create a short high-frequency click
    // Using white noise for a more natural "tap" sound
    const bufferSize = this.audioContext.sampleRate * 0.05; // 50ms
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise for tap sound
    for (let i = 0; i < bufferSize; i++) {
      // Exponential decay envelope
      const envelope = Math.exp(-i / (bufferSize * 0.1));
      // High-frequency noise
      data[i] = (Math.random() * 2 - 1) * envelope * 0.5;
    }

    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    filter.type = 'highpass';
    filter.frequency.value = 2000; // High-pass at 2kHz for crisp tap
    gainNode.gain.value = 0.4;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);

    source.start(now);
  }

  /**
   * Set master volume (0-1 range)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp to 0-1

    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Mute/unmute all sounds
   */
  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  /**
   * Check if sounds are muted
   */
  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Play a sound by type
   */
  async play(soundType: SoundType): Promise<void> {
    switch (soundType) {
      case 'transferComplete':
        await this.playTransferComplete();
        break;
      case 'incomingTransfer':
        await this.playIncomingTransfer();
        break;
      case 'connectionEstablished':
        await this.playConnectionEstablished();
        break;
      case 'error':
        await this.playError();
        break;
      case 'messageReceived':
        await this.playMessageReceived();
        break;
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const notificationSounds = new NotificationSoundManager();

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const playTransferComplete = () => notificationSounds.playTransferComplete();
export const playIncomingTransfer = () => notificationSounds.playIncomingTransfer();
export const playConnectionEstablished = () => notificationSounds.playConnectionEstablished();
export const playError = () => notificationSounds.playError();
export const playMessageReceived = () => notificationSounds.playMessageReceived();
export const setVolume = (volume: number) => notificationSounds.setVolume(volume);
export const setMuted = (muted: boolean) => notificationSounds.setMuted(muted);
export const getVolume = () => notificationSounds.getVolume();
export const isMuted = () => notificationSounds.isMuted();
