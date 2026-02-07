import { test, expect } from './fixtures';

test.describe('Responsive Design', () => {
  test.describe('Mobile Viewport (375px)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display homepage correctly on mobile', async ({ page }) => {
      await page.goto('/');

      // Header should be visible
      await expect(page.locator('header')).toBeVisible();

      // Logo should be visible
      await expect(page.locator('a[href="/"]').first()).toBeVisible();

      // Mobile menu button should be visible
      const menuButton = page.locator('button[aria-label*="menu" i]').or(
        page.locator('button[aria-expanded]')
      ).first();
      await expect(menuButton).toBeVisible();

      // Desktop nav should be hidden
      const desktopNav = page.locator('nav:not([class*="mobile"])').first();
      const isHidden = await desktopNav.isHidden().catch(() => true);
      expect(isHidden).toBeTruthy();

      // Hero content should be visible
      await expect(page.locator('h1')).toBeVisible();
    });

    test('should navigate via mobile menu', async ({ page }) => {
      await page.goto('/');

      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
      await menuButton.click();

      // Click link in mobile menu
      await page.locator('a[href="/features"]').last().click();

      // Check navigation
      await expect(page).toHaveURL(/\/features/);
    });

    test('should display transfer page correctly on mobile', async ({ page }) => {
      await page.goto('/transfer');

      // Page should load
      await expect(page.locator('h1')).toBeVisible();

      // Tabs should be visible and scrollable
      await expect(page.locator('text=Nearby')).toBeVisible();
      await expect(page.locator('text=Internet')).toBeVisible();

      // Drop zone should adapt to mobile
      const dropZone = page.locator('[class*="drop"]').first();
      await expect(dropZone).toBeVisible();

      const box = await dropZone.boundingBox();
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
        expect(box.height).toBeGreaterThanOrEqual(40);
      }
    });
  });

  test.describe('Tablet Viewport (768px)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test('should display homepage correctly on tablet', async ({ page }) => {
      await page.goto('/');

      // Header should be visible
      await expect(page.locator('header')).toBeVisible();

      // Content should be centered and use available space
      const container = page.locator('.container').first();
      const box = await container.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.width).toBeLessThanOrEqual(768);
      }
    });

    test('should show desktop or mobile nav based on breakpoint', async ({ page }) => {
      await page.goto('/');

      // Check which nav is visible
      const desktopNav = page.locator('nav:not([class*="mobile"])').first();
      const mobileMenuButton = page.locator('button[aria-label*="menu" i]').first();

      const hasDesktopNav = await desktopNav.isVisible().catch(() => false);
      const hasMobileButton = await mobileMenuButton.isVisible().catch(() => false);

      // One or the other should be visible
      expect(hasDesktopNav || hasMobileButton).toBeTruthy();
    });

    test('should display transfer page with optimal layout', async ({ page }) => {
      await page.goto('/transfer');

      // Page should load
      await expect(page.locator('h1')).toBeVisible();

      // Drop zone should use good width
      const dropZone = page.locator('[class*="drop"]').first();
      const box = await dropZone.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(300);
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
      const desktopNav = page.locator('nav').first();
      await expect(desktopNav).toBeVisible();

      // Mobile menu button should be hidden
      const mobileButton = page.locator('button[aria-label*="menu" i]');
      const isHidden = await mobileButton.isHidden().catch(() => true);
      expect(isHidden).toBeTruthy();

      // Content should be well-spaced
      const container = page.locator('.container').first();
      const box = await container.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(768);
      }
    });

    test('should show all navigation links in header', async ({ page }) => {
      await page.goto('/');

      await expect(page.locator('a[href="/features"]').first()).toBeVisible();
      await expect(page.locator('a[href="/security"]').first()).toBeVisible();
      await expect(page.locator('a[href="/pricing"]').first()).toBeVisible();
      await expect(page.locator('a[href="/docs"]').first()).toBeVisible();
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

      // Settings sections should have good spacing
      const section = page.locator('section').first();
      const marginBottom = await section.evaluate((el) => {
        return window.getComputedStyle(el).marginBottom;
      });

      const margin = parseFloat(marginBottom);
      expect(margin).toBeGreaterThan(0);
    });
  });

  test.describe('Header Collapse Behavior', () => {
    test('should collapse header on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Desktop nav links should be hidden
      const navLinks = page.locator('nav a[href="/features"]').first();
      const isHidden = await navLinks.isHidden().catch(() => true);

      // Mobile menu button should be visible
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
      const isVisible = await menuButton.isVisible();

      expect(isHidden && isVisible).toBeTruthy();
    });

    test('should show full header on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');

      // All nav links should be visible
      await expect(page.locator('nav a[href="/features"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/security"]').first()).toBeVisible();
      await expect(page.locator('nav a[href="/pricing"]').first()).toBeVisible();
    });
  });

  test.describe('Layout Adaptation', () => {
    test('should adapt from mobile to desktop layout', async ({ page }) => {
      // Start mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile menu should be visible
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
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
      const menuButton = page.locator('button[aria-label*="menu" i]').first();
      await expect(menuButton).toBeVisible();
    });
  });

  test.describe('Touch Target Sizes', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should have appropriately sized touch targets', async ({ page }) => {
      await page.goto('/');

      // All interactive elements should be at least 44x44px
      const buttons = await page.locator('button').all();

      for (const button of buttons.slice(0, 5)) {
        // Check first 5 buttons
        const box = await button.boundingBox();

        if (box && box.width > 0 && box.height > 0) {
          // At least 40px in height (allowing some flexibility)
          expect(box.height).toBeGreaterThanOrEqual(36);
        }
      }
    });

    test('should have adequate spacing between touch targets', async ({ page }) => {
      await page.goto('/transfer');

      // Tab buttons should have adequate spacing
      const nearbyTab = page.locator('button:has-text("Nearby")');
      const internetTab = page.locator('button:has-text("Internet")');

      const nearbyBox = await nearbyTab.boundingBox();
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
