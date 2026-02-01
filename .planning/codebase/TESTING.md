# Testing Patterns

**Analysis Date:** 2026-01-23

## Test Framework

**Unit Testing:**
- Framework: Vitest 4.0.18
- Config file: `vitest.config.ts`
- Environment: Node.js
- Test files pattern: `tests/unit/**/*.test.ts`

**E2E Testing:**
- Framework: Playwright 1.58.0
- Config file: `playwright.config.ts`
- Test files pattern: `tests/e2e/**/*.spec.ts`
- Multiple browsers: Chromium, Firefox, Mobile (Pixel 5)

**Run Commands:**
```bash
npm run test:unit          # Run all unit tests with Vitest
npm run test:crypto        # Run crypto-specific unit tests
npm run test               # Run Playwright E2E tests
npm run test:ui            # Run Playwright tests with UI
npm run test:headed        # Run Playwright tests with headed browser (visible)
```

**Coverage:**
- Provider: v8 (via @vitest/coverage-v8)
- Scope: `lib/crypto/**` directory only
- Configuration in `vitest.config.ts`: coverage.include
- Run: `npm run test:unit -- --coverage`

## Vitest Configuration

**Setup:**
- Entry: `tests/unit/setup.ts`
- Purpose: Polyfill browser globals for WASM module (`pqc-kyber`)
- Polyfills:
  - `globalThis.self` (browser global required by WASM)
  - `globalThis.crypto` (Node.js 18+ has webcrypto)

**Setup File Content:**
```typescript
if (typeof globalThis.self === 'undefined') {
  (globalThis as any).self = globalThis;
}
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}
```

**Path Aliases:**
- `@/` maps to project root (same as tsconfig.json)
- Mock alias: `pqc-kyber` → `tests/unit/__mocks__/pqc-kyber.ts`

## Test File Organization

**Location:**
- Unit tests: `tests/unit/crypto/` (organized by module)
- E2E tests: `tests/e2e/` (organized by page/feature)
- Mocks: `tests/unit/__mocks__/` (with same structure as source)
- Setup: `tests/unit/setup.ts` (shared configuration)

**Naming:**
- Unit: `{module}.test.ts` (e.g., `pqc-crypto.test.ts`, `file-encryption.test.ts`)
- E2E: `{page}.spec.ts` (e.g., `app.spec.ts`, `landing.spec.ts`)
- Mocks: Module name with `.ts` (e.g., `pqc-kyber.ts`)

## Unit Test Structure

**Test Suite Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { ModuleToTest } from '@/lib/...';

const instance = ModuleToTest.getInstance(); // or direct import

describe('Module Name', () => {
  describe('FEATURE-ID: Feature Description', () => {
    it('does something specific', async () => {
      // Arrange
      const input = ...;

      // Act
      const result = await instance.method(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

**Actual Example - PQC Crypto Tests:**
```typescript
describe('PQC Crypto Service', () => {
  describe('CRYPTO-01: Key Generation', () => {
    it('generates a valid hybrid key pair', async () => {
      const keyPair = await crypto.generateHybridKeypair();

      expect(keyPair.kyber.publicKey).toBeInstanceOf(Uint8Array);
      expect(keyPair.kyber.publicKey.length).toBe(1184);
    });

    it('generates unique key pairs each time', async () => {
      const kp1 = await crypto.generateHybridKeypair();
      const kp2 = await crypto.generateHybridKeypair();

      expect(kp1.kyber.publicKey).not.toEqual(kp2.kyber.publicKey);
    });
  });
});
```

**Async Testing Pattern:**
```typescript
// Mark test as async
it('performs async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// Error testing
await expect(crypto.decrypt(encrypted, wrongKey)).rejects.toThrow();
```

## Assertion Patterns

**Vitest Assertions:**
- Type checking: `expect(value).toBeInstanceOf(Uint8Array)`
- Equality: `expect(actual).toEqual(expected)` (deep equality)
- Exact match: `expect(value).toBe(exact)` (strict equality)
- Truthiness: `expect(bool).toBe(true)`, `toBeFalsy()`
- Negation: `expect(a).not.toEqual(b)`
- Length checks: `expect(array.length).toBe(32)`
- Array containment: `expect(array).toContain(item)`
- Error assertions: `expect(() => fn()).toThrow()`
- Async error: `await expect(asyncFn()).rejects.toThrow('message')`

## Mocking Patterns

**Test Double Strategy:**
- Mocks used for external WASM modules that require browser runtime
- Real crypto functions tested where possible, mocked where requires browser

**Mocking pqc-kyber WASM Module:**
Located in `tests/unit/__mocks__/pqc-kyber.ts`:

```typescript
// Deterministic key generation
export function keypair() {
  const pubkey = new Uint8Array(KYBER_PK_LEN);
  const secret = new Uint8Array(KYBER_SK_LEN);
  webcrypto.getRandomValues(pubkey);
  webcrypto.getRandomValues(secret);

  // Store relationship: secret -> public
  secretToPub.set(hash(secret), pubkey);
  return { pubkey, secret };
}

// Deterministic encapsulation
export function encapsulate(publicKey: Uint8Array) {
  const ciphertext = new Uint8Array(KYBER_CT_LEN);
  const sharedSecret = new Uint8Array(KYBER_SS_LEN);

  webcrypto.getRandomValues(ciphertext);
  webcrypto.getRandomValues(sharedSecret);

  // Store lookup: ciphertext + pubkey -> secret
  ctToSecret.set(lookupKey, sharedSecret);
  return { ciphertext, sharedSecret };
}

// Deterministic decapsulation
export function decapsulate(ciphertext: Uint8Array, secretKey: Uint8Array) {
  // Recover matching public key and lookup shared secret
  const pubkey = secretToPub.get(hash(secretKey));
  const lookupKey = hash(ciphertext) + ':' + hash(pubkey);
  return ctToSecret.get(lookupKey);
}
```

**What to Mock:**
- WASM modules requiring browser runtime
- File system APIs when testing file encryption

**What NOT to Mock:**
- Crypto operations themselves (they use Web Crypto API available in Node)
- Hash functions (@noble/hashes)
- Core business logic
- Database/storage operations

**Mock File Creation:**
```typescript
function createMockFile(content: Uint8Array, name: string, type: string): File {
  const buffer = new ArrayBuffer(content.byteLength);
  new Uint8Array(buffer).set(content);
  const blob = new Blob([buffer], { type });
  return new File([blob], name, { type });
}
```

## Test Coverage Patterns

**Crypto Module Coverage (Primary Focus):**
- Key Generation (CRYPTO-01): multiple keypairs, unique generation
- Key Exchange (CRYPTO-02): encapsulate/decapsulate, wrong key detection
- Encryption (CRYPTO-03): roundtrip data preservation, nonce randomness, AAD support
- Session Keys (CRYPTO-04): deterministic derivation, key size validation
- Hashing/MAC (CRYPTO-05): consistent hashing, MAC operations
- Constant-Time Comparison (CRYPTO-06): equality tests, length handling

**File Encryption Coverage:**
- Roundtrip preservation (FILE-01)
- Chunk integrity verification (FILE-02)
- Filename privacy (FILE-03)
- MIME categorization (FILE-04)

**Test Data:**
```typescript
// Small data
const plaintext = new TextEncoder().encode('Hello, world!');

// Large data (multi-chunk)
const content = new Uint8Array(nodeRandomBytes(200_000));

// Random keys
const key = crypto.randomBytes(32);
```

## E2E Test Structure

**Playwright Configuration:**
```typescript
// From playwright.config.ts
{
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
}
```

**E2E Test Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/route');
  });

  test('user can perform action', async ({ page }) => {
    // Interact
    await page.getByRole('button', { name: /label/i }).click();

    // Assert
    await expect(page.getByText(/success/i)).toBeVisible();
  });
});
```

**Actual Example - Landing Page Tests:**
```typescript
test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with headline and CTA', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('renders features section', async ({ page }) => {
    const features = page.locator('.card-feature');
    await expect(features.first()).toBeVisible();
    await expect(features).toHaveCount(7);
  });

  test('hero CTA navigates to app', async ({ page }) => {
    const ctaLink = page.getByRole('link', { name: /get started/i }).first();
    const href = await ctaLink.getAttribute('href');
    expect(href).toBe('/app');
    await page.goto('/app');
    await expect(page).toHaveURL(/\/app/);
  });
});
```

## E2E Locator Strategies

**Recommended Order:**
1. Role-based: `getByRole('button', { name: /label/i })`
2. Text content: `getByText(/pattern/i)`
3. Label text: `getByLabel('Label Text')`
4. Test IDs (when needed): `getByTestId('id')`
5. Placeholder: `getByPlaceholder('placeholder text')`
6. CSS selector: `locator('selector')` (last resort)

**Examples from Codebase:**
```typescript
// Role-based
await page.getByRole('link', { name: /get started/i }).click();
await page.getByRole('button', { name: /features/i });

// Text content
await expect(page.getByText(/send/i).first()).toBeVisible();
await page.getByText(/local network/i).first().click();

// CSS selectors (for custom patterns)
const features = page.locator('.card-feature');
const securitySection = page.locator('.section-dark');
```

## Visual Regression Testing

**Pattern - Playwright Visual Tests:**
```typescript
async function prepareForScreenshot(page: Page) {
  // Wait for fonts
  await page.evaluate(() => document.fonts.ready);

  // Disable all CSS animations
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
      }
    `,
  });

  // Let layout settle
  await page.waitForTimeout(300);
}

test('landing page - light mode', async ({ page }) => {
  await page.goto('/');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.waitForLoadState('networkidle');
  await prepareForScreenshot(page);

  await expect(page).toHaveScreenshot('landing-light.png', {
    maxDiffPixelRatio: 0.02,
    animations: 'disabled',
  });
});
```

**Configuration:**
- `maxDiffPixelRatio: 0.02` - allows 2% pixel difference
- `animations: 'disabled'` - Playwright disables animations
- Screenshots captured across: chromium, firefox, mobile
- Snapshots stored in: `tests/e2e/visual/screenshots.spec.ts-snapshots/`

## Responsive Testing

**E2E Viewport Testing:**
```typescript
// Mobile viewport
test('app page - mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 }); // Pixel 5
  await page.goto('/app');
  await expect(page.locator('main')).toBeVisible();
});

// Desktop - implicit default
test('feature visible on desktop', async ({ page }) => {
  await expect(page.locator('nav').getByRole('link')).toBeVisible();
});
```

**Playwright Browser Projects:**
- Chromium: Desktop Chrome
- Firefox: Desktop Firefox
- Mobile: Pixel 5 (375x812)
- Tests run across all projects (cross-browser)

## Common Test Patterns

**Setup and Teardown:**
```typescript
// Playwright
test.beforeEach(async ({ page }) => {
  await page.goto('/route');
});

test.afterEach(async ({ page }) => {
  // Clean up if needed (usually automatic)
});

// Vitest
import { beforeEach, afterEach } from 'vitest';
beforeEach(() => { /* setup */ });
afterEach(() => { /* cleanup */ });
```

**State Testing:**
```typescript
// Testing component state changes
it('updates on user interaction', async ({ page }) => {
  const button = page.getByRole('button', { name: /toggle/i });
  await expect(button).toHaveAttribute('aria-pressed', 'false');

  await button.click();

  await expect(button).toHaveAttribute('aria-pressed', 'true');
});
```

**Error Recovery:**
```typescript
// Test error handling
it('handles network error gracefully', async ({ page }) => {
  await page.route('**/api/**', route => route.abort());
  await page.goto('/app');

  await expect(page.getByText(/error/i)).toBeVisible();
});
```

**Conditional Logic in Tests:**
```typescript
test('renders features based on device type', async ({ page, isMobile }) => {
  if (!isMobile) {
    // Desktop-only navigation links
    await expect(page.locator('nav').getByRole('link', { name: /features/i })).toBeVisible();
  }
});
```

## Test Maintenance

**Flaky Test Handling:**
- E2E tests configured with retries: 2 on CI, 0 locally
- Wait strategies: `page.waitForLoadState('networkidle')`
- Explicit waits: `page.waitForTimeout(300)` for layout settling
- Polling: `expect(...).toBeVisible()` auto-retries with default timeout

**Visual Regression Updates:**
```bash
# Update snapshots when intentional changes made
npx playwright test --update-snapshots
```

**Debugging E2E Tests:**
```bash
# UI mode - step through tests
npm run test:ui

# Headed mode - see browser
npm run test:headed

# Trace capture - full test replay
# Enable in playwright.config.ts: trace: 'on-first-retry'
```

---

*Testing analysis: 2026-01-23*
