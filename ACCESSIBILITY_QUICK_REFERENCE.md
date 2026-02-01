# Accessibility Quick Reference Guide

**Quick access guide for developers implementing accessibility features in Tallow**

---

## Table of Contents

1. [Components](#components)
2. [Utilities](#utilities)
3. [Hooks](#hooks)
4. [Testing](#testing)
5. [Common Patterns](#common-patterns)
6. [Checklists](#checklists)

---

## Components

### Accessibility Components (`components/accessibility/`)

#### LiveRegion
Announces dynamic content changes to screen readers.

```tsx
import { LiveRegion, LiveRegionProvider, useAnnounce } from '@/components/accessibility/live-region';

// Add to root layout
<LiveRegionProvider />

// Use in components
const { announce } = useAnnounce();
announce('File uploaded successfully', 'polite');
announce('Error occurred!', 'assertive');
```

#### VisuallyHidden
Screen reader only text (hidden visually but accessible).

```tsx
import { VisuallyHidden } from '@/components/accessibility/visually-hidden';

<Button>
  <IconTrash />
  <VisuallyHidden>Delete file</VisuallyHidden>
</Button>
```

#### SkipNav
Skip to main content link for keyboard users.

```tsx
import { SkipNav } from '@/components/accessibility/skip-nav';

// Already included in root layout
<SkipNav />
<main id="main-content">...</main>
```

---

## Utilities

### Focus Management (`lib/utils/focus-management.ts`)

```tsx
import {
  moveFocusTo,
  moveFocusToFirstFocusable,
  getFocusableElements,
  trapFocus,
  FocusManager,
  announceToScreenReader
} from '@/lib/utils/focus-management';

// Move focus to element
moveFocusTo('#submit-button');
moveFocusTo(buttonRef.current);

// Move to first focusable element in container
moveFocusToFirstFocusable(dialogRef.current);

// Get all focusable elements
const focusable = getFocusableElements(containerRef.current);

// Save and restore focus
const focusManager = new FocusManager();
focusManager.saveFocus();
// ... do something
focusManager.restoreFocus();

// Announce to screen reader
announceToScreenReader('File deleted', 'polite');
```

---

## Hooks

### useFocusTrap (`lib/hooks/use-focus-trap.ts`)

Trap focus within modals/dialogs (implements WCAG 2.1.2).

```tsx
import { useFocusTrap, useFocusTrapDialog } from '@/lib/hooks/use-focus-trap';

// Basic usage
function MyDialog({ isOpen, onClose }) {
  const containerRef = useFocusTrap({
    enabled: isOpen,
    initialFocus: true,
    restoreFocus: true,
    onEscape: onClose
  });

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {/* Dialog content */}
    </div>
  );
}

// Simplified for dialogs
function SimpleDialog({ isOpen, onClose }) {
  const containerRef = useFocusTrapDialog(isOpen, onClose);

  return <div ref={containerRef}>...</div>;
}
```

### useAnnounce (`components/accessibility/live-region.tsx`)

Announce messages to screen readers.

```tsx
import { useAnnounce } from '@/components/accessibility/live-region';

function FileUpload() {
  const { announce } = useAnnounce();

  const handleUpload = async (file) => {
    announce(`Uploading ${file.name}`, 'polite');
    await upload(file);
    announce(`${file.name} uploaded successfully`, 'polite');
  };
}
```

---

## Testing

### Run Accessibility Tests

```bash
# Run full accessibility test suite
npm run test:e2e tests/e2e/accessibility.spec.ts

# Run with headed browser
npm run test:e2e -- --headed tests/e2e/accessibility.spec.ts

# Run specific test
npm run test:e2e -- --grep "keyboard navigation"
```

### Test File Location
- **Main suite**: `tests/e2e/accessibility.spec.ts`
- **Coverage**: WCAG 2.1 Level AA compliance

### Manual Testing Checklist
See [ACCESSIBILITY_AUDIT_2026-01-30.md](./reports/ACCESSIBILITY_AUDIT_2026-01-30.md#manual-testing-checklist)

---

## Common Patterns

### Icon-Only Buttons

```tsx
// ❌ Bad - No accessible name
<Button>
  <TrashIcon />
</Button>

// ✅ Good - aria-label
<Button aria-label="Delete file">
  <TrashIcon aria-hidden="true" />
</Button>

// ✅ Good - VisuallyHidden
<Button>
  <TrashIcon aria-hidden="true" />
  <VisuallyHidden>Delete file</VisuallyHidden>
</Button>
```

### Form Inputs

```tsx
// ❌ Bad - No label
<Input placeholder="Email" />

// ✅ Good - Visible label
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

// ✅ Good - aria-label
<Input type="email" aria-label="Email address" />

// ✅ Good - Floating label
<Input floatingLabel="Email" type="email" required />
```

### Error Messages

```tsx
// ❌ Bad - Not associated
<Input id="email" />
{error && <p>{error}</p>}

// ✅ Good - Associated with aria-describedby
<Input
  id="email"
  aria-invalid={!!error}
  aria-describedby={error ? "email-error" : undefined}
/>
{error && (
  <p id="email-error" role="alert">
    {error}
  </p>
)}

// ✅ Best - Use Input component with error prop
<Input
  id="email"
  error={!!error}
  errorMessage={error}
/>
```

### Loading States

```tsx
// ❌ Bad - No indication
<Button onClick={save}>
  {loading ? <Spinner /> : 'Save'}
</Button>

// ✅ Good - aria-busy
<Button
  onClick={save}
  aria-busy={loading}
  disabled={loading}
>
  {loading ? <Spinner aria-hidden="true" /> : null}
  Save
</Button>

// ✅ Best - Use Button component
<Button onClick={save} loading={loading}>
  Save
</Button>
```

### Modals/Dialogs

```tsx
// ✅ Good - Use Dialog component
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogTitle>Confirm Action</DialogTitle>
    <DialogDescription>Are you sure?</DialogDescription>
    {/* Content */}
  </DialogContent>
</Dialog>

// Includes:
// - role="dialog" and aria-modal="true"
// - Focus trap
// - Escape to close
// - Focus restoration
```

### Dynamic Content Updates

```tsx
// ❌ Bad - Silent update
{transferProgress > 0 && <p>{transferProgress}%</p>}

// ✅ Good - Announced to screen readers
import { useAnnounce } from '@/components/accessibility/live-region';

const { announce } = useAnnounce();

useEffect(() => {
  if (transferProgress === 25) announce('Transfer 25% complete');
  if (transferProgress === 50) announce('Transfer 50% complete');
  if (transferProgress === 75) announce('Transfer 75% complete');
  if (transferProgress === 100) announce('Transfer complete');
}, [transferProgress]);

// Or use role="status"
<div role="status" aria-live="polite">
  {transferProgress}% complete
</div>
```

### Keyboard Navigation

```tsx
// ❌ Bad - Only mouse clickable
<div onClick={handleClick}>Click me</div>

// ✅ Good - Keyboard accessible
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
  aria-label="Action button"
>
  Click me
</div>

// ✅ Best - Use semantic HTML
<button onClick={handleClick}>Click me</button>
```

### Touch Targets

```tsx
// ❌ Bad - Too small (< 44x44px)
<button className="w-8 h-8">X</button>

// ✅ Good - Minimum 44x44px
<button className="w-11 h-11 md:w-10 md:h-10">X</button>

// ✅ Better - Use Button component (64px default)
<Button size="icon">
  <XIcon />
</Button>
```

---

## Checklists

### Component Accessibility Checklist

When creating a new component:

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible (ring-2, ring-offset-2)
- [ ] Touch targets are at least 44x44px on mobile
- [ ] Icons have aria-hidden="true"
- [ ] Icon-only buttons have aria-label
- [ ] Color contrast meets WCAG AA (4.5:1 for text)
- [ ] Semantic HTML used where possible
- [ ] ARIA roles/states added where needed
- [ ] Error messages have role="alert"
- [ ] Dynamic content changes are announced
- [ ] Forms have proper labels
- [ ] Loading states have aria-busy

### Page Accessibility Checklist

For each new page:

- [ ] Has single h1 element
- [ ] Heading hierarchy is logical (h1 → h2 → h3)
- [ ] Has main landmark (<main> or role="main")
- [ ] Has proper page title
- [ ] Skip link works (#main-content)
- [ ] All images have alt text
- [ ] Links have descriptive text
- [ ] No keyboard traps
- [ ] Tab order is logical
- [ ] Works at 200% zoom
- [ ] Supports reduced motion preference

### Testing Checklist

Before deployment:

- [ ] Run automated accessibility tests
- [ ] Test with keyboard only
- [ ] Test with screen reader (NVDA/JAWS/VoiceOver)
- [ ] Test at 200% zoom
- [ ] Test with high contrast mode
- [ ] Test with reduced motion enabled
- [ ] Test on mobile (touch targets)
- [ ] Check color contrast
- [ ] Verify focus indicators
- [ ] Test all forms and error states

---

## ARIA Attribute Quick Reference

### Common ARIA Attributes

| Attribute | Usage | Example |
|-----------|-------|---------|
| `aria-label` | Provides accessible name | `<button aria-label="Close">×</button>` |
| `aria-labelledby` | References element(s) for label | `<div role="dialog" aria-labelledby="title">` |
| `aria-describedby` | References element(s) for description | `<input aria-describedby="help-text">` |
| `aria-hidden` | Hides from screen readers | `<svg aria-hidden="true">` |
| `aria-live` | Announces dynamic changes | `<div aria-live="polite">` |
| `aria-invalid` | Marks form field as invalid | `<input aria-invalid="true">` |
| `aria-required` | Marks form field as required | `<input aria-required="true">` |
| `aria-expanded` | Indicates expanded state | `<button aria-expanded="false">` |
| `aria-pressed` | Indicates toggle button state | `<button aria-pressed="true">` |
| `aria-selected` | Indicates selected state | `<div role="tab" aria-selected="true">` |
| `aria-checked` | Indicates checkbox/radio state | `<div role="checkbox" aria-checked="true">` |
| `aria-busy` | Indicates loading state | `<div aria-busy="true">` |
| `aria-modal` | Indicates modal dialog | `<div role="dialog" aria-modal="true">` |
| `aria-atomic` | Announce entire region | `<div aria-live="polite" aria-atomic="true">` |

### Common ARIA Roles

| Role | Usage | Example |
|------|-------|---------|
| `button` | Interactive button | `<div role="button">` |
| `dialog` | Modal dialog | `<div role="dialog">` |
| `alert` | Important message | `<div role="alert">` |
| `status` | Status update | `<div role="status">` |
| `log` | Live log area | `<div role="log">` |
| `navigation` | Navigation landmark | `<nav role="navigation">` |
| `main` | Main content landmark | `<main role="main">` |
| `region` | Significant section | `<section role="region">` |
| `tab` | Tab control | `<button role="tab">` |
| `tabpanel` | Tab content | `<div role="tabpanel">` |
| `checkbox` | Checkbox control | `<div role="checkbox">` |
| `radio` | Radio button | `<div role="radio">` |
| `combobox` | Combo box control | `<div role="combobox">` |

---

## Resources

### Internal Documentation
- [Full Accessibility Audit](./reports/ACCESSIBILITY_AUDIT_2026-01-30.md)
- [Test Suite](./tests/e2e/accessibility.spec.ts)

### External Resources
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

**Last Updated**: January 30, 2026
**Maintained By**: Accessibility Expert
