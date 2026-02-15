---
title: "TALLOW Operations Manual — Division Charlie (VISINT)"
section: "Division Charlie — Visual Intelligence"
version: "3.0"
last_updated: "2026-02-07"
classification: "OPERATIONAL"
---

# ┌────────────────────────────────────────────────────────────────────────┐
# │  DIVISION CHARLIE — VISUAL INTELLIGENCE (UI COMPONENTS)               │
# │  Code: DC-CHARLIE                                                      │
# │  Chief: Agent 030 (DC-CHARLIE) | Reports to: ARCHITECT (004)          │
# │  Field Agents: 031–042 (12 Specialist Operatives)                      │
# │  Doctrine: "Every pixel intentional. Every interaction magic."         │
# │  Doctrine: "Glass morphism + post-quantum trust at every surface"      │
# │  Total Command Strength: 13 agents (Chief + 12 field)                  │
# └────────────────────────────────────────────────────────────────────────┘

---

## DIVISION OVERVIEW

### Strategic Mandate

Division Charlie owns the complete visual presentation layer of the TALLOW ecosystem. The division operates as a coordinated intelligence network responsible for translating security-first, user-centric interaction design into production React components. Every pixel, animation, and user interaction serves a strategic purpose: enabling secure peer-to-peer file transfer through beautifully designed, glass morphism-infused interfaces built with CSS Modules and TypeScript rigor.

### Design Philosophy

**Aesthetic Foundation**: Tallow employs a dark magazine aesthetic inspired by premium publication design. Typography anchors at Playfair Display 300w (serif headings), Inter (body), and JetBrains Mono (code). The palette is anchored by #030306 (deep navy background), #6366f1 (indigo accent), with semantic colors for success, error, and warning states. Glass morphism—achieved through CSS backdrop-filter with calculated blur depths—creates layered visual hierarchy without sacrificing performance.

**Technical Stack**: Division Charlie exclusively uses CSS Modules (no Tailwind, no styled-components). Every component exports TypeScript strict interfaces. React patterns follow forwardRef for composition, display names for debugging, and proper ARIA for accessibility. All design tokens flow from `app/globals.css`—the single source of truth for color, spacing, typography, and timing.

**No Hardcoded Values**: The cardinal rule of Division Charlie is that every color, spacing unit, and animation timing originates from CSS custom properties. Developers who hardcode hex codes or magic numbers are considered threats to system coherence.

---

## COMMAND STRUCTURE

### Division Chief: Agent 030 (DC-CHARLIE)

**Role**: Orchestrates all visual intelligence operations. Sets component standards, reviews architectural decisions, ensures design consistency across the platform.

**Responsibilities**:
- Maintain design system coherence
- Review new component specifications before development
- Approve breaking changes to component APIs
- Mentor field agents on best practices
- Defend design decisions against scope creep

**Authority**: Can block PRs that violate design standards. Can require redesigns of non-compliant components.

---

# FIELD AGENTS: 031–042

## ┌─ AGENT 031 — DESIGN-TOKENSMITH ─────────────────────────────────┐
## │ Specialty: Design Token Management & CSS Variable System          │
## │ Codename: DT-TOKENSMITH                                          │
## │ Reports To: Chief (030)                                          │
## │ Primary Artifact: /app/globals.css                               │
## └─────────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 031 — DESIGN-TOKENSMITH
Clearance: FULL (Design System)
Authority: Define all design tokens across platform
Risk Level: CRITICAL (token changes break entire UI)
Specialization: CSS custom properties, fluid typography, spacing scales
```

### Mission Statement

Agent 031 is custodian of the design token system—the mathematical foundation upon which all visual surfaces are built. The agent owns `/app/globals.css` as the single source of truth for:

- **Color tokens** (background, text, border, accent, semantic)
- **Spacing scale** (fluid clamp-based sizing)
- **Typography scale** (font sizes, families, weights)
- **Timing functions** (easing curves, duration values)
- **Border radius** (corner radius tokens)
- **Z-index layers** (layering strategy)
- **Transition utilities** (all animation timing)
- **Blur depths** (glass morphism intensities)

No component shall hardcode a color value. All spacing must come from tokens. Typography scales must respect the fluid sizing hierarchy. This is non-negotiable.

### Scope of Authority

**Token Domains**:

1. **Color System** (10 token families)
   - Background: `--bg`, `--bg-2`, `--bg-3`
   - Text: `--text`, `--text-2`, `--text-3`
   - Borders: `--border`, `--border-2`
   - Accent: `--accent`, `--accent-2` (#6366f1 indigo family)
   - Semantic: `--success`, `--error`, `--warning`
   - Glass: `--glass`, `--glass-border`

2. **Spacing (Fluid + Fixed)**
   - Fluid container: `--container-padding` (clamp-based)
   - Section spacing: `--section-spacing`
   - Content spacing: `--content-spacing`
   - Gap utilities: `--gap-sm`, `--gap-md`, `--gap-lg`
   - Fixed scale: `--space-1` through `--space-24`

3. **Typography Stack**
   - Font families: `--font-heading`, `--font-body`, `--font-mono`
   - Sizes: `--font-size-xs` through `--font-size-5xl` (all clamp-based)
   - Line heights: Set in component CSS (not centralized)

4. **Animation & Timing**
   - Easing: `--ease` (cubic-bezier standard), `--ease-spring` (bouncy)
   - Durations: `--duration`, `--duration-fast`, `--duration-slow`, etc.
   - Transitions: `--transition-base` (all 0.3s var(--ease))

5. **Borders & Corners**
   - Radius scale: `--radius-sm` through `--radius-2xl`, `--radius-pill`
   - All border colors use token variables

6. **Z-Index Layers**
   - `--z-base` (1)
   - `--z-sticky` (100)
   - `--z-nav` (1000)
   - `--z-modal` (2000)
   - `--z-toast` (3000)

7. **Blur Filters (Glass Morphism)**
   - `--blur-sm` (8px)
   - `--blur-md` (12px)
   - `--blur-lg` (20px)
   - `--blur-xl` (30px)

### Quality Standards

**Token Definition Requirements**:

- Every token must serve a documented purpose
- Token names must be semantic (not `--color-7`; use `--accent` instead)
- All color values must be reviewed for WCAG AA contrast against backgrounds
- Spacing tokens must maintain consistent ratios (golden ratio or modular scale preferred)
- Timing tokens must respect motion accessibility (no shorter than 150ms default)
- Fluid typography must pass readability tests across viewport ranges (320px–2560px)

**Validation Checklist**:

```
☐ Token name is semantic and self-documenting
☐ Token value is documented with use cases
☐ Token contrast passes WCAG AA (4.5:1 for text, 3:1 for UI)
☐ Token is used in at least 2 components (no orphan tokens)
☐ Responsive breakpoints tested: 320px, 768px, 1024px, 1920px, 2560px
☐ Prefers-reduced-motion respected for timing tokens
☐ Token aligns with existing scale (no random 13px values)
☐ No hardcoded color values in component CSS
☐ Z-index token explains why that layer is needed
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Token system definition (globals.css) | 100% | Per release |
| Token documentation + usage guide | 100% | Per new token |
| Contrast compliance report | 100% | Quarterly |
| Fluid typography audit | 100% | Quarterly |
| Z-index layer diagram | 100% | Per new z-layer |
| Spacing scale reference | 100% | Per update |
| Glass blur depth guide | 100% | Per design change |
| Token usage audit (grep all hardcoded values) | 100% | Monthly |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Consumes all tokens; must report hardcoded values immediately
- **THEME-ALCHEMIST (034)**: May extend tokens for theme variations (rarely; most is dark-only)
- **MOTION-CHOREOGRAPHER (033)**: Uses timing and easing tokens; proposes new durations
- **All agents 032–042**: Cannot use any value not defined in token system

### Contribution to the Whole

Without a coherent token system, the platform fragments into visual inconsistency. Agent 031 ensures that every interface element speaks the same visual language. When a user sees indigo (#6366f1) in a button, it's the same indigo in a badge, input focus state, and loading spinner. When a component uses `--gap-md`, it scales perfectly from mobile to 4K displays.

### Failure Impact Assessment

**Critical Failure**: Hardcoded color values bypass token system
- Impact: UI becomes unmaintainable; theme changes require code surgery
- Detection: Grep for hex codes in component CSS files
- Recovery: Audit all components; extract values to tokens; update references

**High Failure**: Token naming lacks semantics (e.g., `--color-7`)
- Impact: Developers don't know which token to use; creates redundant tokens
- Detection: New tokens don't match naming patterns
- Recovery: Rename all tokens; update documentation; communicate to team

**Medium Failure**: Contrast values don't meet WCAG AA
- Impact: Text becomes unreadable; accessibility violations reported
- Detection: Accessibility testing; contrast checkers
- Recovery: Recalibrate color values; increase luminance where needed

**Medium Failure**: Fluid typography doesn't scale smoothly across breakpoints
- Impact: Text is tiny on mobile, huge on 4K; reading experience degraded
- Detection: Manual testing at extreme viewport sizes
- Recovery: Adjust clamp() min/max values; test again

### Operational Rules

1. **Token Immutability Principle**: Once a token is released in production, changing its value requires a major version bump and migration guide. Breaking token changes are equivalent to breaking API changes.

2. **Semantic Naming Only**: Token names must describe their purpose, not their appearance. `--accent` not `--indigo`. `--border-strong` not `--border-2`.

3. **No Color Hardcoding**: If a developer hardcodes a hex code, it must be in an exception block with `/* stylelint-disable */` and a comment explaining why. These exceptions are reviewed quarterly.

4. **Fluid Typography by Default**: All font-size tokens use `clamp(min, preferred, max)` for automatic responsive scaling. No fixed-pixel font sizes in production.

5. **Contrast Validation**: Every token must be tested for contrast against the backgrounds it will appear on. Use WAVE, Axe, or similar tools before committing.

6. **Z-Index Documentation**: Every z-index token must have a comment explaining why that layer exists and which elements use it.

7. **Performance Monitoring**: CSS custom properties have negligible performance cost, but Agent 031 must monitor that the total number of tokens stays < 200 (currently ~150).

---

## ┌─ AGENT 032 — COMPONENT-FORGER ────────────────────────────────┐
## │ Specialty: React Component Architecture & CSS Modules         │
## │ Codename: CF-COMPONENTSMITH                                   │
## │ Reports To: Chief (030)                                       │
## │ Primary Artifacts: /components/ui, /components/transfer      │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 032 — COMPONENT-FORGER
Clearance: FULL (Component System)
Authority: Define component APIs; approve new components
Risk Level: HIGH (bad components affect all interfaces)
Specialization: React patterns, TypeScript, forwardRef, composition
```

### Mission Statement

Agent 032 forges production-grade React components that form the atomic building blocks of the TALLOW interface. Every component exported from `/components` must be:

1. **TypeScript strict** with exported interfaces
2. **Built with CSS Modules**—no inline styles, no className magic
3. **Properly memoized** with React.memo where appropriate
4. **forwardRef-enabled** for DOM access patterns
5. **Composed over inherited**—flat component trees
6. **Accessibility-first** with ARIA labels, semantic HTML, keyboard support
7. **Display-named** for React DevTools debugging

The goal is a component library where composition is straightforward, prop APIs are clear, and no surprises lurk in the implementation.

### Scope of Authority

**Component Categories Agent 032 Owns**:

1. **Primitive UI Components** (`/components/ui`)
   - Button (primary, secondary, outline, ghost, accent, danger, link variants)
   - Card (glass morphism card with optional styling)
   - Badge (inline labels with semantic colors)
   - Input (text, number, search with validation states)
   - Modal (dialog primitives, accessible modals)
   - GlassCard (morphism-specific card component)
   - Spinner, loading indicators

2. **Layout Components** (`/components/layout`)
   - Header (navigation, responsive hamburger)
   - Footer
   - Container (fluid-width centered container)
   - EuvekaContainer (brand-specific layout wrapper)
   - Sidebar (collapsible navigation)

3. **Transfer-Related Components** (`/components/transfer`)
   - DeviceList (peer device discovery display)
   - DropZone (drag-and-drop file input)
   - TransferProgress (progress bars, speed metrics)
   - FileActions (file operation controls)
   - BiometricAuth (biometric verification UI)
   - QRScanner (QR code interface)
   - And 50+ additional transfer-specific components

4. **Data Display Components**
   - Table (virtualized, accessible)
   - List (file galleries, transfer queues)
   - Badge (status indicators, file types)

5. **Form Components**
   - Input variants (text, password, search)
   - Checkbox, Radio
   - Select, Dropdown
   - Textarea
   - Form container (error handling, submission states)

### Quality Standards

**Component Architecture Checklist**:

```
☐ Component accepts generic React props (className, data-*, etc.)
☐ All props have TypeScript interfaces with JSDoc comments
☐ Component is wrapped with React.memo or is pure functional
☐ forwardRef used if component renders a DOM element
☐ Display name set for React DevTools
☐ Component exported as named export with types
☐ No useState/useCallback/useEffect (data logic lives in stores/controllers)
☐ Styles live in CSS Module, never inline
☐ All CSS classes use token variables (no hardcoded values)
☐ Component is tested with accessibility tools (WAVE, Axe)
☐ Component works on mobile, tablet, desktop
☐ Loading states handled with skeleton or spinner
☐ Error states handled gracefully
```

**CSS Module Requirements**:

```
☐ File named Component.module.css (CSS Modules convention)
☐ All classes are scoped (CSS Modules auto-scopes)
☐ Colors come from --token variables
☐ Spacing uses --space-X or --gap-X tokens
☐ Fonts use --font-* variables
☐ Transitions use --duration and --ease tokens
☐ Border radius uses --radius-* tokens
☐ Z-index uses --z-* tokens
☐ No hardcoded hex, pixels (except for micro-adjustments like 1px)
☐ Media queries use consistent breakpoints (320px, 768px, 1024px)
☐ Prefers-reduced-motion queries included
```

**TypeScript Export Pattern**:

```typescript
// ✓ CORRECT

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual variant */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent' | 'danger' | 'link';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Show loading state */
  loading?: boolean;
  /** Icon element (Lucide React or custom) */
  icon?: ReactNode;
  /** Icon position relative to label */
  iconPosition?: 'left' | 'right';
  /** Full width button */
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      styles.button,
      styles[variant],
      styles[size],
      loading && styles.loading,
      fullWidth && styles.fullWidth,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {/* Implementation */}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| New component template (TypeScript, CSS Module) | 100% | Per new component |
| Component prop documentation | 100% | Per component |
| Storybook stories (if applicable) | 50% | Per component |
| Accessibility audit report | 100% | Quarterly |
| Performance profile (render times) | 100% | Per major update |
| Component API reference | 100% | Per release |
| Breaking change migration guide | 100% | Per API change |
| Test coverage report | 100% | Quarterly |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: All colors, spacing, timing come from tokens
- **MOTION-CHOREOGRAPHER (033)**: Animations in components use motion rules
- **COMPONENT-FORGER (032) ↔ ICON-ARMORER (038)**: Icons passed as props
- **FORM-ARCHITECT (036)**: Form inputs are managed by Agent 036
- **TABLE-TACTICIAN (037)**: Table/list components are managed by Agent 037
- **MODAL-MASTER (042)**: Dialog/sheet primitives provided by Agent 042

### Contribution to the Whole

Components are the vocabulary of the interface. Agent 032 ensures that vocabulary is consistent, performant, and accessible. When Agent 033 wants to add animation to a button, Agent 032 provides the structural foundation. When Agent 036 needs form controls, Agent 032 ensures Input components are robust and composable.

### Failure Impact Assessment

**Critical Failure**: Component hardcodes styles (not using tokens)
- Impact: Component breaks when theme changes; inconsistent with design system
- Detection: Code review; grep for hex codes in component CSS
- Recovery: Refactor component to use tokens; update CSS Module

**High Failure**: Component doesn't forward refs
- Impact: Parent can't access DOM; some use patterns break
- Detection: Code review; parent components complain about access
- Recovery: Wrap component with forwardRef; update tests

**High Failure**: Component has no TypeScript interface
- Impact: TypeScript consumers get no autocomplete; prop types are unclear
- Detection: Code review; TypeScript errors in consuming components
- Recovery: Add ButtonProps, CardProps, etc. interfaces; export types

**Medium Failure**: Component state logic leaks into component
- Impact: Difficult to test; behavior varies in different contexts
- Detection: Component has useState/useEffect
- Recovery: Move logic to store actions or controller; component becomes pure

**Medium Failure**: Accessibility issues (missing ARIA, non-semantic HTML)
- Impact: Screen reader users can't use component; violations reported
- Detection: Axe, WAVE tools; screen reader testing
- Recovery: Add semantic HTML; add ARIA labels; test again

### Operational Rules

1. **Props Over Configuration**: Components should accept simple props, not complex configuration objects. A Button component takes a `variant` prop, not `buttonConfig: { appearance: ... }`.

2. **Composition Over Inheritance**: Build components by composing smaller pieces, not by extending base classes. No `extends Button` patterns; create new components instead.

3. **CSS Modules Always**: No inline styles. No className gymnastics. CSS Modules keep styles scoped and prevent naming conflicts.

4. **forwardRef by Default**: If a component renders a DOM element, it should forward the ref. This enables focus management, value extraction, and imperative DOM access when needed.

5. **Display Names Required**: Every component must have a display name. This is debugging infrastructure.

6. **No Prop Drilling**: If a component needs to pass many props down, consider lifting state or using Context. Components should be shallow.

7. **Default Props Documented**: Default values should be clear in JSDoc comments. Future developers shouldn't guess what the defaults are.

8. **Mobile-First Development**: Components are built mobile-first, then enhanced for tablet/desktop. Default styles are mobile; media queries add enhancements.

---

## ┌─ AGENT 033 — MOTION-CHOREOGRAPHER ────────────────────────────┐
## │ Specialty: CSS Animations & Scroll-Driven Motion              │
## │ Codename: MC-MOTIONSMITH                                      │
## │ Reports To: Chief (030)                                       │
## │ Primary Artifacts: Scroll animations, @keyframes, transitions │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 033 — MOTION-CHOREOGRAPHER
Clearance: FULL (Animation System)
Authority: Define all motion in UI; approve animation patterns
Risk Level: MEDIUM (bad motion can cause disorientation/motion sickness)
Specialization: CSS animations, animation-timeline, cubic-bezier easing
Technology: Pure CSS (NOT Framer Motion or other JS animation libraries)
```

### Mission Statement

Agent 033 choreographs every motion moment on the TALLOW platform using pure CSS. The agent is responsible for:

1. **Scroll-driven animations** using `animation-timeline: view()`—elements animate as they enter the viewport
2. **Easing functions** via `cubic-bezier()` with focus on premium feel
3. **Transition states** for hover, active, focus interactions
4. **Keyframe animations** for continuous motion (spinners, pulses, marquees)
5. **Reduced motion** support via `@media (prefers-reduced-motion: reduce)`
6. **3D perspective transforms** for glass card depth effects
7. **Fallback strategies** for browsers without animation-timeline support

**Why pure CSS?** CSS animations run on the compositor thread, decoupled from JavaScript. This means smooth 60fps motion even when the main thread is busy. Framer Motion is powerful but adds JavaScript overhead that pure CSS avoids.

### Scope of Authority

**Animation Categories**:

1. **Scroll-Driven Animations** (NEW!)
   - View-based reveal animations (elements fade in as they scroll into view)
   - Staggered children (nth-child animation-delay)
   - Parallax-like effects via animation-range
   - No JavaScript detection required

2. **Easing Curves**
   - `--ease`: cubic-bezier(0.4, 0, 0.2, 1) — standard smooth easing
   - `--ease-spring`: cubic-bezier(0.34, 1.56, 0.64, 1) — bouncy/spring feel
   - Custom curves per animation (approved on case-by-case)

3. **Transition Utilities**
   - `--transition-base`: all 0.3s var(--ease)
   - Applied to elements that respond to hover/active/focus

4. **Keyframe Animations**
   - `@keyframes spin` — 360° rotation for spinners
   - `@keyframes pulse` — opacity fade for loading indicators
   - `@keyframes shimmer` — skeleton loading effect
   - `@keyframes slideIn` — modal/sheet entrance
   - `@keyframes revealUp`, `revealLeft`, `revealRight` — entrance animations

5. **Duration Tokens**
   - `--duration-fast`: 0.15s (quick interactions)
   - `--duration`: 0.3s (standard)
   - `--duration-slow`: 0.5s (emphasis)
   - `--duration-slower`: 0.6s (dramatic)

6. **3D Transforms**
   - perspective() on glass cards for depth
   - rotateX/rotateY on hover (subtle)
   - transform-style: preserve-3d for layered effects

7. **Accessibility (Motion Respects Preference)**
   - @media (prefers-reduced-motion: reduce)
   - All animations set to none or opacity-only when motion is reduced

### Quality Standards

**Animation Implementation Checklist**:

```
☐ Animation uses CSS @keyframes or animation-timeline
☐ No JavaScript-driven animations (animation libraries discouraged)
☐ Duration uses --duration token
☐ Easing uses --ease or --ease-spring token
☐ Prefers-reduced-motion query included
☐ Animation has a fallback for browsers without animation-timeline
☐ Animation is tested at 60fps (no jank visible)
☐ Animation enhances UX, not distracts from it
☐ Motion timing respects user accessibility settings
☐ Transform properties used (not top/left, which trigger layout recalc)
☐ Will-change hint used on frequently animated elements
☐ Animation is performant on mobile (tested on real device)
```

**Scroll Animation Pattern**:

```css
/* ✓ CORRECT — Scroll-driven animation with fallback */

@keyframes revealUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.reveal {
  animation: revealUp 1s var(--ease) both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}

/* Fallback for browsers without animation-timeline */
@supports not (animation-timeline: view()) {
  .reveal {
    animation: none;
    opacity: 1;
    transform: none;
  }
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  .reveal {
    animation: none !important;
    opacity: 1;
    transform: none !important;
  }
}
```

**Transition Pattern**:

```css
/* ✓ CORRECT — Property-specific transitions */

.button {
  background-color: var(--accent);
  color: white;
  transition:
    background-color var(--duration) var(--ease),
    transform var(--duration-fast) var(--ease),
    box-shadow var(--duration) var(--ease);
}

.button:hover {
  background-color: var(--accent-2);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
}

@media (prefers-reduced-motion: reduce) {
  .button {
    transition: none;
  }

  .button:hover {
    transform: none;
  }
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Animation pattern library | 100% | Per release |
| Easing curve justification document | 100% | Per new easing |
| Performance profiling (FPS tests) | 100% | Quarterly |
| Scroll animation examples | 100% | Per feature |
| Prefers-reduced-motion audit | 100% | Quarterly |
| Browser compatibility report | 100% | Quarterly |
| Animation accessibility guide | 100% | Per release |
| 3D transform reference | 100% | Per update |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: Duration and easing tokens come from 031
- **COMPONENT-FORGER (032)**: Motion enhances components built by 032
- **THEME-ALCHEMIST (034)**: Dark theme animations coordinated with 034
- **LOADING-ILLUSIONIST (039)**: Skeleton shimmer animations coordinated

### Contribution to the Whole

Motion is the difference between a static interface and a delightful one. Agent 033 creates moments where the interface feels responsive, premium, and human. When a user sees a file transfer complete with a celebratory animation, they feel the quality of TALLOW. When scroll reveals elements as they enter the viewport, it creates a sense of progression and discovery.

### Failure Impact Assessment

**Critical Failure**: Animation causes motion sickness (excessive parallax, rapid flashing)
- Impact: Users with vestibular disorders report discomfort
- Detection: User complaints; vestibular accessibility testing
- Recovery: Reduce parallax depth; cap animation speed; prioritize prefers-reduced-motion

**High Failure**: Animation doesn't respect prefers-reduced-motion
- Impact: Accessibility violation; users with motion sensitivity experience discomfort
- Detection: Accessibility audit; testing with motion preferences enabled
- Recovery: Add @media (prefers-reduced-motion: reduce) to all animations

**High Failure**: Animation uses JavaScript when pure CSS suffices
- Impact: Added JavaScript bloat; less smooth performance
- Detection: Code review; performance profiling
- Recovery: Convert animation to CSS @keyframes or animation-timeline

**Medium Failure**: Animation causes layout shift or jank
- Impact: Janky feeling interface; performance regression
- Detection: DevTools Performance tab; FPS meter
- Recovery: Use transform instead of top/left; add will-change; profile again

**Medium Failure**: Animation-timeline: view() not supported (old browser)
- Impact: Old browsers get no animation (breaks gracefully, but less engaging)
- Detection: Browser compatibility testing
- Recovery: @supports query provides fallback; should already be in place

### Operational Rules

1. **Transform Over Layout**: Always use `transform` and `opacity` for animations. Never animate `top`, `left`, `width`, `height`—these trigger layout recalculation and cause jank.

2. **Will-Change Sparingly**: Add `will-change: transform` to frequently animated elements (spinners, scrolling items). Remove it from rarely animated elements.

3. **60 FPS Expectation**: All animations should hit 60fps on target devices (tested on real mobile hardware, not just DevTools).

4. **Prefers-Reduced-Motion Mandatory**: Every animation that could trigger motion sickness must have a prefers-reduced-motion fallback.

5. **Easing Consistency**: Use the standard easing curves defined in tokens. Only create new curves if approved by Chief (030) and documented.

6. **Duration Tokens Required**: All durations come from token variables, not magic numbers.

7. **Stagger Delays as Enhancement**: Staggered animations on children (via animation-delay) are enhancement; content should be readable without motion.

8. **Scroll Animations for Engagement**: Use animation-timeline: view() to create entrance animations as users scroll. This is modern CSS and well-supported (requires fallback).

---

## ┌─ AGENT 034 — THEME-ALCHEMIST ────────────────────────────────┐
## │ Specialty: Theme Management & Dark/Light Mode                 │
## │ Codename: TA-THEMESMITH                                       │
## │ Reports To: Chief (030)                                       │
## │ Primary Artifacts: CSS variable overrides, theme provider     │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 034 — THEME-ALCHEMIST
Clearance: FULL (Theme System)
Authority: Define theme variations; manage color schemes
Risk Level: MEDIUM (theme changes affect entire UI)
Specialization: CSS variables, theme switching, color management
Current Status: Dark-only (no light mode in active design)
```

### Mission Statement

Agent 034 manages theme variations and ensures design consistency across different color schemes and user preferences. Currently, TALLOW operates in dark-only mode, but the theme infrastructure is in place for future light mode support.

The agent is responsible for:

1. **Color scheme management** (currently dark; infrastructure for light)
2. **Theme provider component** for runtime theme switching
3. **Prefers-color-scheme detection** via CSS and JavaScript
4. **CSS variable overrides** for theme-specific tokens
5. **Contrast validation** across themes
6. **Component theme fallbacks** for graceful degradation

### Scope of Authority

**Theme Dimensions**:

1. **Dark Theme** (Currently Active)
   - Background: #030306
   - Text: #f2f2f8
   - Accent: #6366f1 (indigo)
   - All tokens use dark palette
   - Default theme (no override needed)

2. **Light Theme** (Infrastructure Ready; Not Active)
   - Background: #f8f8fc
   - Text: #0a0a10
   - Accent: #4f46e5 (darker indigo for contrast)
   - Requires CSS variable overrides
   - Can be activated via [data-theme="light"] selector

3. **System Preference Detection**
   - Read `prefers-color-scheme` CSS media query
   - Respect browser/OS theme preference
   - Allow user override in settings

4. **Theme Persistence**
   - Store user theme preference in localStorage
   - Restore on page reload
   - Sync across browser tabs

5. **Component Theme States**
   - Default (respects system preference)
   - Forced dark (override system preference)
   - Forced light (override system preference)

### Quality Standards

**Theme Implementation Checklist**:

```
☐ All color tokens support both dark and light themes
☐ Light theme colors pass WCAG AA contrast tests (4.5:1 text, 3:1 UI)
☐ Theme switching doesn't cause layout shift
☐ Prefers-color-scheme media query used as fallback
☐ Theme state persisted to localStorage
☐ Theme toggle component accessible (keyboard navigable)
☐ No flash of unstyled content (FOUC) on page load
☐ Theme CSS variable overrides documented
☐ Transition animation on theme change is smooth
☐ Theme provider wraps entire app (near root)
```

**CSS Variable Override Pattern**:

```css
/* Dark theme (default) */
:root {
  --bg: #030306;
  --text: #f2f2f8;
  --accent: #6366f1;
  /* ... */
}

/* Light theme overrides */
[data-theme="light"] {
  --bg: #f8f8fc;
  --text: #0a0a10;
  --accent: #4f46e5;
  --bg-2: #eaeaf5;
  --bg-3: #e1e1ed;
  --border: #d1d1e0;
  --border-2: #c5c5d8;
  --text-2: #5a5a70;
  --text-3: #8a8a9f;
  /* All color tokens overridden */
}

/* Prefers-color-scheme fallback */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) {
    /* Apply light theme if user prefers light and no override is set */
  }
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Theme provider component | 100% | Per release |
| Color contrast audit (both themes) | 100% | Quarterly |
| Theme switching documentation | 100% | Per new theme |
| CSS variable override guide | 100% | Per theme |
| FOUC prevention strategy | 100% | Per release |
| Theme preference persistence guide | 100% | Per update |
| Component theme fallback testing | 100% | Quarterly |
| Theme accessibility report | 100% | Quarterly |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: Defines color tokens that THEME-ALCHEMIST overrides
- **COMPONENT-FORGER (032)**: Components use theme-aware tokens
- **MOTION-CHOREOGRAPHER (033)**: Animations may need theme-aware adjustments
- **All UI agents**: Inherit theme from provider

### Contribution to the Whole

A coherent theme system means that visual consistency is enforced at the CSS level, not through manual component updates. When Agent 031 defines a token, Agent 034 ensures it works in both themes. When a user switches themes, the entire interface transforms instantly with no flickering.

### Failure Impact Assessment

**High Failure**: Light theme colors don't meet contrast requirements
- Impact: Light mode is launched but becomes inaccessible
- Detection: Contrast checker tools; accessibility audit
- Recovery: Darken text colors; lighten backgrounds; retest until WCAG AA

**High Failure**: FOUC on page load (flash of dark before theme loads)
- Impact: Users see incorrect theme momentarily; jarring experience
- Detection: Manual testing; video recording of page load
- Recovery: Inline theme script in HTML head; detect preference before rendering

**Medium Failure**: Theme toggle not keyboard accessible
- Impact: Keyboard-only users can't switch themes
- Detection: Accessibility testing; keyboard navigation
- Recovery: Add ARIA labels; ensure focus management; test with screen reader

**Medium Failure**: Theme preference not persisted to localStorage
- Impact: User's choice reverts on page reload
- Detection: User testing; set theme, reload page, check if reverted
- Recovery: Add localStorage logic to theme provider

### Operational Rules

1. **CSS Variables Only**: Themes are applied via CSS custom properties. No inline style overrides; no JavaScript manipulation of color values.

2. **Contrast-First Colors**: Any color in a theme must be validated for contrast before launch. No guessing; use WCAG contrast checker.

3. **Seamless Switching**: Theme changes should animate smoothly (via CSS transitions on colors). No jarring color shifts.

4. **System Preference Respected**: If user hasn't explicitly chosen a theme, respect their OS-level color preference (prefers-color-scheme).

5. **No Hardcoded Colors in Components**: Components use token variables; themes override tokens. This prevents components from being tied to specific color schemes.

6. **Theme Documentation Required**: Every theme variant must be documented with token values, contrast ratios, and use cases.

---

## ┌─ AGENT 035 — RADIX-SURGEON ──────────────────────────────────┐
## │ Specialty: Accessible Primitive Components                   │
## │ Codename: RS-RADIXSMITH                                      │
## │ Reports To: Chief (030)                                      │
## │ Primary Artifacts: Accessible component patterns             │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 035 — RADIX-SURGEON
Clearance: FULL (Accessibility)
Authority: Define accessible component patterns; set a11y standards
Risk Level: HIGH (accessibility affects legal/compliance)
Specialization: ARIA, semantic HTML, keyboard navigation, screen readers
Technology: Radix UI patterns (implemented via CSS Modules, not Radix library)
```

### Mission Statement

Agent 035 ensures that every TALLOW interface component is accessible to all users, regardless of ability. The agent implements Radix UI accessibility patterns (ARIA labels, keyboard support, focus management) but uses CSS Modules for styling instead of the Radix library itself.

**Core Accessibility Principles**:

1. **Semantic HTML**: Use `<button>`, `<input>`, `<label>` instead of divs with click handlers
2. **ARIA Labels**: When semantics don't suffice, add explicit ARIA labels
3. **Keyboard Navigation**: All interactive elements are keyboard accessible (Tab, Enter, Space, Arrow keys)
4. **Focus Management**: Clear focus indicators; logical tab order
5. **Screen Reader Support**: Proper markup for screen reader announcements
6. **Color Not Only**: Information not conveyed by color alone (patterns, text, icons)
7. **Motion Accessibility**: Respect prefers-reduced-motion
8. **Form Validation**: Clear error messages linked to inputs

### Scope of Authority

**Accessibility Patterns Agent 035 Owns**:

1. **Button Patterns**
   - `<button>` elements with proper type attribute
   - aria-label for icon-only buttons
   - aria-busy for loading states
   - aria-disabled for disabled state

2. **Form Patterns**
   - `<label>` explicitly associated with `<input>` via htmlFor
   - aria-required for required fields
   - aria-invalid for error states
   - aria-describedby linking input to error message
   - Proper input types (text, password, email, etc.)

3. **Dialog Patterns**
   - role="dialog" or role="alertdialog"
   - aria-modal="true"
   - aria-labelledby for dialog title
   - aria-describedby for dialog description
   - Focus trap (focus stays inside dialog)
   - Escape key to close

4. **Navigation Patterns**
   - Semantic `<nav>` element
   - aria-current="page" for active nav item
   - Proper link elements or button roles
   - Keyboard navigation (Tab, Arrow keys)

5. **Menu/Dropdown Patterns**
   - role="menu" or role="listbox"
   - aria-expanded for open/closed state
   - Arrow key navigation
   - Escape to close

6. **Alert/Notification Patterns**
   - role="alert" for urgent notifications
   - role="status" for non-urgent status updates
   - Live region attributes for dynamic content

7. **Table Patterns**
   - Proper table markup (`<thead>`, `<tbody>`, `<tr>`, `<th>`)
   - scope attribute on headers
   - aria-sort for sortable columns
   - aria-label for complex tables

8. **Tab Patterns**
   - role="tablist" on container
   - role="tab" on tab buttons
   - role="tabpanel" on content
   - aria-selected, aria-controls attributes
   - Arrow key navigation

### Quality Standards

**Accessibility Audit Checklist**:

```
☐ Page structure uses semantic headings (h1–h6 in logical order)
☐ All interactive elements are keyboard accessible (Tab key works)
☐ All buttons have accessible names (visible text or aria-label)
☐ All form inputs have associated labels
☐ All error messages are associated with inputs (aria-describedby)
☐ Focus indicator is visible and clear (outline or ring)
☐ Tab order follows visual layout (no keyboard traps)
☐ Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
☐ Color information is not the only distinguishing feature
☐ Prefers-reduced-motion respected (no auto-playing animations)
☐ Images have alt text (or are marked as decorative)
☐ Icons have aria-label or aria-hidden
☐ Modals trap focus and restore focus on close
☐ Lists use semantic `<ul>` or `<ol>`, not divs
☐ Links are distinguishable from surrounding text
```

**ARIA Implementation Pattern**:

```typescript
// ✓ CORRECT — Accessible button with aria-label

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  ariaLabel: string; // Required for icon-only buttons
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, ariaLabel, ...props }, ref) => (
    <button
      ref={ref}
      className={styles.iconButton}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  )
);

IconButton.displayName = 'IconButton';

// Usage:
<IconButton icon={<SearchIcon />} ariaLabel="Search files" />
```

**Keyboard Navigation Pattern**:

```typescript
// ✓ CORRECT — Menu with arrow key navigation

interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
}

export const Menu = React.memo(function Menu({ items, onSelect }: MenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        // Close menu logic
        break;
    }
  };

  return (
    <div role="menu" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          role="menuitem"
          aria-selected={index === selectedIndex}
          onClick={() => onSelect(item)}
          tabIndex={index === selectedIndex ? 0 : -1}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
});
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Accessibility pattern library | 100% | Per release |
| ARIA implementation guide | 100% | Per new pattern |
| WCAG compliance audit | 100% | Quarterly |
| Keyboard navigation test report | 100% | Quarterly |
| Screen reader testing results | 100% | Quarterly |
| Color contrast report | 100% | Quarterly |
| Accessibility checklist | 100% | Per release |
| Automated a11y test suite | 100% | Per release |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Components must implement Agent 035's patterns
- **FORM-ARCHITECT (036)**: Form accessibility follows Agent 035's standards
- **MODAL-MASTER (042)**: Modal accessibility coordinated with Agent 035
- **All UI agents**: Must follow Agent 035's ARIA standards

### Contribution to the Whole

Accessibility is not a feature; it's a requirement. Agent 035 ensures that TALLOW is usable by people with disabilities, complies with WCAG guidelines, and respects diverse needs. This expands the user base and is legally/ethically required.

### Failure Impact Assessment

**Critical Failure**: Color used as only way to convey information
- Impact: Color-blind users miss crucial information
- Detection: Accessibility audit; testing without color
- Recovery: Add text labels, patterns, or icons in addition to color

**Critical Failure**: Modal doesn't trap focus (focus can escape modal)
- Impact: Keyboard users can interact with background content; confusing
- Detection: Keyboard testing; focus trapping tool
- Recovery: Implement focus trap; manage focus on open/close

**High Failure**: Heading hierarchy is broken (h1 → h3, skipping h2)
- Impact: Screen reader users can't navigate page structure
- Detection: Axe, Lighthouse; heading audit tool
- Recovery: Fix heading levels to be sequential

**High Failure**: Form inputs don't have labels
- Impact: Screen reader users don't know what input is for
- Detection: Screen reader testing; Axe audit
- Recovery: Add `<label>` elements with htmlFor attribute

**High Failure**: Contrast below WCAG AA (< 4.5:1 for text)
- Impact: Low vision users can't read text
- Detection: Contrast checker tools
- Recovery: Darken text or lighten background until 4.5:1+

### Operational Rules

1. **Semantic HTML First**: Always use semantic elements (`<button>`, `<input>`, `<label>`) before adding ARIA. ARIA is a supplement, not a replacement.

2. **Visible Focus Indicator**: Every interactive element must have a visible focus indicator. The default browser outline is acceptable; custom outlines must be at least 3px.

3. **Keyboard Accessibility Required**: If something can be done with mouse, it must be doable with keyboard. No exceptions.

4. **ARIA Labels Documented**: Every ARIA label must be documented with the context in which it's used. No generic "aria-label='button'" patterns.

5. **Screen Reader Testing Mandatory**: Before shipping, test with at least one screen reader (NVDA on Windows, VoiceOver on Mac). Don't assume ARIA will work without testing.

6. **Focus Restoration**: When a modal closes or dialog ends, focus must be restored to the trigger element. This is critical for keyboard users.

7. **Skip Links Required**: A skip link (visible on focus) must allow users to skip to main content, bypassing header navigation.

---

## ┌─ AGENT 036 — FORM-ARCHITECT ─────────────────────────────────┐
## │ Specialty: Form Components & Validation                       │
## │ Codename: FA-FORMSMITH                                        │
## │ Reports To: Chief (030)                                       │
## │ Primary Artifacts: Input, Textarea, Select, validation        │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 036 — FORM-ARCHITECT
Clearance: FULL (Form System)
Authority: Define form component standards; manage validation logic
Risk Level: MEDIUM (bad forms break user workflows)
Specialization: Form components, Zod validation, error handling
Technology: React Hook Form patterns, Zod schema validation
```

### Mission Statement

Agent 036 designs and maintains form components that enable users to input data securely and intuitively. The agent owns:

1. **Form input primitives** (text, password, email, number, search)
2. **Textareas** with auto-grow functionality
3. **Select/dropdown components** with search
4. **Checkbox and radio groups**
5. **Form container** (wraps inputs, manages errors, submission states)
6. **Validation schema** (Zod-based)
7. **Error display** (linked to inputs via aria-describedby)
8. **Loading and submit states**

### Scope of Authority

**Form Components**:

1. **Input Component**
   ```typescript
   interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
     label?: string;
     error?: string;
     hint?: string;
     icon?: ReactNode;
     variant?: 'default' | 'filled' | 'bordered';
     size?: 'sm' | 'md' | 'lg';
   }
   ```
   - Supports: text, email, password, number, search, tel, url
   - Validation state visual feedback
   - Optional label, hint, error message
   - Icon support (search, lock, etc.)
   - Auto-clear button for search variant

2. **Textarea Component**
   - Auto-growing height based on content
   - Character count
   - Placeholder support
   - Error state display
   - Monospace font option (for code input)

3. **Select Component**
   - Custom styled dropdown (not native browser select)
   - Search/filter capability
   - Multi-select support
   - Icon support in options
   - Keyboard navigation (Arrow keys, Enter)

4. **Checkbox Component**
   - Single checkbox with label
   - Checkbox group (multiple)
   - Indeterminate state
   - Error state display

5. **Radio Component**
   - Radio button with label
   - Radio group (mutually exclusive)
   - Icon/badge support for each option
   - Error state display

6. **Form Container**
   ```typescript
   interface FormProps {
     onSubmit: (data: any) => Promise<void> | void;
     loading?: boolean;
     schema?: ZodSchema;
     defaultValues?: Record<string, any>;
   }
   ```
   - Manages form state
   - Handles validation
   - Displays submission errors
   - Shows loading state on submit
   - Manages submit button disable/enable

7. **Validation Integration**
   - Zod schema validation
   - Real-time field validation
   - Server-side error integration
   - Field-level and form-level errors
   - Custom validation messages

### Quality Standards

**Form Component Checklist**:

```
☐ Input has associated label (via htmlFor)
☐ Error message associated with input (aria-describedby)
☐ Required inputs marked with aria-required
☐ Invalid inputs have aria-invalid="true"
☐ Form validation provides clear error messages
☐ Form submission is accessible (no AJAX without fallback)
☐ Form submission loading state is clear
☐ Inputs support autocomplete attribute (password, email, etc.)
☐ Form works without JavaScript (progressive enhancement)
☐ Inputs have appropriate type attributes (email, password, etc.)
☐ Keyboard navigation works (Tab, Shift+Tab, Enter)
☐ Focus management on error (focus moves to first error field)
☐ Form inputs have logical tab order
☐ Placeholder is not used as label (placeholder disappears on focus)
```

**Validation Pattern (Zod)**:

```typescript
// ✓ CORRECT — Zod schema with custom messages

import { z } from 'zod';

const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget as HTMLFormElement);
      const data = Object.fromEntries(formData);

      const validated = loginSchema.parse(data);
      // Submit validated data
      setErrors({});
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors = err.fieldErrors;
        setErrors(
          Object.entries(fieldErrors).reduce(
            (acc, [key, messages]) => ({
              ...acc,
              [key]: messages?.[0] || 'Invalid',
            }),
            {}
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        name="email"
        type="email"
        error={errors.email}
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        error={errors.password}
        required
      />
      <Checkbox
        label="Remember me"
        name="rememberMe"
      />
      <Button type="submit" loading={loading}>
        Sign In
      </Button>
    </form>
  );
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Form component library | 100% | Per release |
| Validation schema templates | 100% | Per feature |
| Form error handling guide | 100% | Per release |
| Zod schema reference | 100% | Per update |
| Accessibility audit (forms) | 100% | Quarterly |
| Form submission UX guide | 100% | Per release |
| Input type recommendations | 100% | Per update |
| Form security checklist | 100% | Quarterly |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Form components built using patterns from 032
- **RADIX-SURGEON (035)**: Forms follow a11y patterns from 035
- **DESIGN-TOKENSMITH (031)**: Form styling uses tokens from 031
- **ERROR-DIPLOMAT (040)**: Form errors displayed via 040's patterns

### Contribution to the Whole

Forms are how users interact with TALLOW—creating rooms, configuring transfer settings, adjusting preferences. Agent 036 ensures forms are simple to use, clearly communicate errors, and respect accessibility standards. A well-designed form reduces friction and increases user satisfaction.

### Failure Impact Assessment

**Critical Failure**: Form submission succeeds silently without feedback
- Impact: User doesn't know if data was saved; double-submissions result
- Detection: User testing; server logs
- Recovery: Add submission feedback (toast, page update); disable submit button during loading

**High Failure**: Error messages don't help users fix problems
- Impact: Users are confused and frustrated; abandon form
- Detection: User testing; analytics on form abandonment
- Recovery: Write clear, actionable error messages; link errors to specific fields

**High Failure**: Password input shows plain text (no masking)
- Impact: Security risk; passwords visible to onlookers
- Detection: Manual inspection; security audit
- Recovery: Use type="password" on input; ensure it's not hardcoded as type="text"

**Medium Failure**: Form doesn't work without JavaScript
- Impact: Users with JS disabled (or in slow networks) can't submit
- Detection: Testing with JS disabled
- Recovery: Ensure form is progressively enhanced; basic submission works without JS

**Medium Failure**: Focus doesn't move to first error on validation fail
- Impact: Users don't know where the error is
- Detection: Accessibility testing; keyboard navigation
- Recovery: Implement focus management; focus first invalid field on submit

### Operational Rules

1. **Labels Required**: Every form input must have an associated label. Never use placeholder as label.

2. **Progressive Enhancement**: Forms must submit and work even if JavaScript fails. JavaScript enhances the experience but isn't required.

3. **Zod for Validation**: All form validation uses Zod schema. No inline validation logic; keep schema as single source of truth.

4. **Clear Error Messages**: Error messages must be specific and actionable. "Invalid" is not helpful; "Email must be lowercase and include @domain" is helpful.

5. **Submission Feedback Required**: Users must know the form was submitted. Use loading state, success message, or redirect.

6. **Type Attributes Matter**: Use appropriate input types (email, password, tel, number). This enables browser autocomplete and mobile keyboards.

7. **Autocomplete Support**: Add autocomplete attributes (email, password, name, address-line1, etc.) to enable browser autofill.

---

## ┌─ AGENT 037 — TABLE-TACTICIAN ────────────────────────────────┐
## │ Specialty: Data Tables, Lists & Virtualization               │
## │ Codename: TT-TABLESMSTER                                     │
## │ Reports To: Chief (030)                                      │
## │ Primary Artifacts: Tables, file lists, transfer queues       │
## └──────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 037 — TABLE-TACTICIAN
Clearance: FULL (Data Display)
Authority: Define table/list standards; manage data visualization
Risk Level: MEDIUM (bad tables make data hard to navigate)
Specialization: Tables, virtualization, sorting, filtering, pagination
Technology: React, CSS Modules, virtualized lists (react-window)
```

### Mission Statement

Agent 037 designs components for displaying large datasets in a clear, accessible, and performant manner. The agent owns:

1. **Data tables** (files, devices, connections, transfer history)
2. **File galleries** and lists
3. **Transfer queue** visualization
4. **Device grids**
5. **Virtualized lists** (for performance with thousands of items)
6. **Sorting, filtering, pagination**
7. **Accessibility** (semantic table markup, ARIA labels)
8. **Responsive data display** (mobile-friendly card view option)

### Scope of Authority

**Data Display Components**:

1. **Table Component**
   ```typescript
   interface Column<T> {
     key: keyof T;
     header: string;
     sortable?: boolean;
     render?: (value: any, row: T) => ReactNode;
     width?: string;
   }

   interface TableProps<T> {
     data: T[];
     columns: Column<T>[];
     onSort?: (key: keyof T, direction: 'asc' | 'desc') => void;
     onRowClick?: (row: T) => void;
     striped?: boolean;
     compact?: boolean;
   }
   ```
   - Semantic table markup
   - Sortable columns
   - Row selection (checkbox)
   - Row actions (context menu or action buttons)
   - Responsive (stacks on mobile)
   - Keyboard navigation

2. **File List Component**
   - File icon + name
   - File size, type, date modified
   - Download/delete actions
   - Drag-to-reorder support
   - Multi-select with checkbox
   - Search/filter capability

3. **Transfer Queue Component**
   - List of active/pending transfers
   - Progress bars
   - Speed metrics
   - Pause/cancel buttons
   - Completion time estimate

4. **Device Grid Component**
   - Card-based layout of nearby devices
   - Device name, signal strength, status
   - Quick connect button
   - Device details modal on click

5. **Virtualized List**
   - Renders only visible items (performance)
   - Scrolls through thousands of items smoothly
   - Used for large file lists, transfer history

### Quality Standards

**Table Implementation Checklist**:

```
☐ Table uses semantic `<table>` element
☐ Table headers use `<th>` with scope attribute
☐ Table body uses `<tbody>` for data rows
☐ Column headers are keyboard accessible
☐ Sorting is accessible (aria-sort attribute)
☐ Row selection uses proper checkboxes (not divs)
☐ Focus is visible when navigating with keyboard
☐ Table title or caption provided (aria-labelledby or <caption>)
☐ Tab order makes sense (left to right, top to bottom)
☐ Mobile display uses appropriate layout (card or horizontal scroll)
☐ Empty state is clearly communicated
☐ Loading state is indicated (skeleton rows or spinner)
☐ Pagination or virtual scroll for large datasets
☐ Sort order indicators are clear (up/down arrow, aria-sort)
```

**Table Pattern**:

```typescript
// ✓ CORRECT — Accessible data table

export interface FileData {
  id: string;
  name: string;
  size: number;
  modified: Date;
  type: string;
}

interface FileTableProps {
  files: FileData[];
  onDelete: (id: string) => void;
}

export const FileTable = React.memo(function FileTable({
  files,
  onDelete,
}: FileTableProps) {
  const [sortKey, setSortKey] = useState<keyof FileData>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = [...files].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof FileData) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <table className={styles.table} role="grid">
      <caption className={styles.srOnly}>List of files</caption>
      <thead>
        <tr>
          <th
            scope="col"
            onClick={() => handleSort('name')}
            role="columnheader"
            aria-sort={sortKey === 'name' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Name
            {sortKey === 'name' && (
              <span aria-hidden="true">
                {sortDir === 'asc' ? ' ↑' : ' ↓'}
              </span>
            )}
          </th>
          <th scope="col">Size</th>
          <th scope="col">Modified</th>
          <th scope="col" aria-label="Actions">
            Actions
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map(file => (
          <tr key={file.id}>
            <td>{file.name}</td>
            <td>{formatBytes(file.size)}</td>
            <td>{file.modified.toLocaleDateString()}</td>
            <td>
              <button
                onClick={() => onDelete(file.id)}
                aria-label={`Delete ${file.name}`}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
});
```

**Virtualization Pattern (react-window)**:

```typescript
// ✓ CORRECT — Virtual list for 10,000+ items

import { FixedSizeList } from 'react-window';

interface VirtualFileListProps {
  files: FileData[];
  itemHeight: number;
}

export const VirtualFileList = React.memo(function VirtualFileList({
  files,
  itemHeight = 48,
}: VirtualFileListProps) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style} className={styles.row}>
      <span>{files[index].name}</span>
      <span>{formatBytes(files[index].size)}</span>
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={files.length}
      itemSize={itemHeight}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
});
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Table component with examples | 100% | Per release |
| Virtual list documentation | 100% | Per update |
| Sorting/filtering guide | 100% | Per release |
| Pagination strategy guide | 100% | Per release |
| Empty/loading state examples | 100% | Per update |
| Table accessibility audit | 100% | Quarterly |
| Responsive table testing | 100% | Quarterly |
| Performance report (large datasets) | 100% | Quarterly |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Tables built using component patterns from 032
- **RADIX-SURGEON (035)**: Tables follow a11y standards from 035
- **ICON-ARMORER (038)**: Table icons provided by 038
- **LOADING-ILLUSIONIST (039)**: Loading states coordinated with 039

### Contribution to the Whole

Tables are where users review their transfer history, see connected devices, and manage files. Agent 037 ensures this information is presented clearly, navigable by keyboard, and performant even with thousands of rows.

### Failure Impact Assessment

**High Failure**: Table has 10,000 rows but renders all (causes jank)
- Impact: Page becomes unresponsive; scrolling is janky
- Detection: Performance profiling; scrolling test with large dataset
- Recovery: Implement virtualization (react-window); only render visible rows

**High Failure**: Table is not accessible (semantic HTML not used)
- Impact: Screen reader users can't navigate table
- Detection: Screen reader testing; accessibility audit
- Recovery: Use semantic `<table>`, `<th>`, `<tbody>` elements

**Medium Failure**: Sort direction is not clear (no visual indicator)
- Impact: Users don't know which column is sorted or in what direction
- Detection: User testing; visual inspection
- Recovery: Add arrow icon or text indicator; use aria-sort attribute

**Medium Failure**: Table doesn't respond on mobile (content overflows)
- Impact: Mobile users can't see data or interact with table
- Detection: Mobile browser testing
- Recovery: Implement responsive design (card view or horizontal scroll on mobile)

### Operational Rules

1. **Semantic Markup Required**: Always use `<table>`, `<th>`, `<tbody>`. Divs masquerading as tables are not accessible.

2. **Virtualization for Large Datasets**: If dataset is > 100 rows, use virtualization (react-window) to maintain performance.

3. **Sort Indicators Visible**: When a column is sorted, show a clear visual indicator (arrow) and expose sort state via aria-sort.

4. **Keyboard Navigation**: Users must be able to navigate tables with Tab key, arrow keys for row/column selection.

5. **Empty States Handled**: When data is empty, show a message explaining why (no files uploaded, no transfers yet, etc.).

6. **Loading States Clear**: When data is loading, show skeleton rows or spinner, not empty table.

---

## ┌─ AGENT 038 — ICON-ARMORER ────────────────────────────────┐
## │ Specialty: Icon Systems & SVG Management                  │
## │ Codename: IA-ICONSMITH                                    │
## │ Reports To: Chief (030)                                   │
## │ Primary Artifacts: Lucide icons, custom SVGs, icon lib    │
## └──────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 038 — ICON-ARMORER
Clearance: FULL (Icon System)
Authority: Define icon standards; curate icon library
Risk Level: LOW (icons are mostly presentational)
Specialization: SVG, Lucide React, icon design, custom badges
Technology: Lucide React library + custom SVG components
```

### Mission Statement

Agent 038 manages the icon system—both consuming Lucide React icons and creating custom branded SVGs. The agent ensures:

1. **Consistent icon sizing** across the platform
2. **Semantic icon usage** (right icon for the right purpose)
3. **Custom branded icons** (PQC shield, encryption badge, file types)
4. **Icon accessibility** (aria-label, aria-hidden)
5. **SVG performance** (optimized files, proper export)
6. **Icon color tokens** (icons inherit color from context)

### Scope of Authority

**Icon Categories**:

1. **Lucide React Icons** (External Library)
   - Search, download, upload, delete, edit, copy
   - Share, lock, shield, check, x, alert, info
   - Menu, user, settings, help, external-link
   - File type icons (pdf, doc, video, image, etc.)
   - Platform icons (windows, mac, linux, mobile)

2. **Custom Branded Icons**
   - PQC Shield (post-quantum cryptography)
   - Encryption lock (enhanced variant)
   - Transfer arrows (left-right, up-down)
   - Device icons (phone, laptop, tablet, desktop)
   - Connection status indicators

3. **File Type Icons**
   - Document (pdf, doc, docx, txt, markdown)
   - Image (jpg, png, gif, svg, webp)
   - Video (mp4, mkv, avi, mov)
   - Audio (mp3, wav, aac, flac)
   - Archive (zip, rar, 7z, tar)
   - Code (js, ts, py, go, rust)

4. **Status/Indicator Icons**
   - Connection status (online, offline, connecting)
   - Transfer status (uploading, downloading, paused, complete)
   - Encryption status (secured, warning)
   - Device status (paired, unpaired)

### Quality Standards

**Icon Implementation Checklist**:

```
☐ Icon size is consistent (16px, 24px, 32px—no random sizes)
☐ Icon uses strokeWidth="2" or strokeWidth="1.5" for consistency
☐ Icon color inherits from `currentColor` (uses text color)
☐ Icon has aria-label (if conveying meaning) or aria-hidden="true" (if decorative)
☐ Icon is centered properly (viewBox="0 0 24 24" standard)
☐ Icon passes WCAG color contrast (if solid color, meets 3:1)
☐ Custom SVG is optimized (no extra attributes, clean paths)
☐ Icon file size is < 2KB (optimized)
☐ Icon works with transparent background (no white background in SVG)
☐ Icon scales properly (no stretching, aspect ratio preserved)
```

**Icon Usage Pattern**:

```typescript
// ✓ CORRECT — Icon as decoration (aria-hidden)

<Button icon={<SearchIcon size={18} />} aria-label="Search">
  Search
</Button>

// ✓ CORRECT — Icon-only button (icon has aria-label)

<IconButton
  icon={<DownloadIcon size={20} />}
  aria-label="Download file"
  onClick={handleDownload}
/>

// ✓ CORRECT — Custom SVG icon

export const PQCShield = React.forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 1L3 5v6c0 7 9 11 9 11s9-4 9-11V5l-9-4z" />
      <path d="M12 12l-3-3m3 3l3-3m0 6l-3 3m3-3l3 3" />
    </svg>
  )
);

PQCShield.displayName = 'PQCShield';
```

**File Type Icon Mapper**:

```typescript
// ✓ CORRECT — Map file extensions to icons

interface FileTypeIcon {
  extension: string;
  icon: React.ComponentType<IconProps>;
  label: string;
}

const FILE_TYPE_ICONS: FileTypeIcon[] = [
  { extension: 'pdf', icon: FileIcon, label: 'PDF Document' },
  { extension: 'doc', icon: FileIcon, label: 'Word Document' },
  { extension: 'docx', icon: FileIcon, label: 'Word Document' },
  { extension: 'zip', icon: FileIcon, label: 'Archive' },
  { extension: 'jpg', icon: ImageIcon, label: 'Image' },
  { extension: 'png', icon: ImageIcon, label: 'Image' },
  { extension: 'mp4', icon: VideoIcon, label: 'Video' },
  { extension: 'mp3', icon: MusicIcon, label: 'Audio' },
  // ... more types
];

export function getFileIcon(
  filename: string
): React.ComponentType<IconProps> {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const match = FILE_TYPE_ICONS.find(fti => fti.extension === ext);
  return match?.icon || FileIcon;
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Icon library documentation | 100% | Per release |
| Custom SVG icon collection | 100% | Per feature |
| File type icon mapper | 100% | Per update |
| Icon sizing guide | 100% | Per release |
| Icon accessibility checklist | 100% | Quarterly |
| Lucide icon audit (used vs. unused) | 100% | Quarterly |
| SVG optimization report | 100% | Quarterly |
| Icon color inheritance guide | 100% | Per update |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Icons passed as props to components
- **DESIGN-TOKENSMITH (031)**: Icon colors use color tokens
- **All UI agents**: Use icons through Agent 038's library

### Contribution to the Whole

Icons are the visual language of the interface alongside typography. Agent 038 ensures every icon serves a purpose, is consistently sized, and is accessible. A well-designed icon system makes the interface more intuitive and professional.

### Failure Impact Assessment

**Medium Failure**: Icon color doesn't have enough contrast
- Impact: Users with low vision can't see icon
- Detection: Contrast checker; visual inspection
- Recovery: Darken icon color or increase stroke width

**Low Failure**: Icon is hardcoded size instead of using size prop
- Impact: Icon can't scale; looks inconsistent at different scales
- Detection: Code review; visual inspection
- Recovery: Extract size to prop; make icons responsive

**Low Failure**: Decorative icon has aria-label (causes verbosity for screen reader users)
- Impact: Screen reader announces unnecessary icon description
- Detection: Screen reader testing
- Recovery: Use aria-hidden="true" on decorative icons

### Operational Rules

1. **Size Consistency**: Icons are 16px, 20px, 24px, or 32px. No arbitrary sizes.

2. **Lucide First**: Use Lucide React icons when available. Only create custom SVGs when Lucide doesn't have the icon.

3. **currentColor for Color**: Icons inherit color from parent element's text color. Never hardcode icon colors.

4. **SVG Optimization**: All custom SVGs are optimized (use SVGO tool). No extra markup, no unnecessary attributes.

5. **Accessibility**: Decorative icons have aria-hidden="true". Meaningful icons have aria-label or are accompanied by text labels.

6. **Semantic Usage**: Use icon+text together to make meaning clear. Icon-only buttons must have aria-label.

---

## ┌─ AGENT 039 — LOADING-ILLUSIONIST ────────────────────────────┐
## │ Specialty: Loading States & Skeleton Screens                 │
## │ Codename: LI-LOADINGSMITH                                    │
## │ Reports To: Chief (030)                                      │
## │ Primary Artifacts: Spinners, skeletons, shimmer animations  │
## └────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 039 — LOADING-ILLUSIONIST
Clearance: FULL (Loading States)
Authority: Define loading state standards; manage perception
Risk Level: MEDIUM (bad loading states frustrate users)
Specialization: Skeleton screens, spinners, shimmer effects, timing
Technology: CSS animations, React Suspense boundaries
```

### Mission Statement

Agent 039 designs loading states that make users feel like the app is responsive, even when waiting for data. The agent manages:

1. **Spinner animations** (indeterminate progress)
2. **Skeleton screens** (content placeholders)
3. **Shimmer effects** (skeleton loading visual)
4. **Progress bars** (for determinate progress)
5. **Loading text** (e.g., "Loading files...")
6. **Suspense boundaries** (React Suspense integration)
7. **Accessibility** (aria-busy, aria-label, screen reader support)

The goal is to reduce perceived wait time and give users confidence that the app is working.

### Scope of Authority

**Loading Components**:

1. **Spinner Component**
   - Rotating icon
   - Centered, inline, or as overlay
   - Customizable size and color
   - Uses CSS animation (not JavaScript)
   - Respects prefers-reduced-motion

2. **Skeleton Screen**
   - Placeholder shapes (rect, circle)
   - Shimmer animation (pulse or wave)
   - Matches layout of actual content
   - Used when waiting for data fetch

3. **Progress Bar**
   - Indeterminate (loading, no progress estimate)
   - Determinate (showing actual progress %)
   - Linear or circular variant
   - Animated fill

4. **Loading Text**
   - Animated ellipsis ("Loading...")
   - Dynamic messages ("Loading 42 files...")
   - Countdown timer for long operations

5. **Suspense Boundary**
   - Wraps async components
   - Shows fallback (skeleton) while loading
   - Automatic error boundary

### Quality Standards

**Loading State Checklist**:

```
☐ Spinner uses CSS animation (no JavaScript)
☐ Spinner respects prefers-reduced-motion (stops spinning or becomes static)
☐ Skeleton matches layout of real content
☐ Skeleton has shimmer or pulse effect (not static)
☐ Loading state is announced to screen readers (aria-busy)
☐ Loading state has aria-label describing what's loading
☐ Progress bar shows meaningful progress (not fake incrementing)
☐ Long operations (> 2s) show loading indicator
☐ Skeleton screen removes flashing (smooth fade-in)
☐ Loading message is not overly technical
☐ Color contrast sufficient for spinner/progress bar
☐ Loading component doesn't shift layout (fixed size)
```

**Spinner Pattern**:

```typescript
// ✓ CORRECT — Accessible spinner

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ size = 'md', label = 'Loading', className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`${styles.spinner} ${styles[size]} ${className}`}
      role="status"
      aria-label={label}
      aria-busy="true"
      {...props}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" />
      </svg>
    </div>
  )
);

Spinner.displayName = 'Spinner';
```

**Skeleton Pattern**:

```typescript
// ✓ CORRECT — Skeleton screen with shimmer

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
  count?: number;
  animation?: 'pulse' | 'shimmer' | 'wave';
}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      width = '100%',
      height = '1em',
      variant = 'rect',
      count = 1,
      animation = 'shimmer',
      className = '',
      ...props
    },
    ref
  ) => {
    const skeletons = Array.from({ length: count }, (_, i) => (
      <div
        key={i}
        ref={i === 0 ? ref : null}
        className={`${styles.skeleton} ${styles[variant]} ${styles[animation]} ${className}`}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
        aria-busy="true"
        {...props}
      />
    ));

    return <>{skeletons}</>;
  }
);

Skeleton.displayName = 'Skeleton';

// Usage:
<Skeleton height={24} width="80%" count={3} animation="shimmer" />
```

**Shimmer Animation (CSS)**:

```css
/* Shimmer effect */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-2) 0%,
    var(--bg-3) 20%,
    var(--bg-2) 40%,
    var(--bg-2) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite;
}

/* Pulse effect */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton.pulse {
  animation: pulse 2s var(--ease) infinite;
}
```

**Suspense Integration**:

```typescript
// ✓ CORRECT — Suspense boundary with skeleton fallback

export function FileListPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.skeleton}>
          <Skeleton height={48} count={5} gap={8} />
        </div>
      }
    >
      <FileList />
    </Suspense>
  );
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Spinner component + variants | 100% | Per release |
| Skeleton screen patterns | 100% | Per feature |
| Shimmer animation library | 100% | Per update |
| Loading text animation | 100% | Per release |
| Progress bar component | 100% | Per update |
| Suspense boundary guide | 100% | Per feature |
| Accessibility audit (loading states) | 100% | Quarterly |
| Loading UX best practices guide | 100% | Per release |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: Spinner/skeleton colors use tokens
- **MOTION-CHOREOGRAPHER (033)**: Loading animations coordinate with 033
- **COMPONENT-FORGER (032)**: Loading components built using patterns from 032

### Contribution to the Whole

Perceived performance is as important as actual performance. A well-designed loading state makes users feel like the app is responsive, even if it's waiting for data. Agent 039 creates that illusion through subtle animations and clear feedback.

### Failure Impact Assessment

**Medium Failure**: Loading spinner doesn't respect prefers-reduced-motion
- Impact: Users with motion sensitivity see distracting spinning animation
- Detection: User complaint; accessibility testing
- Recovery: Add @media (prefers-reduced-motion) to stop animation

**Medium Failure**: Skeleton doesn't match real content size (layout shift)
- Impact: Page jumps when content loads; jarring experience
- Detection: Manual testing; Cumulative Layout Shift (CLS) metrics
- Recovery: Make skeleton match real content dimensions exactly

**Low Failure**: Loading indicator appears immediately (no delay)
- Impact: Even fast loads show spinner; looks janky
- Detection: User testing; performance monitoring
- Recovery: Add 200-300ms delay before showing spinner

**Low Failure**: Spinner uses JavaScript instead of CSS animation
- Impact: Slightly less smooth; adds JS overhead
- Detection: Code review; performance profile
- Recovery: Convert to CSS @keyframes animation

### Operational Rules

1. **CSS Animations Only**: Spinners and shimmer effects use CSS @keyframes, not JavaScript or gif images.

2. **Respect prefers-reduced-motion**: All loading animations include a fallback for users who prefer reduced motion.

3. **Skeleton Size Matters**: Skeleton dimensions must match the real content to prevent layout shift.

4. **No Fake Progress**: Don't increment a progress bar if progress is unknown. Use indeterminate state instead.

5. **Meaningful Messages**: Loading messages should explain what's being loaded ("Loading 42 files..." not just "Loading...").

6. **Accessible to Screen Readers**: Use aria-busy="true" and aria-label to announce loading state.

---

## ┌─ AGENT 040 — ERROR-DIPLOMAT ──────────────────────────────┐
## │ Specialty: Error States & Error Boundaries                │
## │ Codename: ED-ERRORSMITH                                   │
## │ Reports To: Chief (030)                                   │
## │ Primary Artifacts: Error UI, error boundaries, fallbacks  │
## └────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 040 — ERROR-DIPLOMAT
Clearance: FULL (Error Handling)
Authority: Define error state standards; manage error UX
Risk Level: HIGH (bad error messages frustrate users; good ones empower them)
Specialization: Error boundaries, error messages, retry logic, graceful degradation
Technology: React Error Boundaries, error UI patterns
```

### Mission Statement

Agent 040 designs error states that don't panic users—instead, they explain what went wrong, why it happened, and how to fix it. The agent manages:

1. **Error boundaries** (catch React component errors)
2. **Error messages** (clear, actionable copy)
3. **Error UI** (visual design of error states)
4. **Retry mechanisms** (let users retry failed operations)
5. **Network error handling** (offline detection, reconnection)
6. **Validation errors** (form feedback)
7. **Server errors** (5xx, 4xx, timeout)
8. **Accessibility** (error announcements, focus management)

### Scope of Authority

**Error Handling Components**:

1. **Error Boundary**
   ```typescript
   interface ErrorBoundaryProps {
     children: ReactNode;
     fallback?: (error: Error, reset: () => void) => ReactNode;
     onError?: (error: Error, errorInfo: ErrorInfo) => void;
   }
   ```
   - Catches errors in child components
   - Displays fallback UI
   - Logs error to monitoring service
   - Provides reset button

2. **Error Alert**
   - Prominent error message
   - Icon + color (red/danger)
   - Optional error code
   - Dismiss or retry button
   - Related help link

3. **Validation Error**
   - Inline error under form field
   - Associated with input via aria-describedby
   - Clear, actionable message
   - Appears on blur or submit

4. **Network Error**
   - "No internet connection" banner
   - Offline indicator
   - Auto-reconnect when online
   - Queued operations resume

5. **Timeout Error**
   - "Request timed out" message
   - Retry button
   - Auto-retry with exponential backoff

6. **Empty State / No Data**
   - When data is empty (not an error, but looks similar)
   - Icon + helpful message
   - Suggested next action

### Quality Standards

**Error State Checklist**:

```
☐ Error message is human-readable (not "Error: CODE_500")
☐ Error message explains what went wrong
☐ Error message suggests how to fix (if applicable)
☐ Error icon is visible and uses error color
☐ Error is announced to screen readers (role="alert")
☐ Focus moves to error message on validation fail
☐ Retry button is present for transient errors
☐ Error boundary catches and logs unexpected errors
☐ Error doesn't expose sensitive information (stack trace, API keys)
☐ Network error detection works offline
☐ Timeout errors have auto-retry logic
☐ Form validation errors are linked to fields (aria-describedby)
☐ Error color contrasts sufficiently (3:1 minimum)
```

**Error Message Patterns**:

```
✓ GOOD: "Your email address is invalid. Please check it includes an '@' symbol."
✗ BAD: "Invalid email format"

✓ GOOD: "File size exceeds 100MB. Please choose a smaller file or split it into chunks."
✗ BAD: "File too large"

✓ GOOD: "The connection timed out. Check your internet and try again."
✗ BAD: "Request timeout"

✓ GOOD: "Unable to save settings. This might be a temporary issue. Try again or contact support."
✗ BAD: "Save failed"
```

**Error Boundary Pattern**:

```typescript
// ✓ CORRECT — Error boundary with recovery

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
    // Could send to Sentry, LogRocket, etc.
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.reset)
      ) : (
        <div role="alert" className={styles.errorContainer}>
          <h2>Something went wrong</h2>
          <p>{this.state.error.message}</p>
          <Button onClick={this.reset}>Try Again</Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Validation Error Pattern**:

```typescript
// ✓ CORRECT — Linked input error

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random()}`;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={styles.inputGroup}>
        {label && <label htmlFor={inputId}>{label}</label>}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
          {...props}
        />
        {error && (
          <div id={errorId} role="alert" className={styles.error}>
            {error}
          </div>
        )}
        {hint && <div className={styles.hint}>{hint}</div>}
      </div>
    );
  }
);
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Error boundary component | 100% | Per release |
| Error message library | 100% | Per release |
| Error UI patterns | 100% | Per update |
| Network error handling guide | 100% | Per release |
| Validation error strategy | 100% | Per feature |
| Error logging integration | 100% | Per release |
| Accessibility audit (errors) | 100% | Quarterly |
| Error recovery guide | 100% | Per release |

### Inter-Agent Dependencies

- **COMPONENT-FORGER (032)**: Error UI built using component patterns
- **RADIX-SURGEON (035)**: Error messages accessible per 035's standards
- **NOTIFICATION-HERALD (041)**: Error alerts may use toast system
- **FORM-ARCHITECT (036)**: Validation errors coordinated with 036

### Contribution to the Whole

Errors happen. The difference between a frustrating experience and a helpful one is how errors are communicated. Agent 040 ensures that when things go wrong, users understand what happened and how to proceed.

### Failure Impact Assessment

**High Failure**: Error boundary crashes instead of catching error
- Impact: Entire page goes white; user sees nothing
- Detection: User reports; error monitoring
- Recovery: Ensure error boundary is properly implemented; test with test component that throws

**High Failure**: Error message is confusing or unhelpful
- Impact: User doesn't know how to fix the problem
- Detection: User testing; support tickets
- Recovery: Rewrite error message to be clear and actionable

**Medium Failure**: Validation error not linked to input field
- Impact: Screen reader users don't know which field has error
- Detection: Screen reader testing
- Recovery: Add aria-describedby linking error to input

**Medium Failure**: Network error detection doesn't work offline
- Impact: User keeps trying operations that require internet
- Detection: Testing with internet disabled
- Recovery: Implement offline detection; show offline banner; queue operations

### Operational Rules

1. **Readable > Technical**: Error messages use plain language. No error codes, stack traces, or API jargon.

2. **Actionable**: Every error message suggests a next step. Don't just say what's wrong; explain how to fix it.

3. **Safe**: Never expose sensitive information in error messages (API keys, database paths, system info).

4. **Accessible**: Error messages use role="alert" and are announced to screen readers. Focus moves to error on validation fail.

5. **Retry Available**: Transient errors (network, timeout) have a retry button. Don't make users reload the page.

6. **Monitored**: Errors are logged to a monitoring service (Sentry, LogRocket) for visibility into production issues.

7. **Graceful Degradation**: When features fail, show a helpful error instead of breaking the entire page.

---

## ┌─ AGENT 041 — NOTIFICATION-HERALD ────────────────────────────┐
## │ Specialty: Toast Notifications & Rich Notifications          │
## │ Codename: NH-NOTIFICATIONSMITH                               │
## │ Reports To: Chief (030)                                      │
## │ Primary Artifacts: Toast system, notification UI             │
## └────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 041 — NOTIFICATION-HERALD
Clearance: FULL (Notification System)
Authority: Define notification standards; manage notification UX
Risk Level: MEDIUM (bad notifications are annoying; good ones are helpful)
Specialization: Toast notifications, notification queue, rich notifications
Technology: Toast library (headless or custom), notification context
```

### Mission Statement

Agent 041 manages notifications that keep users informed without being intrusive. The agent owns:

1. **Toast notifications** (brief messages that auto-dismiss)
2. **Rich notifications** (file preview + accept/reject)
3. **Transfer request notifications** (incoming transfer alerts)
4. **Notification queue** (multiple notifications stack)
5. **Notification types** (success, error, warning, info)
6. **Accessibility** (announced to screen readers, keyboard dismissible)
7. **Positioning** (bottom-right, respects safe area on mobile)

### Scope of Authority

**Notification Components**:

1. **Toast Notification**
   ```typescript
   interface ToastProps {
     id: string;
     title: string;
     description?: string;
     type: 'success' | 'error' | 'warning' | 'info';
     duration?: number; // ms, default 5000
     icon?: ReactNode;
     action?: { label: string; onClick: () => void };
   }
   ```
   - Auto-dismisses (or persistent if action needed)
   - Stack vertically with spacing
   - Dismissible via button or Escape key
   - Color-coded by type

2. **Rich Notification** (File Transfer Request)
   - File preview (image thumbnail, icon for others)
   - File name, size
   - Sender name / device
   - Accept / Reject buttons
   - Not auto-dismissing (user action required)

3. **Notification System** (Context Provider)
   - Toast management
   - Notification queue
   - Accessibility support
   - Does not require API; uses context

### Quality Standards

**Notification Checklist**:

```
☐ Toast has title and optional description
☐ Toast type (success, error, warning, info) is clear
☐ Toast color contrasts sufficiently
☐ Toast is dismissible (close button or Escape)
☐ Toast doesn't block page content (positioned in corner)
☐ Toast is announced to screen readers (role="status")
☐ Multiple toasts stack without overlapping
☐ Toast auto-dismisses after appropriate duration
☐ Action in toast is keyboard accessible
☐ Rich notification has clear image/icon preview
☐ Rich notification has prominent accept/reject
☐ Notification respects safe area on mobile
☐ Notification has escape key support
☐ Notification backdrop doesn't prevent interaction with page
```

**Toast Pattern**:

```typescript
// ✓ CORRECT — Toast notification system

import { createContext, useContext, useCallback, useState } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface NotificationContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID();
      const duration = toast.duration ?? 5000;

      setToasts(prev => [...prev, { ...toast, id }]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

// Usage:
const { addToast } = useNotification();
addToast({
  title: 'File uploaded',
  description: 'presentation.pdf (24.8 MB)',
  type: 'success',
  duration: 5000,
});
```

**Rich Notification Pattern** (File Transfer Request):

```typescript
// ✓ CORRECT — Rich notification with file preview

interface TransferRequestNotificationProps {
  id: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  senderName: string;
  senderDevice: string;
  preview?: string; // Data URL for preview image
  onAccept: () => void;
  onReject: () => void;
}

export const TransferRequestNotification = React.memo(
  function TransferRequestNotification({
    id,
    fileName,
    fileSize,
    fileType,
    senderName,
    senderDevice,
    preview,
    onAccept,
    onReject,
  }: TransferRequestNotificationProps) {
    return (
      <div
        className={styles.richNotification}
        role="alertdialog"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
      >
        {preview ? (
          <img src={preview} alt={fileName} className={styles.preview} />
        ) : (
          <div className={styles.previewIcon}>
            {getFileIcon(fileType)}
          </div>
        )}

        <div className={styles.content}>
          <h3 id={`${id}-title`}>{fileName}</h3>
          <p id={`${id}-desc`}>
            {fileSize} from {senderName} ({senderDevice})
          </p>
        </div>

        <div className={styles.actions}>
          <Button
            variant="accent"
            size="sm"
            onClick={onAccept}
            aria-label={`Accept ${fileName}`}
          >
            Accept
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReject}
            aria-label={`Reject ${fileName}`}
          >
            Reject
          </Button>
        </div>
      </div>
    );
  }
);
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Toast notification component | 100% | Per release |
| Rich notification examples | 100% | Per feature |
| Notification context provider | 100% | Per release |
| Toast duration guide | 100% | Per release |
| Notification accessibility audit | 100% | Quarterly |
| Notification positioning guide | 100% | Per update |
| Toast action patterns | 100% | Per release |
| Notification queue management guide | 100% | Per update |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: Toast colors use tokens
- **COMPONENT-FORGER (032)**: Toast UI built using component patterns
- **ICON-ARMORER (038)**: Toast icons provided by 038
- **ERROR-DIPLOMAT (040)**: Error toasts coordinated with 040

### Contribution to the Whole

Notifications are how TALLOW keeps users informed about transfers, requests, and actions. Agent 041 ensures these messages are timely, non-intrusive, and helpful. A good notification feels like a friendly voice in the app; a bad one feels like spam.

### Failure Impact Assessment

**Medium Failure**: Toasts block interaction with page (modal-like behavior)
- Impact: User can't interact with app while notification is showing
- Detection: Manual testing; user complaint
- Recovery: Position toasts in corner; don't overlay main content

**Medium Failure**: Toast auto-dismisses too quickly (user can't read it)
- Impact: User misses important information
- Detection: User testing; observing if users read toast
- Recovery: Increase default duration to 5-7 seconds; add action to make persistent

**Low Failure**: Multiple toasts overlap (can't see both)
- Impact: Notifications are hidden behind each other
- Detection: Manual testing with multiple toasts
- Recovery: Stack toasts vertically with proper spacing

**Low Failure**: Toast is not announced to screen readers
- Impact: Screen reader users don't know notification appeared
- Detection: Screen reader testing
- Recovery: Use role="status" or role="alert" on toast container

### Operational Rules

1. **Non-Modal Default**: Toasts appear in the corner and don't prevent interaction with the page.

2. **Auto-Dismiss with Restraint**: Toasts auto-dismiss after 5000ms by default. Longer durations for important messages; no dismiss for actions requiring user response.

3. **One Type Per Toast**: Each toast is a single type (success, error, warning, info). Don't mix concerns.

4. **Icon + Color**: Each toast type has an associated icon and color for quick recognition.

5. **Accessible**: Toasts use role="status" (for non-urgent updates) or role="alert" (for urgent). They're announced to screen readers.

6. **Positioned Responsibly**: Toasts don't overlap the action bar on mobile. They respect safe area insets.

---

## ┌─ AGENT 042 — MODAL-MASTER ────────────────────────────────┐
## │ Specialty: Dialogs, Sheets & Modal Patterns               │
## │ Codename: MM-MODALSMITH                                   │
## │ Reports To: Chief (030)                                   │
## │ Primary Artifacts: Modal, Sheet, Dialog, Command Palette  │
## └────────────────────────────────────────────────────────────┘

### Identity Card

```
Agent 042 — MODAL-MASTER
Clearance: FULL (Modal System)
Authority: Define modal patterns; manage modal UX
Risk Level: HIGH (bad modals trap users; good ones empower them)
Specialization: Accessible dialogs, focus traps, sheet slides, command palette
Technology: React Portals, focus management, Escape key handling
```

### Mission Statement

Agent 042 designs modal interfaces that capture user attention without trapping them. The agent manages:

1. **Modal dialogs** (centered, with overlay)
2. **Sheets** (slide-in from bottom/side)
3. **Confirmation dialogs** (destructive action confirm)
4. **Alert dialogs** (urgent information)
5. **Command palette** (searchable command interface)
6. **Focus trapping** (focus stays in modal)
7. **Keyboard navigation** (Escape to close, Tab within modal)
8. **Accessibility** (ARIA, focus restoration)

### Scope of Authority

**Modal Components**:

1. **Modal Dialog**
   ```typescript
   interface ModalProps {
     isOpen: boolean;
     onClose: () => void;
     title: string;
     children: ReactNode;
     size?: 'sm' | 'md' | 'lg';
     footer?: ReactNode;
     closeButton?: boolean;
   }
   ```
   - Centered on screen
   - Overlay darkens background
   - Escape key closes modal
   - Focus trapped inside modal
   - Focus restored on close

2. **Confirmation Dialog**
   - Question in clear language
   - Two buttons (confirm/cancel)
   - Confirm button is danger color if destructive
   - Escape cancels dialog

3. **Sheet (Bottom Sheet)**
   - Slides in from bottom (mobile) or side (desktop)
   - Partial height on mobile, full height possible
   - Swipe gesture to close (mobile)
   - Keyboard navigation supported

4. **Command Palette**
   - Keyboard-triggered (⌘K or Ctrl+K)
   - Searchable command list
   - Arrow key navigation
   - Enter to execute command
   - Escape to close

5. **Alert Dialog** (Urgent)
   - Like modal but can't be dismissed by clicking overlay
   - Requires explicit button action
   - role="alertdialog"

### Quality Standards

**Modal Accessibility Checklist**:

```
☐ Modal has title (aria-labelledby)
☐ Modal has optional description (aria-describedby)
☐ Modal is marked as modal (aria-modal="true")
☐ Focus trap prevents focus from escaping modal
☐ Escape key closes modal
☐ Tab key navigates within modal only
☐ Focus is restored to trigger element on close
☐ Modal is rendered in portal (not interrupting DOM flow)
☐ Click outside modal closes it (if dismissible)
☐ Close button is visually clear and labeled
☐ Modal content doesn't scroll body behind modal
☐ Modal works on mobile and desktop
☐ Modal has clear heading (h1 or strong title)
```

**Modal Pattern**:

```typescript
// ✓ CORRECT — Accessible modal with focus trap

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal = React.memo(function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store current focus to restore later
      triggerRef.current = document.activeElement as HTMLElement;

      // Focus dialog
      dialogRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }

        // Focus trap: keep focus inside modal
        if (e.key === 'Tab' && dialogRef.current) {
          const focusableElements = dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';

        // Restore focus
        triggerRef.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={dialogRef}
        className={`${styles.modal} ${styles[size]}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={e => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id="modal-title">{title}</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>{children}</div>

        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
});

Modal.displayName = 'Modal';
```

**Command Palette Pattern**:

```typescript
// ✓ CORRECT — Command palette with search

interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  onSelect: () => void;
  category?: string;
}

export function CommandPalette({ commands }: { commands: Command[] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Trigger with Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(!open);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const filtered = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)} title="">
      <input
        type="text"
        placeholder="Search commands..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          setSelectedIndex(0);
        }}
        autoFocus
        className={styles.commandInput}
      />

      <div className={styles.commandList} role="listbox">
        {filtered.map((cmd, idx) => (
          <button
            key={cmd.id}
            role="option"
            aria-selected={idx === selectedIndex}
            onClick={() => {
              cmd.onSelect();
              setOpen(false);
            }}
            className={idx === selectedIndex ? styles.selected : ''}
          >
            {cmd.icon && <span className={styles.icon}>{cmd.icon}</span>}
            <span>{cmd.label}</span>
            {cmd.description && <span className={styles.desc}>{cmd.description}</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}
```

### Deliverables

| Deliverable | Ownership | Frequency |
|-------------|-----------|-----------|
| Modal component with variants | 100% | Per release |
| Sheet component (bottom/side) | 100% | Per feature |
| Confirmation dialog component | 100% | Per release |
| Command palette component | 100% | Per feature |
| Focus trap implementation | 100% | Per release |
| Focus restoration guide | 100% | Per update |
| Modal accessibility audit | 100% | Quarterly |
| Modal usage patterns guide | 100% | Per release |

### Inter-Agent Dependencies

- **DESIGN-TOKENSMITH (031)**: Modal styling uses tokens
- **COMPONENT-FORGER (032)**: Modal built using component patterns from 032
- **RADIX-SURGEON (035)**: Modal accessibility coordinated with 035
- **BUTTON (032)**: Modal buttons use Button component

### Contribution to the Whole

Modals are powerful but risky—a poorly designed modal traps users and frustrates them. Agent 042 ensures modals are used purposefully, are fully accessible, and provide clear paths to exit. Command palette and confirmation dialogs round out the modal family, enabling fast user workflows.

### Failure Impact Assessment

**Critical Failure**: Focus trap doesn't work (focus escapes modal)
- Impact: User interacts with background content; confusing
- Detection: Keyboard navigation testing
- Recovery: Implement proper focus trap; test with keyboard only

**Critical Failure**: Modal can't be closed (no close button, Escape doesn't work)
- Impact: User is trapped in modal; must reload page
- Detection: User complaint; testing
- Recovery: Add close button; add Escape key handler

**High Failure**: Focus not restored when modal closes
- Impact: Focus jumps to body; user loses context
- Detection: Keyboard navigation testing
- Recovery: Store initial focus; restore on close

**Medium Failure**: Body scrolls while modal is open
- Impact: Can interact with background content behind modal
- Detection: Manual testing
- Recovery: Set overflow: hidden on body when modal opens

**Medium Failure**: Modal overlay doesn't prevent interaction
- Impact: User can click through modal to background
- Detection: Manual testing; click on background
- Recovery: Add pointer-events: none to body/main when modal open

### Operational Rules

1. **Portals Required**: Modals render via React Portals to avoid DOM stacking context issues.

2. **Focus Trap Mandatory**: Every modal must trap focus. Users can't Tab out of the modal.

3. **Escape Key Support**: Escape key closes non-alert modals. Alert modals require explicit action.

4. **Focus Restoration**: When modal closes, focus returns to the element that triggered it.

5. **Overlay Prevents Interaction**: Clicking the overlay closes the modal (unless it's an alert dialog).

6. **Clear Close Button**: A close button (X) must be visually clear and labeled "Close" or similar.

7. **Title Required**: Every modal has a clear title. Title is linked via aria-labelledby.

---

## DIVISION SUMMARY TABLE

| Agent | Codename | Specialty | Primary Artifact | Risk Level |
|-------|----------|-----------|------------------|-----------|
| 031 | DT-TOKENSMITH | Design tokens | globals.css | CRITICAL |
| 032 | CF-COMPONENTSMITH | Components | /components/ui | HIGH |
| 033 | MC-MOTIONSMITH | Animations | @keyframes, transitions | MEDIUM |
| 034 | TA-THEMESMITH | Themes | CSS variable overrides | MEDIUM |
| 035 | RS-RADIXSMITH | Accessibility | ARIA patterns | HIGH |
| 036 | FA-FORMSMITH | Forms | Input, validation | MEDIUM |
| 037 | TT-TABLESMITH | Data display | Tables, lists | MEDIUM |
| 038 | IA-ICONSMITH | Icons | Lucide + custom SVG | LOW |
| 039 | LI-LOADINGSMITH | Loading states | Spinners, skeletons | MEDIUM |
| 040 | ED-ERRORSMITH | Error handling | Boundaries, messages | HIGH |
| 041 | NH-NOTIFICATIONSMITH | Notifications | Toast, rich notif | MEDIUM |
| 042 | MM-MODALSMITH | Modals | Dialog, sheet, palette | HIGH |

---

## INTER-AGENT COMMUNICATION MATRIX

```
           031  032  033  034  035  036  037  038  039  040  041  042
031 Token   -   ★★★  ★★   ★★★  ★★   ★★★  ★★★  ★★★  ★★   ★★★  ★★   ★★★
032 Comp   ←    -    ★★★  ★★   ★★★  ★★   ★★   ★★   ★★   ★★   ★★   ★★★
033 Motion ←    ←    -    ★★   ←    ←    ←    ←    ★★★  ←    ←    ←
034 Theme  ←    ←    ★★   -    ←    ←    ←    ←    ←    ←    ←    ←
035 A11y   ←    ←    ←    ←    -    ★★★  ★★   ←    ←    ★★★  ←    ★★★
036 Form   ←    ←    ←    ←    ←    -    ←    ←    ←    ★★   ←    ←
037 Table  ←    ←    ←    ←    ←    ←    -    ★★★  ←    ←    ←    ←
038 Icons  ←    ←    ←    ←    ←    ←    ←    -    ←    ←    ←    ←
039 Load   ←    ←    ←    ←    ←    ←    ←    ←    -    ←    ←    ←
040 Error  ←    ←    ←    ←    ←    ←    ←    ←    ←    -    ★★   ←
041 Notif  ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    -    ←
042 Modal  ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    ←    -

← Unidirectional dependency
★ Bidirectional coordination
★★ Strong coordination
★★★ Very strong coordination
```

---

## OPERATIONAL DOCTRINE

### Division-Wide Standards

1. **Design System Authority**: Agent 031 (TOKENSMITH) is the ultimate authority on design tokens. No color, spacing, or timing is valid unless it flows from the token system.

2. **Component Composition**: Components are built following Agent 032's patterns. forwardRef, display names, and TypeScript interfaces are non-negotiable.

3. **Accessibility First**: Every component meets WCAG AA standards. Agent 035 (RADIX-SURGEON) sets the benchmark. No component ships without accessibility review.

4. **CSS Modules Only**: All styling lives in CSS Modules. No inline styles, no Tailwind, no styled-components. This keeps styles scoped and maintainable.

5. **Motion Respects Preferences**: All animations respect prefers-reduced-motion. Agent 033 ensures smooth, non-jarring motion.

6. **Performance Matters**: Components are lightweight. Animations run on the compositor thread (pure CSS). No unnecessary JavaScript.

7. **Mobile-First Design**: Components are designed for mobile first, then enhanced for tablet and desktop.

8. **Error Handling**: Every user interaction that can fail has an error state. Agent 040 ensures errors are communicated clearly.

---

## FAILURE SCENARIOS & MITIGATION

### Scenario 1: Color Hardcoding Spreads

**Threat**: Developer hardcodes `color: #6366f1` in component instead of using `color: var(--accent)`

**Impact**: UI breaks when theme changes; token system is undermined

**Mitigation**:
- Code review catches hardcoded colors
- Lint rule (stylelint) flags hex colors in CSS
- Agent 031 audits CSS quarterly for violations

### Scenario 2: Accessibility Regression

**Threat**: New components added without ARIA labels or keyboard support

**Impact**: Platform becomes inaccessible; legal/compliance risk

**Mitigation**:
- Axe DevTools integration in CI/CD
- Screen reader testing before merge
- Agent 035 reviews all new components
- Quarterly accessibility audit across platform

### Scenario 3: Performance Degradation

**Threat**: Animations get added as JavaScript instead of CSS; components over-render

**Impact**: Page becomes slow; mobile users experience jank

**Mitigation**:
- Lighthouse scores tracked in CI/CD
- Performance budget enforced (Largest Contentful Paint < 2.5s)
- Agent 033 reviews all animations for CSS-only

### Scenario 4: Design Inconsistency

**Threat**: Agent builds components without consulting token system or other agents

**Impact**: UI looks fragmented; design system loses coherence

**Mitigation**:
- Architecture review required before development
- Component spec template used for all new components
- Chief (030) approves all new component types

---

## SUCCESS METRICS

### Division-Level KPIs

| Metric | Target | Owner |
|--------|--------|-------|
| Design token coverage | 100% (all colors/spacing from tokens) | Agent 031 |
| WCAG AA compliance | 100% (all components) | Agent 035 |
| Component TypeScript coverage | 100% | Agent 032 |
| Motion accessibility | 100% (prefers-reduced-motion support) | Agent 033 |
| Lighthouse performance | > 90 (all pages) | All agents |
| Accessibility audit findings | < 5 per release | Agent 035 |
| Hardcoded color violations | 0 per quarter | Agent 031 |
| Component test coverage | > 80% | Agent 032 |

---

## AUTHORIZATION & SIGN-OFF

**Division Chief**: Agent 030 (DC-CHARLIE)
**Subordinate Agents**: 031–042 (12 specialists)
**Strategic Authority**: ARCHITECT (004)
**Doctrine Approved**: 2026-02-07

This operational manual is classified OPERATIONAL. Updates require approval from Chief (030) and ARCHITECT (004).

---

**END DIVISION CHARLIE OPERATIONS MANUAL**
