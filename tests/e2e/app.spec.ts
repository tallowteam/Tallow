import { test, expect } from '@playwright/test';

test.describe('App Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app');
  });

  test('loads app page', async ({ page }) => {
    await expect(page).toHaveURL(/\/app/);
  });

  test('shows send and receive mode options', async ({ page }) => {
    await expect(page.getByText(/send/i).first()).toBeVisible();
    await expect(page.getByText(/receive/i).first()).toBeVisible();
  });

  test('shows connection type options', async ({ page }) => {
    await expect(page.getByText(/local network/i).first()).toBeVisible();
    await expect(page.getByText(/internet p2p/i).first()).toBeVisible();
  });

  test('shows file selection area in send mode', async ({ page }) => {
    // Click send mode if available
    const sendBtn = page.getByText(/send/i).first();
    if (await sendBtn.isVisible()) {
      await sendBtn.click();
    }

    // Must select a connection type before file selector appears
    await page.getByText(/local network/i).first().click();

    // Should show file selection text from FileSelector component
    await expect(page.getByText(/select files|drop files/i).first()).toBeVisible();
  });

  test('shows connection code in receive mode', async ({ page }) => {
    // Click receive mode
    const receiveBtn = page.getByText(/receive/i).first();
    if (await receiveBtn.isVisible()) {
      await receiveBtn.click();
    }

    // Click internet P2P to see code
    await page.getByText(/internet p2p/i).first().click();

    // In receive mode with Internet P2P, the main panel shows "Ready" heading
    // or "Share this code" text, plus a connection code
    await expect(page.locator('main').getByText(/ready|share this code/i).first()).toBeVisible();
  });
});
