# Landing Page Section Components

Production-ready marketing section components for Tallow's landing page.

## Tech Stack

- **Next.js**: 16.1.2 (App Router)
- **React**: 19.2.3
- **TypeScript**: Strict mode
- **Styling**: Tailwind CSS utility classes

## Components

### 1. Hero (`Hero.tsx`)

Main hero section with animated entrance.

**Features:**
- Large gradient headline text
- Animated badge with pulse effect
- Dual CTA buttons (primary + secondary)
- Background gradient glow and grid pattern
- Window mockup with app preview placeholder
- Trust indicators with checkmarks
- Scroll indicator animation

**Usage:**
```tsx
import { Hero } from '@/components/sections';

export default function HomePage() {
  return <Hero />;
}
```

### 2. Features (`Features.tsx`)

Feature showcase in responsive grid layout.

**Features:**
- 2-3 column responsive grid (6 feature cards)
- Icon + title + description format
- Featured badge for highlighted items
- Hover animations and scale effects
- Intersection Observer for scroll animations
- Staggered entrance animations

**Customization:**
```tsx
// Edit the features array in Features.tsx
const features: Feature[] = [
  {
    icon: <YourIcon />,
    title: 'Your Feature',
    description: 'Feature description',
    featured: true, // Optional highlight
  },
];
```

### 3. HowItWorks (`HowItWorks.tsx`)

Step-by-step process explanation.

**Features:**
- 4 numbered steps with icons
- Connection lines between steps (arrows)
- Responsive layout (horizontal desktop, vertical mobile)
- Animated number badges with gradient
- Section CTA button

**Layout:**
- Desktop: 2x2 grid with connecting arrows
- Mobile: Vertical stack with downward arrows

### 4. Security (`Security.tsx`)

Security and privacy feature showcase.

**Features:**
- Visual encryption representation (rotating rings)
- 6 security feature cards in grid
- Animated floating badges (256-bit, PQC, E2EE, Zero-K)
- Trust verification badge
- Split layout (visual + content)

**Animations:**
- Rotating concentric circles
- Floating security badges
- Glow effects on hover

### 5. Stats (`Stats.tsx`)

Animated statistics counter section.

**Features:**
- 4 stat cards in responsive grid
- Animated number counters on scroll
- Smooth easing animation (ease-out-quart)
- Hover effects with glow
- Decorative corner accents

**Customization:**
```tsx
// Edit stats array in Stats.tsx
const stats: Stat[] = [
  {
    value: '10',
    suffix: 'M+',
    label: 'Files Transferred',
  },
];
```

### 6. CTA (`CTA.tsx`)

Call-to-action section with gradient background.

**Features:**
- Animated gradient orbs background
- Dot pattern overlay
- Dual CTA buttons with shimmer effect
- Feature checklist with icons
- Pulsing ready indicator

**Button Effects:**
- Primary: Shimmer animation on hover
- Secondary: Backdrop blur with border glow

### 7. Testimonials (`Testimonials.tsx`)

Social proof section with user reviews.

**Features:**
- 6 testimonial cards in 3-column grid
- 5-star rating display
- Avatar initials with gradient background
- Quote styling with decorative element
- Bottom CTA

**Customization:**
```tsx
// Edit testimonials array in Testimonials.tsx
const testimonials: Testimonial[] = [
  {
    quote: 'Your testimonial text',
    author: 'Author Name',
    role: 'Their Role',
    avatar: 'AN', // Initials
    rating: 5,
  },
];
```

## Design System

### Colors

```css
/* Primary Accent */
emerald-500: #10b981 (primary green)
emerald-600: #059669 (darker green)
emerald-400: #34d399 (lighter green)
teal-400: #2dd4bf (accent teal)

/* Grayscale */
gray-900: #111827 (dark backgrounds)
gray-950: #030712 (darker backgrounds)
gray-800: #1f2937 (borders)
gray-400: #9ca3af (body text)
gray-500: #6b7280 (muted text)

/* Semantic */
white: #ffffff (headings)
black: #000000 (backgrounds)
```

### Typography

```css
/* Headings */
Hero: text-6xl md:text-7xl lg:text-8xl (96px desktop)
Section Headings: text-4xl md:text-5xl (48-60px)
Card Titles: text-xl (20px)

/* Body */
Large Text: text-lg md:text-xl (18-20px)
Body: text-base (16px)
Small: text-sm (14px)
```

### Spacing

```css
/* Section Padding */
py-32 (128px vertical)

/* Component Gaps */
gap-6 (24px grid gaps)
gap-4 (16px smaller gaps)
mb-16 (64px section header margin)
```

### Animations

**Fade In + Translate:**
```tsx
className={`transition-all duration-1000 ${
  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
}`}
```

**Staggered Delays:**
```tsx
style={{ transitionDelay: `${index * 100}ms` }}
```

**Hover Effects:**
```css
hover:scale-105 /* Scale up */
hover:border-emerald-500/30 /* Border glow */
hover:shadow-emerald-500/40 /* Shadow glow */
transition-all duration-300 /* Smooth transition */
```

## Performance Optimizations

### 1. Intersection Observer

All sections use Intersection Observer for scroll-triggered animations:

```tsx
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    },
    { threshold: 0.1 }
  );

  if (sectionRef.current) {
    observer.observe(sectionRef.current);
  }

  return () => observer.disconnect();
}, []);
```

### 2. Client Components

All components use `'use client'` directive for:
- useState for animation state
- useEffect for observers
- useRef for element references

### 3. CSS Animations

Custom animations defined with `<style jsx>` for:
- Gradient shifts
- Rotation effects
- Pulse animations
- Floating effects

## Accessibility

### Semantic HTML

- `<section>` elements with IDs for navigation
- Proper heading hierarchy (h1 → h2 → h3)
- `<nav>` for navigation links

### ARIA Labels

Add labels for icon-only buttons:
```tsx
<button aria-label="View features">
  <Icon />
</button>
```

### Keyboard Navigation

All interactive elements are keyboard accessible:
- Links use `<a>` tags
- Buttons use `<button>` tags
- Focus states with `:focus-visible`

### Motion Preferences

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Example Landing Page

Create a complete landing page:

```tsx
// app/page.tsx
import {
  Hero,
  Features,
  HowItWorks,
  Security,
  Stats,
  Testimonials,
  CTA,
} from '@/components/sections';

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Security />
      <Stats />
      <Testimonials />
      <CTA />
    </>
  );
}
```

## Customization Guide

### 1. Color Scheme

Replace emerald colors with your brand:

```tsx
// Find and replace
emerald-500 → your-color-500
emerald-600 → your-color-600
emerald-400 → your-color-400
```

### 2. Content

Update text content in each component:
- Headline text
- Descriptions
- CTA button text
- Feature lists
- Statistics values

### 3. Icons

Replace SVG icons with your preferred icon library:

```tsx
// Using Heroicons
import { LockClosedIcon } from '@heroicons/react/24/outline';

// Using Lucide React
import { Lock } from 'lucide-react';
```

### 4. Images

Add actual images/screenshots:

```tsx
// Replace placeholder divs with next/image
import Image from 'next/image';

<Image
  src="/hero-screenshot.png"
  alt="App screenshot"
  width={1200}
  height={800}
  priority
/>
```

## Best Practices

### 1. Performance

- Use `loading="lazy"` for below-fold images
- Optimize images with next/image
- Keep animations under 1 second
- Use `will-change` sparingly

### 2. Responsive Design

- Test on mobile (375px), tablet (768px), desktop (1280px+)
- Use responsive text sizes (`text-4xl md:text-5xl`)
- Stack grids on mobile (`grid md:grid-cols-2`)

### 3. Browser Support

- Tested on Chrome, Firefox, Safari, Edge
- Intersection Observer polyfill for older browsers
- CSS Grid with flexbox fallback

### 4. SEO

Add proper metadata:

```tsx
export const metadata: Metadata = {
  title: 'Tallow - Secure File Transfer',
  description: 'Transfer files directly with military-grade encryption',
  openGraph: {
    images: ['/og-image.png'],
  },
};
```

## File Structure

```
components/
└── sections/
    ├── Hero.tsx          # Hero section
    ├── Features.tsx      # Feature grid
    ├── HowItWorks.tsx    # Step-by-step
    ├── Security.tsx      # Security showcase
    ├── Stats.tsx         # Statistics counter
    ├── CTA.tsx           # Call-to-action
    ├── Testimonials.tsx  # Social proof
    ├── index.ts          # Barrel export
    └── README.md         # Documentation
```

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of the Tallow project. See project LICENSE for details.

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-url]
- Discord: [your-discord]
