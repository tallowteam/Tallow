# Testing Quick Reference Guide

**Last Updated:** 2026-01-27

## Quick Commands

### Run Tests

```bash
# Run all unit tests
npm run test:unit

# Run unit tests with coverage
npm run test:unit -- --coverage

# Run specific test file
npm run test:unit tests/unit/crypto/key-management.test.ts

# Run tests in watch mode
npm run test:unit -- --watch

# Run crypto tests only
npm run test:crypto

# Run E2E tests
npm test

# Run E2E tests in headed mode
npm run test:headed

# Run E2E tests with UI
npm run test:ui
```

### Coverage Reports

```bash
# Generate coverage report
npm run test:unit -- --coverage

# View coverage in browser
npx vitest --coverage --ui

# Coverage for specific directory
npm run test:unit -- --coverage tests/unit/crypto
```

### Test Filtering

```bash
# Run tests matching pattern
npm run test:unit -- --grep="key-management"

# Run only crypto tests
npm run test:unit -- tests/unit/crypto/**/*.test.ts

# Run tests in specific file
npm run test:unit -- tests/unit/crypto/triple-ratchet.test.ts

# Run specific test suite
npm run test:unit -- --grep="Double Ratchet"
```

## Test File Locations

### Unit Tests
```
tests/unit/
├── crypto/
│   ├── key-management.test.ts       (82 tests) ✅
│   ├── peer-authentication.test.ts  (70 tests) ✅
│   ├── triple-ratchet.test.ts       (52 tests) ✅
│   ├── sparse-pq-ratchet.test.ts    (66 tests) ✅
│   ├── pqc-crypto.test.ts           (existing)
│   ├── digital-signatures.test.ts   (existing)
│   └── ...
├── transfer/
│   ├── folder-transfer.test.ts      (existing)
│   ├── group-transfer-manager.test.ts (existing)
│   └── ...
├── security/
│   ├── csrf.test.ts                 (existing)
│   ├── key-rotation.test.ts         (existing)
│   └── ...
└── ...
```

### Integration Tests
```
tests/integration/
├── crypto-transfer/
├── signaling-webrtc/
├── storage-ui/
└── ...
```

### E2E Tests
```
tests/e2e/
├── landing.spec.ts
├── app.spec.ts
├── p2p-transfer.spec.ts
├── group-transfer.spec.ts
└── ...
```

## Test Coverage Summary

### Current Coverage (Implemented Modules)

```
Key Management:        100% (82 tests)
Peer Authentication:   100% (70 tests)
Triple Ratchet:        100% (52 tests)
Sparse PQ Ratchet:     100% (66 tests)

Total Crypto Layer:    270+ tests, 100% coverage
```

### Test Execution Times

```
Key Management:        ~8s
Peer Authentication:   ~6s
Triple Ratchet:        ~12s
Sparse PQ Ratchet:     ~10s

Total:                 ~36s
```

## Writing New Tests

### Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { YourModule } from '@/lib/path/to/module';

describe('YourModule', () => {
    beforeEach(() => {
        // Setup before each test
    });

    afterEach(() => {
        // Cleanup after each test
    });

    describe('Feature Group', () => {
        it('should do something specific', () => {
            // Arrange
            const input = setupInput();

            // Act
            const result = yourFunction(input);

            // Assert
            expect(result).toBe(expected);
        });
    });
});
```

### Common Patterns

#### Testing Async Operations
```typescript
it('should handle async operation', async () => {
    const result = await asyncFunction();
    expect(result).toBeDefined();
}, 30000); // 30s timeout for crypto operations
```

#### Testing Errors
```typescript
it('should throw error for invalid input', () => {
    expect(() => {
        functionThatThrows();
    }).toThrow('Expected error message');
});

// For async errors
it('should reject promise', async () => {
    await expect(
        asyncFunctionThatFails()
    ).rejects.toThrow();
});
```

#### Using Fake Timers
```typescript
it('should handle timeout', () => {
    vi.useFakeTimers();

    const callback = vi.fn();
    setTimeout(callback, 1000);

    vi.advanceTimersByTime(1000);

    expect(callback).toHaveBeenCalled();

    vi.useRealTimers();
});
```

#### Testing Crypto Operations
```typescript
it('should encrypt and decrypt', async () => {
    const plaintext = new TextEncoder().encode('test');
    const key = crypto.getRandomValues(new Uint8Array(32));

    const encrypted = await encrypt(plaintext, key);
    const decrypted = await decrypt(encrypted, key);

    expect(new TextDecoder().decode(decrypted)).toBe('test');
});
```

## Debugging Tests

### Run with Debugging
```bash
# Debug specific test
node --inspect-brk node_modules/vitest/dist/cli.js run tests/unit/crypto/key-management.test.ts

# Use debugger in test
it('should debug', () => {
    debugger; // Opens debugger
    expect(true).toBe(true);
});
```

### Verbose Output
```bash
# Run with reporter
npm run test:unit -- --reporter=verbose

# Show console logs
npm run test:unit -- --reporter=verbose --silent=false
```

### Isolate Failing Test
```typescript
// Run only this test
it.only('should test specific case', () => {
    // Test code
});

// Skip this test
it.skip('should skip this', () => {
    // Test code
});
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm test
```

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
npm run test:unit -- --run
```

## Coverage Thresholds

### Current Configuration (vitest.config.ts)
```typescript
coverage: {
    thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
    },
}
```

### Target Thresholds
```typescript
coverage: {
    thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
    },
}
```

## Common Issues and Solutions

### Issue: WASM Module Loading
**Problem:** `pqc-kyber` WASM module fails to load
**Solution:** Mock is configured in `vitest.config.ts` alias

### Issue: Fake Timers
**Problem:** Timers not advancing
**Solution:**
```typescript
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers(); // Always cleanup!
```

### Issue: Async Timeouts
**Problem:** Tests timeout on crypto operations
**Solution:** Increase timeout
```typescript
it('should encrypt', async () => {
    // Test code
}, 30000); // 30 second timeout
```

### Issue: IndexedDB Not Available
**Problem:** IndexedDB operations fail
**Solution:** Mock is configured in `tests/unit/setup.ts`

## Best Practices

### DO:
✅ Write descriptive test names
✅ Test one thing per test
✅ Use AAA pattern (Arrange, Act, Assert)
✅ Clean up resources in afterEach
✅ Test edge cases and errors
✅ Mock external dependencies
✅ Keep tests independent
✅ Use async/await for promises

### DON'T:
❌ Test implementation details
❌ Share state between tests
❌ Ignore flaky tests
❌ Skip cleanup
❌ Test multiple things in one test
❌ Use arbitrary timeouts
❌ Commit failing tests
❌ Ignore coverage drops

## Performance Tips

### Optimize Test Execution
```typescript
// Use beforeAll for expensive setup
beforeAll(async () => {
    // Expensive setup once
});

// Parallel execution
describe.concurrent('Parallel tests', () => {
    it.concurrent('test 1', async () => {});
    it.concurrent('test 2', async () => {});
});
```

### Reduce Test Time
```bash
# Run tests in parallel
npm run test:unit -- --threads

# Skip coverage for faster feedback
npm run test:unit -- --run

# Run only changed files
npm run test:unit -- --changed
```

## Useful Resources

### Documentation
- Vitest: https://vitest.dev/
- Testing Library: https://testing-library.com/
- Playwright: https://playwright.dev/

### Project Docs
- `COMPREHENSIVE_TEST_COVERAGE_PLAN.md` - Testing roadmap
- `TEST_COVERAGE_IMPLEMENTATION_REPORT.md` - Progress tracking
- `TEST_COVERAGE_FINAL_SUMMARY.md` - Complete summary
- `TESTING_QUICK_REFERENCE.md` - This guide

## Keyboard Shortcuts (Vitest UI)

```
r - Rerun tests
f - Filter tests
c - Clear console
q - Quit
? - Show help
```

## Contact

For questions or issues:
- Check existing tests for examples
- Review documentation files
- Consult test automation engineer

---

**Quick Start:**
```bash
# Install dependencies
npm install

# Run all unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage

# Run E2E tests
npm test
```

**Most Common Commands:**
```bash
npm run test:unit              # All unit tests
npm run test:crypto            # Crypto tests only
npm test                       # E2E tests
npm run test:unit -- --watch   # Watch mode
npm run test:unit -- --coverage # Coverage report
```

---

*Quick Reference Guide - Tallow Testing*
*Updated: 2026-01-27*
