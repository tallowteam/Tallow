# Responsive Component Showcase
## Interactive Examples of Multi-Device Components

**Comprehensive guide to using Tallow's responsive component library**

---

## Table of Contents

1. [Responsive Grid Components](#responsive-grid-components)
2. [Container Components](#container-components)
3. [Navigation Components](#navigation-components)
4. [Layout Components](#layout-components)
5. [Typography Components](#typography-components)
6. [Interactive Components](#interactive-components)

---

## Responsive Grid Components

### 1. ResponsiveGrid

The foundational grid component that automatically adjusts columns based on breakpoint.

```tsx
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

// Basic usage
export function BasicGrid() {
  return (
    <ResponsiveGrid>
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
      <div>Item 4</div>
    </ResponsiveGrid>
  );
}

// Custom columns per breakpoint
export function CustomGrid() {
  return (
    <ResponsiveGrid
      columns={{
        mobile: 1,    // 1 column on mobile
        tablet: 2,    // 2 columns on tablet
        laptop: 3,    // 3 columns on laptop
        desktop: 4,   // 4 columns on desktop
        tv: 4,        // 4 columns on TV
      }}
      gap={{
        mobile: 4,    // 1rem gap on mobile
        tablet: 6,    // 1.5rem on tablet
        laptop: 8,    // 2rem on laptop
      }}
    >
      {items.map(item => <GridItem key={item.id} {...item} />)}
    </ResponsiveGrid>
  );
}

// Auto-fill with minimum width
export function AutoFillGrid() {
  return (
    <ResponsiveGrid
      minChildWidth="250px"  // Minimum card width
      autoFill={true}        // Auto-fill available space
      gap={6}
    >
      {products.map(product => <ProductCard key={product.id} {...product} />)}
    </ResponsiveGrid>
  );
}
```

**Visual Result:**

```
Mobile (320px):          Tablet (768px):
┌──────────────┐        ┌──────────┬──────────┐
│   Item 1     │        │  Item 1  │  Item 2  │
├──────────────┤        ├──────────┼──────────┤
│   Item 2     │        │  Item 3  │  Item 4  │
└──────────────┘        └──────────┴──────────┘

Desktop (1440px):
┌───────┬───────┬───────┬───────┐
│ Item 1│ Item 2│ Item 3│ Item 4│
└───────┴───────┴───────┴───────┘
```

### 2. FeatureGrid

Preset grid optimized for feature cards.

```tsx
import { FeatureGrid } from '@/components/ui/responsive-grid';

export function FeaturesSection() {
  const features = [
    { icon: Zap, title: 'Fast', description: 'Lightning fast transfers' },
    { icon: Shield, title: 'Secure', description: 'End-to-end encrypted' },
    { icon: Eye, title: 'Private', description: 'Zero knowledge' },
    // ...more features
  ];

  return (
    <FeatureGrid>
      {features.map((feature, i) => (
        <div key={i} className="card-feature">
          <feature.icon className="w-12 h-12 mb-4" />
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-muted-foreground">{feature.description}</p>
        </div>
      ))}
    </FeatureGrid>
  );
}
```

**Automatic Behavior:**
- Mobile: 1 column, 1rem gap
- Tablet: 2 columns, 1.5rem gap
- Laptop: 3 columns, 1.5rem gap
- Desktop: 4 columns, 2rem gap
- TV: 4 large columns, 3rem gap

### 3. CardGrid

Preset grid for card layouts.

```tsx
import { CardGrid } from '@/components/ui/responsive-grid';

export function BlogPosts() {
  return (
    <CardGrid dense={false}>
      {posts.map(post => (
        <article key={post.id} className="card-clean">
          <img src={post.image} alt={post.title} />
          <h3>{post.title}</h3>
          <p>{post.excerpt}</p>
        </article>
      ))}
    </CardGrid>
  );
}

// Dense variant (more columns)
export function DenseGallery() {
  return (
    <CardGrid dense={true}>
      {images.map(img => <ImageCard key={img.id} {...img} />)}
    </CardGrid>
  );
}
```

**Dense Mode Columns:**
- Mobile: 1
- Tablet: 2
- Laptop: 4 (instead of 3)
- Desktop: 5 (instead of 4)
- TV: 4

### 4. MasonryGrid

Pinterest-style masonry layout.

```tsx
import { MasonryGrid } from '@/components/ui/responsive-grid';

export function PhotoGallery() {
  return (
    <MasonryGrid>
      {photos.map(photo => (
        <div key={photo.id} className="break-inside-avoid mb-4">
          <img src={photo.url} alt={photo.alt} className="w-full rounded-lg" />
          <p className="mt-2">{photo.caption}</p>
        </div>
      ))}
    </MasonryGrid>
  );
}
```

### 5. GalleryGrid

Auto-fill grid with minimum card width.

```tsx
import { GalleryGrid } from '@/components/ui/responsive-grid';

export function ImageGallery() {
  return (
    <GalleryGrid>
      {images.map(img => (
        <div key={img.id} className="aspect-square rounded-lg overflow-hidden">
          <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
        </div>
      ))}
    </GalleryGrid>
  );
}
```

---

## Container Components

### 1. ResponsiveContainer

Main container with responsive padding and max-width.

```tsx
import { ResponsiveContainer } from '@/components/ui/responsive-container';

// Default container (maxWidth: 'default')
export function DefaultLayout() {
  return (
    <ResponsiveContainer>
      <h1>Page Title</h1>
      <p>Content goes here...</p>
    </ResponsiveContainer>
  );
}

// Custom max-width per breakpoint
export function CustomContainer() {
  return (
    <ResponsiveContainer
      maxWidth={{
        mobile: '100%',
        tablet: '600px',
        laptop: '800px',
        desktop: '1000px',
        tv: '1200px',
      }}
      padding={{
        mobile: 4,    // 1rem
        tablet: 6,    // 1.5rem
        laptop: 8,    // 2rem
        desktop: 10,  // 2.5rem
        tv: 16,       // 4rem
      }}
    >
      <h1>Custom Sized Container</h1>
    </ResponsiveContainer>
  );
}

// Disable padding
export function NoPaddingContainer() {
  return (
    <ResponsiveContainer padding={false}>
      <div>Full-width content</div>
    </ResponsiveContainer>
  );
}
```

### 2. NarrowContainer

Optimized for reading content (articles, documentation).

```tsx
import { NarrowContainer } from '@/components/ui/responsive-container';

export function ArticlePage() {
  return (
    <NarrowContainer>
      <article>
        <h1>Article Title</h1>
        <p>Optimal line length for readability (65-75 characters).</p>
        <p>Perfect for long-form content.</p>
      </article>
    </NarrowContainer>
  );
}
```

**Max Widths:**
- Mobile: 100%
- Tablet: 640px
- Laptop: 768px
- Desktop: 896px
- TV: 1024px

### 3. WideContainer

For dashboards and data-heavy interfaces.

```tsx
import { WideContainer } from '@/components/ui/responsive-container';

export function DashboardPage() {
  return (
    <WideContainer>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Users" value="1,234" />
        <StatCard title="Revenue" value="$56,789" />
        <StatCard title="Growth" value="+23%" />
      </div>
    </WideContainer>
  );
}
```

**Max Widths:**
- Mobile: 100%
- Tablet: 100%
- Laptop: 1280px
- Desktop: 1536px
- TV: 1920px

### 4. SectionContainer

Container with vertical spacing for page sections.

```tsx
import { SectionContainer } from '@/components/ui/responsive-container';

export function LandingPage() {
  return (
    <>
      <SectionContainer spacing="spacious">
        <h2>Hero Section</h2>
        <p>Large vertical spacing for visual separation.</p>
      </SectionContainer>

      <SectionContainer spacing="default">
        <h2>Features Section</h2>
        <FeatureGrid>...</FeatureGrid>
      </SectionContainer>

      <SectionContainer spacing="compact">
        <h2>Footer</h2>
        <FooterContent />
      </SectionContainer>
    </>
  );
}
```

**Spacing Options:**
- `compact`: Smaller vertical padding
- `default`: Standard vertical padding
- `spacious`: Generous vertical padding

---

## Typography Components

### Responsive Headings

```tsx
// Using utility classes
export function ResponsiveHeadings() {
  return (
    <>
      {/* Display XL - Hero headlines */}
      <h1 className="
        text-4xl           /* Mobile: 36px */
        xs:text-5xl        /* Small phone: 48px */
        sm:text-6xl        /* Phone: 60px */
        md:text-7xl        /* Large phone: 72px */
        tablet:text-8xl    /* Tablet: 96px */
        laptop:text-9xl    /* Laptop: 128px */
        desktop:text-[10rem] /* Desktop: 160px */
        tv:text-[12rem]    /* TV: 192px */
        font-light tracking-[-0.02em] leading-[0.95]
      ">
        SECURE FILE sharing
      </h1>

      {/* Display LG - Section headlines */}
      <h2 className="
        text-3xl
        sm:text-4xl
        tablet:text-5xl
        laptop:text-6xl
        desktop:text-7xl
        tv:text-8xl
        font-light tracking-[-0.02em]
      ">
        Section Headline
      </h2>

      {/* Heading XL - Page titles */}
      <h2 className="
        text-2xl
        tablet:text-3xl
        laptop:text-4xl
        desktop:text-5xl
        tv:text-6xl
        font-semibold tracking-[-0.01em]
      ">
        Page Title
      </h2>

      {/* Body text - Responsive sizing */}
      <p className="
        text-sm
        tablet:text-base
        desktop:text-lg
        tv:text-2xl
        text-muted-foreground leading-relaxed
      ">
        Body text that scales appropriately for each device.
      </p>
    </>
  );
}

// Using responsive hook
export function DynamicHeading({ children }) {
  const { breakpoint } = useBreakpoint();

  const sizeClasses = {
    mobile: 'text-3xl',
    tablet: 'text-4xl',
    laptop: 'text-5xl',
    desktop: 'text-6xl',
    tv: 'text-8xl',
  };

  return (
    <h1 className={`font-serif ${sizeClasses[breakpoint]}`}>
      {children}
    </h1>
  );
}
```

---

## Interactive Components

### 1. Responsive Buttons

```tsx
export function ResponsiveButton({ children, ...props }) {
  const { isMobile, isTV } = useBreakpoint();

  return (
    <button
      {...props}
      className={`
        ${isMobile ? 'min-h-[44px] px-4 py-3 text-sm' : ''}
        ${isTV ? 'min-h-[80px] px-12 py-6 text-2xl' : ''}
        ${!isMobile && !isTV ? 'min-h-[36px] px-6 py-2 text-base' : ''}
        rounded-lg
        bg-primary text-primary-foreground
        touch-manipulation
        transition-all duration-200
        hover:scale-105
        active:scale-95
      `}
    >
      {children}
    </button>
  );
}

// Touch-optimized button
export function TouchButton({ children, ...props }) {
  const touchSize = deviceDetection.getOptimalTouchTargetSize();

  return (
    <button
      {...props}
      style={{
        minWidth: touchSize,
        minHeight: touchSize,
      }}
      className="px-6 rounded-lg bg-primary text-primary-foreground touch-manipulation"
    >
      {children}
    </button>
  );
}
```

### 2. Responsive Modal/Dialog

```tsx
import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';

export function ResponsiveDialog({ open, onClose, children }) {
  const { isMobile } = useBreakpoint();

  // Mobile: Bottom sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent
          side="bottom"
          className="h-[80vh] rounded-t-3xl"
        >
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Centered dialog
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {children}
      </DialogContent>
    </Dialog>
  );
}
```

### 3. Responsive Card

```tsx
export function ResponsiveCard({ title, description, image }) {
  return (
    <div className="
      card-feature
      p-4              /* Mobile: 1rem */
      tablet:p-6       /* Tablet: 1.5rem */
      laptop:p-8       /* Laptop: 2rem */
      desktop:p-10     /* Desktop: 2.5rem */
      tv:p-16          /* TV: 4rem */
    ">
      {image && (
        <img
          src={image}
          alt={title}
          className="
            w-full h-32
            tablet:h-40
            laptop:h-48
            desktop:h-56
            tv:h-80
            object-cover rounded-lg mb-4
          "
        />
      )}
      <h3 className="
        text-lg
        tablet:text-xl
        laptop:text-2xl
        tv:text-4xl
        font-semibold mb-2
      ">
        {title}
      </h3>
      <p className="
        text-sm
        tablet:text-base
        tv:text-xl
        text-muted-foreground
      ">
        {description}
      </p>
    </div>
  );
}
```

### 4. Responsive Form

```tsx
export function ResponsiveForm() {
  return (
    <form className="space-y-4 tablet:space-y-6">
      {/* Form grid - responsive columns */}
      <div className="
        grid
        grid-cols-1        /* Mobile: single column */
        tablet:grid-cols-2 /* Tablet: 2 columns */
        gap-4 tablet:gap-6
      ">
        <div className="tablet:col-span-2">
          <label className="block mb-2 text-sm tablet:text-base tv:text-xl">
            Name
          </label>
          <input
            type="text"
            className="
              w-full
              h-12           /* Mobile: 48px */
              tablet:h-14    /* Tablet: 56px */
              tv:h-20        /* TV: 80px */
              px-4 tablet:px-6
              text-sm tablet:text-base tv:text-xl
              border border-border rounded-lg
            "
          />
        </div>

        <div>
          <label className="block mb-2 text-sm tablet:text-base tv:text-xl">
            Email
          </label>
          <input
            type="email"
            className="
              w-full h-12 tablet:h-14 tv:h-20
              px-4 tablet:px-6
              text-sm tablet:text-base tv:text-xl
              border border-border rounded-lg
            "
          />
        </div>

        <div>
          <label className="block mb-2 text-sm tablet:text-base tv:text-xl">
            Phone
          </label>
          <input
            type="tel"
            className="
              w-full h-12 tablet:h-14 tv:h-20
              px-4 tablet:px-6
              text-sm tablet:text-base tv:text-xl
              border border-border rounded-lg
            "
          />
        </div>

        <div className="tablet:col-span-2">
          <label className="block mb-2 text-sm tablet:text-base tv:text-xl">
            Message
          </label>
          <textarea
            className="
              w-full
              h-32           /* Mobile: 128px */
              tablet:h-40    /* Tablet: 160px */
              tv:h-60        /* TV: 240px */
              px-4 tablet:px-6 py-3
              text-sm tablet:text-base tv:text-xl
              border border-border rounded-lg
            "
          />
        </div>
      </div>

      <button
        type="submit"
        className="
          w-full tablet:w-auto
          min-h-[44px] tablet:min-h-[48px] tv:min-h-[80px]
          px-6 tablet:px-8 tv:px-12
          text-sm tablet:text-base tv:text-xl
          bg-primary text-primary-foreground
          rounded-lg
          touch-manipulation
        "
      >
        Submit
      </button>
    </form>
  );
}
```

---

## Real-World Examples

### Complete Landing Page Section

```tsx
import { ResponsiveContainer } from '@/components/ui/responsive-container';
import { FeatureGrid } from '@/components/ui/responsive-grid';

export function FeaturesSection() {
  const features = [
    { icon: Zap, title: 'Fast', description: 'Lightning fast transfers' },
    { icon: Shield, title: 'Secure', description: 'Post-quantum encryption' },
    { icon: Eye, title: 'Private', description: 'Zero knowledge architecture' },
    { icon: Users, title: 'Group', description: 'Send to multiple recipients' },
    { icon: Folder, title: 'Folders', description: 'Transfer entire directories' },
    { icon: Globe, title: 'Anywhere', description: 'Works worldwide via P2P' },
  ];

  return (
    <section className="
      py-12           /* Mobile: 3rem */
      tablet:py-16    /* Tablet: 4rem */
      laptop:py-20    /* Laptop: 5rem */
      desktop:py-24   /* Desktop: 6rem */
      tv:py-32        /* TV: 8rem */
      border-t border-border
    ">
      <ResponsiveContainer>
        {/* Section Header */}
        <div className="text-center mb-8 tablet:mb-12 laptop:mb-16">
          <p className="
            text-xs
            uppercase tracking-[0.2em]
            text-muted-foreground
            mb-4
          ">
            Features
          </p>
          <h2 className="
            text-3xl
            tablet:text-4xl
            laptop:text-5xl
            desktop:text-6xl
            tv:text-8xl
            font-serif
          ">
            Everything You Need
          </h2>
        </div>

        {/* Feature Grid */}
        <FeatureGrid>
          {features.map((feature, i) => (
            <div
              key={i}
              className="
                card-feature
                p-4 tablet:p-6 laptop:p-8 tv:p-12
              "
            >
              <div className="
                w-10 h-10
                tablet:w-12 tablet:h-12
                laptop:w-14 laptop:h-14
                tv:w-20 tv:h-20
                rounded-full
                flex items-center justify-center
                bg-secondary
                mb-4 tablet:mb-6
              ">
                <feature.icon className="
                  w-5 h-5
                  tablet:w-6 tablet:h-6
                  laptop:w-7 laptop:h-7
                  tv:w-10 tv:h-10
                " />
              </div>
              <h3 className="
                text-lg
                tablet:text-xl
                laptop:text-2xl
                tv:text-4xl
                font-semibold
                mb-2 tablet:mb-3
              ">
                {feature.title}
              </h3>
              <p className="
                text-sm
                tablet:text-base
                laptop:text-lg
                tv:text-2xl
                text-muted-foreground
                leading-relaxed
              ">
                {feature.description}
              </p>
            </div>
          ))}
        </FeatureGrid>
      </ResponsiveContainer>
    </section>
  );
}
```

### Complete App Transfer Interface

```tsx
import { useBreakpoint } from '@/lib/hooks/use-breakpoint';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

export function TransferInterface() {
  const { isMobile, isTablet } = useBreakpoint();

  // Mobile: Stacked layout
  if (isMobile) {
    return (
      <div className="p-4 space-y-4">
        <FileSelector />
        <TransferOptions />
        <TransferButton />
        <TransferQueue />
      </div>
    );
  }

  // Tablet: Split view
  if (isTablet) {
    return (
      <div className="grid grid-cols-2 gap-6 h-screen">
        <div className="p-6 border-r border-border overflow-y-auto">
          <FileSelector />
          <TransferOptions />
        </div>
        <div className="p-6 overflow-y-auto">
          <TransferQueue />
        </div>
      </div>
    );
  }

  // Desktop/Laptop: Three-panel layout
  return (
    <div className="grid grid-cols-[280px_1fr_320px] h-screen">
      <aside className="p-6 border-r border-border overflow-y-auto">
        <DeviceList />
        <FriendsList />
      </aside>
      <main className="p-8 overflow-y-auto">
        <FileSelector />
        <TransferOptions />
        <TransferButton />
      </main>
      <aside className="p-6 border-l border-border overflow-y-auto">
        <TransferQueue />
        <ActiveTransfers />
      </aside>
    </div>
  );
}
```

---

## Best Practices

### 1. Always Use Semantic Breakpoints

```tsx
// Good - Semantic and maintainable
const columns = {
  mobile: 1,
  tablet: 2,
  laptop: 3,
  desktop: 4,
};

// Avoid - Magic numbers
const columns = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
};
```

### 2. Provide Responsive Fallbacks

```tsx
// Good - Handles all breakpoints
<ResponsiveGrid
  columns={{
    mobile: 1,
    tablet: 2,
    laptop: 3,
    desktop: 4,
    tv: 4,
  }}
>

// Avoid - Missing breakpoints
<ResponsiveGrid
  columns={{
    mobile: 1,
    desktop: 4,
  }}
>
```

### 3. Use Touch-Optimized Components on Touch Devices

```tsx
// Good - Device-appropriate sizing
const { isTouchDevice } = useBreakpoint();
const minHeight = isTouchDevice ? 44 : 36;

// Avoid - Fixed sizes for all devices
const minHeight = 32; // Too small for touch!
```

### 4. Test on Real Devices

```tsx
// Always test:
- iPhone SE (smallest common phone)
- iPad (common tablet)
- Laptop at 1366px (common laptop resolution)
- Desktop at 1920px
- TV simulation (browser at 200% zoom)
```

---

## Quick Reference

### Component Import Paths

```typescript
// Grids
import {
  ResponsiveGrid,
  FeatureGrid,
  CardGrid,
  MasonryGrid,
  GalleryGrid,
  ListGrid,
} from '@/components/ui/responsive-grid';

// Containers
import {
  ResponsiveContainer,
  NarrowContainer,
  WideContainer,
  FullWidthContainer,
  SectionContainer,
} from '@/components/ui/responsive-container';

// Navigation
import {
  ResponsiveNav,
  useNavHeight,
  NavSpacer,
} from '@/components/navigation/responsive-nav';

// Hooks
import {
  useBreakpoint,
  useMatchBreakpoint,
  useResponsiveValue,
  useMediaQuery,
} from '@/lib/hooks/use-breakpoint';

// Utilities
import { deviceDetection } from '@/lib/utils/device-detection';
```

### Common Patterns Cheat Sheet

```tsx
// Conditional rendering by device
const { isMobile } = useBreakpoint();
return isMobile ? <Mobile /> : <Desktop />;

// Responsive values
const columns = useResponsiveValue({
  mobile: 1,
  desktop: 3,
});

// Device capabilities
const hasTouch = deviceDetection.isTouchDevice();
const minSize = deviceDetection.getOptimalTouchTargetSize();

// Custom media query
const isLandscape = useMediaQuery('(orientation: landscape)');
```

---

*Component Showcase v1.0 - Last Updated: 2026-01-28*
