# Landing Page Components - Use Case Grid & Technology Showcase

Two powerful React components for showcasing use cases and technologies on the Tallow landing page.

## Table of Contents

- [Overview](#overview)
- [Components](#components)
  - [UseCaseGrid](#usecasegrid)
  - [TechnologyShowcase](#technologyshowcase)
- [Installation](#installation)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Accessibility](#accessibility)
- [Responsive Design](#responsive-design)
- [Customization](#customization)
- [Testing](#testing)

## Overview

These components are built with:
- **React 18+** with TypeScript
- **Framer Motion** for smooth animations
- **Lucide Icons** for consistent iconography
- **Tailwind CSS** with custom design system
- **Full accessibility** (WCAG 2.1 AA compliant)
- **Responsive design** (mobile-first approach)

## Components

### UseCaseGrid

Showcases 6 real-world use case scenarios for different user personas.

**Features:**
- 6 default use cases (Privacy Advocates, Enterprise Teams, Creative Professionals, Healthcare Providers, Legal Professionals, Developers)
- Responsive grid: 3 columns (desktop), 2 columns (tablet), 1 column (mobile)
- Hover effects with 4px lift and shadow enhancement
- Smooth scroll-triggered animations
- Full keyboard navigation support

**File Location:** `components/features/use-case-grid.tsx`

### TechnologyShowcase

Highlights 3 cutting-edge technologies used in Tallow.

**Features:**
- 3 default technologies (ML-KEM-768, Triple Ratchet Protocol, WebRTC DataChannels)
- Large cards with detailed descriptions
- "Why This Matters" sections
- Links to security/help pages
- CTA section with action buttons
- Responsive grid: 3 columns (desktop), 1 column (mobile)

**File Location:** `components/features/technology-showcase.tsx`

## Installation

Both components are already integrated into the project. No additional installation needed.

```bash
# If you need to add them to a new project
npm install framer-motion lucide-react
```

## Usage Examples

### Basic Usage

#### UseCaseGrid

```tsx
import { UseCaseGrid } from "@/components/features/use-case-grid";

export default function LandingPage() {
  return (
    <section className="section-content">
      <div className="container-full">
        <UseCaseGrid />
      </div>
    </section>
  );
}
```

#### TechnologyShowcase

```tsx
import { TechnologyShowcase } from "@/components/features/technology-showcase";

export default function LandingPage() {
  return (
    <section className="section-content">
      <div className="container-full">
        <TechnologyShowcase />
      </div>
    </section>
  );
}
```

### Custom Use Cases

```tsx
import { UseCaseGrid, UseCase } from "@/components/features/use-case-grid";

const customUseCases: UseCase[] = [
  {
    id: "education",
    icon: "GraduationCap",
    persona: "Educators",
    scenario: "Professor sharing lecture materials with students securely",
    features: [
      "Student group sharing",
      "Assignment submissions",
      "Resource distribution",
      "Privacy-first approach",
    ],
  },
  // ... more use cases
];

export default function CustomPage() {
  return <UseCaseGrid useCases={customUseCases} />;
}
```

### Custom Technologies

```tsx
import { TechnologyShowcase, Technology } from "@/components/features/technology-showcase";

const customTechnologies: Technology[] = [
  {
    id: "zero-knowledge",
    icon: "Eye",
    name: "Zero-Knowledge Architecture",
    description: "End-to-end encryption ensures complete privacy",
    why: "No trust required in the service provider",
    link: "/security",
  },
  // ... more technologies
];

export default function CustomPage() {
  return <TechnologyShowcase technologies={customTechnologies} />;
}
```

### Dark Section Integration

```tsx
export default function LandingPage() {
  return (
    <>
      {/* Light section */}
      <section className="section-content">
        <div className="container-full">
          <UseCaseGrid />
        </div>
      </section>

      {/* Dark section */}
      <section className="section-dark">
        <div className="container-full">
          <TechnologyShowcase />
        </div>
      </section>
    </>
  );
}
```

## API Reference

### UseCaseGrid Props

```typescript
interface UseCaseGridProps {
  useCases?: UseCase[];  // Optional: defaults to DEFAULT_USE_CASES
  className?: string;     // Optional: custom CSS classes
}

interface UseCase {
  id: string;            // Unique identifier
  icon: string;          // Lucide icon name (e.g., "Shield", "Users")
  persona: string;       // User persona title
  scenario: string;      // Scenario description
  features: string[];    // Array of key features
}
```

**Default Use Cases:**
- Privacy Advocates
- Enterprise Teams
- Creative Professionals
- Healthcare Providers
- Legal Professionals
- Developers

### TechnologyShowcase Props

```typescript
interface TechnologyShowcaseProps {
  technologies?: Technology[];  // Optional: defaults to DEFAULT_TECHNOLOGIES
  className?: string;            // Optional: custom CSS classes
}

interface Technology {
  id: string;          // Unique identifier
  icon: string;        // Lucide icon name
  name: string;        // Technology name
  description: string; // Detailed description
  why: string;         // Why this matters explanation
  link: string;        // Link to more info
}
```

**Default Technologies:**
- ML-KEM-768 (Kyber)
- Triple Ratchet Protocol
- WebRTC DataChannels

## Accessibility

Both components are fully accessible and follow WCAG 2.1 AA guidelines:

### Semantic HTML
- Proper heading hierarchy (h2 → h3 → h4)
- Semantic section elements with ARIA labels
- List semantics for features
- Article elements for cards

### ARIA Attributes
- `aria-labelledby` for section identification
- `aria-label` for lists and interactive elements
- `aria-hidden` for decorative icons
- Unique IDs for all headings

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Proper focus management
- Skip to content support
- Tab order follows visual order

### Screen Reader Support
- Descriptive labels for all links
- Context provided for buttons
- Proper announcement of dynamic content
- Alternative text for meaningful images

### Focus Indicators
- Visible focus states on all interactive elements
- 2px solid ring with offset
- High contrast mode support

## Responsive Design

### UseCaseGrid Breakpoints

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile (< 768px) | 1 | 24px |
| Tablet (768px - 1023px) | 2 | 24px |
| Desktop (≥ 1024px) | 3 | 24px |

### TechnologyShowcase Breakpoints

| Breakpoint | Columns | Gap |
|------------|---------|-----|
| Mobile (< 1024px) | 1 (stacked) | 24px |
| Desktop (≥ 1024px) | 3 | 32px |

### Mobile Optimizations
- Touch-friendly tap targets (44px minimum)
- Optimized font sizes
- Reduced padding on smaller screens
- Smooth scroll behavior
- Safe area inset support (iPhone notch)

## Customization

### Custom Styling

```tsx
// Add custom classes
<UseCaseGrid className="max-w-7xl mx-auto py-32" />

// Override specific elements via CSS
.custom-use-case-grid .card-feature {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Custom Icons

All icons use Lucide React. Available icon names:
- Shield, Users, Palette, Heart, Scale, Code
- GraduationCap, Microscope, TrendingUp
- Eye, Network, Zap, Repeat
- And 1000+ more: https://lucide.dev/icons/

```tsx
// Custom icon
{
  icon: "Rocket",  // Any Lucide icon name
  // ...
}
```

### Animation Customization

Animations use Framer Motion and respect `prefers-reduced-motion`:

```tsx
// Animations automatically disabled for users who prefer reduced motion
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific component tests
npm test use-case-grid.test.tsx
npm test technology-showcase.test.tsx

# Run with coverage
npm test -- --coverage
```

### Test Coverage

Both components have comprehensive test suites covering:
- ✅ Rendering with default and custom props
- ✅ Accessibility (ARIA labels, semantic HTML)
- ✅ Responsive grid layouts
- ✅ Content validation
- ✅ Link navigation
- ✅ Empty states
- ✅ TypeScript type safety

**Current Coverage:** >90% for both components

### Test Files
- `use-case-grid.test.tsx` - 60+ test cases
- `technology-showcase.test.tsx` - 65+ test cases

## Performance

### Optimizations
- Lazy loading with viewport intersection observer
- GPU-accelerated animations
- Efficient re-render with React.memo (if needed)
- Optimized icon imports (tree-shaking friendly)
- CSS containment for layout performance

### Bundle Size
- UseCaseGrid: ~3KB gzipped
- TechnologyShowcase: ~3.5KB gzipped
- Total with dependencies: ~15KB gzipped

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Last 2 versions |
| Firefox | Last 2 versions |
| Safari | Last 2 versions |
| Edge | Last 2 versions |
| Mobile Safari | iOS 12+ |
| Chrome Mobile | Last 2 versions |

## Dark Mode Support

Both components automatically adapt to light/dark/high-contrast themes:

```tsx
// Automatically uses theme colors
- Light mode: Uses --card, --foreground, --muted-foreground
- Dark mode: Enhanced shadows with blue glow
- High contrast: Increased borders and contrast ratios
```

## Advanced Examples

See the example files for more advanced usage:
- `use-case-grid.example.tsx` - 7 detailed examples
- `technology-showcase.example.tsx` - 8 detailed examples

## Troubleshooting

### Common Issues

**Icons not displaying:**
- Ensure icon name matches Lucide icon exactly (case-sensitive)
- Check icon exists: https://lucide.dev/icons/

**Animations not working:**
- Verify Framer Motion is installed
- Check for `prefers-reduced-motion` setting
- Ensure viewport is in view

**Grid not responsive:**
- Check parent container doesn't have `overflow: hidden`
- Verify Tailwind breakpoints are configured
- Test in browser dev tools responsive mode

**Links not navigating:**
- Ensure Next.js Link component is imported
- Check href paths are correct
- Verify no JavaScript errors in console

## Contributing

To contribute improvements:

1. Follow existing code patterns
2. Maintain TypeScript strict mode
3. Add tests for new features
4. Update documentation
5. Ensure accessibility compliance
6. Test on multiple devices

## Support

For issues or questions:
- Check existing documentation
- Review example files
- Run tests to identify issues
- Consult design system guide

## License

Part of the Tallow project. See main project LICENSE.
