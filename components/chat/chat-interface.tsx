'use client';

/**
 * Chat Interface Component
 * Complete chat UI with E2E encryption during file transfers
 */

import { useState, useEffect, useRef } from 'react';
import { ChatManager, ChatMessage } from '@/lib/chat/chat-manager';
import { MessageBubble } from './message-bubble';
import { MessageInput } from './message-input';
import { TypingIndicator } from './typing-indicator';
import { ChatHeader } from './chat-header';
import { secureLog } from '@/lib/utils/secure-logger';

export interface ChatInterfaceProps {
  chatManager: ChatManager;
  sessionId: string;
  currentUserId: string;
  currentUserName: string;
  peerUserId: string;
  peerUserName: string;
  onClose?: () => void;
  className?: string;
}

export function ChatInterface({
  chatManager,
  sessionId,
  currentUserId,
  currentUserName: _currentUserName,
  peerUserId: _peerUserId,
  peerUserName,
  onClose,
  className = '',
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load existing messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const existingMessages = await chatManager.getMessages();
        setMessages(existingMessages);
      } catch (error) {
        secureLog.error('[ChatInterface] Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [chatManager, sessionId]);

  // Subscribe to chat events
  useEffect(() => {
    const handleChatEvent = (event: any) => {
      switch (event.type) {
        case 'message':
          setMessages(prev => {
            // Prevent duplicates
            if (prev.some(m => m.id === event.message.id)) {
              return prev;
            }
            return [...prev, event.message];
          });
          break;

        case 'typing':
          if (event.indicator.userId !== currentUserId) {
            setIsTyping(true);
            // Auto-clear typing indicator after timeout
            setTimeout(() => setIsTyping(false), 3000);
          }
          break;

        case 'status-update':
          setMessages(prev =>
            prev.map(m =>
              m.id === event.messageId ? { ...m, status: event.status } : m
            )
          );
          break;

        case 'message-edited':
          setMessages(prev =>
            prev.map(m =>
              m.id === event.message.id ? event.message : m
            )
          );
          break;

        case 'message-deleted':
          setMessages(prev =>
            prev.filter(m => m.id !== event.messageId)
          );
          break;
      }
    };

    chatManager.addEventListener('chat-event', handleChatEvent);

    return () => {
      chatManager.removeEventListener('chat-event', handleChatEvent);
    };
  }, [chatManager, currentUserId]);

  // Check connection status - chatManager is connected when it exists
  useEffect(() => {
    setIsConnected(!!chatManager);
  }, [chatManager]);

  const handleSendMessage = async (content: string, file?: File) => {
    if (!content.trim() && !file) {return;}

    try {
      let message;
      if (file) {
        message = await chatManager.sendFileAttachment(file);
      } else {
        message = await chatManager.sendMessage(content);
      }

      // Optimistically add message to UI
      setMessages(prev => [...prev, message]);
    } catch (error) {
      secureLog.error('[ChatInterface] Failed to send message:', error);
      // TODO: Show error toast
    }
  };

  const handleTyping = () => {
    chatManager.sendTypingIndicator();
  };

  const handleStopTyping = () => {
    // Typing indicator is automatically stopped after timeout in ChatManager
  };

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-gray-900 ${className}`}>
      {/* Chat Header */}
      <ChatHeader
        peerName={peerUserName}
        isOnline={isConnected}
        onClose={onClose || (() => {})}
      />

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        role="log"
        aria-live="polite"
        aria-atomic="false"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <p className="text-center">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === currentUserId}
              onDelete={async (id) => {
                await chatManager.deleteMessage(id);
              }}
            />
          ))
        )}

        {/* Typing Indicator */}
        {isTyping && (
          <TypingIndicator userName={peerUserName} />
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      {/* Message Input */}
      <MessageInput
        onSend={handleSendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
        disabled={!isConnected}
        placeholder={
          isConnected
            ? 'Type a message...'
            : 'Connecting to peer...'
        }
      />

      {/* Connection Status Banner */}
      {!isConnected && (
        <div
          role="status"
          aria-live="polite"
          className="bg-yellow-100 dark:bg-yellow-900 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200 text-center"
        >
          <span aria-hidden="true">⚠️ </span>
          Reconnecting to peer...
        </div>
      )}
    </div>
  );
}
