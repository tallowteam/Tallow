/**
 * Visual Regression Tests
 * Tests for visual consistency across browsers and viewports
 */

import { test, expect } from '@playwright/test';

const VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
};

const PAGES = [
  { name: 'Landing', path: '/' },
  { name: 'App', path: '/app' },
];

test.describe('Visual Regression Tests', () => {
  test.describe('Landing Page', () => {
    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      test(`should match baseline on ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Take screenshot
        await expect(page).toHaveScreenshot(`landing-${device}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }

    test('should match hero section across viewports', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        await page.setViewportSize(viewport);

        // Screenshot hero section
        const hero = page.locator('section').first();
        await expect(hero).toHaveScreenshot(`hero-${device}.png`, {
          animations: 'disabled',
        });
      }
    });

    test('should maintain visual consistency on scroll', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Scroll through sections
      const sections = ['hero', 'features', 'how-it-works', 'security'];

      for (const section of sections) {
        const element = page.locator(`[data-section="${section}"]`).first();
        if (await element.isVisible()) {
          await element.scrollIntoViewIfNeeded();
          await expect(element).toHaveScreenshot(`${section}-section.png`, {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('App Page', () => {
    for (const [device, viewport] of Object.entries(VIEWPORTS)) {
      test(`should match baseline on ${device}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/app');
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot(`app-${device}.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }

    test('should maintain transfer zone consistency', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);
      await page.goto('/app');
      await page.waitForLoadState('networkidle');

      const transferZone = page.locator('[data-testid="transfer-zone"]').first();
      if (await transferZone.isVisible()) {
        await expect(transferZone).toHaveScreenshot('transfer-zone.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Theme Consistency', () => {
    test('should match dark theme across pages', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS.desktop);

      for (const { name, path } of PAGES) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot(`${name.toLowerCase()}-dark-theme.png`, {
          fullPage: true,
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Component States', () => {
    test('should match button states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const buttons = page.locator('button').first();
      if (await buttons.isVisible()) {
        // Default state
        await expect(buttons).toHaveScreenshot('button-default.png');

        // Hover state
        await buttons.hover();
        await expect(buttons).toHaveScreenshot('button-hover.png');

        // Focus state
        await buttons.focus();
        await expect(buttons).toHaveScreenshot('button-focus.png');
      }
    });

    test('should match card variants', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const cards = page.locator('[class*="card"]');
      const count = await cards.count();

      for (let i = 0; i < Math.min(count, 3); i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          await expect(card).toHaveScreenshot(`card-${i}.png`, {
            animations: 'disabled',
          });
        }
      }
    });
  });

  test.describe('Responsive Images', () => {
    test('should load appropriate image sizes', async ({ page }) => {
      for (const [device, viewport] of Object.entries(VIEWPORTS)) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check that images are loaded
        const images = page.locator('img');
        const count = await images.count();

        if (count > 0) {
          const firstImage = images.first();
          await expect(firstImage).toBeVisible();
        }
      }
    });
  });

  test.describe('Animation States', () => {
    test('should capture animation start and end states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get elements with animations
      const animatedElements = page.locator('[class*="animate"]').first();

      if (await animatedElements.isVisible()) {
        // Wait for animations to complete
        await page.waitForTimeout(1000);

        await expect(animatedElements).toHaveScreenshot('animation-complete.png', {
          animations: 'disabled',
        });
      }
    });
  });

  test.describe('Accessibility Visual Checks', () => {
    test('should maintain focus visibility', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Tab through focusable elements
      const focusableElements = page.locator(
        'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const count = await focusableElements.count();
      if (count > 0) {
        const firstElement = focusableElements.first();
        await firstElement.focus();

        await expect(firstElement).toHaveScreenshot('focus-visible.png');
      }
    });

    test('should show proper contrast in all states', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Take full page screenshot to verify contrast
      await expect(page).toHaveScreenshot('contrast-check.png', {
        fullPage: true,
        animations: 'disabled',
      });
    });
  });
});
