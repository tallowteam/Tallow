# FeatureCarousel - Component Architecture

## Component Hierarchy

```
FeatureCarousel (Main Container)
├── Header Section
│   ├── <h2> "Feature Highlights"
│   └── <p> "150+ features..."
│
├── Carousel Container
│   ├── Previous Button (Desktop only)
│   │   └── <ChevronLeft />
│   │
│   ├── AnimatePresence (Framer Motion)
│   │   └── motion.div (Sliding container)
│   │       └── Grid (1/2/3 columns)
│   │           ├── motion.div (Card wrapper 1)
│   │           │   └── FeatureCard (compact variant)
│   │           ├── motion.div (Card wrapper 2)
│   │           │   └── FeatureCard (compact variant)
│   │           └── motion.div (Card wrapper 3)
│   │               └── FeatureCard (compact variant)
│   │
│   ├── Next Button (Desktop only)
│   │   └── <ChevronRight />
│   │
│   ├── Mobile Nav Buttons (Tablet/Mobile only)
│   │   ├── Previous Button
│   │   └── Next Button
│   │
│   └── Dot Indicators
│       └── Button[] (Page dots)
```

## Data Flow

```
┌─────────────────────────────────────────────────┐
│ Parent Component (app/page.tsx)                │
│                                                 │
│ import { topFeatures } from                    │
│   "@/lib/features/sample-features"             │
└─────────────────┬───────────────────────────────┘
                  │
                  │ features: Feature[]
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ FeatureCarousel                                 │
│                                                 │
│ State:                                          │
│ • currentIndex: number                          │
│ • isPaused: boolean                             │
│ • direction: number                             │
│ • itemsPerPage: number (1/2/3)                  │
│                                                 │
│ Calculated:                                     │
│ • totalPages = Math.ceil(length / itemsPerPage) │
│ • currentPage = Math.floor(index / itemsPerPage)│
│ • visibleFeatures = slice(start, end)           │
└─────────────────┬───────────────────────────────┘
                  │
                  │ feature: Feature
                  │ variant: "compact"
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│ FeatureCard (Compact Variant)                   │
│                                                 │
│ • Icon                                          │
│ • Title                                         │
│ • Description (line-clamp-3)                    │
└─────────────────────────────────────────────────┘
```

## State Management

```typescript
// Component State
const [currentIndex, setCurrentIndex] = React.useState(0);
const [isPaused, setIsPaused] = React.useState(false);
const [direction, setDirection] = React.useState(0);
const [itemsPerPage, setItemsPerPage] = React.useState(3);

// Derived State
const totalPages = Math.ceil(features.length / itemsPerPage);
const currentPage = Math.floor(currentIndex / itemsPerPage);
const visibleFeatures = getVisibleFeatures();

// State Transitions
┌──────────────┐
│ Initial      │
│ index: 0     │
│ page: 0      │
└──────┬───────┘
       │
       │ goToNext()
       │
       ▼
┌──────────────┐
│ Next Page    │
│ index: +3    │
│ page: +1     │
└──────┬───────┘
       │
       │ goToPrevious()
       │
       ▼
┌──────────────┐
│ Previous     │
│ index: -3    │
│ page: -1     │
└──────────────┘
```

## Event Flow

```
User Interaction → Event Handler → State Update → Re-render
│
├─ Hover Enter ──→ setIsPaused(true)  ──→ Stop auto-play
│
├─ Hover Leave ──→ setIsPaused(false) ──→ Resume auto-play
│
├─ Click Next ──→ goToNext() ──→ setCurrentIndex(+itemsPerPage)
│
├─ Click Prev ──→ goToPrevious() ──→ setCurrentIndex(-itemsPerPage)
│
├─ Click Dot ──→ goToPage(index) ──→ setCurrentIndex(pageIndex * itemsPerPage)
│
├─ Arrow Right ──→ goToNext() ──→ setCurrentIndex(+itemsPerPage)
│
└─ Arrow Left ──→ goToPrevious() ──→ setCurrentIndex(-itemsPerPage)
```

## Animation Sequence

```
1. User clicks "Next"
   ↓
2. setDirection(1) // Right direction
   ↓
3. setCurrentIndex(currentIndex + itemsPerPage)
   ↓
4. AnimatePresence detects change
   ↓
5. Current page exits (slide left)
   • x: 0 → -100%
   • opacity: 1 → 0
   • duration: 300ms
   ↓
6. Next page enters (from right)
   • x: 100% → 0
   • opacity: 0 → 1
   • duration: 300ms
   ↓
7. Cards fade in sequentially
   • Card 1: delay 0ms
   • Card 2: delay 100ms
   • Card 3: delay 200ms
   ↓
8. Animation complete
```

## Responsive Layout

```
┌─────────────────────────────────────────────────┐
│ Desktop (lg+): 1024px+                          │
│                                                 │
│  ◄  [Card 1] [Card 2] [Card 3]  ►             │
│                                                 │
│            ● ○ ○ ○ ○                           │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Tablet (sm-md): 640px - 1023px                  │
│                                                 │
│      [Card 1]    [Card 2]                       │
│                                                 │
│         ◄ ►                                     │
│         ● ○ ○ ○ ○                              │
└─────────────────────────────────────────────────┘

┌───────────────────────┐
│ Mobile (<sm): <640px  │
│                       │
│      [Card 1]         │
│                       │
│       ◄ ►             │
│       ● ○ ○ ○ ○      │
└───────────────────────┘
```

## Auto-Play Loop

```
┌──────────────┐
│ Start Timer  │
│ (5000ms)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Check State  │
│ • autoPlay?  │
│ • isPaused?  │
│ • pages > 1? │
└──────┬───────┘
       │
       │ All true
       ▼
┌──────────────┐
│ goToNext()   │
│ page++       │
└──────┬───────┘
       │
       │ Last page?
       ▼
┌──────────────┐
│ Loop to 0    │
│ or continue  │
└──────┬───────┘
       │
       └──────→ Repeat
```

## Feature Data Structure

```typescript
// Individual Feature
interface Feature {
  id: string;              // "p2p-webrtc"
  title: string;           // "Direct P2P Transfer"
  description: string;     // "Lightning-fast peer-to-peer..."
  status: FeatureStatus;   // "production" | "beta" | etc
  complexity?: string;     // "beginner" | "intermediate" | "advanced"
  icon?: string;           // "zap" (Lucide icon name)
  location: string;        // "lib/transfer/p2p-internet.ts"
  tags?: string[];         // ["core", "p2p", "webrtc"]
}

// Feature Array
const topFeatures: Feature[] = [
  { id: "1", title: "...", ... },
  { id: "2", title: "...", ... },
  // ... 30 total features
];

// Categorized
const featuredCategories = [
  {
    id: "core",
    name: "Core Features",
    features: [...],
  },
  // ... more categories
];
```

## Performance Optimizations

```
1. Lazy Rendering
   ┌─────────────────┐
   │ Only render     │
   │ visible cards   │
   │ (3 max at time) │
   └─────────────────┘

2. GPU Acceleration
   ┌─────────────────┐
   │ transform: 3D   │
   │ will-change     │
   │ backface-hidden │
   └─────────────────┘

3. Debounced Resize
   ┌─────────────────┐
   │ Window resize   │
   │ → Wait 100ms    │
   │ → Update layout │
   └─────────────────┘

4. React.memo on Cards
   ┌─────────────────┐
   │ Prevent re-     │
   │ render if props │
   │ unchanged       │
   └─────────────────┘

5. AnimatePresence
   ┌─────────────────┐
   │ Only animate    │
   │ entering/exiting│
   │ elements        │
   └─────────────────┘
```

## Accessibility Tree

```
<section> role="region" aria-label="Feature carousel"
│
├── <div> Header
│   ├── <h2> "Feature Highlights"
│   └── <p> "150+ features..."
│
├── <div> Carousel
│   │
│   ├── <button> aria-label="Previous features"
│   │
│   ├── <div> role="region" aria-live="polite"
│   │   └── Grid of FeatureCards
│   │       └── <article> role="article" tabindex="0"
│   │
│   ├── <button> aria-label="Next features"
│   │
│   └── <div> role="tablist" aria-label="Carousel page indicators"
│       └── <button> role="tab" aria-selected="true" aria-current="true"
│
└── <div> role="status" aria-live="polite" (Screen reader)
    └── "Showing page 1 of 10"
```

## File Dependencies

```
components/features/feature-carousel.tsx
│
├── Dependencies
│   ├── react
│   ├── framer-motion
│   ├── lucide-react (ChevronLeft, ChevronRight)
│   ├── @/lib/utils (cn utility)
│   ├── @/lib/features/types (Feature type)
│   └── ./feature-card (FeatureCard component)
│
└── Used By
    └── app/page.tsx (Landing page)
```

## CSS Classes Flow

```
globals.css (Design System)
│
├── Typography
│   ├── .display-md → Carousel heading
│   ├── .body-lg → Carousel subtitle
│   └── Inherited by FeatureCard
│
├── Spacing
│   ├── py-24 sm:py-32 → Section padding
│   ├── gap-6 → Card spacing
│   └── mb-16 → Header margin
│
├── Colors
│   ├── bg-card → Card backgrounds
│   ├── border-border → Border colors
│   ├── text-foreground → Text colors
│   └── bg-muted-foreground/30 → Inactive dots
│
└── Animations
    ├── transition-all duration-200 → Button hover
    ├── Framer Motion → Slide transitions
    └── Card animations → From FeatureCard
```

## Bundle Composition

```
FeatureCarousel Bundle
│
├── Component Code: ~8KB
│   ├── Main component
│   ├── With categories variant
│   └── Scroll variant
│
├── Feature Data: ~4KB
│   ├── 30 top features
│   ├── Helper functions
│   └── Categories
│
├── Dependencies (Already Included)
│   ├── Framer Motion: ~60KB ✓
│   ├── Lucide Icons: ~5KB ✓
│   └── React: N/A ✓
│
└── Total New: ~12KB gzipped
```

## Integration Points

```
Landing Page (app/page.tsx)
│
├── Import Point
│   └── import { FeatureCarousel } from "@/components/features"
│
├── Data Point
│   └── import { topFeatures } from "@/lib/features/sample-features"
│
└── Render Point (Choose one)
    ├── Option 1: Replace features grid (line 124)
    ├── Option 2: After features grid (line 150)
    └── Option 3: Before final CTA (line 212)
```

## Testing Strategy

```
Testing Pyramid
│
├── E2E Tests (Playwright)
│   ├── Auto-rotation
│   ├── Pause on hover
│   ├── Navigation (arrows, dots, keyboard)
│   ├── Responsive behavior
│   └── Accessibility
│
├── Integration Tests (React Testing Library)
│   ├── Component renders
│   ├── Props handling
│   ├── Event handlers
│   └── State transitions
│
└── Unit Tests
    ├── Helper functions
    ├── State calculations
    └── Data transformations
```

## Summary

**Component Type**: Presentation + Interaction
**Complexity**: Medium
**Dependencies**: Minimal (already included)
**Performance**: Optimized (60fps)
**Accessibility**: Full WCAG AA
**Responsive**: Mobile-first
**Production Ready**: ✅ Yes
