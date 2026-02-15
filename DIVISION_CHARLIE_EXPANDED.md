# ┌─────────────────────────────────────────────────────────────────┐
# │  DIVISION CHARLIE — VISUAL INTELLIGENCE (UI Components)        │
# │  Chief: Agent 030 │ Reports to: ARCHITECT (004)                │
# │  Agents: 031-042 (12 field agents)                             │
# │  Doctrine: "Every pixel intentional. Every interaction magic." │
# └─────────────────────────────────────────────────────────────────┘

---

## DIVISION CHARLIE MISSION STATEMENT

DIVISION CHARLIE operates as the visual cortex of Operation TALLOW, orchestrating the creation and maintenance of 141 React components that form the entire user-facing interface. The division's mandate is absolute: deliver pixel-perfect, accessible, performant, and delightfully animated UI that makes post-quantum cryptography feel effortless. Every component must function flawlessly across 4 themes (Dark/Light/Forest/Ocean), 6+ breakpoints (320px-2560px), and 22 languages. Animation is not ornament—it is communication. Accessibility is not compliance—it is justice. Performance is not optimization—it is respect for the user's time.

## DIVISION CHARLIE KEY PERFORMANCE INDICATORS

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Component Build Success Rate | 100% | 100% | GREEN |
| Animation Frame Rate (60fps) | 100% | 98.7% | YELLOW |
| WCAG 2.1 AA Compliance | 100% | 99.2% | YELLOW |
| Cross-Theme Rendering (4/4) | 100% | 100% | GREEN |
| Responsive Breakpoints Tested (6/6) | 100% | 100% | GREEN |
| Component Storybook Coverage | 100% | 87% | RED |
| Accessibility Audit Pass Rate | 100% | 92% | YELLOW |
| Bundle Size Impact per Component | <15KB | 12.3KB | GREEN |

---

## AGENT 038 — ICON-ARMORER

Agent 038 manages all iconography throughout Tallow. The project uses inline SVG icons (not an icon library like Font Awesome) for maximum control and theming flexibility. Icons are used for: platform detection (Apple, Windows, Linux, Android), device types (laptop, phone, tablet), file types (document, image, video, archive), transfer states (uploading, downloading, complete, failed), security indicators (lock, shield, check), and actions (send, receive, settings, help). Every icon follows consistent standards: 24x24 viewBox, 1.5 stroke width (for consistency), and semantic coloring. Icons can be animated via CSS or Framer Motion.

Icons are organized by category:
- Platform icons (Apple, Windows, Linux, Android)
- Device icons (laptop, phone, tablet, desktop)
- File type icons (PDF, image, video, zip)
- Transfer icons (upload arrow, download arrow, sync)
- Security icons (lock, shield, checkmark, warning)
- Connection icons (wifi, connected, disconnected, bluetooth)
- Action icons (settings, help, more, close)
- Status icons (success, error, warning, info)

## AGENT 039 — LOADING-ILLUSIONIST

Agent 039 manages all loading states, skeleton screens, and Suspense boundaries. The philosophy: never show a blank screen. When content is loading, show a skeleton that matches the actual content layout exactly. This provides perceived performance—users feel like content is arriving faster. Skeleton screens use a shimmer animation (CSS animation-timeline where supported, Framer Motion fallback) that sweeps across the skeleton from left to right.

Responsibilities include:
- Skeleton screen components for all page sections
- Shimmer animation implementation
- Suspense boundary placement
- Progressive content loading
- Optimistic UI patterns (show action immediately, sync in background)
- Loading spinners with smooth rotation
- Page-level loading states (spinner during initial load)
- Component-level loading states (within a card or list)
- Network status indicator (showing "connecting" state)

Skeleton screens are built with the exact same layout structure as the content they replace. For example, if a transfer history table has 5 columns, the skeleton shows 5 placeholder columns with the same widths.

## AGENT 040 — ERROR-DIPLOMAT

Agent 040 owns all error handling UI, error boundaries, fallback components, and recovery paths. Every error must have a human-friendly explanation and a suggested recovery action. Errors are categorized:

- **WebRTC Errors** — Connection failed, ICE candidates exhausted, TURN server unreachable
- **Cryptography Errors** — Key generation failed, encryption failed, decryption failed (show "Connection not secure" not technical details)
- **Network Errors** — No internet, timeout, DNS failure, firewall blocked
- **File Errors** — Permission denied, disk full, file locked, path too long
- **Authentication Errors** — SAS mismatch, invalid code, expired session
- **Validation Errors** — Invalid input, file too large, unsupported file type

React error boundaries are placed at strategic points:
- Page-level boundary (catches entire page crashes)
- Component-level boundary (catches component-specific crashes)
- Async boundary (catches promise rejections in hooks)

Error recovery is always offered:
- "Retry" button with exponential backoff
- "Try again" with connection reset
- "Go back" to previous state
- Contact support link for unrecoverable errors
- Offline detection with "check your connection" message

## AGENT 041 — NOTIFICATION-HERALD

Agent 041 builds the in-app notification system using Sonner toast library. Notifications are smart:
- Success transfers show brief green toast (2-3 seconds)
- Errors show persistent red toast with retry action
- Transfer requests show rich notification with file preview + accept/reject buttons
- Multiple transfers batch into single notification
- Priority mode (normal/urgent) affects placement and duration

Toast variants:
- **Success** — Brief, auto-dismiss, green, for completed actions
- **Error** — Persistent until dismissed, red, with action button
- **Warning** — Orange, 5-second duration, for important non-errors
- **Info** — Blue, 3-second duration, for informational messages
- **Transfer Request** — Rich card with file info, accept/reject buttons
- **Connection Status** — Persistent while connection unstable

## AGENT 042 — MODAL-MASTER

Agent 042 owns all dialogs, modals, sheets, and overlays. Every modal uses Radix Dialog primitive wrapped with Tallow styling. Modal types:

- **Confirmation Dialog** — "Are you sure?" with Confirm/Cancel buttons
- **Alert Dialog** — Important warning with acknowledge button
- **Settings Sheet** — Slide-up panel (mobile) or centered modal (desktop)
- **SAS Verification Modal** — Prominently display SAS words/emojis with comparison instructions
- **Incoming Transfer Modal** — File preview + accept/reject + auto-dismiss on action
- **Device Selection Modal** — Pick device from list with search
- **Command Palette** — Keyboard-driven (⌘K) command finder
- **Code Entry Sheet** — Input code phrase or scan QR
- **File Name Entry** — Rename or enter new filename

Focus management: modals trap focus within themselves (can't Tab outside). Escape key closes non-critical modals. Backdrop click closes non-critical modals. Critical modals (delete confirmation) require explicit button press.

---

## SUMMARY — DIVISION CHARLIE DELIVERABLES

**Across all 12 agents (031-042), Division Charlie delivers:**

1. **Design System** — 50+ CSS custom properties covering colors, spacing, typography
2. **141 React Components** — Fully typed, accessible, theme-aware
3. **Animation Library** — 20+ reusable animation variants
4. **4-Theme System** — Dark, Light, Forest, Ocean with instant switching
5. **14 Radix UI Wrappers** — Dialog, Select, Tabs, Dropdown, Switch, etc.
6. **Form System** — React Hook Form + Zod validation with multi-step support
7. **Data Tables** — TanStack Table with sorting, filtering, virtualization for 1000+ rows
8. **Icon System** — Inline SVGs for all use cases (24x24, consistent stroke width)
9. **Loading States** — Skeleton screens with shimmer animation
10. **Error Handling** — Boundaries, fallbacks, retry logic, user-friendly messages
11. **Notification System** — Rich toasts with Sonner, batching, priorities
12. **Modal System** — Focus management, escape handling, responsive sheets

**Quality Metrics Across Division:**
- WCAG 2.1 AA compliance: 99.2%
- Component test coverage: 87%+
- Animation frame rate: 60fps minimum
- Bundle size: <15KB per component average
- Theme switching: <100ms
- Type safety: Zero `any` types

**Key Files & Directories:**
- `/app/globals.css` — Design tokens (Agent 031)
- `/components/*` — All 141 components (Agent 032)
- `/lib/animations/` — Framer Motion variants (Agent 033)
- `/lib/theme/` — Theme system (Agent 034)
- `/components/ui/[Radix]` — Radix wrappers (Agent 035)
- `/lib/schemas/` — Zod validation schemas (Agent 036)
- `/components/tables/` — Data tables (Agent 037)
- `/components/ui/Icon*` — Icon components (Agent 038)
- `/components/Skeleton*` — Skeleton screens (Agent 039)
- `/components/ErrorBoundary*` — Error handling (Agent 040)
- `/lib/toast/` — Toast system (Agent 041)
- `/components/Modal*` — Modal components (Agent 042)

---

## INTER-DIVISION DEPENDENCIES

**DIVISION CHARLIE ↔ DIVISION DELTA (UX-OPS)**
- Agent 032 builds components that Agent 044-049 assemble into pages
- Agent 033 works with Agent 045 on onboarding animations
- Agent 046 writes copy that Agent 032 displays in UI

**DIVISION CHARLIE ↔ DIVISION ECHO (Frontend)**
- Agent 051 (Next.js) determines page structure
- Agent 052 (State) manages component state with Zustand
- Agent 054 (Hooks) builds custom hooks that components use
- Agent 055 (Performance) monitors component bundle impact
- Agent 056 (Accessibility) audits all components from CHARLIE

**DIVISION CHARLIE ↔ DIVISION GOLF (QA)**
- Agent 080 (Visual Regression) takes screenshots of all components
- Agent 077 (E2E) tests component interactions end-to-end
- Agent 056 accessibility-audits all CHARLIE components

---

## CRITICAL OPERATIONAL GUIDELINES FOR DIVISION CHARLIE

1. **CSS Modules ONLY** — No Tailwind, styled-components, or inline styles
2. **forwardRef for interactive components** — Allow parent ref access
3. **CVA for all variants** — Use class-variance-authority
4. **Zero `any` types** — Strict TypeScript everywhere
5. **Themes work everywhere** — All 4 themes supported by default
6. **Mobile-first CSS** — Base styles for mobile, `@media (min-width:)` for larger
7. **Prefers-reduced-motion respected** — All animations have reduced variant
8. **60fps minimum** — Profile animations, only animate transform/opacity
9. **ARIA labels everywhere** — Every interactive element labeled
10. **Responsive fonts with clamp()** — Fluid typography scales with viewport

---

## DIVISION CHARLIE — OPERATIONAL EXCELLENCE

The visual layer is the user's first impression. Attention to detail matters. Every component must feel premium, respond instantly, and guide the user intuitively through secure file transfer. Motion should delight. Animations should clarify state. Errors should be forgiving. Every interaction should feel like the app understands what the user wants and helps them achieve it with minimal friction.

**DIVISION CHARLIE's north star:** Make post-quantum cryptography feel simple, trustworthy, and even delightful. Security shouldn't feel paranoid. It should feel confident.

