/**
 * Chat Manager Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ChatManager, ChatEvent } from '@/lib/chat/chat-manager';
import { SessionKeys } from '@/lib/crypto/pqc-crypto-lazy';

// Mock dependencies
vi.mock('@/lib/chat/chat-storage', function() {
  return {
    ChatStorage: vi.fn().mockImplementation(function() {
      return {
        initialize: vi.fn(function() { return Promise.resolve(undefined); }),
        saveMessage: vi.fn(function() { return Promise.resolve(undefined); }),
        getMessage: vi.fn(function() { return Promise.resolve(null); }),
        getMessages: vi.fn(function() { return Promise.resolve([]); }),
        updateMessage: vi.fn(function() { return Promise.resolve(undefined); }),
        updateMessageStatus: vi.fn(function() { return Promise.resolve(undefined); }),
        markMessageAsRead: vi.fn(function() { return Promise.resolve(undefined); }),
        deleteMessage: vi.fn(function() { return Promise.resolve(undefined); }),
        searchMessages: vi.fn(function() { return Promise.resolve([]); }),
        getAllMessages: vi.fn(function() { return Promise.resolve([]); }),
        clearMessages: vi.fn(function() { return Promise.resolve(undefined); }),
        getUnreadCount: vi.fn(function() { return Promise.resolve(0); }),
      };
    }),
  };
});

vi.mock('@/lib/chat/message-encryption', function() {
  return {
    MessageEncryption: vi.fn().mockImplementation(function() {
      return {
        initialize: vi.fn(function() { return Promise.resolve(undefined); }),
        encryptMessage: vi.fn(function() {
          return Promise.resolve({
            ciphertext: new Uint8Array([1, 2, 3]),
            nonce: new Uint8Array([4, 5, 6]),
          });
        }),
        decryptMessage: vi.fn().mockImplementation(function(_encrypted) {
          return Promise.resolve(new TextEncoder().encode(JSON.stringify({
            id: 'test-msg',
            content: 'Hello',
            type: 'text',
            status: 'sent',
            timestamp: new Date(),
            senderId: 'peer',
            senderName: 'Peer',
            sessionId: 'session',
          })));
        }),
        destroy: vi.fn(function() {}),
      };
    }),
  };
});

vi.mock('@/lib/utils/secure-logger', function() {
  return {
    default: {
      log: vi.fn(function() {}),
      error: vi.fn(function() {}),
      warn: vi.fn(function() {}),
    },
  };
});

describe('ChatManager', () => {
  let chatManager: ChatManager;
  let mockDataChannel: RTCDataChannel;
  let mockSessionKeys: SessionKeys;

  beforeEach(() => {
    // Create mock DataChannel
    mockDataChannel = {
      readyState: 'open',
      send: vi.fn(),
      close: vi.fn(),
      onmessage: null,
      onopen: null,
      onclose: null,
      onerror: null,
    } as unknown as RTCDataChannel;

    // Create mock session keys
    mockSessionKeys = {
      encryptionKey: new Uint8Array(32),
      authKey: new Uint8Array(32),
      sessionId: new Uint8Array(16),
    };

    // Create chat manager
    chatManager = new ChatManager('session-1', 'user-1', 'Alice');
  });

  afterEach(() => {
    chatManager.destroy();
  });

  describe('Initialization', () => {
    it('should initialize with DataChannel and session keys', async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );

      expect(chatManager).toBeDefined();
    });

    it('should reject initialization without DataChannel', async () => {
      await expect(
        chatManager.initialize(
          null as any,
          mockSessionKeys,
          'peer-1',
          'Bob'
        )
      ).rejects.toThrow();
    });
  });

  describe('Send Message', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should send a text message', async () => {
      const message = await chatManager.sendMessage('Hello, World!');

      expect(message).toMatchObject({
        content: 'Hello, World!',
        type: 'text',
        senderId: 'user-1',
        senderName: 'Alice',
      });

      expect(mockDataChannel.send).toHaveBeenCalled();
    });

    it('should reject empty messages', async () => {
      await expect(chatManager.sendMessage('')).rejects.toThrow();
    });

    it('should reject messages exceeding max length', async () => {
      const longMessage = 'a'.repeat(10001);
      await expect(chatManager.sendMessage(longMessage)).rejects.toThrow();
    });

    it('should support reply-to messages', async () => {
      const message = await chatManager.sendMessage('Reply', 'original-msg-id');

      expect(message.replyToId).toBe('original-msg-id');
    });
  });

  describe('File Attachments', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should send a file attachment', async () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const message = await chatManager.sendFileAttachment(file);

      expect(message.type).toBe('file');
      expect(message.fileAttachment).toBeDefined();
      expect(message.fileAttachment?.name).toBe('test.txt');
    });

    it('should reject files exceeding size limit', async () => {
      // Create a file larger than 5MB
      const largeContent = new Uint8Array(6 * 1024 * 1024);
      const largeFile = new File([largeContent], 'large.bin');

      await expect(chatManager.sendFileAttachment(largeFile)).rejects.toThrow();
    });
  });

  describe('Typing Indicators', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should send typing indicator', () => {
      chatManager.sendTypingIndicator();

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('chat-typing')
      );
    });

    it('should stop typing indicator', () => {
      chatManager.sendTypingIndicator();
      chatManager.stopTypingIndicator();

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('chat-typing-stop')
      );
    });
  });

  describe('Read Receipts', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should mark messages as read', async () => {
      await chatManager.markAsRead(['msg-1', 'msg-2']);

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('chat-read-receipt')
      );
    });
  });

  describe('Message Handling', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should handle incoming chat messages', async () => {
      const messagePayload = {
        type: 'chat-message',
        payload: {
          encrypted: [1, 2, 3],
          nonce: [4, 5, 6],
          messageId: 'test-msg',
        },
      };

      const handled = await chatManager.handleIncomingMessage(
        JSON.stringify(messagePayload)
      );

      expect(handled).toBe(true);
    });

    it('should ignore non-chat messages', async () => {
      const nonChatMessage = {
        type: 'file-metadata',
        payload: {},
      };

      const handled = await chatManager.handleIncomingMessage(
        JSON.stringify(nonChatMessage)
      );

      expect(handled).toBe(false);
    });

    it('should handle typing indicators', async () => {
      const typingPayload = {
        type: 'chat-typing',
        payload: {
          userId: 'peer-1',
          userName: 'Bob',
        },
      };

      const events: ChatEvent[] = [];
      chatManager.addEventListener('*', (event) => events.push(event));

      await chatManager.handleIncomingMessage(JSON.stringify(typingPayload));

      expect(events).toContainEqual(
        expect.objectContaining({
          type: 'typing',
          indicator: expect.objectContaining({
            userId: 'peer-1',
            userName: 'Bob',
          }),
        })
      );
    });
  });

  describe('Message Search', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should search messages', async () => {
      const results = await chatManager.searchMessages('hello');
      expect(results).toBeInstanceOf(Array);
    });
  });

  describe('Export', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should export as JSON', async () => {
      const exported = await chatManager.exportChat('json');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should export as TXT', async () => {
      const exported = await chatManager.exportChat('txt');
      expect(typeof exported).toBe('string');
    });
  });

  describe('Event Listeners', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should add and trigger event listeners', async () => {
      const events: ChatEvent[] = [];
      const listener = (event: ChatEvent) => events.push(event);

      chatManager.addEventListener('message', listener);

      // Send a message to trigger event
      await chatManager.sendMessage('Test');

      expect(events.length).toBeGreaterThan(0);
    });

    it('should remove event listeners', async () => {
      const events: ChatEvent[] = [];
      const listener = (event: ChatEvent) => events.push(event);

      chatManager.addEventListener('message', listener);
      chatManager.removeEventListener('message', listener);

      // Send a message
      await chatManager.sendMessage('Test');

      // Event should not be captured after removal
      expect(events.length).toBe(0);
    });
  });

  describe('Message Editing', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should edit a message', async () => {
      const originalMessage = await chatManager.sendMessage('Original');
      await chatManager.editMessage(originalMessage.id, 'Edited');

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('chat-message-edited')
      );
    });
  });

  describe('Message Deletion', () => {
    beforeEach(async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );
    });

    it('should delete a message', async () => {
      const message = await chatManager.sendMessage('To delete');
      await chatManager.deleteMessage(message.id);

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        expect.stringContaining('chat-message-deleted')
      );
    });
  });

  describe('Cleanup', () => {
    it('should destroy properly', async () => {
      await chatManager.initialize(
        mockDataChannel,
        mockSessionKeys,
        'peer-1',
        'Bob'
      );

      chatManager.destroy();

      // Should not crash
      expect(() => chatManager.destroy()).not.toThrow();
    });
  });
});
