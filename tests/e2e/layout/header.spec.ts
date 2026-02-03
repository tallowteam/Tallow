import { test, expect } from '@playwright/test';

test.describe('Header Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays logo and site name', async ({ page }) => {
    const logo = page.getByRole('link', { name: /tallow/i }).first();
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('Tallow');
  });

  test('displays all navigation links on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await expect(page.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Security' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  });

  test('displays CTA button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const ctaButton = page.getByRole('link', { name: 'Launch App' }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('hides navigation links on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Desktop nav should be hidden
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).toBeHidden();
  });

  test('shows mobile menu button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.getByLabel('Open menu');
    await expect(menuButton).toBeVisible();
  });

  test('opens mobile menu on button click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    const menuButton = page.getByLabel('Open menu');
    await menuButton.click();

    const mobileNav = page.getByRole('dialog', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
  });

  test('mobile menu displays navigation links', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByLabel('Open menu').click();

    const mobileNav = page.getByRole('dialog');
    await expect(mobileNav.getByRole('link', { name: 'Features' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'How It Works' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Security' })).toBeVisible();
    await expect(mobileNav.getByRole('link', { name: 'Privacy' })).toBeVisible();
  });

  test('closes mobile menu on close button click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByLabel('Open menu').click();

    const mobileNav = page.getByRole('dialog');
    await expect(mobileNav).toBeVisible();

    await page.getByLabel('Close menu').click();
    await expect(mobileNav).toBeHidden();
  });

  test('closes mobile menu on backdrop click', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByLabel('Open menu').click();

    const mobileNav = page.getByRole('dialog');
    await expect(mobileNav).toBeVisible();

    // Click backdrop
    await page.locator('[aria-hidden="true"]').click();
    await expect(mobileNav).toBeHidden();
  });

  test('closes mobile menu on navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByLabel('Open menu').click();

    const mobileNav = page.getByRole('dialog');
    await expect(mobileNav).toBeVisible();

    // Click a navigation link
    await mobileNav.getByRole('link', { name: 'Features' }).click();

    // Wait for navigation
    await page.waitForURL('**/features');

    // Menu should be closed (won't be visible on features page)
  });

  test('applies glassmorphism effect on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const header = page.locator('header').first();

    // Get initial state
    const initialBorder = await header.evaluate((el) =>
      getComputedStyle(el).borderBottomColor
    );

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 100));

    // Wait for transition
    await page.waitForTimeout(400);

    // Check that header has changed
    const scrolledBorder = await header.evaluate((el) =>
      getComputedStyle(el).borderBottomColor
    );

    // Border should be different after scroll
    expect(initialBorder).not.toBe(scrolledBorder);
  });

  test('highlights active navigation link', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Navigate to Features page
    await page.goto('/features');

    const featuresLink = page.getByRole('link', { name: 'Features' }).first();

    // Check if active link has different styling
    const backgroundColor = await featuresLink.evaluate((el) =>
      getComputedStyle(el).backgroundColor
    );

    // Active link should have background color
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  });

  test('is sticky on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    const header = page.locator('header').first();

    // Check sticky positioning
    const position = await header.evaluate((el) =>
      getComputedStyle(el).position
    );

    expect(position).toBe('sticky');

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));

    // Header should still be visible
    await expect(header).toBeVisible();
  });

  test('navigation links work correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.getByRole('link', { name: 'Features' }).first().click();
    await expect(page).toHaveURL(/.*features/);

    await page.getByRole('link', { name: 'Security' }).first().click();
    await expect(page).toHaveURL(/.*security/);
  });

  test('logo navigates to home', async ({ page }) => {
    await page.goto('/features');

    const logo = page.getByRole('link', { name: /tallow/i }).first();
    await logo.click();

    await expect(page).toHaveURL(/.*\/$/);
  });

  test('maintains accessibility on all viewports', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // All links should have accessible names
      const links = await page.getByRole('link').all();
      for (const link of links) {
        const accessibleName = await link.getAttribute('aria-label');
        const textContent = await link.textContent();
        expect(accessibleName || textContent).toBeTruthy();
      }
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.textContent);
    expect(focusedElement).toBeTruthy();
  });

  test('Escape key closes mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.getByLabel('Open menu').click();

    const mobileNav = page.getByRole('dialog');
    await expect(mobileNav).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(mobileNav).toBeHidden();
  });
});
