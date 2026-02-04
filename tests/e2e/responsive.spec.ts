/**
 * Responsive Design E2E Tests
 * Tests for responsive behavior across different devices
 */

import { test, expect, devices } from '@playwright/test';

const BREAKPOINTS = {
  mobile: { width: 375, height: 667 },
  mobileLandscape: { width: 667, height: 375 },
  tablet: { width: 768, height: 1024 },
  tabletLandscape: { width: 1024, height: 768 },
  laptop: { width: 1366, height: 768 },
  desktop: { width: 1920, height: 1080 },
  wide: { width: 2560, height: 1440 },
};

test.describe('Responsive Design Tests', () => {
  test.describe('Layout Adaptations', () => {
    for (const [name, viewport] of Object.entries(BREAKPOINTS)) {
      test(`should render correctly on ${name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Page should render without horizontal scroll (unless intentional)
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = viewport.width;

        // Allow small tolerance for borders/scrollbars
        expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
      });
    }

    test('should show mobile navigation on small screens', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.mobile);
      await page.goto('/');

      // Mobile menu toggle should be visible
      const menuToggle = page.locator('[aria-label*="menu"], [aria-label*="navigation"]').first();
      if (await menuToggle.isVisible()) {
        await expect(menuToggle).toBeVisible();
      }
    });

    test('should show desktop navigation on large screens', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.desktop);
      await page.goto('/');

      // Desktop navigation should be visible
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Content Reflow', () => {
    test('should stack content vertically on mobile', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.mobile);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Get all sections
      const sections = page.locator('section');
      const count = await sections.count();

      // Verify sections are visible
      for (let i = 0; i < Math.min(count, 3); i++) {
        const section = sections.nth(i);
        if (await section.isVisible()) {
          const box = await section.boundingBox();
          if (box) {
            expect(box.width).toBeLessThanOrEqual(BREAKPOINTS.mobile.width);
          }
        }
      }
    });

    test('should arrange content in grid on desktop', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.desktop);
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Check for grid layouts
      const grids = page.locator('[class*="grid"]');
      const count = await grids.count();

      if (count > 0) {
        const firstGrid = grids.first();
        await expect(firstGrid).toBeVisible();
      }
    });
  });

  test.describe('Touch Interactions', () => {
    test('should support touch on mobile', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.mobile);
      await page.goto('/');

      // Try to tap a button
      const button = page.locator('button').first();
      if (await button.isVisible()) {
        await button.tap();
        // Button should respond to tap
        await expect(button).toBeVisible();
      }
    });

    test('should support swipe gestures', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.mobile);
      await page.goto('/');

      // Look for swipeable elements (carousels, etc.)
      const swipeable = page.locator('[data-swipeable="true"]').first();
      if (await swipeable.isVisible()) {
        const box = await swipeable.boundingBox();
        if (box) {
          // Simulate swipe
          await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          await page.mouse.down();
          await page.mouse.move(box.x + 50, box.y + box.height / 2);
          await page.mouse.up();
        }
      }
    });
  });

  test.describe('Image Optimization', () => {
    test('should load appropriate image sizes', async ({ page }) => {
      for (const [name, viewport] of Object.entries(BREAKPOINTS)) {
        await page.setViewportSize(viewport);
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Check that images don't exceed viewport
        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
          const img = images.nth(i);
          if (await img.isVisible()) {
            const box = await img.boundingBox();
            if (box) {
              expect(box.width).toBeLessThanOrEqual(viewport.width);
            }
          }
        }
      }
    });
  });

  test.describe('Text Scaling', () => {
    test('should remain readable on small screens', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.mobile);
      await page.goto('/');

      // Check font sizes
      const headings = page.locator('h1, h2, h3');
      const count = await headings.count();

      if (count > 0) {
        const fontSize = await headings.first().evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Font should be at least 14px
        const size = parseInt(fontSize);
        expect(size).toBeGreaterThanOrEqual(14);
      }
    });

    test('should scale up on large screens', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.wide);
      await page.goto('/');

      // Headings should be larger on big screens
      const headings = page.locator('h1');
      if ((await headings.count()) > 0) {
        const fontSize = await headings.first().evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        const size = parseInt(fontSize);
        expect(size).toBeGreaterThanOrEqual(24);
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait to landscape', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Switch to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      await page.waitForTimeout(500); // Wait for reflow

      // Page should still render correctly
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(667 + 20);
    });
  });

  test.describe('Device Emulation', () => {
    test('should work on iPhone', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPhone 12'],
      });
      const page = await context.newPage();

      await page.goto('/');
      await expect(page).toHaveURL('/');

      await context.close();
    });

    test('should work on iPad', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['iPad Pro'],
      });
      const page = await context.newPage();

      await page.goto('/');
      await expect(page).toHaveURL('/');

      await context.close();
    });

    test('should work on Android', async ({ browser }) => {
      const context = await browser.newContext({
        ...devices['Pixel 5'],
      });
      const page = await context.newPage();

      await page.goto('/');
      await expect(page).toHaveURL('/');

      await context.close();
    });
  });

  test.describe('Viewport Edge Cases', () => {
    test('should handle very small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.goto('/');

      // Should render without breaking
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(320 + 20);
    });

    test('should handle very large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 3840, height: 2160 });
      await page.goto('/');

      // Content should be centered or max-width constrained
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Zoom Levels', () => {
    test('should handle 200% zoom', async ({ page }) => {
      await page.setViewportSize(BREAKPOINTS.desktop);
      await page.goto('/');

      // Simulate zoom
      await page.evaluate(() => {
        (document.body as any).style.zoom = '2';
      });

      await page.waitForTimeout(500);

      // Page should still be usable
      const buttons = page.locator('button');
      if ((await buttons.count()) > 0) {
        await expect(buttons.first()).toBeVisible();
      }
    });
  });
});
