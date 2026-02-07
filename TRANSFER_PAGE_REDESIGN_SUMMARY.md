# Transfer Page 3.0 - Cineglass Magazine Redesign

Complete rewrite of the Transfer page with a 3-state machine architecture.

## Files Modified

1. **`app/transfer/page.tsx`** (615 lines)
2. **`app/transfer/page.module.css`** (826 lines)

## Architecture Overview

### State Machine (3 States)

The page implements a clean state machine with three distinct states:

#### STATE 1: Method Selection (Entry State)
- **View**: `method-select`
- **Purpose**: User chooses how to transfer files
- **UI**: Three large glass cards in a centered layout
  - **Local Network** - WiFi/LAN transfers
  - **Internet P2P** - Room code/QR/link
  - **Friends** - Saved contacts
- **First-time tip** shown if no transfer history

#### STATE 2: Mode Active
- **View**: `mode-active`
- **Purpose**: Show connection options for selected method
- **UI**:
  - Pill-tab bar at top (always visible)
  - Content area changes based on mode:
    - **Local**: `DeviceDiscovery` component (auto-discovery)
    - **Internet**: `RoomCodeConnect` component (room creation/join)
    - **Friends**: `FriendsList` component
- **Mode tabs**: Allow switching between methods

#### STATE 3: Connected Transfer View
- **View**: `connected`
- **Purpose**: Active transfer interface
- **UI Split 50/50**:
  - **Top Half - File Area**:
    - Compact drop strip ("Add files" bar)
    - Scrollable file list with icons, names, sizes
    - Remove button per file
  - **Bottom Half - Progress Area**:
    - Active transfers with progress bars
    - ML-KEM encryption badges
    - Speed/ETA display
    - Completed transfers (max 3 shown)
    - Empty state message

## Critical Implementation Details

### Zustand Store Safety (Turbopack Compatible)

All store access follows the project's MEMORY.md rules:

**SAFE - Read state via selectors:**
```tsx
const devices = useDeviceStore(s => s.devices);
const connectionStatus = useDeviceStore(s => s.connection.status);
const transfers = useTransferStore(s => s.transfers);
```

**SAFE - Mutations via plain module:**
```tsx
import { discoveryController } from '@/lib/discovery/discovery-controller';

// In useEffect
discoveryController.start(deviceName);
return () => discoveryController.stop();
```

**SAFE - Settings mutations in handlers:**
```tsx
const store = useSettingsStore.getState();
store.setDeviceName(e.target.value);
```

**NEVER DO THIS (causes infinite loops):**
```tsx
❌ useDeviceStore.getState().action() in component body
❌ store.getState() in useEffect deps
```

## Design System

### Color Palette (Cineglass Dark)
```css
--bg: #030306          /* Base black */
--bg-2: #08080e        /* Elevated surface */
--bg-3: #0f0f18        /* Highest elevation */
--text: #f2f2f8        /* Primary text */
--text-2: #9494a8      /* Secondary text */
--text-3: #5a5a70      /* Tertiary text */
--border: #18182a      /* Borders */
--accent: #6366f1      /* Indigo primary */
--accent-2: #818cf8    /* Indigo light */
--glass: rgba(12, 12, 22, 0.55)
--glass-border: rgba(99, 102, 241, 0.08)
```

### Typography
```css
--font-display: 'Playfair Display', Georgia, serif
```
- **Headings**: Playfair Display, weight 300, large sizes
- **Body**: System font, 0.78rem - 0.9rem
- **Labels**: Uppercase, 0.08em - 0.12em letter-spacing

### Spacing & Radii
```css
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-pill: 60px
--ease-luxury: cubic-bezier(0.22, 0.61, 0.36, 1)
```

### Glass Morphism Pattern
```css
background: var(--glass);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid var(--glass-border);
border-radius: var(--radius-xl);
```

## Key Features

### 1. Method Selection Cards
- Centered, max-width 900px
- 3-column grid on desktop, stacked on mobile
- Icons scale on hover (1.1x)
- Glass background with gradient overlay
- Lift animation on hover (-4px translateY)

### 2. Mode Tabs
- Pill-style navigation
- Active state: white text, accent background, shadow
- Horizontally scrollable on mobile (no scrollbar)
- Smooth transitions

### 3. File Management
- Drag & drop support
- Click to select files
- Visual file cards with icons
- Remove individual files
- File size formatting helper

### 4. Transfer Progress
- Real-time progress bars (gradient fill)
- ML-KEM encryption badges (gradient background)
- Status icons (green checkmark, red alert)
- Empty state for no transfers
- Scrollable list (max 3 visible)

### 5. Settings Panel
- Slide-in from right (360px width)
- Overlay backdrop (blur effect)
- Device name input
- Auto-accept toggle (checkbox)
- Encryption info display

## Responsive Design

### Desktop (≥768px)
- Method cards: 3-column grid
- Full tab labels visible
- 50/50 file/progress split

### Mobile (<768px)
- Method cards: single column stack
- Tab labels hidden (icons only)
- File/progress areas stack vertically
- Settings panel: full width slide-up
- Reduced font sizes

## Animations

All animations use `var(--ease-luxury)` easing:

- **fadeInUp**: Entry animation for state views
- **pulse**: Background glow (8s infinite)
- **statusPulse**: Connection status dot (2s infinite)
- **slideInRight**: Settings panel entrance

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## State Flow

```
[Entry] → Method Selection
           ↓ (select method)
         Mode Active
           ↓ (connect to device/friend/room)
         Connected Transfer View
           ↓ (change connection)
         Mode Active (back to tabs)
```

## Component Integration

The page uses existing transfer components:

- `DeviceDiscovery` - Local network device list
- `RoomCodeConnect` - Internet P2P room management
- `FriendsList` - Saved contacts UI

These components handle their own internal state and discovery logic. The page just orchestrates the high-level state machine.

## URL State Management

The page syncs with URL parameters:

- `?room=ABC123` - Auto-selects Internet P2P mode
- `?peer=device-id` - Auto-selects peer (future)
- `?view=list` - View mode (unused currently)

Router updates happen without scroll on state changes.

## Performance Considerations

- **No heavy computations in render**
- **Memoized callbacks** with `useCallback`
- **Controlled effects** with proper cleanup
- **Discovery controller** singleton (avoids recreating)
- **CSS animations** (hardware accelerated)
- **Minimal re-renders** via selector-based subscriptions

## Testing Checklist

- [ ] Select each method card (Local, Internet, Friends)
- [ ] Switch between mode tabs
- [ ] Add files via click
- [ ] Add files via drag & drop
- [ ] Remove individual files
- [ ] Simulate connection to device
- [ ] View transfer progress animation
- [ ] Open/close settings panel
- [ ] Change device name in settings
- [ ] Toggle auto-accept in settings
- [ ] Test on mobile (responsive layout)
- [ ] Test reduced motion preference
- [ ] Test URL room code (`?room=TEST123`)

## Known Limitations

1. **Real WebRTC transfer** - Not wired up yet. Component handlers call existing orchestrator but full signaling needs implementation.
2. **Progress speed/ETA** - Shows "Calculating..." placeholder. Needs real speed measurement.
3. **Incoming transfers** - Accept/Decline UI not in this redesign (future enhancement).

## Next Steps

1. Wire up real WebRTC signaling in DeviceDiscovery
2. Implement RoomCodeConnect room creation/join logic
3. Add incoming transfer dialogs
4. Implement real-time speed/ETA calculation
5. Add transfer history integration
6. Add chat panel toggle (when connection established)
7. Add QR code scanning for room codes

## File Paths

```
app/transfer/page.tsx              - Main component (615 lines)
app/transfer/page.module.css       - Styles (826 lines)
components/transfer/DeviceDiscovery.tsx
components/transfer/RoomCodeConnect.tsx
components/transfer/FriendsList.tsx
lib/discovery/discovery-controller.ts
lib/transfer/store-actions.ts
```

## CSS Class Naming

All classes are module-scoped via CSS Modules:

- `page` - Root container
- `methodSelectView` / `modeActiveView` / `connectedView` - State containers
- `methodCard` / `modeTab` - Interactive cards/tabs
- `fileArea` / `progressArea` - Main content sections
- `transferCard` - Individual transfer item
- `settingsPanel` - Side panel

Clean, semantic, and scoped to avoid conflicts.

---

**Total Lines of Code**: 1,441 lines
**Time to Implement**: ~45 minutes of focused development
**Complexity**: Medium-High (state machine, multiple integrations)
**Maintainability**: Excellent (clear separation, documented patterns)
