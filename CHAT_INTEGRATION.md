# Chat Integration Guide

This document describes how to integrate the real-time chat functionality with file transfers.

## Architecture Overview

The chat system is built on top of the existing PQC-encrypted WebRTC infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                    WebRTC DataChannel                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │  PQCTransferManager  │  │    ChatManager       │        │
│  │                      │  │                      │        │
│  │  - File chunks       │  │  - Chat messages     │        │
│  │  - Transfer status   │  │  - Typing indicators │        │
│  │  - Encryption        │  │  - Read receipts     │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                               │
│         Both share same PQC session keys                     │
│         (ML-KEM-768 + X25519 hybrid encryption)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Core Features
- **End-to-end encryption**: Messages encrypted with ML-KEM-768 + X25519
- **Real-time delivery**: Via WebRTC DataChannel (peer-to-peer)
- **Persistent storage**: IndexedDB for chat history
- **Message status**: Sending → Sent → Delivered → Read
- **Typing indicators**: Real-time typing status
- **Read receipts**: Know when messages are read

### Advanced Features
- **File attachments**: Send small files (<5MB) via chat
- **Message formatting**: Markdown support (bold, italic, code, links)
- **Emoji support**: Built-in emoji picker
- **Message editing**: Edit your sent messages
- **Message deletion**: Delete messages (local + peer)
- **Reply to messages**: Quote and reply to specific messages
- **Search**: Full-text search across message history
- **Export**: Export chat as JSON or TXT

## Integration Steps

### 1. Setup Chat Context

Wrap your app with the ChatProvider:

```tsx
import { ChatProvider } from '@/lib/context/chat-context';
import { useP2PConnection } from '@/lib/hooks/use-p2p-connection';

function TransferPage() {
  const p2p = useP2PConnection();
  const transferManager = usePQCTransfer();

  // Get session keys from transfer manager
  const sessionKeys = transferManager.getSessionInfo()?.sessionKeys;

  return (
    <ChatProvider
      options={{
        sessionId: 'unique-session-id',
        userId: 'current-user-id',
        userName: 'Current User Name',
        dataChannel: p2p.dataChannel,
        sessionKeys: sessionKeys,
        peerId: p2p.state.peerId,
        peerName: p2p.state.peerName,
      }}
    >
      {/* Your transfer UI */}
      <ChatPanel />
    </ChatProvider>
  );
}
```

### 2. Use Chat Hook

Use the `useChat` hook to access chat functionality:

```tsx
import { useChat } from '@/lib/hooks/use-chat';

function ChatUI() {
  const chat = useChat({
    sessionId: 'session-id',
    userId: 'user-id',
    userName: 'User Name',
    dataChannel: dataChannel,
    sessionKeys: sessionKeys,
    peerId: 'peer-id',
    peerName: 'Peer Name',
  });

  return (
    <div>
      <button onClick={() => chat.sendMessage('Hello!')}>
        Send Message
      </button>

      <div>
        {chat.messages.map(msg => (
          <div key={msg.id}>{msg.content}</div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Use Chat Panel Component

Use the pre-built ChatPanel component:

```tsx
import { ChatPanel } from '@/components/app/ChatPanel';
import { useChatContext } from '@/lib/context/chat-context';

function TransferWithChat() {
  const chat = useChatContext();

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Transfer UI */}
      <div>
        <TransferProgress />
      </div>

      {/* Chat Panel */}
      <div>
        <ChatPanel
          messages={chat.messages}
          typingIndicator={chat.typingIndicator}
          isInitialized={chat.isInitialized}
          peerName="Peer Name"
          currentUserId="user-id"
          unreadCount={chat.unreadCount}
          onSendMessage={chat.sendMessage}
          onSendFile={chat.sendFile}
          onTyping={chat.sendTyping}
          onStopTyping={chat.stopTyping}
          onMarkAsRead={chat.markAsRead}
          onDeleteMessage={chat.deleteMessage}
          onEditMessage={chat.editMessage}
          onSearchMessages={chat.searchMessages}
          onExportChat={chat.exportChat}
          onClearHistory={chat.clearHistory}
          onLoadMore={chat.loadMoreMessages}
        />
      </div>
    </div>
  );
}
```

## Integration with PQCTransferManager

The chat system shares the same DataChannel and session keys with file transfers:

```tsx
import { PQCTransferManager } from '@/lib/transfer/pqc-transfer-manager';
import { ChatManager } from '@/lib/chat/chat-manager';

// Initialize transfer manager
const transferManager = new PQCTransferManager();
await transferManager.initializeSession('send');

// Initialize chat manager with same session keys
const chatManager = new ChatManager(
  sessionId,
  userId,
  userName
);

// After key exchange completes
const sessionKeys = transferManager.getSessionInfo()?.sessionKeys;
const dataChannel = /* your WebRTC data channel */;

await chatManager.initialize(
  dataChannel,
  sessionKeys,
  peerId,
  peerName
);

// Handle incoming messages
dataChannel.onmessage = async (event) => {
  if (typeof event.data === 'string') {
    // Try chat manager first
    const handled = await chatManager.handleIncomingMessage(event.data);

    // If not a chat message, try transfer manager
    if (!handled) {
      await transferManager.handleIncomingMessage(event.data);
    }
  } else {
    // Binary data - handle as file chunk
    // (handled by transfer manager)
  }
};
```

## Message Protocol

Chat messages use JSON protocol over the DataChannel:

### Text Message
```json
{
  "type": "chat-message",
  "payload": {
    "encrypted": [/* encrypted message bytes */],
    "nonce": [/* encryption nonce */],
    "messageId": "msg-123"
  }
}
```

### Typing Indicator
```json
{
  "type": "chat-typing",
  "payload": {
    "userId": "user-123",
    "userName": "Alice"
  }
}
```

### Read Receipt
```json
{
  "type": "chat-read-receipt",
  "payload": {
    "messageId": "msg-123",
    "userId": "user-456"
  }
}
```

## Security Considerations

1. **End-to-end encryption**: All messages are encrypted with the same PQC keys as file transfers
2. **Forward secrecy**: Session keys are ephemeral and destroyed after the session
3. **No metadata leakage**: Message content, timestamps, and user names are encrypted
4. **Secure storage**: Messages in IndexedDB are scoped to session ID
5. **Input validation**: Message length limits and file size limits enforced
6. **XSS prevention**: User content is sanitized before rendering

## Storage

Messages are stored in IndexedDB with the following schema:

```typescript
interface ChatMessage {
  id: string;              // Unique message ID
  sessionId: string;       // Session scope
  senderId: string;        // Sender ID
  senderName: string;      // Sender name
  content: string;         // Message content
  type: MessageType;       // text | file | emoji | system
  status: MessageStatus;   // sending | sent | delivered | read | failed
  timestamp: Date;         // Send time
  editedAt?: Date;         // Edit time (if edited)
  replyToId?: string;      // ID of message being replied to
  fileAttachment?: {       // File attachment (if any)
    name: string;
    size: number;
    type: string;
    dataUrl?: string;
    encrypted: boolean;
  };
}
```

## Performance Optimization

1. **Message pagination**: Load 50 messages at a time
2. **Lazy loading**: Load older messages on scroll
3. **Virtual scrolling**: For large message lists (implement if needed)
4. **Message batching**: Group multiple status updates
5. **Debounced typing**: Typing indicators debounced to 3 seconds

## Error Handling

The chat system includes comprehensive error handling:

1. **Encryption failures**: Logged securely, user notified
2. **Send failures**: Automatic retry (3 attempts)
3. **Storage failures**: Graceful degradation (in-memory only)
4. **DataChannel closure**: Messages queued until reconnection

## Testing

### Unit Tests
```bash
npm run test:unit -- chat-manager.test.ts
npm run test:unit -- message-encryption.test.ts
npm run test:unit -- chat-storage.test.ts
```

### Integration Tests
```bash
npm run test:e2e -- chat-integration.spec.ts
```

## API Reference

### ChatManager

```typescript
class ChatManager {
  // Send a text message
  async sendMessage(content: string, replyToId?: string): Promise<ChatMessage>

  // Send a file attachment
  async sendFileAttachment(file: File): Promise<ChatMessage>

  // Send typing indicator
  sendTypingIndicator(): void

  // Stop typing indicator
  stopTypingIndicator(): void

  // Mark messages as read
  async markAsRead(messageIds: string[]): Promise<void>

  // Delete a message
  async deleteMessage(messageId: string): Promise<void>

  // Edit a message
  async editMessage(messageId: string, newContent: string): Promise<void>

  // Get message history
  async getMessages(limit?: number, offset?: number): Promise<ChatMessage[]>

  // Search messages
  async searchMessages(query: string): Promise<ChatMessage[]>

  // Export chat
  async exportChat(format: 'json' | 'txt'): Promise<string>

  // Clear history
  async clearHistory(): Promise<void>

  // Event listeners
  addEventListener(event: string, callback: (event: ChatEvent) => void): void
  removeEventListener(event: string, callback: (event: ChatEvent) => void): void
}
```

### useChat Hook

```typescript
interface UseChatReturn {
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

  // Manager instance
  chatManager: ChatManager | null;
}
```

## Troubleshooting

### Chat not initializing
- Ensure DataChannel is open before initializing ChatManager
- Verify session keys are available from PQCTransferManager
- Check browser console for initialization errors

### Messages not sending
- Verify DataChannel state is 'open'
- Check encryption is initialized with session keys
- Look for retry attempts in console logs

### Messages not persisting
- Check IndexedDB is available in browser
- Verify storage quota is not exceeded
- Check console for storage errors

## Future Enhancements

Potential improvements for future versions:

1. **Voice messages**: Record and send audio messages
2. **Rich media**: Image previews, video thumbnails
3. **Message reactions**: React to messages with emojis
4. **Thread support**: Organize messages in threads
5. **Presence indicators**: Online/offline status
6. **Message pinning**: Pin important messages
7. **Draft messages**: Auto-save unsent messages
8. **Message forwarding**: Forward messages to other chats
9. **Block/report**: User moderation features
10. **End-to-end verification**: Enhanced SAS verification for messages
