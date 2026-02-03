# Quick Start Guide

Get your landing page running in 5 minutes.

## 1. Installation Complete

All section components are already created in `components/sections/`:

```
✓ Hero.tsx          - Main hero section
✓ Features.tsx      - Feature grid
✓ HowItWorks.tsx    - Step-by-step guide
✓ Security.tsx      - Security showcase
✓ Stats.tsx         - Animated statistics
✓ CTA.tsx           - Call-to-action
✓ Testimonials.tsx  - User reviews
✓ index.ts          - Barrel exports
```

## 2. Update Your Landing Page

Replace `app/page.tsx` with:

```tsx
import {
  Hero,
  Features,
  HowItWorks,
  Security,
  Stats,
  Testimonials,
  CTA,
} from '@/components/sections';

export default function Home() {
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

## 3. Update Globals CSS (Optional)

Add smooth scrolling to `app/globals.css`:

```css
html {
  scroll-behavior: smooth;
}

/* Respect motion preferences */
@media (prefers-reduced-motion: reduce) {
  html {
    scroll-behavior: auto;
  }
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your landing page.

## 5. Customize Content

### Update Headlines

Edit section components directly:

**Hero.tsx:**
```tsx
<h1>
  <span>Your Custom Headline</span>
  <span>Your Subheadline</span>
</h1>
```

### Update Features

**Features.tsx:**
```tsx
const features: Feature[] = [
  {
    icon: <YourIcon />,
    title: 'Your Feature',
    description: 'Your description',
    featured: true, // Add "Featured" badge
  },
  // Add more features...
];
```

### Update Statistics

**Stats.tsx:**
```tsx
const stats: Stat[] = [
  {
    value: '100',
    suffix: 'K+',
    label: 'Happy Users',
  },
  // Add more stats...
];
```

### Update Testimonials

**Testimonials.tsx:**
```tsx
const testimonials: Testimonial[] = [
  {
    quote: 'Your testimonial text',
    author: 'Customer Name',
    role: 'Their Job Title',
    avatar: 'CN', // Initials
    rating: 5,
  },
  // Add more testimonials...
];
```

## 6. Update Colors (Optional)

Find and replace the accent color throughout all components:

```
emerald-500 → blue-500 (or your brand color)
emerald-600 → blue-600
emerald-400 → blue-400
```

Use VS Code's find-and-replace (Ctrl+Shift+H) to change all at once.

## 7. Add Images

Replace placeholder content with real images:

**Hero.tsx** - Replace the window mockup content:
```tsx
import Image from 'next/image';

<Image
  src="/hero-screenshot.png"
  alt="Tallow app interface"
  width={1200}
  height={800}
  priority
  className="rounded-lg"
/>
```

## Component Props

All components accept optional className prop for customization:

```tsx
<Hero className="custom-hero-class" />
<Features className="custom-features-class" />
```

## Section Anchors

Sections have IDs for navigation:

- `#features` - Features section
- `#how-it-works` - How It Works section
- `#security` - Security section

Link to sections:
```tsx
<a href="#features">View Features</a>
```

## Key Features

### Animations
- Fade in on scroll (Intersection Observer)
- Staggered entrance animations
- Hover effects and micro-interactions
- Smooth transitions

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Fluid typography and spacing
- Optimized for all screen sizes

### Performance
- Client-side only when needed
- Intersection Observer for lazy animations
- Optimized re-renders
- No external dependencies

### Accessibility
- Semantic HTML elements
- Proper heading hierarchy
- Keyboard navigation
- ARIA labels where needed

## Common Customizations

### Change Button Text

**Hero.tsx:**
```tsx
<a href="/app">Your CTA Text</a>
```

**CTA.tsx:**
```tsx
<a href="/app">Your Action Button</a>
```

### Add New Section

Create new component in `components/sections/`:

```tsx
// components/sections/Pricing.tsx
'use client';

export function Pricing() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Your content */}
    </section>
  );
}
```

Export in `index.ts`:
```tsx
export { Pricing } from './Pricing';
```

Use in page:
```tsx
import { Hero, Features, Pricing } from '@/components/sections';
```

### Remove Section

Simply don't import/use unwanted sections:

```tsx
// Remove Testimonials
import { Hero, Features, CTA } from '@/components/sections';

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <CTA />
    </>
  );
}
```

## Troubleshooting

### Animations not working

Make sure components are client components:
```tsx
'use client';
```

### Styles not applying

Check Tailwind config includes component directory:
```js
// tailwind.config.ts
content: [
  './components/**/*.{js,ts,jsx,tsx}',
  './app/**/*.{js,ts,jsx,tsx}',
],
```

### TypeScript errors

Run type check:
```bash
npm run type-check
```

### Build errors

Clear Next.js cache:
```bash
rm -rf .next
npm run build
```

## Next Steps

1. **Add real content** - Replace placeholder text and stats
2. **Add images** - Use actual screenshots and photos
3. **Customize colors** - Match your brand palette
4. **Add navigation** - Use the ScrollNav from EXAMPLE.tsx
5. **Setup analytics** - Add tracking to CTAs
6. **Test responsiveness** - Check on all screen sizes
7. **Optimize images** - Use next/image for performance
8. **Deploy** - Push to production

## Resources

- Full documentation: `components/sections/README.md`
- Example implementation: `components/sections/EXAMPLE.tsx`
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

## Support

Having issues? Check:
1. Console for errors
2. Component props are correct
3. All imports are valid
4. CSS classes are recognized by Tailwind

Need help? Open an issue on GitHub or join the Discord.
