# Quick Start Guide - Tallow Design System

Get up and running with the Tallow Design System in 5 minutes.

## Installation

The design system is already included in your Tallow project. No additional installation required!

## Basic Setup

### 1. Import Components

```tsx
import { Button, Card, Input } from '@/components/ui';
```

### 2. Use in Your App

```tsx
export default function MyPage() {
  return (
    <div>
      <Card>
        <CardBody>
          <h1>Welcome to Tallow</h1>
          <Button variant="primary">Get Started</Button>
        </CardBody>
      </Card>
    </div>
  );
}
```

## Most Common Use Cases

### 1. Simple Button

```tsx
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

### 2. Form Input

```tsx
<Input
  label="Email"
  type="email"
  placeholder="you@example.com"
  error={errors.email}
/>
```

### 3. Card Container

```tsx
<Card>
  <CardHeader>
    <h2>Title</h2>
  </CardHeader>
  <CardBody>
    <p>Content goes here</p>
  </CardBody>
</Card>
```

### 4. Status Badge

```tsx
<Badge variant="success" showDot>
  Active
</Badge>
```

### 5. Modal Dialog

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
  </ModalFooter>
</Modal>
```

## Component Variants Quick Reference

### Button Variants
- `primary` - Main actions (submit, save, continue)
- `secondary` - Secondary actions (cancel in context)
- `ghost` - Tertiary actions (cancel, back)
- `danger` - Destructive actions (delete, remove)
- `icon` - Icon-only buttons

### Card Variants
- `default` - Standard content containers
- `highlighted` - Important/featured content
- `interactive` - Clickable cards

### Badge Variants
- `primary` - Brand/featured status
- `success` - Positive status (active, approved)
- `warning` - Cautionary status (pending, review)
- `danger` - Negative status (error, failed)
- `neutral` - General status (draft, archived)

## Accessibility Checklist

✅ Always use `label` prop on inputs
✅ Provide `aria-label` for icon-only buttons
✅ Use semantic button `variant` based on action
✅ Add tooltips to icon buttons
✅ Use proper heading hierarchy in cards
✅ Set `title` on modals for screen readers

## Color Palette

```tsx
// Use these colors in your custom styles
const colors = {
  gradient: 'linear-gradient(135deg, #0070f3 0%, #7c3aed 100%)',
  neutral: {
    950: '#0a0a0a',
    900: '#171717',
    800: '#262626',
    700: '#404040',
  }
};
```

## Common Patterns

### Login Form
```tsx
<Card>
  <CardHeader>
    <h2>Sign In</h2>
  </CardHeader>
  <CardBody>
    <Input label="Email" type="email" fullWidth />
    <Input label="Password" type="password" fullWidth />
  </CardBody>
  <CardFooter>
    <Button variant="primary" fullWidth>Sign In</Button>
  </CardFooter>
</Card>
```

### Loading State
```tsx
<Button variant="primary" loading={isLoading}>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

### Form Validation
```tsx
<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
/>
```

## Next Steps

1. 📖 Read the [complete README](./README.md)
2. 💡 Check out [examples](./EXAMPLES.md)
3. 🎨 Visit `/design-system` to see all components
4. 🧪 Review tests in `/tests/unit/ui/`

## Need Help?

- Check component props in TypeScript definitions
- Review examples in EXAMPLES.md
- Look at the demo page at `/design-system`
- Read accessibility guidelines in README.md

## Pro Tips

1. **Tree Shaking**: Import only what you need for smaller bundles
2. **TypeScript**: All components have full type definitions
3. **Accessibility**: All components are ARIA-compliant by default
4. **Customization**: Use `className` prop to add custom styles
5. **Testing**: Components have data-testid support built-in

---

**Made with ❤️ for Tallow**
