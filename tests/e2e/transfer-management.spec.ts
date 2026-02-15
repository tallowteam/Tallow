import { test, expect } from './fixtures';
import type { Page } from '@playwright/test';

async function openTransferManagement(page: Page) {
  await page.goto('/transfer');
  await page.getByRole('button', { name: /select local network mode/i }).click();
  await page.getByRole('tab', { name: 'Settings' }).first().click();
  await expect(page.getByTestId('transfer-management')).toBeVisible();
}

async function scheduleViaDialog(page: Page, options?: { repeat?: 'once' | 'daily' | 'weekly'; delayMs?: number }) {
  const repeat = options?.repeat ?? 'once';
  const delayMs = options?.delayMs ?? 120_000;

  await page.getByRole('button', { name: 'Schedule Transfer' }).first().click();
  await expect(page.getByRole('heading', { name: 'Schedule Transfer' })).toBeVisible();

  const scheduleDialog = page.locator('[class*="dialog"]').first();
  await expect(scheduleDialog).toBeVisible();

  const deviceSelect = scheduleDialog.locator('select').first();
  await deviceSelect.selectOption({ index: 1 });

  const scheduleValue = await page.evaluate((delay) => {
    const target = new Date(Date.now() + Number(delay));
    target.setSeconds(0, 0);
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${target.getFullYear()}-${pad(target.getMonth() + 1)}-${pad(target.getDate())}T${pad(target.getHours())}:${pad(target.getMinutes())}`;
  }, delayMs);

  const datetimeInput = scheduleDialog.locator('input[type="datetime-local"]');
  await datetimeInput.fill(scheduleValue);
  await expect(datetimeInput).toHaveValue(scheduleValue);

  if (repeat === 'daily') {
    await scheduleDialog.getByRole('button', { name: 'Daily' }).click();
  } else if (repeat === 'weekly') {
    await scheduleDialog.getByRole('button', { name: 'Weekly' }).click();
  }

  const submitButton = scheduleDialog.getByRole('button', { name: 'Schedule Transfer' });
  await expect(submitButton).toBeEnabled();
  await submitButton.click();
  await expect(page.locator('input[type="datetime-local"]')).toHaveCount(0);
}

test.describe('Transfer Management', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const projectName = testInfo.project.name.toLowerCase();
    test.skip(
      projectName.includes('mobile'),
      'Scheduling/template management E2E is validated on desktop projects.'
    );

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    await openTransferManagement(page);
  });

  test('complete scheduling flow schedules a transfer into active queue', async ({ page, fileHelpers }) => {
    const file = fileHelpers.createTextFile('complete-schedule-flow.txt', 'scheduled payload');
    await page.locator('input[type="file"]').setInputFiles(file);
    await expect(page.getByText('complete-schedule-flow.txt')).toBeVisible();

    await scheduleViaDialog(page);

    await expect(page.getByRole('heading', { name: /Active \(1\)/ })).toBeVisible();
    await expect(page.getByText(/1 file/i)).toBeVisible();
  });

  test('template creation and application updates active template state', async ({ page }) => {
    await page.getByRole('button', { name: /show templates/i }).click();
    await expect(page.getByRole('heading', { name: 'Transfer Templates' })).toBeVisible();

    const templateName = `E2E Template ${Date.now()}`;
    await page.getByRole('button', { name: 'Create Template' }).first().click();
    await page.locator('input[placeholder="e.g., Quick Share"]').fill(templateName);
    await page.locator('textarea[placeholder="Optional description..."]').fill('Template created during e2e run');
    await page.locator('select').last().selectOption('pqc');
    await page.getByRole('button', { name: 'Create Template' }).last().click();

    await expect(page.getByRole('heading', { name: templateName })).toBeVisible();
    const templateCard = page.locator('[class*="templateCard"]').filter({ hasText: templateName }).first();
    await templateCard.getByRole('button', { name: 'Apply Template' }).click();

    await expect(page.getByText('Active Template Settings:')).toBeVisible();
    await expect(page.getByText('Encryption: pqc')).toBeVisible();
  });

  test('scheduled transfer execution transitions to completed history entry', async ({ page, fileHelpers }) => {
    test.setTimeout(180_000);

    const file = fileHelpers.createTextFile('scheduled-runtime.txt', 'runtime execution payload');
    await page.locator('input[type="file"]').setInputFiles(file);
    await scheduleViaDialog(page, { delayMs: 70_000 });

    await expect(page.getByRole('heading', { name: /History \(1\)/ })).toBeVisible({ timeout: 150_000 });
    await expect(page.getByText('completed')).toBeVisible({ timeout: 150_000 });
  });

  test('cancel and delete operations remove scheduled transfers', async ({ page, fileHelpers }) => {
    const file = fileHelpers.createTextFile('cancel-delete.txt', 'cancel and delete');
    await page.locator('input[type="file"]').setInputFiles(file);
    await scheduleViaDialog(page, { delayMs: 600_000 });

    await expect(page.getByRole('heading', { name: /Active \(1\)/ })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).first().click();
    await expect(page.getByText('cancelled')).toBeVisible();

    await page.getByRole('button', { name: 'Delete' }).first().click();
    await expect(page.getByText('No Scheduled Transfers')).toBeVisible();
  });

  test('repeat scheduling keeps transfer active after execution window', async ({ page, fileHelpers }) => {
    test.setTimeout(240_000);

    const file = fileHelpers.createTextFile('daily-repeat.txt', 'daily repeat payload');
    await page.locator('input[type="file"]').setInputFiles(file);
    await scheduleViaDialog(page, { repeat: 'daily', delayMs: 70_000 });

    await expect(page.getByRole('heading', { name: /Active \(1\)/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/daily/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/in \d+h \d+m/).first()).toBeVisible({ timeout: 180_000 });
  });
});
