# ChatPanel Quick Reference

**5-Minute Integration Guide**

---

## Import

```tsx
import { ChatPanel } from '@/components/transfer';
```

---

## Basic Setup (3 steps)

### 1. Add State

```tsx
const [isChatOpen, setIsChatOpen] = useState(false);
```

### 2. Add Button

```tsx
<button onClick={() => setIsChatOpen(true)}>
  Chat
</button>
```

### 3. Add Component

```tsx
<ChatPanel
  isOpen={isChatOpen}
  onClose={() => setIsChatOpen(false)}
  peerId={peerId}
  peerName="Alice"
  sessionId={sessionId}
  userId={userId}
  userName="Bob"
  dataChannel={dataChannel}
  sessionKeys={sessionKeys}
/>
```

---

## Props Reference

```tsx
interface ChatPanelProps {
  isOpen: boolean;              // Panel visibility
  onClose: () => void;          // Close handler
  peerId: string;               // Peer ID (required)
  peerName?: string;            // Peer name (optional)
  sessionId: string;            // Session ID (required)
  userId: string;               // User ID (required)
  userName: string;             // User name (required)
  dataChannel?: RTCDataChannel; // WebRTC channel
  sessionKeys?: SessionKeys;    // PQC keys
}
```

---

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import { ChatPanel } from '@/components/transfer';

export default function TransferPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Your transfer hook
  const { peerId, sessionId, userId, dataChannel, sessionKeys } = useTransfer();

  return (
    <div>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5e5ce6, #6b69f5)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(94, 92, 230, 0.4)',
        }}
      >
        💬
      </button>

      {/* Chat Panel */}
      <ChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        peerId={peerId}
        sessionId={sessionId}
        userId={userId}
        userName="You"
        dataChannel={dataChannel}
        sessionKeys={sessionKeys}
      />
    </div>
  );
}
```

---

## Features Checklist

✅ End-to-end encryption (ML-KEM-768)
✅ Real-time messaging
✅ Typing indicators
✅ Read receipts
✅ Message persistence
✅ Dark theme
✅ Mobile responsive
✅ Accessibility

---

## Common Patterns

### With Unread Badge

```tsx
const { unreadCount } = useChat({ ... });

<button onClick={() => setIsChatOpen(true)}>
  Chat
  {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
</button>
```

### With Custom Styling

```tsx
<div className="my-custom-wrapper">
  <ChatPanel {...props} />
</div>
```

### With Keyboard Shortcut

```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'k') {
      setIsChatOpen(prev => !prev);
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Chat stuck on "Connecting..." | Verify `dataChannel.readyState === 'open'` |
| Messages not sending | Check `dataChannel` and `sessionKeys` are valid |
| Typing indicator missing | Normal - throttled to 1/sec, auto-clears after 5s |
| Panel not sliding in | Ensure `isOpen={true}` prop is set |

---

## Key Bindings

- **Enter**: Send message
- **Escape**: Close panel (optional)
- **Tab**: Navigate between input and buttons

---

## Styling Variables

```css
--sent-bg: linear-gradient(135deg, #5e5ce6, #6b69f5);
--received-bg: #27272a;
--panel-bg: #18181b;
--border-color: rgba(63, 63, 70, 0.4);
```

---

## Performance Tips

1. **Lazy load**: Only render when `isConnected`
2. **Memoize props**: Use `useMemo` for stable references
3. **Debounce typing**: Already handled internally
4. **Virtual scrolling**: Automatic for 50+ messages

---

## Security Notes

- Messages encrypted with PQC before sending
- HMAC authentication on every message
- Replay attack protection via sequence numbers
- Secure memory wiping after use
- IndexedDB storage encrypted

---

## Mobile Considerations

- Full-width panel on mobile (<768px)
- 400px sidebar on desktop (≥768px)
- Touch-friendly 44px buttons
- Smooth native scrolling

---

## Browser Requirements

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- WebRTC support
- IndexedDB support

---

**That's it! You're ready to go.** 🚀

For detailed docs, see `CHAT_PANEL_README.md`
