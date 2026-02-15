/**
 * Unit tests for useChatIntegration hook
 * Tests chat functionality during file transfers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatIntegration, useChatVisibility } from '@/lib/hooks/use-chat-integration';
import type { ChatEvent } from '@/lib/types/messaging-types';

// Mock dependencies
const mockChatManager = {
  initialize: vi.fn().mockResolvedValue(undefined),
  destroy: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue(undefined),
};

vi.mock('@/lib/chat/chat-manager', () => ({
  ChatManager: vi.fn(function MockChatManager() {
    return mockChatManager;
  }),
}));

vi.mock('@/lib/utils/secure-logger', () => ({
  secureLog: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/types/messaging-types', () => ({
  isChatEvent: (event: any): event is ChatEvent => {
    return event && typeof event === 'object' && 'type' in event;
  },
}));

// Mock RTCDataChannel
class MockRTCDataChannel extends EventTarget {
  label = 'test-channel';
  readyState: RTCDataChannelState = 'open';
  send = vi.fn();
  close = vi.fn();
}

// Mock SessionKeys
const mockSessionKeys = {
  sharedSecret: new Uint8Array(32),
  sendKey: new Uint8Array(32),
  receiveKey: new Uint8Array(32),
  sendNonce: new Uint8Array(12),
  receiveNonce: new Uint8Array(12),
};

describe('useChatIntegration', () => {
  let mockDataChannel: RTCDataChannel;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDataChannel = new MockRTCDataChannel() as unknown as RTCDataChannel;
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: null,
          sessionKeys: null,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      expect(result.current.chatManager).toBeNull();
      expect(result.current.isReady).toBe(false);
      expect(result.current.unreadCount).toBe(0);
      expect(result.current.error).toBeNull();
    });

    it('should not initialize when disabled', async () => {
      renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: false,
        })
      );

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockChatManager.initialize).not.toHaveBeenCalled();
    });

    it('should initialize when data channel and keys are ready', async () => {
      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockChatManager.initialize).toHaveBeenCalledWith(
        mockDataChannel,
        mockSessionKeys,
        'unknown',
        'Peer'
      );
    });

    it('should initialize with custom peer info', async () => {
      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          peerUserId: 'peer-123',
          peerUserName: 'Peer Name',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      expect(mockChatManager.initialize).toHaveBeenCalledWith(
        mockDataChannel,
        mockSessionKeys,
        'peer-123',
        'Peer Name'
      );
    });

    it('should generate unique session ID', () => {
      const { result: result1 } = renderHook(() =>
        useChatIntegration({
          dataChannel: null,
          sessionKeys: null,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      const { result: result2 } = renderHook(() =>
        useChatIntegration({
          dataChannel: null,
          sessionKeys: null,
          currentUserId: 'user-2',
          currentUserName: 'User 2',
          enabled: true,
        })
      );

      expect(result1.current.sessionId).not.toBe(result2.current.sessionId);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors', async () => {
      mockChatManager.initialize.mockRejectedValueOnce(new Error('Init failed'));

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.error).not.toBeNull();
      });

      expect(result.current.error?.message).toBe('Init failed');
      expect(result.current.isReady).toBe(false);
    });

    it('should clear error on successful initialization', async () => {
      mockChatManager.initialize
        .mockRejectedValueOnce(new Error('First fail'))
        .mockResolvedValueOnce(undefined);

      const { result, rerender } = renderHook(
        ({ enabled }) =>
          useChatIntegration({
            dataChannel: mockDataChannel,
            sessionKeys: mockSessionKeys,
            currentUserId: 'user-1',
            currentUserName: 'User 1',
            enabled,
          }),
        { initialProps: { enabled: true } }
      );

      await waitFor(() => {
        expect(result.current.error).toBeDefined();
      });

      // Re-initialize by toggling enabled
      rerender({ enabled: false });
      rerender({ enabled: true });

      await waitFor(() => {
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Message Events', () => {
    it('should increment unread count on new message from peer', async () => {
      let eventCallback: ((event: ChatEvent) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          peerUserId: 'peer-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate incoming message event
      act(() => {
        eventCallback?.({
          type: 'message',
          message: {
            id: 'msg-1',
            content: 'Hello',
            senderId: 'peer-1',
            senderName: 'Peer',
            timestamp: Date.now(),
            encrypted: true,
          },
        } as ChatEvent);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });
    });

    it('should not increment unread count for own messages', async () => {
      let eventCallback: ((event: ChatEvent) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate own message event
      act(() => {
        eventCallback?.({
          type: 'message',
          message: {
            id: 'msg-1',
            content: 'Hello',
            senderId: 'user-1', // Own message
            senderName: 'User 1',
            timestamp: Date.now(),
            encrypted: true,
          },
        } as ChatEvent);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(0);
      });
    });

    it('should accumulate unread count', async () => {
      let eventCallback: ((event: ChatEvent) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          peerUserId: 'peer-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate multiple messages
      act(() => {
        eventCallback?.({
          type: 'message',
          message: {
            id: 'msg-1',
            content: 'Hello',
            senderId: 'peer-1',
            senderName: 'Peer',
            timestamp: Date.now(),
            encrypted: true,
          },
        } as ChatEvent);

        eventCallback?.({
          type: 'message',
          message: {
            id: 'msg-2',
            content: 'World',
            senderId: 'peer-1',
            senderName: 'Peer',
            timestamp: Date.now(),
            encrypted: true,
          },
        } as ChatEvent);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(2);
      });
    });

    it('should handle invalid chat events', async () => {
      let eventCallback: ((event: any) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate invalid event (no type)
      act(() => {
        eventCallback?.({ invalid: 'event' });
      });

      // Should not throw and unread count should remain 0
      expect(result.current.unreadCount).toBe(0);
    });

    it('should handle non-message events', async () => {
      let eventCallback: ((event: ChatEvent) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Simulate typing event
      act(() => {
        eventCallback?.({
          type: 'typing',
          userId: 'peer-1',
        } as ChatEvent);
      });

      // Should not increment unread count
      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Reset Unread Count', () => {
    it('should reset unread count to zero', async () => {
      let eventCallback: ((event: ChatEvent) => void) | null = null;

      mockChatManager.addEventListener.mockImplementation((type, callback) => {
        if (type === 'chat-event') {
          eventCallback = callback;
        }
      });

      const { result } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          peerUserId: 'peer-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isReady).toBe(true);
      });

      // Add unread messages
      act(() => {
        eventCallback?.({
          type: 'message',
          message: {
            id: 'msg-1',
            content: 'Hello',
            senderId: 'peer-1',
            senderName: 'Peer',
            timestamp: Date.now(),
            encrypted: true,
          },
        } as ChatEvent);
      });

      await waitFor(() => {
        expect(result.current.unreadCount).toBe(1);
      });

      // Reset
      act(() => {
        result.current.resetUnreadCount();
      });

      expect(result.current.unreadCount).toBe(0);
    });
  });

  describe('Cleanup', () => {
    it('should destroy chat manager on unmount', async () => {
      const { unmount } = renderHook(() =>
        useChatIntegration({
          dataChannel: mockDataChannel,
          sessionKeys: mockSessionKeys,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(mockChatManager.initialize).toHaveBeenCalled();
      });

      unmount();

      expect(mockChatManager.destroy).toHaveBeenCalled();
    });

    it('should not destroy if manager not initialized', () => {
      const { unmount } = renderHook(() =>
        useChatIntegration({
          dataChannel: null,
          sessionKeys: null,
          currentUserId: 'user-1',
          currentUserName: 'User 1',
          enabled: true,
        })
      );

      unmount();

      expect(mockChatManager.destroy).not.toHaveBeenCalled();
    });
  });

  describe('Re-initialization', () => {
    it('should re-initialize when data channel changes', async () => {
      const { rerender } = renderHook(
        ({ dataChannel }) =>
          useChatIntegration({
            dataChannel,
            sessionKeys: mockSessionKeys,
            currentUserId: 'user-1',
            currentUserName: 'User 1',
            enabled: true,
          }),
        { initialProps: { dataChannel: null } }
      );

      expect(mockChatManager.initialize).not.toHaveBeenCalled();

      rerender({ dataChannel: mockDataChannel });

      await waitFor(() => {
        expect(mockChatManager.initialize).toHaveBeenCalled();
      });
    });

    it('should prevent concurrent initialization', async () => {
      const { rerender } = renderHook(
        ({ dataChannel }) =>
          useChatIntegration({
            dataChannel,
            sessionKeys: mockSessionKeys,
            currentUserId: 'user-1',
            currentUserName: 'User 1',
            enabled: true,
          }),
        { initialProps: { dataChannel: null } }
      );

      // Rapidly change data channel multiple times
      rerender({ dataChannel: mockDataChannel });
      rerender({ dataChannel: new MockRTCDataChannel() as unknown as RTCDataChannel });
      rerender({ dataChannel: mockDataChannel });

      await waitFor(() => {
        expect(mockChatManager.initialize).toHaveBeenCalled();
      });

      // Should only initialize once (concurrent calls prevented)
      expect(mockChatManager.initialize).toHaveBeenCalledTimes(1);
    });
  });
});

describe('useChatVisibility', () => {
  it('should initialize with chat closed', () => {
    const { result } = renderHook(() => useChatVisibility());

    expect(result.current.isChatOpen).toBe(false);
    expect(result.current.unreadCount).toBe(0);
  });

  it('should open chat', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.openChat();
    });

    expect(result.current.isChatOpen).toBe(true);
  });

  it('should close chat', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.openChat();
    });

    expect(result.current.isChatOpen).toBe(true);

    act(() => {
      result.current.closeChat();
    });

    expect(result.current.isChatOpen).toBe(false);
  });

  it('should toggle chat state', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.toggleChat();
    });

    expect(result.current.isChatOpen).toBe(true);

    act(() => {
      result.current.toggleChat();
    });

    expect(result.current.isChatOpen).toBe(false);
  });

  it('should reset unread count when opening chat', () => {
    const { result } = renderHook(() => useChatVisibility());

    // Add unread messages
    act(() => {
      result.current.incrementUnread();
      result.current.incrementUnread();
    });

    expect(result.current.unreadCount).toBe(2);

    // Open chat
    act(() => {
      result.current.openChat();
    });

    expect(result.current.unreadCount).toBe(0);
  });

  it('should increment unread count when chat is closed', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.incrementUnread();
    });

    expect(result.current.unreadCount).toBe(1);
  });

  it('should not increment unread count when chat is open', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.openChat();
    });

    act(() => {
      result.current.incrementUnread();
    });

    expect(result.current.unreadCount).toBe(0); // Should remain 0
  });

  it('should accumulate unread count', () => {
    const { result } = renderHook(() => useChatVisibility());

    act(() => {
      result.current.incrementUnread();
      result.current.incrementUnread();
      result.current.incrementUnread();
    });

    expect(result.current.unreadCount).toBe(3);
  });
});
