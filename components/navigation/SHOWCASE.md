# Navigation Components - Visual Showcase

Complete visual reference for all navigation components in Tallow.

---

## 1. Tabs Component

### Default Variant
```
┌─────────────────────────────────────────────────┐
│ [Overview] [Settings] [Advanced] [Disabled]     │
│  ────────                                        │ ← Animated indicator
└─────────────────────────────────────────────────┘
│                                                  │
│  Overview Content Here                           │
│                                                  │
└──────────────────────────────────────────────────┘
```

### Pills Variant
```
┌──────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────┐ │
│ │ Overview │ │ Settings │ │ Advanced │ │ [X]  │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────┘ │
│    (black)     (zinc-900)   (zinc-900)  disabled │
└──────────────────────────────────────────────────┘
```

**States:**
- Active: White background, black text
- Inactive: Transparent, zinc-400 text
- Hover: zinc-200 text
- Disabled: 50% opacity

---

## 2. Breadcrumb Component

### Standard Layout
```
Home  ›  Projects  ›  Tallow  ›  Components  ›  Navigation
[🏠]                                          (current page)
```

### Truncated (maxItems=4)
```
Home  ›  ...  ›  Components  ›  Navigation
[🏠]                          (current page)
```

**Visual Details:**
- Links: zinc-400, hover to white
- Separator: zinc-600 chevron
- Current: white text, no link
- Icon: Optional home icon

---

## 3. Pagination Component

### Full Featured
```
┌──────────────────────────────────────────────────────────┐
│  Items per page: [10 ▼]                                  │
│  Showing 1 to 10 of 100 items                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  [◄] [1] [2] [3] ... [8] [9] [10] [►]                   │
│       ───                                                 │
│     (active)                                              │
└──────────────────────────────────────────────────────────┘
```

### Simple
```
[◄] [1] [2] [3] [4] [5] [►]
     ───
   (active)
```

**Page Number States:**
- Active: White background, black text
- Inactive: zinc-400, hover to white
- Disabled: 50% opacity (prev/next)

---

## 4. Sidebar Component

### Expanded
```
┌─────────────────────────┐
│  Menu              [≪]  │ ← Collapse toggle
├─────────────────────────┤
│                         │
│  [🏠] Dashboard    (3)  │ ← Badge
│    ▸ Overview           │
│    ▸ Analytics   [New]  │
│    ▸ Reports            │
│                         │
│  [⚙] Settings           │
│    ▼ General            │ ← Expanded
│    ▸ Security           │
│    ▸ Notifications      │
│                         │
│  [❓] Help               │
│                         │
└─────────────────────────┘
 w: 256px (16rem)
```

### Collapsed
```
┌────┐
│[≫] │
├────┤
│[🏠]│
│[⚙]│
│[❓]│
└────┘
 64px
```

**States:**
- Active: White background, black text
- Inactive: zinc-400 text
- Hover: zinc-900 background, white text
- Nested: 24px left margin (ml-6)

---

## 5. Dropdown Component

### Closed
```
┌──────────┐
│  Menu  ▼ │ ← Trigger
└──────────┘
```

### Open
```
┌──────────┐
│  Menu  ▼ │
└──────────┘
┌─────────────────────────┐
│ [✏] Edit                │
│ [📋] Duplicate          │
│ ─────────────────────── │ ← Divider
│ [🗑] Delete (red)       │
│ [X] Disabled (50%)      │
└─────────────────────────┘
  └─ zinc-900 bg
  └─ zinc-800 border
  └─ hover: zinc-800
```

**Menu States:**
- Normal: zinc-300 text
- Hover/Focus: zinc-800 background
- Danger: red-400 text
- Disabled: 50% opacity

---

## 6. CommandPalette Component

### Modal Overlay
```
╔════════════════════════════════════════════════════╗
║  [🔍] Type a command or search...           [ESC]  ║
╠════════════════════════════════════════════════════╣
║                                                     ║
║  RECENT                                            ║
║  [✏] New File                          [⌘] [N]    ║ ← Selected (zinc-800 bg)
║  [🔍] Search                            [⌘] [F]    ║
║                                                     ║
║  FILE                                              ║
║  [📂] Open                              [⌘] [O]    ║
║                                                     ║
║  NAVIGATION                                        ║
║  [⚙] Settings                           [⌘] [,]    ║
║                                                     ║
╠════════════════════════════════════════════════════╣
║  [↑][↓] to navigate  [↵] to select    4 commands  ║
╚════════════════════════════════════════════════════╝
     max-w-2xl, top-[20%], centered
```

**Visual Effects:**
- Backdrop: black/80 + backdrop-blur
- Modal: zinc-900 bg, zinc-800 border
- Animation: Fade in + slide down (200ms)
- Selected: zinc-800 background

---

## 7. Stepper Component

### Horizontal
```
┌─────────┐           ┌─────────┐           ┌─────────┐           ┌─────────┐
│  [✓]    │───────────│  [2]    │───────────│  [ 3 ]  │───────────│  [ 4 ]  │
│         │  (white)  │         │  (white)  │         │  (zinc)   │         │
│ Account │           │ Profile │           │Verify   │           │  Done   │
│  done   │           │ active  │           │upcoming │           │upcoming │
└─────────┘           └─────────┘           └─────────┘           └─────────┘
  (white)                (white)              (zinc-500)          (zinc-500)
                      ring-4 ring-white/20
```

### Vertical
```
┌────────────────────────┐
│  [✓] Account           │ ← Completed (white bg)
│  │   Create your...    │
│  │                     │
│  [2] Profile           │ ← Active (white bg + ring)
│  │   Complete your...  │
│  │                     │
│  [ 3 ] Verify          │ ← Upcoming (zinc-900 bg)
│  │   Verify your...    │
│  │                     │
│  [ 4 ] Done            │ ← Upcoming
│      Start using...    │
└────────────────────────┘
```

**Step States:**
- Completed: White circle, checkmark, white text
- Active: White circle, number, white text, pulse ring
- Upcoming: zinc-900 circle, zinc-500 text, border

**Connection Lines:**
- Completed/Active: White
- Upcoming: zinc-800

---

## Color Palette Reference

```
Background Colors:
  bg-black           #000000  ■
  bg-zinc-900        #18181b  ■
  bg-zinc-800        #27272a  ■

Text Colors:
  text-white         #ffffff  □
  text-zinc-200      #e4e4e7  □
  text-zinc-400      #a1a1aa  ■
  text-zinc-500      #71717a  ■
  text-zinc-600      #52525b  ■

Border Colors:
  border-zinc-800    #27272a  ─
  border-zinc-700    #3f3f46  ─

Accent Colors:
  Active State:      White bg, black text
  Hover State:       zinc-900 bg, white text
  Focus Ring:        ring-white ring-2
```

---

## Animation Patterns

### Transitions
```css
duration-150  /* Fast interactions (hover, click) */
duration-200  /* Default transitions */
duration-300  /* Slower, emphasized transitions */

ease-out      /* Natural deceleration */
ease-in-out   /* Smooth bidirectional */
```

### Transform Animations
```css
/* Tabs indicator slide */
transform: translateX(${offset}px)
transition: all 300ms ease-out

/* Dropdown fade in */
animation: fadeIn 150ms ease-out
opacity: 0 → 1
transform: translateY(-8px) → translateY(0)

/* CommandPalette entrance */
animation: commandPaletteIn 200ms ease-out
opacity: 0 → 1
transform: translate(-50%, -10px) → translate(-50%, 0)
```

---

## Responsive Behavior

### Breakpoints
```
Mobile:   320px - 767px
Tablet:   768px - 1023px
Desktop:  1024px+
```

### Adaptations

**Tabs:**
- Mobile: Scrollable if needed
- Desktop: Full width

**Breadcrumb:**
- Mobile: Truncate labels
- Desktop: Full labels

**Pagination:**
- Mobile: Hide "Items per page" on small screens
- Desktop: Show all controls

**Sidebar:**
- Mobile: Overlay mode
- Desktop: Fixed sidebar

**Dropdown:**
- Mobile: Full-width on small screens
- Desktop: Min-width 200px

**CommandPalette:**
- Mobile: Full screen (max-w-full)
- Desktop: max-w-2xl, centered

**Stepper:**
- Mobile: Vertical layout recommended
- Desktop: Horizontal or vertical

---

## Touch Targets

All interactive elements meet minimum touch target size:

```
Minimum Size:    44x44px (WCAG AAA)
Implemented:     48x48px (buttons)
                 40x40px (tabs, pagination numbers)
                 44px height (dropdown items)
```

---

## Focus Indicators

All components show clear focus indicators:

```css
focus:outline-none
focus-visible:ring-2
focus-visible:ring-white
focus-visible:ring-offset-2
focus-visible:ring-offset-black
```

Visual: 2px white ring with 2px black offset

---

## Dark Theme Consistency

All components maintain consistent dark theme:

✅ Black backgrounds
✅ Zinc-900 surfaces
✅ Zinc-800 borders
✅ White for primary text
✅ Zinc-400 for secondary text
✅ White on black for active states
✅ Smooth transitions
✅ No jarring color changes

---

## Layout Examples

### Header with Tabs and Breadcrumb
```
┌──────────────────────────────────────────┐
│ Home › Projects › Tallow                 │
├──────────────────────────────────────────┤
│ [Overview] [Settings] [Advanced]         │
│  ────────                                 │
└──────────────────────────────────────────┘
```

### Sidebar with Content
```
┌──────┬─────────────────────────────────┐
│ Menu │ Content Area                    │
│ [🏠] │                                 │
│ [⚙] │ [← Breadcrumb here]             │
│ [❓] │                                 │
│      │ Main content...                 │
│      │                                 │
│      │ [← Pagination at bottom]        │
└──────┴─────────────────────────────────┘
```

### Multi-step Form with Stepper
```
┌─────────────────────────────────────────┐
│  [1]────[2]────[ 3 ]────[ 4 ]           │
│ Account Profile Verify  Done            │
├─────────────────────────────────────────┤
│                                         │
│  Form content for current step          │
│                                         │
│                                         │
│           [Back]  [Next →]              │
└─────────────────────────────────────────┘
```

---

This showcase provides visual reference for implementing and styling navigation components in Tallow.
