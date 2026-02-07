# Transfer Page 3.0 - Quick Reference

## State Machine Quick Ref

```tsx
type ViewState = 'method-select' | 'mode-active' | 'connected';
type TransferMode = 'select' | 'local' | 'internet' | 'friends';
```

| State | View | Mode | What User Sees |
|-------|------|------|----------------|
| Entry | `method-select` | `select` | 3 method cards (Local/Internet/Friends) |
| Active | `mode-active` | `local` | Device discovery list + tabs |
| Active | `mode-active` | `internet` | Room code UI + tabs |
| Active | `mode-active` | `friends` | Friends list + tabs |
| Connected | `connected` | Any | File area + progress area + settings |

## Store Access Pattern

### ✅ SAFE (use these)

```tsx
// Read state via selectors
const devices = useDeviceStore(s => s.devices);
const transfers = useTransferStore(s => s.transfers);

// Mutations via plain module
import { discoveryController } from '@/lib/discovery/discovery-controller';
discoveryController.start();
discoveryController.stop();

// Mutations in event handlers
const store = useSettingsStore.getState();
store.setDeviceName('New Name');
```

### ❌ NEVER (causes infinite loops)

```tsx
// DON'T call getState() in component body
useDeviceStore.getState().action();

// DON'T use getState in useEffect deps
useEffect(() => {
  const store = useDeviceStore.getState();
  // ...
}, [useDeviceStore.getState()]); // ❌ Bad
```

## Key Handlers

```tsx
handleSelectMethod(mode)     // Entry → Mode Active
handleDeviceSelect(device)   // Mode Active → Connected
handleFriendSelect(friend)   // Mode Active → Connected
handleRoomConnect(code)      // Mode Active → Connected
handleBackToModes()          // Connected → Mode Active
```

## CSS Classes Cheat Sheet

### State Views
- `.methodSelectView` - Entry state container
- `.modeActiveView` - Mode active container
- `.connectedView` - Connected state container

### Method Selection
- `.methodCards` - Grid container (3 cols)
- `.methodCard` - Individual card (glass)
- `.methodCardIcon` - Icon (64px, scales on hover)
- `.methodCardTitle` - Playfair Display, 1.3rem
- `.firstTimeTip` - Italic tip text

### Mode Tabs
- `.modeTabs` - Pill bar container
- `.modeTab` - Individual tab button
- `.modeTabActive` - Active state (accent bg)

### Connected View
- `.connectionHeader` - Top status bar
- `.fileArea` - File drop + list (top half)
- `.fileDropStrip` - Dashed border drop zone
- `.fileList` - Scrollable file cards
- `.fileItem` - Individual file row
- `.progressArea` - Transfer cards (bottom half)
- `.transferCard` - Individual transfer
- `.encryptionBadge` - ML-KEM badge

### Settings
- `.settingsOverlay` - Backdrop blur
- `.settingsPanel` - Slide-in panel (360px)
- `.settingItem` - Input group

## File Structure

```
app/transfer/
├── page.tsx           ← Main component (state machine)
└── page.module.css    ← All styles

components/transfer/
├── DeviceDiscovery.tsx      ← Local network mode
├── RoomCodeConnect.tsx      ← Internet P2P mode
└── FriendsList.tsx          ← Friends mode

lib/
├── discovery/
│   └── discovery-controller.ts   ← Safe discovery API
├── transfer/
│   └── store-actions.ts          ← Safe transfer mutations
└── stores/
    ├── device-store.ts
    ├── transfer-store.ts
    ├── friends-store.ts
    ├── room-store.ts
    └── settings-store.ts
```

## Design Tokens

```css
/* Colors */
--bg: #030306
--text: #f2f2f8
--accent: #6366f1
--glass: rgba(12, 12, 22, 0.55)

/* Spacing */
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-pill: 60px

/* Typography */
--font-display: 'Playfair Display', Georgia, serif

/* Animation */
--ease-luxury: cubic-bezier(0.22, 0.61, 0.36, 1)
```

## Responsive Breakpoints

```css
@media (min-width: 768px)   /* Desktop */
@media (max-width: 767px)   /* Mobile */
@media (max-width: 639px)   /* Small mobile */
```

## Common Tasks

### Add new method card

```tsx
<button className={styles.methodCard} onClick={() => handleSelectMethod('new-mode')}>
  <div className={styles.methodCardIcon}>
    <NewIcon />
  </div>
  <h2 className={styles.methodCardTitle}>New Method</h2>
  <p className={styles.methodCardSubtitle}>Subtitle</p>
  <p className={styles.methodCardDescription}>Description</p>
</button>
```

### Add new tab

```tsx
<button
  className={`${styles.modeTab} ${mode === 'new' ? styles.modeTabActive : ''}`}
  onClick={() => setMode('new')}
>
  New Mode
</button>
```

### Add transfer progress card

```tsx
<div className={styles.transferCard}>
  <div className={styles.transferCardHeader}>
    <div className={styles.transferCardInfo}>
      <div className={styles.transferCardName}>file.txt</div>
      <div className={styles.transferCardSize}>1.2 MB</div>
    </div>
    <div className={styles.encryptionBadge}>ML-KEM</div>
  </div>
  <div className={styles.progressBar}>
    <div className={styles.progressBarFill} style={{ width: '75%' }} />
  </div>
  <div className={styles.transferCardFooter}>
    <span className={styles.transferStatus}>Transferring...</span>
    <span className={styles.transferStats}>75% • 2 MB/s • 5s</span>
  </div>
</div>
```

## Icon Components

All icons are inline SVG functions:

- `WiFiIcon()` - Local network
- `GlobeIcon()` - Internet
- `PeopleIcon()` - Friends
- `SettingsIcon()` - Settings gear
- `CloseIcon()` - X close
- `TrashIcon()` - Delete
- `FileIcon()` - File document
- `UploadIcon()` - Upload arrow
- `CheckIcon()` - Checkmark
- `AlertIcon()` - Alert circle

Usage: `<WiFiIcon />` in JSX

## Debugging Tips

### Check current state
```tsx
console.log('State:', { viewState, mode, connection });
```

### Check store values
```tsx
console.log('Devices:', useDeviceStore.getState().devices);
console.log('Transfers:', useTransferStore.getState().transfers);
```

### Check discovery status
```tsx
import { discoveryController } from '@/lib/discovery/discovery-controller';
console.log('Discovery:', discoveryController.status);
```

## Performance Tips

1. **Use selectors** - Subscribe only to needed state
2. **Memoize callbacks** - Use `useCallback` for handlers
3. **Cleanup effects** - Return cleanup functions
4. **Avoid inline objects** - Use state/refs for complex objects
5. **CSS animations** - Use CSS instead of JS animations

## Common Errors

### "Maximum update depth exceeded"
→ Check for `.getState()` calls in component body or effect deps

### "Cannot read property of undefined"
→ Add optional chaining: `connection.device?.name`

### Tabs not switching
→ Verify `mode` state is updating correctly

### Discovery not starting
→ Check that `discoveryController.start()` is called in useEffect

### Settings not saving
→ Use `.getState()` pattern in onChange handlers

## File Naming

- Components: PascalCase (`DeviceDiscovery.tsx`)
- Hooks: camelCase with `use` prefix (`useDeviceDiscovery.ts`)
- Utilities: kebab-case (`discovery-controller.ts`)
- Stores: kebab-case (`device-store.ts`)
- CSS Modules: `*.module.css`

---

**Need help?** Check `TRANSFER_PAGE_REDESIGN_SUMMARY.md` for detailed docs.
