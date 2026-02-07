# Guest Mode and Temporary Visibility Implementation

## Overview

Two new privacy-focused features have been implemented for the Tallow file transfer app:

1. **Temporary Visibility** - Device only appears on network while the app tab is active
2. **Guest Mode** - One-time share without saving history or device cache

## Implementation Summary

### 1. Settings Store Updates

**File**: `lib/stores/settings-store.ts`

Added new state fields:
```typescript
temporaryVisibility: boolean;  // Default: false
guestMode: boolean;           // Default: false
```

Added actions:
```typescript
setTemporaryVisibility: (enabled: boolean) => void;
setGuestMode: (enabled: boolean) => void;
```

Added selectors:
```typescript
selectTemporaryVisibility: (state: SettingsState) => state.temporaryVisibility;
selectGuestMode: (state: SettingsState) => state.guestMode;
```

### 2. Settings Page UI

**File**: `app/settings/page.tsx`

Added two new toggle switches in the Privacy & Security section:

1. **Temporary Visibility Toggle**
   - Label: "Temporary visibility"
   - Description: "Only visible on network while app tab is active and focused"
   - Active badge indicator (warning variant)

2. **Guest Mode Toggle**
   - Label: "Guest mode"
   - Description: "One-time sharing without saving history or device cache"
   - Active badge indicator (info variant)

### 3. Guest Mode Banner Component

**Files**:
- `components/transfer/GuestModeBanner.tsx`
- `components/transfer/GuestModeBanner.module.css`

Features:
- Displays prominent banner when guest mode is active
- Shows "Guest Mode - Active" badge
- Clear description: "Transfers won't be saved to history. Data cleared on session end."
- Dismissible with close button (exits guest mode)
- Auto-cleanup on page unload using `beforeunload` event
- Clears:
  - Transfer history
  - Recent devices cache
  - Transfer queue

### 4. Temporary Visibility Indicator Component

**Files**:
- `components/transfer/TemporaryVisibilityIndicator.tsx`
- `components/transfer/TemporaryVisibilityIndicator.module.css`

Features:
- Shows current visibility status (visible/hidden)
- Green indicator with pulse animation when visible
- Gray indicator when hidden
- Updates in real-time using `document.visibilitychange` event
- Clear status messages:
  - Visible: "Visible on network - Device is discoverable"
  - Hidden: "Hidden from network - Tab not focused"

### 5. Temporary Visibility Logic

**File**: `app/transfer/page.tsx`

Integrates with the existing device discovery system:
```typescript
useEffect(() => {
  if (!temporaryVisibility) return;

  const handleVisibilityChange = () => {
    const isVisible = document.visibilityState === 'visible';

    if (isVisible) {
      startDiscovery();  // Resume mDNS broadcasting
    } else {
      stopDiscovery();   // Stop mDNS broadcasting
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  // ...
}, [temporaryVisibility, startDiscovery, stopDiscovery]);
```

### 6. Guest Mode Cleanup Logic

**File**: `app/transfer/page.tsx`

Automatic cleanup on session end:
```typescript
useEffect(() => {
  if (!guestMode) return;

  const handleBeforeUnload = () => {
    const transferStore = useTransferStore.getState();
    const deviceStore = useDeviceStore.getState();

    transferStore.clearTransfers();
    deviceStore.clearRecent();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  // Also cleanup on component unmount
}, [guestMode]);
```

### 7. Utility Hooks (Optional)

Created reusable hooks for cleaner code:
- `lib/hooks/use-temporary-visibility.ts` - Manages visibility state and broadcasting
- `lib/hooks/use-guest-mode.ts` - Manages guest mode cleanup

## User Experience

### Temporary Visibility

1. User enables "Temporary visibility" in Settings
2. Indicator appears on transfer page showing current status
3. When user switches tabs/minimizes window:
   - Device stops broadcasting on mDNS
   - Indicator changes to "Hidden from network"
4. When user returns to tab:
   - Device resumes broadcasting
   - Indicator changes to "Visible on network"

### Guest Mode

1. User enables "Guest mode" in Settings
2. Banner appears at top of transfer page
3. User can transfer files normally
4. When user:
   - Closes tab
   - Navigates away
   - Refreshes page
   - Exits guest mode manually

   All session data is cleared:
   - Transfer history
   - Recent devices
   - Queue

## Technical Details

### State Management

Uses Zustand stores with `.getState()` to avoid Turbopack hook issues:
```typescript
const transferStore = useTransferStore.getState();
transferStore.clearTransfers();
```

### Browser API Integration

- `document.visibilityState` - Detects tab focus
- `visibilitychange` event - Tab visibility changes
- `beforeunload` event - Page close/navigation

### Styling

All components use CSS Modules (not Tailwind) following the existing design system:
- Dark theme by default
- Light theme support via `:root[data-theme='light']`
- Responsive design with mobile breakpoints
- Smooth animations and transitions

## Files Created

1. `components/transfer/GuestModeBanner.tsx`
2. `components/transfer/GuestModeBanner.module.css`
3. `components/transfer/TemporaryVisibilityIndicator.tsx`
4. `components/transfer/TemporaryVisibilityIndicator.module.css`
5. `lib/hooks/use-temporary-visibility.ts`
6. `lib/hooks/use-guest-mode.ts`

## Files Modified

1. `lib/stores/settings-store.ts` - Added state and actions
2. `lib/stores/index.ts` - Exported new selectors
3. `app/settings/page.tsx` - Added toggle UI
4. `app/transfer/page.tsx` - Integrated components and logic
5. `components/transfer/index.ts` - Exported new components

## Testing Checklist

- [ ] Toggle temporary visibility in settings
- [ ] Verify indicator appears on transfer page
- [ ] Switch tabs and verify indicator updates
- [ ] Confirm mDNS stops/starts with tab visibility
- [ ] Enable guest mode in settings
- [ ] Verify banner appears on transfer page
- [ ] Perform a file transfer
- [ ] Close tab and reopen
- [ ] Verify history is empty
- [ ] Verify recent devices are cleared
- [ ] Disable guest mode via banner close button
- [ ] Test in both dark and light themes
- [ ] Test on mobile responsive layout

## Future Enhancements

1. Add guest mode indicator to header/nav
2. Show notification when entering/exiting guest mode
3. Add analytics (anonymous) for feature usage
4. Add keyboard shortcut to toggle guest mode (e.g., Ctrl+Shift+G)
5. Add "Always start in guest mode" option
6. Add confirmation dialog before clearing guest data
7. Persist temporary visibility preference per network
8. Add "Quick Guest Mode" button on transfer page

## Security Considerations

- Guest mode clears data only in browser storage (localStorage)
- Transfer history is not stored on server
- mDNS broadcast stop is immediate when tab loses focus
- No sensitive data persists after guest mode session ends

## Performance Impact

- Minimal: Only adds event listeners when features are enabled
- No performance impact when features are disabled
- Cleanup handlers remove listeners on unmount
- Uses efficient `.getState()` pattern to avoid re-renders
