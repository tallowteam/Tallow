# Notification System Enhancements - Quick Reference

## Features at a Glance

### 1. Smart Grouping
- Groups similar notifications within 30 seconds
- Shows "3 files received" instead of 3 separate toasts
- Groups: `transfer`, `connection`, `chat`, `system`

### 2. Priority Levels
- **Low**: Device discovered
- **Normal**: Connections, standard transfers
- **High**: Failed transfers, large files (>100MB)
- **Urgent**: Security alerts, critical errors (bypasses silent hours)

### 3. Silent Hours
- Mutes non-urgent notifications during specified hours
- Supports overnight periods (22:00 to 08:00)
- Urgent notifications always shown
- Configured in Settings → Notification Settings

### 4. Connection Requests
- Dedicated notification with Accept/Reject actions
- Auto-rejects after 30 seconds
- High priority

---

## Usage Examples

### Connection Request
```typescript
import { useNotifications } from '@/lib/hooks/use-notifications';

function MyComponent() {
  const { notifyConnectionRequest } = useNotifications();

  notifyConnectionRequest(
    'Alice\'s Laptop',
    'device-abc123',
    () => console.log('Accepted'),
    () => console.log('Rejected')
  );
}
```

### Check If In Silent Hours (Internal)
```typescript
// Inside notification-manager.ts
private isInSilentHours(): boolean {
  // Returns true if current time is within silent hours range
  // Handles overnight periods correctly
}
```

### Priority Determination
```typescript
// Automatically determined by context:
transferFailed() // → high priority
transferComplete(fileName, 'received', 150MB) // → high priority (>100MB)
connectionEstablished() // → normal priority
deviceDiscovered() // → low priority
```

---

## Settings Store

### New Properties
```typescript
silentHoursEnabled: boolean      // Default: false
silentHoursStart: string         // Default: "22:00" (HH:MM format)
silentHoursEnd: string           // Default: "08:00" (HH:MM format)
```

### New Actions
```typescript
setSilentHoursEnabled(enabled: boolean)
setSilentHoursStart(time: string)  // Format: "HH:MM"
setSilentHoursEnd(time: string)    // Format: "HH:MM"
```

### New Selectors
```typescript
selectSilentHoursEnabled(state)
selectSilentHoursStart(state)
selectSilentHoursEnd(state)
```

---

## UI Components

### Settings Page Location
`/settings` → Notification Settings section

### Controls
- Toggle switches for all notification types
- Silent hours enable toggle
- Start/end time pickers (appear when silent hours enabled)
- Visual badge showing active hours

### CSS Classes (page.module.css)
```css
.timePickerGroup  /* Grid container for time pickers */
.timePicker       /* Individual time picker wrapper */
.timeInput        /* Styled time input field */
```

---

## Modified Files

1. `lib/utils/notification-manager.ts` - Core logic
2. `lib/stores/settings-store.ts` - Settings state
3. `lib/hooks/use-notifications.ts` - Hook interface
4. `app/settings/page.tsx` - UI
5. `app/settings/page.module.css` - Styles

---

## Key Behaviors

### Grouping Window
- 30 seconds since last notification of same group
- Count resets after window expires

### Priority Override
- `urgent` → Always shown
- `high` → Always shown (but considered in future DND modes)
- `normal`/`low` → Blocked during silent hours

### Time Format
- Input: `"HH:MM"` (24-hour format)
- Example: `"22:00"`, `"08:30"`
- Stored as string in settings

### Overnight Hours
```typescript
// Example: 22:00 to 08:00
if (start > end) {
  return currentTime >= start || currentTime < end;
}
```

---

## Testing Quick Checks

### Grouping
1. Send 3 files in quick succession
2. Verify: "3 files received"

### Silent Hours
1. Set to current time range
2. Try normal notification → blocked
3. Trigger failed transfer → shown

### Connection Request
1. Trigger request
2. Click Accept → callback fires
3. Trigger another, wait 30s → auto-reject callback fires

### Overnight Period
1. Set 23:00 to 01:00
2. Test at 23:30 → blocked
3. Test at 00:30 → blocked
4. Test at 01:30 → shown

---

## Common Issues

### Time Picker Not Showing
- Ensure `silentHoursEnabled` is `true`
- Check conditional rendering in settings page

### Notifications During Silent Hours
- Check if priority is `urgent`
- Verify time format is "HH:MM"
- Check if silent hours are actually enabled

### Grouping Not Working
- Ensure notifications are within 30s window
- Check that they have the same group type
- Verify `updateGroupedNotification()` is being called

### Connection Request No Action
- Ensure callback registration in `useNotifications`
- Check that `notificationCallback` is set
- Verify toast provider is mounted

---

## API Quick Reference

```typescript
// Types
type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
type NotificationGroup = 'transfer' | 'connection' | 'chat' | 'system';

// Hook
const { notifyConnectionRequest } = useNotifications();

// Settings
const {
  silentHoursEnabled,
  silentHoursStart,
  silentHoursEnd,
  setSilentHoursEnabled,
  setSilentHoursStart,
  setSilentHoursEnd
} = useSettingsStore();

// Manager (internal)
notificationManager.registerNotificationCallback(callback);
notificationManager.updateSettings(settings);
notificationManager.connectionRequest(deviceName, deviceId, onAccept, onReject);
```

---

## Backward Compatibility

All changes are backward compatible:
- Existing notification methods unchanged
- New parameters are optional
- Default settings are sensible
- No breaking changes to public API

---

## Performance Notes

- Grouping map is small (4 group types max)
- Time checking is simple string comparison
- No heavy computations or async operations
- Toast system handles display limits (max 5 by default)

---

## Accessibility

- Time pickers use native `<input type="time">`
- Toggle switches have proper labels
- Settings descriptions provide context
- ARIA attributes preserved from existing components

---

## Browser Support

- Time input: Modern browsers (Chrome, Firefox, Safari, Edge)
- Fallback: Text input with placeholder
- Web Audio API: All modern browsers
- Notification API: Requires permission

---

## Next Steps

To use in your code:

1. Import the hook:
```typescript
import { useNotifications } from '@/lib/hooks/use-notifications';
```

2. Get the connection request function:
```typescript
const { notifyConnectionRequest } = useNotifications();
```

3. Call when needed:
```typescript
notifyConnectionRequest(deviceName, deviceId, handleAccept, handleReject);
```

4. Configure in settings:
- Navigate to `/settings`
- Scroll to "Notification Settings"
- Enable/configure silent hours as needed

---

## Documentation

- Full documentation: `NOTIFICATION_SYSTEM_ENHANCEMENTS.md`
- This quick reference: `NOTIFICATION_ENHANCEMENTS_QUICK_REF.md`
