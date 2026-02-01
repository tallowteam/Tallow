/**
 * Chat System Types
 * Complete type definitions for secure P2P chat
 */

export type MessageType =
  | 'text'
  | 'file'
  | 'image'
  | 'video'
  | 'audio'
  | 'voice'
  | 'system';

export type MessageStatus =
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type MessageReactionType =
  | '👍' | '❤️' | '😂' | '😮' | '😢' | '😡'
  | '🎉' | '🔥' | '👏' | '✅';

export interface MessageReaction {
  emoji: MessageReactionType;
  userId: string;
  userName: string;
  timestamp: number;
}

export interface MessageAttachment {
  id: string;
  filename: string;
  size: number;
  contentType: string;
  checksum: string;
  data?: ArrayBuffer; // Encrypted file data
  thumbnailData?: string; // Base64 thumbnail for images/videos
  duration?: number; // For audio/video in seconds
}

export interface MessageThread {
  parentMessageId: string;
  replyCount: number;
  lastReplyAt: number;
  participants: string[];
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;

  type: MessageType;
  content: string; // Encrypted content
  plaintextContent?: string; // Decrypted content (memory only)

  attachments?: MessageAttachment[];
  reactions?: MessageReaction[];
  thread?: MessageThread;

  status: MessageStatus;
  timestamp: number;
  editedAt?: number;
  deletedAt?: number;

  // Encryption metadata
  encryptionVersion: number;
  nonce: string;

  // Message features
  isPinned?: boolean;
  isForwarded?: boolean;
  forwardedFrom?: string;
  replyTo?: string; // Message ID being replied to

  // Delivery tracking
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;

  // Metadata
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;

  messages: Message[];
  unreadCount: number;
  lastMessage?: Message;
  lastMessageAt?: number;

  // Status
  isOnline: boolean;
  lastSeen?: number;
  typingIndicator: boolean;

  // Encryption
  sessionKey?: CryptoKey;
  sharedSecret?: Uint8Array;

  // Features
  pinnedMessages: string[];
  draft?: string;

  // Settings
  isMuted: boolean;
  isBlocked: boolean;
  isArchived: boolean;

  // Metadata
  createdAt: number;
  updatedAt: number;
}

export interface ChatUser {
  id: string;
  name: string;
  avatar?: string;
  publicKey?: Uint8Array;
  isOnline: boolean;
  lastSeen?: number;
  isTyping: boolean;
}

export interface TypingIndicator {
  userId: string;
  userName: string;
  conversationId: string;
  timestamp: number;
}

export interface MessageDeliveryReceipt {
  messageId: string;
  conversationId: string;
  status: MessageStatus;
  timestamp: number;
}

export interface VoiceMessage {
  id: string;
  audioData: ArrayBuffer;
  duration: number;
  waveform?: number[]; // Visualization data
  transcription?: string;
}

export interface MessageDraft {
  conversationId: string;
  content: string;
  attachments?: MessageAttachment[];
  replyTo?: string;
  timestamp: number;
}

export interface ChatSettings {
  enableNotifications: boolean;
  notificationSound: boolean;
  enableTypingIndicators: boolean;
  enableReadReceipts: boolean;
  enableMessagePreviews: boolean;
  enableVoiceMessages: boolean;
  autoSaveDrafts: boolean;
  messageRetention: number; // Days, 0 = forever
  maxAttachmentSize: number; // Bytes
  compressImages: boolean;
  compressVideos: boolean;
}

export interface ChatStatistics {
  totalMessages: number;
  totalConversations: number;
  messagesSent: number;
  messagesReceived: number;
  filesShared: number;
  voiceMessagesSent: number;
  averageResponseTime: number;
  activeConversations: number;
  totalDataTransferred: number;
  byDate: Record<string, {
    messagesSent: number;
    messagesReceived: number;
    filesShared: number;
  }>;
}

export interface MessageSearchResult {
  message: Message;
  conversationId: string;
  highlightedContent: string;
  relevanceScore: number;
}

export interface MessageFilter {
  conversationId?: string;
  senderId?: string;
  type?: MessageType;
  hasAttachments?: boolean;
  isPinned?: boolean;
  dateFrom?: number;
  dateTo?: number;
  searchQuery?: string;
}

// Events
export type ChatEventType =
  | 'message:sent'
  | 'message:received'
  | 'message:delivered'
  | 'message:read'
  | 'message:edited'
  | 'message:deleted'
  | 'message:reaction'
  | 'typing:start'
  | 'typing:stop'
  | 'user:online'
  | 'user:offline'
  | 'conversation:created'
  | 'conversation:updated'
  | 'conversation:archived'
  | 'draft:saved'
  | 'draft:restored';

export interface ChatEvent {
  type: ChatEventType;
  conversationId?: string;
  messageId?: string;
  userId?: string;
  data?: any;
  timestamp: number;
}

export type ChatEventCallback = (event: ChatEvent) => void;

// Constants
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  enableNotifications: true,
  notificationSound: true,
  enableTypingIndicators: true,
  enableReadReceipts: true,
  enableMessagePreviews: true,
  enableVoiceMessages: true,
  autoSaveDrafts: true,
  messageRetention: 90, // 90 days
  maxAttachmentSize: 100 * 1024 * 1024, // 100MB
  compressImages: true,
  compressVideos: true,
};

export const MAX_MESSAGE_LENGTH = 10000; // characters
export const MAX_ATTACHMENTS_PER_MESSAGE = 10;
export const TYPING_INDICATOR_TIMEOUT = 3000; // 3 seconds
export const MESSAGE_BATCH_SIZE = 50; // For virtual scrolling
export const MAX_VOICE_MESSAGE_DURATION = 300; // 5 minutes in seconds
export const DRAFT_AUTO_SAVE_INTERVAL = 2000; // 2 seconds
export const MESSAGE_EDIT_TIME_LIMIT = 900000; // 15 minutes
export const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
