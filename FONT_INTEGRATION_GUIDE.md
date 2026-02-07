# Geist Font Integration Guide

Complete guide for integrating Vercel's Geist fonts into Tallow.

## Current Status

The codebase has been configured to use a flexible font system that supports both Google Fonts (current) and self-hosted Geist fonts (future).

### Files Modified

1. ✅ `app/layout.tsx` - Updated to use font configuration from `lib/fonts/geist.ts`
2. ✅ `app/globals.css` - Font CSS variables updated with Geist font stack
3. ✅ `lib/fonts/geist.ts` - Font configuration module created
4. ✅ Documentation created for font installation and usage

## Current Implementation

The system is currently using Inter and JetBrains Mono from Google Fonts as temporary fonts until Geist fonts are installed:

```typescript
// lib/fonts/geist.ts
export const geistSans = Inter({ ... });  // Temporary: Using Inter
export const geistMono = JetBrains_Mono({ ... });  // Temporary: Using JetBrains Mono
```

## Migration to Geist Fonts

### Option 1: Use Actual Geist Fonts (Recommended)

To use the real Geist fonts from Vercel:

#### Step 1: Install Fonts

**Automatic Installation (Recommended):**

```bash
# Run the installation script
node scripts/install-geist-fonts.js
```

**Manual Installation:**

1. Visit https://vercel.com/font
2. Download:
   - Geist Sans Variable Font (GeistVF.woff2)
   - Geist Mono Variable Font (GeistMonoVF.woff2)
3. Create directories:
   ```bash
   mkdir -p public/fonts/geist
   mkdir -p public/fonts/geist-mono
   ```
4. Place files:
   - `public/fonts/geist/GeistVF.woff2`
   - `public/fonts/geist-mono/GeistMonoVF.woff2`

#### Step 2: Update Font Configuration

Replace the content of `lib/fonts/geist.ts` with self-hosted Geist fonts:

```typescript
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';

export const geistSans = localFont({
  src: [
    {
      path: '../../public/fonts/geist/GeistVF.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-sans',
  display: 'swap',
  preload: true,
  fallback: ['Inter', '-apple-system', 'sans-serif'],
});

export const geistMono = localFont({
  src: [
    {
      path: '../../public/fonts/geist-mono/GeistMonoVF.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
  fallback: ['JetBrains Mono', 'Fira Code', 'monospace'],
});

export const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

export const fontClassNames = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
].join(' ');
```

#### Step 3: Restart Development Server

```bash
# Clear Next.js cache
rm -rf .next

# Restart server
npm run dev
```

### Option 2: Use @vercel/font Package (Alternative)

Install Geist fonts via npm package:

```bash
npm install geist
```

Update `lib/fonts/geist.ts`:

```typescript
import { GeistSans, GeistMono } from 'geist/font';
import { Inter } from 'next/font/google';

export const geistSans = GeistSans;
export const geistMono = GeistMono;
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

### Option 3: Keep Current Google Fonts Setup

The current setup works perfectly with Inter and JetBrains Mono from Google Fonts. No action needed if you're satisfied with the current fonts.

## Font Variables Reference

### CSS Variables Available

```css
/* In your CSS or CSS Modules */
--font-geist-sans  /* Primary sans-serif font */
--font-geist-mono  /* Monospace font */
--font-inter       /* Fallback sans-serif */
--font-display     /* Display/heading font */

/* Composed stacks (in globals.css) */
--font-sans        /* Full sans-serif stack with fallbacks */
--font-mono        /* Full monospace stack with fallbacks */
```

### Usage in Components

#### Using className

```tsx
import { geistSans, geistMono } from '@/lib/fonts/geist';

function MyComponent() {
  return (
    <>
      <p className={geistSans.className}>
        Regular text with Geist Sans
      </p>

      <code className={geistMono.className}>
        const code = 'monospace';
      </code>
    </>
  );
}
```

#### Using CSS Variables

```tsx
// In JSX
<div style={{ fontFamily: 'var(--font-sans)' }}>
  Text with font stack
</div>

// In CSS Module
.myText {
  font-family: var(--font-sans);
}

.myCode {
  font-family: var(--font-mono);
}
```

## Design System Integration

The fonts are integrated into the design system via `app/globals.css`:

```css
:root {
  /* Geist Sans (primary) with Inter fallback */
  --font-sans: var(--font-geist-sans), var(--font-inter),
               -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

  /* Geist Mono with popular code font fallbacks */
  --font-mono: var(--font-geist-mono), 'JetBrains Mono', 'Fira Code',
               'SF Mono', monospace;

  /* Display font for headings */
  --font-display: var(--font-geist-sans), var(--font-inter),
                  -apple-system, sans-serif;
}
```

All components using `var(--font-sans)` or `var(--font-mono)` automatically use the Geist fonts.

## Why Geist Fonts?

### Advantages

1. **Modern Design**: Clean, geometric aesthetic matching Linear/Vercel
2. **Optimized for UI**: Designed specifically for user interfaces
3. **Variable Fonts**: Single file for all weights (100-900)
4. **Open Source**: Free to use under SIL OFL
5. **Self-Hosted**: No external requests, GDPR-compliant
6. **Performance**: Optimized by Next.js automatically

### Comparison to Alternatives

| Font | Pros | Cons |
|------|------|------|
| **Geist Sans** | Modern, optimized for UI, variable | Requires download |
| **Inter** | Widely used, excellent readability | Less distinctive |
| **System Fonts** | No download, fast | Inconsistent across platforms |
| **Google Fonts** | Easy setup, CDN | External requests, privacy concerns |

## Performance Considerations

### Current Setup (Google Fonts)
- ✅ Easy setup, no manual downloads
- ✅ Works immediately
- ⚠️ External requests to Google Fonts CDN
- ⚠️ Potential privacy implications (GDPR)

### Self-Hosted Geist Fonts
- ✅ No external requests
- ✅ Privacy-friendly (GDPR compliant)
- ✅ Faster loading (same domain)
- ✅ Works offline
- ⚠️ Requires manual download/setup
- ⚠️ Larger repository size

### Font Loading Strategy

All fonts use `display: swap`:
1. Text visible immediately with fallback font
2. Custom font swaps in when loaded
3. No flash of invisible text (FOIT)
4. Better Core Web Vitals (CLS)

## Troubleshooting

### Fonts Not Loading

**Check font files exist:**
```bash
ls public/fonts/geist/
ls public/fonts/geist-mono/
```

**Verify in DevTools:**
1. Open browser DevTools
2. Network tab → Filter by "font"
3. Check if GeistVF.woff2 and GeistMonoVF.woff2 are loading

**Clear cache:**
```bash
rm -rf .next
npm run dev
```

### Wrong Font Showing

**Check CSS variables:**
1. DevTools → Elements → :root
2. Verify `--font-geist-sans` and `--font-geist-mono` are defined

**Check computed styles:**
1. Inspect an element
2. Computed tab → font-family
3. Should show Geist Sans or Inter

### Build Errors

**TypeScript errors:**
```bash
npm install --save-dev @types/node
```

**Font file not found:**
- Verify file paths in `lib/fonts/geist.ts` match your structure
- Check file names are correct (case-sensitive)

## Adding Cal Sans (Optional)

For hero sections and large display headings:

### Step 1: Download Cal Sans
Visit: https://github.com/calcom/font

### Step 2: Add to Project
```bash
mkdir -p public/fonts/cal-sans
# Place CalSans-SemiBold.woff2 in this directory
```

### Step 3: Update Configuration

Uncomment in `lib/fonts/geist.ts`:

```typescript
export const calSans = localFont({
  src: [
    {
      path: '../../public/fonts/cal-sans/CalSans-SemiBold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  preload: true,
  fallback: ['var(--font-geist-sans)', 'sans-serif'],
});

// Add to fontClassNames
export const fontClassNames = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  calSans.variable,  // Add this
].join(' ');
```

### Step 4: Use in Components

```tsx
import { calSans } from '@/lib/fonts/geist';

<h1 className={calSans.className}>
  Hero Heading
</h1>
```

## Next Steps

1. ✅ Font configuration created and integrated
2. ⏳ **Download Geist fonts** (see Option 1 above)
3. ⏳ **Update geist.ts** to use local fonts (see Option 1 above)
4. ⏳ Restart development server
5. ⏳ Verify fonts in browser DevTools

## Resources

- **Geist Font Download**: https://vercel.com/font
- **GitHub Repository**: https://github.com/vercel/geist-font
- **Next.js Font Docs**: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- **SIL OFL License**: https://openfontlicense.org/
- **Font Installation Script**: `scripts/install-geist-fonts.js`
- **Font Configuration**: `lib/fonts/geist.ts`
- **Font Directory README**: `public/fonts/README.md`
- **Font Module README**: `lib/fonts/README.md`

## Summary

The Tallow application is now configured to use Geist fonts with a robust fallback system. The current implementation uses Google Fonts (Inter and JetBrains Mono) as placeholders until the actual Geist font files are downloaded and installed. All components automatically inherit the new font configuration through CSS variables, requiring no code changes.

To complete the migration, simply download the Geist font files and update the `lib/fonts/geist.ts` configuration to use local fonts instead of Google Fonts.
