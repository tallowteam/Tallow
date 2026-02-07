'use client';

/**
 * ChatPanel Component
 * E2E encrypted chat sidebar for real-time messaging during file transfers
 * Features:
 * - Slide-in panel from right side
 * - Message bubbles (sent = purple, received = gray)
 * - Typing indicators
 * - Read receipts and delivery status
 * - E2E encryption badge
 * - Smooth animations
 */

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useChat } from '@/lib/hooks/use-chat';
import { ChatMessage } from '@/lib/chat/chat-manager';
import styles from './ChatPanel.module.css';

export interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  peerId: string;
  peerName?: string;
  sessionId: string;
  userId: string;
  userName: string;
  dataChannel?: RTCDataChannel | null;
  sessionKeys?: any; // SessionKeys type
}

export default function ChatPanel({
  isOpen,
  onClose,
  peerId,
  peerName = 'Peer',
  sessionId,
  userId,
  userName,
  dataChannel,
  sessionKeys,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const {
    messages,
    typingIndicator,
    isInitialized,
    unreadCount,
    sendMessage,
    sendTyping,
    stopTyping,
    markAsRead,
  } = useChat({
    sessionId,
    userId,
    userName,
    dataChannel: dataChannel ?? null,
    sessionKeys: sessionKeys ?? null,
    peerId,
    peerName,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Mark messages as read when panel opens
  useEffect(() => {
    if (isOpen && messages.length > 0 && unreadCount > 0) {
      const unreadMessageIds = messages
        .filter((m) => m.senderId !== userId && m.status !== 'read')
        .map((m) => m.id);

      if (unreadMessageIds.length > 0) {
        markAsRead(unreadMessageIds);
      }
    }
  }, [isOpen, messages, userId, unreadCount, markAsRead]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);

    // Throttle typing indicators (max 1 per second)
    const now = Date.now();
    if (now - lastTypingTimeRef.current > 1000) {
      sendTyping();
      lastTypingTimeRef.current = now;
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim() || !isInitialized) {
      return;
    }

    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
      stopTyping();
    } catch (error) {
      console.error('[ChatPanel] Failed to send message:', error);
    }
  };

  const handleInputBlur = () => {
    stopTyping();
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'sending':
        return '○';
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      case 'failed':
        return '✗';
      default:
        return '';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.timestamp).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, ChatMessage[]>);

  return (
    <div className={`${styles.chatPanel} ${isOpen ? styles.open : ''}`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInfo}>
            <h3 className={styles.peerName}>{peerName}</h3>
            <div className={styles.encryptionBadge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messagesContainer}>
        {!isInitialized ? (
          <div className={styles.connectingState}>
            <div className={styles.spinner} />
            <p>Establishing secure connection...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <p>No messages yet</p>
            <span>Send a message to start the conversation</span>
          </div>
        ) : (
          <div className={styles.messagesList}>
            {Object.entries(groupedMessages).map(([date, msgs]) => (
              <div key={date} className={styles.dateGroup}>
                <div className={styles.dateDivider}>
                  <span>{date === new Date().toLocaleDateString() ? 'Today' : date}</span>
                </div>
                {msgs.reverse().map((message) => {
                  const isSent = message.senderId === userId;
                  return (
                    <div
                      key={message.id}
                      className={`${styles.messageWrapper} ${isSent ? styles.sent : styles.received}`}
                    >
                      <div className={styles.messageBubble}>
                        <div className={styles.messageContent}>
                          {message.content}
                        </div>
                        <div className={styles.messageFooter}>
                          <span className={styles.messageTime}>
                            {formatTime(new Date(message.timestamp))}
                          </span>
                          {isSent && (
                            <span
                              className={`${styles.messageStatus} ${
                                message.status === 'read' ? styles.read : ''
                              }`}
                            >
                              {getStatusIcon(message.status)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {typingIndicator && typingIndicator.userId !== userId && (
              <div className={styles.typingIndicator}>
                <div className={styles.typingBubble}>
                  <div className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <form className={styles.inputArea} onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={isInitialized ? 'Type a message...' : 'Connecting...'}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={!isInitialized}
          maxLength={10000}
        />
        <button
          type="submit"
          className={styles.sendButton}
          disabled={!inputValue.trim() || !isInitialized}
          aria-label="Send message"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </form>
    </div>
  );
}
