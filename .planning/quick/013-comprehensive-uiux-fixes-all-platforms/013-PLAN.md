# Quick Task 013: Comprehensive UI/UX EUVEKA Fixes - All Platforms

## Overview
Fix all UI/UX issues across website, app, and CLI using all 22 tallow-ui-subagents with EXACT EUVEKA styling from https://www.euveka.com/

## EUVEKA Design System Reference (EXACT from euveka.com)

### Colors (EXACT HEX VALUES)
```css
/* Primary Background */
--euveka-dark: #191610;           /* Hero/dark sections */
--euveka-background: #fefefc;     /* Main off-white background */

/* Neutral Palette (light to dark) */
--euveka-neutral-100: #fefdfb;
--euveka-neutral-200: #fcf6ec;
--euveka-neutral-300: #f3ede2;
--euveka-neutral-400: #e5dac7;
--euveka-neutral-500: #d6cec2;
--euveka-neutral-600: #b2987d;
--euveka-neutral-700: #544a36;
--euveka-neutral-800: #2c261c;
--euveka-neutral-900: #242018;

/* Accent Colors */
--euveka-accent-blue: #0099ff;
--euveka-accent-bright: #000dff;
--euveka-error: #ff4f4f;

/* Border Colors */
--euveka-border-light: #e5dac7;
--euveka-border-dark: #544a36;
```

### Typography (EXACT from euveka.com)
```css
/* Font Families */
--font-headline: "PP Eiko", "Cormorant Garamond", Georgia, serif;
--font-body: "Inter", system-ui, sans-serif;

/* Headline Specs */
font-weight: 100-300 (thin/light)
letter-spacing: 0em to -0.03em
line-height: 0.95-1.1em
font-size: clamp(3rem, 10vw, 8rem) for hero

/* Body Text */
font-weight: 400-500
font-size: 16px base
line-height: 1.5-1.6
```

### Spacing System
```css
/* Gap units */
8px, 10px, 16px, 20px, 32px, 40px, 60px, 80px, 120px, 220px

/* Padding */
8px, 20px, 24px, 32px, 40px, 48px

/* Component heights */
Button: 56px-64px
Input: 40px-56px
```

### Component Styles (EXACT)
```css
/* Buttons - PILL SHAPE */
border-radius: 60px;
height: 56px-64px;
padding: 0 32px;
border: 1px solid;
transition: all 0.3s ease;

/* Cards */
border-radius: 24px-32px;
background: #242018 or #191610 or #544a36;
padding: 32px;
gap: 16px-21px;

/* Visual Effects */
filter: blur(84px);  /* For glow orbs */
mix-blend-mode: difference;
```

### Animation (GSAP-style)
```css
/* Easing */
ease: [0.16, 1, 0.3, 1]  /* Custom expo-out */

/* Split text reveal */
clip-path: inset(100% 0% 0% 0%) → inset(0% 0% 0% 0%)

/* Scroll indicator */
"SCROLL TO REVEAL" with animated dot

/* Stagger */
0.05-0.15s between elements
```

### Typography
- **Headlines**: Cormorant Garamond, font-weight: 300, letter-spacing: -0.03em, line-height: 0.95
- **Body**: Inter, font-weight: 400
- **Mono**: JetBrains Mono

### Animation Easing
- Custom ease: `[0.16, 1, 0.3, 1]`
- Stagger: 0.15s between children
- Duration: 0.3s normal, 0.5s slow, 0.8s slower

### UI Patterns
- Buttons: rounded-full, glow shadows
- Cards: subtle borders, glass effects
- Grid pattern backgrounds
- Floating blur orbs decorations

---

## TASK 1: Design System Audit & EUVEKA Token Enforcement
**Agent**: design-system-architect
**Priority**: 🔴 HIGH

### Actions:
1. Audit `lib/design-system/` for EUVEKA token compliance
2. Update `tailwind.config.ts` with EUVEKA colors
3. Update `app/globals.css` CSS variables
4. Ensure all 4 themes follow EUVEKA grayscale pattern
5. Create EUVEKA design tokens file if missing

### Files:
- `tailwind.config.ts`
- `app/globals.css`
- `lib/design-system/tokens/`

---

## TASK 2: React Component EUVEKA Styling Audit
**Agent**: react-component-expert + tailwind-css-master
**Priority**: 🔴 HIGH

### Actions:
1. Audit all 21 base components in `components/ui/`
2. Apply EUVEKA rounded-full buttons
3. Apply EUVEKA glow effects
4. Apply EUVEKA typography
5. Fix any React 19 pattern issues

### Files:
- `components/ui/button.tsx`
- `components/ui/card.tsx`
- `components/ui/input.tsx`
- `components/ui/dialog.tsx`
- All other `components/ui/*.tsx`

---

## TASK 3: Accessibility WCAG 2.1 AA Audit
**Agent**: accessibility-specialist
**Priority**: 🔴 HIGH

### Actions:
1. Verify color contrast meets 4.5:1 for EUVEKA palette
2. Add missing ARIA labels
3. Fix keyboard navigation issues
4. Ensure focus indicators visible
5. Add skip links if missing
6. Verify screen reader announcements

### Files:
- All `components/**/*.tsx`
- `app/layout.tsx`

---

## TASK 4: Animation & Motion EUVEKA Conformance
**Agent**: animation-motion-expert
**Priority**: 🟡 MEDIUM

### Actions:
1. Apply EUVEKA easing `[0.16, 1, 0.3, 1]` globally
2. Add floating orb effects to key pages
3. Implement scroll-based parallax
4. Add clip-path reveal animations for headlines
5. Ensure reduced-motion support

### Files:
- `lib/animations/`
- `components/landing/hero-euveka.tsx`
- `components/effects/`

---

## TASK 5: Responsive Design Cross-Device Fixes
**Agent**: responsive-design-expert
**Priority**: 🟡 MEDIUM

### Actions:
1. Audit mobile (320-639px) layouts
2. Audit tablet (640-1023px) layouts
3. Audit desktop (1024px+) layouts
4. Fix touch targets (min 44x44px)
5. Fix navigation for all breakpoints

### Files:
- All page layouts in `app/`
- `components/navigation/`
- `components/layout/`

---

## TASK 6: Theme System EUVEKA Compliance
**Agent**: theme-specialist
**Priority**: 🟡 MEDIUM

### Actions:
1. Verify dark theme matches EUVEKA
2. Update light theme to EUVEKA light
3. Update forest/ocean themes to use EUVEKA grays
4. Fix theme transition animations
5. Test theme persistence

### Files:
- `lib/hooks/use-euveka-theme.ts`
- `components/theme-toggle.tsx`
- `app/globals.css`

---

## TASK 7: Form Styling & Validation
**Agent**: form-specialist
**Priority**: 🟡 MEDIUM

### Actions:
1. Apply EUVEKA input styling (rounded, subtle borders)
2. Fix form validation messages
3. Add password strength indicators
4. Fix file drop zones

### Files:
- `components/transfer/transfer-card.tsx`
- `components/devices/manual-connect.tsx`
- All form components

---

## TASK 8: State Management & Loading States
**Agent**: state-management-expert + loading-skeleton-expert
**Priority**: 🟡 MEDIUM

### Actions:
1. Audit Zustand stores
2. Add skeleton loading states
3. Fix optimistic updates
4. Add Suspense boundaries

### Files:
- `lib/stores/`
- `components/loading/`

---

## TASK 9: Error Handling UI
**Agent**: error-handling-ui-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA styling to error states
2. Add error boundaries
3. Fix error messages
4. Add retry mechanisms

### Files:
- `app/error.tsx`
- `app/global-error.tsx`
- `components/error-boundaries/`

---

## TASK 10: Notification & Toast System
**Agent**: notification-toast-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA styling to toasts
2. Fix success/error colors
3. Add progress toasts
4. Fix positioning

### Files:
- `components/ui/sonner.tsx`
- `lib/utils/toast.tsx`

---

## TASK 11: Modal & Dialog EUVEKA Styling
**Agent**: modal-dialog-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA backdrop blur
2. Fix dialog animations
3. Apply rounded corners
4. Fix mobile sheets

### Files:
- `components/ui/dialog.tsx`
- `components/ui/alert-dialog.tsx`

---

## TASK 12: Navigation EUVEKA Styling
**Agent**: navigation-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA nav styling
2. Fix mobile bottom nav
3. Add breadcrumbs
4. Fix tab navigation

### Files:
- `components/site-nav.tsx`
- `components/navigation/`

---

## TASK 13: Empty States & Onboarding
**Agent**: empty-state-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA empty state styling
2. Add helpful CTAs
3. Fix icon styling

### Files:
- `components/ui/empty-state.tsx`

---

## TASK 14: Data Visualization EUVEKA
**Agent**: data-visualization-expert
**Priority**: 🟢 LOW

### Actions:
1. Apply EUVEKA colors to charts
2. Fix progress bars
3. Add network graphs

### Files:
- `components/transfer/transfer-queue.tsx`
- `components/ui/progress.tsx`

---

## TASK 15: Icons & Illustrations
**Agent**: icon-illustration-expert
**Priority**: 🟢 LOW

### Actions:
1. Verify Lucide icons consistency
2. Fix icon sizes
3. Add aria-hidden where needed

### Files:
- All icon usages

---

## TASK 16: Micro-interactions
**Agent**: micro-interaction-expert
**Priority**: 🟢 LOW

### Actions:
1. Add button hover effects
2. Add ripple effects
3. Add success animations

### Files:
- `components/ui/button.tsx`
- `components/ui/motion.tsx`

---

## TASK 17: UX Copy Audit
**Agent**: copy-writing-ux-expert
**Priority**: 🟢 LOW

### Actions:
1. Audit button labels
2. Fix error messages
3. Fix empty state text
4. Add helpful tooltips

### Files:
- All component text

---

## TASK 18: Performance Optimization
**Agent**: performance-optimization-ui
**Priority**: 🟢 LOW

### Actions:
1. Audit bundle size
2. Add lazy loading
3. Fix Core Web Vitals

### Files:
- `components/lazy-components.tsx`
- All heavy components

---

## TASK 19: i18n EUVEKA Integration
**Agent**: i18n-localization-expert
**Priority**: 🟢 LOW

### Actions:
1. Verify RTL support
2. Fix translation keys
3. Add missing translations

### Files:
- `lib/i18n/translations/`

---

## TASK 20: Component Testing
**Agent**: testing-component-expert
**Priority**: 🟢 LOW

### Actions:
1. Add accessibility tests
2. Fix failing tests
3. Add visual regression tests

### Files:
- `tests/unit/components/`

---

## Execution Order

### Wave 1 (Parallel - HIGH Priority)
- TASK 1: Design System Audit
- TASK 2: React Component Audit
- TASK 3: Accessibility Audit

### Wave 2 (Parallel - MEDIUM Priority)
- TASK 4: Animation
- TASK 5: Responsive
- TASK 6: Theme
- TASK 7: Forms
- TASK 8: State/Loading

### Wave 3 (Parallel - LOW Priority)
- TASKS 9-20: All remaining tasks

---

## Success Criteria

- [ ] All EUVEKA colors applied consistently
- [ ] WCAG 2.1 AA compliance verified
- [ ] All 4 themes working
- [ ] Mobile/tablet/desktop responsive
- [ ] Animations smooth with reduced-motion support
- [ ] All forms validated
- [ ] Error states handled
- [ ] Toasts styled
- [ ] Performance targets met
- [ ] Tests passing
