# Theme System

A complete dark/light theme toggle implementation for the Tallow website with no flash of unstyled content (FOUC).

## Features

- Dark mode (default) and light mode support
- Persistent theme selection using localStorage
- System preference detection (prefers-color-scheme)
- No flash of unstyled content on page load
- Server-side rendering compatible
- Smooth theme transitions

## Architecture

### 1. ThemeProvider (`theme-provider.tsx`)
Client-side React context that manages theme state and provides theme toggle functionality.

### 2. ThemeScript (`theme-script.tsx`)
Inline script that runs before React hydration to set the initial theme and prevent FOUC.

### 3. Layout Integration (`app/layout.tsx`)
Root layout includes both the script and provider for complete functionality.

## Usage

### Using the Theme Hook

```tsx
'use client';

import { useTheme } from '@/components/theme';

export function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <button onClick={() => setTheme('light')}>Light Mode</button>
      <button onClick={() => setTheme('dark')}>Dark Mode</button>
    </div>
  );
}
```

### Theme Toggle Button (Header)

The Header component uses the theme hook to display Sun/Moon icons and toggle between themes:

```tsx
import { useTheme } from '@/components/theme';
import { Sun, Moon } from '@/components/icons';

const { theme, toggleTheme } = useTheme();

<button onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

## CSS Variables

The theme system works by setting a `data-theme` attribute on the `<html>` element:

```css
/* Dark mode (default) */
:root {
  --color-bg: #000000;
  --color-text: #ededed;
  /* ... other tokens */
}

/* Light mode */
[data-theme="light"] {
  --color-bg: #ffffff;
  --color-text: #171717;
  /* ... other tokens */
}
```

All CSS variables are defined in `app/globals.css`.

## How It Works

### 1. Initial Load (Server-Side)
- HTML is rendered with `suppressHydrationWarning` on the `<html>` tag
- ThemeScript runs immediately before React hydration

### 2. ThemeScript Execution
```javascript
// Gets theme from localStorage or system preference
const savedTheme = localStorage.getItem('theme');
const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const theme = savedTheme || systemTheme;

// Sets data-theme immediately (before React)
document.documentElement.setAttribute('data-theme', theme);
```

### 3. React Hydration
- ThemeProvider wraps the app and initializes with the same theme
- Theme state is synchronized with localStorage and DOM attribute

### 4. User Interaction
- User clicks theme toggle button
- ThemeProvider updates state
- DOM attribute and localStorage are updated
- CSS variables change via `[data-theme]` selector

## Benefits

1. **No FOUC**: Theme is set before React hydration
2. **Persistent**: Theme preference saved to localStorage
3. **Accessible**: Respects system preferences
4. **Type-safe**: Full TypeScript support
5. **SSR-compatible**: Works with Next.js App Router
6. **Performant**: Minimal JavaScript, CSS-only transitions

## Files

```
components/theme/
├── theme-provider.tsx    # React context and hook
├── theme-script.tsx      # Inline script for FOUC prevention
├── index.ts             # Public exports
└── README.md            # Documentation

app/
├── layout.tsx           # ThemeProvider and ThemeScript integration
└── globals.css          # CSS variables for both themes

components/layout/
└── Header.tsx           # Theme toggle button implementation
```

## Testing

1. Open the website
2. Click the Sun/Moon icon in the header
3. Verify theme switches immediately
4. Refresh the page - theme should persist
5. Open in new tab - theme should match
6. Test in different browsers

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- localStorage API required
- CSS custom properties required
- matchMedia API for system preference detection
