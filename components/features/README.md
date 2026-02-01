# FeatureCard Component

A production-ready, fully accessible React component for displaying feature information in Tallow's design system. Built with TypeScript, Framer Motion, and Tailwind CSS.

## Features

- **3 Variants**: Compact (grid), Detailed (full info), Interactive (with actions)
- **4 Theme Modes**: Light, Dark, High-contrast Light, High-contrast Dark
- **Fully Accessible**: ARIA labels, keyboard navigation, focus states
- **Responsive**: 3-col desktop, 2-col tablet, 1-col mobile
- **Animated**: Smooth hover effects with Framer Motion
- **Type-Safe**: Complete TypeScript definitions

## Installation

The component is already installed in your project. Import it from:

```tsx
import { FeatureCard, FeatureCardGrid } from "@/components/features";
```

## Quick Start

### Compact Variant (Grid Display)

Best for feature catalogs and overview pages.

```tsx
import { FeatureCard, FeatureCardGrid } from "@/components/features";

const feature = {
  id: "pqc-encryption",
  title: "Post-Quantum Encryption",
  description: "Industry-leading quantum-resistant encryption",
  status: "production",
  icon: "shield-check",
  location: "lib/crypto/pqc-crypto.ts",
};

<FeatureCardGrid>
  <FeatureCard
    feature={feature}
    variant="compact"
    showStatus
    onClick={() => console.log("Clicked")}
  />
</FeatureCardGrid>
```

### Detailed Variant (Full Information)

Best for feature detail pages and documentation.

```tsx
<FeatureCard
  feature={feature}
  variant="detailed"
  showStatus
  showTechSpecs
  showCodeExample
  onClick={handleClick}
/>
```

### Interactive Variant (With Action Buttons)

Best for showcases and landing pages.

```tsx
<FeatureCard
  feature={feature}
  variant="interactive"
  showStatus
  showTechSpecs
  onClick={handleClick}
/>
```

## API Reference

### FeatureCard Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `feature` | `Feature` | Required | Feature data object |
| `variant` | `'compact' \| 'detailed' \| 'interactive'` | `'compact'` | Display variant |
| `showStatus` | `boolean` | `true` | Show status badge |
| `showTechSpecs` | `boolean` | `false` | Show technical specifications |
| `showCodeExample` | `boolean` | `false` | Show code example (detailed only) |
| `onClick` | `() => void` | `undefined` | Click handler |
| `className` | `string` | `undefined` | Additional CSS classes |

### Feature Type

```typescript
interface Feature {
  id: string;
  title: string;
  description: string;
  status: 'production' | 'beta' | 'planned' | 'experimental';
  complexity?: 'beginner' | 'intermediate' | 'advanced';
  icon?: string; // Lucide icon name (e.g., "shield-check")
  location: string; // File path in codebase
  techSpecs?: {
    protocol?: string;
    algorithm?: string;
    maxFileSize?: string;
    encryption?: string;
    [key: string]: string | string[] | undefined;
  };
  codeExamples?: Array<{
    language: 'typescript' | 'javascript' | 'bash' | 'python' | 'go' | 'rust';
    code: string;
    description?: string;
  }>;
  relatedFeatures?: string[]; // Feature IDs
  documentation?: string; // Documentation URL
  tags?: string[];
  metadata?: {
    linesOfCode?: number;
    testCoverage?: number;
    lastUpdated?: string;
    contributors?: string[];
  };
}
```

## Variants

### 1. Compact Variant

**Use Case**: Grid layouts, feature catalogs, category listings

**Features**:
- Icon + title + short description
- Status badge (optional)
- Optimized for 3-column grids
- Padding: `p-6`
- Rounded corners: `rounded-[2rem]`

**Example**:
```tsx
<FeatureCardGrid>
  {features.map(feature => (
    <FeatureCard
      key={feature.id}
      feature={feature}
      variant="compact"
      showStatus
    />
  ))}
</FeatureCardGrid>
```

### 2. Detailed Variant

**Use Case**: Feature detail pages, documentation, full info display

**Features**:
- All feature information
- Technical specifications
- Code examples
- Related features
- Tags and metadata
- Complexity level
- Padding: `p-8`

**Example**:
```tsx
<FeatureCard
  feature={detailedFeature}
  variant="detailed"
  showStatus
  showTechSpecs
  showCodeExample
/>
```

### 3. Interactive Variant

**Use Case**: Landing pages, feature showcases, marketing pages

**Features**:
- Action buttons ("Try Demo", "View Docs")
- File location display
- Tech specs
- Automatic button visibility based on feature status

**Example**:
```tsx
<FeatureCard
  feature={interactiveFeature}
  variant="interactive"
  showStatus
  showTechSpecs
/>
```

## Status Badges

The component includes 4 status types with optimized colors for all theme modes:

| Status | Color | Use Case |
|--------|-------|----------|
| `production` | Green | Fully tested, production-ready |
| `beta` | Yellow | In testing, may have bugs |
| `experimental` | Purple | Early development |
| `planned` | Gray | Future implementation |

Each status has 4 color variations:
- Light mode
- Dark mode
- High-contrast light
- High-contrast dark

## Responsive Behavior

The component uses a responsive grid system:

```css
/* Mobile (< 640px) */
grid-cols-1

/* Tablet (640px - 1024px) */
sm:grid-cols-2

/* Desktop (> 1024px) */
lg:grid-cols-3
```

## Accessibility

### Keyboard Navigation

- **Tab**: Navigate between cards
- **Enter/Space**: Activate card (trigger onClick)
- **Focus indicators**: 2px ring with offset

### ARIA Support

```tsx
<Card
  role="article"
  tabIndex={0}
  aria-label={`Feature: ${feature.title}`}
>
  <StatusBadge aria-label={`Status: ${status}`} />
  <TechSpecs role="list" aria-label="Technical specifications">
    <div role="listitem">...</div>
  </TechSpecs>
</Card>
```

### Screen Reader Support

- Semantic HTML structure
- Descriptive ARIA labels
- Role attributes for lists and items
- Hidden decorative icons (`aria-hidden="true"`)

## Animation

Built with Framer Motion for smooth, performant animations:

### Hover Effects

```tsx
<motion.div
  whileHover={{ y: -4 }}
  transition={{ duration: 0.2, ease: "easeOut" }}
>
```

- Lifts 4px on hover
- Enhanced shadow
- 200ms transition
- Respects `prefers-reduced-motion`

### Click Effects

```tsx
<motion.div
  whileTap={{ scale: 0.98 }}
>
```

- Slight scale down (0.98) on click
- Provides tactile feedback

## Theme Support

The component automatically adapts to 4 theme modes:

### 1. Light Mode
- White cards with subtle shadows
- Dark text on light backgrounds
- Minimal borders

### 2. Dark Mode
- Dark cards with elevated surfaces
- Light text on dark backgrounds
- Glowing hover effects

### 3. High-Contrast Light
- Maximum contrast (7:1+)
- Thicker borders (2px)
- Bold text
- Underlined links

### 4. High-Contrast Dark
- Pure black backgrounds
- Pure white text
- Enhanced borders and shadows
- Glowing effects

## Icons

The component uses Lucide React icons. Specify icon names in kebab-case:

```typescript
icon: "shield-check"  // -> ShieldCheck component
icon: "file-text"     // -> FileText component
icon: "radio"         // -> Radio component
```

**Available icons**: All Lucide React icons (600+)
**Fallback**: FileText icon if not found

## Styling

### Custom Classes

Override default styles with the `className` prop:

```tsx
<FeatureCard
  feature={feature}
  variant="compact"
  className="border-2 border-primary bg-primary/5"
/>
```

### Design Tokens

The component uses Tallow's design system:

```css
/* Colors */
--primary
--card
--foreground
--muted-foreground

/* Spacing */
gap-4, gap-6, p-6, p-8

/* Typography */
.display-sm
.body-md
.heading-sm

/* Borders */
rounded-[2rem]
border-border
```

## Performance

### Optimizations

1. **Lazy icon loading**: Icons loaded on-demand
2. **GPU acceleration**: `transform: translateZ(0)`
3. **Motion optimization**: Uses `transform` for animations
4. **Code splitting**: Framer Motion tree-shaken

### Bundle Size

- Component: ~8KB (gzipped)
- Framer Motion: ~28KB (shared)
- Lucide Icons: ~2KB per icon (tree-shaken)

## Examples

See `feature-card.example.tsx` for 10 comprehensive examples:

1. Compact variant (grid display)
2. Detailed variant (full info)
3. Interactive variant (with actions)
4. Status badge variations
5. Responsive grid layout
6. With dialog integration
7. Custom styling
8. Filtered feature list
9. Keyboard navigation
10. Theme-aware cards

## Testing

The component includes full TypeScript types and can be tested with:

```tsx
import { render, screen } from '@testing-library/react';
import { FeatureCard } from './feature-card';

test('renders feature title', () => {
  const feature = {
    id: 'test',
    title: 'Test Feature',
    description: 'Description',
    status: 'production' as const,
    location: 'lib/test.ts',
  };

  render(<FeatureCard feature={feature} variant="compact" />);
  expect(screen.getByText('Test Feature')).toBeInTheDocument();
});
```

## Troubleshooting

### Icon not displaying

Make sure the icon name is in kebab-case and exists in Lucide React:

```tsx
// Correct
icon: "shield-check"

// Incorrect
icon: "ShieldCheck"
icon: "shield_check"
```

### Card not clickable

Ensure you've passed an `onClick` handler:

```tsx
<FeatureCard
  feature={feature}
  onClick={() => console.log('Clicked')}
/>
```

### Animations not working

Check if `prefers-reduced-motion` is enabled in your OS settings. Animations are disabled for accessibility.

### Status colors not showing

The component uses CSS variables from `globals.css`. Ensure your theme provider is set up correctly.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

Part of the Tallow project. See main project LICENSE.

## Related Components

- `Button` - Action buttons in interactive variant
- `Badge` - Status badges and tags
- `Card` - Base card component
- Dialog components - For feature detail modals

## Contributing

This component follows Tallow's design system and coding standards. When modifying:

1. Maintain TypeScript strict mode compliance
2. Ensure accessibility (ARIA, keyboard navigation)
3. Support all 4 theme modes
4. Test responsive behavior
5. Update documentation

## Support

For issues or questions:
- GitHub Issues: [Project Repository]
- Documentation: [Project Docs]
- Examples: See `feature-card.example.tsx`
