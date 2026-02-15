# E2E Test Suite

Comprehensive end-to-end tests for the Tallow application using Playwright.

## Test Files

### 1. `fixtures.ts`
Shared test utilities and helpers:
- **MockDevice**: Mock device for discovery testing
- **FileHelpers**: File generation utilities for transfer tests
- **Helper functions**: Navigation, element waiting, storage clearing, WebRTC mocking

### 2. `navigation.spec.ts`
Tests for application navigation:
- ✅ Main page navigation (/, /features, /security, /pricing, /about, /docs, /transfer, /settings)
- ✅ Header navigation links and active states
- ✅ Footer links
- ✅ 404 page handling
- ✅ Mobile navigation menu
- ✅ Keyboard navigation
- ✅ Theme toggle functionality
- ✅ URL parameter handling

### 3. `transfer-page.spec.ts`
Tests for the transfer page:
- ✅ Page load and initial state
- ✅ Tab switching (Nearby, Internet, Friends)
- ✅ File drop zone interaction
- ✅ File selection and queue management
- ✅ Room code connection UI
- ✅ Manual IP entry dialog
- ✅ Transfer history sidebar
- ✅ Privacy indicators
- ✅ Guest mode banner

### 4. `settings-page.spec.ts`
Tests for the settings page:
- ✅ Theme toggling (dark, light, high-contrast, colorblind)
- ✅ Device name editing
- ✅ Privacy toggle switches
- ✅ Settings persistence after reload
- ✅ Transfer settings
- ✅ Notification settings
- ✅ Silent hours configuration
- ✅ Reset to defaults functionality

### 5. `responsive.spec.ts`
Tests for responsive design:
- ✅ Mobile viewport (375px) layout
- ✅ Tablet viewport (768px) layout
- ✅ Desktop viewport (1280px) layout
- ✅ Header collapse behavior
- ✅ Layout adaptation on resize
- ✅ Touch target sizes
- ✅ Orientation changes

### 6. `accessibility.spec.ts`
Tests for accessibility compliance:
- ✅ Keyboard navigation through all pages
- ✅ Skip link functionality
- ✅ Image alt text verification
- ✅ Accessible names for buttons/links
- ✅ Focus management in modals
- ✅ ARIA attributes (aria-current, aria-pressed, aria-expanded, etc.)
- ✅ Form accessibility
- ✅ Focus indicators
- ✅ Semantic HTML structure
- ✅ Heading hierarchy

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in headed mode (with browser visible)
```bash
npm run test:headed
```

### Run tests in UI mode (interactive debugging)
```bash
npm run test:ui
```

### Run specific test file
```bash
npx playwright test tests/e2e/navigation.spec.ts
```

### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile device
```bash
npx playwright test --project=mobile
```

## Test Configuration

Configuration is in `playwright.config.ts`:
- **Base URL**: http://localhost:3000
- **Timeout**: 90 seconds per test
- **Retries**: 1 (2 in CI)
- **Workers**: 2 local, 1 in CI
- **Projects**: chromium, firefox, webkit, mobile, tablet, various desktop sizes

## Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Using File Helpers
```typescript
test('should upload file', async ({ page, fileHelpers }) => {
  const testFile = fileHelpers.createTextFile('test.txt');

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(testFile);

  await expect(page.locator('text=test.txt')).toBeVisible();
});
```

### Using Mock Device
```typescript
test('should discover mock device', async ({ page, mockDevice }) => {
  await mockDevice.inject(page);
  await page.goto('/transfer');

  // Mock device should appear in discovery
  await expect(page.locator(`text=${mockDevice.name}`)).toBeVisible();
});
```

## Best Practices

1. **Use semantic locators**: Prefer text content and accessibility attributes
   ```typescript
   // Good
   page.locator('button:has-text("Save")')
   page.locator('button[aria-label="Close"]')

   // Avoid
   page.locator('.btn-primary-123')
   ```

2. **Wait for elements**: Use auto-waiting with expect
   ```typescript
   await expect(page.locator('text=Loading...')).toBeVisible();
   ```

3. **Test user flows**: Focus on realistic user interactions
   ```typescript
   // Navigate like a user would
   await page.locator('a:has-text("Features")').click();
   await expect(page).toHaveURL(/\/features/);
   ```

4. **Clean up**: Use beforeEach/afterEach for setup/teardown
   ```typescript
   test.beforeEach(async ({ page }) => {
     await clearStorage(page);
     await page.goto('/');
   });
   ```

5. **Accessibility first**: Always test keyboard navigation and ARIA
   ```typescript
   await page.keyboard.press('Tab');
   const ariaLabel = await button.getAttribute('aria-label');
   expect(ariaLabel).toBeTruthy();
   ```

## Debugging Tests

### Run tests in debug mode
```bash
npx playwright test --debug
```

### View test report
```bash
npx playwright show-report
```

### Take screenshots
```typescript
await page.screenshot({ path: 'screenshot.png', fullPage: true });
```

### View trace on failure
Traces are automatically captured on first retry. View them with:
```bash
npx playwright show-trace test-results/.../trace.zip
```

## CI/CD Integration

Tests run automatically in CI with:
- Single worker to reduce server load
- 2 retries for flaky test resilience
- JUnit reporter for integration with CI tools
- Screenshots and videos on failure

## Coverage

Current test coverage:
- ✅ Navigation: 100% of main routes
- ✅ Transfer page: All major interactions
- ✅ Settings page: All configuration options
- ✅ Responsive: Mobile, tablet, desktop
- ✅ Accessibility: WCAG 2.1 Level AA compliance checks

## Known Issues

- WebRTC testing requires mocking (implemented in fixtures)
- File transfer requires mock server (can be added)
- Some tests may be flaky on slow networks (retries configured)

## Future Enhancements

- [ ] Add visual regression testing
- [ ] Add performance testing
- [ ] Add security testing
- [ ] Add API testing
- [ ] Add multi-user transfer scenarios
- [x] Add network condition testing (`tests/e2e/network-resilience.spec.ts`: offline, 3G-like latency, flaky request recovery)
