# Testing Guide

Comprehensive guide to testing in the Tallow project.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Tallow uses a multi-layered testing strategy:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test component interactions and pages
- **E2E Tests**: Test complete user flows with Playwright
- **Visual Regression**: Test UI consistency across browsers/viewports

### Test Stack

- **Vitest**: Fast unit/integration test runner
- **Testing Library**: Component testing utilities
- **Playwright**: E2E and visual regression testing
- **Happy DOM**: Lightweight DOM implementation

## Test Types

### Unit Tests

Test individual components in isolation.

**Location**: `components/**/*.test.tsx`, `lib/**/*.test.ts`

**Example**:
```typescript
import { render, screen } from '@/tests/utils/render';
import { Button } from './Button';

test('should render button', () => {
  render(<Button>Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

### Integration Tests

Test component interactions and page rendering.

**Location**: `tests/integration/**/*.test.tsx`

**Example**:
```typescript
import { render, screen } from '@/tests/utils/render';
import LandingPage from '@/app/page';

test('should render landing page', () => {
  render(<LandingPage />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
});
```

### E2E Tests

Test complete user flows in real browsers.

**Location**: `tests/e2e/**/*.spec.ts`

**Example**:
```typescript
import { test, expect } from '@playwright/test';

test('should transfer file', async ({ page }) => {
  await page.goto('/app');
  await page.getByText('Select Files').click();
  // ... test flow
});
```

### Visual Regression Tests

Ensure UI consistency across updates.

**Location**: `tests/e2e/visual-regression.spec.ts`

**Example**:
```typescript
test('should match baseline', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('landing.png');
});
```

## Running Tests

### Unit and Integration Tests

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit -- --watch

# Run tests with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit -- Button.test.tsx

# Run tests matching pattern
npm run test:unit -- --grep "Button"
```

### E2E Tests

```bash
# Run all E2E tests
npm test

# Run with UI mode
npm run test:ui

# Run in headed mode
npm run test:headed

# Run specific test file
npx playwright test navigation.spec.ts

# Run specific test
npx playwright test -g "should navigate"

# Debug mode
npx playwright test --debug
```

### Visual Regression Tests

```bash
# Run visual tests
npx playwright test visual-regression.spec.ts

# Update baselines
npx playwright test visual-regression.spec.ts --update-snapshots

# Compare specific snapshot
npx playwright test -g "landing page"
```

## Writing Tests

### Component Test Pattern

```typescript
/**
 * Component Name Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<ComponentName />);
      expect(screen.getByRole('...')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<ComponentName onClick={handleClick} />);
      await user.click(screen.getByRole('button'));

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have accessible name', () => {
      render(<ComponentName aria-label="Test" />);
      expect(screen.getByLabelText('Test')).toBeInTheDocument();
    });
  });
});
```

### Using Test Utilities

#### Custom Render

```typescript
import { render } from '@/tests/utils/render';

// Renders with all providers
render(<Component />);
```

#### Mock Stores

```typescript
import { createMockDeviceStore } from '@/tests/utils/mocks/zustand';

const mockStore = createMockDeviceStore({
  devices: [mockDevice],
  selectedDevice: mockDevice,
});
```

#### Mock Router

```typescript
import { createMockRouter } from '@/tests/utils/mocks/next-router';

const mockRouter = createMockRouter({
  pathname: '/app',
  push: vi.fn(),
});
```

### E2E Test Pattern

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    const button = page.getByRole('button', { name: /click/i });

    // Act
    await button.click();

    // Assert
    await expect(page).toHaveURL(/success/);
  });
});
```

### Test Data Builders

```typescript
import { createMockTransfer, createMockDevice } from '@/tests/utils/mocks/zustand';

// Create test data
const transfer = createMockTransfer({
  progress: 75,
  status: 'transferring',
});

const device = createMockDevice({
  name: 'Test Device',
  isOnline: true,
});
```

## Best Practices

### Unit Tests

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Good - tests behavior
   expect(screen.getByRole('button')).toBeDisabled();

   // ❌ Bad - tests implementation
   expect(component.state.disabled).toBe(true);
   ```

2. **Use accessible queries**
   ```typescript
   // ✅ Good - uses accessible role
   screen.getByRole('button', { name: /submit/i })

   // ❌ Bad - fragile selector
   screen.getByTestId('submit-btn')
   ```

3. **Test user interactions**
   ```typescript
   const user = userEvent.setup();
   await user.click(button);
   await user.type(input, 'text');
   ```

### Integration Tests

1. **Mock external dependencies**
   ```typescript
   vi.mock('next/navigation');
   vi.mock('@/lib/stores/device-store');
   ```

2. **Test component composition**
   ```typescript
   render(
     <Card>
       <CardHeader>Title</CardHeader>
       <CardBody>Content</CardBody>
     </Card>
   );
   ```

3. **Verify data flow**
   ```typescript
   expect(mockStore.setDevices).toHaveBeenCalledWith(devices);
   ```

### E2E Tests

1. **Use page object pattern for complex flows**
   ```typescript
   class TransferPage {
     async selectFile(filename: string) {
       await this.page.getByText('Select Files').click();
       // ...
     }
   }
   ```

2. **Wait for network to be idle**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Use meaningful test data**
   ```typescript
   const testFile = {
     name: 'test-document.pdf',
     content: Buffer.from('test content'),
   };
   ```

### Visual Regression

1. **Disable animations**
   ```typescript
   await expect(page).toHaveScreenshot({
     animations: 'disabled',
   });
   ```

2. **Use consistent viewport sizes**
   ```typescript
   await page.setViewportSize({ width: 1920, height: 1080 });
   ```

3. **Update baselines deliberately**
   ```bash
   # Review changes before updating
   npx playwright test --update-snapshots
   ```

## Coverage Requirements

- **Overall**: 80%+
- **Components**: 85%+
- **Critical paths**: 100%

### Generate Coverage Report

```bash
npm run test:unit -- --coverage
```

Open `coverage/index.html` to view detailed report.

### Check Coverage

```bash
# Fail if below threshold
npm run test:unit -- --coverage --coverage.enabled
```

## Debugging Tests

### Unit Tests

```bash
# Run in debug mode
npm run test:unit -- --inspect-brk

# Run with UI
npx vitest --ui
```

### E2E Tests

```bash
# Debug mode with Playwright Inspector
npx playwright test --debug

# Show browser
npx playwright test --headed

# Slow motion
npx playwright test --slow-mo=1000
```

### Visual Debugging

```bash
# Show trace viewer
npx playwright show-trace trace.zip

# Show report
npx playwright show-report
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run Unit Tests
  run: npm run test:unit -- --coverage

- name: Run E2E Tests
  run: npm test

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

```bash
# Runs on git commit
npm test:unit
```

## Troubleshooting

### Common Issues

**Tests timeout**
```typescript
// Increase timeout for slow tests
test('slow test', async () => {
  // ...
}, { timeout: 30000 });
```

**Flaky tests**
```typescript
// Add explicit waits
await page.waitForSelector('[data-testid="loaded"]');
await page.waitForLoadState('networkidle');
```

**Mock not working**
```typescript
// Ensure mock is hoisted
vi.mock('./module', () => ({
  default: vi.fn(),
}));
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
