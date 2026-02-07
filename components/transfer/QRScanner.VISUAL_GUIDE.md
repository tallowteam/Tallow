# QR Scanner Visual Guide

## Component States

### 1. Permission Request
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│            📷                        │
│                                     │
│     Camera Access Required          │
│                                     │
│  Allow camera access to scan QR     │
│  codes for quick device pairing     │
│                                     │
│     ┌──────────────────────┐       │
│     │  📷 Enable Camera    │       │
│     └──────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### 2. Scanning (Desktop)
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│   ┌───────────────────────────┐    │
│   │  [VIDEO FEED]             │    │
│   │                           │    │
│   │    ╔═══════════╗          │    │
│   │    ║           ║          │    │
│   │    ║  QR FRAME ║          │    │
│   │    ║ [SCAN LINE] (animated)│   │
│   │    ║           ║          │    │
│   │    ╚═══════════╝          │    │
│   │                           │    │
│   │  📱 Position QR within frame  │
│   └───────────────────────────┘    │
│                                     │
│   ┌──────────┐  ┌──────────┐       │
│   │ ⚡ Flash  │  │ ⌨️ Enter │       │
│   │   Off    │  │  Code    │       │
│   └──────────┘  └──────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### 3. Scanning (Mobile Full-Screen)
```
┌─────────────────┐
│ Scan QR  [Close]│
├─────────────────┤
│                 │
│ [VIDEO FEED]    │
│                 │
│   ╔═══════╗     │
│   ║       ║     │
│   ║  QR   ║     │
│   ║ FRAME ║     │
│   ║   |   ║     │ ← Scan line
│   ║       ║     │
│   ╚═══════╝     │
│                 │
│ 📱 Position QR  │
│   within frame  │
│                 │
│                 │
│ ┌─────────────┐ │
│ │ ⚡ Flash On │ │
│ └─────────────┘ │
│ ┌─────────────┐ │
│ │ ⌨️ Enter Code│ │
│ └─────────────┘ │
│                 │
└─────────────────┘
```

### 4. Success State
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│                                     │
│            ╭───────╮                │
│            │   ✓   │ (pulsing)      │
│            ╰───────╯                │
│                                     │
│       QR Code Detected!             │
│                                     │
│         Connecting...               │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

### 5. Permission Denied
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│             ⚠️                      │
│                                     │
│     Camera Access Denied            │
│                                     │
│  Camera permission denied. Please   │
│  allow camera access to scan QR     │
│  codes.                             │
│                                     │
│   ┌──────────┐  ┌──────────────┐   │
│   │Try Again │  │Enter Manually│   │
│   └──────────┘  └──────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 6. Error State
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│             ⚠️                      │
│                                     │
│         Scanner Error               │
│                                     │
│  QR scanning not supported on this  │
│  browser.                           │
│                                     │
│     ┌──────────────────────┐       │
│     │ Enter Code Manually  │       │
│     └──────────────────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### 7. Manual Entry
```
┌─────────────────────────────────────┐
│  Scan QR Code               [Close] │
├─────────────────────────────────────┤
│                                     │
│  Enter Room Code                    │
│  ┌───────────────────────────────┐ │
│  │       ABC123                  │ │ ← Uppercase
│  └───────────────────────────────┘ │
│                                     │
│              ┌────────┐ ┌────────┐ │
│              │ Cancel │ │Connect │ │
│              └────────┘ └────────┘ │
│                                     │
└─────────────────────────────────────┘
```

## UI Elements

### Corner Markers (Animated)
```
  ╔═══         ═══╗
  ║                 ║
  ║                 ║

  ║                 ║
  ║                 ║
  ╚═══         ═══╝

  ↑ Glowing purple borders
```

### Scan Line Animation
```
Frame 1:  ╔═══════╗
          ║───────║  ← Line at top
          ║       ║
          ╚═══════╝

Frame 2:  ╔═══════╗
          ║       ║
          ║───────║  ← Line moving down
          ╚═══════╝

Frame 3:  ╔═══════╗
          ║       ║
          ║       ║
          ║───────║  ← Line at bottom
          ╚═══════╝

(Repeats every 2 seconds)
```

### Instructions Bubble
```
  ┌──────────────────────────────┐
  │ 📱 Position QR code within    │
  │    frame                      │
  └──────────────────────────────┘
         ↑ Positioned at bottom
     Rounded, semi-transparent
```

### Control Buttons
```
┌──────────┐   ┌──────────┐
│ ⚡ Flash  │   │ ⌨️ Enter │
│   Off    │   │  Code    │
└──────────┘   └──────────┘
    ↑              ↑
  Inactive       Normal
  (gray)        (purple)

┌──────────┐
│ ⚡ Flash  │
│   On     │
└──────────┘
    ↑
  Active
  (bright purple)
```

## Color Scheme

### Primary Colors
```
Background:  rgba(23, 23, 23, 0.95)  [Dark gray]
Accent:      #5E5CE6                  [Purple]
Success:     #0cce6b                  [Green]
Error:       #ee0000                  [Red]
Text:        #ededed                  [Light gray]
Muted:       #a1a1a1                  [Gray]
```

### Overlays
```
Modal Overlay:      rgba(0, 0, 0, 0.8) + blur(8px)
Video Container:    #000000 (black)
Scan Overlay:       rgba(0, 0, 0, 0.3)
Instructions:       rgba(0, 0, 0, 0.8) + blur(8px)
```

### Borders
```
Default:       rgba(255, 255, 255, 0.08)
Hover:         rgba(94, 92, 230, 0.4)
Active:        rgba(94, 92, 230, 0.5)
Corner Glow:   rgba(94, 92, 230, 0.6)
```

## Animations

### 1. Modal Entry
```
Opacity:    0 → 1        (200ms)
Transform:  translateY(20px) → 0  (300ms)
Scale:      0.95 → 1     (300ms)
Easing:     cubic-bezier(0.16, 1, 0.3, 1)
```

### 2. Scan Line
```
Position:   top: 0 → 100%
Duration:   2s linear infinite
Opacity:    0 → 1 → 1 → 0
Gradient:   transparent → purple → transparent
```

### 3. Success Pulse
```
Scale:      0 → 1.1 → 1
Duration:   600ms
Easing:     cubic-bezier(0.16, 1, 0.3, 1)
```

### 4. Button Hover
```
Transform:  translateY(-2px)
Shadow:     0 4px 12px purple
Duration:   200ms ease
```

### 5. Slide Down (Manual Entry)
```
Opacity:    0 → 1
Transform:  translateY(-8px) → 0
Duration:   300ms ease-out
```

## Responsive Breakpoints

### Desktop (>768px)
```
Modal:
  - Width: 600px
  - Border radius: 1.5rem
  - Padding: 1.5rem
  - Centered in viewport

Video:
  - Aspect ratio: 4:3
  - Border radius: 1rem

Controls:
  - Horizontal layout
  - Side by side
```

### Mobile (<768px)
```
Modal:
  - Full screen
  - No border radius
  - No padding on edges

Video:
  - Aspect ratio: 3:4
  - No border radius
  - Full width

Controls:
  - Vertical layout
  - Stacked
  - Full width buttons
```

## Interaction Flow

### Successful Scan
```
1. Click "Scan QR Code"
   ↓
2. Permission Request
   ↓
3. User Grants Permission
   ↓
4. Camera Activates
   ↓
5. Video Feed Displays
   ↓
6. Scan Line Animates
   ↓
7. QR Code Detected
   ↓
8. Success Animation (✓)
   ↓
9. Call onScan(data)
   ↓
10. Auto-close after 800ms
```

### Permission Denied Flow
```
1. Click "Scan QR Code"
   ↓
2. Permission Request
   ↓
3. User Denies Permission
   ↓
4. Error State Displays
   ↓
5. Options:
   - Try Again → Step 2
   - Manual Entry → Input Form
```

### Manual Entry Flow
```
1. Click "Enter Code"
   ↓
2. Show Input Form
   ↓
3. Type Code (auto-uppercase)
   ↓
4. Validate (min 4 chars)
   ↓
5. Press Enter or Click Connect
   ↓
6. Call onScan(code)
   ↓
7. Close
```

## Keyboard Navigation

```
Tab Order:
1. Close Button [X]
2. Enable Camera Button (if shown)
3. Flash Toggle (if available)
4. Enter Code Button
5. Manual Input (if shown)
6. Cancel Button (if shown)
7. Connect Button (if shown)

Shortcuts:
- Escape → Close modal
- Enter  → Submit manual code (if focused)
- Tab    → Navigate controls
```

## Focus States

```
Button (focused):
┌──────────────────┐
│ Enable Camera    │  ← 2px purple outline
└──────────────────┘   + 2px offset

Input (focused):
┌────────────────────┐
│ ABC123             │  ← Purple border
└────────────────────┘   + 3px shadow
```

## Accessibility Labels

```
<button aria-label="Close scanner">
<button aria-label="Enable Camera">
<button aria-label="Turn on flash">
<button aria-label="Turn off flash">
<button aria-label="Enter code manually">
<input aria-label="Room code input">
<video aria-hidden="true">
```

## CSS Grid Layout (Mobile)

```
┌─────────────────┐
│ Header          │  Fixed height
├─────────────────┤
│                 │
│ Content         │  flex: 1
│ (Video/Form)    │
│                 │
├─────────────────┤
│ Controls        │  Auto height
└─────────────────┘
```

## Z-Index Stack

```
1000: Overlay background
1001: Modal container
1002: Header & controls
1003: Close button
1004: Scan frame overlay
1005: Instructions bubble
```

This visual guide provides a clear understanding of the QR Scanner component's appearance and behavior across all states and viewports.
