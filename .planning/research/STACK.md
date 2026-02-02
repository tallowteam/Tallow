# Stack Research: Linear UI Replication

**Project:** Tallow v2.0 - Linear-style UI Features **Researched:** 2026-02-01
**Confidence:** HIGH (verified via official sources)

## Executive Summary

Tallow v1.0 has a solid foundation: Next.js 16, Tailwind CSS v4, Radix UI,
Framer Motion, CVA, and Fuse.js (already installed). For Linear-style features,
we need exactly **3 new dependencies** plus configuration changes. The existing
stack covers 80% of requirements.

## Existing Stack (DO NOT RE-ADD)

Already installed and validated in `package.json`:

| Technology                  | Version         | Purpose                            |
| --------------------------- | --------------- | ---------------------------------- |
| next                        | ^16.1.2         | Framework (App Router)             |
| react                       | ^19.2.3         | UI Library                         |
| tailwindcss                 | ^4.0.7          | Styling                            |
| framer-motion               | ^12.29.2        | Animations                         |
| class-variance-authority    | ^0.7.1          | Variant management                 |
| clsx + tailwind-merge       | ^2.1.1 / ^3.4.0 | Class composition                  |
| lucide-react                | ^0.563.0        | Icons                              |
| geist                       | ^1.5.1          | Typography                         |
| fuse.js                     | ^7.1.0          | Fuzzy search (for command palette) |
| zustand                     | ^5.0.10         | State management                   |
| @radix-ui/react-dialog      | ^1.1.15         | Modal/Dialog primitives            |
| @radix-ui/react-tooltip     | ^1.2.8          | Tooltips                           |
| @radix-ui/react-select      | ^2.2.6          | Selects/Dropdowns                  |
| @radix-ui/react-switch      | ^1.2.6          | Toggle switches                    |
| @radix-ui/react-tabs        | ^1.1.13         | Tab navigation                     |
| @radix-ui/react-scroll-area | ^1.2.10         | Custom scrollbars                  |

## New Dependencies Required

### 1. cmdk - Command Palette

**Package:** `cmdk@^1.1.1` **Purpose:** Command palette (Cmd+K) with built-in
accessibility and Radix Dialog integration **Confidence:** HIGH (powers Linear,
Raycast, Vercel command menus)

**Why cmdk over alternatives:**

| Option                | Verdict         | Reason                                                                       |
| --------------------- | --------------- | ---------------------------------------------------------------------------- |
| cmdk                  | RECOMMENDED     | Unstyled/headless, composes with existing Radix Dialog, powers Linear itself |
| react-cmdk            | Not recommended | Pre-styled (conflicts with our design system), last updated 2+ years ago     |
| Custom implementation | Not recommended | cmdk already solves accessibility, filtering, keyboard nav                   |

**Integration points:**

- Uses Radix UI's Dialog under the hood (we already have
  `@radix-ui/react-dialog`)
- Works with existing Framer Motion animations
- Fuse.js already installed for custom filtering if needed

**Installation:**

```bash
npm install cmdk@^1.1.1
```

### 2. next-themes - Theme System

**Package:** `next-themes@^0.4.6` **Purpose:** Dark/light mode with system
preference support, no flash **Confidence:** HIGH (same author as cmdk, de-facto
Next.js theming)

**Why next-themes:**

- Written by Paco Coursey (same as cmdk)
- Handles SSR hydration correctly
- Works with Tailwind CSS `dark:` variants
- Supports system preference detection
- No flash of wrong theme on load

**Configuration required:**

```typescript
// tailwind.config.ts
export default {
  darkMode: 'selector', // or 'class'
  // ...
};
```

**Integration points:**

- CSS variables already defined in globals.css
- Tailwind already configured for dark mode
- Just need ThemeProvider wrapper in layout.tsx

**Installation:**

```bash
npm install next-themes@^0.4.6
```

### 3. react-hotkeys-hook - Keyboard Shortcuts

**Package:** `react-hotkeys-hook@^5.2.3` (latest: Jan 2026) **Purpose:**
Declarative keyboard shortcuts system **Confidence:** HIGH (actively maintained,
verified Jan 2026 release)

**Why react-hotkeys-hook over alternatives:**

| Option             | Verdict         | Reason                                                                       |
| ------------------ | --------------- | ---------------------------------------------------------------------------- |
| react-hotkeys-hook | RECOMMENDED     | Hook-based API, React 18+ native, scopes for conflict prevention, TypeScript |
| tinykeys           | Alternative     | 650B, framework-agnostic, but requires manual React integration              |
| react-hotkeys      | Not recommended | Last updated 6 years ago                                                     |

**Key features:**

- `useHotkeys('ctrl+j', callback)` - simple API
- Scopes for modal/page context
- `HotkeysProvider` for global configuration
- Works with form inputs when needed
- Cross-platform `$mod` support (Cmd on Mac, Ctrl on Windows)

**Integration points:**

- Works alongside cmdk (command palette handles its own shortcuts)
- Zustand can store shortcut configurations
- Scopes prevent conflicts with text inputs

**Installation:**

```bash
npm install react-hotkeys-hook@^5.2.3
```

## Not Recommended (Avoid Adding)

| Library                        | Why Not                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| shadcn/ui                      | Design system already built; would conflict with existing components |
| @headlessui/react              | Radix UI already provides all primitives needed                      |
| react-cmdk                     | Pre-styled, unmaintained, conflicts with design system               |
| tinykeys                       | Good but react-hotkeys-hook has better React integration             |
| any additional Radix packages  | Already have Dialog, Tooltip, Select, Switch, Tabs, ScrollArea       |
| additional animation libraries | Framer Motion is complete                                            |
| additional search libraries    | Fuse.js already installed                                            |

## Configuration Changes Required

### 1. Tailwind Config for Theme Support

```typescript
// tailwind.config.ts (update)
export default {
  darkMode: 'selector',
  // existing config...
};
```

### 2. globals.css Light Theme Variables

Currently only dark theme defined. Need to add:

```css
/* Light theme overrides */
:root {
  --bg-base: #ffffff;
  --bg-subtle: #fafafa;
  --bg-surface: #f4f4f5;
  --bg-elevated: #ffffff;
  --bg-hover: #f4f4f5;
  --bg-active: #e4e4e7;

  --text-primary: #09090b;
  --text-secondary: #52525b;
  --text-tertiary: #a1a1aa;

  --border-default: rgba(0, 0, 0, 0.08);
  --border-hover: rgba(0, 0, 0, 0.16);
}

.dark {
  /* Current dark theme values */
  --bg-base: #09090b;
  /* ... */
}
```

### 3. ThemeProvider in Layout

```typescript
// app/layout.tsx (add wrapper)
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

## Build Order (Implementation Sequence)

Based on dependencies and integration complexity:

### Phase 1: Theme System

1. Install `next-themes`
2. Add light theme CSS variables
3. Configure Tailwind `darkMode: 'selector'`
4. Add ThemeProvider to layout
5. Create theme toggle component

**Rationale:** Foundation for all other features; other components need to
respect theme.

### Phase 2: Keyboard Shortcuts

1. Install `react-hotkeys-hook`
2. Create HotkeysProvider wrapper
3. Define global shortcuts (?, Escape, etc.)
4. Create keyboard shortcuts help modal

**Rationale:** Needed before command palette (Cmd+K triggers it).

### Phase 3: Command Palette

1. Install `cmdk`
2. Create CommandPalette component using existing Dialog styles
3. Integrate with existing navigation
4. Add keyboard shortcut (Cmd+K)
5. Connect to Fuse.js for custom filtering

**Rationale:** Depends on keyboard shortcuts system.

### Phase 4: Marketing/Changelog Pages

No new dependencies required. Use existing stack:

- Next.js App Router for pages
- Framer Motion for animations
- Tailwind for styling
- Lucide for icons

**Rationale:** Feature pages using established patterns.

## Installation Commands

```bash
# All new dependencies (run once)
npm install cmdk@^1.1.1 next-themes@^0.4.6 react-hotkeys-hook@^5.2.3

# Verify installation
npm ls cmdk next-themes react-hotkeys-hook
```

**Total bundle impact estimate:** ~15-20KB gzipped (minimal)

## Sources

### cmdk

- GitHub: https://github.com/pacocoursey/cmdk
- npm: https://www.npmjs.com/package/cmdk
- Version 1.1.1 verified, last published ~9 months ago
- Confidence: HIGH

### next-themes

- GitHub: https://github.com/pacocoursey/next-themes
- npm: https://www.npmjs.com/package/next-themes
- Version 0.4.6 verified, ~10 months ago
- Confidence: HIGH

### react-hotkeys-hook

- GitHub: https://github.com/JohannesKlauss/react-hotkeys-hook
- Docs: https://react-hotkeys-hook.vercel.app/
- Version 5.2.3 verified (released Jan 14, 2026)
- Confidence: HIGH

---

_Research completed: 2026-02-01_ _Next step: Roadmap creation using this stack
specification_
