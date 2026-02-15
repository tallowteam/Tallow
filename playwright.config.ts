import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env['CI'];
const shouldReuseServer = process.env['PW_REUSE_SERVER'] === '1';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: !isCI, // Disable parallel in CI to reduce server load
  forbidOnly: isCI,
  retries: isCI ? 2 : 1, // At least 1 retry locally for flaky tests
  // Reduce workers to prevent overwhelming dev server
  workers: isCI ? 1 : 2,
  // Increase test timeout to handle slower resource loading
  timeout: 90000, // 90 seconds per test
  reporter: [
    ['html', { open: 'never' }],
    ['list'], // Show test results in console
  ],
  // Set expect timeout
  expect: {
    timeout: 15000, // 15 seconds for assertions
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03, // Allow 3% pixel difference for visual tests
    },
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Increase navigation timeout for slower page loads
    navigationTimeout: 60000, // 60 seconds
    // Increase action timeout
    actionTimeout: 20000, // 20 seconds
    // Screenshot on failure
    screenshot: 'only-on-failure',
    // Video on failure
    video: 'retain-on-failure',
    // Viewport
    viewport: { width: 1280, height: 720 },
    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'edge',
      use: {
        ...devices['Desktop Edge'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'desktop-large',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        serviceWorkers: 'allow',
      },
    },
    {
      name: 'desktop-small',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1024, height: 768 },
        serviceWorkers: 'allow',
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    // Avoid accidentally reusing a stale/non-dev server on :3000.
    // Opt in locally with PW_REUSE_SERVER=1 when needed.
    reuseExistingServer: !isCI && shouldReuseServer,
    timeout: 180000, // 3 minutes for server to start (increased from 2 minutes)
    stdout: 'pipe', // Capture server output
    stderr: 'pipe',
    // Add environment variables for better dev server performance
    env: {
      NODE_ENV: 'development',
      // Increase Node.js memory limit
      NODE_OPTIONS: '--max-old-space-size=4096',
    },
  },
  // Retry failed tests
  ...(isCI && { maxFailures: 10 }),
});
