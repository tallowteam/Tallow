# Architecture Research: Linear Feature Integration

**Domain:** Linear-style UI features for Tallow app **Researched:** 2026-02-01
**Overall Confidence:** HIGH

---

## Executive Summary

Tallow has a well-structured Next.js App Router architecture with clean
component boundaries. The existing patterns (Radix UI + Framer Motion + CVA +
Tailwind) provide an ideal foundation for Linear-style feature integration. Key
additions (Command Palette, keyboard shortcuts, theme system) integrate cleanly
at established injection points without requiring architectural changes.

**Key Finding:** The existing `Dialog.tsx` component and `AppShell.tsx` layout
establish the patterns needed. New features follow identical architectural
conventions.

---

## Current Architecture Analysis

### Component Structure

```
C:\Users\aamir\Documents\Apps\Tallow\
├── app/
│   ├── layout.tsx              # Root layout (font providers)
│   ├── globals.css             # CSS variables, design tokens
│   ├── page.tsx                # Marketing landing (uses MinimalShell)
│   └── app/
│       ├── layout.tsx          # App layout (uses AppShell)
│       ├── page.tsx            # Transfer page
│       ├── devices/page.tsx
│       ├── history/page.tsx
│       └── settings/page.tsx
├── components/
│   ├── ui/                     # Base components (Button, Input, Card, etc.)
│   ├── layout/                 # AppShell, Header, Sidebar, PageLayout
│   ├── transfer/               # DropZone, TransferProgress, FileList
│   ├── connection/             # ConnectionLine, ConnectionStatus, DeviceCard
│   └── security/               # EncryptionIndicator
├── lib/
│   ├── utils.ts                # cn(), formatBytes, etc.
│   ├── animations/             # config.ts, variants.ts, micro.ts
│   └── hooks/                  # Feature hooks (use-*.ts)
└── hooks/                      # Core hooks (useConnection, useTransfer, etc.)
```

### Existing Patterns (Must Follow)

| Pattern            | Location                     | Description                                 |
| ------------------ | ---------------------------- | ------------------------------------------- |
| CVA Variants       | `components/ui/Button.tsx`   | All styling via class-variance-authority    |
| Radix Primitives   | `components/ui/Dialog.tsx`   | Behavior from Radix, animation from Framer  |
| forwardRef         | All components               | Every component uses React.forwardRef       |
| cn() utility       | `lib/utils.ts`               | clsx + tailwind-merge for class composition |
| Animation config   | `lib/animations/config.ts`   | DURATIONS, EASINGS, DEFAULT_TRANSITION      |
| Animation variants | `lib/animations/variants.ts` | modalContent, fadeInUp, etc.                |

### Integration Points Identified

1. **Root Layout** (`app/layout.tsx`) - Where theme provider wraps app
2. **AppShell** (`components/layout/AppShell.tsx`) - Where Command Palette
   renders
3. **Header** (`components/layout/Header.tsx`) - SearchTrigger already exists
   (line 132-162)
4. **App Layout** (`app/app/layout.tsx`) - Where keyboard context providers wrap
   pages

---

## Component Structure for New Features

### New Components Required

| Component             | Location                                   | Purpose                          | Dependencies       |
| --------------------- | ------------------------------------------ | -------------------------------- | ------------------ |
| `Command.tsx`         | `components/ui/Command.tsx`                | cmdk wrapper with Tallow styling | cmdk               |
| `CommandPalette.tsx`  | `components/command/CommandPalette.tsx`    | Full command palette feature     | Command, Dialog    |
| `ThemeProvider.tsx`   | `components/providers/ThemeProvider.tsx`   | next-themes wrapper              | next-themes        |
| `HotkeysProvider.tsx` | `components/providers/HotkeysProvider.tsx` | Keyboard context                 | react-hotkeys-hook |
| `ThemeToggle.tsx`     | `components/ui/ThemeToggle.tsx`            | Theme switch control             | useTheme           |
| `Kbd.tsx`             | `components/ui/Kbd.tsx`                    | Keyboard shortcut display        | None               |

### Modified Components

| Component                        | Modification                            | Reason                               |
| -------------------------------- | --------------------------------------- | ------------------------------------ |
| `app/layout.tsx`                 | Wrap with ThemeProvider                 | Enable theme system                  |
| `app/app/layout.tsx`             | Add HotkeysProvider, CommandPalette     | Enable shortcuts, command palette    |
| `components/layout/Header.tsx`   | Connect SearchTrigger to CommandPalette | Existing button triggers new feature |
| `components/layout/AppShell.tsx` | Add onCommandPaletteOpen prop           | Pass trigger callback                |
| `app/globals.css`                | Add light theme tokens                  | Enable light mode support            |

---

## Integration Points

### Command Palette

**Where it lives:** Rendered inside `app/app/layout.tsx`, portal mounts at
document root.

**Architecture:**

```
app/app/layout.tsx
└── HotkeysProvider (scope: "app")
    └── CommandPaletteProvider
        └── AppShell
            ├── Header (SearchTrigger onClick → openCommandPalette)
            └── {children}
        └── CommandPalette (portal, conditional render)
```

**State Management:**

- Open/close state via React Context (`CommandPaletteContext`)
- Global keyboard listener (Cmd+K / Ctrl+K) via react-hotkeys-hook
- Search state internal to CommandPalette component

**Integration with Existing Header:**

```typescript
// Header.tsx already has SearchTrigger component (lines 132-162)
// Just need to wire onClick prop from AppShell

// Current (line 312):
<SearchTrigger onClick={onSearchClick} />

// AppShell receives callback from CommandPaletteProvider
// No changes to SearchTrigger component needed
```

### Keyboard Shortcuts

**Provider Location:** Wraps app content in `app/app/layout.tsx`

**Architecture:**

```typescript
// app/app/layout.tsx
<HotkeysProvider initiallyActiveScopes={['app']}>
  <CommandPaletteProvider>
    <AppShell>{children}</AppShell>
  </CommandPaletteProvider>
</HotkeysProvider>
```

**Shortcut Registration Pattern:**

```typescript
// In page components or features:
import { useHotkeys } from 'react-hotkeys-hook';

// Page-level shortcuts
useHotkeys('g+t', () => router.push('/app'), { scopes: ['app'] });
useHotkeys('g+d', () => router.push('/app/devices'), { scopes: ['app'] });
useHotkeys('g+h', () => router.push('/app/history'), { scopes: ['app'] });
useHotkeys('g+s', () => router.push('/app/settings'), { scopes: ['app'] });

// Command palette shortcut (in CommandPaletteProvider)
useHotkeys('mod+k', () => setOpen(true), { scopes: ['app'] });
```

**Scope Strategy:** | Scope | Active When | Shortcuts |
|-------|-------------|-----------| | `app` | Inside /app/\* routes |
Navigation, command palette | | `transfer` | Transfer page | Transfer-specific
actions | | `dialog` | Modal open | Escape to close (handled by Radix) |

### Theme System

**Provider Location:** Root layout (`app/layout.tsx`)

**Architecture:**

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider';

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

**CSS Variable Strategy:**

```css
/* globals.css - Already has dark theme tokens */
:root {
  /* Dark theme (default) */
  --bg-base: #09090b;
  /* ... existing tokens */
}

/* Add light theme */
.light {
  --bg-base: #ffffff;
  --bg-subtle: #fafafa;
  --bg-surface: #f4f4f5;
  /* ... light versions of all tokens */
}
```

**Why `attribute="class"` over `data-theme`:**

- Tailwind's dark mode uses class-based approach
- Existing CSS uses `var(--token)` which works with both
- Class approach allows `dark:` Tailwind utilities if needed

### Marketing Pages

**Structure:**

```
app/
├── page.tsx                    # Landing (uses MinimalShell)
├── pricing/page.tsx            # New
├── security/page.tsx           # New
├── about/page.tsx              # New
└── (marketing)/                # Optional route group
    └── layout.tsx              # Marketing layout if needed
```

**Pattern:** Marketing pages use `MinimalShell` (already exists in AppShell.tsx
lines 122-145) which provides clean, sidebar-free layouts.

**Marketing-specific components:**

```
components/
└── marketing/
    ├── Hero.tsx                # Landing hero section
    ├── Features.tsx            # Feature grid
    ├── Pricing.tsx             # Pricing cards
    └── Footer.tsx              # Site footer
```

---

## Data Flow

### State Management

| Feature              | State Location             | Type                       |
| -------------------- | -------------------------- | -------------------------- |
| Command Palette open | React Context              | `useState` in provider     |
| Theme preference     | next-themes (localStorage) | Managed by library         |
| Keyboard shortcuts   | react-hotkeys-hook context | Scoped to providers        |
| Navigation           | Next.js router             | `useRouter`, `usePathname` |

### Context Providers (Nesting Order)

```
html (suppressHydrationWarning)
└── body
    └── ThemeProvider (next-themes)
        └── App Routes
            ├── Marketing pages (no additional providers)
            └── /app/* routes
                └── HotkeysProvider
                    └── CommandPaletteProvider
                        └── AppShell + pages
```

**Why this order:**

1. Theme must be at root to prevent FOUC
2. Hotkeys scoped to app routes only
3. CommandPalette needs access to both theme and hotkeys

### Component Communication

```
┌─────────────────────────────────────────────────────────────┐
│ CommandPaletteProvider                                       │
│  └─ isOpen: boolean                                         │
│  └─ openPalette(): void                                     │
│  └─ closePalette(): void                                    │
├─────────────────────────────────────────────────────────────┤
│ Header                                                       │
│  └─ SearchTrigger onClick={openPalette}                     │
├─────────────────────────────────────────────────────────────┤
│ CommandPalette                                               │
│  └─ Reads isOpen from context                               │
│  └─ onSelect → action() → closePalette()                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Build Order

### Recommended Sequence

**Phase 1: Foundation (No dependencies)**

1. `Kbd.tsx` - Keyboard shortcut display component
2. `ThemeProvider.tsx` - next-themes wrapper
3. Light theme CSS tokens in `globals.css`

**Phase 2: Command Component (Depends on Phase 1)**

1. Install cmdk: `npm install cmdk`
2. `Command.tsx` - Base cmdk wrapper with Tallow styling
3. Command sub-components (Input, List, Item, Group, etc.)

**Phase 3: Integration (Depends on Phase 2)**

1. `HotkeysProvider.tsx` - Wrap react-hotkeys-hook
2. `CommandPaletteProvider.tsx` - Context for open/close state
3. `CommandPalette.tsx` - Full feature combining Command + Dialog
4. Wire Header SearchTrigger to CommandPaletteProvider
5. Update `app/app/layout.tsx` with providers

**Phase 4: Keyboard Shortcuts (Depends on Phase 3)**

1. Navigation shortcuts (g+t, g+d, g+h, g+s)
2. Action shortcuts in pages (specific to each feature)
3. Shortcut hints in UI (Sidebar, Command items)

**Phase 5: Theme Polish (Depends on Phase 1)**

1. `ThemeToggle.tsx` component
2. Add to Settings page or Header
3. Test all components in light mode
4. Fix any color inconsistencies

**Phase 6: Marketing Pages (Independent)**

1. Marketing component library
2. Landing page enhancements
3. Additional marketing pages

### Rationale for Order

1. **Kbd first** - Zero dependencies, used by multiple features
2. **Theme early** - Affects all visual components, catch issues early
3. **Command before shortcuts** - Command Palette is the primary shortcut target
4. **Shortcuts after Command** - Many shortcuts open Command Palette
5. **Marketing independent** - Can be built in parallel after Phase 1

---

## Component Templates

### Command.tsx (cmdk + Tallow styling)

```typescript
'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/Dialog';

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      'flex h-full w-full flex-col overflow-hidden rounded-xl bg-[var(--bg-elevated)]',
      className
    )}
    {...props}
  />
));
Command.displayName = CommandPrimitive.displayName;

// ... CommandDialog, CommandInput, CommandList, etc.
// Follow existing Dialog.tsx patterns
```

### ThemeProvider.tsx

```typescript
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

### HotkeysProvider.tsx

```typescript
'use client';

import * as React from 'react';
import { HotkeysProvider as ReactHotkeysProvider } from 'react-hotkeys-hook';

interface HotkeysProviderProps {
  children: React.ReactNode;
  initiallyActiveScopes?: string[];
}

export function HotkeysProvider({
  children,
  initiallyActiveScopes = ['app'],
}: HotkeysProviderProps) {
  return (
    <ReactHotkeysProvider initiallyActiveScopes={initiallyActiveScopes}>
      {children}
    </ReactHotkeysProvider>
  );
}
```

---

## Anti-Patterns to Avoid

### 1. Global Keyboard Listeners Outside Provider

**Wrong:**

```typescript
// In a random component
useEffect(() => {
  const handler = (e) => { if (e.key === 'k' && e.metaKey) ... };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Correct:**

```typescript
// Use react-hotkeys-hook with scopes
useHotkeys('mod+k', openPalette, { scopes: ['app'] });
```

### 2. Theme-Dependent Rendering Without Mount Check

**Wrong:**

```typescript
const { theme } = useTheme();
return <Icon name={theme === 'dark' ? 'moon' : 'sun'} />;
// Hydration mismatch on server
```

**Correct:**

```typescript
const [mounted, setMounted] = useState(false);
const { theme } = useTheme();

useEffect(() => setMounted(true), []);

if (!mounted) return <Icon name="moon" />; // Default to dark
return <Icon name={theme === 'dark' ? 'moon' : 'sun'} />;
```

### 3. Command Items Without Value Prop

**Wrong:**

```typescript
<CommandItem onSelect={() => navigate('/settings')}>
  <Settings /> Settings
</CommandItem>
// Value inferred from text content = "Settings"
```

**Correct:**

```typescript
<CommandItem value="settings" onSelect={() => navigate('/settings')}>
  <Settings /> Settings
</CommandItem>
// Explicit value for reliable filtering
```

### 4. Mixing Animation Systems

**Wrong:**

```typescript
<motion.div className="transition-all duration-200">
// Tailwind transitions + Framer Motion = conflicts
```

**Correct:**

```typescript
<motion.div transition={DEFAULT_TRANSITION}>
// Let Framer Motion handle all animation
```

---

## Package Dependencies

### Required Additions

```bash
npm install cmdk next-themes react-hotkeys-hook
```

| Package            | Version | Purpose                      |
| ------------------ | ------- | ---------------------------- |
| cmdk               | ^1.0.0  | Command palette primitives   |
| next-themes        | ^0.4.0  | Theme management             |
| react-hotkeys-hook | ^4.6.0  | Keyboard shortcut management |

### Already Installed (Verified in package.json)

- `@radix-ui/react-dialog` - Used by Command.Dialog
- `framer-motion` - Animations
- `class-variance-authority` - Variants
- `clsx`, `tailwind-merge` - Class utilities
- `lucide-react` - Icons

---

## Scalability Considerations

| Concern   | Current (10 commands) | At 50 commands | At 200+ commands                              |
| --------- | --------------------- | -------------- | --------------------------------------------- |
| Filtering | cmdk built-in         | cmdk built-in  | Custom filter or virtualization               |
| Rendering | Direct render         | Direct render  | Consider cmdk `shouldFilter={false}` + custom |
| Shortcuts | Static list           | Config file    | Database/CMS                                  |
| Themes    | 2 (dark/light)        | 2              | Custom theme builder if needed                |

---

## Sources

- [cmdk GitHub](https://github.com/dip/cmdk) - Command palette primitives
  documentation
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) - Theme
  management documentation
- [react-hotkeys-hook](https://react-hotkeys-hook.vercel.app/) - Keyboard
  shortcuts documentation
- [shadcn/ui Command](https://ui.shadcn.com/docs/components/command) -
  Implementation patterns
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) -
  Accessible dialog primitives

---

## Quality Checklist

- [x] Integration points clearly identified (Header, AppShell, layouts)
- [x] New vs modified components explicit (6 new, 5 modified)
- [x] Build order considers existing dependencies
- [x] Follows existing patterns (Radix + Framer + CVA + Tailwind)
- [x] Provider nesting order defined
- [x] Anti-patterns documented
- [x] Package dependencies verified
