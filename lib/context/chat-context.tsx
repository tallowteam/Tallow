'use client';

/**
 * Chat Context
 * Provides chat state and functions throughout the app
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useChat, UseChatOptions, UseChatReturn } from '../hooks/use-chat';

// Context is a thin wrapper around useChat hook - type alias for UseChatReturn
type ChatContextValue = UseChatReturn;

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  options: UseChatOptions;
}

export function ChatProvider({ children, options }: ChatProviderProps) {
  const chat = useChat(options);

  // Memoize context value to prevent unnecessary re-renders (React 18 optimization)
  // The useChat hook already uses useCallback for all functions, so we just need to
  // memoize the object reference based on the state values
  const contextValue = useMemo<ChatContextValue>(() => ({
    messages: chat.messages,
    typingIndicator: chat.typingIndicator,
    isInitialized: chat.isInitialized,
    unreadCount: chat.unreadCount,
    sendMessage: chat.sendMessage,
    sendFile: chat.sendFile,
    sendTyping: chat.sendTyping,
    stopTyping: chat.stopTyping,
    markAsRead: chat.markAsRead,
    deleteMessage: chat.deleteMessage,
    editMessage: chat.editMessage,
    searchMessages: chat.searchMessages,
    exportChat: chat.exportChat,
    clearHistory: chat.clearHistory,
    loadMoreMessages: chat.loadMoreMessages,
    chatManager: chat.chatManager,
  }), [
    chat.messages,
    chat.typingIndicator,
    chat.isInitialized,
    chat.unreadCount,
    chat.sendMessage,
    chat.sendFile,
    chat.sendTyping,
    chat.stopTyping,
    chat.markAsRead,
    chat.deleteMessage,
    chat.editMessage,
    chat.searchMessages,
    chat.exportChat,
    chat.clearHistory,
    chat.loadMoreMessages,
    chat.chatManager,
  ]);

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}

export default ChatContext;
