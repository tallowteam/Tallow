# Group Transfer Integration Tests - Quick Guide

## Quick Start

### Run All Tests

```bash
# Unit tests only
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts

# E2E tests only
npx playwright test tests/e2e/group-transfer-integration.spec.ts

# All tests (requires dev server running)
npm run test:unit && npx playwright test tests/e2e/group-transfer-integration.spec.ts
```

### Run Specific Test Suites

```bash
# Unit: Data conversion tests
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts -t "Conversion"

# Unit: State synchronization tests
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts -t "State Synchronization"

# E2E: Local network workflow
npx playwright test tests/e2e/group-transfer-integration.spec.ts -g "Local Network"

# E2E: Friends workflow
npx playwright test tests/e2e/group-transfer-integration.spec.ts -g "Friends Workflow"
```

---

## Test File Locations

```
tests/
├── unit/
│   └── transfer/
│       └── transfer-mode-integration.test.ts     (52 unit tests)
└── e2e/
    └── group-transfer-integration.spec.ts        (24 scenarios × 3 browsers = 72 tests)
```

---

## Unit Tests Structure

### File: `tests/unit/transfer/transfer-mode-integration.test.ts`

```typescript
describe('Transfer Mode Integration', () => {
  // 1. Local Devices Conversion (4 tests)
  describe('Local Devices Conversion', () => { ... })

  // 2. Friends Conversion (6 tests)
  describe('Friends Conversion', () => { ... })

  // 3. Available Recipients Calculation (6 tests)
  describe('Available Recipients Calculation', () => { ... })

  // 4. Transfer Mode Switching (4 tests)
  describe('Transfer Mode Switching', () => { ... })

  // 5. Recipient Selection and Deselection (7 tests)
  describe('Recipient Selection and Deselection', () => { ... })

  // 6. Connection Type Switching with Mode Persistence (5 tests)
  describe('Connection Type Switching with Mode Persistence', () => { ... })

  // 7. Empty Recipient Lists (4 tests)
  describe('Empty Recipient Lists', () => { ... })

  // 8. Group Transfer Initialization (5 tests)
  describe('Group Transfer Initialization', () => { ... })

  // 9. State Synchronization Between Components (6 tests)
  describe('State Synchronization Between Components', () => { ... })

  // 10. Edge Cases and Error Handling (5 tests)
  describe('Edge Cases and Error Handling', () => { ... })
})
```

### Key Test Utilities

```typescript
// Data conversion functions
convertDiscoveredToDevice(discovered: DiscoveredDevice): Device
convertFriendToDevice(friend: Friend): Device
getAvailableRecipients(type, localDevices, friendDevices): Device[]

// These mirror the actual app logic for testing
```

---

## E2E Tests Structure

### File: `tests/e2e/group-transfer-integration.spec.ts`

```typescript
test.describe('Group Transfer Integration', () => {
  // 1. Local Network Workflow (3 tests)
  test.describe('Local Network Workflow', () => { ... })

  // 2. Friends Workflow (4 tests)
  test.describe('Friends Workflow', () => { ... })

  // 3. Connection Type Switching (3 tests)
  test.describe('Connection Type Switching', () => { ... })

  // 4. Mode Toggle UI Interactions (4 tests)
  test.describe('Mode Toggle UI Interactions', () => { ... })

  // 5. Recipient Selector Dialog (4 tests)
  test.describe('Recipient Selector Dialog', () => { ... })

  // 6. Group Transfer Progress (3 tests)
  test.describe('Group Transfer Progress', () => { ... })

  // 7. Error Handling (3 tests)
  test.describe('Error Handling', () => { ... })
})
```

### Helper Functions

```typescript
// Navigation
navigateToApp(page): Navigate to /app
waitForElement(page, selector, timeout): Wait for element

// Interactions
selectConnectionType(page, type): Click local/internet/friends
enableGroupMode(page): Enable group transfer mode
disableGroupMode(page): Switch to single mode

// Use these in your tests for consistency
```

---

## Running E2E Tests in Different Modes

### Development Mode (with UI)

```bash
# Start dev server first
npm run dev

# In another terminal, run tests with UI
npx playwright test tests/e2e/group-transfer-integration.spec.ts --ui
```

### Debug Mode

```bash
# Run with debugger
npx playwright test tests/e2e/group-transfer-integration.spec.ts --debug

# Run specific test with debugger
npx playwright test tests/e2e/group-transfer-integration.spec.ts --debug -g "should discover local devices"
```

### Headed Mode (see browser)

```bash
npx playwright test tests/e2e/group-transfer-integration.spec.ts --headed
```

### Specific Browser

```bash
# Chromium only
npx playwright test tests/e2e/group-transfer-integration.spec.ts --project=chromium

# Firefox only
npx playwright test tests/e2e/group-transfer-integration.spec.ts --project=firefox

# Mobile only
npx playwright test tests/e2e/group-transfer-integration.spec.ts --project=mobile
```

---

## Watch Mode for Development

### Unit Tests Watch Mode

```bash
# Watch mode (re-runs on file changes)
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --watch

# Watch mode with UI
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --ui
```

### E2E Tests Watch Mode

```bash
# Playwright watch mode (requires --ui)
npx playwright test tests/e2e/group-transfer-integration.spec.ts --ui
```

---

## Filtering Tests

### By Test Name

```bash
# Unit tests with "conversion" in name
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts -t "conversion"

# E2E tests with "dialog" in name
npx playwright test tests/e2e/group-transfer-integration.spec.ts -g "dialog"
```

### By Describe Block

```bash
# Run only "Local Network Workflow" tests
npx playwright test tests/e2e/group-transfer-integration.spec.ts -g "Local Network Workflow"

# Run only "State Synchronization" tests
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts -t "State Synchronization"
```

---

## Coverage Reports

### Generate Unit Test Coverage

```bash
# Run with coverage
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --coverage

# Generate HTML report
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --coverage --coverage.reporter=html

# Open coverage report
# Windows
start coverage/index.html

# Mac/Linux
open coverage/index.html
```

### E2E Test Reports

```bash
# Generate HTML report
npx playwright test tests/e2e/group-transfer-integration.spec.ts --reporter=html

# Open report
npx playwright show-report
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Group Transfer Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/e2e/group-transfer-integration.spec.ts
```

---

## Debugging Failed Tests

### Unit Test Debugging

```bash
# Run with verbose output
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --reporter=verbose

# Run only failed tests
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --run --reporter=verbose

# Show console logs
npm run test:unit -- tests/unit/transfer/transfer-mode-integration.test.ts --reporter=verbose --outputFile=test-output.log
```

### E2E Test Debugging

```bash
# Debug mode (opens browser dev tools)
npx playwright test tests/e2e/group-transfer-integration.spec.ts --debug

# Trace viewer (record and replay)
npx playwright test tests/e2e/group-transfer-integration.spec.ts --trace on
npx playwright show-trace trace.zip

# Screenshots on failure
npx playwright test tests/e2e/group-transfer-integration.spec.ts --screenshot=only-on-failure
```

---

## Common Test Scenarios

### Testing Data Conversion

```typescript
// Example: Test local device conversion
test('should convert discovered device', () => {
  const discovered = {
    id: 'device-1',
    name: 'Test Device',
    platform: 'windows',
    isOnline: true,
    lastSeen: Date.now(),
    ipAddress: '192.168.1.100',
  };

  const device = convertDiscoveredToDevice(discovered);

  expect(device.id).toBe('device-1');
  expect(device.platform).toBe('windows');
  expect(device.isOnline).toBe(true);
});
```

### Testing State Management

```typescript
// Example: Test mode switching
test('should switch modes', () => {
  let mode = 'single';

  mode = 'group'; // Switch to group
  expect(mode).toBe('group');

  mode = 'single'; // Switch back
  expect(mode).toBe('single');
});
```

### Testing UI Interactions

```typescript
// Example: E2E test for selecting recipients
test('should select recipients', async ({ page }) => {
  await navigateToApp(page);
  await selectConnectionType(page, 'friends');
  await enableGroupMode(page);

  const selectButton = page.locator('[data-testid="select-recipients"]');
  await selectButton.click();

  const checkboxes = page.locator('[role="checkbox"]');
  await checkboxes.first().click();

  const confirmButton = page.locator('button:has-text("Confirm")');
  await confirmButton.click();
});
```

---

## Test Data Setup

### Mock Data for Unit Tests

```typescript
// Local devices
const discoveredDevices = [
  {
    id: 'local-device-1',
    name: 'Living Room Laptop',
    platform: 'windows',
    isOnline: true,
    lastSeen: Date.now(),
    ipAddress: '192.168.1.100',
  },
  // ... more devices
];

// Friends
const friends = [
  {
    id: 'friend-1',
    name: 'Alice Smith',
    email: 'alice@example.com',
    friendCode: 'ABCD1234',
    requirePasscode: false,
    trustLevel: 'trusted',
    connectionPreferences: {
      autoAccept: true,
      notifications: true,
    },
    addedAt: new Date('2024-01-01'),
    lastConnected: new Date(),
  },
  // ... more friends
];
```

### Mock Data for E2E Tests

E2E tests use actual app state. To populate test data:

```bash
# 1. Start app in dev mode
npm run dev

# 2. Manually add friends/devices through UI
# 3. Export localStorage/IndexedDB
# 4. Import in tests or use beforeEach hooks
```

---

## Performance Benchmarks

### Unit Tests
- **Target**: < 100ms per test suite
- **Current**: ~59ms for 52 tests ✅
- **Optimization**: Use lightweight mocks, avoid heavy computations

### E2E Tests
- **Target**: < 60s per test
- **Current**: Varies by network/system
- **Optimization**: Use test.setTimeout(), parallel execution

---

## Maintenance Checklist

### Weekly
- [ ] Run full test suite
- [ ] Check for flaky tests
- [ ] Update test data if schema changes

### Monthly
- [ ] Review test coverage
- [ ] Update Playwright/Vitest versions
- [ ] Refactor duplicate test code

### Per Release
- [ ] Run on all browsers
- [ ] Test on real devices (mobile)
- [ ] Verify CI/CD pipeline

---

## Troubleshooting

### "Test timeout exceeded"

```bash
# Increase timeout for specific test
test('slow test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  // ... test code
});

# Or in vitest.config.ts
export default defineConfig({
  test: {
    testTimeout: 60000, // 1 minute
  }
});
```

### "Element not found"

```bash
# Add more specific selectors
await page.waitForSelector('[data-testid="specific-element"]', {
  state: 'visible',
  timeout: 10000
});

# Or use getByRole
await page.getByRole('button', { name: 'Send' }).click();
```

### "Port already in use"

```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <pid> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### "Browser not installed"

```bash
# Install Playwright browsers
npx playwright install

# Install with system dependencies
npx playwright install --with-deps
```

---

## Additional Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

### Test Files
- `tests/unit/transfer/transfer-mode-integration.test.ts`
- `tests/e2e/group-transfer-integration.spec.ts`
- `GROUP_TRANSFER_TEST_SUMMARY.md`

### Related Source Files
- `lib/types.ts`
- `lib/storage/friends.ts`
- `lib/storage/my-devices.ts`
- `lib/hooks/use-group-transfer.ts`
- `lib/transfer/group-transfer-manager.ts`

---

## Support

For issues or questions:
1. Check `GROUP_TRANSFER_TEST_SUMMARY.md` for detailed test information
2. Review test output and error messages
3. Enable debug mode for E2E tests
4. Check source code comments in test files

---

**Last Updated**: 2026-01-27
**Test Framework Versions**: Vitest 4.0.18, Playwright 1.x
**Status**: ✅ All Tests Passing
