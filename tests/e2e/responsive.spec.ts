import { test, expect } from './fixtures';

test.describe('Responsive Design', () => {
  test.describe('Minimum Mobile Viewport (320px)', () => {
    test.use({ viewport: { width: 320, height: 568 } });

    test('should render key pages without horizontal overflow at 320px', async ({ page }) => {
      const routes = ['/', '/transfer', '/settings'];

      for (const route of routes) {
        await page.goto(route);
        const overflowWidth = await page.evaluate(() => document.documentElement.scrollWidth);
        expect(overflowWidth).toBeLessThanOrEqual(320);
      }
    });

    test('should expose touch targets at 44px or larger on core actions', async ({ page }) => {
      await page.goto('/transfer');

      const targets = [
        page.getByRole('button', { name: /Select Local Network mode/i }),
        page.getByRole('button', { name: /Select Internet P2P mode/i }),
      ];

      for (const target of targets) {
        await expect(target).toBeVisible();
        const box = await target.boundingBox();
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

  });

  test.describe('Mobile Viewport (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display homepage correctly on mobile', async ({ page }) => {
      await page.goto('/');

      // Header should be visible
      await expect(page.locator('header')).toBeVisible();

      // Logo should be visible
      await expect(page.locator('a[href="/"]').first()).toBeVisible();

      // Mobile menu button should be visible
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      await expect(menuButton).toBeVisible();

      // Hero content should be visible
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate via mobile menu', async ({ page }) => {
      await page.goto('/');

      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      const mobileMenu = page.getByRole('dialog', { name: /navigation menu/i });
      await expect(menuButton).toBeVisible();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      await menuButton.click();
      await expect(menuButton).toHaveAttribute('aria-expanded', 'true', { timeout: 15000 });
      await expect(mobileMenu).toBeVisible();

      // Activate link in mobile menu
      const featuresLink = mobileMenu.getByRole('link', { name: /features/i }).first();
      await expect(featuresLink).toBeVisible();
      await featuresLink.click();

      // Check navigation
      await expect(page).toHaveURL(/\/features/);
    });

    test('should display transfer page correctly on mobile', async ({ page }) => {
      await page.goto('/transfer');

      // Page should load
      await expect(page.locator('h1')).toContainText(/Choose your transfer mode/i);

      // Mode cards should be visible
      const localMode = page.getByRole('button', { name: /Select Local Network mode/i });
      const internetMode = page.getByRole('button', { name: /Select Internet P2P mode/i });
      await expect(localMode).toBeVisible();
      await expect(internetMode).toBeVisible();

      // Card width should stay within mobile viewport
      const box = await localMode.boundingBox();
      expect(box?.width).toBeLessThanOrEqual(375);
    });

    test('should display settings page correctly on mobile', async ({ page }) => {
      await page.goto('/settings');

      // Settings should load
      await expect(page.locator('h1')).toBeVisible();

      // Cards should stack vertically
      const cards = page.locator('[class*="card"]');
      const firstCard = cards.first();
      const secondCard = cards.nth(1);

      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();

      // Second card should be below first card (vertical stacking)
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    });

    test('should have readable font sizes on mobile', async ({ page }) => {
      await page.goto('/');

      const heading = page.locator('h1').first();
      const fontSize = await heading.evaluate((el) => {
        return window.getComputedStyle(el).fontSize;
      });

      // Font size should be at least 24px for h1 on mobile
      const size = parseFloat(fontSize);
      expect(size).toBeGreaterThanOrEqual(24);
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/transfer');

      const button = page.locator('button').first();
      const box = await button.boundingBox();

      // Buttons should be at least 44px tall (Apple HIG recommendation)
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display homepage correctly on tablet', async ({ page }) => {
      await page.goto('/');

      // Header should be visible
      await expect(page.locator('header')).toBeVisible();
      await expect(page.locator('h1').first()).toBeVisible();

      // Main content should use available space
      const mainContent = page.locator('#main-content');
      const box = await mainContent.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.width).toBeLessThanOrEqual(768 + 1);
      }
    });

    test('should show desktop or mobile nav based on breakpoint', async ({ page }) => {
      await page.goto('/');

      // Check which nav is visible
      const desktopNav = page.locator('nav[aria-label="Main navigation"]');
      const mobileMenuButton = page.getByRole('button', { name: /toggle menu/i });

      const hasDesktopNav = await desktopNav.isVisible().catch(() => false);
      const hasMobileButton = await mobileMenuButton.isVisible().catch(() => false);

      // One or the other should be visible
      expect(hasDesktopNav || hasMobileButton).toBeTruthy();
    });

    test('should display transfer page with optimal layout', async ({ page }) => {
      await page.goto('/transfer');

      // Page should load
      await expect(page.locator('h1')).toContainText(/Choose your transfer mode/i);

      // Mode selector cards should use good width
      const localMode = page.getByRole('button', { name: /Select Local Network mode/i });
      const box = await localMode.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(250);
        expect(box.width).toBeLessThanOrEqual(768);
      }
    });

    test('should display settings in two columns if designed', async ({ page }) => {
      await page.goto('/settings');

      await expect(page.locator('h1')).toBeVisible();

      // Settings cards should be visible
      const cards = page.locator('[class*="card"]');
      await expect(cards.first()).toBeVisible();
    });
  });

  test.describe('Desktop Viewport (1280px)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should display homepage correctly on desktop', async ({ page }) => {
      await page.goto('/');

      // Desktop nav should be visible
      const desktopNav = page.locator('nav[aria-label="Main navigation"]');
      await expect(desktopNav).toBeVisible();

      // Mobile menu button should be hidden
      const mobileButton = page.getByRole('button', { name: /toggle menu/i });
      await expect(mobileButton).toBeHidden();

      // Content should be well-spaced
      const mainContent = page.locator('#main-content');
      const box = await mainContent.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(768);
      }
    });

    test('should show all navigation links in header', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('a[href="/features"]').first()).toBeVisible();
      await expect(page.locator('a[href="/how-it-works"]').first()).toBeVisible();
      await expect(page.locator('a[href="/docs"]').first()).toBeVisible();
      await expect(page.locator('a[href="/about"]').first()).toBeVisible();
    });

    test('should display transfer page with full-width layout', async ({ page }) => {
      await page.goto('/transfer');

      // Check main content area
      const mainContent = page.locator('main').or(
        page.locator('[class*="main"]')
      ).first();

      const box = await mainContent.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(900);
      }
    });

    test('should display settings with optimal spacing', async ({ page }) => {
      await page.goto('/settings');

      // Sections should stack with vertical separation
      const firstSection = page.locator('section').first();
      const secondSection = page.locator('section').nth(1);

      await expect(firstSection).toBeVisible();
      await expect(secondSection).toBeVisible();

      const firstBox = await firstSection.boundingBox();
      const secondBox = await secondSection.boundingBox();

      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y);
      }
    });
  });

  test.describe('Header Collapse Behavior', () => {
    test('should collapse header on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile menu button should be visible
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      const isVisible = await menuButton.isVisible();

      expect(isVisible).toBeTruthy();
    });

    test('should show full header on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // All nav links should be visible
      await expect(page.locator('nav a[href="/features"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/how-it-works"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/about"]').first()).toBeVisible();
    });
  });

  test.describe('Layout Adaptation', () => {
    test('should adapt from mobile to desktop layout', async ({ page }) => {
      // Start mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile menu should be visible
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      await expect(menuButton).toBeVisible();

      // Resize to desktop
      await page.setViewportSize({ width: 1280, height: 720 });

      // Wait for layout to adapt
      await page.waitForTimeout(500);

      // Desktop nav should now be visible
      const desktopNav = page.locator('nav a[href="/features"]').first();
      await expect(desktopNav).toBeVisible();
    });

    test('should adapt from desktop to mobile layout', async ({ page }) => {
      // Start desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // Desktop nav should be visible
      const desktopNav = page.locator('nav a[href="/features"]').first();
      await expect(desktopNav).toBeVisible();

      // Resize to mobile
      await page.setViewportSize({ width: 375, height: 667 });

      // Wait for layout to adapt
      await page.waitForTimeout(500);

      // Mobile menu button should now be visible
      const menuButton = page.getByRole('button', { name: /toggle menu/i });
      await expect(menuButton).toBeVisible();
    });
  });

  test.describe('Touch Target Sizes', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should have appropriately sized touch targets', async ({ page }) => {
      await page.goto('/');

      // Scope to product UI regions to avoid framework/devtool controls injected in dev mode.
      const buttons = page.locator('header button, main button, footer button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible().catch(() => false);
        if (!isVisible) {
          continue;
        }

        const box = await button.boundingBox();
        if (box && box.width > 0 && box.height > 0) {
          expect(box.height).toBeGreaterThanOrEqual(44);
        }
      }
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      await page.goto('/transfer');

      // Mode buttons should have adequate spacing
      const localTab = page.getByRole('button', { name: /Select Local Network mode/i });
      const internetTab = page.getByRole('button', { name: /Select Internet P2P mode/i });

      const nearbyBox = await localTab.boundingBox();
      const internetBox = await internetTab.boundingBox();

      if (nearbyBox && internetBox) {
        // Should not overlap
        const noOverlap =
          nearbyBox.x + nearbyBox.width <= internetBox.x ||
          internetBox.x + internetBox.width <= nearbyBox.x ||
          nearbyBox.y + nearbyBox.height <= internetBox.y ||
          internetBox.y + internetBox.height <= nearbyBox.y;

        expect(noOverlap).toBeTruthy();
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle portrait orientation on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header')).toBeVisible();
    });

    test('should handle landscape orientation on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 667, height: 375 });
      await page.goto('/');

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('header')).toBeVisible();
    });
  });
});
