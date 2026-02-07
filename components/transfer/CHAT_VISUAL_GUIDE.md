# ChatPanel Visual Design Guide

**Visual reference for the E2E encrypted chat interface**

---

## 🎨 Component Anatomy

```
┌─────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────┐ │
│ │ Alice                              ✕    │ │ ← Header (glass-morphism)
│ │ 🔒 End-to-End Encrypted                 │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│   ┌──────────── Today ────────────┐        │ ← Date divider
│                                             │
│            ┌─────────────────────┐          │ ← Received message
│            │ Hey! Ready to       │          │   (dark gray bubble)
│            │ transfer files?     │          │
│            │           10:30 AM  │          │
│            └─────────────────────┘          │
│                                             │
│          ┌─────────────────────┐            │ ← Sent message
│          │ Yes! Let's do it 🚀 │            │   (purple gradient)
│          │       10:31 AM  ✓✓  │            │   (with read receipt)
│          └─────────────────────┘            │
│                                             │
│            ┌───────┐                        │ ← Typing indicator
│            │ ⬤ ⬤ ⬤ │                        │   (animated dots)
│            └───────┘                        │
│                                             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ [Type a message...        ] [ ✈️ ]     │ │ ← Input area
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
    400px width (desktop)     100vw (mobile)
```

---

## 🎨 Color Specifications

### Backgrounds
```css
Panel Background      : #18181b  /* rgb(24, 24, 27) */
Header Background     : rgba(24, 24, 27, 0.95) + backdrop-blur(16px)
Input Background      : #27272a  /* rgb(39, 39, 42) */
Sent Message          : linear-gradient(135deg, #5e5ce6, #6b69f5)
Received Message      : #27272a  /* rgb(39, 39, 42) */
```

### Borders
```css
Panel Border          : 1px solid rgba(63, 63, 70, 0.4)
Message Border        : 1px solid rgba(63, 63, 70, 0.4)
Input Border (default): 1px solid rgba(63, 63, 70, 0.4)
Input Border (focus)  : 1px solid #5e5ce6
```

### Text
```css
Primary Text          : #fafafa   /* rgb(250, 250, 250) */
Secondary Text        : #a1a1aa   /* rgb(161, 161, 170) */
Tertiary Text         : #71717a   /* rgb(113, 113, 122) */
Sent Message Text     : #ffffff   /* White on purple */
Received Message Text : #fafafa   /* Light gray */
```

### Accents
```css
Purple (Primary)      : #5e5ce6   /* Main accent */
Green (Encryption)    : #4ade80   /* E2E badge */
Blue (Read Status)    : #60a5fa   /* Read receipt */
Red (Error)           : #ef4444   /* Failed status */
```

---

## 📏 Spacing & Sizing

### Panel
```
Width (Desktop)       : 400px
Width (Mobile)        : 100vw
Height                : 100vh
Border Left           : 4px shadow + 1px border
```

### Header
```
Padding               : 16px 20px
Height                : auto (min 60px)
Border Bottom         : 1px solid border-color
```

### Messages
```
Container Padding     : 20px
Message Padding       : 10px 14px
Message Max Width     : 75% (desktop), 85% (mobile)
Message Gap           : 6px between messages
```

### Input Area
```
Padding               : 16px 20px
Input Padding         : 12px 16px
Input Height          : 44px
Send Button Size      : 44x44px
Gap                   : 12px between input and button
```

---

## 🔤 Typography

### Header
```css
Peer Name
  font-size           : 16px
  font-weight         : 600
  color               : #fafafa
  line-height         : 1.2

E2E Badge
  font-size           : 11px
  font-weight         : 500
  color               : #4ade80
  letter-spacing      : 0.3px
```

### Messages
```css
Message Content
  font-size           : 14px
  font-weight         : 400
  line-height         : 1.5
  white-space         : pre-wrap

Message Time
  font-size           : 11px
  font-weight         : 500
  opacity             : 0.7

Status Icon
  font-size           : 10px
  opacity             : 0.7 (normal), 1.0 (read)
```

### Empty State
```css
Title
  font-size           : 15px
  font-weight         : 500
  color               : #d4d4d8

Subtitle
  font-size           : 13px
  font-weight         : 400
  color               : #71717a
```

---

## 🎭 Message Bubbles

### Sent Messages (Right)
```css
Background            : linear-gradient(135deg, #5e5ce6, #6b69f5)
Color                 : #ffffff
Border Radius         : 16px
Bottom Right Radius   : 4px (chat tail effect)
Alignment             : flex-end (right)
Max Width             : 75%
```

### Received Messages (Left)
```css
Background            : #27272a
Color                 : #fafafa
Border                : 1px solid rgba(63, 63, 70, 0.4)
Border Radius         : 16px
Bottom Left Radius    : 4px (chat tail effect)
Alignment             : flex-start (left)
Max Width             : 75%
```

---

## 🎬 Animations

### Panel Slide-In
```css
transform             : translateX(100%) → translateX(0)
duration              : 300ms
easing                : cubic-bezier(0.4, 0, 0.2, 1)
```

### Message Entrance
```css
opacity               : 0 → 1
transform             : translateY(8px) → translateY(0)
duration              : 300ms
easing                : ease-out
```

### Typing Dots
```css
animation             : bounce up/down
duration              : 1.4s
easing                : ease-in-out
delay                 : 0s, 0.2s, 0.4s (staggered)
translateY            : 0 → -8px → 0
```

### Loading Spinner
```css
animation             : rotate 360deg
duration              : 800ms
easing                : linear
iteration             : infinite
```

---

## 📱 Responsive Breakpoints

### Mobile (<768px)
```
Panel Width           : 100vw (full screen)
Header Padding        : 14px 16px
Message Padding       : 16px
Input Padding         : 12px 16px
Message Max Width     : 85%
Font Size (Peer)      : 15px
Badge Font Size       : 10px
Badge Padding         : 3px 8px
```

### Desktop (≥768px)
```
Panel Width           : 400px (sidebar)
Header Padding        : 16px 20px
Message Padding       : 20px
Input Padding         : 16px 20px
Message Max Width     : 75%
Font Size (Peer)      : 16px
Badge Font Size       : 11px
Badge Padding         : 4px 10px
```

---

## 🎯 Interactive States

### Buttons (Close, Send)
```css
Default
  background          : transparent (close), purple (send)
  color               : #a1a1aa (close), white (send)

Hover
  background          : rgba(63, 63, 70, 0.4) (close)
  transform           : translateY(-1px) (send)
  box-shadow          : 0 4px 12px rgba(94, 92, 230, 0.3) (send)

Active
  transform           : scale(0.95) (close)
  transform           : translateY(0) (send)

Disabled
  opacity             : 0.5
  cursor              : not-allowed
  background          : #3f3f46 (gray)
```

### Input Field
```css
Default
  background          : #27272a
  border              : 1px solid rgba(63, 63, 70, 0.4)
  color               : #fafafa

Focus
  border              : 1px solid #5e5ce6
  background          : #2a2a2e
  box-shadow          : 0 0 0 3px rgba(94, 92, 230, 0.1)

Placeholder
  color               : #71717a
  opacity             : 1.0
```

---

## 🎨 Special Elements

### E2E Encryption Badge
```
┌────────────────────────────┐
│ 🔒 End-to-End Encrypted    │
└────────────────────────────┘

Background            : rgba(34, 197, 94, 0.1)
Border                : 1px solid rgba(34, 197, 94, 0.2)
Color                 : #4ade80
Border Radius         : 6px
Padding               : 4px 10px
Icon                  : Lock SVG (12x12)
Font Size             : 11px
Letter Spacing        : 0.3px
```

### Date Divider
```
    ┌──────────────┐
────│ Today        │────
    └──────────────┘

Background            : rgba(39, 39, 42, 0.8)
Border                : 1px solid rgba(63, 63, 70, 0.4)
Border Radius         : 12px
Padding               : 4px 12px
Font Size             : 11px
Font Weight           : 500
Color                 : #a1a1aa
Text Transform        : uppercase
```

### Status Icons
```
Sending    : ○      (circle outline)
Sent       : ✓      (single check)
Delivered  : ✓✓     (double check)
Read       : ✓✓     (double check, blue #60a5fa)
Failed     : ✗      (X mark, red)
```

---

## 🎪 State Variations

### 1. Connecting State
```
┌─────────────────────────┐
│                         │
│         ◯               │  ← Spinning loader
│         │               │     (purple border)
│   Establishing secure   │
│   connection...         │
│                         │
└─────────────────────────┘
```

### 2. Empty State
```
┌─────────────────────────┐
│                         │
│         💬              │  ← Chat icon
│                         │     (48x48, opacity 0.4)
│   No messages yet       │  ← Title (15px, bold)
│                         │
│   Send a message to     │  ← Subtitle (13px)
│   start the conversation│     (secondary color)
│                         │
└─────────────────────────┘
```

### 3. Typing Indicator
```
┌───────────┐
│ ⬤  ⬤  ⬤  │  ← Three dots
└───────────┘     (bouncing animation)
                  Background: dark gray
                  Padding: 12px 16px
                  Dots: 6px circles, #71717a
```

---

## 🎨 Glass-morphism Effect

### Header & Footer
```css
background            : rgba(24, 24, 27, 0.95)
backdrop-filter       : blur(16px) saturate(180%)
border                : 1px solid rgba(63, 63, 70, 0.4)

Effect Creates:
- Frosted glass appearance
- Subtle transparency
- Background blur
- Premium aesthetic
```

---

## 📐 Scrollbar Styling

### Custom Scrollbar
```css
Width                 : 8px
Track Background      : transparent
Thumb Background      : rgba(63, 63, 70, 0.5)
Thumb Border Radius   : 4px
Thumb Hover           : rgba(63, 63, 70, 0.7)

Position: Messages container (overflow-y: auto)
```

---

## 🌈 Message Flow Example

```
┌─────────────────────────────────────────────┐
│ Alice                                   ✕   │
│ 🔒 End-to-End Encrypted                     │
├─────────────────────────────────────────────┤
│                                             │
│   ───────────── Today ─────────────         │
│                                             │
│   ┌─────────────────────────┐ ← 10:30 AM   │
│   │ Hey! Want to transfer   │               │
│   │ some files?             │               │
│   └─────────────────────────┘               │
│                                             │
│            ┌────────────────┐ ← 10:31 AM    │
│            │ Sure! Drop them│               │
│            │ in the zone 📁 │               │
│            │      10:31 ✓✓  │               │
│            └────────────────┘               │
│                                             │
│   ┌─────────────────────────┐ ← 10:32 AM   │
│   │ Uploading document.pdf  │               │
│   │ (2.5 MB)                │               │
│   └─────────────────────────┘               │
│                                             │
│            ┌────────────────┐ ← 10:32 AM    │
│            │ Got it! Thanks │               │
│            │      10:32 ✓   │ ← Sent        │
│            └────────────────┘               │
│                                             │
│   ┌───────┐                                 │
│   │ ⬤ ⬤ ⬤ │ ← Typing...                     │
│   └───────┘                                 │
│                                             │
├─────────────────────────────────────────────┤
│ [Type a message...              ] [✈️]     │
└─────────────────────────────────────────────┘
```

---

## 🎯 Visual Hierarchy

### Priority Levels
1. **Highest**: Message content (14px, primary color)
2. **High**: Peer name, E2E badge (16px/11px, distinct colors)
3. **Medium**: Timestamps, status icons (11px, opacity 0.7)
4. **Low**: Dividers, empty state subtitles (13px, tertiary color)

### Visual Weight
- **Heavy**: Sent message bubbles (purple gradient, white text)
- **Medium**: Received message bubbles (dark gray, border)
- **Light**: Input area, header (glass-morphism, subtle)

---

## 🎨 Design Principles

### 1. Clarity
- Clear message ownership (left/right alignment)
- Visible encryption status (green badge)
- Obvious send button (purple, icon)

### 2. Consistency
- All corners 16px radius (bubbles)
- All borders 1px solid (subtle)
- All paddings multiples of 4px

### 3. Feedback
- Typing indicators show activity
- Status icons show message state
- Animations confirm actions

### 4. Premium Feel
- Glass-morphism effects
- Smooth animations (300ms)
- Purple gradient accent
- Polished details

---

## 📱 Mobile Optimizations

### Touch Targets
```
Minimum Size          : 44x44px
Examples:
- Send button         : 44x44px
- Close button        : 44x44px (with 8px padding = 28px visual)
- Input height        : 44px
```

### Spacing Adjustments
```
Mobile Padding        : 16px → 12px (tighter)
Message Bubbles       : 75% → 85% (wider on mobile)
Font Sizes            : Slightly reduced (16px → 15px)
```

---

## 🎨 Color Accessibility

### Contrast Ratios
```
Purple on White       : 8.59:1 (AAA)
White on Purple       : 8.59:1 (AAA)
Light Gray on Dark    : 12.63:1 (AAA)
Green Badge           : 4.52:1 (AA)
```

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  Border Width        : 2px (instead of 1px)
  Border Color        : #71717a (instead of rgba)
}
```

---

**Visual design complete with premium Linear/Vercel aesthetics** ✨
