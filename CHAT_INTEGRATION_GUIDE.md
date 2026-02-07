# Chat Integration Guide

This document explains how to wire the E2E encrypted chat system to the ChatPanel UI component and integrate it into the transfer page.

## Architecture Overview

The chat system consists of:

1. **Chat Manager** (`lib/chat/chat-manager.ts`) - Handles message send/receive, typing indicators, read receipts
2. **Chat Encryption** (`lib/chat/message-encryption.ts`) - E2E encryption using PQC (ML-KEM-768 + X25519)
3. **Chat Storage** (`lib/chat/chat-storage.ts`) - IndexedDB persistence for message history
4. **useChat Hook** (`lib/hooks/use-chat.ts`) - React hook that connects all pieces together
5. **ChatPanel Component** (`components/transfer/ChatPanel.tsx`) - UI sidebar component

## Integration Steps

### Step 1: Update Transfer Page Imports

Add the ChatPanel component import to `app/transfer/page.tsx`:

```typescript
import ChatPanel from '@/components/transfer/ChatPanel';
```

### Step 2: Add Chat State

Add chat visibility state after existing state declarations:

```typescript
const [showChat, setShowChat] = useState(false);
```

### Step 3: Extract Connection State

The orchestrator provides the connection state needed for chat. Add after the orchestrator initialization:

```typescript
// Get connection state for chat
const connectedDevice = orchestrator.connection?.connectedDevice;
const dataChannel = orchestrator.connection?.dataChannel;
const sessionKeys = orchestrator.connection?.sessionKeys;
```

###Step 4: Generate User Identity

Add user identity generation (one-time per session):

```typescript
// Current user info (generate unique ID per session)
const [currentUserId] = useState(() =>
  `user-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
);
const [currentUserName] = useState(() => {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent.includes('Mac') ? 'Mac User' :
           window.navigator.userAgent.includes('Windows') ? 'Windows User' :
           window.navigator.userAgent.includes('iPhone') ? 'iPhone User' :
           window.navigator.userAgent.includes('Android') ? 'Android User' : 'Web User';
  }
  return 'Web User';
});
```

### Step 5: Add Chat Toggle Handler

```typescript
const handleToggleChat = useCallback(() => {
  setShowChat((prev) => !prev);
}, []);
```

### Step 6: Compute Chat Availability

```typescript
const isChatAvailable = !!connectedDevice && !!dataChannel && !!sessionKeys;
```

### Step 7: Update Header to Include Chat Button

Replace the single history button with a button group:

```tsx
<div className={styles.headerButtons}>
  {/* Chat Toggle Button */}
  {isChatAvailable && (
    <button
      onClick={handleToggleChat}
      className={`${styles.chatButton} ${showChat ? styles.active : ''}`}
      aria-label={showChat ? 'Hide chat' : 'Show chat'}
    >
      <ChatIcon />
      <span>Chat</span>
    </button>
  )}

  {/* History Button */}
  <button
    onClick={() => setShowHistory(!showHistory)}
    className={styles.historyButton}
    aria-label={showHistory ? 'Hide history' : 'Show history'}
  >
    <HistoryIcon />
    <span>History</span>
  </button>
</div>
```

### Step 8: Add ChatIcon Component

Add the ChatIcon component after existing icon components:

```tsx
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
```

### Step 9: Add ChatPanel Component

Add the ChatPanel component before the closing container div, after the history sidebar:

```tsx
{/* Chat Panel */}
{isChatAvailable && (
  <ChatPanel
    isOpen={showChat}
    onClose={() => setShowChat(false)}
    peerId={connectedDevice.id}
    peerName={connectedDevice.name}
    sessionId={`session-${connectedDevice.id}-${Date.now()}`}
    userId={currentUserId}
    userName={currentUserName}
    dataChannel={dataChannel}
    sessionKeys={sessionKeys}
  />
)}
```

### Step 10: Update CSS for Header Buttons

Add to `app/transfer/page.module.css`:

```css
.headerButtons {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.chatButton {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: #a1a1a1;
  background: rgba(23, 23, 23, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.chatButton:hover {
  color: #ededed;
  background: rgba(23, 23, 23, 0.9);
  border-color: rgba(94, 92, 230, 0.3);
  transform: translateY(-1px);
}

.chatButton.active {
  color: #ffffff;
  background: linear-gradient(135deg, #5e5ce6 0%, #6b69f5 100%);
  border-color: #5e5ce6;
}

@media (max-width: 768px) {
  .headerButtons {
    gap: var(--space-2);
  }

  .chatButton span,
  .historyButton span {
    display: none;
  }
}
```

## How It Works

### Connection Flow

1. User selects a device → `handleDeviceSelect` called
2. Orchestrator establishes WebRTC connection → creates DataChannel
3. PQC key exchange completes → generates SessionKeys
4. Chat button appears in header (only when connected)
5. User clicks chat → ChatPanel slides in from right
6. useChat hook initializes ChatManager with DataChannel and SessionKeys
7. Messages are encrypted with E2E encryption before sending

### Message Flow

**Sending:**
1. User types message in ChatPanel input
2. ChatPanel calls `sendMessage` from useChat hook
3. useChat forwards to ChatManager.sendMessage()
4. ChatManager encrypts message with MessageEncryption
5. Encrypted message sent via DataChannel
6. Message saved to IndexedDB
7. UI updated with "sending" → "sent" → "delivered" → "read" statuses

**Receiving:**
1. DataChannel receives encrypted message
2. useChat hook intercepts via DataChannel.onmessage
3. ChatManager.handleIncomingMessage() called
4. Message decrypted and authenticated (HMAC + sequence number)
5. Saved to IndexedDB
6. Event emitted → useChat updates messages state
7. ChatPanel re-renders with new message

### Security Features

1. **End-to-End Encryption**: ML-KEM-768 (post-quantum) + X25519 hybrid
2. **Forward Secrecy**: Each message has unique nonce
3. **Replay Protection**: Monotonic sequence numbers
4. **Authentication**: HMAC signatures on top of AES-GCM
5. **Memory Safety**: Secure buffer wiping after use

### Typing Indicators

- Throttled to 1 per second to avoid spam
- Auto-expire after 3 seconds
- Sent via DataChannel (not encrypted, metadata only)

### Read Receipts

- Sent when ChatPanel is open and messages are visible
- Updates message status: sending → sent → delivered → read
- Blue checkmarks for read messages

### Message Persistence

- IndexedDB stores messages per session
- Scoped to sessionId for privacy
- Messages can be exported (JSON/TXT format)
- Clear history to delete all messages

## Testing the Integration

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Open Two Browser Windows**
   - Window A: http://localhost:3000/transfer
   - Window B: http://localhost:3000/transfer

3. **Connect Devices**
   - In Window A: Select a file
   - In Window A: Click on discovered device from Window B
   - Wait for connection to establish

4. **Test Chat**
   - Chat button should appear in both windows
   - Click chat button to open panel
   - Type message and send
   - Message should appear in both windows
   - Check for typing indicators
   - Verify read receipts (checkmarks)

## Troubleshooting

**Chat button doesn't appear:**
- Check that WebRTC connection is established
- Verify dataChannel state is "open"
- Check sessionKeys are present in orchestrator

**Messages not sending:**
- Open browser console for errors
- Check DataChannel readyState
- Verify encryption keys are initialized

**Messages not receiving:**
- Check DataChannel.onmessage is hooked up
- Verify handleIncomingMessage is called
- Check for decryption errors in console

**Typing indicators not working:**
- Verify DataChannel is open
- Check throttling (1 per second limit)
- Look for protocol messages in network tab

## Future Enhancements

1. **Unread Message Badge**: Show count on chat button
2. **Sound Effects**: Play sound on message receive
3. **File Attachments**: Send files via chat (already supported in ChatManager)
4. **Message Reactions**: Add emoji reactions
5. **Search Messages**: Full-text search (already supported in ChatManager)
6. **Export Chat**: Download conversation (already supported)
7. **Notifications**: Browser notifications when chat closed
8. **Message Editing**: Edit sent messages (already supported)
9. **Message Deletion**: Delete messages (already supported)

## File Locations

- **Transfer Page**: `c:\Users\aamir\Documents\Apps\Tallow\app\transfer\page.tsx`
- **ChatPanel Component**: `c:\Users\aamir\Documents\Apps\Tallow\components\transfer\ChatPanel.tsx`
- **ChatPanel Styles**: `c:\Users\aamir\Documents\Apps\Tallow\components\transfer\ChatPanel.module.css`
- **useChat Hook**: `c:\Users\aamir\Documents\Apps\Tallow\lib\hooks\use-chat.ts`
- **ChatManager**: `c:\Users\aamir\Documents\Apps\Tallow\lib\chat\chat-manager.ts`
- **Message Encryption**: `c:\Users\aamir\Documents\Apps\Tallow\lib\chat\message-encryption.ts`
- **Chat Storage**: `c:\Users\aamir\Documents\Apps\Tallow\lib\chat\chat-storage.ts`

## Complete Code Changes

See the attached files for complete implementation:
- `app/transfer/page.tsx` - Updated with chat integration
- `app/transfer/page.module.css` - Added chat button styles

The ChatPanel component and useChat hook are already complete and don't need changes.
