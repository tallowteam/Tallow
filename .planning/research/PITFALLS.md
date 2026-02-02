# Pitfalls Research: Linear Feature Integration

**Domain:** Adding Linear-style UI features to existing Next.js/React
application **Researched:** 2026-02-01 **Confidence:** HIGH (verified with
multiple authoritative sources)

## Executive Summary

Adding Linear-style features (command palette, keyboard shortcuts, theme
switching, mobile responsive) to an existing working application carries
significant integration risks. The most critical pitfalls involve:

1. **Breaking existing keyboard handlers** (Escape key for sidebar conflicts
   with command palette)
2. **Hydration mismatches** from theme switching with SSR
3. **Focus trap conflicts** between existing Radix dialogs and new command
   palette
4. **Mobile animation performance** degradation from Framer Motion on low-power
   devices

This research identifies 25+ specific pitfalls with prevention strategies and
phase assignments.

---

## Command Palette Pitfalls

### CRITICAL: Hydration Mismatch with Dialog Open State

**What goes wrong:** The command palette shows a hydration mismatch error
because the `open` state is `undefined` on the server but `false` on the client.

**Warning signs:**

- React hydration mismatch warning in console
- Command palette flickers on page load
- `useId` or `useSyncExternalStore` errors in dev tools

**Prevention:**

```typescript
// BAD: open state undefined on server
const [open, setOpen] = useState();

// GOOD: explicitly false on server
const [open, setOpen] = useState(false);
```

**Phase assignment:** Command Palette implementation phase - verify `open` prop
is `false` on server.

**Sources:** [cmdk GitHub](https://github.com/dip/cmdk),
[react-cmdk](https://react-cmdk.com/)

---

### CRITICAL: Missing or Duplicate Item Values

**What goes wrong:** Command items behave weirdly - wrong item selected, search
doesn't work, items don't highlight correctly.

**Warning signs:**

- Clicking one item triggers another
- Search returns unexpected results
- Keyboard navigation skips items

**Prevention:**

```typescript
// BAD: Missing value
<Command.Item>Settings</Command.Item>

// GOOD: Explicit unique value
<Command.Item value="settings-general" key="settings-general">
  Settings
</Command.Item>
```

**Phase assignment:** Command Palette - create value generation system for all
commands.

**Sources:** [cmdk Documentation](https://github.com/dip/cmdk)

---

### HIGH: Long Command Names Breaking Layout

**What goes wrong:** Demo command palettes look great with "Calendar" and
"Settings". Production breaks with "Create New Project Template from Existing
Configuration".

**Warning signs:**

- Command text wraps awkwardly
- Horizontal scrollbar appears
- Commands get truncated mid-word

**Prevention:**

- Test with production-length content during development
- Set `max-width` with `text-ellipsis` and `overflow-hidden`
- Add tooltip for truncated commands
- Design for 60+ character command names

**Phase assignment:** Command Palette - test with real action names from
existing codebase.

**Sources:**
[Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)

---

### MEDIUM: Performance Degradation with Many Commands

**What goes wrong:** cmdk doesn't include virtualization. With 100+ commands,
typing becomes laggy.

**Warning signs:**

- Input lag when typing in search
- Visible delay when opening palette
- High JS execution time in Performance tab

**Prevention:**

- For <200 commands: Default behavior is fine
- For 200-1000 commands: Pass `shouldFilter={false}` and implement custom
  filtering
- For 1000+ commands: Implement virtualization with react-virtual or similar
- Paginate results (show top 10, "show more" button)

**Phase assignment:** Command Palette - monitor command count, plan
virtualization if needed.

**Sources:** [cmdk Performance](https://github.com/dip/cmdk)

---

### MEDIUM: Discoverability - Users Don't Know It Exists

**What goes wrong:** Beautiful command palette implemented but users never
discover it because there's no visible hint.

**Warning signs:**

- Low usage metrics on command palette
- Users manually navigating to features that have commands
- Support questions about "how to quickly do X"

**Prevention:**

- Show "Cmd+K" or "Ctrl+K" badge in header/toolbar
- Add onboarding tooltip pointing to shortcut
- Include "Press Cmd+K for quick actions" in empty states
- Add command palette hint in settings page

**Phase assignment:** Command Palette - add visible shortcut hint in Header
component.

**Sources:**
[Retool Command Palette Design](https://retool.com/blog/designing-the-command-palette)

---

## Keyboard Shortcuts Pitfalls

### CRITICAL: Conflict with Existing Escape Key Handler

**What goes wrong:** Tallow's AppShell already uses Escape to close the mobile
sidebar. Adding command palette Escape handler creates conflict - sometimes
sidebar closes, sometimes palette closes, sometimes both.

**Warning signs:**

- Inconsistent behavior when pressing Escape
- Both sidebar and command palette close simultaneously
- One handler stops working entirely

**Prevention:**

```typescript
// In AppShell.tsx - existing code (line 56-64):
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && sidebarOpen) {
    closeSidebar();
  }
};

// Solution: Check if command palette is open first
const handleKeyDown = (e: KeyboardEvent) => {
  // Command palette handles its own Escape
  if (commandPaletteOpen) return;

  if (e.key === 'Escape' && sidebarOpen) {
    closeSidebar();
  }
};
```

**Phase assignment:** Keyboard Shortcuts - audit ALL existing keyboard handlers
before adding new ones.

**Sources:** [React Hotkeys](https://github.com/greena13/react-hotkeys),
[Keyboard Shortcuts Hook](https://www.taniarascia.com/keyboard-shortcut-hook-react/)

---

### CRITICAL: Shortcuts Firing in Input Fields

**What goes wrong:** User types "k" in a text input and command palette opens.
Or types "e" and edit mode activates.

**Warning signs:**

- Shortcuts trigger while typing
- Users complain about "random popups"
- Forms become unusable

**Prevention:**

```typescript
// Ignore shortcuts when focus is in form elements
const handleShortcut = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();

  // Skip if in input, textarea, select, or contenteditable
  if (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    target.isContentEditable
  ) {
    return;
  }

  // Handle shortcut...
};
```

**Phase assignment:** Keyboard Shortcuts - implement input element detection in
ALL shortcut handlers.

**Sources:**
[react-keyboard-shortcuts](https://medium.com/@amarkanala/introducing-react-keyboard-shortcuts-clean-performant-hook-based-keyboard-shortcuts-for-modern-f9edefbf92bb)

---

### HIGH: Nested Component Shortcut Conflicts

**What goes wrong:** Dropdown inside dialog - Escape should close dropdown
first, then dialog on second press. Instead, both close at once.

**Warning signs:**

- Multiple overlays closing simultaneously
- Inconsistent close behavior
- User loses context unexpectedly

**Prevention:**

```typescript
// Track nested component state
const [dropdownOpen, setDropdownOpen] = useState(false);

// Pause parent shortcuts when child is open
<Dropdown
  onOpenChange={(open) => {
    setDropdownOpen(open);
    if (open) pauseDialogShortcuts();
    else resumeDialogShortcuts();
  }}
/>
```

**Phase assignment:** Keyboard Shortcuts - implement shortcut priority/pausing
system.

**Sources:**
[React Hotkeys Documentation](https://github.com/greena13/react-hotkeys)

---

### HIGH: Browser Shortcut Conflicts

**What goes wrong:** App uses Cmd+S for "Save" but browser intercepts it for
"Save Page". User sees browser save dialog instead of app saving.

**Warning signs:**

- Browser dialogs appearing unexpectedly
- Shortcuts not working in certain browsers
- Users on different OS report different behavior

**Prevention:**

- Audit common browser shortcuts before choosing app shortcuts
- Always `e.preventDefault()` for custom shortcuts
- Provide alternative shortcuts for conflicting keys
- Document platform differences (Cmd vs Ctrl)

**Avoid these shortcuts (browser-reserved):**

- Cmd/Ctrl+N, T, W, Q (window/tab management)
- Cmd/Ctrl+L, D (address bar, bookmarks)
- Cmd/Ctrl+P (print)
- F5, Cmd/Ctrl+R (refresh)

**Phase assignment:** Keyboard Shortcuts - create shortcut conflict matrix
before implementation.

**Sources:**
[Keyboard Shortcuts Best Practices](https://dev.to/lalitkhu/implement-keyboard-shortcuts-in-your-react-app-475c)

---

### MEDIUM: Memory Leaks from Event Listeners

**What goes wrong:** Keyboard shortcut handlers attached with `addEventListener`
but never cleaned up on unmount.

**Warning signs:**

- Shortcuts fire multiple times
- Memory usage grows over time
- Console warnings about state updates on unmounted components

**Prevention:**

```typescript
// Always clean up listeners
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    /* ... */
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, [dependencies]);
```

**Phase assignment:** Keyboard Shortcuts - verify cleanup in all keyboard hook
implementations.

**Sources:**
[React Keyboard Shortcuts](https://dev.to/xenral/react-keyboard-shortcuts-boost-app-performance-using-react-keyhub-25co)

---

## Theme System Pitfalls

### CRITICAL: Flash of Unstyled Content (FOUC) on Theme Switch

**What goes wrong:** Page loads with light theme, then flickers to dark theme
after hydration. Users see a bright flash on every page navigation.

**Warning signs:**

- Brief white/light flash on page load
- Theme flickers during navigation
- Users complain about eye strain in dark rooms

**Prevention:**

1. **Inject blocking script in `<head>`** before React hydrates:

```html
<script>
  (function () {
    const theme =
      localStorage.getItem('theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');
    document.documentElement.classList.add(theme);
  })();
</script>
```

2. **Use `next-themes` correctly:**

- Place ThemeProvider in root layout (server component)
- Add `suppressHydrationWarning` to `<html>` element
- Use mounted state pattern for theme-dependent UI

**Phase assignment:** Theme Switching - implement blocking script approach from
day one.

**Sources:**
[Fixing Dark Mode Flickering](https://notanumber.in/blog/fixing-react-dark-mode-flickering),
[next-themes](https://github.com/pacocoursey/next-themes)

---

### CRITICAL: Hydration Mismatch from Theme-Dependent Rendering

**What goes wrong:** Component renders different content based on theme. Server
renders one version, client renders another. Hydration error.

**Warning signs:**

- Hydration mismatch warnings mentioning theme-related content
- Icons or text changing after page load
- Content shift after hydration

**Prevention:**

```typescript
// BAD: Different content based on theme
const icon = theme === 'dark' ? <MoonIcon /> : <SunIcon />;

// GOOD: Use mounted state
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);

if (!mounted) return <Skeleton />; // Or null

const icon = theme === 'dark' ? <MoonIcon /> : <SunIcon />;
```

**Phase assignment:** Theme Switching - implement mounted state pattern for all
theme-dependent UI.

**Sources:**
[Fixing Hydration Mismatch](https://medium.com/@pavan1419/fixing-hydration-mismatch-in-next-js-next-themes-issue-8017c43dfef9)

---

### HIGH: CSS Variable Conflicts with Existing System

**What goes wrong:** Tallow already has CSS variables in `globals.css`. New
theme system uses same variable names with different values. Styles break
unpredictably.

**Warning signs:**

- Colors look wrong after theme integration
- Some components use old values, some use new
- Theme toggle affects some components but not others

**Prevention:**

- Audit existing CSS variables before adding theme system
- Use namespaced variables: `--theme-bg-base` vs `--bg-base`
- Migrate incrementally with backwards compatibility
- Test ALL existing components after theme integration

**Phase assignment:** Theme Switching - create CSS variable migration plan
before implementation.

**Sources:**
[next-themes Documentation](https://github.com/pacocoursey/next-themes)

---

### MEDIUM: System Preference Not Respected

**What goes wrong:** User has OS set to dark mode, but app loads in light mode
because localStorage was never set.

**Warning signs:**

- New users see wrong theme
- Theme doesn't match OS preference
- Users complain about having to manually set theme

**Prevention:**

```typescript
// Respect system preference as default
const defaultTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'dark'
  : 'light';
const savedTheme = localStorage.getItem('theme');
const theme = savedTheme || defaultTheme;
```

**Phase assignment:** Theme Switching - implement system preference detection.

**Sources:**
[Adding Dark Mode](https://brianlovin.com/writing/adding-dark-mode-with-next-js)

---

## Mobile Responsive Pitfalls

### CRITICAL: Framer Motion Animation Lag on Mobile

**What goes wrong:** Animations smooth on desktop become janky on mobile
devices. Users report "slow" or "laggy" app.

**Warning signs:**

- Animations stuttering on mobile
- Battery drain complaints
- "Reduced motion" users see no feedback at all

**Prevention:**

1. **Use GPU-accelerated properties only:**

```typescript
// BAD: Animating layout properties
animate={{ width: '100%', height: '200px' }}

// GOOD: Animating transform/opacity
animate={{ scale: 1, opacity: 1 }}
```

2. **Reduce animation complexity on mobile:**

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');

<motion.div
  animate={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
  transition={isMobile ? { duration: 0.1 } : { duration: 0.2 }}
/>
```

3. **Respect prefers-reduced-motion:**

```typescript
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

if (prefersReducedMotion) {
  // Use instant transitions or opacity-only
}
```

**Phase assignment:** Mobile Responsive - add reduced motion support and mobile
animation optimization.

**Sources:**
[Framer Motion Performance Tips](https://tillitsdone.com/blogs/framer-motion-performance-tips/),
[Motion One Comparison](https://reactlibraries.com/blog/framer-motion-vs-motion-one-mobile-animation-performance-in-2025)

---

### HIGH: Breakpoint Gaps Breaking Layout

**What goes wrong:** Layout tested at 375px (mobile) and 1024px (desktop).
Breaks at 768px (iPad) because no one tested that exact width.

**Warning signs:**

- Content overlapping at specific widths
- Horizontal scrollbar appearing
- Layout "jumping" when resizing

**Prevention:**

- Test at ALL Tailwind breakpoints: 640, 768, 1024, 1280, 1536
- Test at common device widths: 375, 414, 428, 768, 820, 1024
- Use browser DevTools device mode
- Add visual regression tests for each breakpoint

**Phase assignment:** Mobile Responsive - create breakpoint testing checklist.

**Sources:**
[Responsive Design Breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints),
[Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)

---

### HIGH: Touch Targets Too Small

**What goes wrong:** Desktop hover states don't exist on mobile. Buttons
designed for mouse are too small for finger taps.

**Warning signs:**

- Users tapping wrong buttons on mobile
- Accessibility audit failures
- "Hard to tap" complaints

**Prevention:**

- Minimum touch target: 44x44px (Apple), 48x48dp (Google)
- Add padding for touch, not just visual size
- Increase spacing between tappable elements on mobile

```typescript
// Increase touch targets on mobile
className={cn(
  'h-9 px-4', // Desktop
  'touch:h-11 touch:px-5' // Mobile
)}
```

**Phase assignment:** Mobile Responsive - audit all interactive elements for
touch target size.

**Sources:**
[Responsive Design Guide](https://www.weweb.io/blog/how-to-build-a-responsive-web-app-guide)

---

### MEDIUM: Viewport Height Issues on Mobile Safari

**What goes wrong:** `100vh` doesn't work correctly on iOS Safari because of the
address bar. Content gets cut off or requires scrolling.

**Warning signs:**

- Content hidden behind Safari toolbar
- Layout jumping when scrolling
- Bottom navigation covered by browser UI

**Prevention:**

```css
/* Use dynamic viewport height */
.full-height {
  height: 100vh;
  height: 100dvh; /* Dynamic viewport height - falls back to 100vh */
}

/* Or use JavaScript */
const setVH = () => {
  document.documentElement.style.setProperty(
    '--vh',
    `${window.innerHeight * 0.01}px`
  );
};
```

**Phase assignment:** Mobile Responsive - implement `dvh` units or JS viewport
calculation.

**Sources:**
[CSS Media Query Guide](https://www.browserstack.com/guide/what-are-css-and-media-query-breakpoints)

---

## General Integration Pitfalls

### CRITICAL: Focus Trap Conflicts with Existing Dialogs

**What goes wrong:** Tallow already uses Radix Dialog. Adding command palette
(another modal) causes focus trap conflicts - can't click inside command palette
when dialog is open, or vice versa.

**Warning signs:**

- Clicking inside one modal focuses the other
- Unable to type in command palette search
- Focus jumping unexpectedly between modals

**Prevention:**

```typescript
// Option 1: Disable focus trap on command palette
import { FocusScope } from '@radix-ui/react-focus-scope';

<FocusScope trapped={false}>
  <Command.Dialog>
    {/* ... */}
  </Command.Dialog>
</FocusScope>

// Option 2: Use modal={false} and manage focus manually
<Dialog.Root modal={false}>
  {/* ... */}
</Dialog.Root>
```

**Phase assignment:** Command Palette - test with ALL existing dialogs before
deployment.

**Sources:**
[Radix Dialog Focus Trap Issue](https://github.com/radix-ui/primitives/issues/2544),
[Multiple Dialogs Troubleshooting](https://docs.privy.io/basics/troubleshooting/multiple-dialogs)

---

### CRITICAL: Pointer Events Blocked by Modal Overlay

**What goes wrong:** Radix Dialog sets `pointer-events: none` on the page when
open. Command palette opened from dialog can't receive clicks.

**Warning signs:**

- Clicks don't register in nested modals
- "Dead zones" where clicking does nothing
- Works in isolation, breaks when combined

**Prevention:**

```typescript
// Handle pointer events explicitly
<Dialog.Content
  onPointerDownOutside={(e) => {
    // Prevent closing if clicking in command palette
    if (commandPaletteOpen) {
      e.preventDefault();
    }
  }}
/>
```

**Phase assignment:** Command Palette + Dialog integration - verify pointer
events work together.

**Sources:**
[Radix Dialog Pointer Events Issue](https://github.com/radix-ui/primitives/issues/2122)

---

### HIGH: Context Provider Performance with Global State

**What goes wrong:** Command palette needs global state (commands, recent items,
search history). Putting everything in one context causes all consumers to
re-render on any state change.

**Warning signs:**

- Unrelated components re-rendering when palette state changes
- Performance degradation as app grows
- React DevTools showing excessive renders

**Prevention:**

```typescript
// BAD: One giant context
const AppContext = createContext({
  commands,
  recentItems,
  searchHistory,
  theme,
  // ...everything
});

// GOOD: Split contexts by update frequency
const CommandsContext = createContext(commands); // Rarely changes
const RecentItemsContext = createContext(recentItems); // Changes on use
const SearchHistoryContext = createContext(searchHistory); // Changes on search
```

Consider using Zustand for complex global state instead of Context.

**Phase assignment:** Command Palette - design state architecture before
implementation.

**Sources:**
[React Context State Management](https://vercel.com/kb/guide/react-context-state-management-nextjs),
[State Management with App Router](https://www.pronextjs.dev/tutorials/state-management)

---

### HIGH: Breaking Existing Functionality During Integration

**What goes wrong:** New feature works, but existing file transfer stops working
because of shared state mutation, event handler conflicts, or CSS specificity
issues.

**Warning signs:**

- Features that worked before now fail
- "It worked yesterday" syndrome
- Intermittent failures hard to reproduce

**Prevention:**

1. **Add integration tests BEFORE adding features:**

```typescript
// Test existing functionality
test('file transfer still works', async () => {
  // Simulate full transfer flow
});
```

2. **Use feature flags:**

```typescript
const { isEnabled } = useFeatureFlag('command-palette');
if (isEnabled) {
  return <CommandPalette />;
}
```

3. **Incremental rollout:**

- Add feature disabled by default
- Enable in development first
- Test all existing flows
- Enable in production

**Phase assignment:** ALL phases - add regression tests before each new feature.

**Sources:**
[React Integration Testing](https://react.dev/community/versioning-policy)

---

### MEDIUM: Server Component vs Client Component Confusion

**What goes wrong:** Command palette uses `useState` but is accidentally
imported in a Server Component. Build fails with cryptic error.

**Warning signs:**

- "useState is not defined" errors
- "createContext is not supported in Server Components"
- Features work in dev but fail in build

**Prevention:**

```typescript
// Always add 'use client' to components using:
// - useState, useEffect, useContext
// - Browser APIs (localStorage, window)
// - Event handlers
// - Third-party client-only libraries

'use client'; // <-- Must be first line

import { useState } from 'react';
import { Command } from 'cmdk';
```

**Phase assignment:** ALL phases - verify 'use client' on all interactive
components.

**Sources:**
[Next.js Context with App Router](https://github.com/vercel/next.js/discussions/53172)

---

## Phase-Specific Warnings

| Phase Topic        | Likely Pitfall                            | Severity | Mitigation                          |
| ------------------ | ----------------------------------------- | -------- | ----------------------------------- |
| Command Palette    | Focus trap conflicts with existing Dialog | CRITICAL | Test with all existing modals first |
| Command Palette    | Hydration mismatch on open state          | CRITICAL | Ensure `open={false}` on server     |
| Command Palette    | Escape key conflicts with sidebar         | CRITICAL | Audit existing keyboard handlers    |
| Keyboard Shortcuts | Firing in input fields                    | CRITICAL | Add input element detection         |
| Keyboard Shortcuts | Memory leaks from listeners               | HIGH     | Verify cleanup on unmount           |
| Theme Switching    | FOUC on page load                         | CRITICAL | Implement blocking script           |
| Theme Switching    | CSS variable conflicts                    | HIGH     | Audit existing variables            |
| Mobile Responsive  | Framer Motion lag                         | CRITICAL | Add reduced motion support          |
| Mobile Responsive  | Breakpoint gaps                           | HIGH     | Test all common widths              |
| Integration        | Breaking existing features                | CRITICAL | Add regression tests first          |

---

## Testing Checklist

Before deploying any Linear-style feature:

### Command Palette

- [ ] Opens/closes without hydration warnings
- [ ] Search works with 50+ commands
- [ ] Works when existing Dialog is open
- [ ] Escape key doesn't conflict with sidebar
- [ ] Focus returns correctly after close
- [ ] Keyboard navigation works (arrows, enter, escape)
- [ ] Long command names don't break layout

### Keyboard Shortcuts

- [ ] Don't fire in input/textarea/select
- [ ] Don't conflict with browser shortcuts
- [ ] Clean up on component unmount
- [ ] Work with nested modals/dropdowns
- [ ] Have visible documentation/hints

### Theme Switching

- [ ] No FOUC on page load
- [ ] No FOUC on navigation
- [ ] System preference respected
- [ ] Persists across sessions
- [ ] All components update correctly

### Mobile Responsive

- [ ] Animations smooth on low-end device
- [ ] Touch targets >= 44px
- [ ] Works on iOS Safari (viewport)
- [ ] No breakpoint gaps (test 640, 768, 1024, 1280)
- [ ] prefers-reduced-motion respected

### Integration

- [ ] Existing file transfer still works
- [ ] All existing tests pass
- [ ] No console errors/warnings
- [ ] Performance not degraded

---

## Sources

### Command Palette

- [cmdk GitHub](https://github.com/dip/cmdk)
- [react-cmdk](https://react-cmdk.com/)
- [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1)
- [Retool Command Palette Design](https://retool.com/blog/designing-the-command-palette)

### Keyboard Shortcuts

- [react-keyboard-shortcuts](https://medium.com/@amarkanala/introducing-react-keyboard-shortcuts-clean-performant-hook-based-keyboard-shortcuts-for-modern-f9edefbf92bb)
- [React Hotkeys](https://github.com/greena13/react-hotkeys)
- [Keyboard Shortcut Hook](https://www.taniarascia.com/keyboard-shortcut-hook-react/)

### Theme Switching

- [next-themes](https://github.com/pacocoursey/next-themes)
- [Fixing Dark Mode Flickering](https://notanumber.in/blog/fixing-react-dark-mode-flickering)
- [Fixing Hydration Mismatch](https://medium.com/@pavan1419/fixing-hydration-mismatch-in-next-js-next-themes-issue-8017c43dfef9)

### Mobile Responsive

- [Framer Motion Performance](https://tillitsdone.com/blogs/framer-motion-performance-tips/)
- [Responsive Design Breakpoints](https://www.browserstack.com/guide/responsive-design-breakpoints)
- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Integration

- [Radix Dialog Issues](https://github.com/radix-ui/primitives/issues/2544)
- [React Context State Management](https://vercel.com/kb/guide/react-context-state-management-nextjs)
- [Linear UI Redesign](https://linear.app/now/how-we-redesigned-the-linear-ui)
