# Geist Fonts - Quick Start

30-second guide to complete the Geist font integration.

## Current Status

Font system is configured and working with Google Fonts (Inter + JetBrains Mono) as temporary placeholders.

To use actual Geist fonts, follow these steps:

## Quick Installation

### Option A: Automatic (Recommended)

```bash
# Download and install Geist fonts automatically
node scripts/install-geist-fonts.js

# Clear cache and restart
rm -rf .next
npm run dev
```

Then update `lib/fonts/geist.ts` to use local fonts (see template below).

### Option B: Manual (2 minutes)

1. **Download fonts**: https://vercel.com/font
   - Get `GeistVF.woff2` (Sans)
   - Get `GeistMonoVF.woff2` (Mono)

2. **Create directories**:
   ```bash
   mkdir -p public/fonts/geist
   mkdir -p public/fonts/geist-mono
   ```

3. **Place files**:
   - `public/fonts/geist/GeistVF.woff2`
   - `public/fonts/geist-mono/GeistMonoVF.woff2`

4. **Update configuration**:
   Edit `lib/fonts/geist.ts` and replace with:

   ```typescript
   import localFont from 'next/font/local';
   import { Inter } from 'next/font/google';

   export const geistSans = localFont({
     src: [{
       path: '../../public/fonts/geist/GeistVF.woff2',
       weight: '100 900',
     }],
     variable: '--font-geist-sans',
     display: 'swap',
     preload: true,
   });

   export const geistMono = localFont({
     src: [{
       path: '../../public/fonts/geist-mono/GeistMonoVF.woff2',
       weight: '100 900',
     }],
     variable: '--font-geist-mono',
     display: 'swap',
     preload: true,
   });

   export const inter = Inter({
     subsets: ['latin', 'latin-ext'],
     weight: ['400', '500', '600', '700'],
     display: 'swap',
     variable: '--font-inter',
   });

   export const fontClassNames = [
     geistSans.variable,
     geistMono.variable,
     inter.variable,
   ].join(' ');
   ```

5. **Restart**:
   ```bash
   rm -rf .next && npm run dev
   ```

### Option C: Use Package (Easiest)

```bash
# Install Geist via npm
npm install geist

# Update lib/fonts/geist.ts
import { GeistSans, GeistMono } from 'geist/font';
export const geistSans = GeistSans;
export const geistMono = GeistMono;

# Restart
npm run dev
```

## Verification

1. Open http://localhost:3000
2. DevTools → Network → Filter: "font"
3. Should see `GeistVF.woff2` loading
4. Inspect element → Computed → font-family should show "Geist Sans"

## Already Working

These files are already configured and working:

- ✅ `app/layout.tsx` - Font integration
- ✅ `app/globals.css` - CSS variables
- ✅ `lib/fonts/geist.ts` - Configuration (using Google Fonts temporarily)

All components automatically use the new fonts via CSS variables. No component changes needed.

## Font Usage

### In Components

```tsx
import { geistSans, geistMono } from '@/lib/fonts/geist';

// Sans-serif
<div className={geistSans.className}>Text</div>

// Monospace
<code className={geistMono.className}>code</code>
```

### In CSS

```css
.text { font-family: var(--font-sans); }
.code { font-family: var(--font-mono); }
```

## Need Help?

- Full guide: `FONT_INTEGRATION_GUIDE.md`
- Font module docs: `lib/fonts/README.md`
- Installation script: `scripts/install-geist-fonts.js`
- Font directory: `public/fonts/README.md`

## Skip Installation

Don't want to install Geist fonts right now? No problem!

The app works perfectly with the current Google Fonts setup. You can install Geist fonts later at any time without changing any component code.
