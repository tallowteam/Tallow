# File Request Feature - Quick Start Guide

## Overview

Users can now **request specific files** from connected peers instead of just sending files. This bidirectional feature works over the existing P2P encrypted connection.

## Key Files Created

```
lib/hooks/use-file-request.ts                      # Core hook (350 lines)
components/transfer/FileRequestPanel.tsx           # UI component (450 lines)
components/transfer/FileRequestPanel.module.css    # Styling (250 lines)
lib/hooks/use-p2p-connection.ts                    # Updated (+40 lines)
app/transfer/page.tsx                              # Integrated (+30 lines)
```

## How It Works

### User Flow

1. **Connect to a peer** via Nearby/Internet/Friends
2. **Click "Requests" button** in header (appears when connected)
3. **Request Panel opens** as a sidebar
4. **Click "Request a File"** to send a request
5. **Fill optional fields**:
   - File Name: "vacation.jpg"
   - File Type: "image/*"
   - Message: "Can you send photos?"
6. **Peer receives notification** with accept/reject buttons
7. **On accept**: Native file picker opens
8. **Selected file** is transferred automatically

### Message Protocol

```javascript
// Outgoing Request
{
  type: 'file-request',
  id: 'uuid',
  from: 'user-123',
  fromName: 'Alice',
  fileName: 'report.pdf',     // optional
  fileType: '.pdf',           // optional
  message: 'Send me report',  // optional
  timestamp: 1234567890
}

// Response
{
  type: 'file-request-response',
  requestId: 'uuid',
  accepted: true  // or false
}
```

## Using the Hook

```tsx
import { useFileRequest } from '@/lib/hooks/use-file-request';

const {
  pendingRequests,      // Incoming requests
  outgoingRequests,     // Sent requests
  requestFile,          // Send request
  acceptRequest,        // Accept incoming
  rejectRequest,        // Decline incoming
  cancelRequest,        // Cancel outgoing
  handleMessage,        // Attach to data channel
} = useFileRequest({
  currentUserId: 'user-123',
  currentUserName: 'Alice',
  dataChannel: channel,
  onFileSelected: (file, requestId) => {
    // Send file after accepting request
    await sendFile(file);
  }
});

// Send a request
requestFile('document.pdf', '.pdf', 'Please send report');

// Accept an incoming request
acceptRequest(request.id);
```

## Using the Component

```tsx
import { FileRequestPanel } from '@/components/transfer/FileRequestPanel';

<FileRequestPanel
  currentUserId="user-123"
  currentUserName="Alice"
  dataChannel={dataChannel}
  peerName="Bob's Laptop"
  onFileSelected={handleFileSelected}
/>
```

## Integration Points

### 1. Data Channel Setup

The P2P connection hook now exports:
- `dataChannel` - Direct access to RTCDataChannel
- `onMessage()` - Callback for custom message handling

```tsx
const { dataChannel, onMessage } = useP2PConnection();

// Attach file request handler
onMessage((data) => {
  fileRequestHook.handleMessage(data);
});
```

### 2. Transfer Page Integration

File requests appear as a sidebar when connected:
- Header button: "Requests"
- Opens/closes sidebar
- Full request management UI
- Auto-closes on disconnect

## UI Components

### Request Panel
- Compact sidebar design
- Incoming requests section
- Sent requests section
- Empty state with instructions
- Disconnected banner

### Request Cards
- Sender name and timestamp
- Optional file details
- Accept/Reject buttons
- Status indicators (Waiting, Accepted, Rejected)

### Request Dialog
- Modal form for sending requests
- Optional fields with hints
- File name suggestion
- File type filter
- Custom message

## Styling

Uses design tokens from `globals.css`:

```css
/* Purple accent */
--primary-500: #5e5ce6

/* Text hierarchy */
--text-primary: #fafafa
--text-secondary: #a1a1aa
--text-tertiary: #71717a

/* Spacing */
--space-2, --space-3, --space-4, --space-6

/* Borders */
--border-subtle, --border-default

/* Transitions */
--transition-fast
```

## Security

- Type guards validate all messages
- Sanitized file names and messages
- Encrypted P2P channel
- User consent required for file selection
- No automatic file access

## Accessibility

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support
- Reduced motion support

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Requires WebRTC
- File System Access API

## Testing

```bash
# Start development server
npm run dev

# Connect two browser windows
# Window 1: Create room
# Window 2: Join room

# Test scenarios:
1. Send request with all fields
2. Send request with no fields
3. Accept and select file
4. Reject request
5. Cancel outgoing request
6. Multiple simultaneous requests
```

## Common Issues

### Request button doesn't appear
- Check if peer is connected
- Verify `connectedDevice` is not null

### File picker doesn't open
- Check browser permissions
- Verify data channel is open
- Check console for errors

### Messages not received
- Ensure `handleMessage()` is called
- Check data channel state
- Verify message format

## Future Enhancements

- [ ] Request history persistence
- [ ] File browsing interface
- [ ] Batch file requests
- [ ] Request templates
- [ ] Auto-accept from trusted peers
- [ ] Desktop notifications
- [ ] Request expiration

## Files Modified

### Created
- `lib/hooks/use-file-request.ts`
- `components/transfer/FileRequestPanel.tsx`
- `components/transfer/FileRequestPanel.module.css`

### Updated
- `lib/hooks/use-p2p-connection.ts`
- `app/transfer/page.tsx`

## API Quick Reference

```typescript
// Hook
useFileRequest(options: FileRequestOptions)

// Component
FileRequestPanel(props: FileRequestPanelProps)

// Request
requestFile(fileName?, fileType?, message?) => requestId

// Accept
acceptRequest(requestId: string) => void

// Reject
rejectRequest(requestId: string) => void

// Cancel
cancelRequest(requestId: string) => void
```

## Example Implementation

See `FILE_REQUEST_IMPLEMENTATION.md` for detailed documentation.

---

**Status**: ✅ Fully implemented and integrated
**Version**: 1.0
**Date**: 2026-02-06
