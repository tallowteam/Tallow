# Component Quick Reference Card

## Import Statement
```tsx
import { Button, Card, CardHeader, CardBody, CardFooter, Input, Badge, Modal, ModalFooter, Tooltip, Spinner } from '@/components/ui';
```

---

## Button

```tsx
<Button
  variant="primary | secondary | ghost | danger | icon"
  size="sm | md | lg"
  loading={boolean}
  disabled={boolean}
  fullWidth={boolean}
  onClick={handleClick}
>
  Button Text
</Button>
```

**Common Uses:**
- `variant="primary"` - Main actions
- `variant="secondary"` - Alternative actions
- `variant="ghost"` - Low-emphasis actions
- `variant="danger"` - Destructive actions
- `loading={true}` - Async operations

---

## Card

```tsx
<Card variant="default | highlighted | interactive">
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardBody>
    Content
  </CardBody>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Common Uses:**
- `variant="default"` - Standard containers
- `variant="highlighted"` - Important content
- `variant="interactive"` - Clickable cards

---

## Input

```tsx
<Input
  label="Label"
  type="text | email | password | number"
  placeholder="Placeholder"
  value={value}
  onChange={handleChange}
  error={errorMessage}
  helperText="Help text"
  leadingIcon={<Icon />}
  trailingIcon={<Icon />}
  fullWidth={boolean}
  disabled={boolean}
/>
```

**Common Uses:**
- Always use `label` for accessibility
- Use `error` for validation messages
- Use `helperText` for instructions
- Use `fullWidth` in forms

---

## Badge

```tsx
<Badge
  variant="primary | success | warning | danger | neutral"
  showDot={boolean}
>
  Text
</Badge>
```

**Common Uses:**
- `variant="success"` - Active, Approved, Complete
- `variant="warning"` - Pending, Review
- `variant="danger"` - Error, Failed, Offline
- `variant="neutral"` - Draft, Archived
- `showDot={true}` - Status indicators

---

## Modal

```tsx
<Modal
  isOpen={boolean}
  onClose={handleClose}
  title="Modal Title"
  size="sm | md | lg | xl"
  closeOnBackdropClick={true}
  closeOnEscape={true}
>
  <p>Content</p>
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleAction}>Confirm</Button>
  </ModalFooter>
</Modal>
```

**Common Uses:**
- `size="sm"` - Confirmations
- `size="md"` - Forms
- `size="lg"` - Content display
- `size="xl"` - Terms, policies

---

## Tooltip

```tsx
<Tooltip
  content="Tooltip text"
  position="top | bottom | left | right"
  delay={300}
>
  <Button>Hover me</Button>
</Tooltip>
```

**Common Uses:**
- Always use with icon-only buttons
- Use for additional context
- Keep content brief
- Default delay: 300ms

---

## Spinner

```tsx
<Spinner
  size="sm | md | lg"
  variant="primary | white | neutral"
/>
```

**Common Uses:**
- Inside buttons (automatically included with `loading` prop)
- Standalone loading indicators
- Full-page loaders
- `variant="white"` on dark backgrounds

---

## Color Values

```css
/* Brand */
--gradient-start: #0070f3
--gradient-end: #7c3aed

/* Neutrals */
--neutral-950: #0a0a0a
--neutral-900: #171717
--neutral-800: #262626
--neutral-700: #404040
--neutral-500: #737373
--neutral-300: #d4d4d4
--neutral-100: #f5f5f5

/* Status */
--danger-500: #ef4444
--success-500: #22c55e
--warning-500: #fbbf24
```

---

## Common Patterns

### Login Form
```tsx
<Card>
  <CardBody>
    <Input label="Email" type="email" fullWidth />
    <Input label="Password" type="password" fullWidth />
    <Button variant="primary" fullWidth>Sign In</Button>
  </CardBody>
</Card>
```

### Confirmation Dialog
```tsx
<Modal isOpen={isOpen} onClose={close} title="Confirm" size="sm">
  <p>Are you sure?</p>
  <ModalFooter>
    <Button variant="ghost" onClick={close}>Cancel</Button>
    <Button variant="danger" onClick={confirm}>Delete</Button>
  </ModalFooter>
</Modal>
```

### Status Display
```tsx
<Badge variant="success" showDot>Online</Badge>
<Badge variant="warning" showDot>Pending</Badge>
<Badge variant="danger" showDot>Offline</Badge>
```

### Loading Button
```tsx
<Button variant="primary" loading={isLoading} onClick={handleSubmit}>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

---

## Accessibility Checklist

- ✅ Use `label` prop on all inputs
- ✅ Provide `aria-label` for icon-only buttons
- ✅ Add tooltips to icon buttons
- ✅ Use semantic button variants
- ✅ Set proper `type` on inputs
- ✅ Use `error` prop for validation
- ✅ Set `title` on modals

---

## File Locations

**Components:** `/c/Users/aamir/Documents/Apps/Tallow/components/ui/`
**Tests:** `/c/Users/aamir/Documents/Apps/Tallow/tests/unit/ui/`
**Demo:** `/c/Users/aamir/Documents/Apps/Tallow/app/design-system/`
**Docs:** See README.md, EXAMPLES.md, QUICK_START.md

---

## Resources

- 📖 [README.md](./README.md) - Complete documentation
- 💡 [EXAMPLES.md](./EXAMPLES.md) - Code examples
- 🚀 [QUICK_START.md](./QUICK_START.md) - Quick start guide
- 🎨 `/design-system` - Interactive demo

---

**Version:** 1.0.0 | **Last Updated:** February 3, 2026
