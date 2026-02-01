/**
 * Advanced Chat Features
 * Extensions for voice messages, reactions, threads, pinning, etc.
 */

import { secureLog } from '../utils/secure-logger';
import type {
  Message,
  MessageReaction,
  MessageReactionType,
  MessageThread,
  VoiceMessage,
} from './types';

/**
 * Voice Message Recorder
 */
export class VoiceMessageRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private startTime: number = 0;
  private maxDuration: number;

  constructor(maxDuration: number = 300000) { // 5 minutes default
    this.maxDuration = maxDuration;
  }

  /**
   * Start recording voice message
   */
  async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create media recorder
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: 'audio/webm',
      });

      this.audioChunks = [];
      this.startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(100); // Collect data every 100ms

      // Auto-stop after max duration
      setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.stopRecording();
        }
      }, this.maxDuration);

      secureLog.log('[VoiceRecorder] Started recording');
    } catch (error) {
      secureLog.error('[VoiceRecorder] Failed to start recording:', error);
      throw new Error('Microphone access denied or not available');
    }
  }

  /**
   * Stop recording and get voice message
   */
  async stopRecording(): Promise<VoiceMessage> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.mediaRecorder.state !== 'recording') {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          // Combine audio chunks
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

          // Convert to ArrayBuffer
          const audioData = await audioBlob.arrayBuffer();

          // Calculate duration
          const duration = Math.floor((Date.now() - this.startTime) / 1000);

          // Generate waveform (simplified)
          const waveform = await this.generateWaveform(audioData);

          const voiceMessage: VoiceMessage = {
            id: `voice-${Date.now()}`,
            audioData,
            duration,
            waveform,
          };

          // Cleanup
          this.cleanup();

          secureLog.log(`[VoiceRecorder] Stopped recording (${duration}s)`);
          resolve(voiceMessage);
        } catch (error) {
          secureLog.error('[VoiceRecorder] Failed to stop recording:', error);
          reject(error);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.cleanup();
    secureLog.log('[VoiceRecorder] Cancelled recording');
  }

  /**
   * Get current recording duration
   */
  getCurrentDuration(): number {
    if (this.mediaRecorder?.state === 'recording') {
      return Math.floor((Date.now() - this.startTime) / 1000);
    }
    return 0;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording';
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.audioChunks = [];
    this.mediaRecorder = null;
  }

  private async generateWaveform(audioData: ArrayBuffer): Promise<number[]> {
    try {
      // Decode audio data
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);

      // Extract waveform (simplified - use first channel)
      const channelData = audioBuffer.getChannelData(0);
      const samples = 100; // Number of waveform points
      const blockSize = Math.floor(channelData.length / samples);
      const waveform: number[] = [];

      for (let i = 0; i < samples; i++) {
        const start = blockSize * i;
        let sum = 0;

        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(channelData[start + j] || 0);
        }

        waveform.push(sum / blockSize);
      }

      await audioContext.close();

      return waveform;
    } catch (error) {
      secureLog.warn('[VoiceRecorder] Failed to generate waveform:', error);
      return [];
    }
  }
}

/**
 * Message Reactions Manager
 */
export class MessageReactionsManager {
  private reactions: Map<string, MessageReaction[]> = new Map();

  /**
   * Add reaction to message
   */
  addReaction(
    messageId: string,
    emoji: MessageReactionType,
    userId: string,
    userName: string
  ): void {
    const messageReactions = this.reactions.get(messageId) || [];

    // Check if user already reacted with this emoji
    const existing = messageReactions.find(
      r => r.userId === userId && r.emoji === emoji
    );

    if (existing) {
      secureLog.warn(`[Reactions] User ${userId} already reacted with ${emoji}`);
      return;
    }

    // Add new reaction
    const reaction: MessageReaction = {
      emoji,
      userId,
      userName,
      timestamp: Date.now(),
    };

    messageReactions.push(reaction);
    this.reactions.set(messageId, messageReactions);

    secureLog.log(`[Reactions] Added ${emoji} to message ${messageId}`);
  }

  /**
   * Remove reaction from message
   */
  removeReaction(
    messageId: string,
    emoji: MessageReactionType,
    userId: string
  ): void {
    const messageReactions = this.reactions.get(messageId);
    if (!messageReactions) {return;}

    const filtered = messageReactions.filter(
      r => !(r.userId === userId && r.emoji === emoji)
    );

    if (filtered.length === 0) {
      this.reactions.delete(messageId);
    } else {
      this.reactions.set(messageId, filtered);
    }

    secureLog.log(`[Reactions] Removed ${emoji} from message ${messageId}`);
  }

  /**
   * Get reactions for message
   */
  getReactions(messageId: string): MessageReaction[] {
    return this.reactions.get(messageId) || [];
  }

  /**
   * Get grouped reactions (emoji → count)
   */
  getGroupedReactions(messageId: string): Map<MessageReactionType, number> {
    const messageReactions = this.reactions.get(messageId) || [];
    const grouped = new Map<MessageReactionType, number>();

    for (const reaction of messageReactions) {
      const count = grouped.get(reaction.emoji) || 0;
      grouped.set(reaction.emoji, count + 1);
    }

    return grouped;
  }

  /**
   * Check if user reacted to message
   */
  hasUserReacted(messageId: string, userId: string, emoji?: MessageReactionType): boolean {
    const messageReactions = this.reactions.get(messageId) || [];

    if (emoji) {
      return messageReactions.some(r => r.userId === userId && r.emoji === emoji);
    }

    return messageReactions.some(r => r.userId === userId);
  }

  /**
   * Clear all reactions for message
   */
  clearReactions(messageId: string): void {
    this.reactions.delete(messageId);
  }
}

/**
 * Message Threads Manager
 */
export class MessageThreadsManager {
  private threads: Map<string, MessageThread> = new Map();

  /**
   * Create or update thread
   */
  addReply(parentMessageId: string, _replyMessageId: string, userId: string): void {
    let thread = this.threads.get(parentMessageId);

    if (!thread) {
      thread = {
        parentMessageId,
        replyCount: 0,
        lastReplyAt: Date.now(),
        participants: [],
      };
      this.threads.set(parentMessageId, thread);
    }

    thread.replyCount++;
    thread.lastReplyAt = Date.now();

    // Add participant if not already in list
    if (!thread.participants.includes(userId)) {
      thread.participants.push(userId);
    }

    secureLog.log(`[Threads] Added reply to thread ${parentMessageId}`);
  }

  /**
   * Get thread for message
   */
  getThread(messageId: string): MessageThread | null {
    return this.threads.get(messageId) || null;
  }

  /**
   * Remove reply from thread
   */
  removeReply(parentMessageId: string): void {
    const thread = this.threads.get(parentMessageId);
    if (!thread) {return;}

    thread.replyCount = Math.max(0, thread.replyCount - 1);

    if (thread.replyCount === 0) {
      this.threads.delete(parentMessageId);
    }

    secureLog.log(`[Threads] Removed reply from thread ${parentMessageId}`);
  }

  /**
   * Get all active threads
   */
  getAllThreads(): MessageThread[] {
    return Array.from(this.threads.values());
  }

  /**
   * Clear thread
   */
  clearThread(messageId: string): void {
    this.threads.delete(messageId);
  }
}

/**
 * Pinned Messages Manager
 */
export class PinnedMessagesManager {
  private pinnedMessages: Set<string> = new Set();
  private maxPinned: number;

  constructor(maxPinned: number = 3) {
    this.maxPinned = maxPinned;
  }

  /**
   * Pin a message
   */
  pinMessage(messageId: string): boolean {
    if (this.pinnedMessages.has(messageId)) {
      return false;
    }

    if (this.pinnedMessages.size >= this.maxPinned) {
      secureLog.warn(`[PinnedMessages] Maximum ${this.maxPinned} pinned messages reached`);
      return false;
    }

    this.pinnedMessages.add(messageId);
    secureLog.log(`[PinnedMessages] Pinned message ${messageId}`);
    return true;
  }

  /**
   * Unpin a message
   */
  unpinMessage(messageId: string): boolean {
    const result = this.pinnedMessages.delete(messageId);
    if (result) {
      secureLog.log(`[PinnedMessages] Unpinned message ${messageId}`);
    }
    return result;
  }

  /**
   * Check if message is pinned
   */
  isPinned(messageId: string): boolean {
    return this.pinnedMessages.has(messageId);
  }

  /**
   * Get all pinned message IDs
   */
  getPinnedMessages(): string[] {
    return Array.from(this.pinnedMessages);
  }

  /**
   * Clear all pinned messages
   */
  clearAll(): void {
    this.pinnedMessages.clear();
  }

  /**
   * Get count of pinned messages
   */
  getCount(): number {
    return this.pinnedMessages.size;
  }
}

/**
 * Rich Media Preview Generator
 */
export class RichMediaPreviewGenerator {
  /**
   * Generate thumbnail for image
   */
  static async generateImageThumbnail(
    file: File,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate scaling
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }

          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.8));
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Generate thumbnail for video
   */
  static async generateVideoThumbnail(
    file: File,
    seekTime: number = 1
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(seekTime, video.duration);
      };

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Cleanup
        URL.revokeObjectURL(video.src);

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * Extract metadata from media file
   */
  static async extractMediaMetadata(file: File): Promise<{
    width?: number;
    height?: number;
    duration?: number;
  }> {
    if (file.type.startsWith('image/')) {
      return this.extractImageMetadata(file);
    } else if (file.type.startsWith('video/')) {
      return this.extractVideoMetadata(file);
    }

    return {};
  }

  private static async extractImageMetadata(file: File): Promise<{
    width: number;
    height: number;
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  private static async extractVideoMetadata(file: File): Promise<{
    width: number;
    height: number;
    duration: number;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        const metadata = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration,
        };

        URL.revokeObjectURL(video.src);
        resolve(metadata);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  }
}

/**
 * Message Forwarding Manager
 */
export class MessageForwardingManager {
  /**
   * Prepare message for forwarding
   */
  static prepareForwardedMessage(originalMessage: Message): Partial<Message> {
    const forwarded: Partial<Message> = {
      content: originalMessage.content,
      type: originalMessage.type,
      isForwarded: true,
      forwardedFrom: originalMessage.senderName,
    };

    // Only include attachments if they exist
    if (originalMessage.attachments) {
      forwarded.attachments = originalMessage.attachments;
    }

    return forwarded;
  }

  /**
   * Check if message can be forwarded
   */
  static canForward(message: Message): boolean {
    // Can't forward deleted messages
    if (message.deletedAt) {
      return false;
    }

    // Can't forward system messages
    if (message.type === 'system') {
      return false;
    }

    return true;
  }
}

export default {
  VoiceMessageRecorder,
  MessageReactionsManager,
  MessageThreadsManager,
  PinnedMessagesManager,
  RichMediaPreviewGenerator,
  MessageForwardingManager,
};
