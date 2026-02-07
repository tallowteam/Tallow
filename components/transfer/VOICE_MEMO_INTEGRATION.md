# Voice Memo ChatPanel Integration Guide

Step-by-step guide to integrate voice memo recording into Tallow's ChatPanel component.

## Overview

This guide demonstrates how to add voice memo recording capability to the existing ChatPanel component, allowing users to send voice messages during P2P file transfers.

## Integration Steps

### Step 1: Add Voice Memo State to ChatPanel

```typescript
// components/transfer/ChatPanel.tsx

import { useState } from 'react';
import VoiceMemo from './VoiceMemo';

export default function ChatPanel({ /* existing props */ }) {
  // Existing state
  const [inputValue, setInputValue] = useState('');

  // Add voice memo state
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Existing hooks
  const { sendMessage, sendFileAttachment } = useChat({ /* ... */ });

  // ... rest of component
}
```

### Step 2: Create Voice Memo Send Handler

```typescript
// Inside ChatPanel component

const handleSendVoiceMemo = async (audioBlob: Blob, duration: number) => {
  if (!isInitialized) {
    console.error('Chat not initialized');
    return;
  }

  try {
    // Convert blob to File
    const timestamp = Date.now();
    const file = new File(
      [audioBlob],
      `voice-memo-${timestamp}.webm`,
      { type: audioBlob.type }
    );

    // Send as file attachment via chat manager
    await sendFileAttachment(file);

    // Hide recorder after successful send
    setShowVoiceRecorder(false);

    // Optional: Show success feedback
    console.log('Voice memo sent successfully');
  } catch (error) {
    console.error('Failed to send voice memo:', error);
    // Keep recorder open to allow retry
  }
};

const handleCancelVoiceMemo = () => {
  setShowVoiceRecorder(false);
};
```

### Step 3: Add Voice Memo Toggle Button

```typescript
// In the input area, add voice button next to send button

<form className={styles.inputArea} onSubmit={handleSubmit}>
  {/* Existing input */}
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

  {/* Voice memo button */}
  <button
    type="button"
    className={styles.voiceButton}
    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
    disabled={!isInitialized}
    aria-label="Record voice memo"
    title="Record voice memo"
  >
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  </button>

  {/* Existing send button */}
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
```

### Step 4: Add Voice Recorder to Layout

```typescript
// After the input area, add voice recorder

{/* Voice Recorder */}
{showVoiceRecorder && (
  <div className={styles.voiceRecorderContainer}>
    <VoiceMemo
      onSend={handleSendVoiceMemo}
      onCancel={handleCancelVoiceMemo}
      maxDuration={5 * 60 * 1000} // 5 minutes
      compact // Use compact mode for chat panel
    />
  </div>
)}
```

### Step 5: Add CSS Styles

```css
/* components/transfer/ChatPanel.module.css */

/* Voice button styling */
.voiceButton {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.voiceButton:hover:not(:disabled) {
  background: var(--bg-elevated);
  color: var(--primary-500);
}

.voiceButton:active:not(:disabled) {
  transform: scale(0.95);
}

.voiceButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Voice recorder container */
.voiceRecorderContainer {
  padding: 16px;
  border-top: 1px solid var(--border-default);
  background: var(--bg-surface);
  animation: slideUp 0.2s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

## Complete Integration Example

Here's the complete modified ChatPanel with voice memo support:

```typescript
'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useChat } from '@/lib/hooks/use-chat';
import { ChatMessage } from '@/lib/chat/chat-manager';
import VoiceMemo from './VoiceMemo';
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
  sessionKeys?: any;
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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastTypingTimeRef = useRef<number>(0);

  const {
    messages,
    typingIndicator,
    isInitialized,
    unreadCount,
    sendMessage,
    sendFileAttachment,
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

  // Voice memo handlers
  const handleSendVoiceMemo = async (audioBlob: Blob, duration: number) => {
    if (!isInitialized) {
      console.error('[ChatPanel] Chat not initialized');
      return;
    }

    try {
      const file = new File(
        [audioBlob],
        `voice-memo-${Date.now()}.webm`,
        { type: audioBlob.type }
      );

      await sendFileAttachment(file);
      setShowVoiceRecorder(false);
      console.log(`[ChatPanel] Voice memo sent (${duration}ms)`);
    } catch (error) {
      console.error('[ChatPanel] Failed to send voice memo:', error);
      throw error; // Let VoiceMemo component handle the error
    }
  };

  const handleCancelVoiceMemo = () => {
    setShowVoiceRecorder(false);
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
            <span>Send a message or voice memo to start</span>
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

      {/* Voice Recorder */}
      {showVoiceRecorder && (
        <div className={styles.voiceRecorderContainer}>
          <VoiceMemo
            onSend={handleSendVoiceMemo}
            onCancel={handleCancelVoiceMemo}
            maxDuration={5 * 60 * 1000}
            compact
          />
        </div>
      )}

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
          type="button"
          className={styles.voiceButton}
          onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
          disabled={!isInitialized}
          aria-label="Record voice memo"
          title="Record voice memo"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        </button>
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
```

## Usage in Transfer Page

```tsx
// app/transfer/page.tsx or similar

import ChatPanel from '@/components/transfer/ChatPanel';

export default function TransferPage() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="transfer-container">
      {/* Other transfer UI */}

      {/* Chat Panel with Voice Memo Support */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        peerId="peer-123"
        peerName="Alice"
        sessionId="session-456"
        userId="user-789"
        userName="Bob"
        dataChannel={dataChannel}
        sessionKeys={sessionKeys}
      />
    </div>
  );
}
```

## Testing the Integration

### Manual Testing Steps

1. **Open ChatPanel**: Click to open chat during transfer
2. **Click Voice Button**: Microphone icon in input area
3. **Grant Permissions**: Allow microphone access
4. **Record**: Tap to start/stop or hold to record
5. **Preview**: Listen to recording with playback controls
6. **Send**: Click send button to share voice memo
7. **Verify**: Check message appears in chat history

### Test Cases

- Microphone permission granted/denied
- Recording pause/resume
- Max duration reached (auto-stop)
- Cancel during recording
- Playback before sending
- Network error during send
- Multiple recordings in sequence
- Voice memo display in chat history

## Troubleshooting

### Voice Button Not Appearing
- Check `isInitialized` state
- Verify CSS imports
- Check console for errors

### Microphone Access Denied
- User must grant permission
- Check browser settings
- Test with HTTPS (required for getUserMedia)

### Recording Not Stopping
- Check for JavaScript errors
- Verify event handlers are bound
- Test in different browsers

### File Not Sending
- Verify `sendFileAttachment` is working
- Check file size limits
- Test with regular files first

## Next Steps

1. Add voice memo display in message bubbles
2. Implement audio waveform in chat messages
3. Add playback controls for received voice memos
4. Show recording duration in message metadata
5. Add download option for voice memos

---

**Related Documentation**:
- [VOICE_MEMO_README.md](./VOICE_MEMO_README.md)
- [VOICE_MEMO_QUICK_REF.md](./VOICE_MEMO_QUICK_REF.md)
- [CHAT_PANEL_README.md](./CHAT_PANEL_README.md)
