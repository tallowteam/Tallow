# Shareable Links - Quick Reference

## For Users

### Creating a Shareable Link
1. Go to `/transfer` page
2. Click "Create a Room"
3. Room code appears (e.g., "ABC123")
4. Click **"Share Link"** button to share full URL
5. Or click **"Copy Code"** to copy just the code

### Sharing Options
- **Mobile**: Native share dialog appears
- **Desktop**: Link copied to clipboard automatically
- Toast notification confirms the action

### Joining via Link
1. Click a shared link (e.g., `https://tallow.app/transfer?room=ABC123`)
2. Page automatically joins the room
3. Start transferring files

## For Developers

### Component API

**RoomCodeConnect Props:**
```typescript
interface RoomCodeConnectProps {
  selectedFiles: File[];
  onConnect?: (roomCode: string) => void;
  initialRoomCode?: string; // NEW: Auto-join this room
}
```

### Link Format
```
Development:  http://localhost:3000/transfer?room=ABC123
Production:   https://tallow.app/transfer?room=ABC123
```

### Key Functions

**Generate Link:**
```typescript
const shareableLink = `${window.location.origin}/transfer?room=${roomCode}`;
```

**Share Link:**
```typescript
const handleShareLink = async () => {
  // Try Web Share API
  if (canShare) {
    const shared = await share({
      title: 'Join my Tallow room',
      url: shareableLink,
    });
    if (shared) return;
  }

  // Fallback to clipboard
  await copyToClipboard(shareableLink);
  toast.success('Link copied!');
};
```

**Copy Code:**
```typescript
const handleCopyCode = async () => {
  await copyToClipboard(roomCode);
  toast.success('Room code copied!');
};
```

### Auto-Join Logic
```typescript
useEffect(() => {
  if (initialRoomCode && !hasAutoJoinedRef.current) {
    hasAutoJoinedRef.current = true;

    const autoJoin = async () => {
      if (!isConnected) await connect();
      await joinRoom(initialRoomCode);
    };

    setTimeout(autoJoin, 100);
  }
}, [initialRoomCode]);
```

## File Changes Summary

| File | Changes | Lines |
|------|---------|-------|
| `RoomCodeConnect.tsx` | Added sharing logic & UI | ~80 |
| `RoomCodeConnect.module.css` | Added share button styles | ~40 |
| `page.tsx` | Already had URL handling | 0 |

## Dependencies

### Existing Hooks Used
- `useWebShare()` - from `lib/hooks/use-web-share.ts`
- `useToast()` - from `components/ui/ToastProvider.tsx`
- `copyToClipboard()` - from `lib/hooks/use-web-share.ts`

### No New Dependencies Required
All functionality uses existing infrastructure.

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Web Share | Mobile | ✅ | ❌ | Mobile |
| Clipboard | ✅ | ✅ | ✅ | ✅ |
| Auto-join | ✅ | ✅ | ✅ | ✅ |

## Common Tasks

### Debugging Auto-Join
```typescript
// Check console logs
[Transfer] Auto-joining room from URL: ABC123
[RoomCodeConnect] Auto-joining room from URL: ABC123
```

### Testing Share Functionality
```bash
# Test on mobile device
1. Create room
2. Click "Share Link"
3. Verify native share dialog appears

# Test on desktop
1. Create room
2. Click "Share Link"
3. Verify toast: "Link copied to clipboard!"
4. Paste in browser - should navigate to room
```

### Customizing Share Message
Edit in `RoomCodeConnect.tsx`:
```typescript
await share({
  title: 'Your Custom Title',
  text: 'Your custom message',
  url: shareableLink,
});
```

## Troubleshooting

### Link not auto-joining
- Check browser console for errors
- Verify room code in URL is valid
- Check if room has expired (1 hour default)

### Share button not working
- Verify ToastProvider is in app layout
- Check browser console for errors
- Test clipboard permissions

### Styling issues
- Check CSS variable definitions in `globals.css`
- Verify CSS Modules are working
- Check for specificity conflicts

## Next Steps

### To Add QR Codes
```typescript
import QRCode from 'qrcode';

const generateQR = async () => {
  const qrUrl = await QRCode.toDataURL(shareableLink);
  // Display qrUrl in modal
};
```

### To Add Email Sharing
```typescript
const shareViaEmail = () => {
  const subject = 'Join my Tallow room';
  const body = `Click here: ${shareableLink}`;
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
};
```

### To Add Short Links
```typescript
// Create API endpoint: /api/short-link
const createShortLink = async (roomCode: string) => {
  const response = await fetch('/api/short-link', {
    method: 'POST',
    body: JSON.stringify({ roomCode }),
  });
  const { shortUrl } = await response.json();
  return shortUrl; // e.g., tallow.app/r/xyz
};
```

## Code Snippets

### Button Component
```tsx
<button
  onClick={handleShareLink}
  className={styles.shareButton}
  aria-label="Share link"
>
  <ShareIcon />
  <span>Share Link</span>
</button>
```

### CSS Module
```css
.shareButton {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--color-accent);
  color: var(--color-bg);
}
```

### Toast Usage
```typescript
const toast = useToast();
toast.success('Link copied!');
toast.error('Failed to copy link');
```

## Performance Notes

- Auto-join has 100ms delay to ensure component mount
- `useRef` prevents duplicate join attempts
- Share dialog is non-blocking
- Clipboard operations are async but fast (<50ms)

## Accessibility

- All buttons have `aria-label` attributes
- Toast notifications use `aria-live` regions
- Keyboard navigation fully supported
- Screen reader friendly

## Security Considerations

- Room codes expire after 1 hour
- Codes are cryptographically random
- No sensitive data in URLs
- Rooms can be password-protected (future)
