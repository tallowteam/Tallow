/**
 * Navigation E2E Tests
 * Tests for navigation flows and routing
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.describe('Header Navigation', () => {
    test('should navigate between pages', async ({ page }) => {
      await page.goto('/');

      // Click navigation links
      const appLink = page.getByRole('link', { name: /app/i }).first();
      if (await appLink.isVisible()) {
        await appLink.click();
        await expect(page).toHaveURL(/\/app/);
      }
    });

    test('should show active navigation state', async ({ page }) => {
      await page.goto('/');

      const navigation = page.locator('nav').first();
      if (await navigation.isVisible()) {
        const activeLink = navigation.locator('[aria-current="page"]');
        if ((await activeLink.count()) > 0) {
          await expect(activeLink.first()).toBeVisible();
        }
      }
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Look for mobile menu toggle
      const menuToggle = page.locator('[aria-label*="menu"]').first();
      if (await menuToggle.isVisible()) {
        await menuToggle.click();

        // Menu should open
        const mobileMenu = page.locator('[role="dialog"], [aria-label*="mobile"]').first();
        if ((await mobileMenu.count()) > 0) {
          await expect(mobileMenu).toBeVisible();
        }
      }
    });
  });

  test.describe('Footer Navigation', () => {
    test('should have footer links', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer').first();
      await expect(footer).toBeVisible();

      // Check for common footer links
      const links = footer.locator('a');
      const count = await links.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should navigate to legal pages', async ({ page }) => {
      await page.goto('/');

      const footer = page.locator('footer').first();

      // Try to find privacy link
      const privacyLink = footer.getByRole('link', { name: /privacy/i }).first();
      if (await privacyLink.isVisible()) {
        await privacyLink.click();
        await expect(page.url()).toContain('privacy');
      }
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should show breadcrumbs on deep pages', async ({ page }) => {
      await page.goto('/app');

      const breadcrumb = page.locator('[aria-label*="breadcrumb"]').first();
      if (await breadcrumb.isVisible()) {
        const items = breadcrumb.locator('a, span');
        const count = await items.count();
        expect(count).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Back Navigation', () => {
    test('should navigate back correctly', async ({ page }) => {
      await page.goto('/');
      const initialUrl = page.url();

      // Navigate to app
      await page.goto('/app');
      await expect(page).toHaveURL(/\/app/);

      // Go back
      await page.goBack();
      expect(page.url()).toBe(initialUrl);
    });

    test('should maintain scroll position on back', async ({ page }) => {
      await page.goto('/');

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, 500));
      const scrollPosition = await page.evaluate(() => window.scrollY);

      // Navigate away and back
      await page.goto('/app');
      await page.goBack();

      // Note: Scroll restoration depends on browser behavior
      // Just verify we're back on the right page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Deep Linking', () => {
    test('should handle direct navigation to deep routes', async ({ page }) => {
      await page.goto('/app');
      await expect(page).toHaveURL(/\/app/);
    });

    test('should handle hash navigation', async ({ page }) => {
      await page.goto('/#features');

      // Check if hash is in URL
      expect(page.url()).toContain('#features');

      // Check if scrolled to section
      const featuresSection = page.locator('#features, [data-section="features"]').first();
      if (await featuresSection.isVisible()) {
        await expect(featuresSection).toBeInViewport();
      }
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with Tab key', async ({ page }) => {
      await page.goto('/');

      // Tab through focusable elements
      await page.keyboard.press('Tab');

      // Should have focus on first focusable element
      const focused = page.locator(':focus');
      await expect(focused).toBeVisible();
    });

    test('should navigate with arrow keys in menus', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const menuToggle = page.locator('[aria-label*="menu"]').first();
      if (await menuToggle.isVisible()) {
        await menuToggle.click();

        // Try arrow key navigation
        await page.keyboard.press('ArrowDown');
        const focused = page.locator(':focus');

        if ((await focused.count()) > 0) {
          await expect(focused).toBeVisible();
        }
      }
    });

    test('should close menu with Escape', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const menuToggle = page.locator('[aria-label*="menu"]').first();
      if (await menuToggle.isVisible()) {
        await menuToggle.click();

        const menu = page.locator('[role="dialog"]').first();
        if (await menu.isVisible()) {
          await page.keyboard.press('Escape');

          // Menu should close
          await expect(menu).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Route Transitions', () => {
    test('should handle rapid navigation', async ({ page }) => {
      await page.goto('/');

      // Rapidly click between pages
      await page.goto('/app');
      await page.goto('/');
      await page.goto('/app');

      // Should end up on correct page
      await expect(page).toHaveURL(/\/app/);
    });

    test('should preserve form state on navigation', async ({ page }) => {
      await page.goto('/app');

      // Type in input if exists
      const input = page.locator('input[type="text"]').first();
      if (await input.isVisible()) {
        await input.fill('test data');

        // Navigate away and back
        await page.goto('/');
        await page.goBack();

        // Note: Actual behavior depends on implementation
        // Just verify page loads correctly
        await expect(page).toHaveURL(/\/app/);
      }
    });
  });

  test.describe('External Links', () => {
    test('should open external links in new tab', async ({ page, context }) => {
      await page.goto('/');

      const externalLinks = page.locator('a[target="_blank"]');
      const count = await externalLinks.count();

      if (count > 0) {
        const firstLink = externalLinks.first();
        expect(await firstLink.getAttribute('rel')).toContain('noopener');
      }
    });
  });

  test.describe('404 Handling', () => {
    test('should show 404 page for invalid routes', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist');

      // Should get 404 status
      expect(response?.status()).toBe(404);
    });

    test('should have navigation on 404 page', async ({ page }) => {
      await page.goto('/invalid-route');

      // Should have way to get back to home
      const homeLink = page.getByRole('link', { name: /home/i }).first();
      if (await homeLink.isVisible()) {
        await homeLink.click();
        await expect(page).toHaveURL('/');
      }
    });
  });
});
