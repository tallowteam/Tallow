# Geist Font Configuration

This directory contains font configuration for Tallow, using Vercel's official Geist font family.

## Overview

- **Geist Sans**: Primary UI font (replaces Inter)
- **Geist Mono**: Monospace font for code and technical content
- **Inter**: Fallback font for compatibility
- **Cal Sans**: Optional display font for headings (commented out)

## Quick Start

### 1. Install Fonts

Run the automatic installation script:

```bash
npm run install:fonts
# or
node scripts/install-geist-fonts.js
```

### 2. Manual Installation (Alternative)

If the script fails, download fonts manually:

1. Visit https://vercel.com/font
2. Download Geist Sans and Geist Mono
3. Place font files in:
   - `public/fonts/geist/GeistVF.woff2`
   - `public/fonts/geist-mono/GeistMonoVF.woff2`

### 3. Verify Installation

Restart your development server and check that fonts are loading:

```bash
npm run dev
```

Open browser DevTools → Network tab → Filter by "font" to verify fonts are loading.

## Font Variables

The following CSS variables are available globally:

```css
--font-geist-sans   /* Geist Sans variable font */
--font-geist-mono   /* Geist Mono variable font */
--font-inter        /* Inter fallback font */
--font-display      /* Display font for headings */

/* Composed variables in globals.css */
--font-sans         /* Primary sans-serif stack */
--font-mono         /* Monospace font stack */
```

## Usage in Components

### Using className

```tsx
import { geistSans, geistMono } from '@/lib/fonts/geist';

// Sans-serif
<div className={geistSans.className}>
  Regular text content
</div>

// Monospace
<code className={geistMono.className}>
  const example = 'code';
</code>
```

### Using CSS Variables

```tsx
// In component styles
<div style={{ fontFamily: 'var(--font-sans)' }}>
  Uses font stack with fallbacks
</div>
```

### In CSS Modules

```css
.myComponent {
  font-family: var(--font-sans);
}

.codeBlock {
  font-family: var(--font-mono);
}
```

## Fallback Strategy

Fonts are loaded with a robust fallback chain:

### Sans-serif stack:
1. Geist Sans (self-hosted)
2. Inter (self-hosted)
3. -apple-system (macOS)
4. BlinkMacSystemFont (Chrome/Edge on macOS)
5. Segoe UI (Windows)
6. Roboto (Android)
7. Helvetica Neue (iOS)
8. sans-serif (system default)

### Monospace stack:
1. Geist Mono (self-hosted)
2. JetBrains Mono
3. Fira Code
4. SF Mono (macOS)
5. Fira Mono
6. Roboto Mono
7. monospace (system default)

## Performance

- **Variable fonts**: Single file for all weights (100-900)
- **Self-hosted**: No external requests, no third-party tracking
- **Display: swap**: Text visible immediately with fallback
- **Preload**: Critical fonts preloaded for faster rendering
- **Next.js optimization**: Fonts automatically optimized by Next.js

## Adding Cal Sans (Display Font)

To enable Cal Sans for hero sections and large headings:

1. Download Cal Sans from https://github.com/calcom/font
2. Place `CalSans-SemiBold.woff2` in `public/fonts/cal-sans/`
3. Uncomment the `calSans` export in `geist.ts`
4. Add `calSans.variable` to `fontClassNames`

## Troubleshooting

### Fonts not loading

1. Check font files exist:
   ```bash
   ls public/fonts/geist/
   ls public/fonts/geist-mono/
   ```

2. Verify file paths in `geist.ts` match your directory structure

3. Restart development server:
   ```bash
   npm run dev
   ```

### Fonts look wrong

1. Clear Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

2. Check browser DevTools → Network → Fonts section

3. Verify CSS variables are loaded in browser DevTools → Elements → :root

### TypeScript errors

Ensure `next/font` types are installed:

```bash
npm install --save-dev @types/node
```

## Migration from Inter

The codebase has been updated to use Geist Sans as primary font while keeping Inter as fallback:

- ✅ `app/layout.tsx` - Updated to use Geist fonts
- ✅ `app/globals.css` - Font variables updated
- ✅ `lib/fonts/geist.ts` - Font configuration created
- ⏳ Font files need to be installed (run `npm run install:fonts`)

All existing components continue to work without changes thanks to CSS variables.

## License

Geist fonts are licensed under the SIL Open Font License (OFL).
See: https://github.com/vercel/geist-font/blob/main/LICENSE.txt

## Resources

- Geist Font Repository: https://github.com/vercel/geist-font
- Vercel Font Download: https://vercel.com/font
- Next.js Font Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- SIL OFL License: https://openfontlicense.org/
