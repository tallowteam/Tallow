# Animation System Files Reference

## Directory Structure

```
C:\Users\aamir\Documents\Apps\Tallow\
│
├── lib/
│   ├── animations/
│   │   ├── motion-config.ts              # Core animation variants and configuration
│   │   ├── animated-components.tsx       # Reusable animated component wrappers
│   │   ├── page-transition.tsx           # Page-level transition components
│   │   └── index.ts                      # Central export hub
│   │
│   └── hooks/
│       └── use-reduced-motion.ts         # Hook for accessibility preferences
│
├── components/
│   ├── ui/
│   │   ├── skeleton.tsx                  # Complete skeleton loading system
│   │   ├── button-animated.tsx           # Enhanced button with animations
│   │   └── index.ts                      # UI components export hub
│   │
│   ├── devices/
│   │   └── device-list-animated.tsx      # Animated device list component
│   │
│   ├── transfer/
│   │   ├── transfer-card-animated.tsx    # Animated transfer card
│   │   └── transfer-queue-animated.tsx   # Animated transfer queue
│   │
│   └── examples/
│       └── animation-showcase.tsx        # Live demonstration component
│
└── Documentation/
    ├── ANIMATIONS.md                     # Complete API documentation
    ├── ANIMATION_INTEGRATION_GUIDE.md    # Step-by-step integration
    ├── ANIMATIONS_IMPLEMENTATION_SUMMARY.md  # Implementation summary
    ├── ANIMATION_QUICK_REFERENCE.md      # Quick reference guide
    ├── IMPLEMENTATION_CHECKLIST.md       # Integration checklist
    └── ANIMATION_FILES_REFERENCE.md      # This file
```

## File Descriptions

### Core Animation System

#### `lib/animations/motion-config.ts`
**Purpose**: Central configuration for all animations
**Size**: ~350 lines
**Exports**:
- Animation variants (fade, scale, slide, etc.)
- Easing curves
- Transition configurations
- Utility functions

**Key Features**:
- 15+ pre-configured animation variants
- Reduced motion support
- GPU-optimized transitions
- Stagger animations
- Custom variant creator

**Usage**:
```typescript
import { fadeUpVariants, springTransition } from '@/lib/animations/motion-config';
```

---

#### `lib/animations/animated-components.tsx`
**Purpose**: Reusable animated component wrappers
**Size**: ~450 lines
**Exports**:
- `AnimatedContainer` - Flexible animated wrapper
- `AnimatedList` / `AnimatedListItem` - List animations
- `AnimatedCard` - Card with hover effects
- `AnimatedModal` - Modal with transitions
- `AnimatedCollapse` - Collapsible content
- `AnimatedBadge` - Badge with pop animation
- `PageTransition` - Page-level wrapper
- `RippleEffect` - Click ripple effect
- `AnimatedNumber` - Number counter
- `AnimatedLayout` - Layout transitions

**Usage**:
```typescript
import { AnimatedContainer, AnimatedList } from '@/lib/animations';
```

---

#### `lib/animations/page-transition.tsx`
**Purpose**: Page-level transition components
**Size**: ~60 lines
**Exports**:
- `PageTransition` - Smooth page transitions
- `LayoutTransition` - Layout change animations

**Usage**:
```typescript
import { PageTransition } from '@/lib/animations/page-transition';
```

---

#### `lib/animations/index.ts`
**Purpose**: Central export hub for animation system
**Size**: ~20 lines
**Exports**: All animation utilities and components

**Usage**:
```typescript
import {
  AnimatedContainer,
  fadeUpVariants,
  useReducedMotion
} from '@/lib/animations';
```

---

### Hooks

#### `lib/hooks/use-reduced-motion.ts`
**Purpose**: Detect and respect reduced motion preferences
**Size**: ~70 lines
**Exports**:
- `useReducedMotion()` - Returns boolean preference
- `useAnimationDuration()` - Returns adjusted duration
- `useShouldAnimate()` - Returns if should animate

**Usage**:
```typescript
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
const prefersReducedMotion = useReducedMotion();
```

---

### UI Components

#### `components/ui/skeleton.tsx`
**Purpose**: Complete skeleton loading system
**Size**: ~400 lines
**Exports**:
- `Skeleton` - Base skeleton component
- `SkeletonText` - Text placeholder
- `SkeletonAvatar` - Avatar placeholder
- `SkeletonButton` - Button placeholder
- `SkeletonCard` - Card placeholder
- `DeviceListSkeleton` - Device list loading
- `TransferCardSkeleton` - Transfer card loading
- `FileListSkeleton` - File list loading
- `SettingsSkeleton` - Settings loading
- `TransferProgressSkeleton` - Progress loading
- `GridSkeleton` - Grid layout loading

**Features**:
- Shimmer animation
- Pulse animation
- Multiple variants
- Customizable dimensions
- Reduced motion support

**Usage**:
```typescript
import { DeviceListSkeleton, SkeletonText } from '@/components/ui/skeleton';
```

---

#### `components/ui/button-animated.tsx`
**Purpose**: Enhanced button with micro-interactions
**Size**: ~180 lines
**Exports**:
- `ButtonAnimated` - Button with animations
- `IconButtonAnimated` - Icon button variant
- `ButtonGroup` - Staggered button group

**Features**:
- Ripple effect on click
- Hover/tap animations
- Pulse animation option
- All standard button variants

**Usage**:
```typescript
import { ButtonAnimated } from '@/components/ui/button-animated';
<ButtonAnimated ripple pulse>Click Me</ButtonAnimated>
```

---

### Enhanced Components

#### `components/devices/device-list-animated.tsx`
**Purpose**: Animated version of device list
**Size**: ~350 lines
**Features**:
- Stagger animations for device cards
- Smooth loading states
- Animated search
- QR code transitions
- Copy button animation
- Empty state animation

**Usage**:
```typescript
import { DeviceListAnimated } from '@/components/devices/device-list-animated';
<DeviceListAnimated devices={devices} isLoading={loading} />
```

---

#### `components/transfer/transfer-card-animated.tsx`
**Purpose**: Animated transfer card
**Size**: ~280 lines
**Features**:
- Progress bar shimmer
- Status badge transitions
- Animated icons
- Hover effects
- Speed/ETA animations

**Usage**:
```typescript
import { TransferCardAnimated } from '@/components/transfer/transfer-card-animated';
<TransferCardAnimated transfer={transfer} onPause={handlePause} />
```

---

#### `components/transfer/transfer-queue-animated.tsx`
**Purpose**: Animated transfer queue
**Size**: ~250 lines
**Features**:
- Stagger list animations
- Stats bar animations
- Smooth add/remove
- Empty state animation
- Loading states

**Usage**:
```typescript
import { TransferQueueAnimated } from '@/components/transfer/transfer-queue-animated';
<TransferQueueAnimated transfers={transfers} isLoading={loading} />
```

---

### Examples

#### `components/examples/animation-showcase.tsx`
**Purpose**: Live demonstration of all animations
**Size**: ~400 lines
**Features**:
- Interactive examples
- All animation variants
- Skeleton demos
- Accessibility showcase
- Performance notes

**Usage**:
```typescript
import { AnimationShowcase } from '@/components/examples/animation-showcase';
// Use in a test page or storybook
```

---

## Documentation Files

### `ANIMATIONS.md`
**Size**: ~500 lines
**Content**:
- Complete API reference
- All animation variants
- Component documentation
- Usage examples
- Best practices
- Performance tips
- Troubleshooting

---

### `ANIMATION_INTEGRATION_GUIDE.md`
**Size**: ~350 lines
**Content**:
- Step-by-step integration
- Migration map
- Code examples
- Testing checklist
- Rollback plan

---

### `ANIMATIONS_IMPLEMENTATION_SUMMARY.md`
**Size**: ~400 lines
**Content**:
- Implementation overview
- Features delivered
- Statistics
- File breakdown
- Testing recommendations

---

### `ANIMATION_QUICK_REFERENCE.md`
**Size**: ~200 lines
**Content**:
- Quick import reference
- Common patterns
- Props reference
- Performance tips
- File locations

---

### `IMPLEMENTATION_CHECKLIST.md`
**Size**: ~250 lines
**Content**:
- Pre-integration verification
- Step-by-step checklist
- Testing criteria
- Sign-off template

---

## Import Paths Quick Reference

```typescript
// Animation system
import { ... } from '@/lib/animations';
import { ... } from '@/lib/animations/motion-config';
import { ... } from '@/lib/animations/animated-components';

// Hooks
import { ... } from '@/lib/hooks/use-reduced-motion';

// UI Components
import { ... } from '@/components/ui/skeleton';
import { ... } from '@/components/ui/button-animated';

// Enhanced Components
import { ... } from '@/components/devices/device-list-animated';
import { ... } from '@/components/transfer/transfer-card-animated';
import { ... } from '@/components/transfer/transfer-queue-animated';
```

## Lines of Code Summary

| Category | Files | Lines |
|----------|-------|-------|
| Animation Core | 4 | ~900 |
| Hooks | 1 | ~70 |
| UI Components | 2 | ~580 |
| Enhanced Components | 3 | ~880 |
| Examples | 1 | ~400 |
| Documentation | 5 | ~1,700 |
| **Total** | **16** | **~4,530** |

## Dependencies

```json
{
  "framer-motion": "^12.26.2",  // Already installed
  "react": "^19.2.3",           // Already installed
  "react-dom": "^19.2.3"        // Already installed
}
```

No additional dependencies required!

## Next Steps

1. Review quick reference: `ANIMATION_QUICK_REFERENCE.md`
2. Follow integration guide: `ANIMATION_INTEGRATION_GUIDE.md`
3. Use checklist: `IMPLEMENTATION_CHECKLIST.md`
4. Test with showcase: `components/examples/animation-showcase.tsx`

## Support

For questions or issues:
- Check documentation in this directory
- Review code examples in `components/examples/`
- Reference Framer Motion docs: https://www.framer.com/motion/
