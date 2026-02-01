'use client';

/**
 * Chat Storage
 * IndexedDB storage for chat message history
 * Messages are stored per session for privacy
 */

import { ChatMessage, MessageStatus } from './chat-manager';
import secureLog from '../utils/secure-logger';

const DB_NAME = 'TallowChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

export class ChatStorage {
  private db: IDBDatabase | null = null;
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Initialize IndexedDB
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        secureLog.warn('[ChatStorage] IndexedDB not available');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        secureLog.log('[ChatStorage] Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create messages store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('senderId', 'senderId', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          secureLog.log('[ChatStorage] Object store created');
        }
      };
    });
  }

  /**
   * Save a message
   */
  async saveMessage(message: ChatMessage): Promise<void> {
    if (!this.db) {
      secureLog.warn('[ChatStorage] Database not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Store message with sessionId for scoping
      const messageWithSession = { ...message, sessionId: this.sessionId };
      const request = store.put(messageWithSession);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to save message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get a message by ID
   */
  async getMessage(messageId: string): Promise<ChatMessage | null> {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(messageId);

      request.onsuccess = () => {
        const message = request.result as ChatMessage | undefined;
        if (message && message.sessionId === this.sessionId) {
          // Parse dates
          message.timestamp = new Date(message.timestamp);
          if (message.editedAt) {
            message.editedAt = new Date(message.editedAt);
          }
          resolve(message);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to get message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get messages for current session
   */
  async getMessages(limit = 100, offset = 0): Promise<ChatMessage[]> {
    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(IDBKeyRange.only(this.sessionId));

      request.onsuccess = () => {
        const messages = (request.result as ChatMessage[])
          .map(msg => {
            // Parse dates
            msg.timestamp = new Date(msg.timestamp);
            if (msg.editedAt) {
              msg.editedAt = new Date(msg.editedAt);
            }
            return msg;
          })
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(offset, offset + limit);

        resolve(messages);
      };

      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to get messages:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all messages (for export)
   */
  async getAllMessages(): Promise<ChatMessage[]> {
    return this.getMessages(10000, 0);
  }

  /**
   * Update message
   */
  async updateMessage(message: ChatMessage): Promise<void> {
    return this.saveMessage(message);
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId: string, status: MessageStatus): Promise<void> {
    const message = await this.getMessage(messageId);
    if (message) {
      message.status = status;
      await this.saveMessage(message);
    }
  }

  /**
   * Mark message as read
   */
  async markMessageAsRead(messageId: string): Promise<void> {
    await this.updateMessageStatus(messageId, 'read');
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(messageId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to delete message:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Search messages by content
   */
  async searchMessages(query: string): Promise<ChatMessage[]> {
    const allMessages = await this.getMessages(1000, 0);
    const lowerQuery = query.toLowerCase();

    return allMessages.filter(msg =>
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.senderName.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all messages for current session
   */
  async clearMessages(): Promise<void> {
    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.openCursor(IDBKeyRange.only(this.sessionId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
        if (cursor) {
          store.delete(cursor.primaryKey);
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to clear messages:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get unread message count
   */
  async getUnreadCount(): Promise<number> {
    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      const request = index.getAll(IDBKeyRange.only(this.sessionId));

      request.onsuccess = () => {
        const messages = request.result as ChatMessage[];
        const unread = messages.filter(msg =>
          msg.status !== 'read' && msg.senderId !== this.sessionId
        ).length;
        resolve(unread);
      };

      request.onerror = () => {
        secureLog.error('[ChatStorage] Failed to get unread count:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
