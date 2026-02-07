# File Request Feature Implementation

## Overview

The file request feature allows users to request specific files from connected peers. This is a bidirectional feature where users can both send requests and respond to incoming requests.

## Architecture

### Components

1. **`lib/hooks/use-file-request.ts`** - Core hook managing file request state and logic
2. **`components/transfer/FileRequestPanel.tsx`** - UI component for displaying and managing requests
3. **`components/transfer/FileRequestPanel.module.css`** - Styling with design tokens
4. **`lib/hooks/use-p2p-connection.ts`** - Updated to support file request messages

## Features

### Request Flow

1. **Outgoing Request**:
   - User clicks "Request a File" button
   - Opens modal to specify optional parameters:
     - File name (e.g., "report.pdf")
     - File type filter (e.g., ".pdf", "image/*")
     - Custom message
   - Request sent via P2P data channel
   - Shows "Waiting..." status

2. **Incoming Request**:
   - Peer receives request notification
   - Displays requester name, timestamp, and details
   - User can Accept or Decline
   - On Accept: Opens native file picker with optional type filter
   - Selected file is sent automatically

3. **Request Completion**:
   - Requester receives acceptance/rejection notification
   - File transfer begins immediately on acceptance
   - Completed requests can be cleared

## Message Protocol

### File Request Message

```typescript
{
  type: 'file-request',
  id: string,              // Unique request ID
  from: string,            // Sender user ID
  fromName: string,        // Sender display name
  fileName?: string,       // Optional suggested file name
  fileType?: string,       // Optional MIME type filter
  message?: string,        // Optional message
  timestamp: number        // Request timestamp
}
```

### File Request Response Message

```typescript
{
  type: 'file-request-response',
  requestId: string,       // Original request ID
  accepted: boolean        // true = accepted, false = rejected
}
```

## Usage Example

### In Transfer Page

```tsx
import { FileRequestPanel } from '@/components/transfer/FileRequestPanel';
import { useFileRequest } from '@/lib/hooks/use-file-request';

function TransferPage() {
  const { dataChannel } = useP2PConnection();

  const handleFileRequestSelected = async (file: File, requestId: string) => {
    // Send the file in response to the request
    await sendFile(file);
  };

  return (
    <FileRequestPanel
      currentUserId="user-123"
      currentUserName="Alice"
      dataChannel={dataChannel}
      peerName="Bob's Device"
      onFileSelected={handleFileRequestSelected}
    />
  );
}
```

### Standalone Hook Usage

```tsx
const {
  pendingRequests,      // Array of incoming requests
  outgoingRequests,     // Array of sent requests
  requestFile,          // Function to send a request
  acceptRequest,        // Function to accept a request
  rejectRequest,        // Function to reject a request
  cancelRequest,        // Function to cancel outgoing request
  handleMessage,        // Message handler to attach to data channel
} = useFileRequest({
  currentUserId: 'user-123',
  currentUserName: 'Alice',
  dataChannel: channel,
  onFileSelected: (file, requestId) => {
    // Handle file selection after accepting request
  },
  onRequestAccepted: (requestId) => {
    // Handle request acceptance
  },
  onRequestRejected: (requestId) => {
    // Handle request rejection
  },
});

// Send a request
requestFile('document.pdf', '.pdf', 'Can you send me the report?');

// Accept incoming request
acceptRequest(requestId);

// Reject incoming request
rejectRequest(requestId);
```

## Integration Points

### 1. P2P Connection Hook

The `use-p2p-connection.ts` hook has been updated to:
- Support file request message types
- Provide `onMessage` callback for custom message handling
- Export `dataChannel` reference for direct access

```tsx
const { dataChannel, onMessage } = useP2PConnection();

// Attach file request message handler
onMessage((data) => {
  handleMessage(data); // From useFileRequest
});
```

### 2. Transfer Orchestrator

File requests integrate seamlessly with the existing transfer system:
- Accepted requests trigger standard file transfers
- Uses existing encryption and security features
- Respects transfer queue and progress tracking

### 3. UI Integration

The FileRequestPanel can be placed:
- In a sidebar (current implementation)
- As a modal dialog
- In a dedicated tab
- As a floating panel

## Design Tokens Usage

The component uses design tokens from `globals.css`:

```css
/* Colors */
--primary-500: #5e5ce6;           /* Purple accent */
--text-primary: #fafafa;          /* Primary text */
--text-secondary: #a1a1aa;        /* Secondary text */
--text-tertiary: #71717a;         /* Tertiary text */

/* Spacing */
--space-2, --space-3, --space-4, --space-6

/* Border Radius */
--radius-md, --radius-lg, --radius-xl

/* Transitions */
--transition-fast, --transition-base

/* Borders */
--border-subtle, --border-default
```

## State Management

### Request States

- **pending**: Request sent, waiting for response
- **accepted**: Request accepted by peer
- **rejected**: Request rejected by peer
- **cancelled**: Request cancelled by sender

### Cleanup

Completed requests (accepted, rejected, cancelled) are:
1. Kept visible for 2 seconds
2. Automatically removed from list
3. Can be manually cleared with "Clear" button

## Security Considerations

1. **Input Validation**: All incoming messages validated with type guards
2. **String Sanitization**: File names and messages sanitized before display
3. **Size Limits**: Message fields have reasonable length limits
4. **Data Channel Security**: All requests use encrypted P2P connection
5. **User Consent**: File selection always requires explicit user action

## Accessibility

- Semantic HTML with proper ARIA labels
- Keyboard navigation support
- Focus management for modal dialogs
- Screen reader announcements for request status
- High contrast support via design tokens

## Responsive Design

- Mobile-friendly layout
- Touch-friendly button sizes
- Stacked actions on small screens
- Scrollable request list
- Adaptive sidebar width

## Browser Compatibility

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Requires WebRTC support
- File System Access API for file picker

## Testing Checklist

- [ ] Send file request with all optional fields
- [ ] Send file request with no optional fields
- [ ] Accept incoming request and select file
- [ ] Reject incoming request
- [ ] Cancel outgoing request
- [ ] Multiple simultaneous requests
- [ ] Request with file type filter
- [ ] Request while disconnected
- [ ] Reconnection with pending requests
- [ ] Clear completed requests
- [ ] Mobile responsive layout
- [ ] Keyboard navigation
- [ ] Screen reader compatibility

## Future Enhancements

1. **Request History**: Persistent storage of past requests
2. **File Browsing**: Browse peer's shared files before requesting
3. **Batch Requests**: Request multiple files at once
4. **Request Templates**: Save common request configurations
5. **Auto-Accept Rules**: Automatically accept requests from trusted peers
6. **Request Notifications**: Desktop notifications for new requests
7. **Request Expiration**: Auto-cancel old pending requests
8. **File Thumbnails**: Preview requested files before accepting

## File Structure

```
lib/hooks/
  use-file-request.ts                    # Core file request hook

components/transfer/
  FileRequestPanel.tsx                   # UI component
  FileRequestPanel.module.css            # Styling

app/transfer/
  page.tsx                               # Integration in transfer page
  page.module.css                        # Page styling (updated)

lib/hooks/
  use-p2p-connection.ts                  # Updated for message support
```

## API Reference

### useFileRequest Hook

```typescript
interface FileRequestOptions {
  currentUserId: string;
  currentUserName: string;
  dataChannel: RTCDataChannel | null;
  onFileSelected?: (file: File, requestId: string) => void;
  onRequestAccepted?: (requestId: string) => void;
  onRequestRejected?: (requestId: string) => void;
}

function useFileRequest(options: FileRequestOptions): {
  pendingRequests: PendingFileRequest[];
  outgoingRequests: PendingFileRequest[];
  requestFile: (fileName?: string, fileType?: string, message?: string) => string;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  cancelRequest: (requestId: string) => void;
  clearCompletedRequests: () => void;
  handleMessage: (data: string | ArrayBuffer) => void;
}
```

### FileRequestPanel Component

```typescript
interface FileRequestPanelProps {
  currentUserId: string;
  currentUserName: string;
  dataChannel: RTCDataChannel | null;
  peerName: string;
  onFileSelected?: (file: File, requestId: string) => void;
  className?: string;
}
```

## Conclusion

The file request feature provides a user-friendly way to request specific files from peers, complementing the existing file transfer functionality. It follows the application's design language, security principles, and accessibility standards.
