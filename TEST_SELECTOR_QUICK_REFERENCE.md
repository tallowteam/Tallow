# Test Selector Quick Reference
**For Developers: How to Make Components Testable**

---

## Quick Rules

### 1. Every Interactive Element Needs a data-testid
```tsx
// ✅ GOOD
<button data-testid="send-button">Send</button>

// ❌ BAD
<button>Send</button>
```

### 2. Add ARIA Labels for Accessibility
```tsx
// ✅ GOOD
<button
  data-testid="send-button"
  aria-label="Send file to recipient"
>
  Send
</button>

// ❌ BAD
<button data-testid="send-button">Send</button>
```

### 3. Use Semantic HTML and Roles
```tsx
// ✅ GOOD
<div role="dialog" data-testid="email-dialog">
  {/* dialog content */}
</div>

// ❌ BAD
<div className="dialog" data-testid="email-dialog">
  {/* dialog content */}
</div>
```

---

## Naming Conventions

### data-testid Format:
```
[component]-[element]-[action/type]
```

### Examples:
```tsx
// Buttons
data-testid="send-button"
data-testid="cancel-button"
data-testid="email-send-button"
data-testid="group-mode-toggle"

// Inputs
data-testid="email-input"
data-testid="recipient-name-input"
data-testid="file-input"

// Dialogs/Modals
data-testid="email-dialog"
data-testid="camera-dialog"
data-testid="confirm-dialog"

// Lists/Items
data-testid="device-list"
data-testid="recipient-item"
data-testid="transfer-history-item"

// Status/Info
data-testid="connection-code"
data-testid="transfer-progress"
data-testid="error-message"
```

---

## Component Checklist

### Buttons
```tsx
<button
  data-testid="action-name"
  aria-label="Descriptive action"
  onClick={handleClick}
  disabled={isDisabled}
>
  Button Text
</button>
```

### Inputs
```tsx
<input
  type="text"
  data-testid="input-name"
  placeholder="User-friendly placeholder"
  aria-label="Input purpose"
  value={value}
  onChange={handleChange}
/>
```

### Dialogs
```tsx
<Dialog open={open} onOpenChange={onClose}>
  <DialogContent data-testid="dialog-name">
    <DialogHeader>
      <DialogTitle id="dialog-title">Dialog Title</DialogTitle>
    </DialogHeader>
    {/* content */}
  </DialogContent>
</Dialog>
```

### Forms
```tsx
<form onSubmit={handleSubmit} data-testid="form-name">
  <input data-testid="email-input" type="email" />
  <button data-testid="submit-button" type="submit">
    Submit
  </button>
</form>
```

### Lists
```tsx
<div data-testid="list-name" role="list">
  {items.map((item) => (
    <div
      key={item.id}
      data-testid="item-name"
      role="listitem"
    >
      {item.content}
    </div>
  ))}
</div>
```

### Checkboxes
```tsx
<label data-testid="checkbox-label">
  <input
    type="checkbox"
    role="checkbox"
    checked={isChecked}
    onChange={handleChange}
    aria-label="Checkbox description"
  />
  Label Text
</label>
```

### Progress Indicators
```tsx
<div data-testid="progress-indicator" role="status">
  <progress value={progress} max={100} />
  <p aria-live="polite">{progress}% complete</p>
</div>
```

### Error Messages
```tsx
<p
  data-testid="error-message"
  role="alert"
  className="error"
>
  {errorMessage}
</p>
```

---

## Common Patterns

### Menu with Items
```tsx
<div data-testid="menu-name">
  <button
    data-testid="menu-trigger"
    aria-label="Open menu"
    onClick={() => setOpen(!open)}
  >
    Menu
  </button>

  {open && (
    <div role="menu">
      <button
        role="menuitem"
        data-testid="menu-item-action1"
        onClick={handleAction1}
      >
        Action 1
      </button>
      <button
        role="menuitem"
        data-testid="menu-item-action2"
        onClick={handleAction2}
      >
        Action 2
      </button>
    </div>
  )}
</div>
```

### Tabs
```tsx
<div role="tablist" data-testid="tab-group">
  <button
    role="tab"
    data-testid="tab-send"
    aria-selected={activeTab === 'send'}
    onClick={() => setActiveTab('send')}
  >
    Send
  </button>
  <button
    role="tab"
    data-testid="tab-receive"
    aria-selected={activeTab === 'receive'}
    onClick={() => setActiveTab('receive')}
  >
    Receive
  </button>
</div>

<div role="tabpanel" data-testid="tabpanel-content">
  {/* tab content */}
</div>
```

### Toggle Switches
```tsx
<label data-testid="toggle-label">
  <input
    type="checkbox"
    role="switch"
    aria-checked={isEnabled}
    onChange={handleToggle}
    data-testid="toggle-switch"
  />
  <span>Enable Feature</span>
</label>
```

---

## Testing Your Component

### 1. Write Test-Friendly Components
```tsx
// ✅ GOOD - Easy to test
export function EmailButton({ onSendEmail }: Props) {
  return (
    <button
      data-testid="send-via-email"
      onClick={onSendEmail}
      aria-label="Send file via email"
    >
      Send via Email
    </button>
  );
}

// ❌ BAD - Hard to test
export function EmailButton() {
  return <button onClick={() => alert('email')}>Send</button>;
}
```

### 2. Use Playwright Codegen to Find Selectors
```bash
npx playwright codegen http://localhost:3000/app
```

### 3. Test Your Selectors
```tsx
// In your test file
test('button is accessible', async ({ page }) => {
  await page.goto('/app');

  // By data-testid (preferred)
  await expect(page.locator('[data-testid="send-button"]')).toBeVisible();

  // By role and accessible name (also good)
  await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();

  // By aria-label (good for screen readers)
  await expect(page.getByLabel('Send file')).toBeVisible();
});
```

---

## Common Mistakes to Avoid

### ❌ Missing data-testid
```tsx
// BAD
<button onClick={handleSend}>Send</button>

// GOOD
<button data-testid="send-button" onClick={handleSend}>
  Send
</button>
```

### ❌ Inconsistent naming
```tsx
// BAD - Inconsistent
<button data-testid="btnSend">Send</button>
<button data-testid="send_button">Send</button>

// GOOD - Consistent kebab-case
<button data-testid="send-button">Send</button>
<button data-testid="cancel-button">Cancel</button>
```

### ❌ Missing accessibility attributes
```tsx
// BAD
<button data-testid="icon-button">
  <Icon />
</button>

// GOOD
<button
  data-testid="icon-button"
  aria-label="Descriptive action"
>
  <Icon />
  <span className="sr-only">Descriptive action</span>
</button>
```

### ❌ Non-semantic HTML
```tsx
// BAD
<div onClick={handleClick} data-testid="button">
  Click me
</div>

// GOOD
<button data-testid="action-button" onClick={handleClick}>
  Click me
</button>
```

### ❌ Missing role attributes for custom components
```tsx
// BAD
<div className="dialog">
  <h2>Title</h2>
  {content}
</div>

// GOOD
<div
  role="dialog"
  aria-labelledby="dialog-title"
  data-testid="custom-dialog"
>
  <h2 id="dialog-title">Title</h2>
  {content}
</div>
```

---

## Quick Test Commands

### Run all tests
```bash
npm test
```

### Run specific test file
```bash
npx playwright test tests/e2e/camera-capture.spec.ts
```

### Run single test
```bash
npx playwright test tests/e2e/camera-capture.spec.ts:22
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Generate test code
```bash
npx playwright codegen http://localhost:3000/app
```

### View test results
```bash
npx playwright show-report
```

---

## Pre-Commit Checklist

Before committing code with new UI components:

- [ ] Added `data-testid` to all interactive elements
- [ ] Added `aria-label` to icon buttons and non-text elements
- [ ] Used semantic HTML (`button`, not `div` for buttons)
- [ ] Added `role` attributes for custom components
- [ ] Tested component is accessible (keyboard navigation works)
- [ ] Ran relevant E2E tests locally
- [ ] All tests pass

---

## Getting Help

### Component Not Found in Tests?
1. Check if element exists in DOM (inspect in browser)
2. Verify `data-testid` attribute is present
3. Use Playwright codegen to find correct selector
4. Check if element is visible (not hidden by CSS)

### Test Timing Out?
1. Increase timeout: `await expect(element).toBeVisible({ timeout: 10000 })`
2. Wait for network: `await page.waitForLoadState('networkidle')`
3. Add explicit waits: `await page.waitForSelector('[data-testid="element"]')`

### Element Not Clickable?
1. Check if element is covered by another element
2. Scroll element into view: `await element.scrollIntoViewIfNeeded()`
3. Wait for element to be ready: `await element.waitFor({ state: 'visible' })`

### Need to Debug Tests?
1. Run in headed mode: `npx playwright test --headed`
2. Use UI mode: `npx playwright test --ui`
3. Add breakpoints: `await page.pause()`
4. Enable debug mode: `PWDEBUG=1 npx playwright test`

---

## Resources

### Documentation:
- Playwright Docs: https://playwright.dev
- ARIA Practices: https://www.w3.org/WAI/ARIA/apg/
- Testing Library: https://testing-library.com/docs/queries/about

### Internal:
- Test Failure Report: `E2E_TEST_FAILURE_REPORT.md`
- Action Plan: `E2E_TEST_FIX_ACTION_PLAN.md`
- Test Suite: `tests/e2e/`
- Playwright Config: `playwright.config.ts`

---

**Quick Reference Card**
**Version:** 1.0
**Last Updated:** 2026-01-28
**Maintained By:** Test Automation Team
