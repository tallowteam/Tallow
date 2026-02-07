# Animations Visual Guide

A visual reference showing exactly what animations are applied where.

---

## 🎯 Hero Section (`/`)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│    [•] Now with quantum-safe encryption            │ ← Badge dot: PULSE GLOW
│         └─ Green dot pulses softly                 │
│                                                     │
│    File transfers.                                  │
│    Quantum-safe.  ← SHIMMER TEXT                   │
│    └─ 3-color gradient sweep animation             │
│       (left to right, 3s loop)                     │
│                                                     │
│    [Background: ANIMATED GRADIENT MESH]            │ ← Hero gradient: SHIFT
│    └─ 3 radial gradients slowly moving             │
│       (15s organic movement)                       │
│                                                     │
│    256-bit    •    Zero    •    100%               │
│    Encryption      Servers     Private              │
│    └─────────┬─────────────┬──────────┘            │
│         FADE UP with stagger delays                 │
│         (400ms, 475ms, 550ms)                      │
└─────────────────────────────────────────────────────┘
```

**Entrance Sequence**:
1. Badge: fade-down (0ms)
2. Title: fade-up (100ms)
3. Description: fade-up (200ms)
4. Buttons: fade-up (300ms)
5. Stats: fade-up (400ms)

---

## 🎴 Feature Cards

```
┌─────────────────────┐
│  [🔒]     AES-256   │ ← Icon + Badge
│                     │
│  End-to-End         │
│  Encryption         │
│                     │
│  Your files are...  │
└─────────────────────┘

IDLE → HOVER:
┌─────────────────────┐
│  [🔒]  ← scale(1.1) │ ← Icon scales up
│   ↑                 │
│ glow bg             │ ← Background glows
│                     │
│  End-to-End         │
│  Encryption         │
│                     │ ← Card lifts -4px
│  Your files are...  │ ← Purple border glow
└─────────────────────┘
       ↑ scale(1.0)
   translateY(-4px)
   shadow: purple glow
```

**Animations**:
- Card: `translateY(-4px)` + purple border gradient
- Icon: `scale(1.1)` + background color shift
- Duration: 200ms smooth easing
- Entrance: Staggered fade-up (75ms between cards)

---

## 🔐 Security Cards

```
┌──────────────────────┐
│ [🛡️]                │
│                      │
│ Encryption           │
│ AES-256-GCM          │
└──────────────────────┘

HOVER:
┌──────────────────────┐
│ [🛡️]  ← no change   │
│  ═══                 │ ← Radial glow overlay
│  ═══  subtle glow    │   (purple, center)
│                      │
│ Encryption           │ ← Card scale(1.02)
│ AES-256-GCM          │ ← Purple glow shadow
└──────────────────────┘
```

**Animation**:
- Scale: 1.02
- Purple radial gradient overlay (opacity 0→1)
- Glow shadow: `0 0 20px rgba(94, 92, 230, 0.3)`
- Breathing glow (infinite 2s loop on hover)

---

## 🔘 Buttons

```
PRIMARY BUTTON STATES:

[IDLE]
┌────────────────────┐
│  Start Transfer    │ ← Purple solid bg
└────────────────────┘

[HOVER]
┌────────────────────┐
│  Start Transfer    │ ← Brighter (1.1x)
└────────────────────┘ ← Purple glow shadow
    ↑ Radial overlay reveals

[ACTIVE/PRESS]
┌────────────────────┐
│  Start Transfer    │ ← scale(0.98)
└────────────────────┘ ← Darker (0.95x)

[LOADING]
┌────────────────────┐
│      ⟳            │ ← Spinner rotates (800ms)
└────────────────────┘
```

**Animations**:
- Hover: `brightness(1.1)` + glow shadow
- Active: `scale(0.98)` + `brightness(0.95)`
- Loading: Smooth spinner rotation (optimized 800ms)

---

## 🏷️ Badge with Dot

```
┌───────────────────────┐
│ • New Feature         │ ← Dot pulses
└───────────────────────┘
  ↑
  Pulse:
  scale 1.0 → 1.1 → 1.0
  opacity 1 → 0.7 → 1
  (2s infinite loop)
```

**Animation**:
- Dot: scale + opacity pulse
- Duration: 2s infinite
- Gentle breathing effect

---

## 📁 File Drop Zone (`/transfer`)

```
IDLE:
┌────────────────────────────────┐
│                                │
│         [📁]                   │
│                                │
│  Drop files here               │
│  or click to browse            │
│                                │
└────────────────────────────────┘

HOVER:
┌────────────────────────────────┐
│                                │
│         [📁] ← scale(1.1)      │
│              ← purple color    │
│  Drop files here               │
│  or click to browse            │
│                                │ ← scale(1.01)
└────────────────────────────────┘

DRAGGING (file over):
┌════════════════════════════════┐ ← PULSING BORDER
║  ═══  ═══  ═══  ═══  ═══      ║ ← Purple glow
║                                ║    expanding/contracting
║         [📁]                   ║    (1.5s infinite)
║                                ║
║  Drop files here               ║ ← scale(1.02)
║  or click to browse            ║
║                                ║
╚════════════════════════════════╝
```

**Animations**:
- Hover: Icon scale(1.1) + purple color
- Dragging: Pulsing purple border + expanding shadow
- Duration: 1.5s pulse loop

---

## 📱 Device Cards (`/transfer`)

```
IDLE:
┌─────────────────┐
│  ┌───────────┐  │
│  │  iPhone   │  │ ← Device icon
│  │    📱     │  │
│  └───────────┘  │
│      [●]        │ ← Online dot (pulses)
│                 │
│  iPhone 15 Pro  │
│    📱 iOS       │
└─────────────────┘

HOVER:
┌─────────────────┐
│  ┌───────────┐  │  [→]  ← Send icon fades in
│  │  iPhone   │  │        scale(1.1)
│  │    📱     │  │ ← Icon scale(1.1)
│  └───────────┘  │ ← Icon bg glows
│      [●]        │
│                 │ ← Card lifts -4px
│  iPhone 15 Pro  │ ← Purple glow shadow
│    📱 iOS       │    (breathing 2s)
└─────────────────┘
     ↑ scale(1.02)
```

**Animations**:
- Card: `translateY(-4px)` + `scale(1.02)`
- Device icon: `scale(1.1)` + glow
- Send indicator: fade in + `scale(1.1)`
- Glow: Breathing box-shadow (2s infinite)
- Online dot: Pulse animation (always active)

---

## 📊 Tab Navigation (`/transfer`)

```
┌─────────────────────────────────────────┐
│ [Nearby] [Internet] [Friends]           │
└─────────────────────────────────────────┘
    ↑         ↑           ↑
  Active    Idle        Idle

ACTIVE TAB:
┌───────────────┐
│  🌐 Nearby    │ ← Purple bg + glow
└───────────────┘ ← Shimmer overlay
      ↑            (2s opacity pulse)
  Icon scale(1.0)

HOVER (inactive):
┌───────────────┐
│  🌐 Internet  │ ← Light bg
└───────────────┘ ← Icon scale(1.05)

TAB ACTIVATION SEQUENCE:
1. scale(0.95)    @ 0ms    ← Shrink
2. scale(1.02)    @ 150ms  ← Overshoot
3. scale(1.0)     @ 300ms  ← Settle
   + opacity 0.8 → 1
   + purple glow appears
```

**Animations**:
- Activate: Spring-like bounce (300ms)
- Active state: Shimmer overlay (2s loop)
- Hover: Icon scale(1.05) + background
- Smooth 250ms transitions

---

## 🎨 Color-Coded Animation Types

### 🟣 Purple Glow (Brand Color)
- Feature cards
- Device cards
- Drop zone when dragging
- Active tabs
- Primary buttons
- Security cards

### 🟢 Green Pulse (Status/Success)
- Badge dots
- Online indicators
- Connection status

### 🔵 Scale Transformations
- Icons on hover (1.1x)
- Cards on hover (1.02x)
- Button press (0.98x)

### 🟡 Shimmer Effects
- Hero title gradient
- Active tab overlay
- Gradient text

---

## ⏱️ Timing Breakdown

```
Ultra-fast (150ms):
- Button press feedback
- Icon micro-adjustments

Fast (200-300ms):
- Card hover effects
- Icon scaling
- Tab switches
- Color transitions

Medium (500-700ms):
- Entrance animations
- Modal opens
- Page transitions

Slow (1-3s):
- Shimmer text effects
- Pulse animations (dots, borders)
- Breathing glows

Very Slow (8-15s):
- Background gradients
- Ambient effects
```

---

## 🎭 Animation Choreography

### Landing Page Entrance
```
0ms:    Hero badge fades down
100ms:  Hero title fades up
200ms:  Hero description fades up
300ms:  Hero buttons fade up
400ms:  Hero stats fade up

[User scrolls]

Feature cards enter:
  Card 1: 0ms
  Card 2: 75ms
  Card 3: 150ms
  Card 4: 225ms
  Card 5: 300ms
  Card 6: 375ms

[Continuous]

Hero gradient: Shifts organically (15s loop)
"Quantum-safe" text: Shimmers (3s loop)
Badge dot: Pulses (2s loop)
```

### Transfer Page Interactions
```
[File drag starts]
0ms:    Drop zone border becomes solid
0ms:    Drop zone background shifts purple
0ms:    Drop zone scales to 1.02
0ms:    Border pulse animation starts

[File dropped]
0ms:    Success state
300ms:  File preview animates in

[User clicks device]
0ms:    Device card scale(1.02) + lift
0ms:    Device icon scale(1.1)
0ms:    Send indicator fades in + scale(1.1)
0ms:    Breathing glow starts (continuous)

[Transfer starts]
0ms:    Progress bar appears
∞:      Progress animation (smooth linear fill)
```

---

## 📐 Transform Properties Matrix

| Element | Idle | Hover | Active |
|---------|------|-------|--------|
| **Feature Card** | 0, 1.0 | -4px, 1.0 | - |
| **Device Card** | 0, 1.0 | -4px, 1.02 | -2px, 1.01 |
| **Button** | 0, 1.0 | 0, 1.0 | 0, 0.98 |
| **Drop Zone** | 0, 1.0 | 0, 1.01 | 0, 1.02 |
| **Icon** | 0, 1.0 | 0, 1.1 | - |
| **Security Card** | 0, 1.0 | 0, 1.02 | - |
| **Tab** | 0, 1.0 | 0, 1.0 | 0, 1.0→1.02→1.0 |

*Format: translateY, scale*

---

## 🎬 Demo Scenarios

### Scenario 1: First Page Load
1. Hero fades in with staggered timing
2. Gradient background begins slow movement
3. "Quantum-safe" text shimmers continuously
4. Badge dot pulses
5. User scrolls → Feature cards enter with stagger
6. User hovers feature card → Lifts with purple glow
7. User hovers icon → Icon scales up

### Scenario 2: Transfer Flow
1. User navigates to `/transfer`
2. Drop zone appears
3. User drags file → Drop zone pulses purple
4. User drops → File preview appears
5. Devices scan → Spinner rotates
6. User hovers device → Card glows and lifts
7. User clicks → Tab activates with bounce
8. Transfer starts → Progress bar animates

### Scenario 3: Reduced Motion
1. User enables "Reduce Motion" in OS
2. All transform animations disabled
3. All keyframe loops disabled
4. Opacity transitions remain
5. Page remains fully functional
6. Focus states remain clear

---

## 🧪 Testing Each Animation

### Manual Testing Checklist

**Hero Section**:
- [ ] "Quantum-safe" text shimmers smoothly
- [ ] Background gradient moves organically
- [ ] Badge dot pulses softly
- [ ] Stats fade in with stagger

**Feature Cards**:
- [ ] Cards lift on hover (-4px)
- [ ] Purple border glows on hover
- [ ] Icons scale 1.1x on hover
- [ ] Cards enter with stagger on scroll

**Device Cards**:
- [ ] Cards lift and scale on hover
- [ ] Purple glow pulses while hovering
- [ ] Device icons scale up
- [ ] Send indicator fades in
- [ ] Online dots pulse continuously

**Drop Zone**:
- [ ] Border pulses when dragging file
- [ ] Icon scales on hover
- [ ] Zone scales up when dragging

**Buttons**:
- [ ] Hover shows brightness increase + glow
- [ ] Press shows scale(0.98) effect
- [ ] Loading shows smooth spinner

**Tabs**:
- [ ] Activation has bounce effect
- [ ] Active tab shimmers
- [ ] Icons scale on hover

**Accessibility**:
- [ ] Enable "Reduce Motion" → All animations stop
- [ ] Keyboard navigation works
- [ ] Focus states visible

---

## 🎨 Design Tokens Used

```css
/* Colors */
--accent: #5E5CE6                    /* Primary purple */
--accent-hover: #4C4AD1              /* Darker purple */
--accent-light: #9A9AFF              /* Light purple */

/* Durations */
--duration-200: 200ms                /* Micro */
--duration-300: 300ms                /* Standard */
--duration-500: 500ms                /* Entrance */

/* Easing */
--ease-smooth: cubic-bezier(0.16, 1, 0.3, 1)  /* Premium feel */

/* Shadows */
--shadow-glow-sm: 0 0 10px rgba(94, 92, 230, 0.3)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3)
```

---

This visual guide provides a complete reference for understanding and testing all animations in the Tallow application.
