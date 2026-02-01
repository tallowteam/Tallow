# E2E Testing Quick Start Guide

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/e2e/transfer-core.spec.ts

# Run tests in headed mode (see browser)
npm run test:headed

# Run tests in UI mode (interactive)
npm run test:ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox

# Run specific test by name
npx playwright test --grep "should transfer a small file"

# Debug mode
npx playwright test --debug
```

## Test Files Overview

| File | Purpose | Test Count |
|------|---------|------------|
| `transfer-core.spec.ts` | File transfers | 17 |
| `p2p-connection.spec.ts` | P2P connections | 23 |
| `chat-integration.spec.ts` | Chat messaging | 20 |
| `privacy-mode.spec.ts` | Privacy features | 22 |
| `accessibility.spec.ts` | WCAG compliance | 29 |
| `visual/visual-regression.spec.ts` | Visual testing | 40+ |

## Quick Test Examples

### Basic Test

```typescript
import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('/app');
  await expect(page.locator('h1')).toBeVisible();
});
```

### File Transfer Test

```typescript
import { test, expect, TestFileManager } from './fixtures';

test('file transfer', async ({ browser }) => {
  const fileManager = new TestFileManager();
  const file = await fileManager.createFile('test.txt', 1);

  try {
    // Test logic here
  } finally {
    fileManager.cleanup();
  }
});
```

### P2P Connection Test

```typescript
import { test, expect, establishP2PConnection } from './fixtures';

test('P2P connection', async ({ dualBrowser }) => {
  const { senderPage, receiverPage } = dualBrowser;
  const code = await establishP2PConnection(senderPage, receiverPage);
  expect(code).not.toBeNull();
});
```

### Visual Test

```typescript
import { test, expect, prepareForScreenshot } from './fixtures';

test('visual test', async ({ page }) => {
  await page.goto('/app');
  await prepareForScreenshot(page);
  await expect(page).toHaveScreenshot('app.png');
});
```

## Common Selectors

```typescript
// By test ID (preferred)
page.locator('[data-testid="connection-code"]')

// By role
page.getByRole('button', { name: /send/i })

// By text
page.getByText(/complete|success/i)

// By placeholder
page.getByPlaceholder(/enter.*code/i)

// Combined (fallback)
page.locator('[data-testid="button"]')
  .or(page.getByRole('button', { name: /send/i }))
  .first()
```

## Wait Strategies

```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for element
await expect(element).toBeVisible({ timeout: 10000 });

// Wait for condition
await page.waitForTimeout(1000);

// Wait for function
await page.waitForFunction(() => document.fonts.ready);
```

## Debugging

### View Test Report

```bash
npx playwright show-report
```

### View Trace

```bash
npx playwright show-trace trace.zip
```

### Debug Specific Test

```bash
npx playwright test transfer-core.spec.ts --debug
```

### Headed Mode

```bash
npx playwright test --headed --slowmo=1000
```

## Visual Testing

### Update Baselines

```bash
npx playwright test --update-snapshots
```

### Update Specific Test

```bash
npx playwright test visual-regression.spec.ts --update-snapshots
```

## Environment Variables

```bash
# Set custom base URL
APP_URL=http://localhost:4000 npm test

# Enable CI mode
CI=true npm test
```

## Browser Selection

```bash
# Single browser
npx playwright test --project=chromium

# Multiple browsers
npx playwright test --project=chromium --project=firefox

# Mobile
npx playwright test --project=mobile-chrome

# All browsers
npx playwright test
```

## Filtering Tests

```bash
# By test name
npx playwright test --grep "should transfer"

# Exclude tests
npx playwright test --grep-invert "visual"

# By file
npx playwright test transfer-core

# By tag (if using tags)
npx playwright test --grep "@smoke"
```

## Best Practices Checklist

- ✅ Use `data-testid` for stable selectors
- ✅ Wait for `networkidle` before interactions
- ✅ Use `.catch(() => false)` for optional elements
- ✅ Clean up resources in `finally` blocks
- ✅ Use descriptive test names
- ✅ Add timeouts for slow operations
- ✅ Handle both success and failure cases
- ✅ Make tests independent (no test dependencies)

## Troubleshooting

### Tests Timing Out

```typescript
// Increase timeout
test.setTimeout(180000); // 3 minutes

// Or in specific test
await expect(element).toBeVisible({ timeout: 60000 });
```

### Flaky Tests

```typescript
// Add retries
test.describe.configure({ retries: 2 });

// Add more waits
await page.waitForLoadState('networkidle');
await page.waitForTimeout(1000);
```

### Element Not Found

```typescript
// Check if element exists first
const hasElement = await element.isVisible({ timeout: 5000 }).catch(() => false);
if (hasElement) {
  await element.click();
}
```

### Browser Not Installed

```bash
npx playwright install
npx playwright install chromium
```

## CI/CD Configuration

### GitHub Actions

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Performance Tips

1. **Parallel Execution**: Tests run in parallel by default
2. **Reuse Contexts**: Use fixtures for common setup
3. **Network Idle**: Only wait when necessary
4. **Screenshot on Failure**: Automatic in config
5. **Retry Failed**: Configured in playwright.config.ts

## Useful Commands

```bash
# List all tests
npx playwright test --list

# Show config
npx playwright show-config

# Clear cache
rm -rf test-results/
rm -rf playwright-report/

# Install specific browser
npx playwright install firefox

# Check version
npx playwright --version

# Generate tests (Codegen)
npx playwright codegen localhost:3000
```

## Documentation

- [Full README](./tests/e2e/README.md)
- [Fixtures Documentation](./tests/e2e/fixtures.ts)
- [Test Summary](./E2E_TEST_SUITE_SUMMARY.md)
- [Playwright Docs](https://playwright.dev)

## Getting Help

1. Check test output and errors
2. View HTML report: `npx playwright show-report`
3. Check trace viewer for failed tests
4. Review README and documentation
5. Check Playwright documentation
6. Run in debug mode: `--debug`

## Next Steps

1. ✅ Install dependencies and browsers
2. ✅ Run all tests to verify setup
3. ✅ Review test files in `tests/e2e/`
4. ✅ Read [README](./tests/e2e/README.md)
5. ✅ Try writing a simple test
6. ✅ Run tests in UI mode to explore

---

**Happy Testing! 🎭**
