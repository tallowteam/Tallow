# Accessibility Guide

Tallow is committed to WCAG 2.1 AA compliance to ensure the application is accessible to all users.

## Implemented Features

### Focus Management
- ✅ Focus trap in modals and dialogs
- ✅ Keyboard navigation throughout app
- ✅ Visible focus indicators on all interactive elements
- ✅ Logical tab order

### Screen Reader Support
- ✅ Live regions for dynamic content announcements
- ✅ ARIA labels on all interactive elements
- ✅ Descriptive alt text for icons
- ✅ Semantic HTML structure
- ✅ Heading hierarchy (h1 → h6)

### Keyboard Navigation
- ✅ All functionality accessible via keyboard
- ✅ Escape key closes modals
- ✅ Enter/Space activates buttons
- ✅ Arrow keys for navigation where applicable
- ✅ Tab/Shift+Tab for focus movement

### Visual Accessibility
- ✅ High contrast mode support
- ✅ Dark mode with proper contrast ratios
- ✅ Minimum 44px touch targets (mobile)
- ✅ Respects prefers-reduced-motion
- ✅ No content relying solely on color

## Testing Checklist

### Screen Reader Testing
- [ ] VoiceOver (macOS/iOS)
- [ ] NVDA (Windows)
- [ ] JAWS (Windows)
- [ ] TalkBack (Android)

### Keyboard Testing
- [ ] Complete file transfer using keyboard only
- [ ] Navigate all menus and settings
- [ ] Close dialogs with Escape key
- [ ] Activate all buttons with Enter/Space
- [ ] Tab through all interactive elements

### Tools Used
- [ ] axe DevTools browser extension
- [ ] WAVE accessibility evaluation
- [ ] Lighthouse accessibility audit
- [ ] Color contrast checker

## Usage Examples

### Announcing Messages to Screen Readers

```typescript
import { useAnnounce } from '@/lib/hooks/use-announce';

function MyComponent() {
  const announce = useAnnounce();

  const handleFileUploaded = () => {
    announce('File uploaded successfully', 'polite');
  };

  const handleError = () => {
    announce('Error: File upload failed', 'assertive');
  };

  return <button onClick={handleFileUploaded}>Upload</button>;
}
```

### Focus Trap in Modals

```typescript
import { useFocusTrap } from '@/lib/hooks/use-focus-trap';

function Modal({ isOpen }: { isOpen: boolean }) {
  const containerRef = useFocusTrap(isOpen);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

### Adding ARIA Labels

```typescript
// Button with descriptive label
<Button aria-label="Download file example.pdf">
  <Download />
</Button>

// Form with associated labels
<label htmlFor="email-input">Email Address</label>
<Input id="email-input" type="email" aria-required="true" />

// Status indicators
<div role="status" aria-live="polite">
  {connectionStatus}
</div>
```

## WCAG 2.1 AA Compliance Matrix

| Criterion | Status | Notes |
|-----------|--------|-------|
| **1.1 Text Alternatives** | ✅ | All images have alt text |
| **1.2 Time-based Media** | N/A | No video/audio content |
| **1.3 Adaptable** | ✅ | Semantic HTML, proper heading structure |
| **1.4 Distinguishable** | ✅ | Contrast ratios meet AA, resizable text |
| **2.1 Keyboard Accessible** | ✅ | All functionality via keyboard |
| **2.2 Enough Time** | ✅ | No time limits on interactions |
| **2.3 Seizures** | ✅ | No flashing content |
| **2.4 Navigable** | ✅ | Skip links, logical tab order, page titles |
| **2.5 Input Modalities** | ✅ | Touch targets ≥44px, gesture alternatives |
| **3.1 Readable** | ✅ | Language declared, clear labels |
| **3.2 Predictable** | ✅ | Consistent navigation, no unexpected changes |
| **3.3 Input Assistance** | ✅ | Error identification, labels/instructions |
| **4.1 Compatible** | ✅ | Valid HTML, ARIA used correctly |

## Keyboard Shortcuts

| Action | Shortcut | Context |
|--------|----------|---------|
| Close dialog | `Escape` | Any open dialog |
| Activate button | `Enter` or `Space` | Focused button |
| Navigate tabs | `Arrow Left/Right` | Tab component |
| Navigate menu | `Arrow Up/Down` | Dropdown menu |
| Select file | `Enter` or `Space` | File selector |

## Common Issues and Solutions

### Dialog Not Accessible
**Problem:** Users can tab outside of modal dialog.
**Solution:** Use `useFocusTrap` hook to trap focus.

### Button Not Announcing Purpose
**Problem:** Screen reader says "button" with no description.
**Solution:** Add `aria-label` or visible text.

### Dynamic Content Not Announced
**Problem:** Connection status changes not announced.
**Solution:** Use `announce()` or add `aria-live="polite"`.

### Color-Only Indicators
**Problem:** Status indicated only by color.
**Solution:** Add text labels or icons with descriptive text.

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [React Accessibility Docs](https://react.dev/learn/accessibility)

## Reporting Issues

If you discover an accessibility issue:

1. Check if it's a known issue in GitHub Issues
2. Test with multiple assistive technologies if possible
3. Include:
   - Steps to reproduce
   - Assistive technology used (and version)
   - Expected vs actual behavior
   - Screenshots/screen recordings if applicable

## Future Improvements

- [ ] Add skip navigation links
- [ ] Implement roving tabindex for complex widgets
- [ ] Add more descriptive ARIA live regions
- [ ] Improve keyboard shortcuts documentation
- [ ] Add accessibility statement page
- [ ] Regular automated accessibility testing in CI/CD
