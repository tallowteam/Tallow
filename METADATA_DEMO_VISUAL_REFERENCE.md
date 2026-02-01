# Metadata Stripping Demo - Visual Reference Guide

## Component States Visual Reference

This guide provides a visual description of each state in the Metadata Stripping Demo component.

---

## State 1: Initial/Upload State

```
┌─────────────────────────────────────────────────────────────┐
│  🛡️  Metadata Stripping Demo                                │
│  Protect your privacy by removing hidden metadata           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Privacy Risk: Photos often contain hidden metadata...   │
│     including GPS coordinates, camera details, timestamps... │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📤  Upload an Image                                          │
│     Select an image file to analyze and strip metadata      │
│                                                              │
│     ┌───────────────────────────────────────────┐          │
│     │      [SELECT DEMO IMAGE]                  │          │
│     └───────────────────────────────────────────┘          │
│                                                              │
│     Supported formats: JPEG, PNG, WebP, HEIC                │
└─────────────────────────────────────────────────────────────┘
```

**Visual Elements:**
- Shield icon in header (primary color)
- Amber warning banner with AlertTriangle icon
- Upload card with centered button
- Clean, spacious layout

---

## State 2: Metadata Display (Before Stripping)

```
┌───────────────────────────────┬───────────────────────────────┐
│ ⚠️  Before - Original File    │ ⏳ After - Clean File         │
│ [CONTAINS METADATA]           │    Awaiting processing...     │
│ vacation_photo.jpg            │                               │
│                               │                               │
│ ┌───────────────────────────┐ │ ┌───────────────────────────┐ │
│ │                           │ │ │                           │ │
│ │    [Image Preview]        │ │ │    [Image Preview]        │ │
│ │    (blue-purple gradient) │ │ │    (grayed out)           │ │
│ │                           │ │ │                           │ │
│ └───────────────────────────┘ │ └───────────────────────────┘ │
│                               │                               │
│ ⚠️  Sensitive Metadata Found  │                               │
│                               │   🛡️  Click "Strip Metadata" │
│ 📍 GPS Location               │      to clean the file        │
│    Latitude: 37.7749° N       │                               │
│    Longitude: 122.4194° W     │                               │
│    Altitude: 52m              │                               │
│    ⚠️ Reveals exact location  │                               │
│                               │                               │
│ 📷 Camera Information         │                               │
│    Make: Apple                │                               │
│    Model: iPhone 14 Pro       │                               │
│    Software: iOS 17.2.1       │                               │
│    ℹ Device fingerprinting    │                               │
│                               │                               │
│ 📅 Date & Time                │                               │
│    Original: 2024-03-15...    │                               │
│    Digitized: 2024-03-15...   │                               │
│    ℹ Reveals when and where   │                               │
│                               │                               │
│ ❌ Author Information         │                               │
│    Artist: John Doe           │                               │
│    Copyright: Copyright 2024  │                               │
│    ℹ Personal identification  │                               │
│                               │                               │
│ ┌───────────────────────────┐ │                               │
│ │  🛡️  STRIP METADATA       │ │                               │
│ └───────────────────────────┘ │                               │
└───────────────────────────────┴───────────────────────────────┘
```

**Visual Elements:**
- Side-by-side card layout (amber ring on left, grayed right)
- Left card has amber "CONTAINS METADATA" badge
- Detailed metadata sections with colored icons:
  - Red MapPin for GPS
  - Blue Camera for device info
  - Purple Calendar for timestamps
  - Orange X for author data
- Each section has warning/info messages
- Prominent "Strip Metadata" button at bottom

---

## State 3: Stripping In Progress

```
┌───────────────────────────────┬───────────────────────────────┐
│ ⚠️  Before - Original File    │ ⏳ After - Clean File         │
│ [CONTAINS METADATA]           │    Processing...              │
│ vacation_photo.jpg            │                               │
│                               │                               │
│ [Same metadata display...]    │ ┌───────────────────────────┐ │
│                               │ │                           │ │
│                               │ │    [Image Preview]        │ │
│                               │ │    (grayed out)           │ │
│                               │ │                           │ │
│                               │ └───────────────────────────┘ │
│                               │                               │
│ ┌───────────────────────────┐ │      🛡️ (pulsing)           │
│ │  🛡️  STRIPPING METADATA..│ │                               │
│ │     (disabled)            │ │   Processing and removing    │
│ └───────────────────────────┘ │   metadata...                │
└───────────────────────────────┴───────────────────────────────┘
```

**Visual Elements:**
- Button shows loading state with pulsing shield icon
- Right card shows "Processing..." message
- Disabled state prevents double-clicks
- Duration: 1.5 seconds

---

## State 4: Complete (After Stripping)

```
┌───────────────────────────────┬───────────────────────────────┐
│ ⚠️  Before - Original File    │ ✅ After - Clean File         │
│    vacation_photo.jpg         │ [METADATA REMOVED]            │
│                               │ vacation_photo.jpg (cleaned)  │
│ ┌───────────────────────────┐ │                               │
│ │                           │ │ ┌───────────────────────────┐ │
│ │    [Image Preview]        │ │ │                           │ │
│ │    (blue-purple gradient) │ │ │    [Image Preview]        │ │
│ │                           │ │ │    (green gradient)       │ │
│ └───────────────────────────┘ │ └───────────────────────────┘ │
│                               │                               │
│ [Metadata still visible...]   │ ✅ All Metadata Removed       │
│                               │                               │
│                               │ ❌ GPS location data removed  │
│                               │ ❌ Camera information removed │
│                               │ ❌ Date/time removed          │
│                               │ ❌ Author/copyright removed   │
│                               │                               │
│                               │ ✅ Your image is now safe to  │
│                               │    share                      │
│                               │                               │
│                               │ Only the visual content       │
│                               │ remains. All identifying      │
│                               │ metadata removed.             │
│                               │                               │
│                               │ Original: 2.4 MB   Clean: 2.3│
│                               │                               │
│                               │ ┌───────────────────────────┐ │
│                               │ │  TRY ANOTHER IMAGE        │ │
│                               │ └───────────────────────────┘ │
└───────────────────────────────┴───────────────────────────────┘
```

**Visual Elements:**
- Right card has green ring highlight
- Green "METADATA REMOVED" badge
- Success message with checkmark icon
- List of removed items with green X icons
- File size comparison
- "Try Another Image" button (outline variant)

---

## Educational Sections

### "Why Remove Metadata?" Section

```
┌─────────────────────────────────────────────────────────────┐
│  Why Remove Metadata?                                        │
│  Understanding the privacy risks of image metadata          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────┬─────────────────────┬───────────────┐
│ 📍 Location Tracking│ 📷 Device Fingerpri │ 📅 Timeline   │
│    GPS coordinates  │    Camera model can │    Timestamps │
│    reveal your home │    identify you     │    expose your│
│    address...       │    across platforms │    schedule...│
└─────────────────────┴─────────────────────┴───────────────┘
┌─────────────────────┐
│ 🛡️ Identity Protect │
│    Author fields may│
│    contain your name│
└─────────────────────┘
```

### "How Tallow Protects You" Section

```
┌─────────────────────────────────────────────────────────────┐
│  How Tallow Protects You                                     │
│  Automatic metadata stripping in action                     │
└─────────────────────────────────────────────────────────────┘

│ ① Automatic Detection                                        │
│    Tallow automatically scans all images before transfer     │
│                                                              │
│ ② Smart Stripping                                           │
│    Removes sensitive metadata while preserving quality      │
│                                                              │
│ ③ Secure Transfer                                           │
│    Only the cleaned file is sent, with E2E encryption       │
│                                                              │
│ Supported formats: JPEG, PNG, WebP, HEIC, MP4, MOV          │
└─────────────────────────────────────────────────────────────┘
```

---

## Color Palette Reference

### Status Colors

| State | Background | Border | Text | Badge |
|-------|-----------|--------|------|-------|
| Warning (Before) | `amber-50` / `amber-950` | `amber-200` / `amber-800` | `amber-900` / `amber-100` | `amber-100` / `amber-900` |
| Success (After) | `green-50` / `green-950` | `green-200` / `green-800` | `green-900` / `green-100` | `green-100` / `green-900` |
| Info | `blue-50` / `blue-950` | `blue-200` / `blue-800` | `blue-900` / `blue-100` | - |

### Icon Colors

| Metadata Type | Icon | Light Mode | Dark Mode |
|--------------|------|------------|-----------|
| GPS | MapPin | `red-500` | `red-500` |
| Camera | Camera | `blue-500` | `blue-500` |
| Timestamp | Calendar | `purple-500` | `purple-500` |
| Author | X | `orange-500` | `orange-500` |
| Success | CheckCircle | `green-600` | `green-400` |
| Warning | AlertTriangle | `amber-600` | `amber-400` |
| Shield | Shield | `primary` | `primary` |

---

## Typography Scale

| Element | Class | Font Size | Weight |
|---------|-------|-----------|--------|
| Page Title | `text-2xl` | 1.5rem | bold |
| Card Title | `text-lg` | 1.125rem | semibold |
| Section Heading | `text-sm` | 0.875rem | medium |
| Body Text | `text-sm` | 0.875rem | normal |
| Muted Text | `text-xs` | 0.75rem | normal |
| Badge | `text-xs` | 0.75rem | medium |

---

## Spacing System

| Area | Padding/Gap | Tailwind Class |
|------|-------------|----------------|
| Page Container | 1.5rem / 2rem | `p-6` / `p-8` |
| Card Padding | 2rem | `p-8` |
| Section Gap | 1.5rem | `space-y-6` |
| Content Gap | 1rem | `space-y-4` |
| Grid Gap | 1.5rem | `gap-6` |
| Icon Gap | 0.5rem | `gap-2` |

---

## Responsive Breakpoints

### Mobile (< 768px)

```
┌─────────────────────┐
│ Header              │
├─────────────────────┤
│ Warning Banner      │
├─────────────────────┤
│ Before Card         │
│ (full width)        │
├─────────────────────┤
│ After Card          │
│ (full width)        │
├─────────────────────┤
│ Why Remove Section  │
│ (stacked 1 column)  │
├─────────────────────┤
│ How It Works        │
└─────────────────────┘
```

### Tablet (768px - 1024px)

```
┌─────────────────────────────────┐
│ Header (centered)               │
├─────────────────────────────────┤
│ Warning Banner                  │
├────────────────┬────────────────┤
│ Before Card    │ After Card     │
│ (50% width)    │ (50% width)    │
├────────────────┴────────────────┤
│ Why Remove (2 columns)          │
├─────────────────────────────────┤
│ How It Works                    │
└─────────────────────────────────┘
```

### Desktop (> 1024px)

```
┌─────────────────────────────────────────────┐
│        Header (centered, max-w-4xl)         │
├─────────────────────────────────────────────┤
│        Warning Banner (max-w-4xl)           │
├──────────────────────┬──────────────────────┤
│   Before Card        │   After Card         │
│   (50% - gap)        │   (50% - gap)        │
├──────────────────────┴──────────────────────┤
│   Why Remove (4 column grid, max-w-6xl)    │
├─────────────────────────────────────────────┤
│        How It Works (max-w-4xl)             │
└─────────────────────────────────────────────┘
```

---

## Animation Specifications

### Transition Properties

```css
/* Card hover effects */
transition: all 300ms ease-in-out;
  - transform: translateY(-2px)
  - shadow: lg

/* State changes */
transition: opacity 300ms, transform 300ms;

/* Ring highlights */
transition: ring-width 200ms, ring-color 200ms;
```

### Loading Animations

```css
/* Pulsing shield icon */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Applied during stripping */
animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
```

---

## Accessibility Indicators

### Focus States

```
┌─────────────────────────┐
│  [BUTTON TEXT]          │  ← Default state
└─────────────────────────┘

┌─────────────────────────┐
│▓▓[BUTTON TEXT]▓▓▓▓▓▓▓▓▓▓│  ← Focused state
└─────────────────────────┘  (ring-2 ring-ring ring-offset-2)
```

### Reduced Motion

When `prefers-reduced-motion: reduce`:
- Transitions shortened to 100ms
- Animations disabled
- Smooth scrolling disabled

---

## Component Dimensions

### Maximum Widths

| Section | Max Width | Tailwind Class |
|---------|-----------|----------------|
| Main Container | 72rem (1152px) | `max-w-6xl` |
| Before/After Cards | Container width | `w-full` |
| Educational Sections | 72rem | `max-w-6xl` |

### Minimum Heights

| Element | Min Height |
|---------|-----------|
| Image Preview | 16rem (256px) aspect-video |
| Button | 3rem (48px) |
| Card | Auto (content-based) |

---

## Dark Mode Comparison

### Light Mode
- Background: White / Cream
- Text: Dark gray / Black
- Cards: White with subtle shadow
- Borders: Light gray
- Metadata sections: Pastel colors

### Dark Mode
- Background: Dark gray / Black
- Text: Light gray / White
- Cards: Dark gray with subtle shadow
- Borders: Medium gray
- Metadata sections: Muted dark colors

**Auto-detection:** Uses Tailwind's `dark:` variant based on system preference.

---

## Icon Legend

| Icon | Meaning | Usage |
|------|---------|-------|
| 🛡️ Shield | Security/Privacy | Header, success states |
| ⚠️ AlertTriangle | Warning | Risk indicators |
| ✅ CheckCircle | Success | Completion state |
| 📍 MapPin | Location | GPS metadata |
| 📷 Camera | Device | Camera info |
| 📅 Calendar | Time | Timestamps |
| ❌ X | Remove/Close | Removed items |
| 📤 Upload | File upload | Upload section |
| 🖼️ Image | Photo | Image placeholder |

---

## Printable Quick Reference Card

```
╔══════════════════════════════════════════════════════════╗
║  METADATA STRIPPING DEMO - QUICK VISUAL REFERENCE        ║
╠══════════════════════════════════════════════════════════╣
║  States:                                                 ║
║  1️⃣ Initial    → Upload button                          ║
║  2️⃣ Metadata   → Before card with data (amber)          ║
║  3️⃣ Stripping  → Loading state (1.5s)                   ║
║  4️⃣ Complete   → After card success (green)             ║
╠══════════════════════════════════════════════════════════╣
║  Color Codes:                                            ║
║  🔴 Red     → GPS (critical risk)                        ║
║  🔵 Blue    → Camera (fingerprinting)                    ║
║  🟣 Purple  → Timestamps (timeline)                      ║
║  🟠 Orange  → Author (identity)                          ║
║  🟡 Amber   → Warning (metadata present)                 ║
║  🟢 Green   → Success (metadata removed)                 ║
╠══════════════════════════════════════════════════════════╣
║  Layout:                                                 ║
║  Mobile:  Stacked vertical                              ║
║  Desktop: Side-by-side comparison                       ║
╠══════════════════════════════════════════════════════════╣
║  Key Features:                                           ║
║  • Responsive design (mobile → desktop)                 ║
║  • Theme-aware (light/dark mode)                        ║
║  • Smooth animations (300ms transitions)                ║
║  • Accessible (WCAG 2.1 AA)                             ║
║  • TypeScript types (production-ready)                  ║
╚══════════════════════════════════════════════════════════╝
```

---

## Usage in Different Contexts

### Context 1: Full-Width Page

```
┌────────────────────────────────────────────────┐
│                    HEADER                      │
├────────────────────────────────────────────────┤
│                                                │
│        [Metadata Stripping Demo Component]     │
│              (centered, max-w-6xl)             │
│                                                │
├────────────────────────────────────────────────┤
│                    FOOTER                      │
└────────────────────────────────────────────────┘
```

### Context 2: Dialog/Modal

```
┌─────────────────────────────────┐
│  X   Privacy Protection Demo    │
├─────────────────────────────────┤
│                                 │
│  [Component scaled to fit]      │
│  (scrollable if needed)         │
│                                 │
└─────────────────────────────────┘
```

### Context 3: Dashboard Section

```
┌─────────────────────────────────────────┐
│  Dashboard                              │
├─────────────────┬───────────────────────┤
│  Sidebar        │  Main Content         │
│                 │                       │
│  • Overview     │  [Metadata Demo]      │
│  • Privacy ◄─   │  (inline)             │
│  • Settings     │                       │
└─────────────────┴───────────────────────┘
```

---

**This visual reference guide provides designers and developers with a clear understanding of the component's appearance, states, and behavior across different contexts.**

---

**Last Updated:** 2026-01-26
**Component Version:** 1.0.0
