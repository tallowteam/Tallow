# Tallow Design System

A production-ready React component library built with Next.js 16, React 19, and TypeScript. Features a beautiful dark theme with Vercel-inspired blue and Linear-inspired purple gradients.

## Features

- ✅ **React 19** - Built with the latest React features
- ✅ **TypeScript Strict Mode** - Full type safety
- ✅ **Accessible** - WCAG 2.1 Level AA compliant
- ✅ **Dark Theme** - Beautiful dark-first design
- ✅ **CSS Modules** - Scoped styling without conflicts
- ✅ **No Dependencies** - Built from scratch, zero UI library dependencies
- ✅ **Tree Shakeable** - Import only what you need
- ✅ **Fully Tested** - Comprehensive test coverage

## Components

### Button

Multi-variant button component with loading states and full accessibility.

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon'
- `size`: 'sm' | 'md' | 'lg'
- `loading`: boolean
- `fullWidth`: boolean
- `disabled`: boolean

**Example:**
```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" loading={isLoading}>
  Submit
</Button>
```

### Card

Flexible card component with header, body, and footer sections.

**Variants:**
- `default` - Standard card styling
- `highlighted` - Border accent for important content
- `interactive` - Hover effects for clickable cards

**Example:**
```tsx
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui';

<Card variant="interactive">
  <CardHeader>
    <h3>Card Title</h3>
  </CardHeader>
  <CardBody>
    <p>Card content goes here</p>
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

Form input with label, error states, helper text, and icon support.

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `leadingIcon`: ReactNode
- `trailingIcon`: ReactNode
- `fullWidth`: boolean

**Example:**
```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
  helperText="We'll never share your email"
  fullWidth
/>
```

### Badge

Status badges with color variants and optional dot indicator.

**Variants:**
- `primary` - Brand colors
- `success` - Green for positive states
- `warning` - Yellow for caution
- `danger` - Red for errors
- `neutral` - Gray for general use

**Example:**
```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" showDot>
  Active
</Badge>
```

### Modal

Portal-based modal with focus trap, keyboard navigation, and backdrop.

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `closeOnBackdropClick`: boolean (default: true)
- `closeOnEscape`: boolean (default: true)

**Example:**
```tsx
import { Modal, ModalFooter, Button } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to continue?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleConfirm}>
      Confirm
    </Button>
  </ModalFooter>
</Modal>
```

### Tooltip

Hover tooltips with configurable positioning and delay.

**Props:**
- `content`: ReactNode
- `position`: 'top' | 'bottom' | 'left' | 'right'
- `delay`: number (milliseconds, default: 300)

**Example:**
```tsx
import { Tooltip, Button } from '@/components/ui';

<Tooltip content="This action cannot be undone" position="top">
  <Button variant="danger">Delete</Button>
</Tooltip>
```

### Spinner

Loading indicator with size and color variants.

**Props:**
- `size`: 'sm' | 'md' | 'lg'
- `variant`: 'primary' | 'white' | 'neutral'

**Example:**
```tsx
import { Spinner } from '@/components/ui';

<Spinner size="md" variant="primary" />
```

## Design Tokens

### Colors

**Brand Gradient:**
- Start: `#0070f3` (Vercel blue)
- End: `#7c3aed` (Linear purple)

**Neutrals:**
- `--neutral-950`: #0a0a0a
- `--neutral-900`: #171717
- `--neutral-800`: #262626
- `--neutral-700`: #404040
- `--neutral-600`: #525252
- `--neutral-500`: #737373
- `--neutral-400`: #a3a3a3
- `--neutral-300`: #d4d4d4
- `--neutral-200`: #e5e5e5
- `--neutral-100`: #f5f5f5

**Status Colors:**
- Danger: `#ef4444`, `#dc2626`, `#b91c1c`
- Success: `#22c55e`, `#16a34a`, `#15803d`
- Warning: `#fbbf24`, `#f59e0b`, `#d97706`

### Transitions

- Fast: `200ms cubic-bezier(0.4, 0, 0.2, 1)`
- Base: `300ms cubic-bezier(0.4, 0, 0.2, 1)`

### Border Radius

- Small: `6px`
- Medium: `8px`
- Large: `12px`
- Full: `9999px`

### Shadows

**Focus Ring:**
```css
box-shadow: 0 0 0 3px rgba(112, 58, 237, 0.3);
```

**Card Shadow:**
```css
box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
```

**Modal Shadow:**
```css
box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5),
            0 10px 10px -5px rgba(0, 0, 0, 0.4);
```

## Accessibility

All components follow WCAG 2.1 Level AA guidelines:

- ✅ Proper ARIA attributes
- ✅ Keyboard navigation support
- ✅ Focus management
- ✅ Screen reader compatibility
- ✅ High contrast ratios (minimum 4.5:1)
- ✅ Focus visible indicators
- ✅ Semantic HTML

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: Latest 2 versions
- Chrome Android: Latest 2 versions

## Usage

### Import Components

```tsx
import { Button, Card, Input, Badge, Modal, Tooltip, Spinner } from '@/components/ui';
```

### Import Individual Components (Tree Shaking)

```tsx
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
```

## Best Practices

1. **Always provide labels for inputs** - Use the `label` prop for better accessibility
2. **Use semantic variants** - Choose button/badge variants that match their purpose
3. **Provide loading states** - Use the `loading` prop on buttons during async operations
4. **Handle errors gracefully** - Use the `error` prop on inputs to show validation errors
5. **Keep modals focused** - Use modals sparingly for critical actions only
6. **Add tooltips for icon buttons** - Icon-only buttons should have tooltips
7. **Use appropriate sizes** - Match component sizes to their context and importance

## Testing

Components are fully tested with:

- Unit tests (Vitest + React Testing Library)
- Integration tests
- Accessibility tests (jest-axe)
- Visual regression tests (Playwright)

## Performance

- Bundle size: ~8KB gzipped (all components)
- Tree-shakeable: Import only what you need
- Zero runtime dependencies
- CSS Modules for optimal performance
- No runtime CSS-in-JS overhead

## Demo

Visit `/design-system` to see all components in action with interactive examples.

## License

MIT
