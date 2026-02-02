# Features Research: Linear UI Patterns

**Domain:** Linear-style premium SaaS UI features **Researched:** 2026-02-01
**Overall Confidence:** HIGH (multiple authoritative sources, verified patterns)

---

## Command Palette (Cmd+K)

The command palette is Linear's signature UX pattern - a keyboard-first
navigation and action system that provides instant access to all application
functionality.

### Table Stakes

| Feature                     | Why Expected                  | Complexity | Notes                                            |
| --------------------------- | ----------------------------- | ---------- | ------------------------------------------------ |
| Cmd+K / Ctrl+K trigger      | Industry standard shortcut    | Low        | Must work globally, from any view                |
| Search input with autofocus | Core functionality            | Low        | Input takes focus immediately on open            |
| Fuzzy search filtering      | Users expect forgiving search | Medium     | Use fuse.js (already in dependencies)            |
| Command grouping            | Organization is essential     | Low        | Group by category: Navigation, Actions, Settings |
| Keyboard navigation         | Power users expect this       | Medium     | Arrow keys, Enter to select, Escape to close     |
| Recent commands section     | Faster repeat actions         | Medium     | Store last 5-10 used commands                    |
| Shortcut display            | Teaching moment for users     | Low        | Show keyboard shortcut next to each command      |
| Empty state                 | When no results match         | Low        | "No results for X" message                       |
| Accessible (ARIA)           | Screen reader support         | Medium     | Role=dialog, aria-labelledby, focus trap         |

**Minimum viable command palette requires all table stakes.**

### Differentiators

| Feature                    | Value Proposition           | Complexity | Notes                                           |
| -------------------------- | --------------------------- | ---------- | ----------------------------------------------- |
| Nested pages / breadcrumbs | Navigate into sub-commands  | High       | "Settings > Theme" drill-down pattern           |
| Context-aware commands     | Show relevant actions first | Medium     | Different commands on Transfer vs Settings page |
| AI command prefix          | Future-ready architecture   | High       | Space to trigger AI commands (like Linear)      |
| Animated transitions       | Premium feel                | Low        | Smooth fade/scale on open/close                 |
| Loading states             | For async operations        | Low        | Spinner while fetching results                  |
| Command icons              | Visual scanning             | Low        | Icon per command category                       |

### Implementation Notes

**Recommended library:** `cmdk` by Paco Coursey

- React 18+ compatible (uses useSyncExternalStore)
- Unstyled/headless - full control over design
- Automatic filtering and sorting
- Radix Dialog composable
- Active development, widely adopted

**Key implementation details:**

```typescript
// Bind Cmd+K globally in _app or layout
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen((o) => !o);
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []);
```

**Command structure:**

```typescript
interface Command {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string; // "G then I" for go-to patterns
  keywords?: string[]; // Search aliases
  group: 'navigation' | 'actions' | 'settings' | 'recent';
  onSelect: () => void;
}
```

**Styling approach:** Use data-attributes from cmdk for CSS targeting:

- `[cmdk-root]` - Container
- `[cmdk-input]` - Search field
- `[cmdk-list]` - Results
- `[cmdk-item]` - Individual item
- `[cmdk-group]` - Group container
- `[data-selected]` - Highlighted item

**Dependencies on existing features:**

- Dialog component (already built)
- Input styling patterns (already established)
- Icon system (Lucide, already in use)
- fuse.js (already installed for fuzzy search)

---

## Marketing / Landing Pages

Linear's marketing pages are known for premium animations, gradient effects, and
scroll-triggered reveals.

### Table Stakes

| Feature                            | Why Expected             | Complexity | Notes                                     |
| ---------------------------------- | ------------------------ | ---------- | ----------------------------------------- |
| Hero section with product showcase | First impression         | Medium     | Show the actual product, not stock photos |
| Clear value proposition            | Above the fold           | Low        | One sentence describing core benefit      |
| CTA button (primary action)        | Conversion essential     | Low        | "Get Started" or "Try Free"               |
| Feature highlights                 | Communicate value        | Medium     | 3-5 key features with icons               |
| Dark theme by default              | Matches Linear aesthetic | Low        | Already the Tallow default                |
| Responsive layout                  | Mobile visitors          | Medium     | Stack elements on mobile                  |
| Fast load time                     | SEO + UX                 | Medium     | Optimize images, minimize JS              |

### Differentiators

| Feature                      | Value Proposition         | Complexity | Notes                                   |
| ---------------------------- | ------------------------- | ---------- | --------------------------------------- |
| Scroll-triggered animations  | Premium feel              | Medium     | Fade/slide as sections enter viewport   |
| Gradient text effects        | Visual interest           | Low        | CSS gradient on headings                |
| Floating geometric shapes    | Depth without distraction | Medium     | Subtle background elements              |
| Product screenshot with glow | Focus on product          | Low        | Subtle glow effect around product image |
| Animated hero on load        | Immediate engagement      | Medium     | Staggered entrance animation            |
| Sticky navigation            | Easy access during scroll | Low        | Header stays fixed                      |
| Smooth scroll to sections    | Polish                    | Low        | CSS scroll-behavior or Framer scroll    |

### Implementation Notes

**Animation philosophy (Linear-style):**

- Minimal motion that adds meaning, not noise
- 2-4 well-placed animations per page maximum
- Respond in <100ms, complete in 150-300ms
- GPU-accelerated only (transform, opacity)

**Hero section pattern:**

```typescript
// Staggered entrance using Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
```

**Scroll-triggered animations:**

- Use Framer Motion's `useInView` hook
- Or native IntersectionObserver for lighter weight
- Trigger once, don't repeat on scroll back

**Gradient text CSS:**

```css
.gradient-text {
  background: linear-gradient(135deg, #5e5ce6 0%, #7c7ae6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Dependencies on existing features:**

- Button component (already built)
- Animation config/variants (already established)
- CSS variables (already defined)

---

## Keyboard Shortcuts

Linear is keyboard-first - nearly every action can be done without the mouse.
Users learn shortcuts through contextual menus.

### Table Stakes

| Feature                   | Why Expected     | Complexity | Notes                                 |
| ------------------------- | ---------------- | ---------- | ------------------------------------- |
| Cmd+K for command palette | Universal access | Low        | Already covered above                 |
| Escape to go back/close   | Standard pattern | Low        | Close modals, deselect, navigate back |
| ? to show shortcuts help  | Discoverability  | Medium     | Modal with searchable shortcuts list  |
| Arrow keys in lists       | Navigate items   | Low        | Standard list navigation              |
| Enter to confirm/select   | Standard pattern | Low        | Submit forms, select items            |
| Tab for focus navigation  | Accessibility    | Low        | Already handled by browser            |

### Differentiators

| Feature                        | Value Proposition     | Complexity | Notes                               |
| ------------------------------ | --------------------- | ---------- | ----------------------------------- |
| G then X navigation            | Go-to shortcuts       | Medium     | G+I = Inbox, G+S = Settings pattern |
| Single-key actions             | Speed for power users | Low        | C = Create, X = Select              |
| Shortcut chords shown in menus | Teaching users        | Low        | Display next to menu items          |
| Searchable shortcuts modal     | Find any shortcut     | Medium     | Filter through all shortcuts        |

### Implementation Notes

**Shortcut binding approach:**

```typescript
// Use a central shortcut registry
const shortcuts: Shortcut[] = [
  { key: 'c', action: 'create-transfer', label: 'Create Transfer' },
  { key: 'g i', action: 'go-inbox', label: 'Go to Inbox' },
  { key: '?', action: 'show-shortcuts', label: 'Show Shortcuts' },
  { key: 'Escape', action: 'close', label: 'Close / Go Back' },
];
```

**Go-to pattern (G then X):**

```typescript
// Track if "G" was pressed recently
const [awaitingSecondKey, setAwaitingSecondKey] = useState(false);

useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'g' && !awaitingSecondKey) {
      setAwaitingSecondKey(true);
      setTimeout(() => setAwaitingSecondKey(false), 1000); // Reset after 1s
      return;
    }
    if (awaitingSecondKey) {
      if (e.key === 'i') navigateTo('/inbox');
      if (e.key === 's') navigateTo('/settings');
      setAwaitingSecondKey(false);
    }
  };
  // ...
}, [awaitingSecondKey]);
```

**Shortcuts help modal content:** | Category | Shortcuts |
|----------|-----------| | Navigation | G+T Transfer, G+D Devices, G+H History,
G+S Settings | | Actions | C Create, Escape Close | | Global | Cmd+K Command
Palette, ? Shortcuts |

**Dependencies on existing features:**

- Dialog component (for shortcuts modal)
- Command palette (for discoverability)

---

## Theme System

Linear uses an LCH-based color generation system that creates consistent themes
from just 3 variables.

### Table Stakes

| Feature                     | Why Expected         | Complexity | Notes                              |
| --------------------------- | -------------------- | ---------- | ---------------------------------- |
| Dark mode (default)         | Already implemented  | Done       | Tallow is dark-first               |
| Light mode option           | Some users prefer it | Medium     | Requires CSS variable overrides    |
| System preference detection | Respect OS setting   | Low        | `prefers-color-scheme` media query |
| Theme persistence           | Remember user choice | Low        | localStorage                       |
| Instant switching           | No flash or reload   | Low        | CSS variables + class swap         |

### Differentiators

| Feature                | Value Proposition         | Complexity | Notes                              |
| ---------------------- | ------------------------- | ---------- | ---------------------------------- |
| Custom accent color    | Personalization           | Medium     | Let users pick their primary color |
| LCH color generation   | Consistent derived colors | High       | Generate scale from base color     |
| Contrast adjustment    | Accessibility option      | Medium     | High contrast mode                 |
| Sidebar transparency   | Modern glass effect       | Low        | Already in design system           |
| Theme sync across tabs | Consistent experience     | Low        | localStorage event listener        |
| Shareable themes       | Community feature         | High       | Export/import theme codes          |

### Implementation Notes

**Recommended library:** `next-themes`

- 2 lines of code setup
- System preference support
- No flash on load (SSR/SSG safe)
- Tab sync built-in
- Works with Tailwind class strategy

**Setup:**

```typescript
// app/providers.tsx
'use client';
import { ThemeProvider } from 'next-themes';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
    </ThemeProvider>
  );
}

// app/layout.tsx
<html suppressHydrationWarning>
  <body>
    <Providers>{children}</Providers>
  </body>
</html>
```

**Theme switching component:**

```typescript
const { theme, setTheme, resolvedTheme } = useTheme();

// resolvedTheme handles "system" -> actual value
const isDark = resolvedTheme === 'dark';
```

**CSS variable structure (current):**

```css
:root {
  --bg-base: #09090b;
  --bg-surface: #18181b;
  /* ... */
}

.light {
  --bg-base: #ffffff;
  --bg-surface: #f4f4f5;
  /* ... */
}
```

**LCH color generation (advanced):** Linear moved from HSL to LCH for
perceptually uniform colors. This ensures:

- Consistent lightness across different hues
- Better accessibility (predictable contrast)
- Automatic high-contrast theme generation

```css
/* Modern CSS with LCH */
:root {
  --accent-l: 50;
  --accent-c: 0.15;
  --accent-h: 270;

  --accent-500: lch(var(--accent-l) var(--accent-c) var(--accent-h));
  --accent-400: lch(calc(var(--accent-l) + 10) var(--accent-c) var(--accent-h));
  --accent-600: lch(calc(var(--accent-l) - 10) var(--accent-c) var(--accent-h));
}
```

**Dependencies on existing features:**

- CSS variables (already defined)
- Switch component (already built)

---

## Changelog Page

Linear's changelog is designed for scannability with bold headlines, GIFs, and
consistent categorization.

### Table Stakes

| Feature                         | Why Expected         | Complexity | Notes                            |
| ------------------------------- | -------------------- | ---------- | -------------------------------- |
| Reverse-chronological list      | Latest first         | Low        | Standard blog structure          |
| Date headers                    | When things happened | Low        | Group by date                    |
| Title + description per entry   | What changed         | Low        | Bold headline, brief explanation |
| Visual media (screenshots/GIFs) | Show, don't tell     | Medium     | Embed media per entry            |
| Category labels                 | Type of change       | Low        | New, Improved, Fixed badges      |

### Differentiators

| Feature              | Value Proposition           | Complexity | Notes                             |
| -------------------- | --------------------------- | ---------- | --------------------------------- |
| Search/filter        | Find specific changes       | Medium     | Filter by category or search text |
| In-app notification  | Surface updates to users    | Medium     | Highlight new entries on login    |
| RSS/Subscribe option | Engagement                  | Low        | RSS feed or email signup          |
| Version linking      | Reference specific releases | Low        | Anchor links per entry            |

### Implementation Notes

**Entry structure:**

```typescript
interface ChangelogEntry {
  id: string;
  date: string; // "2026-01-29"
  title: string; // "Figma Integration"
  description: string; // Brief explanation
  category: 'new' | 'improved' | 'fixed' | 'api';
  media?: {
    type: 'image' | 'gif' | 'video';
    url: string;
    alt: string;
  };
}
```

**Category badges:** | Category | Color | Icon | |----------|-------|------| |
New | Primary (#5E5CE6) | Sparkles | | Improved | Success (green) | ArrowUp | |
Fixed | Warning (yellow) | Wrench | | API | Info (blue) | Code |

**Dependencies on existing features:**

- Badge component (already built)
- Card component (already built)
- Page layout (already established)

---

## Anti-Features

Features to deliberately NOT build. These are common mistakes or scope creep
traps.

### Do NOT Build

| Anti-Feature                           | Why Avoid                               | What to Do Instead                            |
| -------------------------------------- | --------------------------------------- | --------------------------------------------- |
| Custom shortcut remapping              | Increases complexity, few users need it | Use standard shortcuts consistently           |
| Multiple command palettes              | Confusing UX                            | Single unified Cmd+K                          |
| Overly animated landing page           | Distracting, slow                       | 2-4 purposeful animations max                 |
| Auto-playing videos                    | Annoying, bandwidth                     | User-initiated play only                      |
| Theme builder UI                       | Complex, niche need                     | Preset themes + CSS variables for power users |
| Changelog comments/reactions           | Social features = scope creep           | Keep it read-only                             |
| Notification preferences per changelog | Too granular                            | Simple on/off for changelog notifications     |
| Right-click context menus everywhere   | Breaks native behavior                  | Use sparingly, only where it adds value       |
| Shortcut conflicts with OS             | Frustrating                             | Test shortcuts across platforms               |
| Infinite scroll on changelog           | Pagination is simpler                   | Simple pagination or "Load more"              |

### Deliberate Omissions

| Feature           | Reason for Omitting                   |
| ----------------- | ------------------------------------- |
| Voice commands    | Not part of Linear pattern            |
| Gesture shortcuts | Desktop-first, gestures are mobile    |
| Animated mascot   | Off-brand for premium aesthetic       |
| Gamification      | Not appropriate for productivity tool |
| Social sharing    | Not relevant to file transfer         |

---

## Feature Dependencies

```
Command Palette
  |-- Dialog component (done)
  |-- Input styling (done)
  |-- Keyboard shortcut system
  |-- fuse.js (installed)

Marketing Pages
  |-- Button component (done)
  |-- Animation variants (done)
  |-- New: Hero section component
  |-- New: Feature card component

Keyboard Shortcuts
  |-- Command palette (for discoverability)
  |-- Dialog component (for help modal)
  |-- New: Shortcut registry system

Theme System
  |-- CSS variables (done)
  |-- Switch component (done)
  |-- New: next-themes integration
  |-- New: Light theme CSS variables

Changelog
  |-- Badge component (done)
  |-- Card component (done)
  |-- New: Changelog entry component
  |-- New: Changelog page
```

---

## MVP Recommendation

For MVP Linear UI features, prioritize:

1. **Command Palette** - Highest impact, defines the keyboard-first feel
   - Addresses: Core Linear UX pattern
   - Complexity: Medium
   - Dependencies: All met (Dialog, fuse.js, Input)

2. **Keyboard Shortcuts** - Complements command palette
   - Addresses: Power user efficiency
   - Complexity: Low-Medium
   - Dependencies: Command palette for help modal

3. **Theme System** - User expectation
   - Addresses: Light mode requests, system preference
   - Complexity: Low (with next-themes)
   - Dependencies: CSS variables defined

Defer to post-MVP:

- **Marketing Pages** - Not needed for app functionality
- **Changelog** - Nice-to-have, can be static initially
- **Custom themes** - Power user feature

---

## Sources

### Command Palette

- [cmdk GitHub Repository](https://github.com/dip/cmdk) - Official library
  documentation
- [Command Palette UX Patterns](https://medium.com/design-bootcamp/command-palette-ux-patterns-1-d6b6e68f30c1) -
  UX best practices
- [Superhuman: How to Build a Command Palette](https://blog.superhuman.com/how-to-build-a-remarkable-command-palette/) -
  Implementation guidance
- [Mobbin: Command Palette UI Design](https://mobbin.com/glossary/command-palette) -
  Design patterns

### Keyboard Shortcuts

- [Linear Keyboard Shortcuts](https://keycombiner.com/collections/linear/) -
  Full shortcut reference
- [Shortcuts.design - Linear](https://shortcuts.design/tools/toolspage-linear/) -
  Comprehensive list
- [Linear Docs: Keyboard Shortcuts Help](https://linear.app/changelog/2021-03-25-keyboard-shortcuts-help) -
  Official changelog

### Marketing/Landing Pages

- [SaaS Landing Page Trends 2026](https://www.saasframe.io/blog/10-saas-landing-page-trends-for-2026-with-real-examples) -
  Current trends
- [Linear Landing Page](https://onepagelove.com/linear) - Design analysis
- [Figma: Linear Landing Page Collection](https://www.figma.com/community/file/1367670334751609522/linear-app-style-landing-page-collection-50-sections-100-editable-free) -
  Design resources

### Theme System

- [Linear: How We Redesigned the UI](https://linear.app/now/how-we-redesigned-the-linear-ui) -
  LCH color system
- [next-themes GitHub](https://github.com/pacocoursey/next-themes) - Theme
  switching library
- [OKLCH Guide](https://oklch.org/posts/ultimate-oklch-guide) - Color space
  explanation
- [Linear Docs: Custom Themes](https://linear.app/docs/account-preferences) -
  Theme preferences

### Changelog

- [Linear Changelog](https://linear.app/changelog) - Official example
- [Linear's Changelog Strategy](https://blog.getsimpledirect.com/linears-changelog-strategy-a-deep-dive-and-what-you-can-learn/) -
  Analysis
- [Best Changelog Examples](https://frill.co/blog/posts/changelog-examples) -
  Design inspiration

---

_Research completed: 2026-02-01_ _Confidence: HIGH - Multiple authoritative
sources, verified with official documentation_
