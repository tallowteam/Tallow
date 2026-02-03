# Tallow App Components

Production-ready React components for Tallow's main file transfer interface. Built with Next.js 16.1.2, React 19.2.3, and TypeScript strict mode.

## Components Overview

### TransferZone
Main file drop/select area with drag-and-drop support.

**Features:**
- Large drag-and-drop zone with visual feedback
- File input button integration
- Animated border/glow effect on drag
- File list preview with size formatting
- Support for multiple files
- Queue integration via Zustand

**Usage:**
```tsx
import { TransferZone } from '@/components/app';

function MyPage() {
  const handleFilesSelected = (files: File[]) => {
    console.log('Selected files:', files);
  };

  return (
    <TransferZone
      onFilesSelected={handleFilesSelected}
      disabled={false}
    />
  );
}
```

**Props:**
- `onFilesSelected: (files: File[]) => void` - Callback when files are selected
- `disabled?: boolean` - Disable the component
- `className?: string` - Additional CSS classes

---

### ConnectionPanel
Device connection interface with code display and QR support.

**Features:**
- Connection code display (large, copyable)
- QR code toggle area
- "Enter code" input with validation
- Connect button with loading states
- Connection status integration
- Generate new code button

**Usage:**
```tsx
import { ConnectionPanel } from '@/components/app';

function MyPage() {
  const handleConnect = (code: string) => {
    console.log('Connecting with code:', code);
  };

  const handleGenerateCode = () => {
    console.log('Generate new code');
  };

  return (
    <ConnectionPanel
      connectionCode="ABCD-1234-EFGH"
      onConnect={handleConnect}
      onGenerateCode={handleGenerateCode}
    />
  );
}
```

**Props:**
- `connectionCode?: string` - Your connection code to display
- `onConnect?: (code: string) => void` - Callback when connecting
- `onGenerateCode?: () => void` - Callback to generate new code
- `className?: string` - Additional CSS classes

---

### DeviceList
Discovered devices display with selection.

**Features:**
- Device cards with icon, name, status
- Online/offline indicators with pulse animation
- Platform-specific icons (Windows, macOS, Linux, Android, iOS)
- Click to connect
- Empty state with helpful message
- Favorite indicators
- Selected state highlighting

**Usage:**
```tsx
import { DeviceList } from '@/components/app';
import { useDeviceStore } from '@/lib/stores';

function MyPage() {
  const { devices, selectedDevice, selectDevice } = useDeviceStore();

  return (
    <DeviceList
      devices={devices}
      onDeviceClick={selectDevice}
      selectedDeviceId={selectedDevice?.id}
    />
  );
}
```

**Props:**
- `devices: Device[]` - Array of discovered devices
- `onDeviceClick?: (device: Device) => void` - Callback when device is clicked
- `selectedDeviceId?: string | null` - Currently selected device ID
- `className?: string` - Additional CSS classes

---

### TransferProgress
Active transfer display with progress tracking.

**Features:**
- File name and size display
- Progress bar with percentage (0-100%)
- Speed indicator (formatted)
- Time remaining (ETA)
- Pause/Resume buttons
- Cancel button
- Encryption status indicator
- Connection quality indicator
- Animated shimmer effect during transfer

**Usage:**
```tsx
import { TransferProgress } from '@/components/app';
import { useTransferStore } from '@/lib/stores';

function MyPage() {
  const { activeTransfers } = useTransferStore();

  const handleCancel = (id: string) => {
    console.log('Cancel transfer:', id);
  };

  const handlePause = (id: string) => {
    console.log('Pause transfer:', id);
  };

  const handleResume = (id: string) => {
    console.log('Resume transfer:', id);
  };

  return (
    <>
      {activeTransfers.map(transfer => (
        <TransferProgress
          key={transfer.id}
          transfer={transfer}
          onCancel={handleCancel}
          onPause={handlePause}
          onResume={handleResume}
        />
      ))}
    </>
  );
}
```

**Props:**
- `transfer: Transfer` - Transfer object from store
- `onCancel?: (transferId: string) => void` - Cancel transfer callback
- `onPause?: (transferId: string) => void` - Pause transfer callback
- `onResume?: (transferId: string) => void` - Resume transfer callback
- `className?: string` - Additional CSS classes

---

### TransferComplete
Completed transfer display with success animation.

**Features:**
- Success animation with checkmark
- Animated pulse rings
- File details display
- "Transfer another" button
- Share/history options
- Duration and size stats
- Encryption status display
- Smooth enter animation

**Usage:**
```tsx
import { TransferComplete } from '@/components/app';
import { useTransferStore } from '@/lib/stores';

function MyPage() {
  const { completedTransfers } = useTransferStore();

  const handleTransferAnother = () => {
    console.log('Transfer another file');
  };

  const handleViewHistory = () => {
    console.log('View history');
  };

  const handleShare = () => {
    console.log('Share');
  };

  return (
    <>
      {completedTransfers.map(transfer => (
        <TransferComplete
          key={transfer.id}
          transfer={transfer}
          onTransferAnother={handleTransferAnother}
          onViewHistory={handleViewHistory}
          onShare={handleShare}
        />
      ))}
    </>
  );
}
```

**Props:**
- `transfer: Transfer` - Completed transfer object
- `onTransferAnother?: () => void` - Callback to start new transfer
- `onViewHistory?: () => void` - Callback to view history
- `onShare?: () => void` - Callback to share transfer
- `className?: string` - Additional CSS classes

---

### SecurityBadge
Encryption indicator with detailed tooltip.

**Features:**
- PQC (Post-Quantum Cryptography) indicator
- Lock icon with pulse animation when active
- Tooltip with encryption details
- Algorithm display
- Security status
- Quantum-resistant encryption notice
- Perfect forward secrecy indicator

**Usage:**
```tsx
import { SecurityBadge } from '@/components/app';

function MyPage() {
  return (
    <SecurityBadge
      isActive={true}
      isPQC={true}
      algorithm="Kyber-1024"
      showDetails={true}
    />
  );
}
```

**Props:**
- `isActive?: boolean` - Whether encryption is currently active
- `isPQC?: boolean` - Whether using post-quantum cryptography
- `algorithm?: string` - Encryption algorithm name
- `showDetails?: boolean` - Show detailed tooltip on hover
- `className?: string` - Additional CSS classes

---

### StatusIndicator
Connection status display with animations.

**Features:**
- Connected/disconnected/connecting/error states
- Animated pulse when connecting
- Color-coded status (green/yellow/orange/red)
- Optional peer name display
- Size variants (sm, md, lg)
- State-specific icons
- Smooth transitions

**Usage:**
```tsx
import { StatusIndicator } from '@/components/app';
import { useDeviceStore } from '@/lib/stores';

function MyPage() {
  const { connection } = useDeviceStore();

  return (
    <StatusIndicator
      status={connection.status}
      peerName={connection.peerName}
      showLabel={true}
      size="md"
    />
  );
}
```

**Props:**
- `status: ConnectionStatus` - Current connection status ('idle' | 'connecting' | 'connected' | 'disconnecting' | 'error')
- `peerName?: string | null` - Name of connected peer
- `showLabel?: boolean` - Show status text label
- `size?: 'sm' | 'md' | 'lg'` - Component size
- `className?: string` - Additional CSS classes

---

## Design System

### Colors
- **Background:** Black (`#000`) with transparent white overlays
- **Borders:** White with 10-40% opacity
- **Text:** White with varying opacity levels (40-100%)
- **Accent:** Green for success/active states
- **Error:** Red for errors and cancel actions

### Effects
- **Glassmorphism:** `backdrop-blur-sm` with transparent backgrounds
- **Animations:** Smooth transitions (200-500ms) using Tailwind
- **Hover states:** Subtle opacity and color changes
- **Active states:** Pulse animations and glowing effects

### Accessibility
- All interactive elements are keyboard accessible
- ARIA labels on all icon buttons
- Proper semantic HTML
- Color contrast meets WCAG AA standards
- Screen reader friendly

---

## File Locations

```
components/app/
├── TransferZone.tsx        # File drop/select area
├── ConnectionPanel.tsx     # Connection interface
├── DeviceList.tsx          # Discovered devices
├── TransferProgress.tsx    # Active transfer display
├── TransferComplete.tsx    # Completed transfer
├── SecurityBadge.tsx       # Encryption indicator
├── StatusIndicator.tsx     # Connection status
├── index.ts                # Barrel export
└── README.md               # This file
```

---

## Integration with Zustand Stores

All components are designed to work seamlessly with Tallow's Zustand stores:

- **DeviceStore:** `C:/Users/aamir/Documents/Apps/Tallow/lib/stores/device-store.ts`
- **TransferStore:** `C:/Users/aamir/Documents/Apps/Tallow/lib/stores/transfer-store.ts`

Example integration:
```tsx
import { useDeviceStore, useTransferStore } from '@/lib/stores';
import {
  TransferZone,
  ConnectionPanel,
  DeviceList,
  TransferProgress,
  SecurityBadge,
  StatusIndicator
} from '@/components/app';

function AppPage() {
  const { devices, connection, selectDevice } = useDeviceStore();
  const { addToQueue, activeTransfers } = useTransferStore();

  return (
    <div>
      <StatusIndicator status={connection.status} />
      <SecurityBadge isActive={activeTransfers.length > 0} />
      <TransferZone onFilesSelected={addToQueue} />
      <DeviceList devices={devices} onDeviceClick={selectDevice} />
      {activeTransfers.map(transfer => (
        <TransferProgress key={transfer.id} transfer={transfer} />
      ))}
    </div>
  );
}
```

---

## TypeScript Support

All components are fully typed with strict mode enabled. Type definitions are imported from:

- `@/lib/types` - Core types (Device, Transfer, FileInfo, etc.)
- `@/lib/stores` - Store types and selectors

---

## Performance Optimizations

1. **React 19 features:** Uses latest React patterns
2. **Memoized callbacks:** All event handlers use `useCallback`
3. **Efficient re-renders:** Components only update when necessary
4. **Code splitting:** Components can be lazy loaded
5. **SVG icons:** Inline SVGs for optimal performance
6. **CSS transitions:** GPU-accelerated animations

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS 14+, Android 5+)

---

## Notes

- All file sizes are formatted using binary units (KB, MB, GB)
- Transfer speeds use bytes per second with automatic unit conversion
- Time remaining calculations handle edge cases (infinity, zero)
- Drag-and-drop uses proper counter to handle nested elements
- All animations are optimized for 60fps performance
