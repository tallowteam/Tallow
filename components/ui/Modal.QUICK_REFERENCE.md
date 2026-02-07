# Modal & ConfirmDialog - Quick Reference

## Import

```tsx
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmDialog,
  DeleteIcon,
  WarningIcon,
  InfoIcon,
  SuccessIcon
} from '@/components/ui';
```

## Basic Usage

### Simple Modal
```tsx
const [open, setOpen] = useState(false);

<Modal open={open} onClose={() => setOpen(false)} title="Title">
  <p>Content here</p>
</Modal>
```

### Composed Modal
```tsx
<Modal open={open} onClose={() => setOpen(false)}>
  <ModalHeader><h2>Header</h2></ModalHeader>
  <ModalBody><p>Body</p></ModalBody>
  <ModalFooter>
    <Button onClick={() => setOpen(false)}>Close</Button>
  </ModalFooter>
</Modal>
```

### Delete Confirmation
```tsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Delete Item"
  description="This action cannot be undone."
  destructive
  icon={<DeleteIcon />}
/>
```

### Async Action
```tsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={async () => {
    await api.delete();
  }}
  title="Confirm"
  description="This will take a moment."
  loading={loading}
/>
```

## Props Cheat Sheet

### Modal Essential Props
```tsx
open: boolean;           // Required - show/hide
onClose: () => void;     // Required - close handler
children: ReactNode;     // Required - content
title?: string;          // Optional - auto header
size?: 'sm'|'md'|'lg'|'xl'|'full';  // Default: 'md'
```

### ConfirmDialog Essential Props
```tsx
open: boolean;
onClose: () => void;
onConfirm: () => void | Promise<void>;
title: string;
description: ReactNode;
destructive?: boolean;   // Red button for danger
loading?: boolean;       // Disable during async
icon?: ReactNode;        // Use preset icons
```

## Size Guide

| Size | Width | Use Case |
|------|-------|----------|
| `sm` | 480px | Alerts, confirmations |
| `md` | 640px | Forms (default) |
| `lg` | 768px | Complex forms |
| `xl` | 1024px | Rich content |
| `full` | 90vw | Full-screen |

## Common Patterns

### Form Modal
```tsx
<Modal open={open} onClose={close}>
  <form onSubmit={handleSubmit}>
    <ModalHeader><h2>Edit</h2></ModalHeader>
    <ModalBody>
      <Input name="field" />
    </ModalBody>
    <ModalFooter>
      <Button type="submit">Save</Button>
    </ModalFooter>
  </form>
</Modal>
```

### Destructive Action
```tsx
<ConfirmDialog
  open={open}
  onClose={close}
  onConfirm={deleteUser}
  title="Delete User"
  description="User data will be permanently deleted."
  confirmText="Delete"
  destructive
  icon={<DeleteIcon />}
/>
```

### Info Dialog
```tsx
<ConfirmDialog
  open={open}
  onClose={close}
  onConfirm={close}
  title="Notice"
  description="Your session will expire in 5 minutes."
  confirmText="Got it"
  cancelText="Extend"
  icon={<InfoIcon />}
/>
```

## Keyboard Shortcuts

- `Esc` - Close modal
- `Tab` - Navigate forward
- `Shift+Tab` - Navigate backward
- `Enter` - Confirm action
- `Space` - Activate button

## Features Checklist

✅ Portal rendering
✅ Focus trap
✅ Escape to close
✅ Click outside to close
✅ Body scroll lock
✅ Smooth animations
✅ Mobile responsive
✅ TypeScript support
✅ Accessibility (WCAG AA)
✅ Reduced motion support

## Tips

💡 Use `destructive` for delete/remove actions
💡 Set `loading={true}` during async operations
💡 Use preset icons for consistency
💡 Keep titles concise (<50 chars)
💡 Provide clear action button labels
💡 Use `size="sm"` for confirm dialogs
💡 Handle errors in `onConfirm` handler

## Don'ts

❌ Don't nest modals
❌ Don't block close during loading
❌ Don't use for non-critical info
❌ Don't forget loading states
❌ Don't use generic titles

## Accessibility

- Always provide `title` for screen readers
- Use semantic HTML in content
- Ensure focusable elements are reachable
- Test with keyboard only
- Test with screen reader

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

## File Locations

- `components/ui/Modal.tsx` - Modal component
- `components/ui/Modal.module.css` - Modal styles
- `components/ui/ConfirmDialog.tsx` - ConfirmDialog component
- `components/ui/ConfirmDialog.module.css` - Dialog styles
- `components/ui/Modal.example.tsx` - Examples
- `components/ui/Modal.test.tsx` - Tests

## Need Help?

See `Modal.README.md` for comprehensive documentation and examples.
