/**
 * Chat Storage Unit Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChatStorage } from '@/lib/chat/chat-storage';
import { ChatMessage } from '@/lib/chat/chat-manager';

// Mock IndexedDB
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

global.indexedDB = mockIndexedDB as any;

describe('ChatStorage', () => {
  let storage: ChatStorage;
  const sessionId = 'test-session';

  beforeEach(() => {
    storage = new ChatStorage(sessionId);

    // Mock IndexedDB open
    mockIndexedDB.open.mockReturnValue({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(false),
        },
        createObjectStore: vi.fn().mockReturnValue({
          createIndex: vi.fn(),
        }),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            put: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            get: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            delete: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            index: vi.fn().mockReturnValue({
              getAll: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
              openCursor: vi.fn().mockReturnValue({ onsuccess: null, onerror: null }),
            }),
          }),
        }),
      },
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);

      await storage.initialize();
      expect(mockIndexedDB.open).toHaveBeenCalled();
    });

    it('should handle initialization errors', async () => {
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onerror) {
          openRequest.onerror({ target: { error: new Error('DB error') } } as any);
        }
      }, 0);

      await expect(storage.initialize()).rejects.toThrow();
    });
  });

  describe('Message Operations', () => {
    const mockMessage: ChatMessage = {
      id: 'msg-1',
      sessionId: sessionId,
      senderId: 'user-1',
      senderName: 'Alice',
      content: 'Hello',
      type: 'text',
      status: 'sent',
      timestamp: new Date(),
    };

    beforeEach(async () => {
      // Initialize storage
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      await storage.initialize();
    });

    it('should save a message', async () => {
      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const putRequest = store.put();

      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({} as any);
        }
      }, 0);

      await storage.saveMessage(mockMessage);
      expect(store.put).toHaveBeenCalled();
    });

    it('should get a message by ID', async () => {
      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const getRequest = store.get();

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: mockMessage } } as any);
        }
      }, 0);

      const message = await storage.getMessage('msg-1');
      expect(message).toBeDefined();
    });

    it('should return null for non-existent message', async () => {
      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const getRequest = store.get();

      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: undefined } } as any);
        }
      }, 0);

      const message = await storage.getMessage('non-existent');
      expect(message).toBeNull();
    });

    it('should delete a message', async () => {
      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const deleteRequest = store.delete();

      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({} as any);
        }
      }, 0);

      await storage.deleteMessage('msg-1');
      expect(store.delete).toHaveBeenCalled();
    });
  });

  describe('Message Queries', () => {
    beforeEach(async () => {
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      await storage.initialize();
    });

    it('should get messages for session', async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          sessionId: sessionId,
          senderId: 'user-1',
          senderName: 'Alice',
          content: 'Hello',
          type: 'text',
          status: 'sent',
          timestamp: new Date(),
        },
      ];

      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const index = store.index();
      const getAllRequest = index.getAll();

      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: { result: mockMessages } } as any);
        }
      }, 0);

      const messages = await storage.getMessages(10, 0);
      expect(messages).toBeInstanceOf(Array);
    });

    it('should search messages', async () => {
      const mockMessages: ChatMessage[] = [
        {
          id: 'msg-1',
          sessionId: sessionId,
          senderId: 'user-1',
          senderName: 'Alice',
          content: 'Hello world',
          type: 'text',
          status: 'sent',
          timestamp: new Date(),
        },
        {
          id: 'msg-2',
          sessionId: sessionId,
          senderId: 'user-1',
          senderName: 'Alice',
          content: 'Goodbye',
          type: 'text',
          status: 'sent',
          timestamp: new Date(),
        },
      ];

      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const index = store.index();
      const getAllRequest = index.getAll();

      setTimeout(() => {
        if (getAllRequest.onsuccess) {
          getAllRequest.onsuccess({ target: { result: mockMessages } } as any);
        }
      }, 0);

      const results = await storage.searchMessages('hello');
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('Status Updates', () => {
    beforeEach(async () => {
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      await storage.initialize();
    });

    it('should update message status', async () => {
      const mockMessage: ChatMessage = {
        id: 'msg-1',
        sessionId: sessionId,
        senderId: 'user-1',
        senderName: 'Alice',
        content: 'Hello',
        type: 'text',
        status: 'sent',
        timestamp: new Date(),
      };

      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();

      // Mock get request
      const getRequest = store.get();
      setTimeout(() => {
        if (getRequest.onsuccess) {
          getRequest.onsuccess({ target: { result: mockMessage } } as any);
        }
      }, 0);

      // Mock put request
      const putRequest = store.put();
      setTimeout(() => {
        if (putRequest.onsuccess) {
          putRequest.onsuccess({} as any);
        }
      }, 0);

      await storage.updateMessageStatus('msg-1', 'read');
      expect(store.put).toHaveBeenCalled();
    });
  });

  describe('Clear Operations', () => {
    beforeEach(async () => {
      const openRequest = mockIndexedDB.open();
      setTimeout(() => {
        if (openRequest.onsuccess) {
          openRequest.onsuccess({ target: openRequest } as any);
        }
      }, 0);
      await storage.initialize();
    });

    it('should clear all messages', async () => {
      const transaction = mockIndexedDB.open().result.transaction();
      const store = transaction.objectStore();
      const index = store.index();
      const cursorRequest = index.openCursor();

      setTimeout(() => {
        if (cursorRequest.onsuccess) {
          cursorRequest.onsuccess({ target: { result: null } } as any);
        }
      }, 0);

      await storage.clearMessages();
      expect(index.openCursor).toHaveBeenCalled();
    });
  });
});
