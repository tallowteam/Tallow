import { test, expect, Page } from '@playwright/test';

/**
 * Disable all CSS animations and transitions to ensure deterministic screenshots.
 * This injects a style tag that overrides all animation/transition properties.
 */
async function disableAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-fill-mode: forwards !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  // Wait a tick for styles to apply
  await page.waitForTimeout(100);
}

test.describe('Visual Regression', () => {
  test('landing page - light mode', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('landing-light.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('landing page - dark mode', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('landing-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('app page - light mode', async ({ page }) => {
    await page.goto('/app');
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('app-light.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('app page - dark mode', async ({ page }) => {
    await page.goto('/app');
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('app-dark.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('landing page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('landing-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });

  test('app page - mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/app');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('app-mobile.png', {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
});
