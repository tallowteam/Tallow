import { test, expect } from './fixtures';

async function openTransferMode(page: import('@playwright/test').Page, mode: 'local' | 'internet' | 'friends') {
  await page.goto('/transfer');

  const modeButtonLabel =
    mode === 'local'
      ? /select local network mode/i
      : mode === 'internet'
        ? /select internet p2p mode/i
        : /select friends mode/i;

  await page.getByRole('button', { name: modeButtonLabel }).click();
}

test.describe('Transfer Network Resilience', () => {
  test('network profile: offline keeps transfer workspace interactive', async ({ page }) => {
    await openTransferMode(page, 'friends');
    await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible();

    await page.context().setOffline(true);

    const healthResult = await page.evaluate(async () => {
      try {
        await fetch('/api/health', { cache: 'no-store' });
        return 'reachable';
      } catch {
        return 'offline';
      }
    });

    expect(healthResult).toBe('offline');

    await page.getByRole('tab', { name: 'Settings' }).first().click();
    await expect(page.getByText(/device name, encryption preferences, and transfer configuration/i)).toBeVisible();

    await page.context().setOffline(false);
  });

  test('network profile: 3g-like latency preserves transfer mode transitions', async ({ page }) => {
    await page.route('**/api/health', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      await route.continue();
    });

    await openTransferMode(page, 'internet');
    await expect(page.getByRole('heading', { name: 'Share your connection' })).toBeVisible();

    const result = await page.evaluate(async () => {
      const start = performance.now();
      const response = await fetch('/api/health', { cache: 'no-store' });
      const elapsedMs = performance.now() - start;
      return {
        ok: response.ok,
        status: response.status,
        elapsedMs,
      };
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.elapsedMs).toBeGreaterThanOrEqual(1000);

    await page.getByRole('button', { name: 'Friends' }).click();
    await expect(page.getByRole('heading', { name: 'Friends', exact: true })).toBeVisible();
  });

  test('network profile: flaky requests recover without crashing transfer UI', async ({ page }) => {
    let requestCount = 0;
    await page.route('**/api/health', async (route) => {
      requestCount += 1;
      if (requestCount % 2 === 1) {
        await route.abort('failed');
        return;
      }
      await route.continue();
    });

    await openTransferMode(page, 'local');
    await expect(page.getByRole('heading', { name: 'Nearby Devices' })).toBeVisible();

    const outcomes = await page.evaluate(async () => {
      const values: string[] = [];
      for (let index = 0; index < 4; index += 1) {
        try {
          const response = await fetch('/api/health', { cache: 'no-store' });
          values.push(response.ok ? 'ok' : `http-${response.status}`);
        } catch {
          values.push('network-error');
        }
      }
      return values;
    });

    expect(outcomes).toContain('network-error');
    expect(outcomes.some((value) => value === 'ok' || value.startsWith('http-'))).toBe(true);

    await page.getByRole('tab', { name: 'Settings' }).first().click();
    await expect(page.getByText(/device name, encryption preferences, and transfer configuration/i)).toBeVisible();
  });
});
