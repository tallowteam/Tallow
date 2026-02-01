'use client';

/**
 * Chat Manager
 * Handles real-time chat during file transfers via WebRTC DataChannel
 * Features:
 * - End-to-end encryption (ML-KEM-768 + X25519 hybrid)
 * - Message persistence (IndexedDB)
 * - Typing indicators
 * - Read receipts
 * - Message status tracking
 */

import { SessionKeys } from '../crypto/pqc-crypto-lazy';
import secureLog from '../utils/secure-logger';
import { ChatStorage } from './chat-storage';
import { MessageEncryption } from './message-encryption';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
export type MessageType = 'text' | 'file' | 'emoji' | 'system';

export interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: Date;
  editedAt?: Date;
  replyToId?: string;
  fileAttachment?: FileAttachment;
  metadata?: Record<string, unknown>;
  sequence?: number; // Sequence number for replay attack protection
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string; // Base64 data URL for small files
  encrypted: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface ReadReceipt {
  userId: string;
  messageId: string;
  timestamp: Date;
}

export type ChatEvent =
  | { type: 'message'; message: ChatMessage }
  | { type: 'typing'; indicator: TypingIndicator }
  | { type: 'read-receipt'; receipt: ReadReceipt }
  | { type: 'status-update'; messageId: string; status: MessageStatus }
  | { type: 'message-deleted'; messageId: string }
  | { type: 'message-edited'; message: ChatMessage };

// Protocol message types for DataChannel
type ChatProtocolMessage =
  | { type: 'chat-message'; payload: { encrypted: number[]; nonce: number[]; messageId: string; hmac: string; sequence: number } }
  | { type: 'chat-typing'; payload: { userId: string; userName: string } }
  | { type: 'chat-typing-stop'; payload: { userId: string } }
  | { type: 'chat-read-receipt'; payload: { messageId: string; userId: string } }
  | { type: 'chat-delivery-receipt'; payload: { messageId: string } }
  | { type: 'chat-message-deleted'; payload: { messageId: string } }
  | { type: 'chat-message-edited'; payload: { encrypted: number[]; nonce: number[]; messageId: string; hmac: string; sequence: number } };

const MAX_MESSAGE_LENGTH = 10000; // 10KB text messages
const MAX_FILE_ATTACHMENT_SIZE = Number.MAX_SAFE_INTEGER; // No size limit - unlimited
const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
const MESSAGE_RETRY_ATTEMPTS = 3;
const MESSAGE_RETRY_DELAY = 1000; // 1 second

export class ChatManager {
  private dataChannel: RTCDataChannel | null = null;
  private sessionKeys: SessionKeys | null = null;
  private sessionId: string;
  private currentUserId: string;
  private currentUserName: string;

  private storage: ChatStorage;
  private encryption: MessageEncryption;

  // Event listeners
  private eventListeners: Map<string, Set<(event: ChatEvent) => void>> = new Map();

  // Typing indicator state
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;
  private isTyping = false;

  // Message queue for retry
  private messageQueue: Map<string, { message: ChatMessage; attempts: number }> = new Map();

  // Replay attack protection
  private outgoingSequence = 0; // Our sequence number for sent messages
  private incomingSequence = -1; // Last seen sequence number from peer
  private hmacKey: CryptoKey | null = null; // HMAC signing key

  constructor(sessionId: string, userId: string, userName: string) {
    this.sessionId = sessionId;
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.storage = new ChatStorage(sessionId);
    this.encryption = new MessageEncryption();
  }

  /**
   * Initialize chat manager with DataChannel and session keys
   */
  async initialize(dataChannel: RTCDataChannel, sessionKeys: SessionKeys, _peerId: string, peerName: string): Promise<void> {
    this.dataChannel = dataChannel;
    this.sessionKeys = sessionKeys;

    // Initialize encryption with session keys
    await this.encryption.initialize(sessionKeys);

    // Initialize storage
    await this.storage.initialize();

    // Derive HMAC key from session encryption key for message authentication
    await this.initializeHMACKey(sessionKeys.encryptionKey);

    secureLog.log('[Chat] Initialized with peer:', peerName);
  }

  /**
   * Handle incoming DataChannel message
   * Returns true if message was handled by chat manager
   */
  async handleIncomingMessage(data: string): Promise<boolean> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return false;
    }

    if (!this.isValidChatMessage(parsed)) {
      return false;
    }

    const message = parsed as ChatProtocolMessage;

    switch (message.type) {
      case 'chat-message':
        await this.handleReceivedMessage(message.payload);
        break;
      case 'chat-typing':
        this.handleTypingIndicator(message.payload);
        break;
      case 'chat-typing-stop':
        this.handleTypingStop(message.payload);
        break;
      case 'chat-read-receipt':
        this.handleReadReceipt(message.payload);
        break;
      case 'chat-delivery-receipt':
        this.handleDeliveryReceipt(message.payload);
        break;
      case 'chat-message-deleted':
        this.handleMessageDeleted(message.payload);
        break;
      case 'chat-message-edited':
        await this.handleMessageEdited(message.payload);
        break;
      default:
        return false;
    }

    return true;
  }

  /**
   * Send a text message
   */
  async sendMessage(content: string, replyToId?: string): Promise<ChatMessage> {
    if (!this.dataChannel || !this.sessionKeys) {
      throw new Error('Chat not initialized');
    }

    if (content.length === 0 || content.length > MAX_MESSAGE_LENGTH) {
      throw new Error(`Message length must be between 1 and ${MAX_MESSAGE_LENGTH} characters`);
    }

    const messageId = this.generateMessageId();
    const message: ChatMessage = {
      id: messageId,
      sessionId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content,
      type: 'text',
      status: 'sending',
      timestamp: new Date(),
      ...(replyToId ? { replyToId } : {}),
    };

    // Save to storage
    await this.storage.saveMessage(message);

    // Encrypt and send
    try {
      await this.sendEncryptedMessage(message);
      message.status = 'sent';
      await this.storage.updateMessageStatus(messageId, 'sent');
      this.emitEvent({ type: 'status-update', messageId, status: 'sent' });
    } catch (error) {
      secureLog.error('[Chat] Failed to send message:', error);
      message.status = 'failed';
      await this.storage.updateMessageStatus(messageId, 'failed');
      this.emitEvent({ type: 'status-update', messageId, status: 'failed' });

      // Add to retry queue
      this.messageQueue.set(messageId, { message, attempts: 0 });
      this.retryMessage(messageId);
    }

    this.emitEvent({ type: 'message', message });
    return message;
  }

  /**
   * Send a file attachment (max 5MB)
   */
  async sendFileAttachment(file: File): Promise<ChatMessage> {
    if (!this.dataChannel || !this.sessionKeys) {
      throw new Error('Chat not initialized');
    }

    if (file.size > MAX_FILE_ATTACHMENT_SIZE) {
      throw new Error(`File size exceeds maximum of ${MAX_FILE_ATTACHMENT_SIZE / 1024 / 1024}MB`);
    }

    // Read file as data URL
    const dataUrl = await this.fileToDataUrl(file);

    const messageId = this.generateMessageId();
    const message: ChatMessage = {
      id: messageId,
      sessionId: this.sessionId,
      senderId: this.currentUserId,
      senderName: this.currentUserName,
      content: `Sent ${file.name}`,
      type: 'file',
      status: 'sending',
      timestamp: new Date(),
      fileAttachment: {
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        encrypted: true,
      },
    };

    // Save to storage
    await this.storage.saveMessage(message);

    // Encrypt and send
    try {
      await this.sendEncryptedMessage(message);
      message.status = 'sent';
      await this.storage.updateMessageStatus(messageId, 'sent');
      this.emitEvent({ type: 'status-update', messageId, status: 'sent' });
    } catch (error) {
      secureLog.error('[Chat] Failed to send file:', error);
      message.status = 'failed';
      await this.storage.updateMessageStatus(messageId, 'failed');
      this.emitEvent({ type: 'status-update', messageId, status: 'failed' });
    }

    this.emitEvent({ type: 'message', message });
    return message;
  }

  /**
   * Send typing indicator
   */
  sendTypingIndicator(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    if (!this.isTyping) {
      this.isTyping = true;
      this.sendProtocolMessage({
        type: 'chat-typing',
        payload: {
          userId: this.currentUserId,
          userName: this.currentUserName,
        },
      });
    }

    // Reset timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTypingIndicator();
    }, TYPING_INDICATOR_TIMEOUT);
  }

  /**
   * Stop typing indicator
   */
  stopTypingIndicator(): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    if (this.isTyping) {
      this.isTyping = false;
      this.sendProtocolMessage({
        type: 'chat-typing-stop',
        payload: { userId: this.currentUserId },
      });
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    for (const messageId of messageIds) {
      // Update local storage
      await this.storage.markMessageAsRead(messageId);

      // Send read receipt to peer
      this.sendProtocolMessage({
        type: 'chat-read-receipt',
        payload: {
          messageId,
          userId: this.currentUserId,
        },
      });
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.storage.deleteMessage(messageId);

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.sendProtocolMessage({
        type: 'chat-message-deleted',
        payload: { messageId },
      });
    }

    this.emitEvent({ type: 'message-deleted', messageId });
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, newContent: string): Promise<void> {
    const message = await this.storage.getMessage(messageId);
    if (!message || message.senderId !== this.currentUserId) {
      throw new Error('Cannot edit this message');
    }

    message.content = newContent;
    message.editedAt = new Date();
    await this.storage.updateMessage(message);

    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      await this.sendEncryptedMessage(message, true);
    }

    this.emitEvent({ type: 'message-edited', message });
  }

  /**
   * Get message history
   */
  async getMessages(limit = 100, offset = 0): Promise<ChatMessage[]> {
    return this.storage.getMessages(limit, offset);
  }

  /**
   * Search messages
   */
  async searchMessages(query: string): Promise<ChatMessage[]> {
    return this.storage.searchMessages(query);
  }

  /**
   * Export chat history
   */
  async exportChat(format: 'json' | 'txt'): Promise<string> {
    const messages = await this.storage.getAllMessages();

    if (format === 'json') {
      return JSON.stringify(messages, null, 2);
    } else {
      return messages
        .map(m => {
          const timestamp = m.timestamp.toLocaleString();
          const edited = m.editedAt ? ' (edited)' : '';
          return `[${timestamp}] ${m.senderName}: ${m.content}${edited}`;
        })
        .join('\n');
    }
  }

  /**
   * Clear chat history
   */
  async clearHistory(): Promise<void> {
    await this.storage.clearMessages();
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, callback: (event: ChatEvent) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, callback: (event: ChatEvent) => void): void {
    this.eventListeners.get(event)?.delete(callback);
  }

  /**
   * Destroy chat manager
   */
  destroy(): void {
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.stopTypingIndicator();
    this.eventListeners.clear();
    this.messageQueue.clear();
    this.encryption.destroy();

    // Clear security state
    this.hmacKey = null;
    this.outgoingSequence = 0;
    this.incomingSequence = -1;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Initialize HMAC key for message authentication
   * Belt-and-suspenders approach: HMAC on top of AES-GCM authentication
   */
  private async initializeHMACKey(encryptionKey: Uint8Array): Promise<void> {
    try {
      // Derive HMAC key from encryption key using HKDF
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encryptionKey,
        { name: 'HKDF' },
        false,
        ['deriveKey']
      );

      this.hmacKey = await crypto.subtle.deriveKey(
        {
          name: 'HKDF',
          hash: 'SHA-256',
          salt: new Uint8Array(32), // Empty salt is fine for HMAC derivation
          info: new TextEncoder().encode('chat-hmac-key'),
        },
        keyMaterial,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
      );

      secureLog.log('[Chat] HMAC key initialized');
    } catch (error) {
      secureLog.error('[Chat] Failed to initialize HMAC key:', error);
      throw error;
    }
  }

  /**
   * Sign message data with HMAC for authentication
   */
  private async signMessageData(data: string): Promise<string> {
    if (!this.hmacKey) {
      throw new Error('HMAC key not initialized');
    }

    try {
      const dataBytes = new TextEncoder().encode(data);
      const signature = await crypto.subtle.sign('HMAC', this.hmacKey, dataBytes);
      return btoa(String.fromCharCode(...new Uint8Array(signature)));
    } catch (error) {
      secureLog.error('[Chat] Failed to sign message:', error);
      throw error;
    }
  }

  /**
   * Verify message HMAC signature
   */
  private async verifyMessageSignature(data: string, signature: string): Promise<boolean> {
    if (!this.hmacKey) {
      throw new Error('HMAC key not initialized');
    }

    try {
      const dataBytes = new TextEncoder().encode(data);
      const signatureBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
      return await crypto.subtle.verify('HMAC', this.hmacKey, signatureBytes, dataBytes);
    } catch (error) {
      secureLog.error('[Chat] Failed to verify message signature:', error);
      return false;
    }
  }

  /**
   * Verify sequence number to prevent replay attacks
   */
  private verifySequenceNumber(sequence: number): boolean {
    // First message from peer
    if (this.incomingSequence === -1) {
      this.incomingSequence = sequence;
      return true;
    }

    // Sequence must be strictly increasing (monotonic)
    if (sequence <= this.incomingSequence) {
      secureLog.error('[Chat] Replay attack detected: sequence', sequence, 'already seen (last:', this.incomingSequence, ')');
      return false;
    }

    // Allow reasonable gaps but not too large (prevent integer overflow attacks)
    const MAX_SEQUENCE_GAP = 1000;
    if (sequence - this.incomingSequence > MAX_SEQUENCE_GAP) {
      secureLog.error('[Chat] Suspicious sequence jump:', sequence - this.incomingSequence);
      return false;
    }

    this.incomingSequence = sequence;
    return true;
  }

  private async sendEncryptedMessage(message: ChatMessage, isEdit = false): Promise<void> {
    if (!this.sessionKeys || !this.dataChannel) {
      throw new Error('Chat not initialized');
    }

    // Add sequence number to message for replay protection
    message.sequence = this.outgoingSequence++;

    // Serialize message
    const messageJson = JSON.stringify(message);
    const messageBytes = new TextEncoder().encode(messageJson);

    // Encrypt message
    const encrypted = await this.encryption.encryptMessage(messageBytes);

    // Create data to sign: ciphertext + nonce + sequence (belt-and-suspenders)
    const encryptedArray = Array.from(encrypted.ciphertext);
    const nonceArray = Array.from(encrypted.nonce);
    const dataToSign = JSON.stringify({
      encrypted: encryptedArray,
      nonce: nonceArray,
      sequence: message.sequence,
      messageId: message.id,
    });

    // Generate HMAC signature for authentication (on top of AES-GCM)
    const hmac = await this.signMessageData(dataToSign);

    // Send via DataChannel
    const protocolMessage: ChatProtocolMessage = isEdit
      ? {
          type: 'chat-message-edited',
          payload: {
            encrypted: encryptedArray,
            nonce: nonceArray,
            messageId: message.id,
            hmac,
            sequence: message.sequence,
          },
        }
      : {
          type: 'chat-message',
          payload: {
            encrypted: encryptedArray,
            nonce: nonceArray,
            messageId: message.id,
            hmac,
            sequence: message.sequence,
          },
        };

    this.sendProtocolMessage(protocolMessage);
  }

  private async handleReceivedMessage(payload: { encrypted: number[]; nonce: number[]; messageId: string; hmac: string; sequence: number }): Promise<void> {
    if (!this.sessionKeys) {
      secureLog.error('[Chat] Cannot decrypt message: no session keys');
      return;
    }

    try {
      // Step 1: Verify HMAC signature (belt-and-suspenders authentication)
      const dataToVerify = JSON.stringify({
        encrypted: payload.encrypted,
        nonce: payload.nonce,
        sequence: payload.sequence,
        messageId: payload.messageId,
      });

      const isValidSignature = await this.verifyMessageSignature(dataToVerify, payload.hmac);
      if (!isValidSignature) {
        secureLog.error('[Chat] HMAC verification failed - message rejected');
        return;
      }

      // Step 2: Verify sequence number (replay attack protection)
      if (!this.verifySequenceNumber(payload.sequence)) {
        secureLog.error('[Chat] Sequence verification failed - possible replay attack');
        return;
      }

      // Step 3: Decrypt message (AES-GCM provides authenticated encryption)
      const ciphertext = new Uint8Array(payload.encrypted);
      const nonce = new Uint8Array(payload.nonce);
      const decrypted = await this.encryption.decryptMessage({ ciphertext, nonce });

      // Parse message
      const messageJson = new TextDecoder().decode(decrypted);
      const message: ChatMessage = JSON.parse(messageJson);
      message.status = 'delivered';

      // Save to storage
      await this.storage.saveMessage(message);

      // Send delivery receipt
      this.sendProtocolMessage({
        type: 'chat-delivery-receipt',
        payload: { messageId: message.id },
      });

      // Emit event
      this.emitEvent({ type: 'message', message });
    } catch (error) {
      secureLog.error('[Chat] Failed to decrypt message:', error);
    }
  }

  private handleTypingIndicator(payload: { userId: string; userName: string }): void {
    this.emitEvent({
      type: 'typing',
      indicator: {
        userId: payload.userId,
        userName: payload.userName,
        timestamp: new Date(),
      },
    });
  }

  private handleTypingStop(payload: { userId: string }): void {
    // Emit null typing indicator to clear
    this.emitEvent({
      type: 'typing',
      indicator: {
        userId: payload.userId,
        userName: '',
        timestamp: new Date(),
      },
    });
  }

  private async handleReadReceipt(payload: { messageId: string; userId: string }): Promise<void> {
    await this.storage.updateMessageStatus(payload.messageId, 'read');
    this.emitEvent({
      type: 'read-receipt',
      receipt: {
        userId: payload.userId,
        messageId: payload.messageId,
        timestamp: new Date(),
      },
    });
    this.emitEvent({
      type: 'status-update',
      messageId: payload.messageId,
      status: 'read',
    });
  }

  private async handleDeliveryReceipt(payload: { messageId: string }): Promise<void> {
    await this.storage.updateMessageStatus(payload.messageId, 'delivered');
    this.emitEvent({
      type: 'status-update',
      messageId: payload.messageId,
      status: 'delivered',
    });
  }

  private async handleMessageDeleted(payload: { messageId: string }): Promise<void> {
    await this.storage.deleteMessage(payload.messageId);
    this.emitEvent({ type: 'message-deleted', messageId: payload.messageId });
  }

  private async handleMessageEdited(payload: { encrypted: number[]; nonce: number[]; messageId: string; hmac: string; sequence: number }): Promise<void> {
    await this.handleReceivedMessage(payload);
  }

  private sendProtocolMessage(message: ChatProtocolMessage): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      return;
    }

    try {
      this.dataChannel.send(JSON.stringify(message));
    } catch (error) {
      secureLog.error('[Chat] Failed to send protocol message:', error);
    }
  }

  private async retryMessage(messageId: string): Promise<void> {
    const queuedMessage = this.messageQueue.get(messageId);
    if (!queuedMessage) {return;}

    if (queuedMessage.attempts >= MESSAGE_RETRY_ATTEMPTS) {
      this.messageQueue.delete(messageId);
      secureLog.error('[Chat] Message send failed after max retries:', messageId);
      return;
    }

    setTimeout(async () => {
      queuedMessage.attempts++;
      try {
        await this.sendEncryptedMessage(queuedMessage.message);
        await this.storage.updateMessageStatus(messageId, 'sent');
        this.emitEvent({ type: 'status-update', messageId, status: 'sent' });
        this.messageQueue.delete(messageId);
      } catch (_error) {
        await this.retryMessage(messageId);
      }
    }, MESSAGE_RETRY_DELAY * queuedMessage.attempts);
  }

  private emitEvent(event: ChatEvent): void {
    this.eventListeners.get('*')?.forEach(cb => cb(event));
    this.eventListeners.get(event.type)?.forEach(cb => cb(event));
  }

  private isValidChatMessage(data: unknown): boolean {
    if (!data || typeof data !== 'object') {return false;}
    const msg = data as Record<string, unknown>;
    return typeof msg['type'] === 'string' && (msg['type'] as string).startsWith('chat-');
  }

  private generateMessageId(): string {
    // Use cryptographically secure random instead of Math.random()
    const randomBytes = crypto.getRandomValues(new Uint8Array(6));
    const randomPart = Array.from(randomBytes)
      .map(b => b.toString(36).padStart(2, '0'))
      .join('')
      .substring(0, 9);
    return `msg-${this.currentUserId}-${Date.now()}-${randomPart}`;
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
