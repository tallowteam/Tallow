'use client';

/**
 * useChat Hook
 * React hook for managing chat state and interactions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatManager, ChatMessage, ChatEvent, TypingIndicator } from '../chat/chat-manager';
import { SessionKeys } from '../crypto/pqc-crypto-lazy';
import secureLog from '../utils/secure-logger';

export interface UseChatOptions {
  sessionId: string;
  userId: string;
  userName: string;
  dataChannel?: RTCDataChannel | null;
  sessionKeys?: SessionKeys | null;
  peerId?: string | null;
  peerName?: string | null;
}

export interface UseChatReturn {
  // State
  messages: ChatMessage[];
  typingIndicator: TypingIndicator | null;
  isInitialized: boolean;
  unreadCount: number;

  // Actions
  sendMessage: (content: string, replyToId?: string) => Promise<ChatMessage>;
  sendFile: (file: File) => Promise<ChatMessage>;
  sendTyping: () => void;
  stopTyping: () => void;
  markAsRead: (messageIds: string[]) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  searchMessages: (query: string) => Promise<ChatMessage[]>;
  exportChat: (format: 'json' | 'txt') => Promise<string>;
  clearHistory: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;

  // Manager
  chatManager: ChatManager | null;
}

const MESSAGE_PAGE_SIZE = 50;

export function useChat(options: UseChatOptions): UseChatReturn {
  const { sessionId, userId, userName, dataChannel, sessionKeys, peerId, peerName } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingIndicator, setTypingIndicator] = useState<TypingIndicator | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageOffset, setMessageOffset] = useState(0);

  const chatManagerRef = useRef<ChatManager | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Initialize chat manager
   */
  useEffect(() => {
    if (!sessionId || !userId || !userName) {
      return;
    }

    // Create chat manager
    const manager = new ChatManager(sessionId, userId, userName);
    chatManagerRef.current = manager;

    // Initialize if we have all required data
    if (dataChannel && sessionKeys && peerId && peerName) {
      manager
        .initialize(dataChannel, sessionKeys, peerId, peerName)
        .then(async () => {
          setIsInitialized(true);

          // Load initial messages
          const initialMessages = await manager.getMessages(MESSAGE_PAGE_SIZE, 0);
          setMessages(initialMessages);
          setMessageOffset(MESSAGE_PAGE_SIZE);

          secureLog.log('[useChat] Initialized with', initialMessages.length, 'messages');
        })
        .catch((error) => {
          secureLog.error('[useChat] Initialization failed:', error);
        });
    }

    // Setup event listeners
    const handleEvent = (event: ChatEvent) => {
      switch (event.type) {
        case 'message':
          setMessages((prev) => {
            // Check if message already exists (avoid duplicates)
            const exists = prev.some(m => m.id === event.message.id);
            if (exists) {
              // Update existing message
              return prev.map(m => m.id === event.message.id ? event.message : m);
            }
            // Add new message at the beginning (newest first)
            return [event.message, ...prev];
          });

          // Increment unread count if from peer
          if (event.message.senderId !== userId) {
            setUnreadCount(prev => prev + 1);
          }
          break;

        case 'typing':
          // Clear existing typing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }

          if (event.indicator.userId !== userId) {
            setTypingIndicator(event.indicator);

            // Auto-clear typing indicator after 5 seconds
            typingTimeoutRef.current = setTimeout(() => {
              setTypingIndicator(null);
            }, 5000);
          }
          break;

        case 'status-update':
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.messageId ? { ...m, status: event.status } : m
            )
          );
          break;

        case 'message-deleted':
          setMessages((prev) => prev.filter((m) => m.id !== event.messageId));
          break;

        case 'message-edited':
          setMessages((prev) =>
            prev.map((m) => (m.id === event.message.id ? event.message : m))
          );
          break;

        case 'read-receipt':
          // Update message status to read
          setMessages((prev) =>
            prev.map((m) =>
              m.id === event.receipt.messageId ? { ...m, status: 'read' } : m
            )
          );
          break;
      }
    };

    manager.addEventListener('*', handleEvent);

    return () => {
      manager.removeEventListener('*', handleEvent);
      manager.destroy();
      chatManagerRef.current = null;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [sessionId, userId, userName, dataChannel, sessionKeys, peerId, peerName]);

  /**
   * Handle incoming DataChannel messages
   */
  useEffect(() => {
    if (!dataChannel || !chatManagerRef.current) {
      return;
    }

    const originalOnMessage = dataChannel.onmessage;

    const handleMessage = async (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        // Try to handle as chat message
        const handled = await chatManagerRef.current?.handleIncomingMessage(event.data);

        // If not handled by chat, call original handler
        if (!handled && originalOnMessage) {
          originalOnMessage.call(dataChannel, event);
        }
      } else if (originalOnMessage) {
        // Binary data - call original handler
        originalOnMessage.call(dataChannel, event);
      }
    };

    dataChannel.onmessage = handleMessage;

    return () => {
      if (dataChannel.onmessage === handleMessage) {
        dataChannel.onmessage = originalOnMessage;
      }
    };
  }, [dataChannel]);

  /**
   * Send a text message
   */
  const sendMessage = useCallback(
    async (content: string, replyToId?: string): Promise<ChatMessage> => {
      if (!chatManagerRef.current) {
        throw new Error('Chat not initialized');
      }
      return chatManagerRef.current.sendMessage(content, replyToId);
    },
    []
  );

  /**
   * Send a file
   */
  const sendFile = useCallback(async (file: File): Promise<ChatMessage> => {
    if (!chatManagerRef.current) {
      throw new Error('Chat not initialized');
    }
    return chatManagerRef.current.sendFileAttachment(file);
  }, []);

  /**
   * Send typing indicator
   */
  const sendTyping = useCallback(() => {
    chatManagerRef.current?.sendTypingIndicator();
  }, []);

  /**
   * Stop typing indicator
   */
  const stopTyping = useCallback(() => {
    chatManagerRef.current?.stopTypingIndicator();
  }, []);

  /**
   * Mark messages as read
   */
  const markAsRead = useCallback(async (messageIds: string[]): Promise<void> => {
    if (!chatManagerRef.current) {return;}
    await chatManagerRef.current.markAsRead(messageIds);
    setUnreadCount(0);
  }, []);

  /**
   * Delete a message
   */
  const deleteMessage = useCallback(async (messageId: string): Promise<void> => {
    if (!chatManagerRef.current) {return;}
    await chatManagerRef.current.deleteMessage(messageId);
  }, []);

  /**
   * Edit a message
   */
  const editMessage = useCallback(
    async (messageId: string, newContent: string): Promise<void> => {
      if (!chatManagerRef.current) {return;}
      await chatManagerRef.current.editMessage(messageId, newContent);
    },
    []
  );

  /**
   * Search messages
   */
  const searchMessages = useCallback(async (query: string): Promise<ChatMessage[]> => {
    if (!chatManagerRef.current) {return [];}
    return chatManagerRef.current.searchMessages(query);
  }, []);

  /**
   * Export chat history
   */
  const exportChat = useCallback(async (format: 'json' | 'txt'): Promise<string> => {
    if (!chatManagerRef.current) {return '';}
    return chatManagerRef.current.exportChat(format);
  }, []);

  /**
   * Clear chat history
   */
  const clearHistory = useCallback(async (): Promise<void> => {
    if (!chatManagerRef.current) {return;}
    await chatManagerRef.current.clearHistory();
    setMessages([]);
    setMessageOffset(0);
  }, []);

  /**
   * Load more messages (pagination)
   */
  const loadMoreMessages = useCallback(async (): Promise<void> => {
    if (!chatManagerRef.current) {return;}

    const olderMessages = await chatManagerRef.current.getMessages(
      MESSAGE_PAGE_SIZE,
      messageOffset
    );

    if (olderMessages.length > 0) {
      setMessages((prev) => [...prev, ...olderMessages]);
      setMessageOffset((prev) => prev + olderMessages.length);
    }
  }, [messageOffset]);

  return {
    messages,
    typingIndicator,
    isInitialized,
    unreadCount,
    sendMessage,
    sendFile,
    sendTyping,
    stopTyping,
    markAsRead,
    deleteMessage,
    editMessage,
    searchMessages,
    exportChat,
    clearHistory,
    loadMoreMessages,
    chatManager: chatManagerRef.current,
  };
}
