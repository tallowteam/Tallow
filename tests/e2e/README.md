# TALLOW E2E Test Suite

Comprehensive End-to-End testing suite for TALLOW using Playwright.

## Overview

This test suite provides complete coverage of TALLOW's features including:

- **Core Transfer Tests** - File transfer functionality
- **P2P Connection Tests** - Connection establishment and management
- **Chat Integration Tests** - P2P messaging system
- **Privacy Mode Tests** - Security and privacy features
- **Accessibility Tests** - WCAG 2.1 AA compliance
- **Visual Regression Tests** - UI consistency across browsers

## Test Files

### Core Functionality

- `transfer-core.spec.ts` - Complete file transfer testing
  - Single/multiple file transfers
  - Large file transfers (100MB+)
  - Folder transfers
  - Transfer cancellation and resume
  - Progress tracking

- `p2p-connection.spec.ts` - Connection management
  - Direct P2P connections
  - TURN fallback scenarios
  - Connection timeouts
  - Reconnection handling
  - NAT traversal

- `chat-integration.spec.ts` - Chat messaging
  - Send/receive messages
  - Encryption verification
  - Emoji and special characters
  - Bidirectional messaging
  - Concurrent messages

### Privacy & Security

- `privacy-mode.spec.ts` - Privacy features
  - Privacy mode toggle
  - Onion routing
  - IP leak prevention
  - Metadata stripping
  - VPN detection

### Quality Assurance

- `accessibility.spec.ts` - Accessibility compliance
  - Keyboard navigation
  - Screen reader compatibility
  - ARIA labels
  - Focus management
  - Color contrast

- `visual/visual-regression.spec.ts` - Visual testing
  - Page screenshots
  - Component states
  - Responsive layouts
  - Theme variations

### Existing Tests

- `app.spec.ts` - Basic app functionality
- `landing.spec.ts` - Landing page tests
- `settings.spec.ts` - Settings functionality
- `history.spec.ts` - Transfer history
- `mobile-features.spec.ts` - Mobile-specific features
- `group-transfer.spec.ts` - Group transfer functionality
- `password-protection.spec.ts` - Password-protected transfers
- `metadata-stripping.spec.ts` - Metadata removal
- `screen-sharing.spec.ts` - Screen sharing features
- `camera-capture.spec.ts` - Camera/media capture
- `email-integration.spec.ts` - Email fallback
- `offline.spec.ts` - Offline functionality

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test File

```bash
npx playwright test tests/e2e/transfer-core.spec.ts
```

### Specific Test Suite

```bash
npx playwright test --grep "Core Transfer"
```

### Specific Browser

```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Headed Mode (Watch Tests Run)

```bash
npm run test:headed
```

### UI Mode (Interactive)

```bash
npm run test:ui
```

### Debug Mode

```bash
npx playwright test --debug
```

## Test Configuration

The test suite is configured in `playwright.config.ts`:

### Browsers

- **Chromium** - Desktop Chrome
- **Firefox** - Desktop Firefox
- **Webkit** - Desktop Safari
- **Edge** - Desktop Edge
- **Mobile Chrome** - Pixel 5
- **Mobile Safari** - iPhone 13
- **Tablet** - iPad Pro

### Viewports

- Desktop Large: 1920x1080
- Desktop Standard: 1280x720
- Desktop Small: 1024x768
- Tablet: iPad dimensions
- Mobile: iPhone/Pixel dimensions

### Timeouts

- Test timeout: 90 seconds
- Navigation timeout: 60 seconds
- Action timeout: 20 seconds
- Assertion timeout: 15 seconds

## Test Fixtures

Located in `fixtures.ts`:

### File Management

```typescript
import { TestFileManager } from './fixtures';

const fileManager = new TestFileManager();
const filePath = await fileManager.createFile('test.txt', 10); // 10MB
fileManager.cleanup(); // Clean up after test
```

### P2P Connection

```typescript
import { establishP2PConnection } from './fixtures';

const code = await establishP2PConnection(senderPage, receiverPage);
```

### Chat Operations

```typescript
import { openChatPanel, sendChatMessage } from './fixtures';

await openChatPanel(page);
await sendChatMessage(page, 'Hello!');
```

### Visual Testing

```typescript
import { prepareForScreenshot } from './fixtures';

await prepareForScreenshot(page);
await expect(page).toHaveScreenshot('screenshot.png');
```

### Monitoring

```typescript
import { ConsoleMonitor, NetworkMonitor } from './fixtures';

const consoleMonitor = new ConsoleMonitor(page);
const networkMonitor = new NetworkMonitor(page);

// Later...
const errors = consoleMonitor.getErrors();
const failedRequests = networkMonitor.getFailedRequests();
```

## Writing New Tests

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/app');
    await page.waitForLoadState('networkidle');

    // Test logic
    const element = page.locator('selector');
    await expect(element).toBeVisible();
  });
});
```

### Using Fixtures

```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test('should connect two peers', async ({ dualBrowser }) => {
    const { senderPage, receiverPage } = dualBrowser;

    // Test logic
  });
});
```

### File Transfer Test

```typescript
import { test, expect, TestFileManager, establishP2PConnection } from './fixtures';

test('should transfer file', async ({ browser }) => {
  const fileManager = new TestFileManager();
  const testFile = await fileManager.createFile('test.txt', 1); // 1MB

  try {
    const senderContext = await browser.newContext();
    const receiverContext = await browser.newContext();
    const senderPage = await senderContext.newPage();
    const receiverPage = await receiverContext.newPage();

    await Promise.all([
      senderPage.goto('/app'),
      receiverPage.goto('/app'),
    ]);

    const code = await establishP2PConnection(senderPage, receiverPage);
    expect(code).not.toBeNull();

    // Select and send file
    const fileInput = senderPage.locator('input[type="file"]');
    await fileInput.setInputFiles(testFile);

    const sendBtn = senderPage.getByRole('button', { name: /send/i });
    await sendBtn.click();

    // Wait for completion
    await expect(
      senderPage.getByText(/complete|success/i)
    ).toBeVisible({ timeout: 60000 });

    await senderContext.close();
    await receiverContext.close();
  } finally {
    fileManager.cleanup();
  }
});
```

## Best Practices

### 1. Use Test IDs

Add `data-testid` attributes to elements for stable selectors:

```typescript
const element = page.locator('[data-testid="connection-code"]');
```

### 2. Wait for Stability

Always wait for network idle before interacting:

```typescript
await page.waitForLoadState('networkidle');
```

### 3. Use Flexible Selectors

Combine multiple selector strategies:

```typescript
const button = page
  .locator('[data-testid="send-button"]')
  .or(page.getByRole('button', { name: /send/i }))
  .first();
```

### 4. Handle Timeouts

Use try-catch for optional elements:

```typescript
const hasElement = await element.isVisible({ timeout: 5000 }).catch(() => false);
```

### 5. Clean Up Resources

Always clean up files and contexts:

```typescript
try {
  // Test logic
} finally {
  fileManager.cleanup();
  await context.close();
}
```

### 6. Make Tests Resilient

Check if elements exist before interacting:

```typescript
if (await button.isVisible({ timeout: 5000 }).catch(() => false)) {
  await button.click();
}
```

### 7. Use Descriptive Names

Test names should clearly describe what is being tested:

```typescript
test('should display error message when connection code is invalid', async ({ page }) => {
  // Test logic
});
```

## CI/CD Integration

Tests run automatically in GitHub Actions:

- On pull requests
- On push to main
- Nightly builds

### Environment Variables

- `CI` - Set to `true` in CI environment
- `APP_URL` - Base URL for testing (default: http://localhost:3000)

## Debugging Tests

### View Test Report

```bash
npx playwright show-report
```

### Trace Viewer

```bash
npx playwright show-trace trace.zip
```

### Screenshots

Screenshots are captured on failure and saved to `test-results/`

### Videos

Videos are recorded on failure and saved to `test-results/`

## Visual Regression

### Update Baselines

```bash
npx playwright test --update-snapshots
```

### Compare Differences

Failed visual tests show differences in the HTML report.

## Performance Testing

Tests include performance monitoring:

```typescript
import { measurePageLoad, getMemoryUsage } from './fixtures';

const metrics = await measurePageLoad(page);
expect(metrics.loadTime).toBeLessThan(3000); // 3 seconds

const memory = await getMemoryUsage(page);
expect(memory).toBeLessThan(100 * 1024 * 1024); // 100MB
```

## Troubleshooting

### Tests Timing Out

Increase timeout in test:

```typescript
test.setTimeout(180000); // 3 minutes
```

### Browser Not Found

Install browsers:

```bash
npx playwright install
```

### Dev Server Not Starting

Check if port 3000 is available:

```bash
lsof -ti:3000
```

### Tests Flaky

Add more wait conditions:

```typescript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

## Test Coverage

Current coverage:

- ✅ Core file transfers
- ✅ P2P connections
- ✅ Chat messaging
- ✅ Privacy features
- ✅ Accessibility
- ✅ Visual regression
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility

## Contributing

When adding new features:

1. Add corresponding E2E tests
2. Update this README
3. Ensure tests pass on all browsers
4. Add visual regression tests if UI changes
5. Update test fixtures if needed

## Resources

- [Playwright Documentation](https://playwright.dev)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Best Practices](https://playwright.dev/docs/best-practices)

## License

See LICENSE file in project root.
