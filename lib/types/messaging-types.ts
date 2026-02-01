/**
 * Messaging Type Definitions
 * Type-safe message structures for WebRTC data channels and signaling
 *
 * @module types/messaging-types
 */

import { isObject, hasProperty, isString, isNumber, isArrayOf } from './type-guards';

// ============================================
// Signaling Messages
// ============================================

/**
 * Group transfer answer message from signaling server
 */
export interface GroupAnswerMessage {
  groupId: string;
  from: string;
  answer: RTCSessionDescriptionInit;
}

/**
 * Group transfer ICE candidate message
 */
export interface GroupICECandidateMessage {
  groupId: string;
  from: string;
  candidate: RTCIceCandidateInit;
}

/**
 * Group transfer offer message
 */
export interface GroupOfferMessage {
  groupId: string;
  to: string;
  offer: RTCSessionDescriptionInit;
}

// ============================================
// P2P Transfer Messages
// ============================================

/**
 * File metadata for P2P transfer
 */
export interface FileMeta {
  id: string;
  name: string;
  size: number;
  type: string;
  chunks: number;
}

/**
 * File metadata message payload
 */
export interface FileMetaPayload {
  meta: FileMeta;
}

/**
 * Transfer complete message payload
 */
export interface CompletePayload {
  fileId: string;
}

/**
 * Error message payload
 */
export interface ErrorPayload {
  message: string;
}

/**
 * Empty payload for messages without data
 */
export type EmptyPayload = Record<string, never>;

/**
 * All possible message payloads
 */
export type MessagePayload =
  | RTCSessionDescriptionInit
  | RTCIceCandidateInit
  | FileMetaPayload
  | CompletePayload
  | ErrorPayload
  | EmptyPayload;

/**
 * Generic signal message structure
 */
export interface SignalMessage<T extends MessagePayload = MessagePayload> {
  type: 'offer' | 'answer' | 'candidate' | 'ready' | 'file-meta' | 'chunk' | 'ack' | 'complete' | 'error';
  payload: T;
  from: string;
  to: string;
}

/**
 * Internal data channel message types (discriminated union)
 */
export type InternalMessage =
  | { type: 'file-meta'; meta: FileMeta }
  | { type: 'complete'; fileId: string }
  | { type: 'error'; message: string };

// ============================================
// Chat Messages
// ============================================

/**
 * Chat message structure
 */
export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  read?: boolean;
  delivered?: boolean;
}

/**
 * Chat event types
 */
export type ChatEventType = 'message' | 'typing' | 'read' | 'delivered' | 'error';

/**
 * Chat event structure
 */
export interface ChatEvent {
  type: ChatEventType;
  message?: ChatMessage;
  senderId?: string;
  error?: string;
}

// ============================================
// Control Messages
// ============================================

/**
 * Connection quality levels
 */
export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

/**
 * Control message types
 */
export type ControlMessageType = 'ping' | 'pong' | 'status' | 'quality' | 'bandwidth' | 'heartbeat';

/**
 * Control message payload
 */
export interface ControlMessagePayload {
  timestamp?: number;
  status?: string;
  quality?: ConnectionQuality;
  bandwidth?: number;
  latency?: number;
}

/**
 * Control message structure
 */
export interface ControlMessage {
  type: ControlMessageType;
  payload?: ControlMessagePayload;
}

// ============================================
// Resumable Transfer Messages
// ============================================

/**
 * File metadata for resumable transfers
 */
export interface ResumableFileMetadata {
  originalName: string;
  mimeCategory: string;
  originalSize: number;
  fileHash: number[];
  encryptedName?: string;
  nameNonce?: number[];
  encryptedPath?: string;
  pathNonce?: number[];
}

/**
 * Chunk payload for resumable transfers
 */
export interface ChunkPayload {
  index: number;
  data: number[];
  nonce: number[];
  hash: number[];
}

/**
 * Resume request payload
 */
export interface ResumeRequestPayload {
  transferId: string;
}

/**
 * Resume response payload
 */
export interface ResumeResponsePayload {
  transferId: string;
  chunkBitmap: string;
  canResume: boolean;
}

/**
 * Resume chunk request payload
 */
export interface ResumeChunkRequestPayload {
  transferId: string;
  chunkIndices: number[];
}

// ============================================
// Type Guards
// ============================================

/**
 * Type guard for GroupAnswerMessage
 */
export function isGroupAnswerMessage(value: unknown): value is GroupAnswerMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'groupId') && isString(value['groupId']) &&
    hasProperty(value, 'from') && isString(value['from']) &&
    hasProperty(value, 'answer') && isObject(value['answer'])
  );
}

/**
 * Type guard for GroupICECandidateMessage
 */
export function isGroupICECandidateMessage(value: unknown): value is GroupICECandidateMessage {
  return (
    isObject(value) &&
    hasProperty(value, 'groupId') && isString(value['groupId']) &&
    hasProperty(value, 'from') && isString(value['from']) &&
    hasProperty(value, 'candidate') && isObject(value['candidate'])
  );
}

/**
 * Type guard for FileMeta
 */
export function isFileMeta(value: unknown): value is FileMeta {
  return (
    isObject(value) &&
    hasProperty(value, 'id') && isString(value['id']) &&
    hasProperty(value, 'name') && isString(value['name']) &&
    hasProperty(value, 'size') && isNumber(value['size']) &&
    hasProperty(value, 'type') && isString(value['type']) &&
    hasProperty(value, 'chunks') && isNumber(value['chunks'])
  );
}

/**
 * Type guard for InternalMessage
 */
export function isInternalMessage(value: unknown): value is InternalMessage {
  if (!isObject(value) || !hasProperty(value, 'type') || !isString(value['type'])) {
    return false;
  }

  const type = value['type'];

  if (type === 'file-meta') {
    return hasProperty(value, 'meta') && isFileMeta(value['meta']);
  }

  if (type === 'complete') {
    return hasProperty(value, 'fileId') && isString(value['fileId']);
  }

  if (type === 'error') {
    return hasProperty(value, 'message') && isString(value['message']);
  }

  return false;
}

/**
 * Type guard for ChatEvent
 */
export function isChatEvent(value: unknown): value is ChatEvent {
  if (!isObject(value) || !hasProperty(value, 'type') || !isString(value['type'])) {
    return false;
  }

  const validTypes: ChatEventType[] = ['message', 'typing', 'read', 'delivered', 'error'];
  if (!validTypes.includes(value['type'] as ChatEventType)) {
    return false;
  }

  // If type is 'message', validate message field
  if (value['type'] === 'message') {
    if (!hasProperty(value, 'message') || !isObject(value['message'])) {
      return false;
    }

    const msg = value['message'];
    return (
      hasProperty(msg, 'id') && isString(msg['id']) &&
      hasProperty(msg, 'senderId') && isString(msg['senderId']) &&
      hasProperty(msg, 'content') && isString(msg['content']) &&
      hasProperty(msg, 'timestamp') && isNumber(msg['timestamp'])
    );
  }

  return true;
}

/**
 * Type guard for ControlMessage
 */
export function isControlMessage(value: unknown): value is ControlMessage {
  if (!isObject(value) || !hasProperty(value, 'type') || !isString(value['type'])) {
    return false;
  }

  const validTypes: ControlMessageType[] = ['ping', 'pong', 'status', 'quality', 'bandwidth', 'heartbeat'];
  return validTypes.includes(value['type'] as ControlMessageType);
}

/**
 * Type guard for ResumableFileMetadata
 */
export function isResumableFileMetadata(value: unknown): value is ResumableFileMetadata {
  return (
    isObject(value) &&
    hasProperty(value, 'originalName') && isString(value['originalName']) &&
    hasProperty(value, 'mimeCategory') && isString(value['mimeCategory']) &&
    hasProperty(value, 'originalSize') && isNumber(value['originalSize']) &&
    hasProperty(value, 'fileHash') && isArrayOf(value['fileHash'], isNumber)
  );
}

/**
 * Type guard for ChunkPayload
 */
export function isChunkPayload(value: unknown): value is ChunkPayload {
  return (
    isObject(value) &&
    hasProperty(value, 'index') && isNumber(value['index']) &&
    hasProperty(value, 'data') && isArrayOf(value['data'], isNumber) &&
    hasProperty(value, 'nonce') && isArrayOf(value['nonce'], isNumber) &&
    hasProperty(value, 'hash') && isArrayOf(value['hash'], isNumber)
  );
}

/**
 * Type guard for ResumeRequestPayload
 */
export function isResumeRequestPayload(value: unknown): value is ResumeRequestPayload {
  return (
    isObject(value) &&
    hasProperty(value, 'transferId') && isString(value['transferId'])
  );
}

/**
 * Type guard for ResumeResponsePayload
 */
export function isResumeResponsePayload(value: unknown): value is ResumeResponsePayload {
  return (
    isObject(value) &&
    hasProperty(value, 'transferId') && isString(value['transferId']) &&
    hasProperty(value, 'chunkBitmap') && isString(value['chunkBitmap']) &&
    hasProperty(value, 'canResume') && typeof value['canResume'] === 'boolean'
  );
}

/**
 * Type guard for ResumeChunkRequestPayload
 */
export function isResumeChunkRequestPayload(value: unknown): value is ResumeChunkRequestPayload {
  return (
    isObject(value) &&
    hasProperty(value, 'transferId') && isString(value['transferId']) &&
    hasProperty(value, 'chunkIndices') && isArrayOf(value['chunkIndices'], isNumber)
  );
}
