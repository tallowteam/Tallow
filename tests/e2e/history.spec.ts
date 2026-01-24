import { test, expect } from '@playwright/test';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/history');
  });

  test('loads history page', async ({ page }) => {
    await expect(page.getByText(/history/i).first()).toBeVisible();
  });

  test('shows empty state when no transfers', async ({ page }) => {
    // The empty state shows "No Transfer History" heading
    const emptyState = page.getByText(/no transfer history|will appear here/i).first();
    await expect(emptyState).toBeVisible();
  });
});
