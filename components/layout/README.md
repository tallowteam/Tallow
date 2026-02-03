# Layout Components

Production-ready layout components for Tallow's website. These form the structural foundation for all pages with consistent spacing, responsive behavior, and modern design patterns.

## Components Overview

### Container

Content container with max-width variants and responsive padding.

```tsx
import { Container } from '@/components/layout';

<Container size="lg">
  <h1>Page content</h1>
</Container>
```

**Props:**
- `size`: `'sm' | 'md' | 'lg' | 'xl' | 'full'` (default: `'lg'`)
- `className`: Additional CSS classes
- `as`: HTML element (`'div' | 'section' | 'article' | 'main' | 'aside'`)

**Size variants:**
- `sm`: 768px (48rem)
- `md`: 1024px (64rem)
- `lg`: 1280px (80rem)
- `xl`: 1400px
- `full`: 100%

**Responsive padding:**
- Mobile: 16px (1rem)
- Tablet: 24px (1.5rem)
- Desktop: 32px (2rem)

---

### Section

Page section wrapper with consistent vertical spacing and background variants.

```tsx
import { Section } from '@/components/layout';

<Section variant="gradient" id="features">
  <Container>
    <h2>Features</h2>
  </Container>
</Section>
```

**Props:**
- `variant`: `'default' | 'accent' | 'muted' | 'gradient'` (default: `'default'`)
- `className`: Additional CSS classes
- `id`: Anchor link ID
- `as`: HTML element (`'section' | 'div' | 'article'`)

**Variants:**
- `default`: Transparent background
- `accent`: `bg-zinc-900/50`
- `muted`: `bg-zinc-950/30`
- `gradient`: Vertical gradient from transparent to muted

**Vertical spacing:**
- Mobile: 48px (3rem)
- Tablet: 64px (4rem)
- Desktop: 96px (6rem)

---

### Grid

Responsive grid system with configurable columns and gaps.

```tsx
import { Grid } from '@/components/layout';

<Grid cols={3} gap="lg">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Grid>
```

**Props:**
- `cols`: `1 | 2 | 3 | 4` (default: `3`)
- `gap`: `'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `className`: Additional CSS classes
- `responsive`: Enable responsive breakpoints (default: `true`)

**Responsive behavior:**
- 1 col: Always 1 column
- 2 cols: 1 on mobile, 2 on tablet+
- 3 cols: 1 on mobile, 2 on tablet, 3 on desktop
- 4 cols: 1 on mobile, 2 on tablet, 4 on desktop

**Gap sizes:**
- `sm`: 16px (1rem)
- `md`: 24px (1.5rem)
- `lg`: 32px (2rem)
- `xl`: 48px (3rem)

---

### Stack

Flex-based stack component for consistent spacing and alignment.

```tsx
import { Stack } from '@/components/layout';

<Stack direction="vertical" gap="md" align="center">
  <Button>Action 1</Button>
  <Button>Action 2</Button>
</Stack>
```

**Props:**
- `direction`: `'vertical' | 'horizontal'` (default: `'vertical'`)
- `gap`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `align`: `'start' | 'center' | 'end' | 'stretch'` (default: `'stretch'`)
- `justify`: `'start' | 'center' | 'end' | 'between' | 'around'` (default: `'start'`)
- `className`: Additional CSS classes
- `wrap`: Enable flex-wrap (default: `false`)

**Gap sizes:**
- `xs`: 8px (0.5rem)
- `sm`: 16px (1rem)
- `md`: 24px (1.5rem)
- `lg`: 32px (2rem)
- `xl`: 48px (3rem)

---

### Header

Site navigation header with logo, links, CTA, and mobile menu.

```tsx
import { Header } from '@/components/layout';

<Header />
```

**Features:**
- Sticky positioning
- Glassmorphism effect on scroll
- Responsive navigation
- Mobile hamburger menu
- Active link highlighting
- Smooth transitions (300ms ease-out)

**Behavior:**
- Default: Transparent with no border
- Scrolled (>20px): Blurred background with bottom border

---

### Footer

Site footer with multi-column layout, links, social icons, and newsletter.

```tsx
import { Footer } from '@/components/layout';

<Footer />
```

**Sections:**
- Brand column with logo and social links
- 4 link columns (Product, Resources, Company, Legal)
- Newsletter signup form
- Bottom bar with copyright and legal links

**Responsive behavior:**
- Mobile: Stacked single column
- Tablet: 2 columns
- Desktop: 5 columns (1 brand + 4 link sections)

---

### MobileNav

Mobile navigation drawer with slide-in animation and focus management.

```tsx
import { MobileNav } from '@/components/layout';

<MobileNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
  <nav>
    <Link href="/features">Features</Link>
    <Link href="/security">Security</Link>
  </nav>
</MobileNav>
```

**Props:**
- `isOpen`: Boolean controlling drawer visibility
- `onClose`: Callback function when drawer closes
- `children`: Drawer content

**Features:**
- Slide-in animation from right (300ms ease-out)
- Backdrop with blur effect
- Body scroll lock when open
- Close on Escape key
- Close on backdrop click
- Portal rendering
- Focus trap

---

## Design System

### Colors (Dark Theme)

```css
Background: zinc-950 (#09090b)
Card: zinc-900 (#18181b)
Border: zinc-800 (#27272a)
Text Primary: zinc-100 (#f4f4f5)
Text Secondary: zinc-400 (#a1a1aa)
Accent: zinc-700-900 gradient
```

### Spacing Scale

```
xs: 0.5rem (8px)
sm: 1rem (16px)
md: 1.5rem (24px)
lg: 2rem (32px)
xl: 3rem (48px)
```

### Breakpoints

```
sm: 640px
md: 768px
lg: 1024px
xl: 1280px
2xl: 1536px
```

### Transitions

```css
Duration: 200-300ms
Easing: ease-out
Properties: colors, opacity, transform, backdrop-filter
```

### Effects

**Glassmorphism:**
```css
background: zinc-950/80
backdrop-filter: blur(12px)
border: 1px solid zinc-800/50
```

**Gradients:**
```css
Vertical: from-zinc-950/0 via-zinc-900/30 to-zinc-950/0
Brand: from-zinc-700 to-zinc-900
```

---

## Usage Examples

### Basic Page Layout

```tsx
import { Header, Footer, Section, Container } from '@/components/layout';

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Section variant="default">
          <Container>
            <h1>Page Title</h1>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
```

### Feature Grid Layout

```tsx
import { Section, Container, Grid } from '@/components/layout';

<Section variant="gradient" id="features">
  <Container>
    <h2>Features</h2>
    <Grid cols={3} gap="lg">
      <FeatureCard title="Feature 1" />
      <FeatureCard title="Feature 2" />
      <FeatureCard title="Feature 3" />
    </Grid>
  </Container>
</Section>
```

### Hero Section with CTA Stack

```tsx
import { Section, Container, Stack } from '@/components/layout';
import { Button } from '@/components/ui/button';

<Section>
  <Container size="md">
    <Stack direction="vertical" gap="lg" align="center">
      <h1>Hero Title</h1>
      <p>Hero description</p>
      <Stack direction="horizontal" gap="md">
        <Button>Primary CTA</Button>
        <Button variant="outline">Secondary CTA</Button>
      </Stack>
    </Stack>
  </Container>
</Section>
```

### Two-Column Content Layout

```tsx
import { Section, Container, Grid, Stack } from '@/components/layout';

<Section variant="muted">
  <Container>
    <Grid cols={2} gap="xl">
      <Stack direction="vertical" gap="md">
        <h2>Left Column</h2>
        <p>Content here</p>
      </Stack>
      <Stack direction="vertical" gap="md">
        <h2>Right Column</h2>
        <p>Content here</p>
      </Stack>
    </Grid>
  </Container>
</Section>
```

---

## Accessibility

All layout components follow WCAG 2.1 Level AA guidelines:

- **Semantic HTML**: Proper heading hierarchy, semantic elements
- **Keyboard Navigation**: All interactive elements accessible via keyboard
- **Focus Management**: Visible focus indicators, logical tab order
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: 4.5:1 minimum for text
- **Responsive Text**: Scales properly up to 200% zoom

### Focus Trap in MobileNav

The mobile navigation implements a focus trap to ensure keyboard users can't tab outside the drawer when it's open.

### Skip Links

Add skip links in your root layout:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

---

## Performance

### Code Splitting

Components are optimized for code splitting:
- Header and Footer are client components (use 'use client')
- Static components (Container, Section, Grid, Stack) are server components
- MobileNav uses React Portal for optimal rendering

### Bundle Size

Approximate bundle sizes (gzipped):
- Container: ~0.3 KB
- Section: ~0.4 KB
- Grid: ~0.5 KB
- Stack: ~0.6 KB
- Header: ~2.5 KB (includes navigation logic)
- Footer: ~2.8 KB (includes link data)
- MobileNav: ~1.2 KB (includes portal logic)

### Optimization Tips

1. **Use Server Components**: Container, Section, Grid, and Stack are server components by default
2. **Lazy Load Footer**: Consider lazy loading footer on long pages
3. **Memoize Navigation**: Header uses pathname detection, ensure proper memoization
4. **Optimize Icons**: Use tree-shakeable icon libraries (lucide-react)

---

## Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react';
import { Container } from '@/components/layout';

describe('Container', () => {
  it('renders children', () => {
    render(<Container>Test content</Container>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<Container size="sm">Test</Container>);
    expect(container.firstChild).toHaveClass('max-w-3xl');
  });
});
```

### E2E Tests

```tsx
import { test, expect } from '@playwright/test';

test('mobile navigation works', async ({ page }) => {
  await page.goto('/');

  // Open mobile menu
  await page.click('[aria-label="Open menu"]');
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Close on backdrop click
  await page.click('[aria-hidden="true"]');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();
});
```

---

## Migration Guide

### From Custom Layouts

If migrating from custom layout components:

1. **Replace inline containers:**
   ```tsx
   // Before
   <div className="max-w-7xl mx-auto px-4">
     {children}
   </div>

   // After
   <Container size="lg">
     {children}
   </Container>
   ```

2. **Replace section wrappers:**
   ```tsx
   // Before
   <section className="py-24">
     {children}
   </section>

   // After
   <Section>
     {children}
   </Section>
   ```

3. **Replace grid layouts:**
   ```tsx
   // Before
   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
     {items.map(item => <Card key={item.id} {...item} />)}
   </div>

   // After
   <Grid cols={3} gap="lg">
     {items.map(item => <Card key={item.id} {...item} />)}
   </Grid>
   ```

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

### CSS Features Used

- CSS Grid (95%+ support)
- Flexbox (98%+ support)
- backdrop-filter (94%+ support, graceful degradation)
- CSS custom properties (95%+ support)
- CSS transforms (98%+ support)

---

## Contributing

When adding new layout components:

1. Follow TypeScript strict mode
2. Add proper JSDoc comments
3. Export types and components from index.ts
4. Add usage examples to README
5. Ensure accessibility compliance
6. Add unit tests
7. Update visual documentation

---

## Related Components

- **UI Components**: `/components/ui` - Buttons, cards, inputs
- **Marketing Components**: `/components/marketing` - Hero, features, testimonials
- **Content Components**: `/components/content` - Text blocks, media, code

---

## License

MIT License - see LICENSE file for details
