'use client';

/**
 * Chat Integration Hook
 * Manages chat functionality during file transfers
 */

import { useState, useEffect, useRef } from 'react';
import { ChatManager } from '../chat/chat-manager';
import { SessionKeys } from '../crypto/pqc-crypto-lazy';
import { generateUUID } from '../utils/uuid';
import { secureLog } from '../utils/secure-logger';
import { isChatEvent } from '../types/messaging-types';

export interface UseChatIntegrationOptions {
  dataChannel: RTCDataChannel | null;
  sessionKeys: SessionKeys | null;
  currentUserId: string;
  currentUserName: string;
  peerUserId?: string;
  peerUserName?: string;
  enabled?: boolean;
}

export interface UseChatIntegrationResult {
  chatManager: ChatManager | null;
  sessionId: string;
  isReady: boolean;
  unreadCount: number;
  error: Error | null;
  resetUnreadCount: () => void;
}

/**
 * Hook to integrate chat functionality into file transfer sessions
 */
export function useChatIntegration({
  dataChannel,
  sessionKeys,
  currentUserId,
  currentUserName,
  peerUserId: _peerUserId = 'unknown',
  peerUserName: _peerUserName = 'Peer',
  enabled = true,
}: UseChatIntegrationOptions): UseChatIntegrationResult {
  const [chatManager, setChatManager] = useState<ChatManager | null>(null);
  const [sessionId] = useState(() => generateUUID());
  const [isReady, setIsReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const initializingRef = useRef(false);

  // Initialize chat manager when data channel and keys are ready
  useEffect(() => {
    if (!enabled || !dataChannel || !sessionKeys || initializingRef.current) {
      return;
    }

    initializingRef.current = true;
    setIsReady(false);
    setError(null);

    const initializeChat = async () => {
      try {
        secureLog.log('[useChatIntegration] Initializing chat manager...');

        // Create chat manager
        const manager = new ChatManager(
          sessionId,
          currentUserId,
          currentUserName
        );

        // Initialize with data channel and session keys
        await manager.initialize(dataChannel, sessionKeys, _peerUserId, _peerUserName);

        // Subscribe to new message events for unread count
        manager.addEventListener('chat-event', (event: unknown) => {
          if (!isChatEvent(event)) {
            secureLog.warn('[useChatIntegration] Received invalid chat event');
            return;
          }

          if (event.type === 'message' && event.message && event.message.senderId !== currentUserId) {
            setUnreadCount(prev => prev + 1);
          }
        });

        setChatManager(manager);
        setIsReady(true);
        secureLog.log('[useChatIntegration] Chat manager ready');
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        secureLog.error('[useChatIntegration] Failed to initialize chat:', error);
        setError(error);
        setIsReady(false);
      } finally {
        initializingRef.current = false;
      }
    };

    initializeChat();

    // Cleanup on unmount
    return () => {
      if (chatManager) {
        chatManager.destroy();
      }
    };
  }, [enabled, dataChannel, sessionKeys, sessionId, currentUserId, currentUserName]);

  // Reset unread count when chat is opened (handled by parent component)
  const resetUnreadCount = () => {
    setUnreadCount(0);
  };

  return {
    chatManager,
    sessionId,
    isReady,
    unreadCount,
    error,
    resetUnreadCount,
  };
}

/**
 * Hook to manage chat visibility and unread count
 */
export function useChatVisibility() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const openChat = () => {
    setIsChatOpen(true);
    setUnreadCount(0); // Reset unread when opening
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const toggleChat = () => {
    if (isChatOpen) {
      closeChat();
    } else {
      openChat();
    }
  };

  const incrementUnread = () => {
    if (!isChatOpen) {
      setUnreadCount(prev => prev + 1);
    }
  };

  return {
    isChatOpen,
    unreadCount,
    openChat,
    closeChat,
    toggleChat,
    incrementUnread,
  };
}
