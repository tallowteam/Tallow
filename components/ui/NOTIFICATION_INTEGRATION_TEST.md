# Notification System Integration Test

## Quick Integration Test

Use this checklist to verify the notification system is working correctly.

## 1. Setup Verification

### Check Layout Integration

File: `app/layout.tsx`

```tsx
// Should contain:
import { ToastProvider } from '@/components/ui/ToastProvider';

<ToastProvider position="bottom-right" maxToasts={5}>
  {children}
</ToastProvider>
```

✅ ToastProvider is wrapped around children
✅ Position is set to 'bottom-right'
✅ Max toasts is set to 5

## 2. Basic Toast Test

Create a test page: `app/test-notifications/page.tsx`

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { Button } from '@/components/ui/Button';

export default function TestPage() {
  const notifications = useNotifications();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Notification Test</h1>

      <Button onClick={() => notifications.success('Success!')}>
        Test Success
      </Button>

      <Button onClick={() => notifications.error('Error!')}>
        Test Error
      </Button>

      <Button onClick={() => notifications.warning('Warning!')}>
        Test Warning
      </Button>

      <Button onClick={() => notifications.info('Info!')}>
        Test Info
      </Button>
    </div>
  );
}
```

### Expected Results

1. Click "Test Success" → Green toast appears in bottom-right
2. Click "Test Error" → Red toast appears below previous
3. Click "Test Warning" → Yellow toast appears
4. Click "Test Info" → Blue toast appears
5. Toasts auto-dismiss after 5 seconds
6. Progress bar animates at bottom of each toast
7. Can manually close with X button

## 3. Settings Integration Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { useSettingsStore } from '@/lib/stores';
import { Button } from '@/components/ui/Button';

export default function SettingsTestPage() {
  const notifications = useNotifications();
  const settings = useSettingsStore();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Settings Test</h1>

      <div>
        <label>
          <input
            type="checkbox"
            checked={settings.notificationSound}
            onChange={(e) => settings.setNotificationSound(e.target.checked)}
          />
          Sound Enabled: {settings.notificationSound ? 'Yes' : 'No'}
        </label>
      </div>

      <div>
        <label>
          <input
            type="checkbox"
            checked={settings.browserNotifications}
            onChange={(e) => settings.setBrowserNotifications(e.target.checked)}
          />
          Browser Notifications: {settings.browserNotifications ? 'Yes' : 'No'}
        </label>
      </div>

      <div>
        <label>
          Toast Position:
          <select
            value={settings.toastPosition}
            onChange={(e) => settings.setToastPosition(e.target.value as any)}
          >
            <option value="top-right">Top Right</option>
            <option value="bottom-right">Bottom Right</option>
            <option value="top-left">Top Left</option>
            <option value="bottom-left">Bottom Left</option>
          </select>
        </label>
      </div>

      <Button onClick={() => notifications.success('Test!')}>
        Show Toast
      </Button>

      {settings.browserNotifications && !notifications.isBrowserNotificationsAvailable && (
        <Button onClick={() => notifications.requestPermission()}>
          Grant Permission
        </Button>
      )}
    </div>
  );
}
```

### Expected Results

1. Toggle "Sound Enabled" → Should hear beep when showing toast
2. Toggle "Browser Notifications" → Settings persist
3. Change "Toast Position" → Next toast appears in new position
4. Settings persist after page reload

## 4. Transfer Notification Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { Button } from '@/components/ui/Button';

export default function TransferTestPage() {
  const notifications = useNotifications();

  const simulateTransfer = async () => {
    // Start
    notifications.notifyTransferStarted('document.pdf', 'MacBook Pro');

    // Simulate transfer
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Complete
    notifications.notifyTransferComplete('document.pdf', 'sent');
  };

  const simulateFailure = () => {
    notifications.notifyTransferFailed(
      'document.pdf',
      'Connection lost',
      () => alert('Retry clicked!')
    );
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Transfer Notification Test</h1>

      <Button onClick={simulateTransfer}>
        Simulate Transfer
      </Button>

      <Button onClick={simulateFailure}>
        Simulate Failure
      </Button>
    </div>
  );
}
```

### Expected Results

1. Click "Simulate Transfer"
   - "Transfer Started" toast appears (blue)
   - 2 seconds later, "Transfer Complete" toast (green)
   - Sound plays (if enabled)

2. Click "Simulate Failure"
   - "Transfer Failed" toast appears (red)
   - Shows "Retry" button
   - Click retry → alert appears
   - Toast dismisses

## 5. Connection Notification Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { Button } from '@/components/ui/Button';

export default function ConnectionTestPage() {
  const notifications = useNotifications();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Connection Notification Test</h1>

      <Button onClick={() =>
        notifications.notifyConnectionEstablished('MacBook Pro', 'p2p')
      }>
        Connect (P2P)
      </Button>

      <Button onClick={() =>
        notifications.notifyConnectionEstablished('iPhone', 'relay')
      }>
        Connect (Relay)
      </Button>

      <Button onClick={() =>
        notifications.notifyConnectionLost('MacBook Pro')
      }>
        Disconnect
      </Button>
    </div>
  );
}
```

### Expected Results

1. Click "Connect (P2P)"
   - Green toast: "Connected to MacBook Pro"
   - Message: "Direct P2P connection established"

2. Click "Connect (Relay)"
   - Green toast: "Connected to iPhone"
   - Message: "Connected via relay"

3. Click "Disconnect"
   - Yellow toast: "Connection Lost"
   - Message: "Disconnected from MacBook Pro"

## 6. Incoming Transfer Dialog Test

```tsx
'use client';

import { useState } from 'react';
import { useNotifications } from '@/lib/hooks/use-notifications';
import { IncomingTransferDialog } from '@/components/transfer';
import { Button } from '@/components/ui/Button';

export default function DialogTestPage() {
  const notifications = useNotifications();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Incoming Transfer Dialog Test</h1>

      <Button onClick={() => setShowDialog(true)}>
        Show Dialog
      </Button>

      <IncomingTransferDialog
        open={showDialog}
        deviceName="MacBook Pro"
        fileName="presentation.pdf"
        fileSize={2048576}
        fileType="application/pdf"
        onAccept={() => {
          setShowDialog(false);
          notifications.success('Transfer accepted!');
        }}
        onReject={() => {
          setShowDialog(false);
          notifications.warning('Transfer rejected.');
        }}
      />
    </div>
  );
}
```

### Expected Results

1. Click "Show Dialog"
   - Modal appears
   - Shows "MacBook Pro wants to send a file"
   - File name: "presentation.pdf"
   - File size: "2.0 MB"
   - PDF icon displayed
   - Countdown timer starts from 30

2. Click "Accept"
   - Dialog closes
   - Green success toast appears

3. Click "Reject"
   - Dialog closes
   - Yellow warning toast appears

4. Wait 30 seconds
   - Dialog auto-closes
   - Auto-rejects

## 7. Browser Notification Test

### Setup

1. Enable browser notifications in settings
2. Grant permission when prompted
3. Put app in background (switch to another tab)

### Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { Button } from '@/components/ui/Button';

export default function BrowserNotificationTestPage() {
  const notifications = useNotifications();

  const testBrowserNotification = async () => {
    // This should show browser notification only when tab is in background
    notifications.notifyTransferComplete('test.pdf', 'received');
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Browser Notification Test</h1>

      <p>
        Permission: {
          notifications.isBrowserNotificationsAvailable ? 'Granted' :
          notifications.isBrowserNotificationsDenied ? 'Denied' :
          'Not requested'
        }
      </p>

      {!notifications.isBrowserNotificationsAvailable && (
        <Button onClick={() => notifications.requestPermission()}>
          Request Permission
        </Button>
      )}

      <Button onClick={testBrowserNotification}>
        Test Notification
      </Button>

      <p>Switch to another tab before clicking "Test Notification"</p>
    </div>
  );
}
```

### Expected Results

1. **Foreground (current tab)**
   - Click "Test Notification"
   - Toast appears in app
   - No browser notification

2. **Background (another tab active)**
   - Click "Test Notification"
   - Toast appears in app (not visible)
   - Browser notification appears in OS
   - Click notification → app tab focuses

## 8. Sound Test

### Prerequisites

- Speakers/headphones enabled
- Sound enabled in settings
- User has interacted with page (browser security requirement)

### Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { useSettingsStore } from '@/lib/stores';
import { Button } from '@/components/ui/Button';

export default function SoundTestPage() {
  const notifications = useNotifications();
  const settings = useSettingsStore();

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Sound Test</h1>

      <label>
        <input
          type="checkbox"
          checked={settings.notificationSound}
          onChange={(e) => settings.setNotificationSound(e.target.checked)}
        />
        Sound Enabled
      </label>

      <Button onClick={() => notifications.success('Beep!')}>
        Play Sound
      </Button>
    </div>
  );
}
```

### Expected Results

1. Sound enabled → Click button → Hear beep
2. Sound disabled → Click button → No beep
3. Beep is short (~200ms), sine wave, 800Hz

## 9. Position Test

```tsx
'use client';

import { useNotifications } from '@/lib/hooks/use-notifications';
import { useSettingsStore } from '@/lib/stores';
import { Button } from '@/components/ui/Button';

export default function PositionTestPage() {
  const notifications = useNotifications();
  const settings = useSettingsStore();

  const positions = [
    'top-right',
    'top-left',
    'bottom-right',
    'bottom-left',
    'top-center',
    'bottom-center',
  ] as const;

  const testPosition = (position: typeof positions[number]) => {
    settings.setToastPosition(position);
    setTimeout(() => {
      notifications.info(`Position: ${position}`);
    }, 100);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Position Test</h1>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
        {positions.map((pos) => (
          <Button key={pos} onClick={() => testPosition(pos)}>
            {pos}
          </Button>
        ))}
      </div>

      <p>Current: {settings.toastPosition}</p>
    </div>
  );
}
```

### Expected Results

- Click each button → Toast appears in corresponding position
- Position changes immediately
- Multiple toasts stack correctly in each position

## 10. Accessibility Test

### Keyboard Navigation

1. Tab through page
2. Focus should reach toast close buttons
3. Enter/Space should close toast
4. Focus should reach action buttons

### Screen Reader

1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. Show toast
3. Should announce: "[variant] notification: [message]"
4. Should read title and message

### Reduced Motion

1. Enable reduced motion in OS settings
2. Show toast
3. Should fade in/out instead of sliding
4. No jarring animations

## 11. Mobile Test

### Responsive Design

1. Open on mobile device or narrow browser window
2. Show toast
3. Toast should be narrower but still readable
4. Should stack vertically
5. Should respect safe areas

### Touch Interactions

1. Tap close button → Should close
2. Tap action button → Should trigger action
3. No hover states on mobile

## Troubleshooting

### Toasts Not Appearing

- [ ] Check console for errors
- [ ] Verify ToastProvider in layout.tsx
- [ ] Check that component is inside ToastProvider
- [ ] Try hard refresh (Ctrl+Shift+R)

### Browser Notifications Not Working

- [ ] Check permission status
- [ ] Ensure browser notifications enabled in settings
- [ ] Verify app is in background (document.hidden)
- [ ] Check browser notification settings (not blocked)

### Sound Not Playing

- [ ] Check sound enabled in settings
- [ ] Ensure user has clicked on page (browser requirement)
- [ ] Check browser console for audio errors
- [ ] Try different browser

### Settings Not Persisting

- [ ] Check localStorage permissions
- [ ] Clear cache and try again
- [ ] Check browser console for storage errors

## Success Criteria

✅ All toast variants display correctly
✅ Toasts auto-dismiss after duration
✅ Manual close works
✅ Action buttons work
✅ Settings persist across page reloads
✅ Position changes apply immediately
✅ Browser notifications show when in background
✅ Sound plays when enabled
✅ Incoming transfer dialog displays correctly
✅ Keyboard navigation works
✅ Screen reader announces toasts
✅ Mobile responsive
✅ Reduced motion supported

## Performance Check

1. Show 100 toasts rapidly → Max 5 visible at once
2. Check memory usage → No memory leaks
3. Check CPU usage → Animations are smooth
4. Check network → No unnecessary requests

## Done!

If all tests pass, the notification system is fully integrated and working correctly.
