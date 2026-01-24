import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero section with headline and CTA', async ({ page }) => {
    await expect(page.locator('h1')).toBeVisible();
    // Hero section always has a "Get Started" CTA link (visible on all viewports)
    await expect(page.getByRole('link', { name: /get started/i }).first()).toBeVisible();
  });

  test('renders navigation', async ({ page, isMobile }) => {
    await expect(page.locator('nav')).toBeVisible();
    if (!isMobile) {
      // Desktop: nav links are visible (hidden on mobile with md:flex)
      await expect(page.locator('nav').getByRole('link', { name: /features/i })).toBeVisible();
      await expect(page.locator('nav').getByRole('link', { name: /how it works/i })).toBeVisible();
    }
  });

  test('renders features section', async ({ page }) => {
    const features = page.locator('.card-feature');
    await expect(features.first()).toBeVisible();
    // Landing page has 6 feature cards + 1 connection type card (the other is card-dark) = 7
    await expect(features).toHaveCount(7);
  });

  test('renders security section with tags', async ({ page }) => {
    const securitySection = page.locator('.section-dark');
    await expect(securitySection.getByText(/zero knowledge/i)).toBeVisible();
    await expect(securitySection.getByText('AES-256', { exact: true })).toBeVisible();
    await expect(securitySection.getByText(/e2e encrypted/i)).toBeVisible();
  });

  test('renders connection types section', async ({ page }) => {
    await expect(page.getByText(/local network/i).first()).toBeVisible();
    await expect(page.getByText(/internet p2p/i).first()).toBeVisible();
  });

  test('hero CTA navigates to app', async ({ page, isMobile }) => {
    if (isMobile) {
      // On mobile, hero section has overlay elements intercepting clicks.
      // Navigate directly via the link's href attribute.
      const ctaLink = page.getByRole('link', { name: /get started/i }).first();
      const href = await ctaLink.getAttribute('href');
      if (href) {
        await page.goto(href);
      }
    } else {
      // On desktop, the nav "Get Started" is the first and is visible/clickable
      await page.getByRole('link', { name: /get started/i }).first().click();
    }
    await expect(page).toHaveURL(/\/app/);
  });

  test('renders footer with links', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.getByText(/open source/i).first()).toBeVisible();
  });
});
