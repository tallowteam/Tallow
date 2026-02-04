# Testing Quick Start Guide

Get started with testing in Tallow in under 5 minutes.

## Installation

All dependencies are already installed. No additional setup needed!

## Running Your First Test

```bash
# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit:coverage

# Run in watch mode (recommended for development)
npm run test:unit:watch

# Run E2E tests
npm test
```

## Writing Your First Test

### 1. Create a Component Test

Create a file next to your component with `.test.tsx` extension:

```typescript
// components/ui/MyButton.test.tsx
import { render, screen } from '@/tests/utils/render';
import userEvent from '@testing-library/user-event';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('should render button text', () => {
    render(<MyButton>Click me</MyButton>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should handle clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<MyButton onClick={handleClick}>Click</MyButton>);
    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Run Your Test

```bash
# Run specific file
npm run test:unit MyButton.test.tsx

# Or watch mode
npm run test:unit:watch
```

## Common Test Patterns

### Testing Props

```typescript
it('should apply disabled state', () => {
  render(<Button disabled>Disabled</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
});
```

### Testing User Interactions

```typescript
it('should handle input', async () => {
  const user = userEvent.setup();

  render(<Input />);
  const input = screen.getByRole('textbox');

  await user.type(input, 'Hello');
  expect(input).toHaveValue('Hello');
});
```

### Testing with Mock Data

```typescript
import { createMockTransfer } from '@/tests/utils/mocks/zustand';

it('should display transfer info', () => {
  const transfer = createMockTransfer({
    progress: 75,
    status: 'transferring',
  });

  render(<TransferProgress transfer={transfer} />);
  expect(screen.getByText('75%')).toBeInTheDocument();
});
```

### Testing Accessibility

```typescript
it('should have accessible label', () => {
  render(<Button aria-label="Close dialog">×</Button>);
  expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
});

it('should support keyboard navigation', async () => {
  const user = userEvent.setup();

  render(<Button onClick={handleClick}>Press Enter</Button>);

  screen.getByRole('button').focus();
  await user.keyboard('{Enter}');

  expect(handleClick).toHaveBeenCalled();
});
```

## Available Test Utilities

### Custom Render

Automatically wraps components with providers:

```typescript
import { render } from '@/tests/utils/render';

render(<Component />);
```

### Mock Creators

```typescript
import {
  createMockDevice,
  createMockTransfer,
  createMockDeviceStore,
} from '@/tests/utils/mocks/zustand';

// Create test data
const device = createMockDevice({ isOnline: true });
const transfer = createMockTransfer({ progress: 50 });
```

### Test IDs

```typescript
import { TEST_IDS } from '@/tests/utils/test-ids';

screen.getByTestId(TEST_IDS.BUTTON);
```

## Quick Commands Reference

```bash
# Unit Tests
npm run test:unit              # Run all
npm run test:unit:watch        # Watch mode
npm run test:unit:ui           # UI mode
npm run test:unit:coverage     # With coverage

# Component Tests
npm run test:component         # Test components only

# Integration Tests
npm run test:integration       # Test page integration

# E2E Tests
npm test                       # All E2E tests
npm run test:ui                # With Playwright UI
npm run test:headed            # Show browser
npm run test:e2e               # E2E only

# Visual Regression
npm run test:visual            # Run visual tests
npm run test:visual:update     # Update baselines

# All Tests
npm run test:all               # Unit + E2E with coverage
```

## Debugging Tests

### Unit Tests

```bash
# Use Vitest UI (best option)
npm run test:unit:ui

# Debug specific test
npm run test:unit -- -t "test name"
```

### E2E Tests

```bash
# Debug with Playwright Inspector
npx playwright test --debug

# Show browser
npx playwright test --headed
```

## Best Practices Checklist

- ✅ Test user behavior, not implementation details
- ✅ Use accessible queries (getByRole, getByLabelText)
- ✅ Test one thing per test
- ✅ Use descriptive test names
- ✅ Mock external dependencies
- ✅ Clean up after tests
- ✅ Keep tests fast
- ✅ Aim for 80%+ coverage

## Common Issues

### Element Not Found

```typescript
// ❌ Bad - immediate query
screen.getByText('Loading complete');

// ✅ Good - wait for element
await screen.findByText('Loading complete');
```

### Test Timeout

```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // ...
}, { timeout: 10000 }); // 10 seconds
```

### Mock Not Working

```typescript
// ❌ Bad - mock inside test
it('test', () => {
  vi.mock('./module');
});

// ✅ Good - mock at module level
vi.mock('./module', () => ({
  default: vi.fn(),
}));

describe('Test', () => {
  it('test', () => {
    // Use mocked module
  });
});
```

## Next Steps

1. **Read the [Testing Guide](./TESTING_GUIDE.md)** for comprehensive information
2. **Check [Component Test Patterns](./COMPONENT_TEST_PATTERNS.md)** for examples
3. **Review [Testing Infrastructure](./TESTING_INFRASTRUCTURE.md)** for architecture
4. **Start writing tests!**

## Getting Help

- Review existing tests for examples
- Check the documentation in `docs/testing/`
- Ask questions in team channels

## Resources

- [Vitest Docs](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)

Happy testing! 🧪✨
