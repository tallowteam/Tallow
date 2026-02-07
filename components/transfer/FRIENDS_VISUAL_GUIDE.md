# Friends System - Visual Guide

## Component States

### 1. Empty State (No Friends)

```
┌──────────────────────────────────────────────┐
│                                              │
│                    👥                        │
│                                              │
│              No friends yet                  │
│                                              │
│   Add friends to quickly send files without  │
│   entering codes every time.                 │
│                                              │
│  ┌─────────────────┐  ┌─────────────────┐  │
│  │ Generate Code   │  │ Enter Code      │  │
│  └─────────────────┘  └─────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

### 2. Friends List View

```
┌──────────────────────────────────────────────┐
│ Friends          3 of 5 online  [Add Friend] │
├──────────────────────────────────────────────┤
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │  [A]●  Alice            🍎         ✕  │    │
│ │        Online  ✓ Trusted              │    │
│ │        5 transfers                     │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │  [B]●  Bob              🪟         ✕  │    │
│ │        Online                          │    │
│ │        2 transfers                     │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │  [C]○  Charlie          🐧         ✕  │    │
│ │        Last seen 2h ago               │    │
│ │        12 transfers                    │    │
│ └──────────────────────────────────────┘    │
│                                              │
└──────────────────────────────────────────────┘

Legend:
● = Online (green pulsing dot)
○ = Offline (gray dot)
✓ Trusted = Auto-accept enabled
🍎 = macOS, 🪟 = Windows, 🐧 = Linux
[A] = Avatar placeholder with initial
✕ = Remove friend button
```

### 3. Add Friend Modal

```
┌──────────────────────────────────────────────┐
│ Add Friend                              [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  Share this code with your friend. They'll   │
│  enter it on their device to pair.          │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │                                        │ │
│  │           1  2  3  4  5  6            │ │
│  │                                        │ │
│  │       Expires in 4:37                 │ │
│  │                                        │ │
│  └────────────────────────────────────────┘ │
│                                              │
│          [Close]  [Generate New Code]        │
│                                              │
└──────────────────────────────────────────────┘
```

### 4. Enter Friend's Code Modal

```
┌──────────────────────────────────────────────┐
│ Enter Friend's Code                     [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  Enter the 6-digit code your friend         │
│  shared with you.                           │
│                                              │
│  ┌────────────────────────────────────────┐ │
│  │           0  0  0  0  0  0            │ │
│  └────────────────────────────────────────┘ │
│                                              │
│             [Cancel]  [Add Friend]           │
│                                              │
└──────────────────────────────────────────────┘
```

### 5. Remove Friend Confirmation

```
┌──────────────────────────────────────────────┐
│ Remove Friend                           [×]  │
├──────────────────────────────────────────────┤
│                                              │
│  Are you sure you want to remove Alice?     │
│  This action cannot be undone.              │
│                                              │
│             [Cancel]  [Remove]               │
│                                              │
└──────────────────────────────────────────────┘
```

## Color Scheme

### Dark Theme Colors

```
Backgrounds:
  Primary:   #18181b (zinc-900)
  Secondary: #27272a (zinc-800)
  Tertiary:  #3f3f46 (zinc-700)

Text:
  Primary:   #f4f4f5 (zinc-100)
  Secondary: #a1a1aa (zinc-400)
  Tertiary:  #71717a (zinc-500)

Accent:
  Primary:   #5e5ce6 (purple)
  Light:     #818cf8 (purple-400)
  Lighter:   #a5b4fc (purple-300)

Status:
  Online:    #10b981 (green-500)
  Offline:   #71717a (zinc-500)
  Error:     #ef4444 (red-500)

Borders:
  Default:   #27272a (zinc-800)
  Hover:     #5e5ce6 (purple)
  Focus:     #818cf8 (purple-400)
```

## Component Hierarchy

```
FriendsList
├── Empty State
│   ├── Icon (👥)
│   ├── Title
│   ├── Description
│   └── Actions
│       ├── Generate Code Button
│       └── Enter Code Button
│
├── List View
│   ├── Header
│   │   ├── Title + Count
│   │   └── Add Friend Button
│   │
│   └── Friends List
│       └── Friend Card (foreach)
│           ├── Avatar
│           │   ├── Image / Placeholder
│           │   └── Online Indicator
│           ├── Friend Info
│           │   ├── Name + Platform
│           │   ├── Status + Trusted Badge
│           │   └── Transfer Count
│           └── Remove Button
│
├── Add Friend Modal
│   ├── Modal Header
│   ├── Instructions
│   ├── Code Display
│   │   ├── 6-digit Code
│   │   └── Expiration Timer
│   └── Actions
│       ├── Close Button
│       └── Generate New Button
│
├── Enter Code Modal
│   ├── Modal Header
│   ├── Instructions
│   ├── Code Input
│   ├── Error Message (conditional)
│   └── Actions
│       ├── Cancel Button
│       └── Add Friend Button
│
└── Remove Confirmation
    └── ConfirmDialog Component
        ├── Title
        ├── Message
        └── Actions
```

## Interactions Flow

### Adding a Friend

```
User clicks "Generate Pairing Code"
    ↓
Modal opens with 6-digit code
    ↓
User shares code (copy/paste, verbal, etc.)
    ↓
Friend enters code on their device
    ↓
Both devices pair (WebRTC/signaling)
    ↓
Friend appears in list with "Online" status
    ↓
Modal closes automatically
```

### Entering Friend's Code

```
User clicks "Enter Friend's Code"
    ↓
Modal opens with input field
    ↓
User types 6-digit code
    ↓
Input validates (6 digits only)
    ↓
User clicks "Add Friend"
    ↓
Code verified (API/signaling)
    ↓
Friend added to list
    ↓
Modal closes
```

### Selecting a Friend

```
User clicks on friend card
    ↓
onSelectFriend callback fired
    ↓
Parent component receives friend object
    ↓
Transfer dialog opens / File picker shows
    ↓
Transfer initiated to friend
```

### Removing a Friend

```
User clicks remove button (✕)
    ↓
Confirmation dialog appears
    ↓
User confirms removal
    ↓
Friend removed from store
    ↓
Card animates out
    ↓
List updates
```

## Responsive Breakpoints

### Desktop (> 768px)
```
┌─────────────────────────────────────────┐
│  Friends List (full width)              │
│  ┌────────────────────┐                 │
│  │ Friend Card        │                 │
│  └────────────────────┘                 │
│  ┌────────────────────┐                 │
│  │ Friend Card        │                 │
│  └────────────────────┘                 │
└─────────────────────────────────────────┘
```

### Mobile (< 640px)
```
┌──────────────────────┐
│  Friends List        │
│  ┌────────────────┐  │
│  │ Friend Card    │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Friend Card    │  │
│  └────────────────┘  │
│  [Add Friend]        │
│  (full width)        │
└──────────────────────┘
```

## Animation Timing

```
Card Hover:
  Duration: 0.2s
  Easing: ease
  Properties: background, border-color, transform

Online Indicator Pulse:
  Duration: 2s
  Easing: ease-in-out
  Loop: infinite
  Keyframes: 1 → 0.5 → 1 opacity

Card Entry:
  Duration: 0.3s
  Easing: ease
  Properties: opacity, translateY
  From: 0, 10px
  To: 1, 0

Modal Open:
  Duration: 0.3s
  Easing: ease
  Properties: opacity, translateY
  From: 0, -20px
  To: 1, 0

Button Press:
  Duration: 0.1s
  Easing: ease
  Properties: transform
  Active: scale(0.95)
```

## Platform Icons Reference

```
🪟 = Windows
🍎 = macOS
🐧 = Linux
🤖 = Android
📱 = iOS
🌐 = Web Browser
💻 = Unknown/Generic
```

## Status Indicators

```
● Green (Online)
  - Solid green circle
  - Pulsing animation
  - Box shadow glow

○ Gray (Offline)
  - Outline circle
  - No animation
  - No glow

✓ Trusted Badge
  - Light purple background
  - Purple border
  - Check mark icon
  - Small rounded rectangle
```

## Typography Scale

```
Display (Title):        2rem / 32px
Heading:                1.5rem / 24px
Subheading:             1.25rem / 20px
Body:                   1rem / 16px
Small:                  0.875rem / 14px
Tiny:                   0.75rem / 12px

Pairing Code:           3rem / 48px
Code Input:             2rem / 32px
Stat Value:             2.5rem / 40px

Font Family:
  Default: System font stack
  Mono: 'Courier New', monospace (codes)

Font Weight:
  Regular: 400
  Medium:  500
  Semibold: 600
  Bold:    700
```

## Spacing System

```
Gap (between elements):
  Tight:   0.25rem / 4px
  Normal:  0.5rem / 8px
  Relaxed: 1rem / 16px
  Loose:   2rem / 32px

Padding:
  Small:   0.75rem / 12px
  Medium:  1rem / 16px
  Large:   1.5rem / 24px
  XLarge:  2rem / 32px

Border Radius:
  Small:   0.375rem / 6px
  Medium:  0.5rem / 8px
  Large:   0.75rem / 12px
  Circle:  50%

Border Width:
  Default: 1px
  Thick:   2px
```

## Accessibility Features

```
Keyboard Navigation:
  ✓ Tab to navigate between cards
  ✓ Enter/Space to select friend
  ✓ Escape to close modals
  ✓ Tab trap in modals

Focus States:
  ✓ Visible focus rings
  ✓ High contrast outlines
  ✓ Consistent focus order

ARIA Labels:
  ✓ Buttons have labels
  ✓ Status indicators
  ✓ Modal roles
  ✓ Alert messages

Screen Readers:
  ✓ Semantic HTML
  ✓ Alt text for images
  ✓ Live regions for updates
  ✓ Descriptive text
```

## File Size Reference

```
friends-store.ts:           ~15 KB
FriendsList.tsx:           ~12 KB
FriendsList.module.css:    ~8 KB
Total Component:           ~35 KB (unminified)
```

## Browser Support Matrix

```
Chrome 90+:     ✓ Full support
Firefox 88+:    ✓ Full support
Safari 14+:     ✓ Full support
Edge 90+:       ✓ Full support
Chrome Mobile:  ✓ Full support
Safari iOS:     ✓ Full support
Samsung Internet: ✓ Full support

Required Features:
  - CSS Grid
  - CSS Custom Properties
  - LocalStorage
  - ES6+ JavaScript
  - CSS Animations
```

This visual guide provides a clear reference for understanding the friends system UI and interactions without needing to run the code.
